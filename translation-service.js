class TranslationService {
    constructor() {
        this.apiKey = null; // For Google Translate API or similar
        this.supportedLanguages = {
            'en': 'English',
            'zh': '中文',
            'ru': 'Русский',
            'es': 'Español',
            'fr': 'Français',
            'de': 'Deutsch',
            'ja': '日本語',
            'ko': '한국어',
            'ar': 'العربية',
            'hi': 'हिन्दी'
        };
        
        // Language detection patterns (simplified)
        this.languagePatterns = {
            'en': /[a-zA-Z\s.,!?]+/,
            'zh': /[\u4e00-\u9fff]+/,
            'ru': /[а-яё\s.,!?]+/i,
            'es': /[a-záéíóúüñ\s.,!?]+/i,
            'fr': /[a-záàâäçéèêëïîôöùûüÿñæœ\s.,!?]+/i,
            'de': /[a-zäöüß\s.,!?]+/i,
            'ja': /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]+/,
            'ko': /[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]+/,
            'ar': /[\u0600-\u06ff\u0750-\u077f]+/,
            'hi': /[\u0900-\u097f]+/
        };
        
        this.initializeService();
    }
    
    initializeService() {
        console.log('🌐 Translation Service initialized');
    }
    
    async detectLanguage(text) {
        if (!text || text.trim().length === 0) {
            return 'en'; // Default to English
        }
        
        const cleanText = text.toLowerCase().trim();
        let maxScore = 0;
        let detectedLang = 'en';
        
        // Check against language patterns
        for (const [lang, pattern] of Object.entries(this.languagePatterns)) {
            const matches = cleanText.match(pattern);
            if (matches) {
                const score = matches.join('').length / cleanText.length;
                if (score > maxScore) {
                    maxScore = score;
                    detectedLang = lang;
                }
            }
        }
        
        // Additional heuristics for common words
        const commonWords = {
            'en': ['the', 'and', 'you', 'that', 'was', 'for', 'are', 'with', 'his', 'they'],
            'zh': ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人'],
            'ru': ['и', 'в', 'не', 'на', 'я', 'с', 'что', 'а', 'по', 'это'],
            'es': ['de', 'la', 'que', 'el', 'en', 'y', 'a', 'se', 'no', 'te'],
            'fr': ['de', 'le', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir'],
            'de': ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich'],
            'ja': ['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し'],
            'ko': ['의', '는', '이', '가', '을', '를', '에', '와', '과', '로'],
            'ar': ['في', 'من', 'إلى', 'على', 'أن', 'هذا', 'التي', 'كان', 'لم', 'قد'],
            'hi': ['के', 'में', 'है', 'की', 'को', 'से', 'पर', 'इस', 'का', 'एक']
        };
        
        let bestMatch = detectedLang;
        let bestScore = maxScore;
        
        for (const [lang, words] of Object.entries(commonWords)) {
            let wordMatches = 0;
            const textWords = cleanText.split(/\s+/);
            
            for (const word of words) {
                if (textWords.includes(word.toLowerCase())) {
                    wordMatches++;
                }
            }
            
            const wordScore = wordMatches / Math.min(words.length, textWords.length);
            if (wordScore > bestScore) {
                bestScore = wordScore;
                bestMatch = lang;
            }
        }
        
        console.log(`🔍 Detected language: ${bestMatch} (confidence: ${Math.round(bestScore * 100)}%)`);
        return bestMatch;
    }
    
    async translateText(text, targetLang, sourceLang = null) {
        if (!text || text.trim().length === 0) {
            return { translatedText: '', detectedSourceLang: 'en' };
        }
        
        // Auto-detect source language if not provided
        if (!sourceLang) {
            sourceLang = await this.detectLanguage(text);
        }
        
        // If source and target are the same, return original text
        if (sourceLang === targetLang) {
            return { 
                translatedText: text, 
                detectedSourceLang: sourceLang 
            };
        }
        
        try {
            // For demo purposes, we'll use a mock translation
            // In production, you'd use Google Translate API, Azure Translator, etc.
            const translatedText = await this.mockTranslate(text, sourceLang, targetLang);
            
            console.log(`🌐 Translated from ${sourceLang} to ${targetLang}`);
            return { 
                translatedText, 
                detectedSourceLang: sourceLang 
            };
            
        } catch (error) {
            console.error('❌ Translation failed:', error);
            return { 
                translatedText: text, // Return original on failure
                detectedSourceLang: sourceLang,
                error: error.message 
            };
        }
    }
    
    async mockTranslate(text, sourceLang, targetLang) {
        // Mock translation for demo - replace with real API
        const translations = {
            'en_zh': {
                'hello': '你好',
                'goodbye': '再见',
                'thank you': '谢谢',
                'yes': '是',
                'no': '不是',
                'how are you': '你好吗',
                'i love you': '我爱你',
                'what is your name': '你叫什么名字',
                'nice to meet you': '很高兴见到你'
            },
            'en_ru': {
                'hello': 'привет',
                'goodbye': 'до свидания',
                'thank you': 'спасибо',
                'yes': 'да',
                'no': 'нет',
                'how are you': 'как дела',
                'i love you': 'я тебя люблю',
                'what is your name': 'как тебя зовут',
                'nice to meet you': 'приятно познакомиться'
            },
            'en_es': {
                'hello': 'hola',
                'goodbye': 'adiós',
                'thank you': 'gracias',
                'yes': 'sí',
                'no': 'no',
                'how are you': 'cómo estás',
                'i love you': 'te amo',
                'what is your name': 'cómo te llamas',
                'nice to meet you': 'mucho gusto'
            },
            'en_fr': {
                'hello': 'bonjour',
                'goodbye': 'au revoir',
                'thank you': 'merci',
                'yes': 'oui',
                'no': 'non',
                'how are you': 'comment allez-vous',
                'i love you': 'je t\'aime',
                'what is your name': 'comment vous appelez-vous',
                'nice to meet you': 'enchanté de vous rencontrer'
            }
        };
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const key = `${sourceLang}_${targetLang}`;
        const reverseKey = `${targetLang}_${sourceLang}`;
        
        const lowerText = text.toLowerCase().trim();
        
        // Check direct translation
        if (translations[key] && translations[key][lowerText]) {
            return translations[key][lowerText];
        }
        
        // Check reverse translation
        if (translations[reverseKey]) {
            for (const [originalText, translatedText] of Object.entries(translations[reverseKey])) {
                if (translatedText.toLowerCase() === lowerText) {
                    return originalText;
                }
            }
        }
        
        // If no exact match found, return a processed version
        return `[${this.supportedLanguages[targetLang]}] ${text}`;
    }
    
    getLanguageName(code) {
        return this.supportedLanguages[code] || code.toUpperCase();
    }
    
    getSupportedLanguages() {
        return this.supportedLanguages;
    }
    
    // Real-world implementation would use actual translation APIs
    async translateWithAPI(text, targetLang, sourceLang) {
        // Example using Google Translate API
        /*
        const response = await fetch('https://translation.googleapis.com/language/translate/v2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                q: text,
                target: targetLang,
                source: sourceLang,
                format: 'text'
            })
        });
        
        const data = await response.json();
        return data.data.translations[0].translatedText;
        */
    }
    
    // Batch translation for multiple texts
    async translateBatch(texts, targetLang, sourceLang = null) {
        const results = [];
        
        for (const text of texts) {
            try {
                const result = await this.translateText(text, targetLang, sourceLang);
                results.push(result);
            } catch (error) {
                results.push({ 
                    translatedText: text, 
                    detectedSourceLang: sourceLang || 'unknown',
                    error: error.message 
                });
            }
        }
        
        return results;
    }
}

// Export for use in other files
window.TranslationService = TranslationService;
