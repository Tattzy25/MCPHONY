// ElevenLabs TTS Service - Production Ready
class ElevenLabsService {
    constructor() {
        this.config = window.MCPhonyConfig.ELEVENLABS;
        this.apiKey = window.MCPhonyConfig.ELEVENLABS_API_KEY;
        this.isInitialized = false;
        this.availableVoices = [];
        this.currentVoice = this.config.DEFAULT_VOICE_ID;
    }

    async initialize() {
        if (!this.apiKey || this.apiKey === 'your_elevenlabs_api_key_here') {
            throw new Error('ElevenLabs API key not configured');
        }

        try {
            await this.loadVoices();
            this.isInitialized = true;
            console.log('ElevenLabs service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ElevenLabs service:', error);
            throw error;
        }
    }

    async loadVoices() {
        try {
            const response = await fetch(`${this.config.BASE_URL}/voices`, {
                method: 'GET',
                headers: {
                    'xi-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load voices: ${response.statusText}`);
            }

            const data = await response.json();
            this.availableVoices = data.voices || [];
            
            console.log(`Loaded ${this.availableVoices.length} voices from ElevenLabs`);
            return this.availableVoices;
        } catch (error) {
            console.error('Error loading voices:', error);
            throw error;
        }
    }

    async textToSpeech(text, voiceId = null, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const selectedVoice = voiceId || this.currentVoice;
        const requestOptions = {
            stability: options.stability || this.config.VOICE_STABILITY,
            similarity_boost: options.similarity || this.config.VOICE_SIMILARITY,
            style: options.style || this.config.VOICE_STYLE,
            use_speaker_boost: options.speakerBoost !== undefined ? options.speakerBoost : this.config.VOICE_USE_SPEAKER_BOOST
        };

        try {
            const response = await fetch(
                `${this.config.BASE_URL}/text-to-speech/${selectedVoice}`,
                {
                    method: 'POST',
                    headers: {
                        'xi-api-key': this.apiKey,
                        'Content-Type': 'application/json',
                        'Accept': 'audio/mpeg'
                    },
                    body: JSON.stringify({
                        text: text,
                        model_id: 'eleven_multilingual_v2',
                        voice_settings: requestOptions
                    })
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`TTS failed: ${response.statusText} - ${errorText}`);
            }

            const audioBlob = await response.blob();
            return audioBlob;
        } catch (error) {
            console.error('Error in text-to-speech:', error);
            throw error;
        }
    }

    async playAudio(audioBlob) {
        return new Promise((resolve, reject) => {
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
        });
    }

    async speakText(text, voiceId = null, options = {}) {
        try {
            const audioBlob = await this.textToSpeech(text, voiceId, options);
            await this.playAudio(audioBlob);
            return true;
        } catch (error) {
            console.error('Error speaking text:', error);
            throw error;
        }
    }

    getAvailableVoices() {
        return this.availableVoices;
    }

    setVoice(voiceId) {
        const voice = this.availableVoices.find(v => v.voice_id === voiceId);
        if (voice) {
            this.currentVoice = voiceId;
            console.log(`Voice changed to: ${voice.name}`);
            return true;
        }
        return false;
    }

    getCurrentVoice() {
        return this.availableVoices.find(v => v.voice_id === this.currentVoice);
    }

    // Voice cloning functionality
    async cloneVoice(audioFiles, voiceName, description = '') {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const formData = new FormData();
        formData.append('name', voiceName);
        formData.append('description', description);
        
        // Add audio files
        audioFiles.forEach((file, index) => {
            formData.append(`files`, file, `sample_${index}.wav`);
        });

        try {
            const response = await fetch(`${this.config.BASE_URL}/voices/add`, {
                method: 'POST',
                headers: {
                    'xi-api-key': this.apiKey
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Voice cloning failed: ${response.statusText}`);
            }

            const result = await response.json();
            await this.loadVoices(); // Refresh voice list
            return result;
        } catch (error) {
            console.error('Error cloning voice:', error);
            throw error;
        }
    }

    // Get user subscription info
    async getUserInfo() {
        try {
            const response = await fetch(`${this.config.BASE_URL}/user`, {
                method: 'GET',
                headers: {
                    'xi-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get user info: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting user info:', error);
            throw error;
        }
    }
}

// Export for use in other modules
window.ElevenLabsService = ElevenLabsService;
