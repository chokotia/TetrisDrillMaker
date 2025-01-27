// Centralized Configuration
const config = {
  CELL_SIZE: 30, // Cell size in pixels
  VERSION: '0.2.2',
  MIN_WIDTH: 3,
  MAX_WIDTH: 10,
  MIN_HEIGHT: 6,
  MAX_HEIGHT: 10,
  MIN_NEXT_COUNT: 2,
  MAX_NEXT_COUNT: 10,
  MIN_BLOCK_COUNT: 0,
  MAX_BLOCK_COUNT: 30,
};

// ミノとカラーの対応表 (RGBから16進数カラーコードに変更)
const minoColors = {
  S: '#59B101',
  Z: '#D70F37',
  L: '#E35B02',
  J: '#2141C6',
  O: '#E39F02',
  T: '#AF298A',
  I: '#0F9BD7',
  gray: '#CCCCCC', // gray 用
  white: '#FFFFFF', // white 用
  default: '#B0C4DE', // 初期ブロック用のデフォルト色
};

// シード付き乱数 (Mulberry32)
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
(() => {
  let baseSeed = '';
  let currentProblemNumber = 1;
  let randomGenerator = null;

  // BootstrapのModalインスタンスを格納する変数
  let bsSettingsModal = null;

  // 編集系
  let currentEditAction = 'auto'; // "auto" / "delete" / "gray" など
  let autoCells = [];
  let isAutoInProgress = false;
  let isDragging = false;

  // DOM要素のキャッシュ
  const dom = {
    settingsButton: document.getElementById('settings-button'),
    saveAndCloseBtn: document.getElementById('save-and-close-settings'),
    closeIconBtn: document.getElementById('close-settings-without-save'),
    editOptionButtons: document.querySelectorAll('.edit-option'),
    clearButton: document.getElementById('clear-board'),
    problemCounter: document.getElementById('current-problem'),
    board: document.getElementById('board'),
    nextContainer: document.getElementById('next'),
    mainView: document.getElementById('main-view'),
    boardContainer: document.getElementById('board-container'),
  };

  document.addEventListener('DOMContentLoaded', initializeApp);

  function initializeApp() {
    baseSeed = generateBaseSeed();
    currentProblemNumber = 1;
    randomGenerator = createSeededGenerator(baseSeed, currentProblemNumber);

    // Bootstrapモーダルのインスタンス作成
    const settingsModalElement = document.getElementById('settings-modal');
    if (settingsModalElement) {
      bsSettingsModal = new bootstrap.Modal(settingsModalElement, {
        // 必要に応じて backdrop:'static' などオプションを追加
      });
    }

    setupEventListeners();
    loadSettings();
    setupGestureControls();
    setupEditButtons();

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
    // スライダーの表示更新
    ['width', 'height', 'next-count', 'block-count'].forEach(id => {
      const slider = document.getElementById(id);
      const output = document.getElementById(`${id}-value`);
      if (slider && output) {
        slider.addEventListener('input', () => {
          output.textContent = slider.value;
          updateAriaValue(slider, output);
        });
      }
    });

    // 設定ボタン -> モーダルを開く
    if (dom.settingsButton) {
      dom.settingsButton.addEventListener('click', openSettingsOverlay);
    }

    // 「保存して閉じる」ボタン
    if (dom.saveAndCloseBtn) {
      dom.saveAndCloseBtn.addEventListener('click', () => {
        // 設定を保存
        const settings = getSettings();
        saveSettings(settings);
        // ボードとNEXTの内容を再描画 (問題番号はそのまま)
        generateProblem();
        // モーダルを閉じる
        closeSettingsOverlay();
      });
    }

    // 「×」ボタン (id="close-settings-without-save")
    if (dom.closeIconBtn) {
      dom.closeIconBtn.addEventListener('click', () => {
        console.log('設定を保存せず閉じました。');
      });
    }

    // Auto/Del/Gray ボタン
    dom.editOptionButtons.forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        setEditAction(action);
        updateEditButtonState(action);
      });
    });

    // Clearボタン
    if (dom.clearButton) {
      dom.clearButton.addEventListener('click', () => {
        resetToInitialBoard();
      });
    }
  }

  // ARIA属性の更新
  function updateAriaValue(slider, output) {
    slider.setAttribute('aria-valuenow', slider.value);
  }

  // Bootstrapモーダルを開く
  function openSettingsOverlay() {
    if (bsSettingsModal) {
      bsSettingsModal.show();
    }
  }

  // Bootstrapモーダルを閉じる
  function closeSettingsOverlay() {
    if (bsSettingsModal) {
      bsSettingsModal.hide();
    }
  }

  function getSettings() {
    const widthEl = document.getElementById('width');
    const heightEl = document.getElementById('height');
    const nextCountEl = document.getElementById('next-count');
    const blockCountEl = document.getElementById('block-count');
    return {
      width: widthEl ? parseInt(widthEl.value, 10) : config.MIN_WIDTH,
      height: heightEl ? parseInt(heightEl.value, 10) : config.MIN_HEIGHT,
      nextCount: nextCountEl
        ? parseInt(nextCountEl.value, 10)
        : config.MIN_NEXT_COUNT,
      blockCount: blockCountEl
        ? parseInt(blockCountEl.value, 10)
        : config.MIN_BLOCK_COUNT,
    };
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem('tetrisSettings', JSON.stringify(settings));
      console.log('Settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  function loadSettings() {
    try {
      const savedSettings = JSON.parse(localStorage.getItem('tetrisSettings'));
      if (savedSettings) {
        Object.entries(savedSettings).forEach(([key, value]) => {
          const slider = document.getElementById(key);
          const valueDisplay = document.getElementById(`${key}-value`);
          if (slider && valueDisplay) {
            slider.value = value;
            valueDisplay.textContent = value;
            updateAriaValue(slider, valueDisplay);
          }
        });
        const { width, height, blockCount } = savedSettings;
        createBoard(width, height, blockCount);
      } else {
        // 初期設定がない場合はデフォルト設定をロード
        createBoard(
          config.MIN_WIDTH,
          config.MIN_HEIGHT,
          config.MIN_BLOCK_COUNT
        );
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  // 画面をリセットして問題再生成
  function generateProblem() {
    const { width, height, blockCount } = getSettings();
    createBoard(width, height, blockCount);
    updateNextPieces();
    updateProblemCounter();
    setEditAction('auto');
    updateEditButtonState('auto');
  }

  // 問題番号ラベル更新
  function updateProblemCounter() {
    if (dom.problemCounter) {
      dom.problemCounter.textContent = `問題 #${currentProblemNumber}`;
    }
  }

  let currentWidth = config.MIN_WIDTH;
  let currentHeight = config.MIN_HEIGHT;

  function createBoard(width, height, blockCount = 0) {
    if (!dom.board) return;

    currentWidth = width;
    currentHeight = height;

    dom.board.style.setProperty('--width', width);
    dom.board.style.setProperty('--height', height);
    dom.board.innerHTML = '';

    const fragment = document.createDocumentFragment();

    // マスを作成
    for (let i = 0; i < width * height; i++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.style.width = `${config.CELL_SIZE}px`;
      cell.style.height = `${config.CELL_SIZE}px`;

      cell.addEventListener('click', () => {
        if (!currentEditAction) return;
        handleEditCellClick(cell, i, width, height);
      });

      fragment.appendChild(cell);
    }

    dom.board.appendChild(fragment);

    // ランダムブロック配置
    placeRandomBlocks(width, height, blockCount);
  }

  function placeRandomBlocks(width, height, blockCount) {
    if (!dom.board) return;

    const cells = Array.from(dom.board.children);
    const columnIndices = Array.from({ length: width }, (_, i) => i);
    const placedBlocks = new Set();

    for (let i = 0; i < blockCount; i++) {
      let column;
      let attempts = 0;
      const maxAttempts = 100;
      do {
        column =
          columnIndices[Math.floor(randomGenerator() * columnIndices.length)];
        attempts++;
        if (attempts > maxAttempts) break;
      } while (placedBlocks.has(`${column}-${i}`));

      for (let row = height - 1; row >= 0; row--) {
        const index = row * width + column;
        if (!cells[index].classList.contains('block')) {
          cells[index].classList.add('block', 'initial-block');
          cells[index].style.backgroundColor = minoColors['default']; // デフォルト色を設定
          placedBlocks.add(`${column}-${i}`);
          break;
        }
      }
    }
  }

  function updateNextPieces() {
    const settings = getSettings();
    const nextCount = settings.nextCount;
    if (!dom.nextContainer) return;
    dom.nextContainer.innerHTML = '';

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < nextCount; i++) {
      const randomMino = getRandomMino();
      if (randomMino) {
        const nextPieceContainer = document.createElement('div');
        nextPieceContainer.classList.add('next-piece-container');
        drawMino(randomMino, nextPieceContainer);
        fragment.appendChild(nextPieceContainer);
      }
    }

    dom.nextContainer.appendChild(fragment);
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
    if (!shape) return;

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
    if (!dom.mainView) return;

    const hammer = new Hammer(dom.mainView);
    hammer.get('swipe').set({
      direction: Hammer.DIRECTION_ALL,
    });

    // 左スワイプ→次の問題
    hammer.on('swipeleft', goToNextProblem);
    // 右スワイプ→前の問題
    hammer.on('swiperight', goToPreviousProblem);

    // 盤面ドラッグ
    setupMobileDragForBoard();
  }

  function setupMobileDragForBoard() {
    if (!dom.boardContainer || !dom.board) return;

    const hammer = new Hammer(dom.boardContainer);

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
      paintCellUnderPointer(e, dom.board);
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
  function setupEditButtons() {
    // デフォルトはautoに
    updateEditButtonState('auto');
    setEditAction('auto');
  }

  function setEditAction(action) {
    currentEditAction = action;
  }

  function updateEditButtonState(selectedAction) {
    dom.editOptionButtons.forEach(btn => {
      if (btn.dataset.action === selectedAction) {
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('selected');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
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
      paintCell(cell, minoColors['gray']); // '#CCCCCC'
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
    // 既に#FFFFFFなら取り消し
    if (oldColor.toLowerCase() === '#ffffff') {
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

    // #FFFFFFセルにする
    paintCell(cell, minoColors['white']);
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

  // 色比較 (16進数カラーコードの比較に変更)
  function isSameColor(colorA, colorB) {
    if (!colorA || !colorB) return false;
    return colorA.toLowerCase() === colorB.toLowerCase();
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
    if (!dom.board) return;
    const cells = Array.from(dom.board.children);
    cells.forEach(cell => {
      if (!cell.classList.contains('initial-block')) {
        cell.style.backgroundColor = '';
        cell.classList.remove('block');
      }
    });
    console.log('Cleared all edits. Now only initial-block remain.');
  }
})();
