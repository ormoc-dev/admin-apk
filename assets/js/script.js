// Automatic APK Download - Pure JavaScript (No PHP)
// Uses iframe method to download from GitHub Releases without navigation

document.addEventListener('DOMContentLoaded', function() {
    const installButtons = document.querySelectorAll('.install-button, .install-button-small');
    
    installButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent navigation
            
            const url = this.getAttribute('href');
            
            if (!url) {
                alert('Download URL not configured');
                return false;
            }
            
            // Add loading state
            const originalText = this.textContent;
            this.textContent = 'Downloading...';
            this.style.opacity = '0.7';
            this.style.pointerEvents = 'none';
            
            // Create hidden iframe to trigger download (stays on same page)
            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'display:none;width:0;height:0;border:none;position:absolute;left:-9999px;visibility:hidden;';
            iframe.name = 'downloadFrame';
            iframe.src = url;
            
            // Append iframe to trigger download
            document.body.appendChild(iframe);
            
            // Also try creating a temporary link as backup
            const tempLink = document.createElement('a');
            tempLink.href = url;
            tempLink.download = 'app-release.apk';
            tempLink.style.display = 'none';
            document.body.appendChild(tempLink);
            
            // Try clicking the link (works in some browsers)
            setTimeout(() => {
                try {
                    tempLink.click();
                } catch (err) {
                    // Ignore if click fails
                }
            }, 100);
            
            // Clean up after download should have started
            setTimeout(() => {
                try {
                    if (iframe && iframe.parentNode) {
                        document.body.removeChild(iframe);
                    }
                } catch (err) {}
                
                try {
                    if (tempLink && tempLink.parentNode) {
                        document.body.removeChild(tempLink);
                    }
                } catch (err) {}
                
                // Reset button
                this.textContent = originalText;
                this.style.opacity = '1';
                this.style.pointerEvents = 'auto';
            }, 3000);
        });
    });
});
