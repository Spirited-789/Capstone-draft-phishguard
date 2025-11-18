// --- 1. ADD YOUR API KEY AND THE NEW LLM FUNCTION ---

// --- Replace with your actual API key ---
const GEMINI_API_KEY = "AIzaSyBBxz3qYOMzt-1UrbvGHMlDLFDGjBY2-V8";
// Change 'gemini-pro' to 'gemini-1.0-pro'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Calls the Gemini LLM to get a simple explanation for the block.
 * @param {string} blockedUrl - The URL that was blocked.
 * @param {string} severity - The severity of the threat (e.g., 'malicious', 'suspicious').
 */
async function getPhishingExplanation(blockedUrl, severity) {
    // Find the element to put the explanation in
    const explanationElement = document.getElementById('llm-explanation');
    if (!explanationElement) {
        console.warn("Could not find 'llm-explanation' element to display AI text.");
        return; 
    }

    explanationElement.textContent = "Analyzing threat..."; // Loading text

    // We can use the 'severity' you already have to make the prompt even better
    const prompt = `
      A website (${blockedUrl}) was just blocked with a severity of "${severity}".
      In 2-3 simple sentences, explain to a non-technical user what this means
      and why it's dangerous to visit sites flagged as "${severity}".
      Do not use the specific URL in your answer.
      Do not say "I am an AI."
      Start the explanation directly.
    `;

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "contents": [{ "parts": [{ "text": prompt }] }]
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status: ${response.status}`);
        }

        const data = await response.json();
        const explanation = data.candidates[0].content.parts[0].text;
        explanationElement.textContent = explanation;

    } catch (error) {
        console.error("Error fetching LLM explanation:", error);
        // Fallback text if the API fails
        explanationElement.textContent = "This site was blocked because it is on a list of known malicious websites. Visiting it could expose you to scams, viruses, or attempts to steal your passwords.";
    }
}


// --- 2. YOUR EXISTING CODE, WITH TWO NEW LINES ADDED ---

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const targetUrl = params.get('url');
  const bypassData = JSON.parse(localStorage.getItem('phishguard-bypass'));

  // Check for valid bypass
  if (bypassData && bypassData.url === targetUrl && Date.now() - bypassData.timestamp < 300000) {
    window.location.href = targetUrl;
    return;
  }

  const severity = params.get('severity') || 'suspicious';

  const severityConfig = {
    malicious: {
      title: "CRITICAL THREAT DETECTED",
      message: "Immediate termination of connection recommended",
      color: "var(--danger)",
      animation: "pulse 1.5s ease infinite"
    },
    suspicious: {
      title: "SUSPICIOUS ACTIVITY IDENTIFIED",
      message: "Proceed with extreme caution",
      color: "var(--warning)",
      animation: "pulse 2s ease infinite"
    },
    safe: {
      title: "SECURITY SCAN COMPLETE",
      message: "No immediate threats detected",
      color: "var(--safe)",
      animation: "pulse 3s ease infinite"
    }
  };

  const config = severityConfig[severity] || severityConfig.suspicious;
  const indicator = document.getElementById('warning-indicator');

  indicator.style.background = `conic-gradient(${config.color} 0%, transparent 100%)`;
  indicator.querySelector('.glow-pulse').style.background = config.color;
  
  document.getElementById('warning-title').textContent = config.title;
  document.getElementById('warning-message').textContent = config.message;

  // --- 3. NEW LINES ADDED HERE ---

  // Display the blocked URL on the page
  const urlElement = document.getElementById('blocked-url');
  if (urlElement) {
    urlElement.textContent = targetUrl || "an unsafe site";
  }

  // Call the LLM for an explanation
  getPhishingExplanation(targetUrl, severity);

  // --- 4. THE REST OF YOUR CODE (UNCHANGED) ---

  const handleContinue = () => {
    if (!targetUrl) return;
    
    localStorage.setItem('phishguard-bypass', JSON.stringify({
      url: targetUrl,
      timestamp: Date.now()
    }));

    if(severity === 'safe') {
      window.location.href = targetUrl;
    } else {
      const confirmation = confirm(
        `SECURITY WARNING:\n\n` +
        `You are attempting to access a potentially risky website.\n` +
        `Threat Level: ${severity.toUpperCase()}\n\n` +
        `Are you absolutely sure you want to proceed?`
      );
      if(confirmation) window.location.href = targetUrl;
    }
  };

  document.querySelectorAll('.action-button').forEach(button => {
    button.addEventListener('click', function() {
      this.style.transform = 'scale(0.98)';
      setTimeout(() => { this.style.transform = '' }, 100);
    });
  });

  document.getElementById('go-back-button').addEventListener('click', () => window.history.back());
  document.getElementById('close-tab-button').addEventListener('click', () => window.close());
  document.getElementById('report-phish-button').addEventListener('click', () => {
    alert(`Threat reported to security team\nCase ID: ${Date.now().toString(16)}`);
  });
  document.getElementById('continue-button').addEventListener('click', handleContinue);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = 1;
        entry.target.style.transform = 'translateY(0)';
      }
    });
  });

  document.querySelectorAll('[data-aos]').forEach(el => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    observer.observe(el);
  });
});