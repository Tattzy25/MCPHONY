// MCPhony Configuration
// Production-ready API configuration

window.MCPhonyConfig = {
    // API Keys - Replace with your actual keys
    ELEVENLABS_API_KEY: 'your_elevenlabs_api_key_here',
    DEEPL_API_KEY: 'your_deepl_api_key_here',
    
    // ElevenLabs Configuration
    ELEVENLABS: {
        BASE_URL: 'https://api.elevenlabs.io/v1',
        DEFAULT_VOICE_ID: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
        VOICE_STABILITY: 0.5,
        VOICE_SIMILARITY: 0.8,
        VOICE_STYLE: 0.0,
        VOICE_USE_SPEAKER_BOOST: true
    },
    
    // DeepL Configuration
    DEEPL: {
        BASE_URL: 'https://api-free.deepl.com/v2', // Use api.deepl.com for pro
        SUPPORTED_LANGUAGES: {
            'en': 'EN-US',
            'es': 'ES',
            'fr': 'FR', 
            'de': 'DE',
            'it': 'IT',
            'pt': 'PT-PT',
            'ru': 'RU',
            'ja': 'JA',
            'ko': 'KO',
            'zh': 'ZH'
        }
    },
    
    // MCP Configuration
    MCP: {
        ENABLED: true,
        SERVER_URL: 'ws://localhost:3001',
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000
    },
    
    // App Settings
    APP: {
        NAME: 'MCPhony',
        VERSION: '1.0.0',
        DEBUG: true,
        VOICE_TIMEOUT: 30000, // 30 seconds
        MAX_AUDIO_SIZE: 25 * 1024 * 1024 // 25MB
    }
};
