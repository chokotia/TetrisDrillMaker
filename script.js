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
        const blockCount = parseInt(blockCountSlider.value, 10); // ブロック数を取得
        createBoard(width, height, blockCount); // ブロック数を渡して盤面生成
        showScreen(gameScreen);
    });

    // 既存の "次へ" ボタンのイベントリスナーを修正
    nextButton.addEventListener("click", () => {
        console.log("次の盤面を生成します");

        const width = parseInt(widthSlider.value, 10);  // 現在の幅設定を取得
        const height = parseInt(heightSlider.value, 10);  // 現在の高さ設定を取得
        const blockCount = parseInt(blockCountSlider.value, 10);  // 現在のブロック数設定を取得

        // 新しい盤面を生成
        createBoard(width, height, blockCount);
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

    function placeRandomBlocks(board, width, height, blockCount) {
        const cells = Array.from(board.children);
    
        // 各列の最下部からブロックを詰めていく
        const columnIndices = Array.from({ length: width }, (_, i) => i); // 列インデックスを生成
        const placedBlocks = new Set();
    
        for (let i = 0; i < blockCount; i++) {
            let column;
            do {
                column = columnIndices[Math.floor(Math.random() * columnIndices.length)];
            } while (placedBlocks.has(`${column}-${i}`)); // 重複しないようにチェック
    
            // 指定された列の最下部を見つける
            for (let row = height - 1; row >= 0; row--) {
                const index = row * width + column;
                if (!cells[index].classList.contains("block")) {
                    cells[index].classList.add("block");
                    placedBlocks.add(`${column}-${i}`);
                    break;
                }
            }
        }
    }
    
    function createBoard(width, height, blockCount = 0) {
        const board = document.getElementById("board");
    
        // スタイルを適用
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
    
        // 設定されたブロック数分ランダム配置
        placeRandomBlocks(board, width, height, blockCount);
    }
    
    function getRandomMino(excludeMinos) {
        const allMinos = ["I", "O", "T", "S", "Z", "J", "L"];
        const availableMinos = allMinos.filter(mino => !excludeMinos.includes(mino));
        return availableMinos[Math.floor(Math.random() * availableMinos.length)];
      }
      
    function drawMino(minoType, container) {
        const minoShapes = {
          I: [[1, 1, 1, 1]],
          O: [[1, 1], [1, 1]],
          T: [[0, 1, 0], [1, 1, 1]],
          S: [[0, 1, 1], [1, 1, 0]],
          Z: [[1, 1, 0], [0, 1, 1]],
          J: [[1, 0, 0], [1, 1, 1]],
          L: [[0, 0, 1], [1, 1, 1]],
        };
    
        const shape = minoShapes[minoType];
        const minoElement = document.createElement("div");
        minoElement.classList.add("next-piece");
        minoElement.style.display = "grid";
        minoElement.style.gridTemplateColumns = `repeat(${shape[0].length}, 1fr)`;
    
        shape.forEach(row => {
          row.forEach(cell => {
            const cellElement = document.createElement("div");
            if (cell) {
              cellElement.classList.add("block");
            }
            minoElement.appendChild(cellElement);
          });
        });
    
        container.appendChild(minoElement);
      }
    
      function updateNextPieces(nextCount, excludeMinos) {
        const nextContainer = document.getElementById("next");
        nextContainer.innerHTML = ""; // 現在の表示をクリア
    
        for (let i = 0; i < nextCount; i++) {
          const randomMino = getRandomMino(excludeMinos);
    
          if (randomMino) {
            const nextPieceContainer = document.createElement("div");
            nextPieceContainer.classList.add("next-piece-container");
    
            drawMino(randomMino, nextPieceContainer);
            nextContainer.appendChild(nextPieceContainer);
          } else {
            console.error("除外ミノの設定で表示できるミノがありません！");
            break;
          }
        }
      }
    
      nextButton.addEventListener("click", () => {
        const nextCount = parseInt(document.getElementById("next-count").value, 10);
        const excludeMinos = Array.from(
          document.querySelectorAll("#exclude-minos input:checked")
        ).map(input => input.value);
    
        // ネクストを更新
        updateNextPieces(nextCount, excludeMinos);
    
        console.log("ネクストが更新されました！");
      });

      // 設定に基づきネクストを更新
      document.getElementById("start-game").addEventListener("click", () => {
        const nextCount = parseInt(document.getElementById("next-count").value, 10);
        const excludeMinos = Array.from(document.querySelectorAll("#exclude-minos input:checked")).map(input => input.value);
      
        updateNextPieces(nextCount, excludeMinos);
      });
      
    loadSettings();
});
