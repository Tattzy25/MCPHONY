class VoiceAnalyzer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.isAnalyzing = false;
        
        // Voice characteristics detection
        this.pitchDetector = null;
        this.voiceCharacteristics = {
            pitch: 0,
            volume: 0,
            gender: 'unknown',
            language: 'unknown',
            confidence: 0
        };
        
        this.initializeAudioContext();
    }
    
    async initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;
            
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            console.log('🎤 Voice Analyzer initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize audio context:', error);
        }
    }
    
    async startAnalysis() {
        if (this.isAnalyzing) return;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            this.isAnalyzing = true;
            
            this.analyzeVoice();
            this.updateVisualizations();
            
            console.log('🎤 Voice analysis started');
            return stream;
            
        } catch (error) {
            console.error('❌ Microphone access denied:', error);
            throw error;
        }
    }
    
    stopAnalysis() {
        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }
        this.isAnalyzing = false;
        console.log('🛑 Voice analysis stopped');
    }
    
    analyzeVoice() {
        if (!this.isAnalyzing) return;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Calculate volume
        const volume = this.calculateVolume();
        
        // Estimate pitch
        const pitch = this.estimatePitch();
        
        // Detect gender based on pitch and formants
        const gender = this.detectGender(pitch);
        
        // Simulate language detection (in real app, would use speech recognition)
        const language = this.detectLanguage();
        
        // Calculate confidence based on signal strength
        const confidence = Math.min(volume / 50, 1) * 100;
        
        this.voiceCharacteristics = {
            pitch: Math.round(pitch),
            volume: Math.round(volume),
            gender,
            language,
            confidence: Math.round(confidence)
        };
        
        this.updateUI();
        
        requestAnimationFrame(() => this.analyzeVoice());
    }
    
    calculateVolume() {
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        return sum / this.dataArray.length;
    }
    
    estimatePitch() {
        // Simple pitch estimation using autocorrelation
        const timeData = new Uint8Array(this.analyser.fftSize);
        this.analyser.getByteTimeDomainData(timeData);
        
        let bestCorrelation = 0;
        let bestOffset = 0;
        let rms = 0;
        
        for (let i = 0; i < timeData.length; i++) {
            const val = (timeData[i] - 128) / 128;
            rms += val * val;
        }
        rms = Math.sqrt(rms / timeData.length);
        
        if (rms < 0.01) return 0; // Too quiet
        
        let lastCorrelation = 1;
        for (let offset = 20; offset < timeData.length / 2; offset++) {
            let correlation = 0;
            for (let i = 0; i < timeData.length - offset; i++) {
                correlation += Math.abs((timeData[i] - 128) - (timeData[i + offset] - 128));
            }
            correlation = 1 - (correlation / (timeData.length - offset));
            
            if (correlation > 0.9 && correlation > lastCorrelation) {
                bestCorrelation = correlation;
                bestOffset = offset;
                break;
            }
            lastCorrelation = correlation;
        }
        
        if (bestCorrelation > 0.01) {
            return this.audioContext.sampleRate / bestOffset;
        }
        return 0;
    }
    
    detectGender(pitch) {
        if (pitch === 0) return 'unknown';
        
        // Rough gender classification based on fundamental frequency
        if (pitch > 165 && pitch < 265) {
            return 'female';
        } else if (pitch > 85 && pitch < 180) {
            return 'male';
        } else {
            return 'unknown';
        }
    }
    
    detectLanguage() {
        // Placeholder for language detection
        // In a real implementation, this would analyze phonetic patterns
        const languages = ['English', 'Chinese', 'Russian', 'Spanish', 'French'];
        return languages[Math.floor(Math.random() * languages.length)];
    }
    
    updateUI() {
        // Update voice analysis display
        document.getElementById('detectedLanguage').textContent = this.voiceCharacteristics.language;
        document.getElementById('detectedGender').textContent = this.voiceCharacteristics.gender.toUpperCase();
        document.getElementById('detectedPitch').textContent = `${this.voiceCharacteristics.pitch} Hz`;
        document.getElementById('confidenceLevel').textContent = `${this.voiceCharacteristics.confidence}%`;
        
        // Update level bar
        const levelBar = document.getElementById('levelBar');
        const levelPercent = Math.min((this.voiceCharacteristics.volume / 100) * 100, 100);
        levelBar.style.width = `${levelPercent}%`;
    }
    
    updateVisualizations() {
        if (!this.isAnalyzing) return;
        
        const canvas = document.getElementById('voiceCanvas');
        const ctx = canvas.getContext('2d');
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw frequency bars
        const barWidth = (canvas.width / this.dataArray.length) * 2.5;
        let barHeight;
        let x = 0;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#00ffff');
        gradient.addColorStop(0.5, '#0066ff');
        gradient.addColorStop(1, '#003366');
        
        for (let i = 0; i < this.dataArray.length; i++) {
            barHeight = (this.dataArray[i] / 255) * canvas.height;
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            
            // Add glow effect
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            ctx.shadowBlur = 0;
            
            x += barWidth + 1;
        }
        
        // Draw waveform overlay
        this.drawWaveform(ctx, canvas);
        
        requestAnimationFrame(() => this.updateVisualizations());
    }
    
    drawWaveform(ctx, canvas) {
        const timeData = new Uint8Array(this.analyser.fftSize);
        this.analyser.getByteTimeDomainData(timeData);
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00ffff';
        ctx.beginPath();
        
        const sliceWidth = canvas.width / timeData.length;
        let x = 0;
        
        for (let i = 0; i < timeData.length; i++) {
            const v = timeData[i] / 128.0;
            const y = v * canvas.height / 2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        ctx.stroke();
    }
    
    getVoiceCharacteristics() {
        return this.voiceCharacteristics;
    }
}

// Export for use in other files
window.VoiceAnalyzer = VoiceAnalyzer;
