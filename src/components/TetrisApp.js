import { createSeededGenerator} from '../utils/random.js';
import { SettingsPanel } from './SettingsPanel.js';
import { EditManager } from '../modules/EditManager.js';
import { GestureManager } from '../modules/GestureManager.js';
import { AISuggestionPanel } from './AISuggestionPanel.js';
import { AIControlPanel } from './AIControlPanel.js';
import { GlobalState } from '../store/GlobalState.js';
import { Hold } from './Hold.js';
import { Next } from './Next.js';
import { Board } from './Board.js';
import { EditModePanel } from './EditModePanel.js';
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
      board: new Board((cell, x, y) => this.handleCellClick(cell, x, y)),
      EditModePanel: new EditModePanel(),
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
      clearBoard: document.getElementById('clear-board'),
      newProblemButton: document.getElementById('new-problem-button'),

      // editOptionButtons: document.querySelectorAll('.edit-option'),
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
    // TODO
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
    this.dom.clearBoard?.addEventListener('click', () => this.generateProblem(false, false));
    // 新しい問題生成ボタンのイベントリスナー
    this.dom.newProblemButton?.addEventListener('click', () => this.generateProblem());

    // // 編集ボタン(del, gray)のイベントリスナー
    // this.dom.editOptionButtons.forEach(button => {
    //   button.addEventListener('click', () => {
    //     const action = button.dataset.action;
    //     this.editState = EditManager.setEditAction(this.editState, action);
    //     EditManager.updateEditButtonState(this.dom.editOptionButtons, action);
    //   });
    // });
    
  }


  /**
   * セルクリック時の処理
   * @param {HTMLElement} cell - クリックされたセル要素
   * @param {number} index - セルのインデックス
   * @param {number} width - ボードの幅
   * @param {number} height - ボードの高さ
   */
  handleCellClick(cell, x, y) {
    this.editState = EditManager.handleEditCellClick(
      cell, 
      x,
      y,
      this.editState
    );
  }

  /**
   * 問題の生成
   */
  generateProblem(isUpdateSeed = true, isClearAIHistory = true) {

  	// AIの履歴の削除
    if (isClearAIHistory) {
      const aiState = this._globalState.getAIState();
      if (aiState.moves.length > 0) {
        if (!confirm('AIの履歴があります。新しい問題を生成すると履歴が削除されますが、よろしいですか？')) {
          return;  // キャンセルされた場合、ここで処理を中断する
        }
        // AIの履歴をクリア
        this._globalState.clearAIMoves();
      }
    }

    // シードの更新
    const _seed = isUpdateSeed ? this._globalState.updateSeed() : this._globalState.getSeed();
    this.randomGenerator = createSeededGenerator(_seed);

    // 保存されている設定を取得
    const settings = this._globalState.getSettings();
    const { width, height } = settings.boardSettings;

    // ボードを初期化
    let grid = Array(height).fill().map(() => Array(width).fill(null));
    grid[1][1] = 'I';    grid[2][1] = 'J'; // テスト用
    this._globalState.updateGridAll(grid);

    // ホールドをクリア
    this._globalState.updateHold("T");

    // ネクストを更新
    const nextPieces = generateNextPieces(this.randomGenerator, settings.minoMode);
    this._globalState.updateNext(nextPieces);

    // グリッドを表示
    this._globalState.setGridHidden(false);
  }

} 