// GitHub Release APK Download functionality
document.addEventListener('DOMContentLoaded', function() {
    const installButtons = document.querySelectorAll('.install-button, .install-button-small');
    
    installButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const url = this.getAttribute('href');
            
            // Check if URL is configured (not the placeholder)
            if (!url || url.includes('YOUR_USERNAME') || url.includes('YOUR_REPO')) {
                e.preventDefault();
                alert('Please update the GitHub Release URL in index.html with your actual repository URL');
                return false;
            }
            
            // Add loading state
            const originalText = this.textContent;
            this.textContent = 'Downloading...';
            this.style.opacity = '0.7';
            this.style.pointerEvents = 'none';
            
            // GitHub Releases will handle the download automatically
            // The link opens in a new tab and triggers download
            
            // Reset button text after a delay
            setTimeout(() => {
                this.textContent = originalText;
                this.style.opacity = '1';
                this.style.pointerEvents = 'auto';
            }, 2000);
        });
    });
});
