import { createSeededGenerator} from '../utils/random.js';
import { config } from '../utils/config.js';
import { SettingsPanel } from './SettingsPanel.js';
import { BoardManager } from '../modules/BoardManager.js';
import { EditManager } from '../modules/EditManager.js';
import { GestureManager } from '../modules/GestureManager.js';
import { AISuggestionPanel } from './AISuggestionPanel.js';
import { AIControlPanel } from './AIControlPanel.js';
import { GlobalState } from '../store/GlobalState.js';
import { showNotification } from '../utils/notificationUtils.js';
import { Hold } from './Hold.js';
import { Next } from './Next.js';
import { generateNextPieces } from '../utils/minoUtils.js';

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
    this.editState = EditManager.initialize();
    this.dom = null;
    this._globalState = GlobalState.getInstance();

    // コンポーネントの管理
    this.components = {
      settingsPanel: new SettingsPanel(),
      aiSuggestionPanel: new AISuggestionPanel(),
      aiControlPanel: new AIControlPanel(),
      hold: new Hold(),
      next: new Next(),
    };
    this.initializeApp();
  }

  /**
   * DOMエレメントの初期化
   * @returns {Object} DOM要素オブジェクト
   */
  initializeDOMElements() {
    this.dom = {
      app: document.getElementById('app'),
      board: document.getElementById('board'),
      editNav: document.getElementById('control-panel'),
      clearBoard: document.getElementById('clear-board'),
      editOptionButtons: document.querySelectorAll('.edit-option'),
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
      
      this.initializeAIModal();
      this.generateProblem();
      this.setupButtonEventListeners();

      // ジェスチャーコントロールのセットアップ
      GestureManager.setupGestureControls(
        document.querySelector('.tetris-app__main'),
        document.getElementById('board-container'),
        null,
        null,
        (event) => this.handleCellPaint(event),
        this.editState
      );

      // 設定変更のリスナーを追加
      this._globalState.addSettingsListener((settings) => {
        this.handleSettingsUpdate(settings);
      });

      // 各コンポーネントを初期化させるためのイベントを発行
      const currentIndex = this._globalState.getCurrentIndex();
      if (currentIndex >= 1) {
        this._globalState.selectAIMove(currentIndex);
      }
      
    } catch (error) {
      console.error('初期化に失敗しました:', error);
    }
  }

  /**
   * AIモーダルを初期化
   */
  async initializeAIModal() {
    this.components.aiSuggestionPanel.initialize();

    // AIの状態の監視を開始
    this._globalState.addAIStateListener((state) => {
      if (state.currentMove) {
        this.applyAIMove(state.currentMove);
      }
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
        const settings = this._globalState.getSettings();
        const { width, height } = settings.boardSettings;
        
        BoardManager.applyAIBoard(
          board,
          move.suggestion.board,
          width,
          height
        );
      }
      
      // ネクストを更新
      if (move.suggestion && move.suggestion.next) {
        // 設定されたネクスト数を取得
        const nextCountElement = document.querySelector('.next-count-value');
        const nextCount = parseInt(nextCountElement?.textContent) || 5;
        
        // ネクスト配列を作成
        let nextArray = [...move.suggestion.next];
        
        // ネクストを更新
        this._globalState.updateNext(nextArray);
        
        // ホールドがある場合はホールド表示を更新
        this._globalState.updateHold(move.suggestion.hold);
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
   * 設定更新時の処理
   * @param {Object} settings - 新しい設定
   */
  handleSettingsUpdate(settings) {
    const { boardSettings } = settings;
    
    // 新しい問題を生成
    this.generateProblem();
  }


  /**
   * ボタンイベントリスナーの設定
   */
  setupButtonEventListeners() {
    
    // クリアボタンのイベントリスナー  
    this.dom.clearBoard?.addEventListener('click', () => this.resetToInitialBoard());
    
    // 新しい問題生成ボタンのイベントリスナー
    this.dom.newProblemButton?.addEventListener('click', () => this.generateNewProblem());

    // 編集ボタン(del, gray)のイベントリスナー
    this.dom.editOptionButtons.forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        this.editState = EditManager.setEditAction(this.editState, action);
        EditManager.updateEditButtonState(this.dom.editOptionButtons, action);
      });
    });
    
  }


  /**
   * セルクリック時の処理
   * @param {HTMLElement} cell - クリックされたセル要素
   * @param {number} index - セルのインデックス
   * @param {number} width - ボードの幅
   * @param {number} height - ボードの高さ
   */
  handleCellClick(cell) {
    this.editState = EditManager.handleEditCellClick(
      cell, 
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
      this.handleCellClick(cell);
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
   * 問題の生成
   */
  generateProblem() {
    // 保存されている設定を取得
    const settings = this._globalState.getSettings();
    const { boardSettings } = settings;
    
    BoardManager.createBoard((cell) => this.handleCellClick(cell));

    this._globalState.updateHold(null);
    
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
    
    // ネクストピースを生成して表示
    const nextPieces = generateNextPieces(this.randomGenerator, settings.minoMode);
    
    // ネクストを更新
    this._globalState.updateNext(nextPieces);
  }


  /**
   * 新しい問題を生成
   */
  generateNewProblem() {
  	
  	// AIの履歴があるか確認
    const aiState = this._globalState.getAIState();
    if (aiState.moves.length > 0) {
      if (!confirm('AIの履歴があります。新しい問題を生成すると履歴が削除されますが、よろしいですか？')) {
        return; // キャンセルされた場合は処理を中断
      }
      
      // AIの履歴をクリア
      this._globalState.clearAIMoves();
    }

    const seed = this._globalState.updateSeed();
    this.randomGenerator = createSeededGenerator(seed);
    this.generateProblem();
  }

} 