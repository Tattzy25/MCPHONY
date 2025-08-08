// MCP Integration Service - Production Ready
// Handles all MCP server connections for ElevenLabs and DeepL

class MCPIntegrationService {
    constructor() {
        this.config = window.MCPhonyConfig.MCP;
        this.connections = new Map();
        this.availableServers = [];
        this.isInitialized = false;
    }

    async initialize() {
        try {
            // Initialize MCP connections for ElevenLabs and DeepL
            await this.connectToElevenLabsMCP();
            await this.connectToDeepLMCP();
            
            this.isInitialized = true;
            console.log('MCP Integration service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize MCP Integration:', error);
            throw error;
        }
    }

    async connectToElevenLabsMCP() {
        try {
            // Connect to ElevenLabs MCP server
            const elevenLabsConnection = await this.createMCPConnection('elevenlabs', {
                url: 'ws://localhost:3002',
                name: 'ElevenLabs TTS Server',
                capabilities: ['text-to-speech', 'voice-cloning', 'voice-list']
            });
            
            this.connections.set('elevenlabs', elevenLabsConnection);
            console.log('Connected to ElevenLabs MCP server');
        } catch (error) {
            console.error('Failed to connect to ElevenLabs MCP:', error);
            throw error;
        }
    }

    async connectToDeepLMCP() {
        try {
            // Connect to DeepL MCP server
            const deepLConnection = await this.createMCPConnection('deepl', {
                url: 'ws://localhost:3003',
                name: 'DeepL Translation Server',
                capabilities: ['translate', 'detect-language', 'supported-languages']
            });
            
            this.connections.set('deepl', deepLConnection);
            console.log('Connected to DeepL MCP server');
        } catch (error) {
            console.error('Failed to connect to DeepL MCP:', error);
            throw error;
        }
    }

    async createMCPConnection(serverName, config) {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(config.url);
            
            const connection = {
                ws: ws,
                name: config.name,
                capabilities: config.capabilities,
                isConnected: false,
                messageQueue: [],
                responseHandlers: new Map()
            };

            ws.onopen = () => {
                connection.isConnected = true;
                this.sendInitMessage(connection);
                resolve(connection);
            };

            ws.onmessage = (event) => {
                this.handleMCPMessage(serverName, event.data);
            };

            ws.onerror = (error) => {
                console.error(`MCP connection error for ${serverName}:`, error);
                reject(error);
            };

            ws.onclose = () => {
                connection.isConnected = false;
                console.log(`MCP connection closed for ${serverName}`);
                // Implement reconnection logic
                this.scheduleReconnect(serverName, config);
            };
        });
    }

    sendInitMessage(connection) {
        const initMessage = {
            jsonrpc: '2.0',
            method: 'initialize',
            params: {
                clientInfo: {
                    name: 'MCPhony',
                    version: window.MCPhonyConfig.APP.VERSION
                },
                capabilities: {
                    tools: true,
                    resources: true
                }
            },
            id: this.generateRequestId()
        };

        connection.ws.send(JSON.stringify(initMessage));
    }

    handleMCPMessage(serverName, message) {
        try {
            const parsedMessage = JSON.parse(message);
            console.log(`MCP message from ${serverName}:`, parsedMessage);

            const connection = this.connections.get(serverName);
            if (!connection) return;

            // Handle response messages
            if (parsedMessage.id && connection.responseHandlers.has(parsedMessage.id)) {
                const handler = connection.responseHandlers.get(parsedMessage.id);
                handler(parsedMessage);
                connection.responseHandlers.delete(parsedMessage.id);
            }

            // Handle notification messages
            if (parsedMessage.method) {
                this.handleMCPNotification(serverName, parsedMessage);
            }
        } catch (error) {
            console.error(`Error parsing MCP message from ${serverName}:`, error);
        }
    }

    handleMCPNotification(serverName, message) {
        switch (message.method) {
            case 'progress':
                this.updateProgress(serverName, message.params);
                break;
            case 'error':
                this.handleServerError(serverName, message.params);
                break;
            default:
                console.log(`Unknown notification from ${serverName}:`, message.method);
        }
    }

    async callMCPTool(serverName, toolName, params) {
        const connection = this.connections.get(serverName);
        if (!connection || !connection.isConnected) {
            throw new Error(`Not connected to ${serverName} MCP server`);
        }

        const requestId = this.generateRequestId();
        const request = {
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
                name: toolName,
                arguments: params
            },
            id: requestId
        };

        return new Promise((resolve, reject) => {
            connection.responseHandlers.set(requestId, (response) => {
                if (response.error) {
                    reject(new Error(response.error.message));
                } else {
                    resolve(response.result);
                }
            });

            connection.ws.send(JSON.stringify(request));

            // Set timeout for response
            setTimeout(() => {
                if (connection.responseHandlers.has(requestId)) {
                    connection.responseHandlers.delete(requestId);
                    reject(new Error('MCP request timeout'));
                }
            }, 30000);
        });
    }

    // ElevenLabs MCP methods
    async elevenLabsTextToSpeech(text, options = {}) {
        try {
            const result = await this.callMCPTool('elevenlabs', 'text-to-speech', {
                text: text,
                voice_id: options.voiceId || window.MCPhonyConfig.ELEVENLABS.DEFAULT_VOICE_ID,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: options.stability || window.MCPhonyConfig.ELEVENLABS.VOICE_STABILITY,
                    similarity_boost: options.similarity || window.MCPhonyConfig.ELEVENLABS.VOICE_SIMILARITY,
                    style: options.style || window.MCPhonyConfig.ELEVENLABS.VOICE_STYLE,
                    use_speaker_boost: options.speakerBoost !== undefined ? options.speakerBoost : window.MCPhonyConfig.ELEVENLABS.VOICE_USE_SPEAKER_BOOST
                }
            });

            return result.audio_data; // Base64 encoded audio
        } catch (error) {
            console.error('ElevenLabs MCP TTS error:', error);
            throw error;
        }
    }

    async elevenLabsGetVoices() {
        try {
            const result = await this.callMCPTool('elevenlabs', 'get-voices', {});
            return result.voices;
        } catch (error) {
            console.error('ElevenLabs MCP get voices error:', error);
            throw error;
        }
    }

    async elevenLabsCloneVoice(audioFiles, name, description = '') {
        try {
            const result = await this.callMCPTool('elevenlabs', 'clone-voice', {
                audio_files: audioFiles,
                name: name,
                description: description
            });
            return result;
        } catch (error) {
            console.error('ElevenLabs MCP voice cloning error:', error);
            throw error;
        }
    }

    // DeepL MCP methods
    async deepLTranslate(text, targetLang, sourceLang = null, options = {}) {
        try {
            const params = {
                text: text,
                target_lang: targetLang,
                preserve_formatting: options.preserveFormatting !== false
            };

            if (sourceLang) {
                params.source_lang = sourceLang;
            }

            if (options.formality) {
                params.formality = options.formality;
            }

            const result = await this.callMCPTool('deepl', 'translate', params);
            return result.translation;
        } catch (error) {
            console.error('DeepL MCP translation error:', error);
            throw error;
        }
    }

    async deepLDetectLanguage(text) {
        try {
            const result = await this.callMCPTool('deepl', 'detect-language', {
                text: text
            });
            return result.detected_language;
        } catch (error) {
            console.error('DeepL MCP language detection error:', error);
            throw error;
        }
    }

    async deepLGetSupportedLanguages() {
        try {
            const result = await this.callMCPTool('deepl', 'supported-languages', {});
            return result.languages;
        } catch (error) {
            console.error('DeepL MCP supported languages error:', error);
            throw error;
        }
    }

    async deepLCheckUsage() {
        try {
            const result = await this.callMCPTool('deepl', 'usage', {});
            return result.usage;
        } catch (error) {
            console.error('DeepL MCP usage check error:', error);
            throw error;
        }
    }

    // Unified API methods that choose between MCP and direct API
    async performTextToSpeech(text, options = {}) {
        if (this.config.ENABLED && this.isInitialized) {
            return await this.elevenLabsTextToSpeech(text, options);
        } else {
            // Fallback to direct API
            const elevenLabsService = new ElevenLabsService();
            return await elevenLabsService.textToSpeech(text, options.voiceId, options);
        }
    }

    async performTranslation(text, targetLang, sourceLang = null, options = {}) {
        if (this.config.ENABLED && this.isInitialized) {
            return await this.deepLTranslate(text, targetLang, sourceLang, options);
        } else {
            // Fallback to direct API
            const deepLService = new DeepLService();
            return await deepLService.translateText(text, targetLang, sourceLang, options);
        }
    }

    async playAudioFromBase64(base64Audio) {
        return new Promise((resolve, reject) => {
            try {
                const audioBlob = this.base64ToBlob(base64Audio, 'audio/mpeg');
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                
                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                };
                
                audio.onerror = (error) => {
                    URL.revokeObjectURL(audioUrl);
                    reject(error);
                };
                
                audio.play().catch(reject);
            } catch (error) {
                reject(error);
            }
        });
    }

    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    scheduleReconnect(serverName, config) {
        setTimeout(() => {
            console.log(`Attempting to reconnect to ${serverName}...`);
            this.createMCPConnection(serverName, config)
                .then(connection => {
                    this.connections.set(serverName, connection);
                    console.log(`Reconnected to ${serverName}`);
                })
                .catch(error => {
                    console.error(`Failed to reconnect to ${serverName}:`, error);
                    // Schedule another reconnect attempt
                    this.scheduleReconnect(serverName, config);
                });
        }, this.config.RETRY_DELAY);
    }

    generateRequestId() {
        return Math.random().toString(36).substr(2, 9);
    }

    updateProgress(serverName, params) {
        console.log(`Progress from ${serverName}:`, params);
        // Update UI progress indicators
        this.dispatchEvent(new CustomEvent('mcpProgress', {
            detail: { server: serverName, progress: params }
        }));
    }

    handleServerError(serverName, params) {
        console.error(`Error from ${serverName} server:`, params);
        // Handle server errors
        this.dispatchEvent(new CustomEvent('mcpError', {
            detail: { server: serverName, error: params }
        }));
    }

    dispatchEvent(event) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(event);
        }
    }

    // Health check methods
    getConnectionStatus() {
        const status = {};
        for (const [name, connection] of this.connections) {
            status[name] = {
                connected: connection.isConnected,
                name: connection.name,
                capabilities: connection.capabilities
            };
        }
        return status;
    }

    async pingServers() {
        const results = {};
        for (const [name, connection] of this.connections) {
            if (connection.isConnected) {
                try {
                    await this.callMCPTool(name, 'ping', {});
                    results[name] = 'healthy';
                } catch (error) {
                    results[name] = 'unhealthy';
                }
            } else {
                results[name] = 'disconnected';
            }
        }
        return results;
    }
}

// Export for use in other modules
window.MCPIntegrationService = MCPIntegrationService;
