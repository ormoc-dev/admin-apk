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

    // Tab Switching Functionality
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');

            // Remove active class from all tabs
            navTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');

            // Hide all tab contents
            tabContents.forEach(content => {
                content.classList.remove('active');
            });

            // Show target tab content
            const targetContent = document.getElementById(targetTab + '-content');
            if (targetContent) {
                targetContent.classList.add('active');
                
                // Load components if Movies tab is clicked
                if (targetTab === 'movies') {
                    loadVideoComponents();
                }
            }
        });
    });

    // Component Loader Function
    async function loadComponent(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${filePath}`);
            }
            const html = await response.text();
            return html;
        } catch (error) {
            console.error('Error loading component:', error);
            return '';
        }
    }

    // Load Video Components
    async function loadVideoComponents() {
        const videoGrid = document.querySelector('.video-grid');
        if (!videoGrid) return;

        // Check if components are already loaded
        if (videoGrid.dataset.loaded === 'true') {
            return;
        }

        // List of video component files (can be moved to config file)
        const videoComponents = [
            'view/video/video-card.html',
            'view/video/video-card-2.html',
            'view/video/video-card-3.html'
            // Add more video components here or load from config
        ];

        // Clear existing content (including loading placeholder)
        videoGrid.innerHTML = '';

        // Load all components
        let loadedCount = 0;
        for (const componentPath of videoComponents) {
            const componentHTML = await loadComponent(componentPath);
            if (componentHTML) {
                videoGrid.insertAdjacentHTML('beforeend', componentHTML);
                loadedCount++;
            }
        }

        // Show message if no videos loaded
        if (loadedCount === 0) {
            videoGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #5f6368;">
                    <span class="material-icons" style="font-size: 48px; display: block; margin-bottom: 16px; opacity: 0.5;">movie</span>
                    <p>No videos available</p>
                </div>
            `;
        }

        // Mark as loaded
        videoGrid.dataset.loaded = 'true';
        
        // Initialize play button functionality after videos are loaded
        initializePlayButtons();
    }

    // Initialize Play Button Functionality
    function initializePlayButtons() {
        const playButtons = document.querySelectorAll('.play-button');
        const videoWrappers = document.querySelectorAll('.video-wrapper');
        
        playButtons.forEach((button, index) => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const wrapper = this.closest('.video-wrapper');
                const iframe = wrapper.querySelector('iframe');
                
                if (wrapper && iframe) {
                    // Mark as playing
                    wrapper.classList.add('playing');
                    
                    // Hide play overlay
                    const overlay = wrapper.querySelector('.video-play-overlay');
                    if (overlay) {
                        overlay.style.opacity = '0';
                        overlay.style.pointerEvents = 'none';
                    }
                    
                    // Try to play the video (Facebook iframes handle this automatically)
                    // The iframe will handle playback when clicked
                }
            });
        });
        
        // Also allow clicking anywhere on the video wrapper to play
        videoWrappers.forEach(wrapper => {
            wrapper.addEventListener('click', function(e) {
                // Don't trigger if clicking the play button
                if (e.target.closest('.play-button')) {
                    return;
                }
                
                const iframe = this.querySelector('iframe');
                const overlay = this.querySelector('.video-play-overlay');
                
                if (iframe && overlay && !this.classList.contains('playing')) {
                    // Mark as playing
                    this.classList.add('playing');
                    overlay.style.opacity = '0';
                    overlay.style.pointerEvents = 'none';
                }
            });
        });
    }

    // Load video components on page load if Movies tab is active
    if (document.getElementById('movies-content')?.classList.contains('active')) {
        loadVideoComponents();
    }
});
