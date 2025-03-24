import { generateBaseSeed, createSeededGenerator, getSavedSeed, saveSeed, isValidSeed } from '../utils/random.js';
import { config, minoColors } from '../utils/config.js';
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
    this.currentWidth = 0;
    this.currentHeight = 0;
    this.editState = EditManager.initialize();
    this.dom = null;
    this.settingsManager = null;

    document.addEventListener('DOMContentLoaded', () => this.initializeApp());
  }

  /**
   * DOMエレメントの初期化
   * @returns {Object} DOM要素オブジェクト
   */
  initializeDOMElements() {
    this.dom = {
      app: document.getElementById('app'),
      board: document.getElementById('board'),
      currentProblem: document.getElementById('current-problem'),
      nextContainer: document.getElementById('next'),
      holdContainer: document.getElementById('hold'),
      editNav: document.getElementById('control-panel'),
      toggleBoard: document.getElementById('toggle-board'),
      removeUsed: document.getElementById('remove-used'),
      fillColumnButton: document.getElementById('fill-column-button'),
      clearColumnButton: document.getElementById('clear-column-button'),
      clearBoard: document.getElementById('clear-board'),
      settingsButton: document.getElementById('settings-button'),
      autoButton: document.getElementById('auto-button'),
      delButton: document.getElementById('del-button'),
      grayButton: document.getElementById('gray-button'),
      editOptionButtons: document.querySelectorAll('.edit-option'),
    };

    return this.dom;
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
      
      // 初期状態では空のホールド表示を作成
      this.updateHoldDisplay(null);
      
      // AI機能の初期化
      this.initializeAI();
      
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
    // SettingsManagerのインスタンス化
    this.settingsManager = new SettingsManager();

    // 設定変更イベントのリスナーを追加
    document.addEventListener('settingsChanged', (event) => {
      this.handleSettingsChanged(event.detail.settings);
    });

    // 設定エラーイベントのリスナーを追加
    document.addEventListener('settingsError', (event) => {
      this.showNotification(event.detail.error, 'danger');
    });

    // 設定モーダルが閉じられた時のイベントリスナーを追加
    document.addEventListener('settingsModalClosed', () => {
      // モーダル内の要素からフォーカスを外す
      document.activeElement.blur();
      // フォーカスをボディに移す
      document.body.focus();
    });

    // 設定ボタンのイベントリスナーを追加
    this.dom.settingsButton?.addEventListener('click', () => {
      this.settingsManager.openSettingsModal();
    });
  
  }

  /**
   * 設定変更時の処理
   * @param {Object} settings - 新しい設定
   */
  handleSettingsChanged(settings) {
    const { boardSettings } = settings;
    
    // シード値の更新
    if (boardSettings.seed !== this.baseSeed) {
      this.baseSeed = boardSettings.seed;
      saveSeed(this.baseSeed);
      this.goToFirstProblem();
    }

    // 幅が変更されたかチェック
    const oldWidth = this.currentWidth;
    const newWidth = boardSettings.width;
    
    // 幅が変更された場合はAskAIボタンの状態を更新
    // if (oldWidth !== newWidth) {
    //   this.updateAskAIButtonState();
    // }
  }

  /**
   * コントロールの初期化
   */
  initializeControls() {
    this.setupAllEventListeners();
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
   * すべてのイベントリスナーの設定
   */
  setupAllEventListeners() {
         
    this.setupEditOptionListeners();
    this.setupClearButtonListener();
    this.setupRemoveUsedButtonListener();
    this.setupGestureControls();
    this.setupFillColumnButtonListener();
    this.setupClearColumnButtonListener();
    this.setupToggleBoardListener();
  }


  /**
   * 編集オプション関連のイベントリスナー
   */
  setupEditOptionListeners() {
    // editOptionButtonsがない場合は再取得を試みる
    if (!this.dom.editOptionButtons || this.dom.editOptionButtons.length === 0) {
      this.dom.editOptionButtons = document.querySelectorAll('.edit-option');
    }
    
    // それでもない場合はエラーログを出して処理を中断
    if (!this.dom.editOptionButtons || this.dom.editOptionButtons.length === 0) {
      console.error('編集オプションボタンが見つかりません');
      return;
    }
    
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
    if (this.dom.clearBoard) {
      this.dom.clearBoard.addEventListener('click', () => 
        this.resetToInitialBoard()
      );
    }
  }

  /**
   * 使用済みピース削除ボタンのリスナーを設定
   */
  setupRemoveUsedButtonListener() {
    if (this.dom.removeUsed) {
      this.dom.removeUsed.addEventListener('click', () => this.removeUsedPieces());
    }
  }

  /**
   * ブロック数レンジスライダーの初期化
   */
  initializeBlockRangeSlider() {
    const blockRangeSlider = this.dom.blockRangeSlider;
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
   * ジェスチャーコントロールのセットアップ
   */
  setupGestureControls() {
    GestureManager.setupGestureControls(
      document.querySelector('.tetris-app__main'),
      document.getElementById('board-container'),
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
   * 最初の問題へ移動
   */
  goToFirstProblem() {   
    this.currentProblemNumber = 1;
    this.randomGenerator = createSeededGenerator(
      this.baseSeed,
      this.currentProblemNumber
    );
    this.generateProblem();
    console.log(`移動後の問題番号: ${this.currentProblemNumber}`);
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
   * 問題の生成
   */
  generateProblem() {
    // 保存されている設定を取得
    const settings = this.settingsManager.getSettings();
    const { boardSettings } = settings;
    
    let { min: blockCountMin, max: blockCountMax } = boardSettings.blockRange;
    
    if (blockCountMin > blockCountMax) {
      [blockCountMin, blockCountMax] = [blockCountMax, blockCountMin];
    }
    
    const blockCount = this.calculateRandomBlockCount(blockCountMin, blockCountMax);
    
    BoardManager.createBoard(
      this.dom.board, 
      boardSettings.width, 
      boardSettings.height, 
      blockCount, 
      this.randomGenerator,
      (cell, index, width, height) => this.handleCellClick(cell, index, width, height)
    );
    
    // ダミーボードにも同じサイズの空のボードを作成（ブロックなし、クリックイベントなし）
    const dummyBoard = document.getElementById('dummy-board');
    if (dummyBoard) {
      // ダミーボードのスタイル設定
      dummyBoard.style.setProperty('--width', boardSettings.width);
      dummyBoard.style.setProperty('--height', boardSettings.height);
      dummyBoard.innerHTML = '';
      
      // 空のセルを作成
      const totalCells = boardSettings.width * boardSettings.height;
      const fragment = document.createDocumentFragment();
      
      for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.style.width = `${config.CELL_SIZE}px`;
        cell.style.height = `${config.CELL_SIZE}px`;
        fragment.appendChild(cell);
      }
      
      dummyBoard.appendChild(fragment);
    }
    
    this.currentWidth = boardSettings.width;
    this.currentHeight = boardSettings.height;
    
    // 新しい問題を生成するときにネクストピースをリセット
    MinoManager.currentPieces = [];
    MinoManager.usedPieces = {};
    MinoManager.displayStartIndex = 0;
    
    MinoManager.updateNextPieces(this.dom.nextContainer, boardSettings, this.randomGenerator);
    this.updateProblemCounter();
    
    // Autoモードを選択状態にする
    this.editState = EditManager.setEditAction(this.editState, 'auto');
    EditManager.updateEditButtonState(this.dom.editOptionButtons, 'auto');
  }

  /**
   * 問題番号ラベル更新
   */
  updateProblemCounter() {
    if (this.dom.currentProblem) {
      this.dom.currentProblem.textContent = `問題 #${this.currentProblemNumber}`;
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
   * 列グレー化ボタンのイベントリスナー
   */
  setupFillColumnButtonListener() {
    if (this.dom.fillColumnButton) {
      this.dom.fillColumnButton.addEventListener('click', () => this.fillColumn());
    }
  }

  /**
   * 列クリアボタンのイベントリスナー
   */
  setupClearColumnButtonListener() {
    if (this.dom.clearColumnButton) {
      this.dom.clearColumnButton.addEventListener('click', () => this.clearColumn());
    }
  }

  /**
   * 次の列をグレーで埋める
   */
  fillColumn() {
    const boardElement = this.dom.board;
    if (!boardElement) return;
    
    const width = this.currentWidth;
    const height = this.currentHeight;
    const cells = boardElement.querySelectorAll('.cell');
    
    // 左から順にチェックして、グレーでない列を探す
    for (let col = 0; col < width; col++) {
      let allGray = true;
      
      // この列のすべてのセルをチェック
      for (let row = 0; row < height; row++) {
        const index = row * width + col;
        const cell = cells[index];
        
        // グレーでないセルが見つかった場合
        if (!cell.classList.contains('block') || 
            !BoardManager.isGrayBlock(window.getComputedStyle(cell).backgroundColor)) {
          allGray = false;
          break;
        }
      }
      
      // グレーでない列が見つかった場合、その列をすべてグレーにする
      if (!allGray) {
        for (let row = 0; row < height; row++) {
          const index = row * width + col;
          const cell = cells[index];
          
          // セルをグレーに設定
          cell.classList.add('block');
          cell.style.backgroundColor = minoColors.gray;
        }
        return; // 1列処理したら終了
      }
    }
  }

  /**
   * 全部灰色の列を右側から削除する
   */
  clearColumn() {
    const boardElement = this.dom.board;
    if (!boardElement) return;
    
    const width = this.currentWidth;
    const height = this.currentHeight;
    const cells = boardElement.querySelectorAll('.cell');
    
    // 右から順にチェックして、すべてグレーの列を探す
    for (let col = width - 1; col >= 0; col--) {
      let allGray = true;
      
      // この列のすべてのセルをチェック
      for (let row = 0; row < height; row++) {
        const index = row * width + col;
        const cell = cells[index];
        
        // グレーでないセルが見つかった場合
        if (!cell.classList.contains('block') || 
            !BoardManager.isGrayBlock(window.getComputedStyle(cell).backgroundColor)) {
          allGray = false;
          break;
        }
      }
      
      // すべてグレーの列が見つかった場合、その列を空にする
      if (allGray) {
        for (let row = 0; row < height; row++) {
          const index = row * width + col;
          const cell = cells[index];
          
          // セルをクリア
          BoardManager.clearCell(cell);
        }
        return; // 1列処理したら終了
      }
    }
  }

  /**
   * ホールドミノを表示
   * @param {String} holdType - ホールドミノのタイプ
   */
  updateHoldDisplay(holdType) {
    if (!this.dom.holdContainer) return;
    
    // ホールドコンテナをクリア
    this.dom.holdContainer.innerHTML = '';
    
    // ホールド用のコンテナを作成（ネクストと同じスタイルを使用）
    const holdPieceContainer = document.createElement('div');
    holdPieceContainer.className = 'next-piece-container';
    
    // holdTypeがあれば描画、なければ空のコンテナを表示
    if (holdType) {
      // MinoManagerのdrawMino関数を使ってミノを描画
      MinoManager.drawMino(holdType, holdPieceContainer);
    }
    
    // ホールドコンテナに追加
    this.dom.holdContainer.appendChild(holdPieceContainer);
  }

  /**
   * ボード表示/非表示切り替えボタンのリスナーを設定
   */
  setupToggleBoardListener() {
    if (this.dom.toggleBoard) {
      this.dom.toggleBoard.addEventListener('click', () => {
        this.toggleBoardVisibility();
      });
    }
  }

  /**
   * ボードの表示/非表示を切り替える
   */
  toggleBoardVisibility() {
    const board = document.getElementById('board');
    const dummyBoard = document.getElementById('dummy-board');
    
    if (board && dummyBoard) {
      // 現在のボードの状態をチェック
      const isMainBoardActive = !board.classList.contains('d-none');
      
      if (isMainBoardActive) {
        // メインボードを非表示にしてダミーボードを表示
        board.classList.add('d-none');
        dummyBoard.classList.remove('d-none');
        
        // アイコンを変更（目の表示に）
        this.dom.toggleBoard.innerHTML = '<i class="bi bi-eye"></i>';
      } else {
        // ダミーボードを非表示にしてメインボードを表示
        dummyBoard.classList.add('d-none');
        board.classList.remove('d-none');
        
        // アイコンを変更（目に斜線を入れた表示に）
        this.dom.toggleBoard.innerHTML = '<i class="bi bi-eye-slash"></i>';
      }
    }
  }

  /**
   * AIモジュールを初期化
   */
  initializeAI() {
    try {
      // AIManagerWrapperをインポート
      import('../modules/AIManagerWrapper.js').then(module => {
        this.aiManager = new module.AIManagerWrapper();
        this.initializeAIComponents();
      }).catch(error => {
        console.error('AIモジュールのロードに失敗しました:', error);
        this.showNotification('AIモジュールのロードに失敗しました', 'danger');
      });
    } catch (error) {
      console.error('AI初期化エラー:', error);
    }
  }

  /**
   * AI関連コンポーネントの初期化
   */
  async initializeAIComponents() {
    // AI関連のDOMエレメントを取得
    this.aiDom = {
      askAIButton: document.getElementById('ask-ai-button'),
      aiModal: document.getElementById('ai-modal'),
      aiSearchButton: document.getElementById('ai-search-button'),
      aiApplyButton: document.getElementById('ai-apply-button'),
      aiResetHistoryButton: document.getElementById('ai-reset-history-button'),
      aiMoveHistory: document.getElementById('ai-move-history'),
      aiStatusMessage: document.getElementById('ai-status-message'),
      aiCalculationStatus: document.getElementById('ai-calculation-status'),
      aiProgressContainer: document.getElementById('ai-progress-container'),
      aiProgressBar: document.getElementById('ai-progress-bar'),
      aiSearchTime: document.getElementById('ai-search-time'),
      aiSearchTimeValue: document.getElementById('ai-search-time-value'),
      aiMovesCount: document.getElementById('ai-moves-count'),
      aiMovesCountValue: document.getElementById('ai-moves-count-value')
    };

    // AIモーダルの初期化
    this.bsAIModal = new bootstrap.Modal(this.aiDom.aiModal);
    
    // AIモーダルが閉じる直前のイベントをリッスン
    this.aiDom.aiModal.addEventListener('hide.bs.modal', () => {
      // モーダル内の要素からフォーカスを外す
      document.activeElement.blur();
      // フォーカスをボディに移す
      document.body.focus();
    });

    // AI設定スライダーのイベントリスナーを追加
    this.setupAISettingsListeners();

    // Ask AIボタンのイベントリスナーを追加
    this.setupAIButtonListeners();

    // AIマネージャーのイベントリスナーを設定
    this.setupAIManagerListeners();

    // AIマネージャーを初期化
    await this.aiManager.initialize();
  }

  /**
   * AI設定スライダーのイベントリスナーを設定
   */
  setupAISettingsListeners() {
    // AI探索時間のスライダー
    if (this.aiDom.aiSearchTime && this.aiDom.aiSearchTimeValue) {
      this.aiDom.aiSearchTime.addEventListener('input', () => {
        this.aiDom.aiSearchTimeValue.textContent = this.aiDom.aiSearchTime.value;
        this.aiManager.updateSettings({
          searchTimePerMove: parseInt(this.aiDom.aiSearchTime.value)
        });
      });
    }

    // AI計算手数のスライダー
    if (this.aiDom.aiMovesCount && this.aiDom.aiMovesCountValue) {
      this.aiDom.aiMovesCount.addEventListener('input', () => {
        this.aiDom.aiMovesCountValue.textContent = this.aiDom.aiMovesCount.value;
        this.aiManager.updateSettings({
          movesToCalculate: parseInt(this.aiDom.aiMovesCount.value)
        });
      });
    }
  }

  /**
   * AIボタンのイベントリスナーを設定
   */
  setupAIButtonListeners() {
    // Ask AIボタン
    if (this.aiDom.askAIButton) {
      this.aiDom.askAIButton.addEventListener('click', () => {
        this.openAIModal();
      });
    }

    // 探索ボタン
    if (this.aiDom.aiSearchButton) {
      this.aiDom.aiSearchButton.addEventListener('click', () => {
        this.startAISearch();
      });
    }

    // 適用ボタン
    if (this.aiDom.aiApplyButton) {
      this.aiDom.aiApplyButton.addEventListener('click', () => {
        this.applySelectedAIMove();
      });
    }

    // 履歴リセットボタン
    if (this.aiDom.aiResetHistoryButton) {
      this.aiDom.aiResetHistoryButton.addEventListener('click', () => {
        this.confirmResetAIHistory();
      });
    }

    // AIの手を進める/戻るボタン
    const undoButton = document.getElementById('undo-ai-move');
    const redoButton = document.getElementById('redo-ai-move');

    if (undoButton) {
      undoButton.addEventListener('click', () => {
        this.undoAIMove();
      });
    }

    if (redoButton) {
      redoButton.addEventListener('click', () => {
        this.redoAIMove();
      });
    }
  }

  /**
   * AIマネージャーのイベントリスナーを設定
   */
  setupAIManagerListeners() {
    this.aiManager.on('initialized', () => {
      console.log('AIマネージャーが初期化されました');
      this.updateAIStatus('AI待機中');
    });

    this.aiManager.on('error', (errorMessage) => {
      console.error('AIエラー:', errorMessage);
      this.showAIError(errorMessage);
    });

    this.aiManager.on('searchStarted', () => {
      this.updateAIStatus('探索中...');
      this.showAIProgress(true);
      this.aiDom.aiSearchButton.disabled = true;
    });

    this.aiManager.on('searchStopped', () => {
      this.updateAIStatus('探索停止');
      this.showAIProgress(false);
      this.aiDom.aiSearchButton.disabled = false;
    });

    this.aiManager.on('statusMessage', (message) => {
      this.updateAIStatusMessage(message);
    });

    this.aiManager.on('suggestion', (suggestion) => {
      this.handleAISuggestion(suggestion);
    });

    this.aiManager.on('movesCalculated', (moves) => {
      this.updateAIMoveHistory(moves);
      this.aiDom.aiSearchButton.disabled = false;
    });

    this.aiManager.on('historyReset', () => {
      this.clearAIMoveHistory();
      this.aiDom.aiApplyButton.disabled = true;
    });

    this.aiManager.on('moveApplied', (move) => {
      this.closeAIModal();
      this.applyAIMove(move);
    });
  }

  /**
   * AIモーダルを開く
   */
  openAIModal() {
    const settings = this.settingsManager.getSettings();
    const currentWidth = settings.boardSettings.width;
    
    // 幅が10でない場合は通知を表示して処理を中断
    if (currentWidth !== 10) {
      this.showNotification('幅10の盤面でないとAI機能は使用できません', 'warning');
      return;
    }
    
    // モーダルを表示
    if (this.bsAIModal) {
      this.bsAIModal.show();
      this.updateAIStatusMessage('「探索開始」を押すとAIが最適な手を探索します');
      this.renderAIMoveHistory();
    }
  }

  /**
   * AIモーダルを閉じる
   */
  closeAIModal() {
    if (this.bsAIModal) {
      this.bsAIModal.hide();
    }
  }

  /**
   * AI探索を開始
   */
  async startAISearch() {
    try {
      // AIマネージャーの履歴があるかチェック
      if (this.aiManager.moveHistory && this.aiManager.moveHistory.length > 0) {
        // 履歴がある場合は探索を継続
        this.updateAIStatusMessage('履歴の最後の手から探索を続けます');
        
        // ネクストの数が足りるかチェック
        const nextQueue = MinoManager.getQueueForAI();
        if (nextQueue.length < 1) {
          this.showAIError('これ以上の探索ができません。ネクストの数が不足しています。');
          return;
        }
        
        // 既存の履歴から次の手を探索
        await this.aiManager.continueSearch();
      } else {
        // 履歴がない場合は新規に探索を開始
        this.updateAIStatusMessage('現在の盤面から探索を開始します');
        
        // 現在のゲーム状態を取得
        const gameState = this.getGameStateForAI();
        
        // ネクストの数が足りるかチェック
        if (gameState.queue.length < 1) {
          this.showAIError('ネクストの数が不足しています。AIの探索には少なくとも1つのネクストが必要です。');
          return;
        }
        
        // 左端からグレーのミノ列数を計算
        const grayColumnCount = BoardManager.countGrayColumns(
          this.dom.board,
          this.currentWidth,
          this.currentHeight
        );
        
        // 新規にAI探索を開始（グレーの列数を引数として渡す）
        await this.aiManager.startSearch(gameState, grayColumnCount);
      }
      
      // 進捗表示を開始
      this.showAIProgress(true);
    } catch (error) {
      console.error('AI探索開始エラー:', error);
      this.showAIError(`AI探索を開始できませんでした: ${error.message}`);
    }
  }

  /**
   * AI用にゲーム状態を取得
   * @returns {Object} ゲーム状態
   */
  getGameStateForAI() {
    // BoardManagerから現在の状態を取得
    const board = BoardManager.getCurrentBoard(
      this.dom.board, 
      this.currentWidth, 
      this.currentHeight
    );
    
    // MinoManagerからネクスト情報を取得
    const queue = MinoManager.getQueueForAI();
    
    // 現バージョンではホールドは使用しない
    const hold = null;
    
    return { board, queue, hold };
  }

  /**
   * AI進捗の表示/非表示を切り替え
   * @param {boolean} show - 表示するかどうか
   */
  showAIProgress(show) {
    if (this.aiDom.aiProgressContainer) {
      this.aiDom.aiProgressContainer.style.display = show ? 'block' : 'none';
    }
  }

  /**
   * AI状態メッセージを更新
   * @param {string} message - 状態メッセージ
   */
  updateAIStatusMessage(message) {
    if (this.aiDom.aiStatusMessage) {
      this.aiDom.aiStatusMessage.textContent = message;
      this.aiDom.aiStatusMessage.className = 'alert alert-info';
    }
  }

  /**
   * AIエラーメッセージを表示
   * @param {string} errorMessage - エラーメッセージ
   */
  showAIError(errorMessage) {
    if (this.aiDom.aiStatusMessage) {
      this.aiDom.aiStatusMessage.textContent = errorMessage;
      this.aiDom.aiStatusMessage.className = 'alert alert-danger';
    }
  }

  /**
   * AI状態表示を更新
   * @param {string} status - 状態テキスト
   */
  updateAIStatus(status) {
    if (this.aiDom.aiCalculationStatus) {
      this.aiDom.aiCalculationStatus.textContent = status;
    }
  }

  /**
   * AI提案を処理
   * @param {Object} suggestion - AI提案
   */
  handleAISuggestion(suggestion) {
    console.log('AI提案を受信:', suggestion);
    // この段階では特に何もしない（movesCalculatedで一括して処理）
  }

  /**
   * AI移動履歴を更新
   * @param {Array} moves - 新たに計算された手のリスト
   */
  updateAIMoveHistory(moves) {
    // 履歴UIを更新
    this.renderAIMoveHistory();
    // ボタンの状態を更新
    this.updateAIButtonStates();
    // 現在の手を更新
    this.updateCurrentMove();
  }

  /**
   * AI移動履歴UIをレンダリング
   */
  renderAIMoveHistory() {
    if (!this.aiDom.aiMoveHistory || !this.aiManager) return;
    
    const historyContainer = this.aiDom.aiMoveHistory;
    const history = this.aiManager.moveHistory;
    
    // 履歴コンテナをクリア
    historyContainer.innerHTML = '';
    
    // 履歴がない場合
    if (history.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'text-center py-3 text-muted';
      emptyMessage.innerHTML = '<em>まだ履歴がありません</em>';
      historyContainer.appendChild(emptyMessage);
      return;
    }
    
    // 履歴項目を作成
    history.forEach((item, index) => {
      const moveItem = document.createElement('div');
      moveItem.className = 'ai-history-item';
      moveItem.dataset.index = index;
      
      // 選択状態のクラスを追加
      if (index === this.aiManager.selectedMoveIndex) {
        moveItem.classList.add('selected');
      }
      
      // 移動情報の取得
      const moveLocation = item.suggestion.move.location;
      const minoType = moveLocation.type;
      const orientation = moveLocation.orientation;
      const position = `x:${moveLocation.adjustedRange.x}, y:${moveLocation.adjustedRange.y}`;
      
      // アイテムの内容を設定
      moveItem.innerHTML = `
        <span class="ai-piece-type ${minoType}">${minoType}</span>
        <span>${index + 1}手目: 向き${orientation}, 位置${position}</span>
      `;
      
      // クリックイベントを設定
      moveItem.addEventListener('click', () => this.selectAIHistoryItem(index));
      
      // ダブルクリックイベントを設定
      moveItem.addEventListener('dblclick', () => this.applyAIMove(item));
      
      // アイテムを追加
      historyContainer.appendChild(moveItem);
    });
    
    // 適用ボタンの状態を更新
    this.aiDom.aiApplyButton.disabled = this.aiManager.selectedMoveIndex === -1;
  }

  /**
   * 履歴項目を選択
   * @param {number} index - 選択する項目のインデックス
   */
  selectAIHistoryItem(index) {
    this.aiManager.selectedMoveIndex = index;
    this.renderAIMoveHistory(); // UIを更新
  }

  /**
   * 選択された手を適用
   */
  applySelectedAIMove() {
    const selectedIndex = this.aiManager.selectedMoveIndex;
    if (selectedIndex === -1) return;
    
    const move = this.aiManager.moveHistory[selectedIndex];
    this.applyAIMove(move);
    this.closeAIModal();
  }

  /**
   * AI移動を適用
   * @param {Object} move - 適用する手
   */
  applyAIMove(move) {
    try {
      // 現在の表示状態を記憶
      const isBoardHidden = this.dom.board.getAttribute('data-visible') === 'false';
      
      // ボードを更新
      if (move.suggestion && move.suggestion.board) {
        BoardManager.applyAIBoard(
          this.dom.board,
          move.suggestion.board,
          this.currentWidth,
          this.currentHeight
        );
      }
      
      // ネクストを更新
      if (move.suggestion && move.suggestion.next) {
        // 設定されたネクスト数を取得
        const nextCount = parseInt(this.dom.sliderValues.nextCount.textContent) || 5;
        
        // ネクスト配列を作成
        let nextArray = [...move.suggestion.next];
        
        MinoManager.applyAINext(
          this.dom.nextContainer,
          nextArray,
          nextCount
        );
        
        // ホールドがある場合はホールド表示を更新
        if (move.suggestion.hold) {
          this.updateHoldDisplay(move.suggestion.hold);
        }
      }
      
      // 盤面が非表示状態だった場合は、更新後も非表示状態を維持
      if (isBoardHidden) {
        // 非表示状態を維持するため、セルを空の状態に戻す
        const cells = this.dom.board.querySelectorAll('.cell');
        cells.forEach(cell => {
          // 一時的にクラス情報を保存
          cell.setAttribute('data-original-classes', cell.className);
          // 背景色を保存
          cell.setAttribute('data-original-bg', cell.style.backgroundColor || '');
          
          // セルを空の状態に変更
          cell.className = 'cell';
          cell.style.backgroundColor = '';
          
          // セル内部の要素を一時的に非表示
          Array.from(cell.children).forEach(child => {
            child.style.display = 'none';
          });
        });
        
        // 非表示状態を保持
        this.dom.board.setAttribute('data-visible', 'false');
      }
      
      // ボタンの状態を更新
      this.updateAIButtonStates();
    } catch (error) {
      console.error('AI手の適用エラー:', error);
      this.showNotification('AIの手を適用できませんでした', 'danger');
    }
  }

  /**
   * AI履歴リセットの確認ダイアログを表示
   */
  confirmResetAIHistory() {
    if (confirm('本当に履歴を削除してもよろしいですか？')) {
      this.aiManager.resetHistory();
      this.showNotification('AI履歴をリセットしました', 'info');
    }
  }

  /**
   * AI履歴をクリア
   */
  clearAIMoveHistory() {
    if (this.aiDom.aiMoveHistory) {
      this.aiDom.aiMoveHistory.innerHTML = '<div class="text-center py-3 text-muted"><em>まだ履歴がありません</em></div>';
    }
  }

  /**
   * 通知を表示
   * @param {string} message - 通知メッセージ
   * @param {string} type - 通知タイプ
   */
  showNotification(message, type = 'info') {
    // 通知ライブラリが実装されていれば使用
    if (window.Toastify) {
      window.Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'center',
        backgroundColor: type === 'success' ? '#28a745' : 
                        type === 'danger' ? '#dc3545' : 
                        type === 'warning' ? '#ffc107' : '#17a2b8'
      }).showToast();
    } else {
      // フォールバックとしてコンソールに出力
      console.log(`[${type}] ${message}`);
      alert(message);
    }
  }

  /**
   * AIの手を一手戻す
   */
  undoAIMove() {
    if (!this.aiManager || !this.aiManager.moveHistory || this.aiManager.moveHistory.length === 0) {
      return;
    }

    const currentIndex = this.aiManager.selectedMoveIndex;
    if (currentIndex > 0) {
      const prevMove = this.aiManager.moveHistory[currentIndex - 1];
      this.applyAIMove(prevMove);
      this.aiManager.selectedMoveIndex = currentIndex - 1;
      this.updateAIButtonStates();
      this.updateCurrentMove();
    }
  }

  /**
   * AIの手を一手進める
   */
  redoAIMove() {
    if (!this.aiManager || !this.aiManager.moveHistory || this.aiManager.moveHistory.length === 0) {
      return;
    }

    const currentIndex = this.aiManager.selectedMoveIndex;
    if (currentIndex < this.aiManager.moveHistory.length - 1) {
      const nextMove = this.aiManager.moveHistory[currentIndex + 1];
      this.applyAIMove(nextMove);
      this.aiManager.selectedMoveIndex = currentIndex + 1;
      this.updateAIButtonStates();
      this.updateCurrentMove();
    }
  }

  /**
   * AIの手を進める/戻るボタンの状態を更新
   */
  updateAIButtonStates() {
    const undoButton = document.getElementById('undo-ai-move');
    const redoButton = document.getElementById('redo-ai-move');

    if (!this.aiManager || !this.aiManager.moveHistory || this.aiManager.moveHistory.length === 0) {
      if (undoButton) undoButton.disabled = true;
      if (redoButton) redoButton.disabled = true;
      return;
    }

    const currentIndex = this.aiManager.selectedMoveIndex;
    if (undoButton) undoButton.disabled = currentIndex <= 0;
    if (redoButton) redoButton.disabled = currentIndex >= this.aiManager.moveHistory.length - 1;
  }

  /**
   * 現在の手を更新
   */
  updateCurrentMove() {
    if (!this.aiManager || !this.aiManager.moveHistory || this.aiManager.moveHistory.length === 0) {
      const display = document.querySelector('.ai-move-display');
      if (display) {
        display.style.display = 'none';
      }
      return;
    }

    const display = document.querySelector('.ai-move-display');
    if (!display) return;

    display.style.display = 'flex';
    const currentIndex = this.aiManager.selectedMoveIndex;
    const history = this.aiManager.moveHistory;

    if (currentIndex >= 0 && currentIndex < history.length) {
      const move = history[currentIndex];
      const moveLocation = move.suggestion.move.location;
      const minoType = moveLocation.type;
      const orientation = moveLocation.orientation;
      const position = `x:${moveLocation.adjustedRange.x}, y:${moveLocation.adjustedRange.y}`;
      
      const currentElement = display.querySelector('.ai-move-current');
      if (currentElement) {
        currentElement.innerHTML = `
          <span class="ai-piece-type ${minoType}">${minoType}</span>
          <span>${orientation}, ${position}</span>
        `;
        currentElement.style.display = 'flex';
        currentElement.style.alignItems = 'center';
        currentElement.style.gap = '4px';
      }
    } else {
      display.style.display = 'none';
    }
  }
} 