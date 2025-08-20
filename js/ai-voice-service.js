// AI Voice Service for Premium Text-to-Speech
// File: js/ai-voice-service.js

class AIVoiceService {
    constructor() {
        this.isInitialized = false;
        this.isSpeaking = false;
        this.isPaused = false;
        this.currentUtterance = null;
        this.speechSynthesis = window.speechSynthesis;
        this.supportedVoices = [];
        this.selectedVoice = null;
        this.speechRate = 0.9; // Slightly slower for children
        this.speechPitch = 1.1; // Slightly higher pitch for friendliness
        this.init();
    }

    async init() {
        try {
            // Check if Web Speech API is available
            if ('speechSynthesis' in window) {
                // Load available voices
                this.loadVoices();
                
                // Some browsers need a user interaction first
                if (this.speechSynthesis.getVoices().length === 0) {
                    // Wait for voices to load
                    this.speechSynthesis.addEventListener('voiceschanged', () => {
                        this.loadVoices();
                    });
                }
                
                console.log('AI Voice Service initialized with Web Speech API');
                this.isInitialized = true;
            } else {
                console.warn('Web Speech API not available');
                this.isInitialized = false;
            }
        } catch (error) {
            console.error('Failed to initialize AI Voice Service:', error);
            this.isInitialized = false;
        }
    }

    loadVoices() {
        const voices = this.speechSynthesis.getVoices();
        
        // Filter for child-friendly voices
        this.supportedVoices = voices.filter(voice => {
            // Prefer female voices for storytelling (generally more soothing for children)
            // Include English voices
            return voice.lang.startsWith('en') && 
                   (voice.name.includes('Female') || 
                    voice.name.includes('Samantha') || 
                    voice.name.includes('Victoria') ||
                    voice.name.includes('Karen') ||
                    voice.name.includes('Google US English') ||
                    voice.name.includes('Microsoft'));
        });

        // Add all voices as fallback if no filtered voices found
        if (this.supportedVoices.length === 0) {
            this.supportedVoices = voices.filter(voice => voice.lang.startsWith('en'));
        }

        // Select default voice
        if (this.supportedVoices.length > 0) {
            this.selectedVoice = this.supportedVoices[0];
        }
    }

    isAvailable() {
        return this.isInitialized && this.supportedVoices.length > 0;
    }

    getAvailableVoices() {
        return this.supportedVoices.map(voice => ({
            id: voice.voiceURI,
            name: voice.name,
            lang: voice.lang,
            local: voice.localService
        }));
    }

    async speakText(text, options = {}) {
        if (!this.isAvailable()) {
            throw new Error('Voice narration not available');
        }

        // Stop any current speech
        this.stop();

        return new Promise((resolve, reject) => {
            try {
                // Create utterance
                this.currentUtterance = new SpeechSynthesisUtterance(text);
                
                // Set voice
                if (options.voiceId) {
                    const voice = this.supportedVoices.find(v => v.voiceURI === options.voiceId);
                    if (voice) {
                        this.currentUtterance.voice = voice;
                    }
                } else if (this.selectedVoice) {
                    this.currentUtterance.voice = this.selectedVoice;
                }
                
                // Set speech parameters
                this.currentUtterance.rate = options.rate || this.speechRate;
                this.currentUtterance.pitch = options.pitch || this.speechPitch;
                this.currentUtterance.volume = options.volume || 1.0;
                
                // Event handlers
                this.currentUtterance.onstart = () => {
                    this.isSpeaking = true;
                    this.isPaused = false;
                    if (options.onStart) options.onStart();
                };
                
                this.currentUtterance.onend = () => {
                    this.isSpeaking = false;
                    this.isPaused = false;
                    if (options.onEnd) options.onEnd();
                    resolve();
                };
                
                this.currentUtterance.onerror = (event) => {
                    this.isSpeaking = false;
                    this.isPaused = false;
                    console.error('Speech synthesis error:', event);
                    if (options.onError) options.onError(event);
                    reject(event);
                };
                
                this.currentUtterance.onpause = () => {
                    this.isPaused = true;
                    if (options.onPause) options.onPause();
                };
                
                this.currentUtterance.onresume = () => {
                    this.isPaused = false;
                    if (options.onResume) options.onResume();
                };
                
                // Highlight words as they're spoken (if callback provided)
                if (options.onWord) {
                    this.currentUtterance.onboundary = (event) => {
                        if (event.name === 'word') {
                            options.onWord(event.charIndex, event.charLength);
                        }
                    };
                }
                
                // Start speaking
                this.speechSynthesis.speak(this.currentUtterance);
                
            } catch (error) {
                console.error('Error starting speech:', error);
                reject(error);
            }
        });
    }

    pause() {
        if (this.isSpeaking && !this.isPaused && this.speechSynthesis) {
            this.speechSynthesis.pause();
            this.isPaused = true;
        }
    }

    resume() {
        if (this.isSpeaking && this.isPaused && this.speechSynthesis) {
            this.speechSynthesis.resume();
            this.isPaused = false;
        }
    }

    stop() {
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
            this.isSpeaking = false;
            this.isPaused = false;
            this.currentUtterance = null;
        }
    }

    setVoice(voiceId) {
        const voice = this.supportedVoices.find(v => v.voiceURI === voiceId);
        if (voice) {
            this.selectedVoice = voice;
            return true;
        }
        return false;
    }

    setRate(rate) {
        // Rate should be between 0.1 and 2
        this.speechRate = Math.max(0.1, Math.min(2, rate));
    }

    setPitch(pitch) {
        // Pitch should be between 0 and 2
        this.speechPitch = Math.max(0, Math.min(2, pitch));
    }

    getStatus() {
        return {
            isAvailable: this.isAvailable(),
            isSpeaking: this.isSpeaking,
            isPaused: this.isPaused,
            currentVoice: this.selectedVoice ? this.selectedVoice.name : null,
            rate: this.speechRate,
            pitch: this.speechPitch
        };
    }

    // Fallback for older generateVoiceAudio method
    async generateVoiceAudio(text, voiceId = 'child-friendly-female', options = {}) {
        console.log(`Generating voice audio with voice: ${voiceId}`);
        console.log(`Text length: ${text.length} characters`);

            // Demo implementation - in production, replace with actual API calls
            const result = await this.simulateAIVoiceGeneration(text, voiceId, options);
            
            return result;
        } catch (error) {
            console.error('AI voice generation failed:', error);
            throw error;
        }
    }

    async simulateAIVoiceGeneration(text, voiceId, options) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
        
        // For demo purposes, we'll use the Web Audio API to create a simple synthetic voice
        // In production, this would be replaced with actual AI voice service calls
        
        // Option 1: Return null to fallback to basic TTS (current implementation)
        // return null;
        
        // Option 2: Create a simple demo audio using Web Audio API
        return await this.createDemoAudio(text, voiceId);
    }

    async createDemoAudio(text, voiceId) {
        try {
            // Create a simple audio demonstration
            // In a real implementation, this would be the URL returned from the AI service
            
            // For now, we'll create a very basic synthetic audio using Web Audio API
            // This is just for demonstration - real AI voices would be much higher quality
            
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const duration = Math.min(text.length * 0.1, 30); // Max 30 seconds for demo
            
            const buffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            // Create a simple tone pattern based on text content
            for (let i = 0; i < data.length; i++) {
                const frequency = 200 + (text.charCodeAt(i % text.length) % 400);
                data[i] = Math.sin(2 * Math.PI * frequency * i / audioContext.sampleRate) * 0.1;
            }
            
            // Convert to blob URL
            const audioData = this.audioBufferToWav(buffer);
            const blob = new Blob([audioData], { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(blob);
            
            return audioUrl;
        } catch (error) {
            console.error('Demo audio creation failed:', error);
            return null;
        }
    }

    audioBufferToWav(buffer) {
        const length = buffer.length;
        const arrayBuffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(arrayBuffer);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, buffer.sampleRate, true);
        view.setUint32(28, buffer.sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);
        
        // Convert buffer to 16-bit PCM
        const data = buffer.getChannelData(0);
        let offset = 44;
        for (let i = 0; i < length; i++) {
            const sample = Math.max(-1, Math.min(1, data[i]));
            view.setInt16(offset, sample * 0x7FFF, true);
            offset += 2;
        }
        
        return arrayBuffer;
    }

    // Production integration examples (commented out for demo)
    
    /*
    // ElevenLabs integration example
    async generateWithElevenLabs(text, voiceId) {
        const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': 'your-elevenlabs-api-key'
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_monolingual_v1",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                }
            })
        });
        
        if (response.ok) {
            const audioBlob = await response.blob();
            return URL.createObjectURL(audioBlob);
        }
        throw new Error('ElevenLabs API error');
    }
    */

    /*
    // Azure Cognitive Services integration example
    async generateWithAzure(text, voiceId) {
        const response = await fetch('https://your-region.tts.speech.microsoft.com/cognitiveservices/v1', {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': 'your-azure-key',
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
            },
            body: `<speak version='1.0' xml:lang='en-US'>
                <voice xml:lang='en-US' xml:gender='Female' name='en-US-JennyNeural'>
                    ${text}
                </voice>
            </speak>`
        });
        
        if (response.ok) {
            const audioBlob = await response.blob();
            return URL.createObjectURL(audioBlob);
        }
        throw new Error('Azure TTS API error');
    }
    */
}

// Create global AI voice service instance
window.aiVoiceService = new AIVoiceService();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIVoiceService;
}