// Automatic APK Download functionality - stays on same page
// Fetches file and triggers download without navigation

document.addEventListener('DOMContentLoaded', function() {
    const installButtons = document.querySelectorAll('.install-button, .install-button-small');
    
    installButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault(); // Always prevent navigation
            
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
            
            // Fetch the file from GitHub and create blob download
            // This keeps the user on the same page
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch file: ' + response.statusText);
                    }
                    return response.blob();
                })
                .then(blob => {
                    // Create a blob URL for download
                    const blobUrl = window.URL.createObjectURL(blob);
                    const downloadLink = document.createElement('a');
                    downloadLink.href = blobUrl;
                    downloadLink.download = 'app-release.apk'; // Set filename
                    downloadLink.style.display = 'none';
                    
                    // Append to body, trigger download, then remove
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                    
                    // Clean up blob URL after download starts
                    setTimeout(() => {
                        window.URL.revokeObjectURL(blobUrl);
                    }, 100);
                    
                    // Reset button state
                    this.textContent = originalText;
                    this.style.opacity = '1';
                    this.style.pointerEvents = 'auto';
                })
                .catch(error => {
                    console.error('Download error:', error);
                    
                    // Show error message
                    alert('Download failed. Please check your internet connection and try again.\n\nError: ' + error.message);
                    
                    // Reset button state
                    this.textContent = originalText;
                    this.style.opacity = '1';
                    this.style.pointerEvents = 'auto';
                });
        });
    });
});
