import { generateBaseSeed, createSeededGenerator, getSavedSeed, saveSeed, isValidSeed } from '../utils/random.js';
import { config } from '../utils/config.js';
import { SettingsManager } from '../modules/SettingsManager.js';
import { BoardManager } from '../modules/BoardManager.js';
import { MinoManager } from '../modules/MinoManager.js';
import { EditManager } from '../modules/EditManager.js';
import { GestureManager } from '../modules/GestureManager.js';

/**
 * テトリスアプリケーションクラス
 * アプリケーション全体の管理を担当
 */
export class TetrisApp {
  /**
   * コンストラクタ
   */
  constructor() {
    this.baseSeed = '';
    this.currentProblemNumber = 1;
    this.randomGenerator = null;
    this.bsSettingsModal = null;
    this.currentWidth = 0;
    this.currentHeight = 0;
    this.editState = EditManager.initialize();
    this.dom = null;

    document.addEventListener('DOMContentLoaded', () => this.initializeApp());
  }

  /**
   * DOMエレメントの初期化
   * @returns {Object} DOM要素オブジェクト
   */
  initializeDOMElements() {
    return {
      settingsButton: document.getElementById('settings-button'),
      saveAndCloseBtn: document.getElementById('save-and-close-settings'),
      closeIconBtn: document.getElementById('close-settings-without-save'),
      editOptionButtons: document.querySelectorAll('.edit-option'),
      clearButton: document.getElementById('clear-board'),
      removeUsedButton: document.getElementById('remove-used'),
      problemCounter: document.getElementById('current-problem'),
      board: document.getElementById('board'),
      nextContainer: document.getElementById('next'),
      mainView: document.getElementById('main-view'),
      boardContainer: document.getElementById('board-container'),
      seedValue: document.getElementById('seed-value'),
      regenerateSeedBtn: document.getElementById('regenerate-seed'),
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

  /**
   * アプリケーションの初期化
   */
  initializeApp() {
    try {
      this.dom = this.initializeDOMElements();
      this.initializeGameState();
      this.initializeSettingsModal();
      this.initializeControls();
      this.generateFirstProblem();
      this.logInitializationInfo();
    } catch (error) {
      console.error('初期化に失敗しました:', error);
    }
  }

  /**
   * ゲーム状態の初期化
   */
  initializeGameState() {
    this.baseSeed = getSavedSeed();
    this.currentProblemNumber = 1;
    this.randomGenerator = createSeededGenerator(
      this.baseSeed,
      this.currentProblemNumber
    );
    saveSeed(this.baseSeed);
  }

  /**
   * 設定モーダルの初期化
   */
  initializeSettingsModal() {
    const settingsModalElement = document.getElementById('settings-modal');
    if (settingsModalElement) {
      this.bsSettingsModal = new bootstrap.Modal(settingsModalElement);
    }
  }

  /**
   * コントロールの初期化
   */
  initializeControls() {
    this.setupAllEventListeners();
    this.initializeBlockRangeSlider();
    this.loadSettings();
    this.setupGestureControls();
    this.setupEditButtons();
  }

  /**
   * 最初の問題を生成
   */
  generateFirstProblem() {
    this.generateProblem();
  }

  /**
   * 初期化情報のログ出力
   */
  logInitializationInfo() {
    console.log(`Base Seed: ${this.baseSeed}`);
    console.log(`Starting at Problem #${this.currentProblemNumber}`);
    console.log(`App Version: ${config.VERSION}`);
  }

  /**
   * イベントリスナーのセットアップ
   */
  setupAllEventListeners() {
    this.setupSliderListeners();
    this.setupModalListeners();
    this.setupEditOptionListeners();
    this.setupClearButtonListener();
    this.setupRemoveUsedButtonListener();
    this.setupSeedRegenerateListener();
    this.setupGestureControls();
  }

  /**
   * スライダー関連のイベントリスナー
   */
  setupSliderListeners() {
    Object.keys(this.dom.sliders).forEach(key => {
      if (key === 'blockRange') return; // noUiSlider は別処理

      const slider = this.dom.sliders[key];
      const output = this.dom.sliderValues[key];
      if (slider && output) {
        slider.addEventListener('input', () => {
          output.textContent = slider.value;
          SettingsManager.updateAriaValue(slider, output);
        });
      }
    });
  }

  /**
   * モーダル関連のイベントリスナー
   */
  setupModalListeners() {
    if (this.dom.settingsButton) {
      this.dom.settingsButton.addEventListener('click', () => {
        this.openSettingsOverlay();
      });
    }

    if (this.dom.saveAndCloseBtn) {
      this.dom.saveAndCloseBtn.addEventListener('click', () => {
        this.handleSaveAndClose();
      });
    }

    if (this.dom.closeIconBtn) {
      this.dom.closeIconBtn.addEventListener('click', () => {
        this.handleCloseWithoutSave();
      });
    }
  }

  /**
   * 編集オプション関連のイベントリスナー
   */
  setupEditOptionListeners() {
    this.dom.editOptionButtons.forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        this.editState = EditManager.setEditAction(this.editState, action);
        EditManager.updateEditButtonState(this.dom.editOptionButtons, action);
      });
    });
  }

  /**
   * クリアボタンのイベントリスナー
   */
  setupClearButtonListener() {
    if (this.dom.clearButton) {
      this.dom.clearButton.addEventListener('click', () => 
        this.resetToInitialBoard()
      );
    }
  }

  /**
   * 使用済みピース削除ボタンのリスナーを設定
   */
  setupRemoveUsedButtonListener() {
    if (this.dom.removeUsedButton) {
      this.dom.removeUsedButton.addEventListener('click', () => this.removeUsedPieces());
    }
  }

  /**
   * ブロック数レンジスライダーの初期化
   */
  initializeBlockRangeSlider() {
    const blockRangeSlider = this.dom.sliders.blockRange;
    if (!blockRangeSlider) return;
    
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

  /**
   * 設定モーダルを開く
   */
  openSettingsOverlay() {
    if (this.bsSettingsModal) {
      this.loadSettings();
      this.updateSeedValueDisplay();
      this.bsSettingsModal.show();
    }
  }

  /**
   * 設定モーダルを閉じる
   */
  closeSettingsOverlay() {
    if (this.bsSettingsModal) {
      this.bsSettingsModal.hide();
    }
  }

  /**
   * シード再生成ボタンのイベントリスナーを設定
   */
  setupSeedRegenerateListener() {
    if (this.dom.regenerateSeedBtn) {
      this.dom.regenerateSeedBtn.addEventListener('click', () => {
        this.regenerateSeed();
      });
    }
  }

  /**
   * シード値を再生成する
   */
  regenerateSeed() {
    this.baseSeed = generateBaseSeed();
    this.updateSeedValueDisplay();
  }

  /**
   * シード値表示を更新する
   */
  updateSeedValueDisplay() {
    if (this.dom.seedValue) {
      this.dom.seedValue.value = this.baseSeed;
    }
  }

  /**
   * 設定の読み込み
   */
  loadSettings() {
    SettingsManager.loadSettings(this.dom);
  }

  /**
   * 問題の生成
   */
  generateProblem() {
    // 前回のAuto選択状態をリセット
    this.editState = EditManager.resetAutoCells(this.editState);

    const settings = SettingsManager.getSettings(this.dom);
    let { blockCountMin, blockCountMax } = settings;
    
    if (blockCountMin > blockCountMax) {
      [blockCountMin, blockCountMax] = [blockCountMax, blockCountMin];
    }
    
    const blockCount = this.calculateRandomBlockCount(blockCountMin, blockCountMax);
    
    BoardManager.createBoard(
      this.dom.board, 
      settings.width, 
      settings.height, 
      blockCount, 
      this.randomGenerator,
      (cell, index, width, height) => this.handleCellClick(cell, index, width, height)
    );
    
    this.currentWidth = settings.width;
    this.currentHeight = settings.height;
    
    // 新しい問題を生成するときにネクストピースをリセット
    MinoManager.currentPieces = [];
    MinoManager.usedPieces = {};
    MinoManager.displayStartIndex = 0;
    
    MinoManager.updateNextPieces(this.dom.nextContainer, settings, this.randomGenerator);
    this.updateProblemCounter();
    
    // Autoモードを選択状態にする
    this.editState = EditManager.setEditAction(this.editState, 'auto');
    EditManager.updateEditButtonState(this.dom.editOptionButtons, 'auto');
  }

  /**
   * 問題番号ラベル更新
   */
  updateProblemCounter() {
    if (this.dom.problemCounter) {
      this.dom.problemCounter.textContent = `問題 #${this.currentProblemNumber}`;
    }
  }

  /**
   * ブロック数をランダムに計算
   * @param {number} min - 最小値
   * @param {number} max - 最大値
   * @returns {number} 計算されたブロック数
   */
  calculateRandomBlockCount(min, max) {
    return Math.floor(this.randomGenerator() * (max - min + 1)) + min;
  }

  /**
   * ジェスチャーコントロールのセットアップ
   */
  setupGestureControls() {
    GestureManager.setupGestureControls(
      this.dom.mainView,
      this.dom.boardContainer,
      () => this.goToNextProblem(),
      () => this.goToPreviousProblem(),
      (event) => this.handleCellPaint(event),
      this.editState
    );
  }

  /**
   * 編集ボタンのセットアップ
   */
  setupEditButtons() {
    EditManager.updateEditButtonState(this.dom.editOptionButtons, 'auto');
  }

  /**
   * セルクリック時の処理
   * @param {HTMLElement} cell - クリックされたセル要素
   * @param {number} index - セルのインデックス
   * @param {number} width - ボードの幅
   * @param {number} height - ボードの高さ
   */
  handleCellClick(cell, index, width, height) {
    this.editState = EditManager.handleEditCellClick(
      cell, 
      index, 
      width, 
      height, 
      this.editState
    );
  }

  /**
   * セル描画時の処理
   * @param {Event} event - イベントオブジェクト
   */
  handleCellPaint(event) {
    const cell = GestureManager.findCellUnderPointer(this.dom.board, event);
    if (!cell) return;

    const index = GestureManager.getCellIndex(this.dom.board, cell);
    if (index >= 0) {
      this.handleCellClick(
        cell,
        index,
        this.currentWidth,
        this.currentHeight
      );
    }
  }

  /**
   * 次の問題へ移動
   */
  goToNextProblem() {
    console.log(`次の問題へ移動: 現在の問題番号 ${this.currentProblemNumber}`);
    this.currentProblemNumber += 1;
    this.randomGenerator = createSeededGenerator(
      this.baseSeed,
      this.currentProblemNumber
    );
    this.generateProblem();
    console.log(`移動後の問題番号: ${this.currentProblemNumber}`);
  }

  /**
   * 前の問題へ移動
   */
  goToPreviousProblem() {
    console.log(`前の問題へ移動: 現在の問題番号 ${this.currentProblemNumber}`);
    if (this.currentProblemNumber > 1) {
      this.currentProblemNumber -= 1;
      this.randomGenerator = createSeededGenerator(
        this.baseSeed,
        this.currentProblemNumber
      );
      this.generateProblem();
      console.log(`移動後の問題番号: ${this.currentProblemNumber}`);
    }
  }

  /**
   * 初期状態にボードをリセット
   */
  resetToInitialBoard() {
    BoardManager.resetToInitialBoard(this.dom.board);
    console.log('編集内容をクリアしました。初期ブロックのみ残っています。');
  }

  /**
   * 使用済みピースを削除
   */
  removeUsedPieces() {
    const settings = SettingsManager.getSettings(this.dom);
    MinoManager.removeUsedPieces(this.dom.nextContainer, settings);
  }

  /**
   * 設定を保存して閉じる
   */
  handleSaveAndClose() {
    const settings = SettingsManager.getSettings(this.dom);
    SettingsManager.saveSettings(settings);
    
    // シード値を取得して検証
    const newSeed = this.dom.seedValue.value.trim();
    if (!isValidSeed(newSeed)) {
      alert('シード値は1文字以上入力してください。');
      return;
    }
    
    // シード値を更新して保存
    this.baseSeed = newSeed;
    saveSeed(this.baseSeed);
    
    // 問題番号を1に戻し、新しい乱数生成器を初期化
    this.currentProblemNumber = 1;
    this.randomGenerator = createSeededGenerator(
      this.baseSeed,
      this.currentProblemNumber
    );
    
    // ネクストピースのキャッシュをクリア
    MinoManager.currentPieces = [];
    MinoManager.usedPieces = {};
    MinoManager.displayStartIndex = 0;
    
    this.closeSettingsOverlay();
    this.generateProblem();
  }

  /**
   * 保存せずに閉じる処理
   */
  handleCloseWithoutSave() {
    console.log('設定を保存せず閉じました。');
    this.closeSettingsOverlay();
  }
} 