import { generateBaseSeed, createSeededGenerator, getSavedSeed, saveSeed, isValidSeed } from '../utils/random.js';
import { config, minoColors } from '../utils/config.js';
import { SettingsManager } from '../modules/SettingsManager.js';
import { BoardManager } from '../modules/BoardManager.js';
import { MinoManager } from '../modules/MinoManager.js';
import { EditManager } from '../modules/EditManager.js';
import { GestureManager } from '../modules/GestureManager.js';
import { AIModalManager } from '../modules/AIModalManager.js';
import { AIStateManager } from '../modules/AIStateManager.js';

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
      askAIButton: document.getElementById('ask-ai-button'),
      aiMoveText: document.getElementById('ai-move-text'),
      aiNextButton: document.getElementById('ai-next-button'),
      aiPrevButton: document.getElementById('ai-prev-button'),
      aiStatusText: document.getElementById('ai-status-text')
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
      this.initializeAIModal();
      this.initializeControls();
      this.generateFirstProblem();
      this.logInitializationInfo();
      
      // 初期状態では空のホールド表示を作成
      this.updateHoldDisplay(null);
      
    } catch (error) {
      console.error('初期化に失敗しました:', error);
    }
  }

  /**
   * AIモーダルの初期化
   */
  initializeAIModal() {
    try {
      // AIManagerWrapperをインポート
      import('../modules/AIManagerWrapper.js').then(module => {
        this.aiManager = new module.AIManagerWrapper();
        this.aiStateManager = new AIStateManager();
        this.aiModalManager = new AIModalManager(this.aiManager, this.aiStateManager);
        
        // AIマネージャーのイベントリスナーを設定
        this.setupAIManagerListeners();
        
        // ヘッダー部分のAI状態表示を初期化
        this.initializeAIStateDisplay();
        
        // AIマネージャーを初期化
        this.aiManager.initialize();
      }).catch(error => {
        console.error('AIモジュールのロードに失敗しました:', error);
        this.showNotification('AIモジュールのロードに失敗しました', 'danger');
      });
    } catch (error) {
      console.error('AI初期化エラー:', error);
    }
  }

  /**
   * ヘッダー部分のAI状態表示を初期化
   */
  initializeAIStateDisplay() {
    // AIStateManagerの監視を開始
    this.aiStateManager.addListener((state) => {
      this.updateAIStateDisplay(state);
    });

    // ボタンのイベントリスナーを設定
    this.dom.aiNextButton?.addEventListener('click', () => {
      const move = this.aiStateManager.nextMove();
      if (move) this.applyAIMove(move);
    });

    this.dom.aiPrevButton?.addEventListener('click', () => {
      const move = this.aiStateManager.previousMove();
      if (move) this.applyAIMove(move);
    });
  }

  /**
   * ヘッダー部分のAI状態表示を更新
   */
  updateAIStateDisplay(state) {
    if (this.dom.aiMoveText) {
      this.dom.aiMoveText.textContent = state.currentMove?.description || '';
    }
    
    if (this.dom.aiNextButton) {
      this.dom.aiNextButton.disabled = 
        state.currentIndex >= state.moveHistory.length - 1;
    }
    
    if (this.dom.aiPrevButton) {
      this.dom.aiPrevButton.disabled = state.currentIndex <= 0;
    }

    if (this.dom.aiStatusText) {
      this.dom.aiStatusText.textContent = state.statusMessage || state.status;
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
    this.setupAskAIButtonListener();
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
   * AIマネージャーのイベントリスナーを設定
   */
  setupAIManagerListeners() {
    this.aiManager.on('initialized', () => {
      console.log('AIマネージャーが初期化されました');
      this.aiStateManager.updateSearchStatus(false, 'AI待機中');
    });

    this.aiManager.on('error', (errorMessage) => {
      console.error('AIエラー:', errorMessage);
      this.aiStateManager.setError(errorMessage);
    });

    this.aiManager.on('searchStarted', () => {
      this.aiStateManager.updateSearchStatus(true, '探索中...');
    });

    this.aiManager.on('searchStopped', () => {
      this.aiStateManager.updateSearchStatus(false, '探索停止');
    });

    this.aiManager.on('statusMessage', (message) => {
      this.aiStateManager.updateStatusMessage(message);
    });

    this.aiManager.on('suggestion', (suggestion) => {
      this.handleAISuggestion(suggestion);
    });

    this.aiManager.on('movesCalculated', (moves) => {
      this.aiStateManager.updateState(moves);
    });

    this.aiManager.on('historyReset', () => {
      this.aiStateManager.resetHistory();
    });

    this.aiManager.on('moveApplied', (move) => {
      this.applyAIMove(move);
    });
  }

  /**
   * AI提案を処理
   * @param {Object} suggestion - AI提案
   */
  handleAISuggestion(suggestion) {
    console.log('AI提案を受信:', suggestion);
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
    } catch (error) {
      console.error('AI手の適用エラー:', error);
      this.showNotification('AIの手を適用できませんでした', 'danger');
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
   * AIボタンのイベントリスナーを設定
   */
  setupAskAIButtonListener() {
    if (this.dom.askAIButton) {
      this.dom.askAIButton.addEventListener('click', () => {
        // 現在のゲーム状態を取得
        const board = BoardManager.getCurrentBoard(
          this.dom.board, 
          this.currentWidth, 
          this.currentHeight
        );
        
        // MinoManagerからネクスト情報を取得
        const queue = MinoManager.getQueueForAI();
        
        // 現バージョンではホールドは使用しない
        const hold = null;

        // 設定を取得
        const settings = this.settingsManager.getSettings();
        
        // ゲーム状態とボード設定をAIモーダルに渡す
        this.aiModalManager.openAIModal(
          { board, queue, hold },
          settings.boardSettings
        );
      });
    }
  }
} 