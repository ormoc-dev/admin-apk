// Automatic APK Download with Progress Indicator
// Prevents double downloads and shows progress

document.addEventListener('DOMContentLoaded', function() {
    const installButtons = document.querySelectorAll('.install-button, .install-button-small');
    let isDownloading = false; // Track download state to prevent double downloads
    
    installButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Prevent double download
            if (isDownloading) {
                return false;
            }
            
            const url = this.getAttribute('href');
            const buttonElement = this; // Store reference to button
            
            if (!url) {
                alert('Download URL not configured');
                return false;
            }
            
            // Mark as downloading
            isDownloading = true;
            
            // Store original button state
            const originalText = buttonElement.textContent;
            const originalHTML = buttonElement.innerHTML;
            
            // Create progress container
            const progressContainer = document.createElement('div');
            progressContainer.className = 'download-progress';
            progressContainer.innerHTML = `
                <div class="progress-bar-container">
                    <div class="progress-bar" id="progressBar-${Date.now()}"></div>
                </div>
                <span class="progress-text">Preparing download...</span>
            `;
            
            // Replace button content with progress
            buttonElement.innerHTML = '';
            buttonElement.appendChild(progressContainer);
            buttonElement.style.opacity = '1';
            buttonElement.style.pointerEvents = 'none';
            buttonElement.style.cursor = 'not-allowed';
            
            // Get progress bar element
            const progressBar = progressContainer.querySelector('.progress-bar');
            const progressText = progressContainer.querySelector('.progress-text');
            
            // Simulate progress (since we can't track actual download progress from GitHub)
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 90) progress = 90; // Cap at 90% until download actually starts
                
                progressBar.style.width = progress + '%';
                
                if (progress < 30) {
                    progressText.textContent = 'Preparing download...';
                } else if (progress < 60) {
                    progressText.textContent = 'Connecting to server...';
                } else if (progress < 90) {
                    progressText.textContent = 'Starting download...';
                }
            }, 200);
            
            // Create hidden iframe to trigger download (single method to avoid double download)
            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'display:none;width:0;height:0;border:none;position:absolute;left:-9999px;visibility:hidden;';
            iframe.name = 'downloadFrame-' + Date.now();
            
            // Set iframe source to trigger download
            iframe.onload = function() {
                // Download started
                clearInterval(progressInterval);
                progressBar.style.width = '100%';
                progressText.textContent = 'Download started!';
                
                // Reset button after a delay
                setTimeout(() => {
                    try {
                        if (iframe && iframe.parentNode) {
                            document.body.removeChild(iframe);
                        }
                    } catch (err) {}
                    
                    // Reset button
                    buttonElement.innerHTML = originalHTML;
                    buttonElement.style.pointerEvents = 'auto';
                    buttonElement.style.cursor = 'pointer';
                    isDownloading = false;
                }, 1500);
            };
            
            iframe.onerror = function() {
                clearInterval(progressInterval);
                progressText.textContent = 'Download failed. Click to retry.';
                buttonElement.style.pointerEvents = 'auto';
                buttonElement.style.cursor = 'pointer';
                isDownloading = false;
            };
            
            // Append iframe and set source
            document.body.appendChild(iframe);
            iframe.src = url;
            
            // Cleanup timeout (safety net)
            setTimeout(() => {
                clearInterval(progressInterval);
                try {
                    if (iframe && iframe.parentNode) {
                        document.body.removeChild(iframe);
                    }
                } catch (err) {}
                
                if (isDownloading) {
                    // Reset if still downloading
                    buttonElement.innerHTML = originalHTML;
                    buttonElement.style.pointerEvents = 'auto';
                    buttonElement.style.cursor = 'pointer';
                    isDownloading = false;
                }
            }, 10000);
        });
    });
});
