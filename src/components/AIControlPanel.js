import { GlobalState } from '../store/GlobalState.js';

/**
 * AI制御パネルクラス
 * AIの手の制御と表示を担当
 */
export class AIControlPanel {
  _globalState;
  _dom;

  constructor() {
    this._globalState = GlobalState.getInstance();
    this._initializeDOMElements();
    this._initializeEventListeners();
  }

  /**
   * DOM要素の初期化
   */
  _initializeDOMElements() {
    this._dom = {
      aiMoveText: document.getElementById('ai-move-text'),
      aiNextButton: document.getElementById('ai-next-button'),
      aiPrevButton: document.getElementById('ai-prev-button'),
      toggleBoard: document.getElementById('toggle-board')
    };
  }

  /**
   * イベントリスナーの初期化
   */
  _initializeEventListeners() {
    // AIの状態の監視を開始
    this._globalState.addAIStateListener((state) => {
      this.updateAIStateDisplay(state);
    });

    // ボタンのイベントリスナーを設定
    this._dom.aiNextButton?.addEventListener('click', () => {
      this._globalState.moveToNextAIMove();
    });

    this._dom.aiPrevButton?.addEventListener('click', () => {
      this._globalState.moveToPreviousAIMove();
    });

    // ボード表示/非表示切り替えボタンのリスナー
    this._dom.toggleBoard?.addEventListener('click', () => {
      this.toggleBoardVisibility();
    });

    // 初期状態の表示を更新
    const initialState = this._globalState.getAIState();
    this.updateAIStateDisplay(initialState);
  }

  /**
   * AI状態表示の更新
   * @param {Object} state - AIの状態
   */
  updateAIStateDisplay(state) {
    if (this._dom.aiMoveText) {
      if (state.currentMove) {
        const formattedMove = this._formatMove(state.currentMove);
        this._dom.aiMoveText.innerHTML = `
          <span class="ai-piece-type ${formattedMove.minoType}">${formattedMove.minoType}</span>
          <span>${state.currentIndex + 1}手目: ${formattedMove.orientation}, ${formattedMove.position}</span>
        `;
      } else {
        this._dom.aiMoveText.textContent = '';
      }
    }
    
    if (this._dom.aiNextButton) {
      this._dom.aiNextButton.disabled = state.currentIndex >= state.moves.length - 1;
    }
    
    if (this._dom.aiPrevButton) {
      this._dom.aiPrevButton.disabled = state.currentIndex <= 0;
    }
  }

  /**
   * ボードの表示/非表示を切り替える
   */
  toggleBoardVisibility() {
    const isGridHidden = this._globalState.isGridHidden();
    this._globalState.setGridHidden(!isGridHidden);
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
} 