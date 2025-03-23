document.addEventListener('DOMContentLoaded', () => {
    const meetingForm = document.getElementById('meetingForm');
    const generateLatestBtn = document.getElementById('generateLatest');
    const statusContainer = document.getElementById('status');
    
    // Add loading state to buttons
    const setButtonLoading = (button, isLoading) => {
        const originalText = button.dataset.originalText || button.innerHTML;
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing...`;
        } else {
            button.disabled = false;
            button.innerHTML = originalText;
        }
        button.dataset.originalText = originalText;
    };

    // Function to show status messages with icons
    function showStatus(message, isError = false) {
        console.log(`Status message: ${message} (${isError ? 'error' : 'success'})`);
        const icon = isError ? 'fa-circle-exclamation' : 'fa-circle-check';
        statusContainer.innerHTML = `
            <i class="fas ${icon}"></i>
            ${message}
        `;
        statusContainer.className = 'status-container ' + (isError ? 'error' : 'success');
        statusContainer.style.display = 'block';
        
        // Add animation
        statusContainer.style.animation = 'fadeIn 0.3s ease-out';
        
        // Hide status after 5 seconds with fade out
        setTimeout(() => {
            statusContainer.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                statusContainer.style.display = 'none';
            }, 300);
        }, 5000);
    }

    // Add input validation and formatting
    const meetingLinkInput = document.getElementById('meetingLink');
    meetingLinkInput.addEventListener('input', (e) => {
        const input = e.target;
        if (input.value.startsWith('http')) {
            input.classList.add('valid');
            input.classList.remove('invalid');
        } else if (input.value) {
            input.classList.add('invalid');
            input.classList.remove('valid');
        } else {
            input.classList.remove('valid', 'invalid');
        }
    });

    // Handle meeting form submission
    meetingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = meetingForm.querySelector('button[type="submit"]');
        setButtonLoading(submitBtn, true);
        
        const meetingLink = document.getElementById('meetingLink').value;
        const meetingTitle = document.getElementById('meetingTitle').value;
        
        try {
            const response = await fetch('/api/schedule-bot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    meetingLink,
                    meetingTitle
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showStatus('Bot scheduled successfully! 🤖');
                meetingForm.reset();
                document.querySelectorAll('input').forEach(input => {
                    input.classList.remove('valid', 'invalid');
                });
            } else {
                showStatus(data.error || 'Failed to schedule bot', true);
            }
        } catch (error) {
            showStatus('Error connecting to server', true);
            console.error('Error:', error);
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });

    // Handle generate latest PDF button click
    generateLatestBtn.addEventListener('click', async () => {
        console.log('Generate Latest PDF button clicked');
        setButtonLoading(generateLatestBtn, true);
        
        try {
            console.log('Sending request to /api/generate-latest');
            const response = await fetch('/api/generate-latest', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            console.log('Response received:', response.status);
            const data = await response.json();
            console.log('Response data:', data);
            
            if (data.success) {
                showStatus(`PDF generated successfully! 📄`);
                
                // If the PDF is ready, offer to download it
                if (data.downloadUrl) {
                    console.log('Opening PDF at:', data.downloadUrl);
                    // Wait a moment to ensure the PDF is ready
                    setTimeout(() => {
                        const pdfUrl = new URL(data.downloadUrl, window.location.origin).href;
                        console.log('Full PDF URL:', pdfUrl);
                        window.open(pdfUrl, '_blank');
                    }, 1000);
                } else {
                    console.warn('No download URL in response');
                    showStatus('PDF generated but no download link available', true);
                }
            } else {
                console.error('Generation failed:', data.error);
                showStatus(data.error || 'Failed to generate PDF', true);
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            showStatus('Error connecting to server', true);
        } finally {
            setButtonLoading(generateLatestBtn, false);
        }
    });

    // Handle generate study notes button click
    document.getElementById('generateStudyNotes').addEventListener('click', async () => {
        const button = document.getElementById('generateStudyNotes');
        setButtonLoading(button, true);
        
        try {
            const response = await fetch('/api/generate-study-notes', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                showStatus('Study notes generated successfully! 📚', 'success');
                
                // Wait a moment to ensure the PDF is ready
                setTimeout(() => {
                    // Open PDF in new window using the provided URL
                    const pdfUrl = data.pdfUrl || `/${data.pdfPath}`;
                    const fullUrl = new URL(pdfUrl, window.location.origin).href;
                    window.open(fullUrl, '_blank', 'noopener,noreferrer');
                }, 1000);
            } else {
                showStatus(data.error || 'Failed to generate study notes', 'error');
            }
        } catch (error) {
            showStatus('Error generating study notes', 'error');
            console.error('Error:', error);
        } finally {
            setButtonLoading(button, false);
        }
    });

    // Add hover effects to cards
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'var(--shadow)';
        });
    });
}); 