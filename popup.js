// HINT BUTTON
document.getElementById("reveal-hint").addEventListener("click", () => {
  const hintText = document.getElementById("hint-text");
  hintText.classList.remove("hidden");
  hintText.textContent = "HINT: Loading...";

  chrome.storage.sync.get(["geminiApiKey"], async ({ geminiApiKey }) => {
    if (!geminiApiKey) {    
      hintText.textContent = "No Gemini API key set. Click the gear icon to add one.";
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs.length) {
        hintText.textContent = "No active tab found.";
        return;
      }
      console.log("sending getProblemInfo to tab", tabs[0])
      chrome.tabs.sendMessage(tabs[0].id, { action: "getProblemInfo" }, async (response) => {
        console.log("Hint button: response from content script:", response);
        if (chrome.runtime.lastError) {
          hintText.textContent = "Extension error: " + chrome.runtime.lastError.message;
          return;
        }
        if (!response || !response.title) {
          hintText.textContent = "Problem info not found.";
          return;
        }

        const title = response.title;
        const prompt = `Give an initial hint for solving this LeetCode problem:\n\n"${title}"`;
        console.log("Hint button: sending prompt to Gemini:", prompt);

        try {
          const hint = await getGeminiReply(prompt, geminiApiKey);
          console.log("Hint button: Gemini reply received:", hint);
          hintText.textContent = "HINT: " + hint;
        } catch (err) {
          console.error("Hint button: Gemini error:", err);
          hintText.textContent = "Gemini error: " + err.message;
        }
      });
    });
  });
});

// CODE GENERATION BUTTON
document.getElementById("submit-btn").addEventListener("click", () => {
  const btn = document.getElementById("submit-btn");
  btn.innerText = "Generating...";

  chrome.storage.sync.get(["geminiApiKey"], async ({ geminiApiKey }) => {
    if (!geminiApiKey) {
      alert("No API key set. Click the gear icon to add one.");
      btn.innerText = "Copy LeetBuddy's solution";
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getProblemInfo" }, async (response) => {
        console.log("Response from content script:", response);
        const title = response?.title || "unknown problem";
        const prompt = `Write clean, working Python code to solve this LeetCode problem.
no need of any text the generated prompt should have purely only code:\n\n"${title}"`;

        try {
          const code = await getGeminiReply(prompt, geminiApiKey);
          await navigator.clipboard.writeText(code);

          btn.textContent = "Copied!";
          setTimeout(() => {
            btn.textContent = "Copy LeetBuddy's solution";
          }, 5000);
        } catch (err) {
          console.error("Code generation error:", err);
          alert("Gemini error: " + err.message);
          btn.textContent = "Copy LeetBuddy's solution";
        }
      });
    });
  });
});

// COPY NOTES BUTTON (optional)
document.getElementById("copy-btn")?.addEventListener("click", () => {
  const txt = document.getElementById("result")?.innerText;
  if (!txt) return;
  navigator.clipboard.writeText(txt).then(() => {
    const btn = document.getElementById("copy-btn");
    const old = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = old), 2000);
  });
});

// ERROR DISPLAY ON FAILURE TO FETCH PROBLEM INFO
chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "getProblemInfo" }, async (response) => {
      const errorBox = document.getElementById("error-alert");
      const titleEl = document.getElementById("problem-title");
      const difficultyEl = document.getElementById("difficulty-analysis");

      if (chrome.runtime.lastError || !response || response.title === "Unknown") {
        errorBox?.classList.remove("hidden");
        titleEl.innerText = "N/A";
        difficultyEl.innerText = "???";
        return;
      }

      errorBox?.classList.add("hidden");
      titleEl.innerText = `${response.number}. ${response.title}`;

      const title = response?.title || "unknown problem";
      const prompt = `Based on user reviews and the actual difficulty provide a one syllable answer such as
"easy - medium" or "medium - hard" for the problem "${title}"`;

      try {
        const diff = await getGeminiReply(prompt, geminiApiKey);
        difficultyEl.innerText = diff || "???";
      } catch (err) {
        console.error("Difficulty fetch error:", err);
        difficultyEl.textContent = "Gemini error: " + err.message;
      }
    });
  });
});

// CLOSE ERROR ALERT MANUALLY
document.querySelector("#error-alert svg")?.addEventListener("click", () => {
  document.getElementById("error-alert")?.classList.add("hidden");
});

// GEMINI API HELPER
async function getGeminiReply(prompt, apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    }
  );

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error?.message || "Gemini request failed");
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No output.";
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "reveal_buttons"){
        let hintBtn = document.getElementById("reveal-hint");
        let submitBtn = document.getElementById("submit-btn");

        if (hintBtn) hintBtn.classList.remove("hidden"); 
        if (submitBtn) submitBtn.classList.remove("hidden");
    }
});
