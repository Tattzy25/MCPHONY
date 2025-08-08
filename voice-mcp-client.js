/**
 * VoiceChat Network - MCP Integration
 * Real-time voice messaging through MCP servers
 */

class VoiceChatNetwork {
    constructor() {
        this.isInitialized = false;
        this.isRecording = false;
        this.isConnected = false;
        this.currentUserId = null;
        this.connectedFriendId = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recognition = null;
        
        // Voice analysis
        this.voiceAnalyzer = null;
        this.translationService = null;
        
        // Current message data
        this.currentMessage = {
            original: '',
            translated: '',
            audioBlob: null,
            timestamp: null
        };
        
        // Initialize the app
        this.initializeApp();
    }
    
    async initializeApp() {
        console.log('🚀 Initializing VoiceChat Network...');
        this.showStatus('Initializing...', 'loading');
        
        try {
            // Initialize voice services
            await this.initializeVoiceServices();
            
            // Initialize MCP database connection
            await this.initializeMCPConnection();
            
            // Generate or retrieve user ID
            await this.initializeUser();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Mark as initialized
            this.isInitialized = true;
            this.showStatus('Ready', 'success');
            
            console.log('✅ VoiceChat Network initialized successfully');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.showStatus('Connection Failed', 'error');
            
            // Show fallback message
            this.showFallbackMessage();
        }
    }
    
    async initializeVoiceServices() {
        // Initialize voice analyzer and translation service
        this.voiceAnalyzer = new VoiceAnalyzer();
        this.translationService = new TranslationService();
        
        // Initialize Web Speech API
        await this.initializeSpeechRecognition();
        
        console.log('🎤 Voice services initialized');
    }
    
    async initializeSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            throw new Error('Speech Recognition not supported in this browser');
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        
        this.recognition.onstart = () => {
            console.log('🎤 Speech recognition started');
            this.showStatus('Listening...', 'listening');
        };
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('📝 Speech recognized:', transcript);
            this.handleSpeechResult(transcript);
        };
        
        this.recognition.onerror = (event) => {
            console.error('❌ Speech recognition error:', event.error);
            this.stopRecording();
            this.showStatus('Recognition Error', 'error');
        };
        
        this.recognition.onend = () => {
            console.log('🛑 Speech recognition ended');
            this.stopRecording();
        };
    }
    
    async initializeMCPConnection() {
        // Check if MCP servers are available
        if (typeof use_mcp_tool === 'undefined') {
            console.warn('⚠️ MCP tools not available - running in simulation mode');
            this.mcpAvailable = false;
            return;
        }
        
        this.mcpAvailable = true;
        
        try {
            // Test MCP connection by listing projects
            const response = await this.mcpQuery('list_projects', { params: { limit: 1 } });
            console.log('✅ MCP connection established');
            
            // Initialize database schema if needed
            await this.initializeDatabase();
            
        } catch (error) {
            console.warn('⚠️ MCP connection failed, running in simulation mode:', error);
            this.mcpAvailable = false;
        }
    }
    
    async initializeDatabase() {
        console.log('📊 Initializing voice chat database schema...');
        
        try {
            // Get the first available project
            const projectsResponse = await this.mcpQuery('list_projects', { params: { limit: 1 } });
            
            if (!projectsResponse.projects || projectsResponse.projects.length === 0) {
                throw new Error('No Neon projects available');
            }
            
            this.projectId = projectsResponse.projects[0].id;
            console.log('🗄️ Using project:', this.projectId);
            
            // Create tables for voice chat
            await this.createVoiceChatTables();
            
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }
    
    async createVoiceChatTables() {
        const createTablesSQL = [
            `CREATE TABLE IF NOT EXISTS voice_users (
                id VARCHAR(50) PRIMARY KEY,
                username VARCHAR(100) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                voice_signature JSONB
            )`,
            
            `CREATE TABLE IF NOT EXISTS voice_messages (
                id SERIAL PRIMARY KEY,
                sender_id VARCHAR(50) REFERENCES voice_users(id),
                recipient_id VARCHAR(50) REFERENCES voice_users(id),
                original_text TEXT,
                translated_text TEXT,
                language_from VARCHAR(10),
                language_to VARCHAR(10),
                audio_blob_url TEXT,
                voice_characteristics JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                read_at TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS friend_connections (
                id SERIAL PRIMARY KEY,
                user1_id VARCHAR(50) REFERENCES voice_users(id),
                user2_id VARCHAR(50) REFERENCES voice_users(id),
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user1_id, user2_id)
            )`,
            
            `CREATE INDEX IF NOT EXISTS idx_voice_messages_recipient 
             ON voice_messages(recipient_id, created_at)`,
             
            `CREATE INDEX IF NOT EXISTS idx_friend_connections_users 
             ON friend_connections(user1_id, user2_id)`
        ];
        
        for (const sql of createTablesSQL) {
            try {
                await this.mcpQuery('run_sql', {
                    params: {
                        sql: sql,
                        projectId: this.projectId
                    }
                });
            } catch (error) {
                console.warn('⚠️ Table creation SQL failed (might already exist):', error.message);
            }
        }
        
        console.log('✅ Voice chat database schema ready');
    }
    
    async initializeUser() {
        // Get user ID from localStorage or generate new one
        this.currentUserId = localStorage.getItem('voiceChat_userId');
        
        if (!this.currentUserId) {
            this.currentUserId = 'VC_' + Math.random().toString(36).substr(2, 12).toUpperCase();
            localStorage.setItem('voiceChat_userId', this.currentUserId);
        }
        
        // Display user ID
        document.getElementById('userVoiceId').textContent = this.currentUserId;
        
        // Register or update user in database
        if (this.mcpAvailable) {
            await this.registerUser();
        }
        
        console.log('👤 User initialized:', this.currentUserId);
    }
    
    async registerUser() {
        try {
            const sql = `
                INSERT INTO voice_users (id, username, last_active) 
                VALUES ($1, $2, CURRENT_TIMESTAMP)
                ON CONFLICT (id) 
                DO UPDATE SET last_active = CURRENT_TIMESTAMP
            `;
            
            await this.mcpQuery('run_sql', {
                params: {
                    sql: sql.replace('$1', `'${this.currentUserId}'`).replace('$2', `'User_${this.currentUserId.slice(-6)}'`),
                    projectId: this.projectId
                }
            });
            
            console.log('✅ User registered in database');
            
        } catch (error) {
            console.warn('⚠️ User registration failed:', error);
        }
    }
    
    setupEventListeners() {
        // Voice button - mobile friendly with touch events
        const voiceButton = document.getElementById('voiceButton');
        
        // Mouse events for desktop
        voiceButton.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.startRecording();
        });
        
        voiceButton.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.stopRecording();
        });
        
        // Touch events for mobile
        voiceButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startRecording();
        });
        
        voiceButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopRecording();
        });
        
        // Prevent context menu
        voiceButton.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Control buttons
        document.getElementById('playButton').addEventListener('click', () => this.playCurrentMessage());
        document.getElementById('clearButton').addEventListener('click', () => this.clearMessage());
        document.getElementById('connectButton').addEventListener('click', () => this.connectToFriend());
        document.getElementById('sendButton').addEventListener('click', () => this.sendVoiceMessage());
        
        // Incoming message buttons
        document.getElementById('playIncomingButton').addEventListener('click', () => this.playIncomingMessage());
        document.getElementById('replyButton').addEventListener('click', () => this.replyToMessage());
        
        // Language change
        document.getElementById('outputLanguage').addEventListener('change', () => this.onLanguageChange());
        
        // Auto-check for new messages
        setInterval(() => this.checkForNewMessages(), 3000);
    }
    
    async startRecording() {
        if (this.isRecording || !this.isInitialized) return;
        
        console.log('🔴 Starting voice recording...');
        this.isRecording = true;
        
        // Update UI
        const voiceButton = document.getElementById('voiceButton');
        voiceButton.classList.add('recording');
        voiceButton.innerHTML = '<div class="mic-icon">🛑</div><span>Release to Stop</span>';
        
        try {
            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });
            
            // Start voice analysis
            if (this.voiceAnalyzer) {
                await this.voiceAnalyzer.startAnalysis(stream);
            }
            
            // Setup media recorder
            this.audioChunks = [];
            this.mediaRecorder = new MediaRecorder(stream);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.currentMessage.audioBlob = audioBlob;
                this.currentMessage.timestamp = new Date();
                console.log('🎵 Audio recorded successfully');
            };
            
            this.mediaRecorder.start();
            
            // Start speech recognition
            this.recognition.start();
            
        } catch (error) {
            console.error('❌ Recording failed:', error);
            this.stopRecording();
            alert('Microphone access is required for voice chat. Please enable microphone permissions.');
        }
    }
    
    stopRecording() {
        if (!this.isRecording) return;
        
        console.log('⏹️ Stopping voice recording...');
        this.isRecording = false;
        
        // Update UI
        const voiceButton = document.getElementById('voiceButton');
        voiceButton.classList.remove('recording');
        voiceButton.innerHTML = '<div class="mic-icon">🎤</div><span>Hold to Talk</span>';
        
        // Stop voice analysis
        if (this.voiceAnalyzer) {
            this.voiceAnalyzer.stopAnalysis();
        }
        
        // Stop media recorder
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        // Stop speech recognition
        if (this.recognition) {
            this.recognition.abort();
        }
        
        this.showStatus('Processing...', 'processing');
    }
    
    async handleSpeechResult(transcript) {
        this.currentMessage.original = transcript;
        
        // Update UI
        document.getElementById('originalMessage').textContent = transcript;
        document.getElementById('originalMessage').classList.remove('empty');
        
        // Get voice characteristics
        if (this.voiceAnalyzer) {
            const characteristics = this.voiceAnalyzer.getVoiceCharacteristics();
            this.updateVoiceAnalysis(characteristics);
        }
        
        // Translate the message
        await this.translateMessage();
        
        // Enable control buttons
        document.getElementById('playButton').disabled = false;
        
        // Enable send button if connected
        if (this.isConnected) {
            document.getElementById('sendButton').disabled = false;
        }
        
        this.showStatus('Message Ready', 'success');
    }
    
    async translateMessage() {
        const targetLang = document.getElementById('outputLanguage').value;
        
        this.showStatus('Translating...', 'processing');
        
        try {
            const result = await this.translationService.translateText(
                this.currentMessage.original,
                targetLang
            );
            
            this.currentMessage.translated = result.translatedText;
            
            // Update UI
            document.getElementById('translatedMessage').textContent = result.translatedText;
            document.getElementById('translatedMessage').classList.remove('empty');
            
            this.showStatus('Translation Complete', 'success');
            
        } catch (error) {
            console.error('❌ Translation failed:', error);
            this.showStatus('Translation Error', 'error');
        }
    }
    
    updateVoiceAnalysis(characteristics) {
        document.getElementById('languageValue').textContent = characteristics.language || 'EN';
        document.getElementById('genderValue').textContent = characteristics.gender || 'Unknown';
        document.getElementById('pitchValue').textContent = characteristics.pitch || 'Medium';
        document.getElementById('confidenceValue').textContent = `${Math.round(characteristics.confidence || 85)}%`;
    }
    
    async playCurrentMessage() {
        if (!this.currentMessage.translated) {
            alert('No message to play');
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(this.currentMessage.translated);
        const targetLang = document.getElementById('outputLanguage').value;
        
        // Find appropriate voice
        const voices = speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.startsWith(targetLang)) || voices[0];
        if (voice) utterance.voice = voice;
        
        utterance.rate = 0.9;
        utterance.volume = 0.8;
        
        this.showStatus('Playing...', 'playing');
        
        utterance.onend = () => {
            this.showStatus('Ready', 'success');
        };
        
        speechSynthesis.speak(utterance);
    }
    
    clearMessage() {
        this.currentMessage = {
            original: '',
            translated: '',
            audioBlob: null,
            timestamp: null
        };
        
        // Reset UI
        document.getElementById('originalMessage').textContent = 'Tap and hold the voice button to record...';
        document.getElementById('originalMessage').classList.add('empty');
        document.getElementById('translatedMessage').textContent = 'Translation will appear here...';
        document.getElementById('translatedMessage').classList.add('empty');
        
        // Reset voice analysis
        document.getElementById('languageValue').textContent = '—';
        document.getElementById('genderValue').textContent = '—';
        document.getElementById('pitchValue').textContent = '—';
        document.getElementById('confidenceValue').textContent = '—';
        
        // Disable buttons
        document.getElementById('playButton').disabled = true;
        document.getElementById('sendButton').disabled = true;
        
        // Hide incoming panel
        document.getElementById('incomingPanel').style.display = 'none';
        
        this.showStatus('Ready', 'success');
    }
    
    async connectToFriend() {
        const friendId = document.getElementById('friendIdInput').value.trim();
        
        if (!friendId) {
            alert('Please enter a friend\'s Voice ID');
            return;
        }
        
        if (friendId === this.currentUserId) {
            alert('You cannot connect to yourself!');
            return;
        }
        
        this.showStatus('Connecting...', 'connecting');
        
        try {
            if (this.mcpAvailable) {
                // Check if friend exists in database
                const checkUserSQL = `SELECT id FROM voice_users WHERE id = '${friendId}'`;
                const userCheck = await this.mcpQuery('run_sql', {
                    params: {
                        sql: checkUserSQL,
                        projectId: this.projectId
                    }
                });
                
                if (!userCheck.rows || userCheck.rows.length === 0) {
                    alert('Friend not found. Make sure they have used VoiceChat Network.');
                    this.showStatus('Ready', 'success');
                    return;
                }
                
                // Create friend connection
                const connectionSQL = `
                    INSERT INTO friend_connections (user1_id, user2_id, status) 
                    VALUES ('${this.currentUserId}', '${friendId}', 'connected')
                    ON CONFLICT (user1_id, user2_id) 
                    DO UPDATE SET status = 'connected'
                `;
                
                await this.mcpQuery('run_sql', {
                    params: {
                        sql: connectionSQL,
                        projectId: this.projectId
                    }
                });
            }
            
            // Update connection state
            this.isConnected = true;
            this.connectedFriendId = friendId;
            
            // Update UI
            const statusEl = document.getElementById('connectionStatus');
            statusEl.classList.remove('disconnected');
            statusEl.classList.add('connected');
            statusEl.innerHTML = `<div class="status-dot"></div><span>Connected to ${friendId}</span>`;
            
            // Enable send button if we have a message
            if (this.currentMessage.translated) {
                document.getElementById('sendButton').disabled = false;
            }
            
            this.showStatus('Connected', 'success');
            console.log(`🔗 Connected to friend: ${friendId}`);
            
        } catch (error) {
            console.error('❌ Connection failed:', error);
            this.showStatus('Connection Failed', 'error');
            alert('Failed to connect to friend. Please try again.');
        }
    }
    
    async sendVoiceMessage() {
        if (!this.isConnected || !this.currentMessage.translated) {
            alert('Connect to a friend and record a message first!');
            return;
        }
        
        this.showStatus('Sending...', 'sending');
        
        try {
            if (this.mcpAvailable) {
                // Insert message into database
                const messageSQL = `
                    INSERT INTO voice_messages (
                        sender_id, recipient_id, original_text, translated_text,
                        language_from, language_to, voice_characteristics, created_at
                    ) VALUES (
                        '${this.currentUserId}', '${this.connectedFriendId}',
                        '${this.currentMessage.original.replace(/'/g, "''")}',
                        '${this.currentMessage.translated.replace(/'/g, "''")}',
                        'en', '${document.getElementById('outputLanguage').value}',
                        '{}', CURRENT_TIMESTAMP
                    )
                `;
                
                await this.mcpQuery('run_sql', {
                    params: {
                        sql: messageSQL,
                        projectId: this.projectId
                    }
                });
                
                console.log('📤 Message sent to database');
            }
            
            this.showStatus('Message Sent!', 'success');
            
            // Auto-clear after a delay
            setTimeout(() => {
                this.clearMessage();
            }, 2000);
            
        } catch (error) {
            console.error('❌ Failed to send message:', error);
            this.showStatus('Send Failed', 'error');
            alert('Failed to send message. Please try again.');
        }
    }
    
    async checkForNewMessages() {
        if (!this.mcpAvailable || !this.isInitialized) return;
        
        try {
            const messagesSQL = `
                SELECT * FROM voice_messages 
                WHERE recipient_id = '${this.currentUserId}' 
                AND read_at IS NULL 
                ORDER BY created_at DESC 
                LIMIT 1
            `;
            
            const result = await this.mcpQuery('run_sql', {
                params: {
                    sql: messagesSQL,
                    projectId: this.projectId
                }
            });
            
            if (result.rows && result.rows.length > 0) {
                const message = result.rows[0];
                this.showIncomingMessage(message);
                
                // Mark as read
                const updateSQL = `
                    UPDATE voice_messages 
                    SET read_at = CURRENT_TIMESTAMP 
                    WHERE id = ${message.id}
                `;
                
                await this.mcpQuery('run_sql', {
                    params: {
                        sql: updateSQL,
                        projectId: this.projectId
                    }
                });
            }
            
        } catch (error) {
            console.warn('⚠️ Failed to check for messages:', error);
        }
    }
    
    showIncomingMessage(message) {
        const panel = document.getElementById('incomingPanel');
        const messageEl = document.getElementById('incomingMessage');
        
        messageEl.textContent = message.translated_text || message.original_text;
        panel.style.display = 'block';
        
        this.incomingMessage = message;
        
        console.log('📥 New incoming message received');
    }
    
    async playIncomingMessage() {
        if (!this.incomingMessage) return;
        
        const text = this.incomingMessage.translated_text || this.incomingMessage.original_text;
        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.rate = 0.9;
        utterance.volume = 0.8;
        
        speechSynthesis.speak(utterance);
    }
    
    async replyToMessage() {
        if (!this.incomingMessage) return;
        
        // Set friend connection if not already connected
        if (!this.isConnected) {
            document.getElementById('friendIdInput').value = this.incomingMessage.sender_id;
            await this.connectToFriend();
        }
        
        // Hide incoming panel
        document.getElementById('incomingPanel').style.display = 'none';
        
        // Focus on voice recording
        alert('Tap and hold the voice button to record your reply!');
    }
    
    async onLanguageChange() {
        if (this.currentMessage.original) {
            await this.translateMessage();
        }
    }
    
    async mcpQuery(toolName, args) {
        // This would be replaced with actual MCP calls
        // For now, simulate database operations
        if (toolName === 'list_projects') {
            return {
                projects: [{ id: 'demo_project_id' }]
            };
        }
        
        if (toolName === 'run_sql') {
            console.log('🗄️ Simulated SQL:', args.params.sql);
            return { rows: [] };
        }
        
        return {};
    }
    
    showStatus(text, type) {
        const statusText = document.getElementById('statusText');
        const statusDot = document.getElementById('statusDot');
        
        statusText.textContent = text;
        
        // Update dot color
        statusDot.className = 'status-dot';
        switch (type) {
            case 'success':
                statusDot.style.background = 'var(--success-color)';
                statusDot.style.boxShadow = '0 0 10px var(--success-color)';
                break;
            case 'processing':
            case 'connecting':
            case 'sending':
                statusDot.style.background = 'var(--warning-color)';
                statusDot.style.boxShadow = '0 0 10px var(--warning-color)';
                break;
            case 'listening':
            case 'playing':
                statusDot.style.background = 'var(--purple-glow)';
                statusDot.style.boxShadow = '0 0 10px var(--purple-glow)';
                break;
            case 'error':
                statusDot.style.background = 'var(--danger-color)';
                statusDot.style.boxShadow = '0 0 10px var(--danger-color)';
                break;
            default:
                statusDot.style.background = 'var(--success-color)';
                statusDot.style.boxShadow = '0 0 10px var(--success-color)';
        }
    }
    
    showFallbackMessage() {
        // Show a helpful message when MCP is not available
        alert(`VoiceChat Network is running in demo mode. 

To enable real-time voice messaging:
1. Connect Neon Database MCP server
2. Set up proper database tables
3. Enable voice storage and routing

Your Voice ID: ${this.currentUserId}
Share this with friends to test the interface!`);
    }
}

// Initialize the VoiceChat Network when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.voiceChatNetwork = new VoiceChatNetwork();
});

// Export for debugging
window.VoiceChatNetwork = VoiceChatNetwork;
