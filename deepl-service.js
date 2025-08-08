// DeepL Translation Service - Production Ready
class DeepLService {
    constructor() {
        this.config = window.MCPhonyConfig.DEEPL;
        this.apiKey = window.MCPhonyConfig.DEEPL_API_KEY;
        this.isInitialized = false;
        this.supportedLanguages = [];
        this.usage = null;
    }

    async initialize() {
        if (!this.apiKey || this.apiKey === 'your_deepl_api_key_here') {
            throw new Error('DeepL API key not configured');
        }

        try {
            await this.loadSupportedLanguages();
            await this.checkUsage();
            this.isInitialized = true;
            console.log('DeepL service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize DeepL service:', error);
            throw error;
        }
    }

    async loadSupportedLanguages() {
        try {
            const response = await fetch(`${this.config.BASE_URL}/languages?type=target`, {
                method: 'GET',
                headers: {
                    'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load languages: ${response.statusText}`);
            }

            const languages = await response.json();
            this.supportedLanguages = languages;
            
            console.log(`Loaded ${languages.length} supported languages from DeepL`);
            return languages;
        } catch (error) {
            console.error('Error loading supported languages:', error);
            throw error;
        }
    }

    async checkUsage() {
        try {
            const response = await fetch(`${this.config.BASE_URL}/usage`, {
                method: 'GET',
                headers: {
                    'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to check usage: ${response.statusText}`);
            }

            this.usage = await response.json();
            console.log('DeepL Usage:', this.usage);
            return this.usage;
        } catch (error) {
            console.error('Error checking usage:', error);
            throw error;
        }
    }

    async translateText(text, targetLang, sourceLang = null, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        // Convert language codes to DeepL format
        const deeplTargetLang = this.config.SUPPORTED_LANGUAGES[targetLang] || targetLang.toUpperCase();
        const deeplSourceLang = sourceLang ? (this.config.SUPPORTED_LANGUAGES[sourceLang] || sourceLang.toUpperCase()) : null;

        const requestBody = {
            text: [text],
            target_lang: deeplTargetLang,
            preserve_formatting: options.preserveFormatting !== false,
            split_sentences: options.splitSentences || 'nonewlines'
        };

        if (deeplSourceLang) {
            requestBody.source_lang = deeplSourceLang;
        }

        // Add additional options
        if (options.formality) {
            requestBody.formality = options.formality; // 'more', 'less', 'default'
        }

        if (options.glossaryId) {
            requestBody.glossary_id = options.glossaryId;
        }

        try {
            const response = await fetch(`${this.config.BASE_URL}/translate`, {
                method: 'POST',
                headers: {
                    'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Translation failed: ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            
            if (result.translations && result.translations.length > 0) {
                const translation = result.translations[0];
                return {
                    originalText: text,
                    translatedText: translation.text,
                    detectedSourceLanguage: translation.detected_source_language,
                    targetLanguage: deeplTargetLang,
                    confidence: 1.0 // DeepL doesn't provide confidence scores
                };
            } else {
                throw new Error('No translation returned from DeepL');
            }
        } catch (error) {
            console.error('Error in translation:', error);
            throw error;
        }
    }

    async detectLanguage(text) {
        try {
            // DeepL doesn't have a dedicated language detection endpoint
            // We'll use a translation request to detect the language
            const response = await fetch(`${this.config.BASE_URL}/translate`, {
                method: 'POST',
                headers: {
                    'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: [text.substring(0, 100)], // Only use first 100 chars for detection
                    target_lang: 'EN-US' // Translate to English to detect source
                })
            });

            if (!response.ok) {
                throw new Error(`Language detection failed: ${response.statusText}`);
            }

            const result = await response.json();
            if (result.translations && result.translations.length > 0) {
                return result.translations[0].detected_source_language;
            }
            
            return 'unknown';
        } catch (error) {
            console.error('Error detecting language:', error);
            return 'unknown';
        }
    }

    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    getUsage() {
        return this.usage;
    }

    isLanguageSupported(langCode) {
        const deeplLang = this.config.SUPPORTED_LANGUAGES[langCode] || langCode.toUpperCase();
        return this.supportedLanguages.some(lang => lang.language === deeplLang);
    }

    // Get available formality options for a language
    getAvailableFormality(targetLang) {
        const deeplLang = this.config.SUPPORTED_LANGUAGES[targetLang] || targetLang.toUpperCase();
        const language = this.supportedLanguages.find(lang => lang.language === deeplLang);
        return language ? language.supports_formality : false;
    }

    // Batch translation for multiple texts
    async translateBatch(texts, targetLang, sourceLang = null, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const deeplTargetLang = this.config.SUPPORTED_LANGUAGES[targetLang] || targetLang.toUpperCase();
        const deeplSourceLang = sourceLang ? (this.config.SUPPORTED_LANGUAGES[sourceLang] || sourceLang.toUpperCase()) : null;

        const requestBody = {
            text: texts,
            target_lang: deeplTargetLang,
            preserve_formatting: options.preserveFormatting !== false
        };

        if (deeplSourceLang) {
            requestBody.source_lang = deeplSourceLang;
        }

        try {
            const response = await fetch(`${this.config.BASE_URL}/translate`, {
                method: 'POST',
                headers: {
                    'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Batch translation failed: ${response.statusText}`);
            }

            const result = await response.json();
            return result.translations.map((translation, index) => ({
                originalText: texts[index],
                translatedText: translation.text,
                detectedSourceLanguage: translation.detected_source_language,
                targetLanguage: deeplTargetLang
            }));
        } catch (error) {
            console.error('Error in batch translation:', error);
            throw error;
        }
    }

    // Create and manage glossaries
    async createGlossary(name, sourceLang, targetLang, entries) {
        const requestBody = {
            name: name,
            source_lang: this.config.SUPPORTED_LANGUAGES[sourceLang] || sourceLang.toUpperCase(),
            target_lang: this.config.SUPPORTED_LANGUAGES[targetLang] || targetLang.toUpperCase(),
            entries: entries
        };

        try {
            const response = await fetch(`${this.config.BASE_URL}/glossaries`, {
                method: 'POST',
                headers: {
                    'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Glossary creation failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating glossary:', error);
            throw error;
        }
    }

    async getGlossaries() {
        try {
            const response = await fetch(`${this.config.BASE_URL}/glossaries`, {
                method: 'GET',
                headers: {
                    'Authorization': `DeepL-Auth-Key ${this.apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get glossaries: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting glossaries:', error);
            throw error;
        }
    }
}

// Export for use in other modules
window.DeepLService = DeepLService;
