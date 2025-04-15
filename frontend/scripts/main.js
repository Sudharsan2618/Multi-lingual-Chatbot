// Main Application Logic
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the WebRTC connection and UI controller
    const webrtc = new WebRTCConnection();
    const ui = new UIController();
    
    // Current conversation state
    let currentQuestion = '';
    let isListeningForQuestion = false;
    let recognizer = null;
  
    // Set up speech recognition
    function setupSpeechRecognition() {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Speech recognition is not supported in your browser. Try Chrome or Edge.');
        return null;
      }
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        console.log('Speech recognition started');
        ui.updateStatus('listening', 'Listening...');
        isListeningForQuestion = true;
      };
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        currentQuestion = transcript;
        ui.updateUserInput(transcript, false);
        
        // If we have a final result
        if (event.results[0].isFinal) {
          isListeningForQuestion = false;
          recognition.stop();
        }
      };
      
      recognition.onend = async () => {
        if (currentQuestion.trim() !== '') {
          ui.updateUserInput(currentQuestion, true);
          ui.updateStatus('processing', 'Processing your question...');
          
          // Process the question
          await processUserQuestion(currentQuestion);
          
          // Reset for next question
          currentQuestion = '';
        } else {
          ui.updateStatus('ready', 'Ready');
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        ui.updateStatus('error', `Speech recognition error: ${event.error}`);
        isListeningForQuestion = false;
      };
      
      return recognition;
    }
  
    // Process user question
    async function processUserQuestion(question) {
      ui.addUserMessage(question);
      
      // Initialize assistant response
      ui.startAssistantResponse();
      
      // Send the question to the WebRTC connection
      const success = await webrtc.askQuestion(question);
      
      if (!success) {
        ui.updateAssistantResponse("I'm sorry, there was an error processing your question. Please try again.");
        ui.finalizeAssistantResponse();
      }
    }

    // Handle text message
    async function handleTextMessage(message) {
      ui.addUserMessage(message);
      ui.startAssistantResponse();
      
      const success = await webrtc.askQuestion(message);
      
      if (!success) {
        ui.updateAssistantResponse("I'm sorry, there was an error processing your message. Please try again.");
        ui.finalizeAssistantResponse();
      }
    }
  
    // Initialize the UI
    ui.initialize(
      // onStart callback
      async () => {
        const connected = await webrtc.initialize();
        
        if (connected) {
          // Set up text event handler
          webrtc.onTextEvent = (text, isFinal) => {
            ui.updateAssistantResponse(text, isFinal);
            
            if (isFinal) {
              ui.finalizeAssistantResponse();
              ui.updateStatus('ready', 'Ready');
            }
          };
          
          // Set up status change handler
          webrtc.onStatusChange = (status, message) => {
            ui.updateStatus(status, message);
          };
          
          // Set up speech recognition
          recognizer = setupSpeechRecognition();
          
          return true;
        }
        
        return false;
      },
      // onStop callback
      () => {
        if (recognizer) {
          recognizer.stop();
        }
        
        isListeningForQuestion = false;
        webrtc.disconnect();
      },
      // onSendText callback
      async (message) => {
        await handleTextMessage(message);
      }
    );
  
    // Add microphone activation button
    ui.addMicButton(() => {
      if (recognizer && !isListeningForQuestion) {
        recognizer.start();
      }
    });
  });