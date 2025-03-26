import { createSeededGenerator} from '../utils/random.js';
import { config, minoColors } from '../utils/config.js';
import { SettingsPanel } from './SettingsPanel.js';
import { BoardManager } from '../modules/BoardManager.js';
import { MinoManager } from '../modules/MinoManager.js';
import { EditManager } from '../modules/EditManager.js';
import { GestureManager } from '../modules/GestureManager.js';
import { AISuggestionPanel } from './AISuggestionPanel.js';
import { GlobalState } from '../modules/state/GlobalState.js';
import { showNotification } from '../utils/notificationUtils.js';

/**
 * テトリスアプリケーションクラス
 * アプリケーション全体の管理を担当
 */
export class TetrisApp {
  /**
   * コンストラクタ
   */
  constructor() {
    this.randomGenerator = null;
    this.currentWidth = 0;
    this.currentHeight = 0;
    this.editState = EditManager.initialize();
    this.dom = null;
    this.settingsPanel = null;
    this._globalState = GlobalState.getInstance();

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
      newProblemButton: document.getElementById('new-problem-button'),
    };

    return this.dom;
  }

  /**
   * アプリケーションの初期化
   */
  initializeApp() {
    try {
      this.dom = this.initializeDOMElements();
      
      // 乱数生成器を生成
      const _seed = this._globalState.getSeed();
      this.randomGenerator = createSeededGenerator(_seed);
      
      this.initializeSettingsModal();
      this.initializeAIModal();
      this.initializeControls();
      this.initializeAIStateDisplay();
      this.generateProblem();
      this.logInitializationInfo();
      
      // 初期状態では空のホールド表示を作成
      this.updateHoldDisplay(null);

      // 設定変更のリスナーを追加
      this._globalState.addSettingsListener((settings) => {
        this.handleSettingsUpdate(settings);
      });
      
    } catch (error) {
      console.error('初期化に失敗しました:', error);
    }
  }

  /**
   * AIモーダルを初期化
   */
  async initializeAIModal() {
    this.aiPanel = new AISuggestionPanel();
    await this.aiPanel.initialize();

    // AIの手が選択された時のイベントリスナーを追加
    document.addEventListener('aiMoveSelected', (event) => {
      const move = event.detail.move;
      this.applyAIMove(move);
    });

    // AIボタンのイベントリスナーを追加
    this.dom.askAIButton?.addEventListener('click', () => {
      const board = BoardManager.getCurrentBoard(
        this.dom.board, 
        this.currentWidth, 
        this.currentHeight
      );
      const queue = MinoManager.getQueueForAI();
      const hold = null;
      
      this.aiPanel.openModal(
        { board, queue, hold }
      );
    });
  }

  /**
   * AIの手を適用
   * @param {Object} move - 適用する手
   */
  applyAIMove(move) {
    try {

      if (move == null) {
        return;
      }

      // 現在の表示状態を記憶
      const board = this.dom.board;
      const isBoardHidden = board.getAttribute('data-visible') === 'false';
      
      // ボードを更新
      if (move.suggestion && move.suggestion.board) {
        BoardManager.applyAIBoard(
          board,
          move.suggestion.board,
          this.currentWidth,
          this.currentHeight
        );
      }
      
      // ネクストを更新
      if (move.suggestion && move.suggestion.next) {
        // 設定されたネクスト数を取得
        const nextCountElement = document.querySelector('.next-count-value');
        const nextCount = parseInt(nextCountElement?.textContent) || 5;
        
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
        const cells = board.querySelectorAll('.cell');
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
        board.setAttribute('data-visible', 'false');
      }
    } catch (error) {
      console.error('AI手の適用エラー:', error);
      showNotification('AIの手を適用できませんでした', 'danger');
    }
  }

  /**
   * ヘッダー部分のAI状態表示を初期化
   */
  initializeAIStateDisplay() {
    // AIの状態の監視を開始
    this._globalState.addAIStateListener((state) => {
      this.updateAIStateDisplay(state);
      this.applyAIMove(state.currentMove);
    });

    // ボタンのイベントリスナーを設定
    this.dom.aiNextButton?.addEventListener('click', () => {
      this._globalState.moveToNextAIMove();
    });

    this.dom.aiPrevButton?.addEventListener('click', () => {
      this._globalState.moveToPreviousAIMove();
    });
  }

  /**
   * ヘッダー部分のAI状態表示を更新
   */
  updateAIStateDisplay(state) {
    if (this.dom.aiMoveText) {
      if (state.currentMove) {
        const formattedMove = this._formatMove(state.currentMove);
        this.dom.aiMoveText.innerHTML = `
          <span class="ai-piece-type ${formattedMove.minoType}">${formattedMove.minoType}</span>
          <span>${state.currentIndex + 1}手目: ${formattedMove.orientation}, ${formattedMove.position}</span>
        `;
      } else {
        this.dom.aiMoveText.textContent = '';
      }
    }
    
    if (this.dom.aiNextButton) {
      this.dom.aiNextButton.disabled = state.currentIndex >= state.moves.length - 1;
    }
    
    if (this.dom.aiPrevButton) {
      this.dom.aiPrevButton.disabled = state.currentIndex <= 0;
    }
  }

  /**
   * 手の情報を文字列にフォーマット
   * @param {Object} move - 手の情報
   * @returns {Object} - フォーマットされた手の情報
   * @private
   */
  _formatMove(move) {
    if (!move || !move.suggestion || !move.suggestion.move || !move.suggestion.move.location) {
      return {
        minoType: '不明',
        orientation: '不明',
        position: '不明'
      };
    }
    
    const moveLocation = move.suggestion.move.location;
    const minoType = moveLocation.type;
    const orientation = moveLocation.orientation;
    const position = `x:${moveLocation.adjustedRange.x}, y:${moveLocation.adjustedRange.y}`;  

    return {
      minoType,
      orientation,
      position
    };
  }

  /**
   * 設定モーダルの初期化
   */
  initializeSettingsModal() {
    // SettingsPanelのインスタンス化
    this.settingsPanel = new SettingsPanel();

    // 設定ボタンのイベントリスナーを追加
    this.dom.settingsButton?.addEventListener('click', () => {
      this.settingsPanel.openModal();
    });
  }

  /**
   * 設定更新時の処理
   * @param {Object} settings - 新しい設定
   */
  handleSettingsUpdate(settings) {
    const { boardSettings } = settings;
    
    // 盤面サイズの変更
    if (boardSettings.width !== this.currentWidth || 
        boardSettings.height !== this.currentHeight) {
      this.currentWidth = boardSettings.width;
      this.currentHeight = boardSettings.height;
    }

    // ネクストキューの更新
    MinoManager.updateNextPieces(
      this.dom.nextContainer, 
      boardSettings, 
      this.randomGenerator
    );

    this.generateProblem();
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
   * 初期化情報のログ出力
   */
  logInitializationInfo() {
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
    this.setupNewProblemButtonListener();
    
    // 新しい問題生成ボタンのイベントリスナー
    this.dom.newProblemButton?.addEventListener('click', () => {
      this.generateNewProblem();
    });
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
      null,
      null,
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
    const settings = this._globalState.getSettings();
    MinoManager.removeUsedPieces(this.dom.nextContainer, settings);
  }

  /**
   * 問題の生成
   */
  generateProblem() {
    // 保存されている設定を取得
    const settings = this._globalState.getSettings();
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
    
    // Autoモードを選択状態にする
    this.editState = EditManager.setEditAction(this.editState, 'auto');
    EditManager.updateEditButtonState(this.dom.editOptionButtons, 'auto');
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
   * 新しい問題を生成
   */
  generateNewProblem() {
    const seed = this._globalState.updateSeed();
    this.randomGenerator = createSeededGenerator(seed);
    this.generateProblem();
  }

} 