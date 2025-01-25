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
  I: "rgb(15,155,215)",
  G: "rgb(204,204,204)",
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
  setupEditButton();

  setupOutsideClickToCloseEditPanel();

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
    // console.log("Returning to title");
    // saveSettings(getSettings());
    // showScreen(domElements.titleScreen);
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
  currentWidth = width;
  currentHeight = height;

  board.style.setProperty("--width", width);
  board.style.setProperty("--height", height);
  board.innerHTML = "";

  // セルを作成
  for (let i = 0; i < width * height; i++) {
    const cell = document.createElement("div");
    cell.style.width = `${config.CELL_SIZE}px`;
    cell.style.height = `${config.CELL_SIZE}px`;

    // PC向けクリックイベント (既存)
    cell.addEventListener("click", () => {
      if (!isEditMode || !currentEditAction) return;
      handleEditCellClick(cell, i, width, height);
    });

    board.appendChild(cell);
  }

  // Hammer.jsでドラッグ (pan) しながらマスを塗る機能をセットアップ
  setupMobileDragForBoard(document.getElementById("board-container"), board);

  // ランダムブロックなど既存の処理
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
       // 従来: cells[index].classList.add("block");
       // 初期配置用のクラスを追加:
        cells[index].classList.add("block", "initial-block");
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
  // hammer.on("tap", () => {
  //   isBoardVisible = !isBoardVisible;
  //   board.style.visibility = isBoardVisible ? "visible" : "hidden"; // 表示状態を切り替え
  //   console.log(`Board is now ${isBoardVisible ? "visible" : "hidden"}`);
  // });
}

document.addEventListener("DOMContentLoaded", initializeApp);

function setupEditButton() {
  const editToggleButton = document.getElementById("edit-toggle-button");
  const editPanel = document.getElementById("edit-panel");

  editToggleButton.addEventListener("click", () => {
    isEditMode = !isEditMode;
    editPanel.classList.toggle("hidden", !isEditMode);

    // 編集モードをOFFにした瞬間にも、もしAuto中ならリセットする
    if (!isEditMode) {
      resetAutoCells();
    }
  });

  const editOptionButtons = document.querySelectorAll(".edit-option");
  editOptionButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      // いったん全ボタンの .selected を解除
      editOptionButtons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");

      // もしautoCellsが途中状態ならリセット
      if (autoCells.length > 0) {
        resetAutoCells();
      }

      // data-action を更新
      currentEditAction = btn.dataset.action;
      console.log("currentEditAction:", currentEditAction);
    });
  });

  // ★ クリアボタンの取得＆イベント
  const clearButton = document.getElementById("clear-board");
  clearButton.addEventListener("click", () => {
    resetToInitialBoard(); // 編集内容だけ消して初期状態に戻す
  });
}


// 既存のコードの最下部か、適宜場所を見つけて追加してください
// =============================================
// 編集モードの変数
let isEditMode = false;          // 編集モードON/OFF
let currentEditAction = null;    // "I"/"L"/"O"/"Z"/"T"/"J"/"S"/"gray"/"delete"/"auto"

// 自動置換用の一時的な白色セルを記録する配列
let autoCells = []; // [{x, y, cellEl}, ...]

// Autoモードで4マス塗り終わったか/途中か、等を管理
let isAutoInProgress = false; // 途中で白色マスがある状態かどうか

// =============================================
// 既存の paintCell のままでもOKですが、dataset で管理すると楽になります
function paintCell(cellElement, color) {
  cellElement.style.backgroundColor = color;
  if (color) {
    cellElement.classList.add("block");
  } else {
    cellElement.classList.remove("block");
  }
}

// 色を消す（背景色に戻す）
function clearCell(cellElement) {
  paintCell(cellElement, "");
}

// =============================================

function resetAutoCells() {
  // autoCells に登録されたマスをすべてクリア(背景に戻す)
  autoCells.forEach(({ cellEl }) => {
    clearCell(cellEl);
  });
  autoCells = [];
  isAutoInProgress = false;
  console.log("Auto cells reset.");
}

function parseRGBString(rgbString) {
  // "rgb(15, 155, 215)" とか "rgb(15 155 215)" などをパース
  // カンマやスペースを問わず、3つの数字を拾う
  const match = rgbString.match(/rgb\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)\s*\)/i);
  if (!match) return null; // パースできない場合
  return [ Number(match[1]), Number(match[2]), Number(match[3]) ];
}

function isSameColor(colorA, colorB) {
  // どちらかが null や "" の場合の考慮も必要
  const rgbA = parseRGBString(colorA) || [];
  const rgbB = parseRGBString(colorB) || [];
  // [r, g, b] の各要素が同じかどうか
  return rgbA[0] === rgbB[0] && rgbA[1] === rgbB[1] && rgbA[2] === rgbB[2];
}

function handleEditCellClick(cell, index, width, height) {

  // もし初期配置ブロッククラスが付いていれば編集不可
  if (cell.classList.contains("initial-block")) {
    console.log("This block is initial. Cannot edit or delete.");
    return;
  }

  const oldColor = cell.style.backgroundColor;
  if (currentEditAction === "delete") {
    paintCell(cell, "");
    return;
  }
  if (currentEditAction === "auto") {
    handleAutoReplace(cell, index, width, height);
    return;
  }

  // ここで「同じ色なら削除」トグルか、常に上書きかを分岐
  const newColor = minoColors[currentEditAction];

  if (isDragging) {
    // ドラッグ中は常に塗る(上書き)
    paintCell(cell, newColor);
  } else {
    // 単クリック扱いならトグル
    if (isSameColor(oldColor, newColor)) {
      paintCell(cell, "");
    } else {
      paintCell(cell, newColor);
    }
  }
}


function handleAutoReplace(cell, index, width, height) {
  // 1. すでにこの cell が背景色(#555等)でなければ、白を塗れない
  //    → oldColorが "" (あるいは #555 ) ならOK, そうでなければreturn
  const oldColor = cell.style.backgroundColor;
  // 画面の背景色はCSSで #555 になっていますが、style.backgroundColor は "" のままの場合もあります。
  // ここでは「classListに 'block' が含まれていない」なら空セルとみなす、というのも手。

  // blockを持っていない = 空
  if (cell.classList.contains("block")) {
    console.log("Cell is already occupied. Cannot paint white.");
    return;
  }

  // 2. 既に4マスならこれ以上塗らない
  if (autoCells.length >= 4) {
    console.log("Already have 4 white cells. No more can be placed.");
    return;
  }

  // 3. まだ4未満なら白を塗って登録
  paintCell(cell, "white");
  const x = index % width;
  const y = Math.floor(index / width);
  autoCells.push({ x, y, cellEl: cell });
  isAutoInProgress = true;

  console.log("Auto cell added. Now autoCells.length =", autoCells.length);

  // 4. 4マスそろったら判定
  if (autoCells.length === 4) {
    const positions = autoCells.map(c => ({ x: c.x, y: c.y }));
    const detectedMino = detectMinoShape(positions);

    if (detectedMino) {
      // 見つかったミノの色で塗り直す
      const color = minoColors[detectedMino];
      autoCells.forEach(c => paintCell(c.cellEl, color));
      console.log("Detected shape:", detectedMino);
    } else {
      // 見つからない場合 → 白を全部戻す
      console.log("No matching mino shape found. Reverting white cells.");
      resetAutoCells();
    }

    // autoCells は resetAutoCells() でもクリアされるので明示的にクリアしておく
    autoCells = [];
    isAutoInProgress = false;
  }
}

function detectMinoShape(positions) {
  // すべての座標を 0-based に平行移動して判定（最小 x, y を 0 に合わせる）
  const minX = Math.min(...positions.map(p => p.x));
  const minY = Math.min(...positions.map(p => p.y));
  const normalized = positions.map(p => ({ x: p.x - minX, y: p.y - minY }));

  console.log("normalized:", normalized)

  // 各ミノの全回転パターンを定義
  const shapePatterns = {
    I: [
      // 横
      [ {x:0,y:0}, {x:1,y:0}, {x:2,y:0}, {x:3,y:0} ],
      // 縦
      [ {x:0,y:0}, {x:0,y:1}, {x:0,y:2}, {x:0,y:3} ],
    ],
    O: [
      // 2x2 の正方形は回転しても同じ形
      [ {x:0,y:0}, {x:1,y:0}, {x:0,y:1}, {x:1,y:1} ],
    ],
    T: [
      // T上 (3x2)
      [ {x:0,y:0}, {x:1,y:0}, {x:2,y:0}, {x:1,y:1} ],
      // T右 (2x3)
      [ {x:0,y:1}, {x:1,y:0}, {x:1,y:1}, {x:1,y:2} ],
      // T下 (3x2)
      [ {x:1,y:0}, {x:0,y:1}, {x:1,y:1}, {x:2,y:1} ],
      // T左 (2x3)
      [ {x:0,y:0}, {x:0,y:1}, {x:0,y:2}, {x:1,y:1} ],
    ],
    S: [
      // S横 (3x2)
      [ {x:1,y:0}, {x:2,y:0}, {x:0,y:1}, {x:1,y:1} ],
      // S縦 (2x3)
      [ {x:0,y:0}, {x:0,y:1}, {x:1,y:1}, {x:1,y:2} ],
    ],
    Z: [
      // Z横 (3x2)
      [ {x:0,y:0}, {x:1,y:0}, {x:1,y:1}, {x:2,y:1} ],
      // Z縦 (2x3)
      [ {x:1,y:0}, {x:0,y:1}, {x:1,y:1}, {x:0,y:2} ],
    ],
    J: [
      [{x: 0, y: 0},{x: 1, y: 0},{x: 2, y: 0},{x: 2, y: 1}],
      [{x: 0, y: 2},{x: 0, y: 1},{x: 0, y: 0},{x: 1, y: 0}],
      [{x: 2, y: 1},{x: 1, y: 1},{x: 0, y: 1},{x: 0, y: 0}],
      [{x: 1, y: 0},{x: 1, y: 1},{x: 1, y: 2},{x: 0, y: 2}],
    ],
    L: [
      [{x: 0, y: 0},{x: 0, y: 1},{x: 0, y: 2},{x: 1, y: 2}],
      [{x: 0, y: 1},{x: 1, y: 1},{x: 2, y: 1},{x: 2, y: 0}],
      [{x: 1, y: 2},{x: 1, y: 1},{x: 1, y: 0},{x: 0, y: 0}],
      [{x: 2, y: 0},{x: 1, y: 0},{x: 0, y: 0},{x: 0, y: 1}],
    ],
  };

  // 全パターンの中から一致するミノがあるか判定
  for (const [minoType, patterns] of Object.entries(shapePatterns)) {
    for (const pattern of patterns) {
      if (isSameShape(normalized, pattern)) {
        return minoType; // マッチしたらミノタイプを返す
      }
    }
  }
  return null;
}

function isSameShape(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  // ソートして座標が全て一致するか比較
  const sortByXY = (a, b) => a.x - b.x || a.y - b.y;
  const s1 = [...arr1].sort(sortByXY);
  const s2 = [...arr2].sort(sortByXY);
  return s1.every((p, i) => p.x === s2[i].x && p.y === s2[i].y);
}


// 配列同士が同じ座標集合か判定するための関数
function isSameShape(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  // 座標の並び順が異なる可能性があるため、ソートして比較
  const sortByXY = (a, b) => (a.x - b.x) || (a.y - b.y);
  const s1 = [...arr1].sort(sortByXY);
  const s2 = [...arr2].sort(sortByXY);
  return s1.every((p, i) => p.x === s2[i].x && p.y === s2[i].y);
}

let isDragging = false; // panmove や mousemove で移動があったらtrue

function setupMobileDragForBoard(boardContainer, board) {
  const hammer = new Hammer(boardContainer);

  hammer.get("pan").set({
    direction: Hammer.DIRECTION_ALL,
    threshold: 1
  });

  hammer.on("panstart", (e) => {
    if (!isEditMode || !currentEditAction) return;
    isDragging = false; // panstart 時点ではまだ移動していない
    // ただし指を置いた時点でマウスダウン相当
  });

  hammer.on("panmove", (e) => {
    if (!isEditMode || !currentEditAction) return;
    isDragging = true; // 実際に動き始めたらドラッグ扱い

    paintCellUnderPointer(e, board);
  });

  hammer.on("panend", (e) => {
    // pan操作終了
    isDragging = false;
  });

  // 単タップは hammer.on("tap") でも拾えるが、
  // 既に click イベントを使っているならそちらに任せてもいい
}



/**
 * ドラッグやタップ時の座標 (e.center.x, e.center.y) にあるセルを探して塗る
 */
function paintCellUnderPointer(e, board) {
  // Hammer.js イベントの座標は e.center.x / e.center.y に格納される
  const x = e.center.x;
  const y = e.center.y;

  // pointer座標にある要素を取得
  const target = document.elementFromPoint(x, y);

  // もし board の子要素（つまり1つのマス）であれば処理
  if (target && target.parentNode === board) {
    // board.children の中で何番目か
    const index = Array.from(board.children).indexOf(target);
    if (index >= 0) {
      handleEditCellClick(target, index, currentWidth, currentHeight);
    }
  }
}


/**
 * 「初期配置クラス(initial-block)」が付いていないマスをすべて消す
 */
function resetToInitialBoard() {
  const cells = Array.from(domElements.board.children);
  cells.forEach((cell) => {
    // initial-blockクラスを持たない = 後から塗ったマスは消す
    if (!cell.classList.contains("initial-block")) {
      cell.style.backgroundColor = "";      // 背景色を戻す
      cell.classList.remove("block");       // ブロッククラスを除去
      // もし別のミノなどが付いているなら消す
      // (今回は "initial-block" しか特別クラスがない想定なのでこれだけでOK)
    }
  });
  console.log("Cleared all edits. Now only initial-block remain.");
}


function setupOutsideClickToCloseEditPanel() {
  const editPanel = document.getElementById("edit-panel");
  const editToggleButton = document.getElementById("edit-toggle-button");

  // ドキュメント全体のクリックを監視
  document.addEventListener("click", (evt) => {
    // 1. 「編集モード中」かつ「パネルが表示されている状態」のときだけ判定
    if (isEditMode && !editPanel.classList.contains("hidden")) {
      // 2. クリックされた要素がパネル自身 or その子孫 でもなく
      //    かつ editToggleButton でもなければ、パネルを隠す
      const isClickInsidePanel = evt.target.closest("#edit-panel");
      const isClickOnEditButton = (evt.target === editToggleButton);

      if (!isClickInsidePanel && !isClickOnEditButton) {
        // パネルを閉じる（hiddenクラスを付与）
        editPanel.classList.add("hidden");
        // ただし isEditMode は true のままにして、選択中ミノを継続可能に
        console.log("Clicked outside edit-panel -> closing panel");
      }
    }
  });
}
