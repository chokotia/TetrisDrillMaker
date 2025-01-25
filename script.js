// Centralized Configuration
const config = {
  CELL_SIZE: 30, // Cell size in pixels
};

// ミノとカラーの対応表を作る
const minoColors = {
  S: "rgb(89,177,1)",
  Z: "rgb(215,15,55)",
  L: "rgb(227,91,2)",
  J: "rgb(33,65,198)",
  O: "rgb(227,159,2)",
  T: "rgb(175,41,138)",
  I: "rgb(15,155,215)"
};


// DOM Elements
const domElements = {
  titleScreen: document.getElementById("title-screen"),
  settingsScreen: document.getElementById("settings-screen"),
  gameScreen: document.getElementById("game-screen"),
  startButton: document.getElementById("start-game"),
  settingsButton: document.getElementById("open-settings"),
  backToTitleButtons: document.querySelectorAll("#back-to-title"),
  sliders: {
    width: document.getElementById("width"),
    height: document.getElementById("height"),
    nextCount: document.getElementById("next-count"),
    blockCount: document.getElementById("block-count"),
  },
  values: {
    width: document.getElementById("width-value"),
    height: document.getElementById("height-value"),
    nextCount: document.getElementById("next-count-value"),
    blockCount: document.getElementById("block-count-value"),
  },
  shortcuts: {
    nextProblemInput: document.getElementById("next-problem-key"),
    backToTitleInput: document.getElementById("back-to-title-key"),
  },
  board: document.getElementById("board"),
  nextContainer: document.getElementById("next"),
};

function initializeApp() {
  setupEventListeners();
  loadSettings();
  setupGestureControls();
}

function setupEventListeners() {
  // スライダーと値の同期
  Object.entries(domElements.sliders).forEach(([key, slider]) => {
    const output = domElements.values[key];
    slider.addEventListener("input", () => {
      output.textContent = slider.value;
    });
  });

  // 画面の切り替え
  domElements.startButton.addEventListener("click", startGame);
  domElements.settingsButton.addEventListener("click", () => showScreen(domElements.settingsScreen));
  domElements.backToTitleButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      saveSettings(getSettings());
      showScreen(domElements.titleScreen);
    })
  );

  // ショートカットの設定
  setupShortcutListeners();

  // キーボードイベント
  document.addEventListener("keydown", handleShortcuts);
}

function setupShortcutListeners() {
  const { nextProblemInput, backToTitleInput } = domElements.shortcuts;
  const shortcuts = getShortcuts();

  nextProblemInput.addEventListener("input", (e) => {
    shortcuts.nextProblemKey = e.target.value;
    console.log(`nextProblemKey updated to: ${shortcuts.nextProblemKey}`);
  });

  backToTitleInput.addEventListener("input", (e) => {
    shortcuts.backToTitleKey = e.target.value;
    console.log(`backToTitleKey updated to: ${shortcuts.backToTitleKey}`);
  });
}

function startGame() {
  const { width, height, blockCount } = getSettings();
  createBoard(width, height, blockCount);
  showScreen(domElements.gameScreen);
  updateNextPieces();
}

function getSettings() {
  return {
    width: parseInt(domElements.sliders.width.value, 10),
    height: parseInt(domElements.sliders.height.value, 10),
    nextCount: parseInt(domElements.sliders.nextCount.value, 10),
    blockCount: parseInt(domElements.sliders.blockCount.value, 10),
  };
}

function saveSettings(settings) {
  localStorage.setItem("tetrisSettings", JSON.stringify(settings));
  console.log("Settings saved");
}

function loadSettings() {
  const savedSettings = JSON.parse(localStorage.getItem("tetrisSettings"));
  if (savedSettings) {
    Object.entries(savedSettings).forEach(([key, value]) => {
      if (domElements.sliders[key]) {
        domElements.sliders[key].value = value;
        domElements.values[key].textContent = value;
      }
    });
    const { width, height, blockCount } = savedSettings;
    createBoard(width, height, blockCount);
  }
}

function showScreen(screen) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
  screen.classList.remove("hidden");
}

function handleShortcuts(e) {
  const shortcuts = getShortcuts();
  if (e.key === shortcuts.nextProblemKey) {
    console.log("Generating next board");
    startGame();
  } else if (e.key === shortcuts.backToTitleKey) {
    console.log("Returning to title");
    saveSettings(getSettings());
    showScreen(domElements.titleScreen);
  }
}

function getShortcuts() {
  return {
    nextProblemKey: domElements.shortcuts.nextProblemInput.value || "n",
    backToTitleKey: domElements.shortcuts.backToTitleInput.value || "t",
  };
}

function createBoard(width, height, blockCount = 0) {
  const board = domElements.board;

  board.style.setProperty("--width", width);
  board.style.setProperty("--height", height);
  board.innerHTML = "";

  for (let i = 0; i < width * height; i++) {
    const cell = document.createElement("div");
    cell.style.width = `${config.CELL_SIZE}px`;
    cell.style.height = `${config.CELL_SIZE}px`;
    board.appendChild(cell);
  }

  placeRandomBlocks(board, width, height, blockCount);
}

function placeRandomBlocks(board, width, height, blockCount) {
  const cells = Array.from(board.children);
  const columnIndices = Array.from({ length: width }, (_, i) => i);
  const placedBlocks = new Set();

  for (let i = 0; i < blockCount; i++) {
    let column;
    do {
      column = columnIndices[Math.floor(Math.random() * columnIndices.length)];
    } while (placedBlocks.has(`${column}-${i}`));

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

function updateNextPieces() {
  const nextCount = parseInt(domElements.sliders.nextCount.value, 10);
  const excludeMinos = Array.from(
    document.querySelectorAll("#exclude-minos input:checked")
  ).map((input) => input.value);

  const nextContainer = domElements.nextContainer;
  nextContainer.innerHTML = "";

  for (let i = 0; i < nextCount; i++) {
    const randomMino = getRandomMino(excludeMinos);
    if (randomMino) {
      const nextPieceContainer = document.createElement("div");
      nextPieceContainer.classList.add("next-piece-container");
      drawMino(randomMino, nextPieceContainer);
      nextContainer.appendChild(nextPieceContainer);
    } else {
      console.error("No minos available to display");
      break;
    }
  }
}

function getRandomMino(excludeMinos) {
  const allMinos = ["I", "O", "T", "S", "Z", "J", "L"];
  const availableMinos = allMinos.filter((mino) => !excludeMinos.includes(mino));
  return availableMinos[Math.floor(Math.random() * availableMinos.length)];
}

function drawMino(minoType, container) {
  const minoShapes = {
    I: [[1, 1, 1, 1]],
    O: [
      [1, 1],
      [1, 1],
    ],
    T: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    J: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    L: [
      [0, 0, 1],
      [1, 1, 1],
    ],
  };

  // ミノ配列（2次元）を取得
  const shape = minoShapes[minoType];

  // ミノの外枠要素
  const minoElement = document.createElement("div");
  minoElement.classList.add("next-piece");
  minoElement.style.display = "grid";
  minoElement.style.gridTemplateColumns = `repeat(${shape[0].length}, 1fr)`;

  // shape をもとにセルを作り、該当セルだけ色を塗る
  shape.forEach((row) => {
    row.forEach((cell) => {
      const cellElement = document.createElement("div");
      if (cell) {
        cellElement.classList.add("block");
        // ここでミノごとの色を適用（inline スタイルでもクラスでもOK）
        cellElement.style.backgroundColor = minoColors[minoType];
      }
      minoElement.appendChild(cellElement);
    });
  });

  container.appendChild(minoElement);
}


function setupGestureControls() {
  const boardContainer = document.getElementById("board-container");
  const board = document.getElementById("board");
  const hammer = new Hammer(boardContainer);

  // スワイプジェスチャーの方向を有効化
  hammer.get("swipe").set({ direction: Hammer.DIRECTION_ALL });

  let isBoardVisible = true; // ボードの表示状態

  // 右スワイプで次の問題に進む
  hammer.on("swiperight", () => {
    console.log("Swiped right: Generating next board");
    startGame(); // 既存の「次へ」機能を呼び出す
  });

  // 上スワイプでタイトル画面に戻る
  hammer.on("swipeup", () => {
    console.log("Swiped up: Returning to title");
    saveSettings(getSettings()); // 設定を保存
    showScreen(domElements.titleScreen); // タイトル画面に戻る
  });

  // ボードをタップして表示・非表示を切り替える
  hammer.on("tap", () => {
    isBoardVisible = !isBoardVisible;
    board.style.visibility = isBoardVisible ? "visible" : "hidden"; // 表示状態を切り替え
    console.log(`Board is now ${isBoardVisible ? "visible" : "hidden"}`);
  });
}

document.addEventListener("DOMContentLoaded", initializeApp);
