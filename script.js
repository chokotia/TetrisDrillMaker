// Centralized Configuration
const config = {
  CELL_SIZE: 30, // Cell size in pixels
  VERSION: '0.2.2',
};

// ミノとカラーの対応表
const minoColors = {
  S: 'rgb(89,177,1)',
  Z: 'rgb(215,15,55)',
  L: 'rgb(227,91,2)',
  J: 'rgb(33,65,198)',
  O: 'rgb(227,159,2)',
  T: 'rgb(175,41,138)',
  I: 'rgb(15,155,215)',
  G: 'rgb(204,204,204)', // gray 用
};

// シード付き乱数 (Mulberry32) 以下は省略可...
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function generateBaseSeed() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let seed = '';
  for (let i = 0; i < 4; i++) {
    seed += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return seed;
}

/* ---- ここからアプリ本体 ---- */
let baseSeed = '';
let currentProblemNumber = 1;
let randomGenerator = null;

function initializeApp() {
  baseSeed = generateBaseSeed();
  currentProblemNumber = 1;
  randomGenerator = createSeededGenerator(baseSeed, currentProblemNumber);

  setupEventListeners();
  loadSettings();
  setupGestureControls();
  setupEditButton();

  // 最初の問題を生成
  generateProblem();

  console.log(`Base Seed: ${baseSeed}`);
  console.log(`Starting at Problem #${currentProblemNumber}`);
}

function createSeededGenerator(base, number) {
  const seedString = `${base}_${number}`;
  let seed = 0;
  for (let i = 0; i < seedString.length; i++) {
    seed += seedString.charCodeAt(i);
  }
  return mulberry32(seed);
}

function setupEventListeners() {
  // 各種スライダー
  ['width', 'height', 'next-count', 'block-count'].forEach(id => {
    const slider = document.getElementById(id);
    const output = document.getElementById(`${id}-value`);
    if (slider && output) {
      slider.addEventListener('input', () => {
        output.textContent = slider.value;
      });
    }
  });

  // 設定ボタン: オーバーレイを表示
  const settingsButton = document.getElementById('settings-button');
  if (settingsButton) {
    settingsButton.addEventListener('click', () => {
      openSettingsOverlay();
    });
  }

  // 設定画面の「閉じる」ボタン
  const closeSettingsButton = document.getElementById('close-settings');
  if (closeSettingsButton) {
    closeSettingsButton.addEventListener('click', () => {
      saveSettings(getSettings());
      closeSettingsOverlay();
    });
  }

  // Auto/Del ボタン
  const autoButton = document.getElementById('auto-button');
  if (autoButton) {
    autoButton.addEventListener('click', () => {
      setEditAction('auto');
    });
  }
  const delButton = document.getElementById('del-button');
  if (delButton) {
    delButton.addEventListener('click', () => {
      setEditAction('delete');
    });
  }
}

function openSettingsOverlay() {
  const settingsScreen = document.getElementById('settings-screen');
  settingsScreen.classList.remove('hidden');
}

function closeSettingsOverlay() {
  const settingsScreen = document.getElementById('settings-screen');
  settingsScreen.classList.add('hidden');
}

function getSettings() {
  const widthEl = document.getElementById('width');
  const heightEl = document.getElementById('height');
  const nextCountEl = document.getElementById('next-count');
  const blockCountEl = document.getElementById('block-count');
  return {
    width: widthEl ? parseInt(widthEl.value, 10) : 5,
    height: heightEl ? parseInt(heightEl.value, 10) : 6,
    nextCount: nextCountEl ? parseInt(nextCountEl.value, 10) : 5,
    blockCount: blockCountEl ? parseInt(blockCountEl.value, 10) : 3,
  };
}

function saveSettings(settings) {
  localStorage.setItem('tetrisSettings', JSON.stringify(settings));
  console.log('Settings saved');
}

function loadSettings() {
  const savedSettings = JSON.parse(localStorage.getItem('tetrisSettings'));
  if (savedSettings) {
    Object.entries(savedSettings).forEach(([key, value]) => {
      const slider = document.getElementById(key);
      const valueDisplay = document.getElementById(`${key}-value`);
      if (slider && valueDisplay) {
        slider.value = value;
        valueDisplay.textContent = value;
      }
    });
    const { width, height, blockCount } = savedSettings;
    createBoard(width, height, blockCount);
  }
}

// 画面をリセットして問題再生成
function generateProblem() {
  const { width, height, blockCount } = getSettings();
  createBoard(width, height, blockCount);
  updateNextPieces();
  updateProblemCounter();
  setEditAction('auto');
}

// 問題番号ラベル更新
function updateProblemCounter() {
  const problemCounter = document.getElementById('current-problem');
  if (problemCounter) {
    problemCounter.textContent = `問題 #${currentProblemNumber}`;
  }
}

let currentWidth = 5;
let currentHeight = 6;

function createBoard(width, height, blockCount = 0) {
  const board = document.getElementById('board');
  currentWidth = width;
  currentHeight = height;

  board.style.setProperty('--width', width);
  board.style.setProperty('--height', height);
  board.innerHTML = '';

  // マスを作成
  for (let i = 0; i < width * height; i++) {
    const cell = document.createElement('div');
    cell.style.width = `${config.CELL_SIZE}px`;
    cell.style.height = `${config.CELL_SIZE}px`;

    cell.addEventListener('click', () => {
      if (!currentEditAction) return;
      handleEditCellClick(cell, i, width, height);
    });

    board.appendChild(cell);
  }

  // ランダムブロック配置
  placeRandomBlocks(board, width, height, blockCount);
}

function placeRandomBlocks(board, width, height, blockCount) {
  const cells = Array.from(board.children);
  const columnIndices = Array.from({ length: width }, (_, i) => i);
  const placedBlocks = new Set();

  for (let i = 0; i < blockCount; i++) {
    let column;
    do {
      column =
        columnIndices[Math.floor(randomGenerator() * columnIndices.length)];
    } while (placedBlocks.has(`${column}-${i}`));

    for (let row = height - 1; row >= 0; row--) {
      const index = row * width + column;
      if (!cells[index].classList.contains('block')) {
        cells[index].classList.add('block', 'initial-block');
        placedBlocks.add(`${column}-${i}`);
        break;
      }
    }
  }
}

function updateNextPieces() {
  const settings = getSettings();
  const nextCount = settings.nextCount;
  const nextContainer = document.getElementById('next');
  nextContainer.innerHTML = '';

  for (let i = 0; i < nextCount; i++) {
    const randomMino = getRandomMino();
    if (randomMino) {
      const nextPieceContainer = document.createElement('div');
      nextPieceContainer.classList.add('next-piece-container');
      drawMino(randomMino, nextPieceContainer);
      nextContainer.appendChild(nextPieceContainer);
    }
  }
}

function getRandomMino() {
  const allMinos = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  return allMinos[Math.floor(randomGenerator() * allMinos.length)];
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

  const shape = minoShapes[minoType];
  const minoElement = document.createElement('div');
  minoElement.classList.add('next-piece');
  minoElement.style.display = 'grid';
  minoElement.style.gridTemplateColumns = `repeat(${shape[0].length}, 1fr)`;

  shape.forEach(row => {
    row.forEach(cell => {
      const cellElement = document.createElement('div');
      if (cell) {
        cellElement.classList.add('block');
        cellElement.style.backgroundColor = minoColors[minoType];
      }
      minoElement.appendChild(cellElement);
    });
  });
  container.appendChild(minoElement);
}

// スワイプなどのジェスチャー制御
function setupGestureControls() {
  const mainView = document.getElementById('main-view');
  const hammer = new Hammer(mainView);
  hammer.get('swipe').set({
    direction: Hammer.DIRECTION_HORIZONTAL | Hammer.DIRECTION_VERTICAL,
  });

  // 左スワイプ→次の問題
  hammer.on('swipeleft', () => {
    goToNextProblem();
  });
  // 右スワイプ→前の問題
  hammer.on('swiperight', () => {
    goToPreviousProblem();
  });
  // 上スワイプ→設定画面 (オーバーレイを開く)
  hammer.on('swipeup', () => {
    saveSettings(getSettings());
    openSettingsOverlay();
  });

  // 盤面ドラッグ
  setupMobileDragForBoard();
}

function setupMobileDragForBoard() {
  const boardContainer = document.getElementById('board-container');
  const board = document.getElementById('board');
  const hammer = new Hammer(boardContainer);

  hammer.get('pan').set({
    direction: Hammer.DIRECTION_ALL,
    threshold: 1,
  });

  hammer.on('panstart', () => {
    if (!currentEditAction) return;
    isDragging = false;
  });

  hammer.on('panmove', e => {
    if (!currentEditAction) return;
    isDragging = true;
    paintCellUnderPointer(e, board);
  });

  hammer.on('panend', () => {
    isDragging = false;
  });
}

function paintCellUnderPointer(e, board) {
  const x = e.center.x;
  const y = e.center.y;
  const target = document.elementFromPoint(x, y);

  if (target && target.parentNode === board) {
    const index = Array.from(board.children).indexOf(target);
    if (index >= 0) {
      handleEditCellClick(target, index, currentWidth, currentHeight);
    }
  }
}

// 問題移動
function goToNextProblem() {
  currentProblemNumber += 1;
  randomGenerator = createSeededGenerator(baseSeed, currentProblemNumber);
  generateProblem();
}
function goToPreviousProblem() {
  if (currentProblemNumber > 1) {
    currentProblemNumber -= 1;
    randomGenerator = createSeededGenerator(baseSeed, currentProblemNumber);
    generateProblem();
  }
}

// 編集系
let currentEditAction = null; // "auto" / "delete" / "gray" など
let autoCells = [];
let isAutoInProgress = false;
let isDragging = false;

function setupEditButton() {
  // Auto / Del / Gray など
  const editOptionButtons = document.querySelectorAll('.edit-option');
  editOptionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      editOptionButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      if (autoCells.length > 0) {
        resetAutoCells();
      }
      currentEditAction = btn.dataset.action;
    });
  });

  // clearボタン
  const clearButton = document.getElementById('clear-board');
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      resetToInitialBoard();
    });
  }

  // デフォルトはautoに
  const autoBtn = document.querySelector('.edit-option[data-action="auto"]');
  if (autoBtn) {
    editOptionButtons.forEach(b => b.classList.remove('selected'));
    autoBtn.classList.add('selected');
    currentEditAction = 'auto';
  }
}

function setEditAction(action) {
  currentEditAction = action;
}

function handleEditCellClick(cell, index, width, height) {
  // 初期配置のブロックは削除不可
  if (cell.classList.contains('initial-block')) {
    return;
  }

  // Delete
  if (currentEditAction === 'delete') {
    paintCell(cell, '');
    return;
  }
  // Gray
  else if (currentEditAction === 'gray') {
    // 押下されたマスをgrayにする
    paintCell(cell, minoColors['G']); // 'rgb(204,204,204)'
    return;
  }
  // Auto
  else if (currentEditAction === 'auto') {
    handleAutoReplace(cell, index, width, height);
    return;
  }

  // それ以外 (通常ペイント)
  const oldColor = cell.style.backgroundColor;
  const newColor = minoColors[currentEditAction];
  if (!newColor) return;

  if (isDragging) {
    // ドラッグ中は常に上書き
    paintCell(cell, newColor);
  } else {
    // クリックはトグル
    if (isSameColor(oldColor, newColor)) {
      paintCell(cell, '');
    } else {
      paintCell(cell, newColor);
    }
  }
}

function handleAutoReplace(cell, index, width, height) {
  if (cell.classList.contains('initial-block')) {
    return;
  }

  const oldColor = cell.style.backgroundColor;
  // 既にwhiteなら取り消し
  if (oldColor === 'white') {
    clearCell(cell);
    const cellIndex = autoCells.findIndex(c => c.cellEl === cell);
    if (cellIndex !== -1) {
      autoCells.splice(cellIndex, 1);
    }
    return;
  }

  // 何か他の色があるなら不可
  if (cell.classList.contains('block') && oldColor !== '') {
    return;
  }

  // 4マス埋まっていれば不可
  if (autoCells.length >= 4) {
    return;
  }

  // 白セルにする
  paintCell(cell, 'white');
  const x = index % width;
  const y = Math.floor(index / width);
  autoCells.push({ x, y, cellEl: cell });
  isAutoInProgress = true;

  if (autoCells.length === 4) {
    const positions = autoCells.map(c => ({ x: c.x, y: c.y }));
    const detectedMino = detectMinoShape(positions);
    if (detectedMino) {
      const color = minoColors[detectedMino];
      autoCells.forEach(c => paintCell(c.cellEl, color));
    } else {
      // ミノ形にならなければリセット
      resetAutoCells();
    }
    autoCells = [];
    isAutoInProgress = false;
  }
}

function paintCell(cellElement, color) {
  cellElement.style.backgroundColor = color;
  if (color) {
    cellElement.classList.add('block');
  } else {
    cellElement.classList.remove('block');
  }
}
function clearCell(cellElement) {
  paintCell(cellElement, '');
}

// autoCells の白マスをリセット
function resetAutoCells() {
  autoCells.forEach(({ cellEl }) => {
    clearCell(cellEl);
  });
  autoCells = [];
  isAutoInProgress = false;
}

// 色比較
function parseRGBString(rgbString) {
  const match = rgbString.match(/rgb\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)\s*\)/i);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function isSameColor(colorA, colorB) {
  const rgbA = parseRGBString(colorA) || [];
  const rgbB = parseRGBString(colorB) || [];
  return rgbA[0] === rgbB[0] && rgbA[1] === rgbB[1] && rgbA[2] === rgbB[2];
}

// ミノ形状判定
function detectMinoShape(positions) {
  const minX = Math.min(...positions.map(p => p.x));
  const minY = Math.min(...positions.map(p => p.y));
  const normalized = positions.map(p => ({ x: p.x - minX, y: p.y - minY }));

  const shapePatterns = {
    I: [
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
      ],
      [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 0, y: 3 },
      ],
    ],
    O: [
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ],
    ],
    T: [
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 1, y: 1 },
      ],
      [
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 1, y: 2 },
      ],
      [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
      [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 1, y: 1 },
      ],
    ],
    S: [
      [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ],
      [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 2 },
      ],
    ],
    Z: [
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
      [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 0, y: 2 },
      ],
    ],
    J: [
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 1 },
      ],
      [
        { x: 0, y: 2 },
        { x: 0, y: 1 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
      [
        { x: 2, y: 1 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
        { x: 0, y: 0 },
      ],
      [
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 1, y: 2 },
        { x: 0, y: 2 },
      ],
    ],
    L: [
      [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 1, y: 2 },
      ],
      [
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 2, y: 0 },
      ],
      [
        { x: 1, y: 2 },
        { x: 1, y: 1 },
        { x: 1, y: 0 },
        { x: 0, y: 0 },
      ],
      [
        { x: 2, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 1 },
      ],
    ],
  };

  for (const [minoType, patterns] of Object.entries(shapePatterns)) {
    for (const pattern of patterns) {
      if (isSameShape(normalized, pattern)) {
        return minoType;
      }
    }
  }
  return null;
}

// 座標配列が同じ形状か判定
function isSameShape(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  const sortByXY = (a, b) => a.x - b.x || a.y - b.y;
  const s1 = [...arr1].sort(sortByXY);
  const s2 = [...arr2].sort(sortByXY);
  return s1.every((p, i) => p.x === s2[i].x && p.y === s2[i].y);
}

// 初期ブロック以外をリセット
function resetToInitialBoard() {
  const board = document.getElementById('board');
  const cells = Array.from(board.children);
  cells.forEach(cell => {
    if (!cell.classList.contains('initial-block')) {
      cell.style.backgroundColor = '';
      cell.classList.remove('block');
    }
  });
  console.log('Cleared all edits. Now only initial-block remain.');
}

document.addEventListener('DOMContentLoaded', initializeApp);
