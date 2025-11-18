# 🛡️ Phishguard: AI-Enhanced Phishing Protection

Phishguard is a modern browser extension that provides a powerful defense against phishing and malicious websites. It combines a comprehensive blocklist with AI-powered explanations to help you understand the risks and navigate the web safely.

---

## ⭐ Core Features

- **Real-Time Threat Blocking**: Utilizes a frequently updated blocklist from URLhaus and custom local rules to block access to known malicious domains instantly.
- **AI-Powered Explanations**: When a site is blocked, Phishguard uses the Gemini LLM to provide a clear, easy-to-understand explanation of the potential threat, helping you learn more about online security.
- **Efficient & Fast**: Built with Chrome's `declarativeNetRequest` API, ensuring that blocking happens with minimal impact on your browser's performance.
- **Dynamic Warning System**: A sleek, modern blocked page provides clear, color-coded warnings based on the threat's severity (e.g., malicious, suspicious).
- **User Control**: Offers simple options to go back to safety, close the tab, or (with caution) proceed to the blocked site if you are sure it's safe.

---

## 🛠️ How It Works

1.  **Blocklist Integration**: On startup and periodically, the extension fetches the latest hostfile from URLhaus and combines it with a local list of rules (`rules.json`).
2.  **Instant Blocking**: These rules are loaded into Chrome's network request engine. If you try to navigate to a URL matching an entry in the blocklist, the browser blocks the request before the page can load.
3.  **Secure Redirect**: You are immediately redirected to a local, secure warning page (`blocked.html`).
4.  **AI Analysis**: The warning page sends a request to a Large Language Model (LLM) with context about the blocked site's threat level.
5.  **Clear Explanation**: The LLM returns a simple, concise explanation of the risks associated with the blocked site, which is then displayed to you.

---

## 🚀 Installation

1.  Download or clone the repository to your local machine.
2.  Open your Chrome browser and navigate to `chrome://extensions/`.
3.  Enable **Developer Mode** using the toggle in the top-right corner.
4.  Click the **"Load Unpacked"** button.
5.  Select the directory where you saved the Phishguard files.
6.  The Phishguard extension will now be active in your browser.

---

## 🔧 Development Setup

To run and develop this extension locally, you will need:

- A modern web browser like Google Chrome.
- A **Gemini API Key** for the AI explanation feature.

### Steps:

1.  Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
2.  Open the file `static/js/blocked.js`.
3.  Replace the placeholder value of the `GEMINI_API_KEY` constant with your actual API key.
4.  Follow the **Installation** steps above to load the extension into your browser.

**Note**: For security, it is strongly recommended to manage API keys safely and not hardcode them directly in the source code for production use.

---

## 📜 License

This project is licensed under the **MIT License**.
