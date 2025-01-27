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
class TetrisApp {
  constructor() {
    this.baseSeed = '';
    this.currentProblemNumber = 1;
    this.randomGenerator = null;

    // BootstrapのModalインスタンスを格納する変数
    this.bsSettingsModal = null;

    // 編集系
    this.currentEditAction = 'auto'; // "auto" / "delete" / "gray" など
    this.autoCells = [];
    this.isAutoInProgress = false;
    this.isDragging = false;

    // DOM要素のキャッシュ
    this.dom = {
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
      sliders: {
        width: document.getElementById('width'),
        height: document.getElementById('height'),
        nextCount: document.getElementById('next-count'),
        blockCount: document.getElementById('block-count'),
      },
      sliderValues: {
        width: document.getElementById('width-value'),
        height: document.getElementById('height-value'),
        nextCount: document.getElementById('next-count-value'),
        blockCount: document.getElementById('block-count-value'),
      },
    };

    document.addEventListener('DOMContentLoaded', () => this.initializeApp());
  }

  initializeApp() {
    try {
      this.baseSeed = generateBaseSeed();
      this.currentProblemNumber = 1;
      this.randomGenerator = this.createSeededGenerator(
        this.baseSeed,
        this.currentProblemNumber
      );

      // Bootstrapモーダルのインスタンス作成
      const settingsModalElement = document.getElementById('settings-modal');
      if (settingsModalElement) {
        this.bsSettingsModal = new bootstrap.Modal(settingsModalElement, {
          // 必要に応じて backdrop:'static' などオプションを追加
        });
      }

      this.setupEventListeners();
      this.loadSettings();
      this.setupGestureControls();
      this.setupEditButtons();

      // 最初の問題を生成
      this.generateProblem();

      console.log(`Base Seed: ${this.baseSeed}`);
      console.log(`Starting at Problem #${this.currentProblemNumber}`);
    } catch (error) {
      console.error('Initialization failed:', error);
    }
  }

  createSeededGenerator(base, number) {
    const seedString = `${base}_${number}`;
    let seed = 0;
    for (let i = 0; i < seedString.length; i++) {
      seed += seedString.charCodeAt(i);
    }
    return mulberry32(seed);
  }

  setupEventListeners() {
    // スライダーの表示更新
    Object.keys(this.dom.sliders).forEach(key => {
      const slider = this.dom.sliders[key];
      const output = this.dom.sliderValues[key];
      if (slider && output) {
        slider.addEventListener('input', () => {
          output.textContent = slider.value;
          this.updateAriaValue(slider, output);
        });
      }
    });

    // 設定ボタン -> モーダルを開く
    if (this.dom.settingsButton) {
      this.dom.settingsButton.addEventListener('click', () =>
        this.openSettingsOverlay()
      );
    }

    // 「保存して閉じる」ボタン
    if (this.dom.saveAndCloseBtn) {
      this.dom.saveAndCloseBtn.addEventListener('click', () =>
        this.handleSaveAndClose()
      );
    }

    // 「×」ボタン (id="close-settings-without-save")
    if (this.dom.closeIconBtn) {
      this.dom.closeIconBtn.addEventListener('click', () =>
        this.handleCloseWithoutSave()
      );
    }

    // Auto/Del/Gray ボタン
    this.dom.editOptionButtons.forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        this.setEditAction(action);
        this.updateEditButtonState(action);
      });
    });

    // Clearボタン
    if (this.dom.clearButton) {
      this.dom.clearButton.addEventListener('click', () =>
        this.resetToInitialBoard()
      );
    }
  }

  // ARIA属性の更新
  updateAriaValue(slider, output) {
    slider.setAttribute('aria-valuenow', slider.value);
  }

  // Bootstrapモーダルを開く
  openSettingsOverlay() {
    if (this.bsSettingsModal) {
      this.bsSettingsModal.show();
    }
  }

  // Bootstrapモーダルを閉じる
  closeSettingsOverlay() {
    if (this.bsSettingsModal) {
      this.bsSettingsModal.hide();
    }
  }

  handleSaveAndClose() {
    // 設定を保存
    const settings = this.getSettings();
    this.saveSettings(settings);
    // ボードとNEXTの内容を再描画 (問題番号はそのまま)
    this.generateProblem();
    // モーダルを閉じる
    this.closeSettingsOverlay();
  }

  handleCloseWithoutSave() {
    console.log('設定を保存せず閉じました。');
  }

  getSettings() {
    const width = this.dom.sliders.width
      ? parseInt(this.dom.sliders.width.value, 10)
      : config.MIN_WIDTH;
    const height = this.dom.sliders.height
      ? parseInt(this.dom.sliders.height.value, 10)
      : config.MIN_HEIGHT;
    const nextCount = this.dom.sliders.nextCount
      ? parseInt(this.dom.sliders.nextCount.value, 10)
      : config.MIN_NEXT_COUNT;
    const blockCount = this.dom.sliders.blockCount
      ? parseInt(this.dom.sliders.blockCount.value, 10)
      : config.MIN_BLOCK_COUNT;
    return { width, height, nextCount, blockCount };
  }

  saveSettings(settings) {
    try {
      localStorage.setItem('tetrisSettings', JSON.stringify(settings));
      console.log('Settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  loadSettings() {
    try {
      const savedSettings = JSON.parse(localStorage.getItem('tetrisSettings'));
      if (savedSettings) {
        Object.entries(savedSettings).forEach(([key, value]) => {
          const slider = this.dom.sliders[key];
          const valueDisplay = this.dom.sliderValues[key];
          if (slider && valueDisplay) {
            slider.value = value;
            valueDisplay.textContent = value;
            this.updateAriaValue(slider, valueDisplay);
          }
        });
        const { width, height, blockCount } = savedSettings;
        this.createBoard(width, height, blockCount);
      } else {
        // 初期設定がない場合はデフォルト設定をロード
        this.createBoard(
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
  generateProblem() {
    const { width, height, blockCount } = this.getSettings();
    this.createBoard(width, height, blockCount);
    this.updateNextPieces();
    this.updateProblemCounter();
    this.setEditAction('auto');
    this.updateEditButtonState('auto');
  }

  // 問題番号ラベル更新
  updateProblemCounter() {
    if (this.dom.problemCounter) {
      this.dom.problemCounter.textContent = `問題 #${this.currentProblemNumber}`;
    }
  }

  createBoard(width, height, blockCount = 0) {
    if (!this.dom.board) return;

    this.currentWidth = width;
    this.currentHeight = height;

    this.dom.board.style.setProperty('--width', width);
    this.dom.board.style.setProperty('--height', height);
    this.dom.board.innerHTML = '';

    const fragment = document.createDocumentFragment();

    // マスを作成
    for (let i = 0; i < width * height; i++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.style.width = `${config.CELL_SIZE}px`;
      cell.style.height = `${config.CELL_SIZE}px`;

      cell.addEventListener('click', () => {
        if (!this.currentEditAction) return;
        this.handleEditCellClick(cell, i, width, height);
      });

      fragment.appendChild(cell);
    }

    this.dom.board.appendChild(fragment);

    // ランダムブロック配置
    this.placeRandomBlocks(width, height, blockCount);
  }

  placeRandomBlocks(width, height, blockCount) {
    if (!this.dom.board) return;

    const cells = Array.from(this.dom.board.children);
    const columnIndices = Array.from({ length: width }, (_, i) => i);
    const placedBlocks = new Set();

    for (let i = 0; i < blockCount; i++) {
      let column;
      let attempts = 0;
      const maxAttempts = 100;
      do {
        column =
          columnIndices[
            Math.floor(this.randomGenerator() * columnIndices.length)
          ];
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

  updateNextPieces() {
    const settings = this.getSettings();
    const nextCount = settings.nextCount;
    if (!this.dom.nextContainer) return;
    this.dom.nextContainer.innerHTML = '';

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < nextCount; i++) {
      const randomMino = this.getRandomMino();
      if (randomMino) {
        const nextPieceContainer = document.createElement('div');
        nextPieceContainer.classList.add('next-piece-container');
        this.drawMino(randomMino, nextPieceContainer);
        fragment.appendChild(nextPieceContainer);
      }
    }

    this.dom.nextContainer.appendChild(fragment);
  }

  getRandomMino() {
    const allMinos = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    return allMinos[Math.floor(this.randomGenerator() * allMinos.length)];
  }

  drawMino(minoType, container) {
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
  setupGestureControls() {
    if (!this.dom.mainView) return;

    const hammer = new Hammer(this.dom.mainView);
    hammer.get('swipe').set({
      direction: Hammer.DIRECTION_ALL,
    });

    // 左スワイプ→次の問題
    hammer.on('swipeleft', () => this.goToNextProblem());
    // 右スワイプ→前の問題
    hammer.on('swiperight', () => this.goToPreviousProblem());

    // 盤面ドラッグ
    this.setupMobileDragForBoard();
  }

  setupMobileDragForBoard() {
    if (!this.dom.boardContainer || !this.dom.board) return;

    const hammer = new Hammer(this.dom.boardContainer);

    hammer.get('pan').set({
      direction: Hammer.DIRECTION_ALL,
      threshold: 1,
    });

    hammer.on('panstart', () => {
      if (!this.currentEditAction) return;
      this.isDragging = false;
    });

    hammer.on('panmove', e => {
      if (!this.currentEditAction) return;
      this.isDragging = true;
      this.paintCellUnderPointer(e, this.dom.board);
    });

    hammer.on('panend', () => {
      this.isDragging = false;
    });
  }

  paintCellUnderPointer(e, board) {
    const x = e.center.x;
    const y = e.center.y;
    const target = document.elementFromPoint(x, y);

    if (target && target.parentNode === board) {
      const index = Array.from(board.children).indexOf(target);
      if (index >= 0) {
        this.handleEditCellClick(
          target,
          index,
          this.currentWidth,
          this.currentHeight
        );
      }
    }
  }

  // 問題移動
  goToNextProblem() {
    this.currentProblemNumber += 1;
    this.randomGenerator = this.createSeededGenerator(
      this.baseSeed,
      this.currentProblemNumber
    );
    this.generateProblem();
  }

  goToPreviousProblem() {
    if (this.currentProblemNumber > 1) {
      this.currentProblemNumber -= 1;
      this.randomGenerator = this.createSeededGenerator(
        this.baseSeed,
        this.currentProblemNumber
      );
      this.generateProblem();
    }
  }

  // 編集系
  setupEditButtons() {
    // デフォルトはautoに
    this.updateEditButtonState('auto');
    this.setEditAction('auto');
  }

  setEditAction(action) {
    this.currentEditAction = action;
  }

  updateEditButtonState(selectedAction) {
    this.dom.editOptionButtons.forEach(btn => {
      if (btn.dataset.action === selectedAction) {
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('selected');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  }

  handleEditCellClick(cell, index, width, height) {
    // 初期配置のブロックは削除不可
    if (cell.classList.contains('initial-block')) {
      return;
    }

    // Delete
    if (this.currentEditAction === 'delete') {
      this.paintCell(cell, '');
      return;
    }
    // Gray
    else if (this.currentEditAction === 'gray') {
      // 押下されたマスをgrayにする
      this.paintCell(cell, minoColors['gray']); // '#CCCCCC'
      return;
    }
    // Auto
    else if (this.currentEditAction === 'auto') {
      this.handleAutoReplace(cell, index, width, height);
      return;
    }

    // それ以外 (通常ペイント)
    const oldColor = cell.style.backgroundColor;
    const newColor = minoColors[this.currentEditAction];
    if (!newColor) return;

    if (this.isDragging) {
      // ドラッグ中は常に上書き
      this.paintCell(cell, newColor);
    } else {
      // クリックはトグル
      if (this.isSameColor(oldColor, newColor)) {
        this.paintCell(cell, '');
      } else {
        this.paintCell(cell, newColor);
      }
    }
  }

  handleAutoReplace(cell, index, width, height) {
    if (cell.classList.contains('initial-block')) {
      return;
    }

    const oldColor = cell.style.backgroundColor;
    // 既に#FFFFFFなら取り消し
    if (oldColor.toLowerCase() === '#ffffff') {
      this.clearCell(cell);
      const cellIndex = this.autoCells.findIndex(c => c.cellEl === cell);
      if (cellIndex !== -1) {
        this.autoCells.splice(cellIndex, 1);
      }
      return;
    }

    // 何か他の色があるなら不可
    if (cell.classList.contains('block') && oldColor !== '') {
      return;
    }

    // 4マス埋まっていれば不可
    if (this.autoCells.length >= 4) {
      return;
    }

    // #FFFFFFセルにする
    this.paintCell(cell, minoColors['white']);
    const x = index % width;
    const y = Math.floor(index / width);
    this.autoCells.push({ x, y, cellEl: cell });
    this.isAutoInProgress = true;

    if (this.autoCells.length === 4) {
      const positions = this.autoCells.map(c => ({ x: c.x, y: c.y }));
      const detectedMino = this.detectMinoShape(positions);
      if (detectedMino) {
        const color = minoColors[detectedMino];
        this.autoCells.forEach(c => this.paintCell(c.cellEl, color));
      } else {
        // ミノ形にならなければリセット
        this.resetAutoCells();
      }
      this.autoCells = [];
      this.isAutoInProgress = false;
    }
  }

  paintCell(cellElement, color) {
    cellElement.style.backgroundColor = color;
    if (color) {
      cellElement.classList.add('block');
    } else {
      cellElement.classList.remove('block');
    }
  }

  clearCell(cellElement) {
    this.paintCell(cellElement, '');
  }

  // autoCells の白マスをリセット
  resetAutoCells() {
    this.autoCells.forEach(({ cellEl }) => {
      this.clearCell(cellEl);
    });
    this.autoCells = [];
    this.isAutoInProgress = false;
  }

  // 色比較 (16進数カラーコードの比較に変更)
  isSameColor(colorA, colorB) {
    if (!colorA || !colorB) return false;
    return colorA.toLowerCase() === colorB.toLowerCase();
  }

  // ミノ形状判定
  detectMinoShape(positions) {
    const minX = Math.min(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const normalized = positions.map(p => ({
      x: p.x - minX,
      y: p.y - minY,
    }));

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
        if (this.isSameShape(normalized, pattern)) {
          return minoType;
        }
      }
    }
    return null;
  }

  // 座標配列が同じ形状か判定
  isSameShape(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    const sortByXY = (a, b) => a.x - b.x || a.y - b.y;
    const s1 = [...arr1].sort(sortByXY);
    const s2 = [...arr2].sort(sortByXY);
    return s1.every((p, i) => p.x === s2[i].x && p.y === s2[i].y);
  }

  // 初期ブロック以外をリセット
  resetToInitialBoard() {
    if (!this.dom.board) return;
    const cells = Array.from(this.dom.board.children);
    cells.forEach(cell => {
      if (!cell.classList.contains('initial-block')) {
        cell.style.backgroundColor = '';
        cell.classList.remove('block');
      }
    });
    console.log('Cleared all edits. Now only initial-block remain.');
  }
}

// アプリのインスタンスを生成
new TetrisApp();
