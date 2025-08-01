document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const generateBtn = document.getElementById('generateButton');
    const sampleBtn = document.getElementById('sampleButton');
    const previewBtn = document.getElementById('openPreviewButton');
    const downloadBtn = document.getElementById('downloadButton');
    const closePreviewBtn = document.getElementById('closePreview');
    const previewModal = document.getElementById('previewModal');
    const previewFrame = document.getElementById('previewFrame');
    const tabs = document.querySelectorAll('.tab');
    const copyButtons = document.querySelectorAll('.copy-button');
    const toast = document.getElementById('toast');
    const userPrompt = document.getElementById('userPrompt');
    const retryNotice = document.getElementById('retryNotice');
    
    // State variables
    let currentProjectData = null;
    let isGenerating = false;
    let retryCount = 0;
    const MAX_RETRIES = 2;
    
    // Tab switching functionality
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.code-display').forEach(container => {
                container.style.display = 'none';
            });
            
            const tabType = tab.getAttribute('data-tab');
            document.getElementById(`${tabType}CodeContainer`).style.display = 'block';
        });
    });

    // Copy code functionality
    copyButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.getAttribute('data-target');
            const codeElement = document.getElementById(targetId);
            const textToCopy = codeElement.textContent;
            
            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast('Code copied to clipboard!');
            }).catch(err => {
                showToast('Failed to copy code!', true);
                console.error('Copy error: ', err);
            });
        });
    });

    // Toast notification
    function showToast(message, isError = false) {
        toast.textContent = message;
        toast.className = isError ? 'toast error show' : 'toast show';
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Loading state management
    function showLoading() {
        document.getElementById('loadingSpinner').style.display = 'flex';
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        retryNotice.style.display = 'none';
    }

    function hideLoading() {
        document.getElementById('loadingSpinner').style.display = 'none';
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate Website';
    }

    function showRetryNotice() {
        retryNotice.style.display = 'block';
    }

    // Display generated code
    function displayOutput(html, css, js) {
        document.getElementById('htmlCode').textContent = html;
        document.getElementById('cssCode').textContent = css;
        document.getElementById('jsCode').textContent = js;
        
        document.getElementById('outputSection').style.display = 'block';
        currentProjectData = { html, css, js };
        
        previewBtn.style.display = 'inline-flex';
        downloadBtn.style.display = 'inline-flex';
    }

    // Preview functionality
    function openPreview() {
        if (!currentProjectData) {
            showToast('No website available. Please generate first.', true);
            return;
        }

        try {
            // Create a complete HTML document with isolated styles
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>AI Generated Website</title>
                    <style>
                        /* Reset conflicting styles */
                        * {
                            box-sizing: border-box;
                            margin: 0;
                            padding: 0;
                            font-family: inherit;
                        }
                        
                        /* Include the generated CSS */
                        ${currentProjectData.css}
                        
                        /* Ensure proper sizing */
                        html, body {
                            width: 100%;
                            height: 100%;
                            overflow: auto;
                        }
                    </style>
                </head>
                <body>
                    ${currentProjectData.html}
                    <script>
                        // Add the generated JS
                        ${currentProjectData.js}
                    </script>
                </body>
                </html>
            `;
            
            // Create a blob and set as iframe source
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            previewFrame.src = url;
            previewModal.classList.add('visible');
            
        } catch (error) {
            console.error("Preview error:", error);
            showToast('Failed to open preview. Please try again.', true);
        }
    }

    // Close preview
    closePreviewBtn.addEventListener('click', () => {
        previewModal.classList.remove('visible');
        previewFrame.src = '';
    });

    // Download project
    function downloadProject() {
        if (!currentProjectData) {
            showToast('No website to download', true);
            return;
        }
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AI Generated Website</title>
                <style>${currentProjectData.css}</style>
            </head>
            <body>
                ${currentProjectData.html}
                <script>${currentProjectData.js}</script>
            </body>
            </html>
        `;
        
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ai-website.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Website downloaded!');
    }

    // Load sample prompt
    sampleBtn.addEventListener('click', () => {
        const samplePrompt = "Design a responsive portfolio website with: " +
            "- Dark/light mode toggle " +
            "- Animated hero section with typewriter effect " +
            "- Project showcase grid with hover animations " +
            "- Skills section with progress bars " +
            "- Contact form with validation " +
            "- Smooth scrolling navigation " +
            "- Modern glassmorphism design " +
            "- Vibrant color scheme with gradients";
            
        userPrompt.value = samplePrompt;
        showToast('Sample prompt loaded!');
    });

    // Generate website functionality
    generateBtn.addEventListener('click', generateWebsite);
    previewBtn.addEventListener('click', openPreview);
    downloadBtn.addEventListener('click', downloadProject);
    
    async function generateWebsite() {
        const prompt = userPrompt.value.trim();
        if (!prompt) {
            showToast('Please enter a website description', true);
            return;
        }

        if (isGenerating) {
            showToast('Please wait for current generation to complete');
            return;
        }

        isGenerating = true;
        showLoading();

        try {
            // Add timeout handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const response = await fetch('/.netlify/functions/generate-website', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Get response text first to handle invalid JSON
            const responseText = await response.text();
            
            if (!responseText) {
                throw new Error('Server returned empty response');
            }

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error("JSON parse error:", parseError, "Response text:", responseText);
                throw new Error('Invalid JSON response from server');
            }

            if (!response.ok) {
                let errorMessage = `Server error: ${response.status}`;
                if (data.error) errorMessage += ` - ${data.error}`;
                if (data.details) errorMessage += ` (${data.details})`;
                throw new Error(errorMessage);
            }

            // Validate the response
            if (!data.html || !data.css) {
                throw new Error('Incomplete website data received from AI');
            }
            
            displayOutput(data.html, data.css, data.js || '');
            showToast('Website generated successfully!');
            retryCount = 0;

        } catch (error) {
            console.error("Generation error:", error);
            
            // Handle timeout specifically
            if (error.name === 'AbortError') {
                showToast('Request timed out. Please try a simpler prompt.', true);
            } 
            // Handle JSON parsing errors specifically
            else if (error.message.includes('Unexpected end of JSON input') || 
                     error.message.includes('Invalid JSON') || 
                     error.message.includes('empty response')) {
                
                if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    showRetryNotice();
                    showToast(`Retrying (${retryCount}/${MAX_RETRIES})...`);
                    setTimeout(generateWebsite, 1500);
                    return;
                } else {
                    showToast('Server returned invalid response. Try a simpler prompt.', true);
                }
            } else {
                let errorMessage = error.message;
                
                // Simplify API key errors
                if (errorMessage.includes('API_KEY') || errorMessage.includes('key')) {
                    errorMessage = 'Server configuration issue. Please contact support.';
                }
                
                showToast(`Error: ${errorMessage}`, true);
            }
            retryCount = 0;
            
        } finally {
            isGenerating = false;
            hideLoading();
        }
    }

    // Animated background on scroll
    window.addEventListener('scroll', () => {
        const yPos = -window.scrollY / 3;
        document.body.style.backgroundPosition = `center ${yPos}px`;
    });
    
    // Add pulse animation to generate button
    generateBtn.classList.add('pulse');
    
    // Remove pulse after first interaction
    generateBtn.addEventListener('click', () => {
        generateBtn.classList.remove('pulse');
    }, { once: true });
});