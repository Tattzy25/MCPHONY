class VoiceChat {
    constructor() {
        this.voiceAnalyzer = null;
        this.translationService = null;
        this.speechRecognition = null;
        this.speechSynthesis = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.isConnected = false;
        this.friendId = null;
        this.myVoiceId = this.generateVoiceId();
        
        this.currentMessage = {
            original: '',
            translated: '',
            audioBlob: null,
            voiceCharacteristics: null
        };
        
        this.initializeApp();
    }
    
    generateVoiceId() {
        return 'VOICE-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    }
    
    async initializeApp() {
        this.showLoading('INITIALIZING VOICE SYSTEMS...');
        
        try {
            // Initialize services
            this.voiceAnalyzer = new VoiceAnalyzer();
            this.translationService = new TranslationService();
            
            // Initialize Web APIs
            await this.initializeSpeechRecognition();
            this.initializeSpeechSynthesis();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Hide loading screen
            setTimeout(() => {
                this.hideLoading();
                this.updateStatus('READY', 'ready');
                console.log('🚀 Voice Nexus initialized successfully');
            }, 2000);
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.hideLoading();
            this.updateStatus('ERROR', 'error');
        }
    }
    
    async initializeSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            throw new Error('Speech Recognition not supported');
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.speechRecognition = new SpeechRecognition();
        
        this.speechRecognition.continuous = false;
        this.speechRecognition.interimResults = false;
        this.speechRecognition.lang = 'en-US';
        
        this.speechRecognition.onstart = () => {
            console.log('🎤 Speech recognition started');
            this.updateStatus('LISTENING', 'listening');
        };
        
        this.speechRecognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('📝 Speech recognized:', transcript);
            this.processSpeechResult(transcript);
        };
        
        this.speechRecognition.onerror = (event) => {
            console.error('❌ Speech recognition error:', event.error);
            this.stopVoiceInput();
            this.updateStatus('ERROR', 'error');
        };
        
        this.speechRecognition.onend = () => {
            console.log('🛑 Speech recognition ended');
            this.stopVoiceInput();
        };
    }
    
    initializeSpeechSynthesis() {
        if (!('speechSynthesis' in window)) {
            throw new Error('Speech Synthesis not supported');
        }
        
        this.speechSynthesis = window.speechSynthesis;
        console.log('🔊 Speech synthesis initialized');
    }
    
    setupEventListeners() {
        // Voice activation button
        const voiceBtn = document.getElementById('startVoiceBtn');
        voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
        
        // Control buttons
        document.getElementById('playbackBtn').addEventListener('click', () => this.playback());
        document.getElementById('sendBtn').addEventListener('click', () => this.sendToFriend());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearMessage());
        
        // Friend connection
        document.getElementById('connectBtn').addEventListener('click', () => this.connectToFriend());
        document.getElementById('playIncomingBtn').addEventListener('click', () => this.playIncomingMessage());
        
        // Language change
        document.getElementById('targetLanguage').addEventListener('change', () => this.onLanguageChange());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' && e.ctrlKey) {
                e.preventDefault();
                this.toggleVoiceInput();
            }
        });
    }
    
    async toggleVoiceInput() {
        if (this.isRecording) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput();
        }
    }
    
    async startVoiceInput() {
        if (this.isRecording) return;
        
        try {
            this.isRecording = true;
            this.updateVoiceButton(true);
            this.updateStatus('ANALYZING', 'analyzing');
            
            // Start voice analysis
            const stream = await this.voiceAnalyzer.startAnalysis();
            
            // Setup media recorder for audio capture
            this.recordedChunks = [];
            this.mediaRecorder = new MediaRecorder(stream);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
                this.currentMessage.audioBlob = audioBlob;
                console.log('🎵 Audio recorded successfully');
            };
            
            this.mediaRecorder.start();
            
            // Start speech recognition
            this.speechRecognition.start();
            
        } catch (error) {
            console.error('❌ Failed to start voice input:', error);
            this.stopVoiceInput();
            this.updateStatus('ERROR', 'error');
            alert('Microphone access is required for voice chat functionality.');
        }
    }
    
    stopVoiceInput() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        this.updateVoiceButton(false);
        
        // Stop voice analysis
        if (this.voiceAnalyzer) {
            this.voiceAnalyzer.stopAnalysis();
        }
        
        // Stop media recorder
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        // Stop speech recognition
        if (this.speechRecognition) {
            this.speechRecognition.abort();
        }
        
        this.updateStatus('PROCESSING', 'processing');
    }
    
    async processSpeechResult(transcript) {
        this.currentMessage.original = transcript;
        this.currentMessage.voiceCharacteristics = this.voiceAnalyzer.getVoiceCharacteristics();
        
        // Update original text display
        document.getElementById('originalText').textContent = transcript;
        
        // Translate the text
        const targetLang = document.getElementById('targetLanguage').value;
        this.updateStatus('TRANSLATING', 'translating');
        
        try {
            const translationResult = await this.translationService.translateText(
                transcript, 
                targetLang
            );
            
            this.currentMessage.translated = translationResult.translatedText;
            
            // Update translated text display
            document.getElementById('translatedText').textContent = translationResult.translatedText;
            
            // Enable action buttons
            document.getElementById('playbackBtn').disabled = false;
            document.getElementById('sendBtn').disabled = this.currentMessage.translated === '';
            
            this.updateStatus('COMPLETE', 'ready');
            console.log('✅ Message processed successfully');
            
        } catch (error) {
            console.error('❌ Translation failed:', error);
            this.updateStatus('TRANSLATION ERROR', 'error');
        }
    }
    
    async playback() {
        if (!this.currentMessage.translated) {
            console.warn('⚠️ No message to play back');
            return;
        }
        
        const targetLang = document.getElementById('targetLanguage').value;
        const voices = this.speechSynthesis.getVoices();
        
        // Find appropriate voice for target language
        let selectedVoice = voices.find(voice => voice.lang.startsWith(targetLang));
        if (!selectedVoice) {
            selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
        }
        
        const utterance = new SpeechSynthesisUtterance(this.currentMessage.translated);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        
        // Adjust voice based on detected characteristics
        if (this.currentMessage.voiceCharacteristics) {
            const characteristics = this.currentMessage.voiceCharacteristics;
            
            // Adjust pitch based on original speaker
            if (characteristics.gender === 'female') {
                utterance.pitch = 1.2;
            } else if (characteristics.gender === 'male') {
                utterance.pitch = 0.8;
            }
            
            // Adjust rate and volume
            utterance.rate = 1.0;
            utterance.volume = 0.9;
        }
        
        this.updateStatus('PLAYING', 'playing');
        
        utterance.onend = () => {
            this.updateStatus('READY', 'ready');
            console.log('🔊 Playback completed');
        };
        
        utterance.onerror = (error) => {
            console.error('❌ Playback failed:', error);
            this.updateStatus('PLAYBACK ERROR', 'error');
        };
        
        this.speechSynthesis.speak(utterance);
    }
    
    async connectToFriend() {
        const friendIdInput = document.getElementById('friendId');
        const friendId = friendIdInput.value.trim();
        
        if (!friendId) {
            alert('Please enter a Friend\'s Voice ID');
            return;
        }
        
        // Simulate connection (in real app, would connect to server)
        this.updateStatus('CONNECTING', 'connecting');
        
        setTimeout(() => {
            this.isConnected = true;
            this.friendId = friendId;
            
            // Update connection UI
            const indicator = document.getElementById('connectionIndicator');
            const text = document.getElementById('connectionText');
            
            indicator.classList.add('connected');
            text.textContent = `CONNECTED TO ${friendId}`;
            
            this.updateStatus('CONNECTED', 'connected');
            
            // Show user's Voice ID for sharing
            alert(`Your Voice ID: ${this.myVoiceId}\nShare this with your friend!`);
            
            // Simulate incoming message after a delay
            setTimeout(() => {
                this.simulateIncomingMessage();
            }, 5000);
            
            console.log(`🔗 Connected to friend: ${friendId}`);
        }, 2000);
    }
    
    async sendToFriend() {
        if (!this.isConnected) {
            alert('Connect to a friend first!');
            return;
        }
        
        if (!this.currentMessage.translated) {
            alert('No message to send!');
            return;
        }
        
        this.updateStatus('SENDING', 'sending');
        
        // Simulate sending message
        setTimeout(() => {
            this.updateStatus('MESSAGE SENT', 'sent');
            console.log(`📤 Message sent to ${this.friendId}`);
            
            // Reset status after delay
            setTimeout(() => {
                this.updateStatus('READY', 'ready');
            }, 2000);
        }, 1500);
    }
    
    simulateIncomingMessage() {
        const messages = [
            'Hello! How are you doing today?',
            'Nice to connect with you!',
            'The weather is beautiful here.',
            'What are you up to?',
            'Thanks for the message!'
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        // Show incoming panel
        const incomingPanel = document.getElementById('incomingPanel');
        const incomingText = document.getElementById('incomingText');
        
        incomingText.textContent = randomMessage;
        incomingPanel.style.display = 'block';
        
        this.updateStatus('INCOMING MESSAGE', 'incoming');
        
        console.log('📥 Incoming message received');
    }
    
    async playIncomingMessage() {
        const incomingText = document.getElementById('incomingText').textContent;
        
        if (!incomingText) return;
        
        const utterance = new SpeechSynthesisUtterance(incomingText);
        
        // Use different voice characteristics for incoming message
        utterance.pitch = 1.1;
        utterance.rate = 0.9;
        utterance.volume = 0.8;
        
        this.updateStatus('PLAYING INCOMING', 'playing');
        
        utterance.onend = () => {
            this.updateStatus('READY', 'ready');
        };
        
        this.speechSynthesis.speak(utterance);
    }
    
    clearMessage() {
        this.currentMessage = {
            original: '',
            translated: '',
            audioBlob: null,
            voiceCharacteristics: null
        };
        
        // Clear displays
        document.getElementById('originalText').textContent = 'Voice input will appear here...';
        document.getElementById('translatedText').textContent = 'Translation will appear here...';
        
        // Disable buttons
        document.getElementById('playbackBtn').disabled = true;
        document.getElementById('sendBtn').disabled = true;
        
        // Hide incoming panel
        document.getElementById('incomingPanel').style.display = 'none';
        
        this.updateStatus('CLEARED', 'ready');
        
        setTimeout(() => {
            this.updateStatus('READY', 'ready');
        }, 1000);
        
        console.log('🗑️ Message cleared');
    }
    
    onLanguageChange() {
        const targetLang = document.getElementById('targetLanguage').value;
        console.log(`🌐 Target language changed to: ${targetLang}`);
        
        // Re-translate if there's a current message
        if (this.currentMessage.original) {
            this.translateCurrentMessage();
        }
    }
    
    async translateCurrentMessage() {
        if (!this.currentMessage.original) return;
        
        const targetLang = document.getElementById('targetLanguage').value;
        this.updateStatus('RETRANSLATING', 'translating');
        
        try {
            const translationResult = await this.translationService.translateText(
                this.currentMessage.original, 
                targetLang
            );
            
            this.currentMessage.translated = translationResult.translatedText;
            document.getElementById('translatedText').textContent = translationResult.translatedText;
            
            this.updateStatus('READY', 'ready');
            
        } catch (error) {
            console.error('❌ Re-translation failed:', error);
            this.updateStatus('TRANSLATION ERROR', 'error');
        }
    }
    
    updateVoiceButton(isRecording) {
        const button = document.getElementById('startVoiceBtn');
        const span = button.querySelector('span');
        
        if (isRecording) {
            button.classList.add('recording');
            span.textContent = 'STOP RECORDING';
        } else {
            button.classList.remove('recording');
            span.textContent = 'VOICE ACTIVATE';
        }
    }
    
    updateStatus(text, type) {
        const statusText = document.getElementById('statusText');
        const statusDot = document.getElementById('statusDot');
        
        statusText.textContent = text;
        
        // Update dot color based on status type
        statusDot.className = 'status-dot';
        switch (type) {
            case 'ready':
                statusDot.style.background = '#00ff00';
                statusDot.style.boxShadow = '0 0 15px #00ff00';
                break;
            case 'listening':
            case 'recording':
                statusDot.style.background = '#ffff00';
                statusDot.style.boxShadow = '0 0 15px #ffff00';
                break;
            case 'processing':
            case 'translating':
                statusDot.style.background = '#0066ff';
                statusDot.style.boxShadow = '0 0 15px #0066ff';
                break;
            case 'error':
                statusDot.style.background = '#ff0000';
                statusDot.style.boxShadow = '0 0 15px #ff0000';
                break;
            case 'connected':
                statusDot.style.background = '#00ffff';
                statusDot.style.boxShadow = '0 0 15px #00ffff';
                break;
            case 'incoming':
                statusDot.style.background = '#ff6600';
                statusDot.style.boxShadow = '0 0 15px #ff6600';
                break;
        }
    }
    
    showLoading(text) {
        const overlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        
        loadingText.textContent = text;
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
    }
    
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.opacity = '0';
        
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 500);
    }
}

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.voiceChat = new VoiceChat();
});
