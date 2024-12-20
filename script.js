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

    const CELL_SIZE = 30; // 1マスの固定サイズ（ピクセル）

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
      // 現在表示されている画面をすべて非表示にする
      document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
      // 指定された画面を表示する
      screen.classList.remove("hidden");
    }

    startButton.addEventListener("click", () => {
      const width = parseInt(widthSlider.value, 10);
      const height = parseInt(heightSlider.value, 10);
      createBoard(width, height);
      showScreen(gameScreen);
    });
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
        const { width, height } = settings;
        widthSlider.value = width;
        widthValue.textContent = width;
        heightSlider.value = height;
        heightValue.textContent = height;
        nextCountSlider.value = settings.nextCount;
        nextCountValue.textContent = settings.nextCount;
        blockCountSlider.value = settings.blockCount;
        blockCountValue.textContent = settings.blockCount;
        createBoard(width, height);
      }
    }

    function createBoard(width, height) {
        const board = document.getElementById("board");
        
        // グリッド全体の幅と高さを計算（gapの影響を考慮）
        const gapSize = (width - 1) * 2 + (height - 1) * 2; // gapは1px
        const totalWidth = width * CELL_SIZE + gapSize;
        const totalHeight = height * CELL_SIZE + gapSize;
        
        // スタイルを適用
        board.style.width = `${totalWidth}px`;
        board.style.height = `${totalHeight}px`;
        board.style.setProperty("--width", width);
        board.style.setProperty("--height", height);
      
        // 既存のマスを削除
        while (board.firstChild) {
          board.removeChild(board.firstChild);
        }
      
        // マスを作成
        for (let i = 0; i < width * height; i++) {
          const cell = document.createElement("div");
          cell.style.width = `${CELL_SIZE}px`;
          cell.style.height = `${CELL_SIZE}px`;
          board.appendChild(cell);
        }
      }

    loadSettings();
});
