document.addEventListener("DOMContentLoaded", () => {
    const titleScreen = document.getElementById("title-screen");
    const settingsScreen = document.getElementById("settings-screen");
    const gameScreen = document.getElementById("game-screen");
  
    const startButton = document.getElementById("start-game");
    const settingsButton = document.getElementById("open-settings");
    const backToTitleButtons = document.querySelectorAll("#back-to-title, #back-to-title-from-game");
  
    const saveSettingsButton = document.getElementById("save-settings");
    const nextButton = document.getElementById("next-problem");
  
    const widthSlider = document.getElementById("width");
    const widthValue = document.getElementById("width-value");
    const heightSlider = document.getElementById("height");
    const heightValue = document.getElementById("height-value");
    const nextCountSlider = document.getElementById("next-count");
    const nextCountValue = document.getElementById("next-count-value");
    const blockCountSlider = document.getElementById("block-count");
    const blockCountValue = document.getElementById("block-count-value");
  
    // Update slider tooltips
    function updateTooltip(slider, output) {
      slider.addEventListener("input", () => {
        output.textContent = slider.value;
      });
    }
  
    updateTooltip(widthSlider, widthValue);
    updateTooltip(heightSlider, heightValue);
    updateTooltip(nextCountSlider, nextCountValue);
    updateTooltip(blockCountSlider, blockCountValue);
  
    // Screen navigation
    function showScreen(screen) {
      document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
      screen.classList.remove("hidden");
    }
  
    startButton.addEventListener("click", () => showScreen(gameScreen));
    settingsButton.addEventListener("click", () => showScreen(settingsScreen));
    backToTitleButtons.forEach(btn =>
      btn.addEventListener("click", () => showScreen(titleScreen))
    );
  
    // Save settings
    saveSettingsButton.addEventListener("click", () => {
      const settings = {
        width: widthSlider.value,
        height: heightSlider.value,
        nextCount: nextCountSlider.value,
        blockCount: blockCountSlider.value,
      };
      localStorage.setItem("tetrisSettings", JSON.stringify(settings));
      alert("設定が保存されました");
    });
  
    // Generate game problem
    nextButton.addEventListener("click", () => {
      console.log("次の問題を生成します");
    });
  
    // Load settings on start
    function loadSettings() {
      const settings = JSON.parse(localStorage.getItem("tetrisSettings"));
      if (settings) {
        widthSlider.value = settings.width;
        widthValue.textContent = settings.width;
        heightSlider.value = settings.height;
        heightValue.textContent = settings.height;
        nextCountSlider.value = settings.nextCount;
        nextCountValue.textContent = settings.nextCount;
        blockCountSlider.value = settings.blockCount;
        blockCountValue.textContent = settings.blockCount;
      }
    }
  
    loadSettings();
  });
  