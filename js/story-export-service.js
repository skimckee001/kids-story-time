// Story Export Service - PDF and Audio Export
// File: js/story-export-service.js

class StoryExportService {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.isInitialized = true;
        console.log('Story Export Service initialized');
    }

    /**
     * Export story as PDF
     * @param {Object} story - Story object with title, content, metadata
     * @param {Array} images - Optional array of image URLs to include
     * @returns {Promise<Blob>} - PDF blob
     */
    async exportAsPDF(story, images = []) {
        try {
            // For demo, we'll create a printable HTML version
            // In production, use jsPDF or similar library
            const pdfContent = this.generatePrintableHTML(story, images);
            
            // Open in new window for printing
            const printWindow = window.open('', '_blank');
            printWindow.document.write(pdfContent);
            printWindow.document.close();
            
            // Auto-trigger print dialog after a short delay
            setTimeout(() => {
                printWindow.print();
            }, 500);
            
            return true;
        } catch (error) {
            console.error('PDF export error:', error);
            throw error;
        }
    }

    /**
     * Generate printable HTML for PDF export
     */
    generatePrintableHTML(story, images) {
        const { title, content, metadata } = story;
        const date = new Date().toLocaleDateString();
        const childName = metadata?.childName || 'Young Reader';
        const stars = metadata?.stars || 0;
        const achievements = metadata?.achievements || 0;
        const isPremium = metadata?.isPremium || false;
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    @page {
                        size: letter;
                        margin: 0.75in;
                    }
                    
                    body {
                        font-family: 'Arial', 'Helvetica', sans-serif;
                        line-height: 1.75;
                        color: #333;
                        max-width: 7in;
                        margin: 0 auto;
                    }
                    
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding-bottom: 12px;
                        border-bottom: 2px solid #667eea;
                        margin-bottom: 20px;
                    }
                    
                    .header-left {
                        flex: 1;
                    }
                    
                    h1 {
                        color: #667eea;
                        font-size: 20pt;
                        margin: 0 0 4px 0;
                        font-weight: bold;
                    }
                    
                    .site-name {
                        font-size: 14pt;
                        font-weight: bold;
                        background: linear-gradient(135deg, #FF6B9D, #4ECDC4);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        margin: 4px 0 8px 0;
                    }
                    
                    .story-for {
                        font-size: 11pt;
                        color: #666;
                        font-style: italic;
                    }
                    
                    .header-stats {
                        display: flex;
                        gap: 20px;
                        font-size: 10pt;
                        color: #666;
                    }
                    
                    .stat {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }
                    
                    .content {
                        font-size: 11.5pt;
                        text-align: justify;
                        margin-top: 20px;
                    }
                    
                    .content p {
                        margin-bottom: 0.9em;
                        text-indent: 0;
                        text-align: left;
                    }
                    
                    .image-container {
                        float: right;
                        margin: 0 0 1em 1em;
                        page-break-inside: avoid;
                        width: 45%;
                    }
                    
                    .image-container img {
                        width: 100%;
                        max-height: 3.5in;
                        border-radius: 6px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    
                    .footer {
                        position: fixed;
                        bottom: 0.5in;
                        left: 0.75in;
                        right: 0.75in;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding-top: 8px;
                        border-top: 1px solid #e5e7eb;
                        font-size: 9pt;
                        color: #999;
                    }
                    
                    .footer-left {
                        font-size: 8pt;
                    }
                    
                    .footer-upgrade {
                        background: linear-gradient(90deg, #667eea, #764ba2);
                        color: white;
                        padding: 3px 10px;
                        border-radius: 4px;
                        font-size: 8pt;
                        text-decoration: none;
                    }
                    
                    @media print {
                        .no-print {
                            display: none;
                        }
                        
                        .footer {
                            position: static;
                            margin-top: 2em;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-left">
                        <h1>${title}</h1>
                        <div class="site-name">KidsStoryTime.org</div>
                        <div class="story-for">Story for ${childName}</div>
                    </div>
                    <div class="header-stats">
                        <div class="stat">
                            <span>⭐</span>
                            <span>${stars} stars</span>
                        </div>
                        <div class="stat">
                            <span>🏆</span>
                            <span>${achievements} achievements</span>
                        </div>
                    </div>
                </div>
                
                <div class="content">
                    ${(() => {
                        const paragraphs = content.split('\n').filter(p => p.trim());
                        let html = '';
                        
                        // Add first paragraph
                        if (paragraphs.length > 0) {
                            html += `<p>${paragraphs[0]}</p>`;
                        }
                        
                        // Add image after first paragraph if available
                        if (images.length > 0) {
                            html += `
                                <div class="image-container">
                                    <img src="${images[0].url}" alt="Story illustration">
                                </div>
                            `;
                        }
                        
                        // Add remaining paragraphs
                        if (paragraphs.length > 1) {
                            html += paragraphs.slice(1).map(p => `<p>${p}</p>`).join('');
                        }
                        
                        return html;
                    })()}
                </div>
                
                ${images.length > 1 ? images.slice(1).map(img => `
                    <div class="image-container">
                        <img src="${img.url}" alt="Story illustration">
                    </div>
                `).join('') : ''}
                
                <div class="footer">
                    <div class="footer-left">
                        KidsStoryTime.ai • ${date}
                    </div>
                    ${!isPremium ? `
                        <a href="https://kidsstorytime.ai/upgrade" class="footer-upgrade">
                            📄 Upgrade for unlimited PDF exports & illustrations
                        </a>
                    ` : ''}
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Export story as audio file
     * @param {Object} story - Story object
     * @param {Object} options - Export options (voice, speed, etc.)
     * @returns {Promise<Blob>} - Audio blob
     */
    async exportAsAudio(story, options = {}) {
        try {
            // Check if we have voice service available
            if (!window.aiVoiceService || !window.aiVoiceService.isAvailable()) {
                throw new Error('Voice service not available');
            }

            // For Web Speech API, we can't directly export to file
            // We'll use MediaRecorder API to record the speech
            const audioBlob = await this.recordSpeech(story, options);
            
            if (audioBlob) {
                // Create download link
                this.downloadAudio(audioBlob, `${story.title}.mp3`);
                return audioBlob;
            }
            
            // Fallback: Inform user about limitations
            alert('Audio export requires browser support for recording. You can use the "Read Aloud" feature instead.');
            return null;
            
        } catch (error) {
            console.error('Audio export error:', error);
            throw error;
        }
    }

    /**
     * Record speech synthesis to audio blob
     */
    async recordSpeech(story, options) {
        try {
            // Check for MediaRecorder support
            if (!navigator.mediaDevices || !window.MediaRecorder) {
                console.log('MediaRecorder not supported');
                return null;
            }

            // Get audio context and destination
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const dest = audioContext.createMediaStreamDestination();
            
            // Create oscillator for test (in production, capture speech synthesis)
            // Note: Web Speech API doesn't directly support audio capture
            // This is a limitation of the browser API
            
            // Alternative approach: Use text-to-speech API service
            return await this.generateAudioViaAPI(story, options);
            
        } catch (error) {
            console.error('Recording error:', error);
            return null;
        }
    }

    /**
     * Generate audio via external API (placeholder)
     */
    async generateAudioViaAPI(story, options) {
        // In production, this would call a backend service
        // that uses Google Cloud TTS, Amazon Polly, or similar
        
        // For now, create a simple notification
        const storyText = `${story.title}. ${story.content}`;
        
        // Create a simple audio URL for demo
        // In production, this would be the actual generated audio
        const audioData = {
            text: storyText,
            voice: options.voice || 'default',
            speed: options.speed || 1.0,
            format: 'mp3'
        };
        
        console.log('Audio generation requested:', audioData);
        
        // Show user instructions for manual audio recording
        this.showAudioExportInstructions();
        
        return null;
    }

    /**
     * Show instructions for audio export
     */
    showAudioExportInstructions() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-3xl p-6 max-w-md w-full">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Audio Export</h2>
                <div class="space-y-4">
                    <p class="text-gray-600">To save the story as audio:</p>
                    <ol class="list-decimal list-inside space-y-2 text-gray-600">
                        <li>Click "Read Aloud" to start narration</li>
                        <li>Use your device's screen recorder to capture audio</li>
                        <li>Save the recording when complete</li>
                    </ol>
                    <p class="text-sm text-gray-500">
                        Direct audio export will be available in the premium version.
                    </p>
                    <button class="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition">
                        Got it!
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('button').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Download audio blob as file
     */
    downloadAudio(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Export story as text file
     */
    exportAsText(story) {
        const content = `${story.title}\n\n${story.content}`;
        const blob = new Blob([content], { type: 'text/plain' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${story.title}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Export story as Word document (simplified)
     */
    exportAsWord(story) {
        // Create a simple HTML that Word can open
        const wordContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>${story.title}</title>
                <style>
                    body { font-family: Georgia, serif; line-height: 1.6; }
                    h1 { color: #667eea; }
                    p { margin-bottom: 1em; }
                </style>
            </head>
            <body>
                <h1>${story.title}</h1>
                ${story.content.split('\n').filter(p => p.trim()).map(p => 
                    `<p>${p}</p>`
                ).join('')}
            </body>
            </html>
        `;
        
        const blob = new Blob([wordContent], { 
            type: 'application/msword' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${story.title}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Create global instance
window.storyExportService = new StoryExportService();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StoryExportService;
}