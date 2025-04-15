// UI Controller
class UIController {
    constructor() {
      this.startBtn = document.getElementById('startBtn');
      this.stopBtn = document.getElementById('stopBtn');
      this.statusIndicator = document.getElementById('statusIndicator');
      this.statusText = document.getElementById('statusText');
      this.transcript = document.getElementById('transcript');
      this.textInput = document.getElementById('textInput');
      this.sendTextBtn = document.getElementById('sendTextBtn');
      this.isRecording = false;
      this.currentMessageElement = null;
    }
  
    initialize(onStart, onStop, onSendText) {
      this.startBtn.addEventListener('click', async () => {
        this.updateStatus('connecting', 'Connecting...');
        this.startBtn.disabled = true;
        
        const success = await onStart();
        if (success) {
          this.isRecording = true;
          this.stopBtn.disabled = false;
          this.sendTextBtn.disabled = false;
        } else {
          this.startBtn.disabled = false;
          this.updateStatus('error', 'Connection failed');
        }
      });
  
      this.stopBtn.addEventListener('click', () => {
        onStop();
        this.isRecording = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.sendTextBtn.disabled = true;
        this.updateStatus('ready', 'Ready');
      });

      // Add text input handling
      this.textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendTextMessage(onSendText);
        }
      });

      this.sendTextBtn.addEventListener('click', () => {
        this.sendTextMessage(onSendText);
      });
    }

    sendTextMessage(onSendText) {
      const message = this.textInput.value.trim();
      if (message && this.isRecording) {
        onSendText(message);
        this.textInput.value = '';
      }
    }
  
    updateStatus(status, message) {
      this.statusIndicator.className = 'status';
      this.statusText.textContent = message || '';
      
      if (status === 'connecting') {
        this.statusIndicator.classList.add('connecting');
      } else if (status === 'connected' || status === 'ready') {
        this.statusIndicator.classList.add('active');
      } else if (status === 'error') {
        this.statusIndicator.classList.add('error');
      } else if (status === 'listening') {
        this.statusIndicator.classList.add('active');
        this.statusIndicator.classList.add('listening');
      } else if (status === 'processing') {
        this.statusIndicator.classList.add('active');
        this.statusIndicator.classList.add('processing');
      }
    }
  
    addUserMessage(text) {
      const messageElement = document.createElement('div');
      messageElement.className = 'user-message';
      messageElement.textContent = text;
      this.transcript.appendChild(messageElement);
      this.transcript.scrollTop = this.transcript.scrollHeight;
    }
  
    startAssistantResponse() {
      this.currentMessageElement = document.createElement('div');
      this.currentMessageElement.className = 'assistant-message';
      this.transcript.appendChild(this.currentMessageElement);
    }
  
    updateAssistantResponse(text, isFinal) {
      if (!this.currentMessageElement) {
        this.startAssistantResponse();
      }
      
      this.currentMessageElement.textContent = text;
      this.transcript.scrollTop = this.transcript.scrollHeight;
    }
  
    finalizeAssistantResponse() {
      this.currentMessageElement = null;
    }
  
    updateUserInput(text, isFinal) {
      // Update UI with the current speech recognition text
      const inputStatus = document.createElement('div');
      inputStatus.className = 'input-status';
      
      if (isFinal) {
        inputStatus.textContent = `Question: ${text}`;
      } else {
        inputStatus.textContent = `Listening: ${text}`;
        inputStatus.classList.add('listening');
      }
      
      // Remove previous input status elements
      const previousStatus = document.querySelector('.input-status');
      if (previousStatus) {
        previousStatus.remove();
      }
      
      // Add new status before the transcript
      this.transcript.parentNode.insertBefore(inputStatus, this.transcript);
    }
  
    addMicButton(onMicClick) {
      // Create microphone button if it doesn't exist
      if (!document.getElementById('micBtn')) {
        const micBtn = document.createElement('button');
        micBtn.id = 'micBtn';
        micBtn.className = 'btn mic-btn';
        micBtn.innerHTML = '<span class="mic-icon">🎤</span> Ask a Question';
        micBtn.disabled = true;
        
        // Add button to the controls
        const controls = document.querySelector('.controls');
        controls.appendChild(micBtn);
        
        // Add event listener
        micBtn.addEventListener('click', onMicClick);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
          .mic-btn {
            background-color: #2196F3;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
          }
          .mic-icon {
            font-size: 1.2em;
          }
          .input-status {
            margin-bottom: 10px;
            padding: 5px;
            font-style: italic;
            color: #666;
          }
          .input-status.listening {
            color: #2196F3;
          }
        `;
        document.head.appendChild(style);
        
        // Enable the mic button when the connection is ready
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'class' &&
                this.statusIndicator.classList.contains('active')) {
              micBtn.disabled = false;
            } else if (mutation.type === 'attributes' && 
                      mutation.attributeName === 'class' &&
                      !this.statusIndicator.classList.contains('active')) {
              micBtn.disabled = true;
            }
          });
        });
        
        observer.observe(this.statusIndicator, { attributes: true });
      }
    }
  }