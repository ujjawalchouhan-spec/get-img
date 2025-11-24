async function generateImage() {
    const prompt = document.getElementById('prompt').value;
    const btn = document.getElementById('generateBtn');
    const status = document.getElementById('status');
    const result = document.getElementById('result');

    if (!prompt) {
        alert('Please enter a prompt');
        return;
    }

    btn.disabled = true;
    status.textContent = 'Generating image... This may take a few seconds.';
    result.innerHTML = '';

    try {
        const response = await fetch('/api/v1/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();

        if (data.success) {
            status.textContent = `Success! Provider used: ${data.providerUsed}`;
            const resultDiv = document.getElementById('result');
            const img = document.getElementById('generatedImage');
            
            if (data.imageUrl) {
                img.src = data.imageUrl;
            } else if (data.imageBase64) {
                img.src = `data:image/png;base64,${data.imageBase64}`;
            }
            
            resultDiv.classList.remove('hidden');
        } else {
            status.textContent = '';
            result.innerHTML = `<p class="error">Error: ${data.error?.message || 'Unknown error'}</p>`;
        }
    } catch (error) {
        status.textContent = '';
        result.innerHTML = `<p class="error">Network Error: ${error.message}</p>`;
    } finally {
        btn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('generateBtn');
    if (btn) {
        btn.addEventListener('click', generateImage);
    }
});
