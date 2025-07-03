window.addEventListener('load', () => {
  console.log("✅ content.js loaded");

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "getProblemInfo") {
      waitForProblemInfo(sendResponse);
      return true;
    }
  });

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
        console.log({ number, title, slug });
        sendResponse({ number, title, slug });
      } else {
        tries++;
        if (tries >= maxTries) {
          clearInterval(interval);
          sendResponse({ number: "?", title: "Unknown", slug: "" });
        }
      }
    }, 300);
  }

  injectChatbox();
});

function injectChatbox() {
  if (document.getElementById('leetbuddy-chatbox') || document.getElementById('chat-toggle-bubble')) return;

  // 🟢 1. Create the toggle bubble
  const bubble = document.createElement('div');
  bubble.id = 'chat-toggle-bubble';
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
  bubble.textContent = '💬';
  document.body.appendChild(bubble);

  bubble.addEventListener('click', () => {
    showChatbox();
    bubble.style.display = 'none';
  });

  // 🟢 2. Chatbox creation
  function showChatbox() {
    if (document.getElementById('leetbuddy-chatbox')) {
      document.getElementById('leetbuddy-chatbox').style.display = 'flex';
      return;
    }

    const div = document.createElement('div');
    div.id = 'leetbuddy-chatbox';
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
    const toggle = document.getElementById('chat-toggle');
    const chatForm = document.getElementById('chat-input-form');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');

    // Message rendering
    function addMessage(sender, text) {
      const msg = document.createElement('div');
      msg.style.padding = '8px';
      msg.style.borderRadius = '6px';
      msg.style.whiteSpace = 'pre-wrap';
      msg.style.maxWidth = '80%';
      if (sender === 'user') {
        msg.style.backgroundColor = '#4ade80';
        msg.style.color = '#000';
        msg.style.alignSelf = 'flex-end';
      } else {
        msg.style.backgroundColor = '#2c2c2c';
        msg.style.alignSelf = 'flex-start';
      }
      msg.textContent = text;
      chatMessages.appendChild(msg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Submit handler
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const userText = chatInput.value.trim();
      if (!userText) return;

      addMessage('user', userText);
      chatInput.value = '';

      chrome.runtime.sendMessage({ action: 'chatMessage', text: userText }, (response) => {
        if (response && response.reply) {
          addMessage('bot', response.reply);
        } else {
          addMessage('bot', 'Sorry, I could not get a response.');
        }
      });
    });

    // Close chat
    toggle.addEventListener('click', () => {
      chatbox.style.display = 'none';
      document.getElementById('chat-toggle-bubble').style.display = 'flex';
    });

    // Drag logic
    let isDragging = false, offsetX, offsetY;

    const header = document.getElementById('chat-header');
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - chatbox.getBoundingClientRect().left;
      offsetY = e.clientY - chatbox.getBoundingClientRect().top;
      document.addEventListener('mousemove', dragMove);
      document.addEventListener('mouseup', dragStop);
    });

    function dragMove(e) {
      if (!isDragging) return;
      chatbox.style.left = `${e.clientX - offsetX}px`;
      chatbox.style.top = `${e.clientY - offsetY}px`;
      chatbox.style.right = 'auto';
      chatbox.style.bottom = 'auto';
    }

    function dragStop() {
      isDragging = false;
      document.removeEventListener('mousemove', dragMove);
      document.removeEventListener('mouseup', dragStop);
    }
  }
}
