class MatrixEffect {
    constructor() {
        this.canvas = document.getElementById('matrixCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.drops = [];
        this.fontSize = 16;
        this.chars = "01";
        
        this.initializeCanvas();
        this.startMatrix();
    }
    
    initializeCanvas() {
        // Set canvas size
        this.resizeCanvas();
        
        // Initialize drops array
        const columns = Math.floor(this.canvas.width / this.fontSize);
        for (let i = 0; i < columns; i++) {
            this.drops[i] = Math.floor(Math.random() * this.canvas.height / this.fontSize);
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    startMatrix() {
        this.drawMatrix();
    }
    
    drawMatrix() {
        // Semi-transparent black background to create fade effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set text properties
        this.ctx.font = `${this.fontSize}px 'Orbitron', monospace`;
        this.ctx.textAlign = 'center';
        
        // Calculate number of columns
        const columns = Math.floor(this.canvas.width / this.fontSize);
        
        // Ensure drops array matches column count
        if (this.drops.length !== columns) {
            this.drops = [];
            for (let i = 0; i < columns; i++) {
                this.drops[i] = Math.floor(Math.random() * this.canvas.height / this.fontSize);
            }
        }
        
        // Draw falling characters
        for (let i = 0; i < this.drops.length; i++) {
            // Random character from charset
            const char = this.chars[Math.floor(Math.random() * this.chars.length)];
            
            // Create gradient for glow effect
            const x = i * this.fontSize;
            const y = this.drops[i] * this.fontSize;
            
            // Ensure all coordinates are finite numbers
            const x1 = isFinite(x) ? x : 0;
            const y1 = isFinite(y - 20) ? y - 20 : 0;
            const x2 = isFinite(x) ? x : 0;
            const y2 = isFinite(y + 20) ? y + 20 : 40;
            
            const gradient = this.ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
            gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0.1)');
            
            this.ctx.fillStyle = gradient;
            
            // Draw the character
            this.ctx.fillText(
                char, 
                i * this.fontSize + this.fontSize / 2, 
                this.drops[i] * this.fontSize
            );
            
            // Move drop down
            if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }
            this.drops[i]++;
        }
        
        // Continue animation
        requestAnimationFrame(() => this.drawMatrix());
    }
}

// Enhanced Matrix Effect with Voice Reactivity
class ReactiveMatrixEffect extends MatrixEffect {
    constructor() {
        super();
        this.voiceLevel = 0;
        this.maxIntensity = 1.0;
    }
    
    updateVoiceLevel(level) {
        this.voiceLevel = Math.min(level / 100, 1); // Normalize to 0-1
    }
    
    drawMatrix() {
        // Adjust background opacity based on voice level
        const baseOpacity = 0.05;
        const voiceOpacity = baseOpacity + (this.voiceLevel * 0.15);
        this.ctx.fillStyle = `rgba(0, 0, 0, ${voiceOpacity})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set text properties
        this.ctx.font = `${this.fontSize}px 'Orbitron', monospace`;
        this.ctx.textAlign = 'center';
        
        // Calculate number of columns
        const columns = Math.floor(this.canvas.width / this.fontSize);
        
        // Ensure drops array matches column count
        if (this.drops.length !== columns) {
            this.drops = [];
            for (let i = 0; i < columns; i++) {
                this.drops[i] = Math.floor(Math.random() * this.canvas.height / this.fontSize);
            }
        }
        
        // Draw falling characters with voice reactivity
        for (let i = 0; i < this.drops.length; i++) {
            // Random character from charset
            let char = this.chars[Math.floor(Math.random() * this.chars.length)];
            
            // Add special characters when voice is detected
            if (this.voiceLevel > 0.3) {
                const specialChars = "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω";
                if (Math.random() < this.voiceLevel * 0.5) {
                    char = specialChars[Math.floor(Math.random() * specialChars.length)];
                }
            }
            
            // Adjust color intensity based on voice level
            const baseIntensity = 0.3;
            const voiceIntensity = Math.max(0, Math.min(1, baseIntensity + (this.voiceLevel * 0.7)));
            
            // Create gradient for glow effect
            const x = i * this.fontSize;
            const y = this.drops[i] * this.fontSize;
            
            // Ensure all coordinates are finite numbers
            const x1 = isFinite(x) ? x : 0;
            const y1 = isFinite(y - 20) ? y - 20 : 0;
            const x2 = isFinite(x) ? x : 0;
            const y2 = isFinite(y + 20) ? y + 20 : 40;
            
            const gradient = this.ctx.createLinearGradient(x1, y1, x2, y2);
            
            const alpha = isNaN(voiceIntensity) ? 0.3 : voiceIntensity;
            const alpha1 = Math.max(0, Math.min(1, alpha * 0.1));
            const alpha2 = Math.max(0, Math.min(1, alpha));
            const alpha3 = Math.max(0, Math.min(1, alpha * 0.1));
            
            gradient.addColorStop(0, `rgba(0, 255, 255, ${alpha1})`);
            gradient.addColorStop(0.5, `rgba(0, 255, 255, ${alpha2})`);
            gradient.addColorStop(1, `rgba(0, 255, 255, ${alpha3})`);
            
            // Add glow effect for high voice levels
            if (this.voiceLevel > 0.5) {
                this.ctx.shadowColor = '#00ffff';
                this.ctx.shadowBlur = 10 * this.voiceLevel;
            } else {
                this.ctx.shadowBlur = 0;
            }
            
            this.ctx.fillStyle = gradient;
            
            // Draw the character
            this.ctx.fillText(
                char, 
                i * this.fontSize + this.fontSize / 2, 
                this.drops[i] * this.fontSize
            );
            
            // Adjust drop speed based on voice level
            const baseSpeed = 0.98;
            const voiceSpeed = baseSpeed - (this.voiceLevel * 0.05); // Higher voice = faster reset
            
            // Move drop down
            if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > voiceSpeed) {
                this.drops[i] = 0;
            }
            
            // Speed up drops when voice is active
            const dropSpeed = 1 + (this.voiceLevel * 2);
            this.drops[i] += dropSpeed;
        }
        
        // Continue animation
        requestAnimationFrame(() => this.drawMatrix());
    }
}

// Initialize matrix effect when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Use reactive matrix effect
    const matrixEffect = new ReactiveMatrixEffect();
    
    // Connect to voice analyzer if available
    const checkVoiceAnalyzer = () => {
        if (window.voiceChat && window.voiceChat.voiceAnalyzer) {
            // Update matrix based on voice level
            const originalUpdateUI = window.voiceChat.voiceAnalyzer.updateUI;
            window.voiceChat.voiceAnalyzer.updateUI = function() {
                // Call original method
                originalUpdateUI.call(this);
                
                // Update matrix effect
                matrixEffect.updateVoiceLevel(this.voiceCharacteristics.volume);
            };
        } else {
            // Check again after a short delay
            setTimeout(checkVoiceAnalyzer, 1000);
        }
    };
    
    // Start checking for voice analyzer
    checkVoiceAnalyzer();
    
    // Make matrix effect globally available
    window.matrixEffect = matrixEffect;
});

// Export for use in other files
window.ReactiveMatrixEffect = ReactiveMatrixEffect;
window.MatrixEffect = MatrixEffect;
