# 📌 LeetBuddy – Your AI Mentor on LeetCode

LeetBuddy is a Chrome extension that brings a context-aware AI assistant right into the LeetCode workspace. It’s not just about getting the answer — it’s about **understanding the process** and **building problem-solving intuition**.

---

## ⚙️ Features

- **Auto-detects the current LeetCode problem**
- **Starts a scoped AI chat session tied to that problem**
- **Clever prompt engineering with Gemini 2.5 Pro**
- **Remembers your thought process while you stay on the same problem**
- **Minimalist chat UI with subtle animations and smooth UX**
- **Mentorship-style guidance, not just code drops**

---

## 🧠 Tech Stack

- Chrome Extensions API
- Vanilla JS + HTML/TailWind CSS 
- DOM parsing and manipulation
- Google AI Studio (Gemini 2.5 Pro)
- Scoped memory and prompt structuring
- Async fetch + error handling
- Token-efficient interaction design

---

## 🧩 Architecture Overview

```txt
+---------------------+
|  LeetCode Problem   |
|  (DOM content)      |
+---------------------+
           ↓
+---------------------+
|  content.js         |
| - Parses problem    |
| - Injects UI        |
| - Sends info        |
+---------------------+
           ↓
+---------------------+
| geminiReply()       |
| - Builds prompt     |
| - Maintains history |
| - Hits Gemini API   |
+---------------------+
           ↓
+---------------------+
| Gemini API (2.5 Pro)|
+---------------------+
```
---

## 📦 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/LeetBuddy.git
cd leetbuddy
```
### 2. Load the Extension in Chrome
Go to chrome://extensions (or similarly in other browsers)

Enable Developer mode (top right)

Click Load unpacked

Select the leetbuddy/ folder

### 3. Add Your Gemini API Key
On first installation the browser will take u to an options page.

Enter your Gemini API key as instructed.

Save your key.

💡 You can get an API key from Google AI Studio


## You're now ready to use LeetBuddy!
