document.addEventListener('DOMContentLoaded', () => {
    const meetingForm = document.getElementById('meetingForm');
    const generateLatestBtn = document.getElementById('generateLatest');
    const statusContainer = document.getElementById('status');

    // Function to show status messages
    function showStatus(message, isError = false) {
        statusContainer.textContent = message;
        statusContainer.className = 'status-container ' + (isError ? 'error' : 'success');
        statusContainer.style.display = 'block';
        
        // Hide status after 5 seconds
        setTimeout(() => {
            statusContainer.style.display = 'none';
        }, 5000);
    }

    // Handle meeting form submission
    meetingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
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
                showStatus('Bot scheduled successfully!');
                meetingForm.reset();
            } else {
                showStatus(data.error || 'Failed to schedule bot', true);
            }
        } catch (error) {
            showStatus('Error connecting to server', true);
            console.error('Error:', error);
        }
    });

    // Handle generate latest PDF button click
    generateLatestBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/generate-latest', {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (data.success) {
                showStatus(`PDF generated successfully! Path: ${data.pdfPath}`);
                
                // If the PDF is ready, offer to download it
                if (data.downloadUrl) {
                    window.open(data.downloadUrl, '_blank');
                }
            } else {
                showStatus(data.error || 'Failed to generate PDF', true);
            }
        } catch (error) {
            showStatus('Error connecting to server', true);
            console.error('Error:', error);
        }
    });
}); 