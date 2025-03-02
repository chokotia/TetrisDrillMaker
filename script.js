// アプリケーション設定
const config = {
  // 表示設定
  CELL_SIZE: 30,  // セルのサイズ（ピクセル）
  VERSION: '0.2.7',  // アプリケーションバージョン

  // ボードサイズの制限
  BOARD: {
    MIN_WIDTH: 3,
    MAX_WIDTH: 10,
    MIN_HEIGHT: 6,
    MAX_HEIGHT: 10,
  },

  // NEXTの表示数制限
  NEXT: {
    MIN_COUNT: 2,
    MAX_COUNT: 10,
  },

  // 初期配置ブロック数の制限
  BLOCKS: {
    MIN_COUNT: 0,
    MAX_COUNT: 30,
  },
};

// ミノとカラーの対応表
const minoColors = {
  // 通常のミノの色
  I: '#0F9BD7',
  J: '#2141C6',
  L: '#E35B02',
  O: '#E39F02',
  S: '#59B101',
  T: '#AF298A',
  Z: '#D70F37',
  
  // 特殊な状態の色
  gray: '#CCCCCC',
  white: '#FFFFFF',
  default: '#B0C4DE',
};

// ミノの形状パターン定義
const MINO_PATTERNS = {
  I: [
    // 横向き
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ],
    // 縦向き
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
    ],
  ],
  O: [
    // 正方形（回転なし）
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  ],
  T: [
    // 上向き
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
    ],
    // 右向き
    [
      { x: 0, y: 1 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
    // 下向き
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    // 左向き
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 1 },
    ],
  ],
  S: [
    // 横向き
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    // 縦向き
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  ],
  Z: [
    // 横向き
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    // 縦向き
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
    ],
  ],
  J: [
    // 上向き
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
    ],
    // 右向き
    [
      { x: 0, y: 2 },
      { x: 0, y: 1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ],
    // 下向き
    [
      { x: 2, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: 0, y: 0 },
    ],
    // 左向き
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
    ],
  ],
  L: [
    // 上向き
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
    // 右向き
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 0 },
    ],
    // 下向き
    [
      { x: 1, y: 2 },
      { x: 1, y: 1 },
      { x: 1, y: 0 },
      { x: 0, y: 0 },
    ],
    // 左向き
    [
      { x: 2, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    ],
  ],
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

// Fisher–Yates シャッフル (シード付き乱数を利用)
function shuffle(array, random) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/* ---- ここからアプリ本体 ---- */
class TetrisApp {
  constructor() {
    this.baseSeed = '';
    this.currentProblemNumber = 1;
    this.randomGenerator = null;
    this.bsSettingsModal = null;
    this.currentEditAction = 'auto';
    this.autoCells = [];
    this.isAutoInProgress = false;
    this.isDragging = false;
    this.dom = this.initializeDOMElements();

    document.addEventListener('DOMContentLoaded', () => this.initializeApp());
  }

  initializeDOMElements() {
    return {
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
        blockRange: document.getElementById('block-range-slider'),
      },
      sliderValues: {
        width: document.getElementById('width-value'),
        height: document.getElementById('height-value'),
        nextCount: document.getElementById('next-count-value'),
        blockRange: document.getElementById('block-range-values'),
      },
    };
  }

  initializeApp() {
    try {
      this.initializeGameState();
      this.initializeSettingsModal();
      this.initializeControls();
      this.generateFirstProblem();
      this.logInitializationInfo();
    } catch (error) {
      console.error('Initialization failed:', error);
    }
  }

  initializeGameState() {
    this.baseSeed = generateBaseSeed();
    this.currentProblemNumber = 1;
    this.randomGenerator = this.createSeededGenerator(
      this.baseSeed,
      this.currentProblemNumber
    );
  }

  initializeSettingsModal() {
    const settingsModalElement = document.getElementById('settings-modal');
    if (settingsModalElement) {
      this.bsSettingsModal = new bootstrap.Modal(settingsModalElement);
    }
  }

  initializeControls() {
    this.setupAllEventListeners();
    this.initializeBlockRangeSlider();
    this.loadSettings();
    this.setupGestureControls();
    this.setupEditButtons();
  }

  generateFirstProblem() {
    this.generateProblem();
  }

  logInitializationInfo() {
    console.log(`Base Seed: ${this.baseSeed}`);
    console.log(`Starting at Problem #${this.currentProblemNumber}`);
  }

  createSeededGenerator(base, number) {
    const seedString = `${base}_${number}`;
    let seed = 0;
    for (let i = 0; i < seedString.length; i++) {
      seed += seedString.charCodeAt(i);
    }
    return mulberry32(seed);
  }

  // イベントリスナーのセットアップを機能ごとに分割
  setupAllEventListeners() {
    this.setupSliderListeners();
    this.setupModalListeners();
    this.setupEditOptionListeners();
    this.setupClearButtonListener();
  }

  // スライダー関連のイベントリスナー
  setupSliderListeners() {
    Object.keys(this.dom.sliders).forEach(key => {
      if (key === 'blockRange') return; // noUiSlider は別処理

      const slider = this.dom.sliders[key];
      const output = this.dom.sliderValues[key];
      if (slider && output) {
        slider.addEventListener('input', () => {
          output.textContent = slider.value;
          this.updateAriaValue(slider, output);
        });
      }
    });
  }

  // モーダル関連のイベントリスナー
  setupModalListeners() {
    if (this.dom.settingsButton) {
      this.dom.settingsButton.addEventListener('click', () => 
        this.openSettingsOverlay()
      );
    }

    if (this.dom.saveAndCloseBtn) {
      this.dom.saveAndCloseBtn.addEventListener('click', () => 
        this.handleSaveAndClose()
      );
    }

    if (this.dom.closeIconBtn) {
      this.dom.closeIconBtn.addEventListener('click', () => 
        this.handleCloseWithoutSave()
      );
    }
  }

  // 編集オプション関連のイベントリスナー
  setupEditOptionListeners() {
    this.dom.editOptionButtons.forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        this.setEditAction(action);
        this.updateEditButtonState(action);
      });
    });
  }

  // クリアボタンのイベントリスナー
  setupClearButtonListener() {
    if (this.dom.clearButton) {
      this.dom.clearButton.addEventListener('click', () => 
        this.resetToInitialBoard()
      );
    }
  }

  // noUiSlider を使ったブロック数レンジスライダーの初期化
  initializeBlockRangeSlider() {
    const blockRangeSlider = this.dom.sliders.blockRange;
    noUiSlider.create(blockRangeSlider, {
      start: [1, 3],
      connect: true,
      step: 1,
      range: {
        min: config.BLOCKS.MIN_COUNT,
        max: config.BLOCKS.MAX_COUNT,
      },
    });
    blockRangeSlider.noUiSlider.on('update', values => {
      // 値は文字列なので数値に丸める
      const minVal = Math.round(values[0]);
      const maxVal = Math.round(values[1]);
      this.dom.sliderValues.blockRange.textContent = `${minVal} - ${maxVal}`;
    });
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

  // 設定関連のメソッド群
  getSettings() {
    return {
      ...this.getSliderSettings(),
      ...this.getMinoModeSettings(),
    };
  }

  // スライダーの設定を取得
  getSliderSettings() {
    const width = this.getSliderValue('width', config.BOARD.MIN_WIDTH);
    const height = this.getSliderValue('height', config.BOARD.MIN_HEIGHT);
    const nextCount = this.getSliderValue('nextCount', config.NEXT.MIN_COUNT);
    const { blockCountMin, blockCountMax } = this.getBlockRangeValues();

    return {
      width,
      height,
      nextCount,
      blockCountMin,
      blockCountMax,
    };
  }

  // 個別のスライダー値を取得
  getSliderValue(key, defaultValue) {
    return this.dom.sliders[key]
      ? parseInt(this.dom.sliders[key].value, 10)
      : defaultValue;
  }

  // ブロック数範囲の値を取得
  getBlockRangeValues() {
    const blockRangeValues = this.dom.sliders.blockRange.noUiSlider.get();
    return {
      blockCountMin: parseInt(blockRangeValues[0], 10),
      blockCountMax: parseInt(blockRangeValues[1], 10),
    };
  }

  // ミノモードの設定を取得
  getMinoModeSettings() {
    const minoModeEl = document.getElementById('mino-mode');
    return {
      minoMode: minoModeEl ? minoModeEl.value : 'random',
    };
  }

  // 設定をローカルストレージに保存
  saveSettings(settings) {
    try {
      localStorage.setItem('tetrisSettings', JSON.stringify(settings));
      console.log('Settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  // 設定の読み込みと適用
  loadSettings() {
    try {
      const savedSettings = this.getSavedSettings();
      if (savedSettings) {
        this.applySettings(savedSettings);
      } else {
        this.applyDefaultSettings();
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.applyDefaultSettings();
    }
  }

  // 保存された設定を取得
  getSavedSettings() {
    const settings = localStorage.getItem('tetrisSettings');
    return settings ? JSON.parse(settings) : null;
  }

  // 設定を適用
  applySettings(settings) {
    this.applySliderSettings(settings);
    this.applyMinoModeSettings(settings);
    this.applyBlockRangeSettings(settings);
    this.createInitialBoard(settings);
  }

  // スライダー設定を適用
  applySliderSettings(settings) {
    Object.entries(settings).forEach(([key, value]) => {
      if (this.dom.sliders[key] && key !== 'blockRange') {
        this.dom.sliders[key].value = value;
        this.dom.sliderValues[key].textContent = value;
        this.updateAriaValue(this.dom.sliders[key], this.dom.sliderValues[key]);
      }
    });
  }

  // ミノモード設定を適用
  applyMinoModeSettings(settings) {
    if (settings.minoMode) {
      const minoModeEl = document.getElementById('mino-mode');
      if (minoModeEl) {
        minoModeEl.value = settings.minoMode;
      }
    }
  }

  // ブロック数範囲の設定を適用
  applyBlockRangeSettings(settings) {
    const { blockCountMin, blockCountMax } = settings;
    if (
      this.dom.sliders.blockRange &&
      this.dom.sliders.blockRange.noUiSlider
    ) {
      this.dom.sliders.blockRange.noUiSlider.set([blockCountMin, blockCountMax]);
    }
  }

  // 初期ボードを作成
  createInitialBoard(settings) {
    const { width, height, blockCountMin, blockCountMax } = settings;
    const blockCount = this.calculateRandomBlockCount(blockCountMin, blockCountMax);
    this.createBoard(width, height, blockCount);
  }

  // デフォルト設定を適用
  applyDefaultSettings() {
    const defaultBlockCount = this.calculateRandomBlockCount(
      config.BLOCKS.MIN_COUNT,
      config.BLOCKS.MAX_COUNT
    );
    this.createBoard(
      config.BOARD.MIN_WIDTH,
      config.BOARD.MIN_HEIGHT,
      defaultBlockCount
    );
  }

  // ブロック数をランダムに計算
  calculateRandomBlockCount(min, max) {
    return Math.floor(this.randomGenerator() * (max - min + 1)) + min;
  }

  // 画面をリセットして問題再生成
  generateProblem() {
    // ★ 前回のAuto選択状態をリセット ★
    this.resetAutoCells();

    const { width, height, nextCount, blockCountMin, blockCountMax } =
      this.getSettings();
    let bcMin = blockCountMin;
    let bcMax = blockCountMax;
    if (bcMin > bcMax) {
      [bcMin, bcMax] = [bcMax, bcMin];
    }
    const blockCount =
      Math.floor(this.randomGenerator() * (bcMax - bcMin + 1)) + bcMin;
    this.createBoard(width, height, blockCount);
    this.updateNextPieces();
    this.updateProblemCounter();
    // Autoモードを選択状態にする場合も、ここで状態を整える
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
    this.setupBoardStyles(width, height);
    this.createBoardCells(width, height);
    this.placeInitialBlocks(width, height, blockCount);
  }

  // ボードのスタイル設定
  setupBoardStyles(width, height) {
    this.dom.board.style.setProperty('--width', width);
    this.dom.board.style.setProperty('--height', height);
    this.dom.board.innerHTML = '';
  }

  // ボードのセルを作成
  createBoardCells(width, height) {
    const fragment = document.createDocumentFragment();
    const totalCells = width * height;

    for (let i = 0; i < totalCells; i++) {
      const cell = this.createBoardCell(i, width, height);
      fragment.appendChild(cell);
    }

    this.dom.board.appendChild(fragment);
  }

  // 個別のセルを作成
  createBoardCell(index, width, height) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.style.width = `${config.CELL_SIZE}px`;
    cell.style.height = `${config.CELL_SIZE}px`;

    cell.addEventListener('click', () => {
      if (!this.currentEditAction) return;
      this.handleEditCellClick(cell, index, width, height);
    });

    return cell;
  }

  // 初期ブロックを配置
  placeInitialBlocks(width, height, blockCount) {
    if (blockCount <= 0) return;

    const cells = Array.from(this.dom.board.children);
    const columnIndices = Array.from({ length: width }, (_, i) => i);
    const placedBlocks = new Set();

    for (let i = 0; i < blockCount; i++) {
      this.placeBlockInColumn(columnIndices, cells, width, height, placedBlocks, i);
    }
  }

  // 列にブロックを配置
  placeBlockInColumn(columnIndices, cells, width, height, placedBlocks, blockIndex) {
    let column;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      column = this.getRandomColumn(columnIndices);
      attempts++;
      if (attempts > maxAttempts) break;
    } while (placedBlocks.has(`${column}-${blockIndex}`));

    this.placeBlockInFirstEmptyCell(column, cells, width, height, placedBlocks, blockIndex);
  }

  // ランダムな列を取得
  getRandomColumn(columnIndices) {
    return columnIndices[Math.floor(this.randomGenerator() * columnIndices.length)];
  }

  // 列の最初の空きセルにブロックを配置
  placeBlockInFirstEmptyCell(column, cells, width, height, placedBlocks, blockIndex) {
    for (let row = height - 1; row >= 0; row--) {
      const index = row * width + column;
      if (!cells[index].classList.contains('block')) {
        this.createInitialBlock(cells[index]);
        placedBlocks.add(`${column}-${blockIndex}`);
        break;
      }
    }
  }

  // 初期ブロックを作成
  createInitialBlock(cell) {
    cell.classList.add('block', 'initial-block');
    cell.style.backgroundColor = minoColors['default'];
  }

  updateNextPieces() {
    if (!this.dom.nextContainer) return;

    const settings = this.getSettings();
    const pieces = this.generateNextPieces(settings);
    this.renderNextPieces(pieces);
  }

  // NEXTピースの生成
  generateNextPieces(settings) {
    const nextCount = settings.nextCount;
    return settings.minoMode === '7bag'
      ? this.generate7BagPieces(nextCount)
      : this.generateRandomPieces(nextCount);
  }

  // 7-bagシステムによるピース生成
  generate7BagPieces(count) {
    const tetrominoes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const pieces = [];
    const offset = this.calculateBagOffset();
    
    // 最初のバッグを生成してオフセットを適用
    let bag = this.generateShuffledBag(tetrominoes);
    bag = this.applyOffset(bag, offset);
    pieces.push(...bag);

    // 必要な数になるまで新しいバッグを追加
    while (pieces.length < count) {
      const newBag = this.generateShuffledBag(tetrominoes);
      pieces.push(...newBag);
    }

    return pieces.slice(0, count);
  }

  // バッグのオフセットを計算
  calculateBagOffset() {
    return Math.floor(this.randomGenerator() * 7);
  }

  // シャッフルされたバッグを生成
  generateShuffledBag(tetrominoes) {
    return shuffle([...tetrominoes], this.randomGenerator);
  }

  // バッグにオフセットを適用
  applyOffset(bag, offset) {
    return bag.slice(offset);
  }

  // ランダム生成によるピース生成
  generateRandomPieces(count) {
    return Array.from({ length: count }, () => this.getRandomMino());
  }

  // NEXTピースの描画
  renderNextPieces(pieces) {
    this.clearNextContainer();
    const fragment = this.createNextPiecesFragment(pieces);
    this.dom.nextContainer.appendChild(fragment);
  }

  // NEXTコンテナをクリア
  clearNextContainer() {
    this.dom.nextContainer.innerHTML = '';
  }

  // NEXTピースのフラグメントを作成
  createNextPiecesFragment(pieces) {
    const fragment = document.createDocumentFragment();
    pieces.forEach(mino => {
      if (mino) {
        const container = this.createNextPieceContainer();
        this.drawMino(mino, container);
        fragment.appendChild(container);
      }
    });
    return fragment;
  }

  // NEXTピースのコンテナ作成
  createNextPieceContainer() {
    const container = document.createElement('div');
    container.classList.add('next-piece-container');
    return container;
  }

  drawMino(minoType, container) {
    const shape = this.getMinoShape(minoType);
    if (!shape) return;

    const minoElement = this.createMinoElement(shape);
    this.fillMinoShape(minoElement, shape, minoType);
    container.appendChild(minoElement);
  }

  // ミノの形状データを取得
  getMinoShape(minoType) {
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
    return minoShapes[minoType] || null;
  }

  // ミノの要素を作成
  createMinoElement(shape) {
    const element = document.createElement('div');
    this.setupMinoElementStyles(element, shape);
    return element;
  }

  // ミノ要素のスタイル設定
  setupMinoElementStyles(element, shape) {
    element.classList.add('next-piece');
    element.style.display = 'grid';
    element.style.gridTemplateColumns = this.calculateGridColumns(shape);
  }

  // グリッド列の計算
  calculateGridColumns(shape) {
    return `repeat(${shape[0].length}, 1fr)`;
  }

  // ミノの形状を描画
  fillMinoShape(element, shape, minoType) {
    shape.forEach(row => {
      row.forEach(cell => {
        const cellElement = this.createShapeCell(cell, minoType);
        element.appendChild(cellElement);
      });
    });
  }

  // 形状のセルを作成
  createShapeCell(cell, minoType) {
    const cellElement = document.createElement('div');
    if (cell) {
      this.setupShapeCellStyles(cellElement, minoType);
    }
    return cellElement;
  }

  // 形状セルのスタイル設定
  setupShapeCellStyles(cellElement, minoType) {
    cellElement.classList.add('block');
    cellElement.style.backgroundColor = minoColors[minoType];
  }

  getRandomMino() {
    const allMinos = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const randomIndex = Math.floor(this.randomGenerator() * allMinos.length);
    return allMinos[randomIndex];
  }

  setupGestureControls() {
    if (!this.dom.mainView) return;
    this.setupSwipeControls();
    this.setupPanControls();
  }

  // スワイプ操作の設定
  setupSwipeControls() {
    const hammer = this.createHammerInstance(this.dom.mainView);
    this.configureSwipeRecognizer(hammer);
    this.bindSwipeHandlers(hammer);
  }

  // Hammerインスタンスの作成
  createHammerInstance(element) {
    return new Hammer(element);
  }

  // スワイプ認識の設定
  configureSwipeRecognizer(hammer) {
    hammer.get('swipe').set({
      direction: Hammer.DIRECTION_ALL,
    });
  }

  // スワイプハンドラーのバインド
  bindSwipeHandlers(hammer) {
    hammer.on('swipeleft', () => this.handleSwipeLeft());
    hammer.on('swiperight', () => this.handleSwipeRight());
  }

  // 左スワイプの処理
  handleSwipeLeft() {
    this.goToNextProblem();
  }

  // 右スワイプの処理
  handleSwipeRight() {
    this.goToPreviousProblem();
  }

  // パン操作の設定
  setupPanControls() {
    if (!this.dom.boardContainer || !this.dom.board) return;

    const hammer = this.createHammerInstance(this.dom.boardContainer);
    this.configurePanRecognizer(hammer);
    this.bindPanHandlers(hammer);
  }

  // パン認識の設定
  configurePanRecognizer(hammer) {
    hammer.get('pan').set({
      direction: Hammer.DIRECTION_ALL,
      threshold: 1,
    });
  }

  // パンハンドラーのバインド
  bindPanHandlers(hammer) {
    hammer.on('panstart', () => this.handlePanStart());
    hammer.on('panmove', e => this.handlePanMove(e));
    hammer.on('panend', () => this.handlePanEnd());
  }

  // パン開始時の処理
  handlePanStart() {
    if (!this.currentEditAction) return;
    this.isDragging = false;
  }

  // パン移動時の処理
  handlePanMove(event) {
    if (!this.currentEditAction) return;
    this.isDragging = true;
    this.handleCellPaint(event);
  }

  // パン終了時の処理
  handlePanEnd() {
    this.isDragging = false;
  }

  // セルの描画処理
  handleCellPaint(event) {
    const cell = this.findCellUnderPointer(event);
    if (!cell) return;

    const index = this.getCellIndex(cell);
    if (index >= 0) {
      this.handleEditCellClick(
        cell,
        index,
        this.currentWidth,
        this.currentHeight
      );
    }
  }

  // ポインター位置のセル検出
  findCellUnderPointer(event) {
    const target = document.elementFromPoint(event.center.x, event.center.y);
    return target && target.parentNode === this.dom.board ? target : null;
  }

  // セルのインデックス取得
  getCellIndex(cell) {
    return Array.from(this.dom.board.children).indexOf(cell);
  }

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

  setupEditButtons() {
    this.updateEditButtonState('auto');
    this.setEditAction('auto');
  }

  // ★ 修正：Autoモード以外に切り替える際、または新規問題生成時に autoCells をリセットする
  setEditAction(action) {
    if (action !== 'auto') {
      this.resetAutoCells();
    }
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
    if (cell.classList.contains('initial-block')) {
      return;
    }

    switch (this.currentEditAction) {
      case 'delete':
        this.handleDeleteAction(cell);
        break;
      case 'gray':
        this.handleGrayAction(cell);
        break;
      case 'auto':
        this.handleAutoAction(cell, index, width, height);
        break;
      default:
        this.handleColorAction(cell);
        break;
    }
  }

  // 削除アクション
  handleDeleteAction(cell) {
    this.paintCell(cell, '');
  }

  // グレーブロックアクション
  handleGrayAction(cell) {
    this.paintCell(cell, minoColors['gray']);
  }

  // 通常のカラーブロックアクション
  handleColorAction(cell) {
    const oldColor = cell.style.backgroundColor;
    const newColor = minoColors[this.currentEditAction];
    if (!newColor) return;

    if (this.isDragging) {
      this.paintCell(cell, newColor);
    } else {
      if (this.isSameColor(oldColor, newColor)) {
        this.paintCell(cell, '');
      } else {
        this.paintCell(cell, newColor);
      }
    }
  }

  // 自動配置アクション
  handleAutoAction(cell, index, width, height) {
    const oldColor = cell.style.backgroundColor;
    
    // 白ブロックの削除処理
    if (this.isWhiteBlock(oldColor)) {
      this.removeWhiteBlock(cell);
      return;
    }

    // 既存ブロックのチェック
    if (this.isExistingBlock(cell, oldColor)) {
      return;
    }

    // 新規ブロックの配置
    if (this.canAddNewBlock()) {
      this.addNewAutoBlock(cell, index, width, height);
    }
  }

  // 白ブロックかどうかの判定
  isWhiteBlock(color) {
    return color.toLowerCase() === minoColors.white.toLowerCase();
  }

  // 白ブロックの削除
  removeWhiteBlock(cell) {
    this.clearCell(cell);
    const cellIndex = this.autoCells.findIndex(c => c.cellEl === cell);
    if (cellIndex !== -1) {
      this.autoCells.splice(cellIndex, 1);
    }
  }

  // 既存ブロックのチェック
  isExistingBlock(cell, color) {
    return cell.classList.contains('block') && color !== '';
  }

  // 新規ブロック追加可能かどうかの判定
  canAddNewBlock() {
    return this.autoCells.length < 4;
  }

  // 新規自動ブロックの追加
  addNewAutoBlock(cell, index, width, height) {
    this.paintCell(cell, minoColors['white']);
    const x = index % width;
    const y = Math.floor(index / width);
    this.autoCells.push({ x, y, cellEl: cell });
    this.isAutoInProgress = true;

    if (this.autoCells.length === 4) {
      this.completeAutoPlacement();
    }
  }

  // 自動配置の完了処理
  completeAutoPlacement() {
    const positions = this.autoCells.map(c => ({ x: c.x, y: c.y }));
    const detectedMino = this.detectMinoShape(positions);
    if (detectedMino) {
      const color = minoColors[detectedMino];
      this.autoCells.forEach(c => this.paintCell(c.cellEl, color));
    } else {
      this.resetAutoCells();
    }
    this.autoCells = [];
    this.isAutoInProgress = false;
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

  resetAutoCells() {
    this.autoCells.forEach(({ cellEl }) => {
      this.clearCell(cellEl);
    });
    this.autoCells = [];
    this.isAutoInProgress = false;
  }

  isSameColor(colorA, colorB) {
    if (!colorA || !colorB) return false;
    return colorA.toLowerCase() === colorB.toLowerCase();
  }

  detectMinoShape(positions) {
    if (!this.isValidPositionsCount(positions)) return null;

    const normalizedPositions = this.normalizePositions(positions);
    return this.findMatchingMinoType(normalizedPositions);
  }

  // 位置データの数が有効か確認
  isValidPositionsCount(positions) {
    return positions && positions.length === 4;
  }

  // 位置データを正規化
  normalizePositions(positions) {
    const { minX, minY } = this.findMinCoordinates(positions);
    return positions.map(p => ({
      x: p.x - minX,
      y: p.y - minY,
    }));
  }

  // 最小座標を取得
  findMinCoordinates(positions) {
    return {
      minX: Math.min(...positions.map(p => p.x)),
      minY: Math.min(...positions.map(p => p.y)),
    };
  }

  // マッチするミノタイプを検索
  findMatchingMinoType(normalizedPositions) {
    for (const [minoType, patterns] of Object.entries(MINO_PATTERNS)) {
      if (this.hasMatchingPattern(normalizedPositions, patterns)) {
        return minoType;
      }
    }
    return null;
  }

  // パターンとのマッチングをチェック
  hasMatchingPattern(normalizedPositions, patterns) {
    return patterns.some(pattern => 
      this.isSameShape(normalizedPositions, pattern)
    );
  }

  // 形状の一致を確認
  isSameShape(positions1, positions2) {
    if (!this.hasSameLength(positions1, positions2)) return false;

    const sorted1 = this.sortPositions(positions1);
    const sorted2 = this.sortPositions(positions2);
    return this.arePositionsEqual(sorted1, sorted2);
  }

  // 配列の長さが同じか確認
  hasSameLength(arr1, arr2) {
    return arr1.length === arr2.length;
  }

  // 位置データをソート
  sortPositions(positions) {
    return [...positions].sort(this.comparePositions);
  }

  // 位置データの比較関数
  comparePositions(a, b) {
    return a.x - b.x || a.y - b.y;
  }

  // ソートされた位置データが等しいか確認
  arePositionsEqual(positions1, positions2) {
    return positions1.every((pos, index) => 
      this.isSamePosition(pos, positions2[index])
    );
  }

  // 2つの位置が等しいか確認
  isSamePosition(pos1, pos2) {
    return pos1.x === pos2.x && pos1.y === pos2.y;
  }

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

new TetrisApp();
