let shouldSendFirstMessage = true;

function waitForProblemInfo(sendResponse) {
  const maxTries = 20;
  let tries = 0;

  const interval = setInterval(() => {
    const titleLink = document.querySelector("a.no-underline.truncate.cursor-text");
    if (titleLink && titleLink.innerText.trim()) {
      clearInterval(interval);
      const fullText = titleLink.innerText.trim();
      const match = fullText.match(/^(\d+)\.\s+(.*)$/);
      const number = match?.[1] || "N/A";
      const title = match?.[2] || fullText;
      const slug = location.pathname.split("/")[2] || "";
      sendResponse({ number, title, slug });
      chrome.runtime.sendMessage({
        action: "reveal_buttons"
      });
    } else {
      tries++;
      if (tries >= maxTries) {
        clearInterval(interval);
        sendResponse({ number: "?", title: "Unknown", slug: "" });
      }
    }
  }, 300);
}

window.addEventListener("load", () => {
  console.log("✅ content.js loaded");

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "getProblemInfo") {
      waitForProblemInfo(sendResponse);
      return true;
    }
  });

  injectChatbox();
});

function injectChatbox() {
  const messageHistories = {};
  if (document.getElementById("leetbuddy-chatbox") || document.getElementById("chat-toggle-bubble")) return;
  
  function typewriterEffect(element, text, delay = 20) {
  let i = 0;
  element.innerHTML = ""; // Clear content first

  const caret = document.createElement("span");
  caret.className = "blinking-caret";
  element.appendChild(caret);

  const interval = setInterval(() => {
    if (i >= text.length) {
      clearInterval(interval);
      caret.remove(); // Remove caret when done
      return;
    }

    const char = text[i];
    const displayChar = char === "\n" ? "<br>" : char;
    caret.insertAdjacentHTML("beforebegin", displayChar);
    i++;

    // Scroll chat to bottom while typing
    const chatMessages = document.getElementById("chat-messages");
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }, delay);
}


  
  const style = document.createElement("style");
  style.textContent = `
  .blinking-caret {
    display: inline-block;
    width: 2px;
    height: 1em;
    background-color: orange;
    animation: blink 0.7s step-end infinite;
    vertical-align: bottom;
    margin-left: 2px;
  }

  @keyframes blink {
    from, to { opacity: 0 }
    50% { opacity: 1 }
  }
`;
  document.head.appendChild(style);


  const bubble = document.createElement("div");
  bubble.id = "chat-toggle-bubble";
  bubble.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    background: #4ade80;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    cursor: pointer;
    z-index: 100000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: #000;
    font-weight: bold;
  `;
  bubble.textContent = "💬";
  document.body.appendChild(bubble);

  bubble.addEventListener("click", () => {
    showChatbox();
    bubble.style.display = "none";
  });

  function showChatbox() {
    if (document.getElementById("leetbuddy-chatbox")) {
      document.getElementById("leetbuddy-chatbox").style.display = "flex";
      return;
    }

    const div = document.createElement("div");
    div.id = "leetbuddy-chatbox";
    div.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 360px;
      height: 500px;
      background: #1e1e1e;
      border: 2px solid #4ade80;
      border-radius: 10px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.4);
      display: flex;
      flex-direction: column;
      font-family: Arial, sans-serif;
      z-index: 100000;
      color: white;
    `;

    div.innerHTML = `
      <div id="chat-header" style="
        background: #4ade80;
        color: black;
        padding: 10px;
        font-weight: bold;
        cursor: move;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        LeetBuddy Mentor Chat
        <span id="chat-toggle" style="cursor:pointer;">✕</span>
      </div>
      <div id="chat-messages" style="
        flex-grow: 1;
        overflow-y: auto;
        padding: 10px;
        font-size: 14px;
        background: #121212;
        display: flex;
        flex-direction: column;
        gap: 6px;
      "></div>
      <form id="chat-input-form" style="display:flex; border-top:1px solid #333;">
        <input id="chat-input" type="text" placeholder="Ask me..." style="
          flex-grow: 1;
          border: none;
          padding: 10px;
          font-size: 14px;
          background: #1e1e1e;
          color: white;
          outline: none;
        " autocomplete="off" />
        <button type="submit" style="
          background: #4ade80;
          border: none;
          color: black;
          padding: 10px 15px;
          cursor: pointer;
          font-weight: bold;
        ">Send</button>
      </form>
    `;
    document.body.appendChild(div);

    const chatbox = div;
    const toggle = document.getElementById("chat-toggle");
    const chatForm = document.getElementById("chat-input-form");
    const chatMessages = document.getElementById("chat-messages");
    const chatInput = document.getElementById("chat-input");

    function addMessage(sender, text, isTyping = false) {
      const msg = document.createElement("div");
      msg.style.padding = "8px";
      msg.style.borderRadius = "6px";
      msg.style.whiteSpace = "pre-wrap";
      msg.style.maxWidth = "80%";
      msg.style.alignSelf = sender === "user" ? "flex-end" : "flex-start";
      msg.style.backgroundColor = sender === "user" ? "#4ade80" : "#2c2c2c";
      msg.style.color = sender === "user" ? "#000" : "#fff";
      
      if (isTyping && sender == "bot"){
        typewriterEffect(msg, text);
      }else{
        msg.textContent = text;
      }
      chatMessages.appendChild(msg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return msg;
    }
    console.log(`before : {shouldSendFirstMessage}`);
    if (shouldSendFirstMessage){
        geminiReply("introduce yourself", addMessage, messageHistories);
        shouldSendFirstMessage = false;
    }
    console.log(`after : {shouldSendFirstMessage}`);
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const userText = chatInput.value.trim();
      if (!userText) return;
      addMessage("user", userText);
      geminiReply(userText, addMessage, messageHistories);
      chatInput.value = "";
    });
    //close button
    toggle.addEventListener("click", () => {
      chatbox.style.display = "none";
      document.getElementById("chat-toggle-bubble").style.display = "flex";
    });

    // Drag logic
    let isDragging = false, offsetX, offsetY;
    const header = document.getElementById("chat-header");

    header.addEventListener("mousedown", (e) => {
      isDragging = true;
      offsetX = e.clientX - chatbox.getBoundingClientRect().left;
      offsetY = e.clientY - chatbox.getBoundingClientRect().top;
      document.addEventListener("mousemove", dragMove);
      document.addEventListener("mouseup", dragStop);
    });

    function dragMove(e) {
      if (!isDragging) return;
      chatbox.style.left = `${e.clientX - offsetX}px`;
      chatbox.style.top = `${e.clientY - offsetY}px`;
      chatbox.style.right = "auto";
      chatbox.style.bottom = "auto";
    }

    function dragStop() {
      isDragging = false;
      document.removeEventListener("mousemove", dragMove);
      document.removeEventListener("mouseup", dragStop);
    }
  }
}

// 🔁 Modularized Gemini reply function
function geminiReply(userText, addMessage, messageHistories) {
  waitForProblemInfo((problem) => {
    const { number, title, slug } = problem || {};

    const systemPrompt = `
You are **LeetBuddy**, an expert and encouraging LeetCode mentor.

You're currently helping with LeetCode Problem ${number}: ${title} (slug: ${slug}).

Your goal is to **guide users** toward solving coding problems themselves — not just give answers.

Here’s how you interact:
- First introduction should be introducing yourself without mentioning the problem, then ask if we can dive into it or ask how can u help
- Ask users to share their current thought process or approach.
- Nudge them in the right direction with subtle hints, patterns, or concepts they may have overlooked.
- If users directly ask for the full solution, encourage them to first share an intuition or a partial plan.
- Only after they’ve tried or asked again, provide the solution in their preferred language — clearly, but concisely.
- Always give constructive criticism and motivate them. Celebrate progress, even if small.
- Use examples and analogies where helpful, but **never add unrelated information**.
- Keep responses **short, helpful, and focused on problem-solving**.
- Keep introductions playful and use emojis to lighten the mood relatively frequently.

Act like a mentor who wants the user to become independent and confident — not just copy-paste solutions.
    `.trim();

    chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {
      if (!geminiApiKey) {
        addMessage("bot", "⚠️ API key not found. Please add it in the popup.");
        return;
      }

      if (!messageHistories[slug]) {
        messageHistories[slug] = [
          {
            role: "model",
            parts: [{ text: systemPrompt }]
          }
        ];
      }

      messageHistories[slug].push({
        role: "user",
        parts: [{ text: userText }]
      });

      const thinkingMsg = addMessage("bot", "🤖 Typing...");

      fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: messageHistories[slug] })
      })
        .then((res) => res.json())
        .then((data) => {
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ No response received.";
          thinkingMsg.remove();
          addMessage("bot", reply, true);

          messageHistories[slug].push({
            role: "model",
            parts: [{ text: reply }]
          });
        })
        .catch((err) => {
          console.error(err);
          addMessage("bot", "❌ Error talking to Gemini.");
        });
    });
  });
}
