import { GlobalState } from '../store/GlobalState.js';
import { AIEngineController } from '../services/AIEngineController.js';

/**
 * AIモーダル管理クラス
 * AIモーダルの表示、操作、状態管理を担当
 */
export class AISuggestionPanel {
  _state;
  _modal;
  _aiEngine;
  _dom;
  _gameState;
  _globalState;

  constructor() {
    this._aiEngine = new AIEngineController();
    this._state = {
      status: 'idle',
      statusMessage: '',
      moves: [],
      currentIndex: -1,
      currentMove: null
    };

    this._g = GlobalState.getInstance();
    // DOM要素の初期化
    this._initializeDOMElements();
    this._initializeModal();
    this._initializeEventListeners();
    this._setupAIEngineListeners();

    // AIボタンのイベントリスナーを追加
    this._dom.openModalButton?.addEventListener('click', () => {
      this.openModal();
    });

    // AIの状態の監視を開始
    this._g.addAIStateListener((state) => {/* 実装予定 */});

    this.updateSearchStatus(false, '初期化中');
    this._aiEngine.initialize();
  }

  /**
   * AIエンジンのイベントリスナーを設定
   */
  _setupAIEngineListeners() {
    this._aiEngine.on('initialized', () => {
      console.log('AIエンジンが初期化されました');
      this.updateSearchStatus(false, 'AI待機中');
    });

    this._aiEngine.on('statusMessage', (message) => {
      this.updateStatusMessage(message);
    });

    this._aiEngine.on('suggestion', (suggestion) => {
      console.log('AI提案を受信:', suggestion);      
    });
  }

  /**
   * DOM要素の初期化
   */
  _initializeDOMElements() {
    this._dom = {
      modal: document.getElementById('ai-modal'),
      openModalButton: document.getElementById('ask-ai-button'),
      searchButton: document.getElementById('ai-search-button'),
      applyButton: document.getElementById('ai-apply-button'),
      resetHistoryButton: document.getElementById('ai-reset-history-button'),
      moveHistory: document.getElementById('ai-move-history'),
      statusMessage: document.getElementById('ai-status-message')
    };
  }

  /**
   * モーダルの初期化
   */
  _initializeModal() {
    if (!this._dom.modal) {
      console.error('AIモーダルの要素が見つかりません');
      this._modal = null;
      return;
    }

    this._modal = new bootstrap.Modal(this._dom.modal);
  }

  /**
   * イベントリスナーの初期化
   */
  _initializeEventListeners() {
    // AIの状態の監視を開始
    this._g.addAIStateListener((state) => {
      this._updateModalDisplay();
    });

    // 探索ボタン
    this._dom.searchButton?.addEventListener('click', () => {
      this._startAISearch();
    });

    // 適用ボタン
    this._dom.applyButton?.addEventListener('click', () => {
      this._closeModal();
    });
    

    // 履歴リセットボタン
    this._dom.resetHistoryButton?.addEventListener('click', () => {
      this._confirmResetAIHistory();
    });
    
    // モーダルの閉じるボタン
    document.getElementById('close-ai-modal')?.addEventListener('click', () => {
      this._closeModal();
    });
  }

  /**
   * モーダルを開く
   */
  openModal() {
    const boardSettings = this._g.getSettings().boardSettings;
    
    // 幅が10でない場合は通知を表示して処理を中断
    if (boardSettings.width !== 10) {
      this.setError('AIは幅10のボードのみ対応しています');
      return;
    }
    
    // モーダルが初期化されていない場合は再初期化を試みる
    if (!this._modal) {
      this._initializeModal();
      if (!this._modal) {
        console.error('モーダルの初期化に失敗しました');
        return;
      }
    }
    
    // 現在のゲーム状態を取得
    const boardState = this._g.getBoardState();
    this._gameState = {
      queue: boardState.next,
      hold: boardState.hold
    };
    
    // モーダルを表示
    try {
      this._modal.show();
      this.updateSearchStatus(false, 'AI待機中');
    } catch (error) {
      console.error('モーダルの表示に失敗しました:', error);
    }
  }

  /**
   * AIモーダルを閉じる
   */
  _closeModal() {
    // モーダルを閉じる前にフォーカスを外す
    if (document.activeElement) {
      document.activeElement.blur();
    }
    this._modal?.hide();
  }

  /**
   * AI探索を開始
   */
  async _startAISearch() {
    if (!this._gameState) {
      this.setError('ゲーム状態が設定されていません');
      return;
    }

    try {
      this.updateSearchStatus(true, '探索中...');
      const settings = this._g.getSettings();
      await this._aiEngine.startSearch(
        this._gameState,
        0,
        settings.aiSettings.weights_name
      );
    } catch (error) {
      this.setError(`探索エラー: ${error.message}`);
    }
  }

  /**
   * AIの探索履歴をリセット
   */
  _confirmResetAIHistory() {
    if (confirm('AIの探索履歴をリセットしますか？')) {
      this._g.clearAIMoves();
    }
  }

  /**
   * 指定されたインデックスの手を選択
   * @param {number} index - 選択する手のインデックス
   * @private
   */
  _selectMove(index) {
    const move = this._g.selectAIMove(index);
    // 選択状態の更新のみを行い、イベントは発火しない
    this._updateModalDisplay();
  }

  /**
   * モーダル表示の更新
   */
  _updateModalDisplay() {
    if (!this._modal || !this._dom.modal) {
      console.warn('モーダルが初期化されていません');
      return;
    }

    const aiState = this._g.getAIState();

    // 表示用の状態を作成
    const displayState = {
      status: this._state.status,
      statusMessage: this._state.statusMessage,
      isSearching: this._state.isSearching,
      moves: aiState.moves,
      currentIndex: aiState.currentIndex
    };

    // ステータス表示の更新
    const statusElement = document.getElementById('ai-status-message');
    if (statusElement) {
      statusElement.textContent = displayState.statusMessage || displayState.status;
    }

    // 探索中の表示制御
    const searchingIndicator = this._dom.modal.querySelector('.searching-indicator');
    if (searchingIndicator) {
      searchingIndicator.style.display = displayState.isSearching ? 'block' : 'none';
    }

    // 履歴の表示更新
    this._updateMoveHistory(displayState);
  }

  /**
   * 手の履歴表示を更新
   */
  _updateMoveHistory(state) {
    if (!this._modal || !this._dom.modal) return;

    const historyContainer = this._dom.modal.querySelector('.ai-history-container');
    if (!historyContainer) return;

    // コンテナをクリア
    historyContainer.innerHTML = '';

    // 履歴がない場合のメッセージを表示
    if (!state.moves || state.moves.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'text-center py-3 text-muted';
      emptyMessage.textContent = '探索履歴がありません';
      historyContainer.appendChild(emptyMessage);
      return;
    }

    // 各手の要素を作成
    state.moves.forEach((move, index) => {
      const moveElement = document.createElement('div');
      moveElement.classList.add('ai-history-item');
      if (index === state.currentIndex) {
        moveElement.classList.add('selected');
      }
     

      // 手の情報を表示
      const formattedMove = this._formatMove(move);
      moveElement.innerHTML = `
        <span class="ai-piece-type ${formattedMove.minoType}">${formattedMove.minoType}</span>
        <span>${index + 1}手目: 向き${formattedMove.orientation}, 位置${formattedMove.position}</span>
      `;

      // クリックイベントを設定
      moveElement.addEventListener('click', () => {
        this._selectMove(index);
      });

      historyContainer.appendChild(moveElement);
    });

    // 適用ボタンの状態を更新
    if (this._dom.applyButton) {
      this._dom.applyButton.disabled = state.currentIndex === -1;
    }
  }

  /**
   * エラー状態の設定
   * @param {string} message - エラーメッセージ
   */
  setError(message) {
    this._state.status = 'error';
    this._state.statusMessage = message;
    this._updateModalDisplay();
    
    console.log(`[error] ${message}`);
    alert(`[error] ${message}`);
  }

  /**
   * 探索状態の更新
   * @param {boolean} isSearching - 探索中かどうか
   * @param {string} status - 状態メッセージ
   */
  updateSearchStatus(isSearching, status) {
    this._state.isSearching = isSearching;
    this._state.status = status;
    this._updateModalDisplay();
  }

  /**
   * ステータスメッセージの更新
   * @param {string} message - 表示するメッセージ
   */
  updateStatusMessage(message) {
    this._state.statusMessage = message;
    this._updateModalDisplay();
  }

  /**
   * 手の情報を文字列にフォーマット
   * @param {Object} move - 手の情報
   * @returns {string} - フォーマットされた文字列
   * @private
   */
  _formatMove(move) {
    if (!move) return {
      index: 0,
      minoType: '不明',
      orientation: '不明',
      position: '不明'
    };
    
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