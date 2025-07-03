document.getElementById("reveal-hint").addEventListener("click", async () => {
  const hintText = document.getElementById("hint-text");
  hintText.classList.remove("hidden");
  hintText.textContent = "HINT: Thinking in terms of a hash map may help..."; // Replace with real AI response
});

document.getElementById("generate-solution").addEventListener("click", async () => {
  const solution = `function twoSum(nums, target) { /* AI generated */ }`; // Replace with AI response
  await navigator.clipboard.writeText(solution);
  alert("AI solution copied to clipboard!");
});
    