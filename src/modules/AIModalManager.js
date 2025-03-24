/**
 * AIモーダル管理クラス
 * AIモーダルの表示、操作、状態管理を担当
 */
export class AIModalManager {
  _state;
  _modalElement;
  _modal;
  _aiManager;
  _dom;
  _gameState;
  _aiStateManager;

  constructor(aiManager, aiStateManager) {
    this._aiManager = aiManager;
    this._aiStateManager = aiStateManager;
    this._state = {
      selectedMoveIndex: -1,
      isSearching: false
    };

    // DOM要素の初期化
    this._initializeDOMElements();
    this._initializeModal();
    this._initializeEventListeners();
  }

  /**
   * DOM要素の初期化
   */
  _initializeDOMElements() {
    this._dom = {
      modal: document.getElementById('ai-modal'),
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
      return;
    }

    this._dom.modal.addEventListener('hidden.bs.modal', () => {
      this._dispatchEvent('aiModalClosed', {});
    });
    this._modal = new bootstrap.Modal(this._dom.modal);
  }

  /**
   * イベントリスナーの初期化
   */
  _initializeEventListeners() {
    // AIStateManagerの監視を開始
    this._aiStateManager.addListener((state) => {
      this._updateModalDisplay(state);
    });

    // 探索ボタン
    if (this._dom.searchButton) {
      this._dom.searchButton.addEventListener('click', () => {
        this._startAISearch();
      });
    }

    // 適用ボタン
    if (this._dom.applyButton) {
      this._dom.applyButton.addEventListener('click', () => {
        this._applySelectedAIMove();
      });
    }

    // 履歴リセットボタン
    if (this._dom.resetHistoryButton) {
      this._dom.resetHistoryButton.addEventListener('click', () => {
        this._confirmResetAIHistory();
      });
    }

    // モーダルの閉じるボタン
    document.getElementById('close-ai-modal')?.addEventListener('click', () => {
      this._closeAIModal();
    });
  }

  /**
   * AIモーダルを開く
   * @param {Object} gameState - 現在のゲーム状態（board, queue, holdを含む）
   * @param {Object} boardSettings - ボードの設定情報
   */
  openAIModal(gameState, boardSettings) {
    // 幅が10でない場合は通知を表示して処理を中断
    if (boardSettings.width !== 10) {
      this._aiStateManager.setError('AIは幅10のボードのみ対応しています');
      return;
    }
    
    // ゲーム状態を保存
    this._gameState = gameState;
    
    // モーダルを表示
    if (this._modal) {
      this._modal.show();
      this._aiStateManager.updateSearchStatus(false, 'AI待機中');
    }
  }

  /**
   * AIモーダルを閉じる
   */
  _closeAIModal() {
    this._modal?.hide();
  }

  /**
   * AI探索を開始
   */
  _startAISearch() {
    if (!this._gameState) return;
    this._aiManager.startSearch(this._gameState);
  }

  /**
   * 選択された手を適用
   */
  _applySelectedAIMove() {
    const currentMove = this._aiStateManager._currentMove;
    if (currentMove) {
      this._aiManager.applyMove(currentMove);
      this._closeAIModal();
    }
  }

  /**
   * AI履歴リセットの確認ダイアログを表示
   */
  _confirmResetAIHistory() {
    if (confirm('AIの探索履歴をリセットしますか？')) {
      this._aiManager.resetHistory();
    }
  }

  /**
   * モーダル表示の更新
   */
  _updateModalDisplay(state) {
    // 進捗表示の更新
    if (this._dom.progressContainer) {
      this._dom.progressContainer.style.display = state.isSearching ? 'block' : 'none';
    }

    // ステータスメッセージの更新
    if (this._dom.statusMessage) {
      this._dom.statusMessage.textContent = state.statusMessage || state.status;
    }

    // 計算状態の更新
    if (this._dom.calculationStatus) {
      this._dom.calculationStatus.textContent = state.status;
    }

    // 移動履歴の更新
    this._renderMoveHistory(state);
  }

  /**
   * 移動履歴の描画
   */
  _renderMoveHistory(state) {
    if (!this._dom.moveHistory) return;

    this._dom.moveHistory.innerHTML = '';
    const fragment = document.createDocumentFragment();

    // 履歴がない場合のメッセージを表示
    if (!state.moveHistory || state.moveHistory.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'text-center py-3 text-muted';
      emptyMessage.innerHTML = '<em>まだ履歴がありません</em>';
      this._dom.moveHistory.appendChild(emptyMessage);
      return;
    }

    state.moveHistory.forEach((move, index) => {
      const moveElement = document.createElement('div');
      moveElement.classList.add('ai-history-item');
      if (index === state.currentIndex) {
        moveElement.classList.add('selected');
      }

      // 移動情報の取得
      const moveLocation = move.suggestion.move.location;
      const minoType = moveLocation.type;
      const orientation = moveLocation.orientation;
      const position = `x:${moveLocation.adjustedRange.x}, y:${moveLocation.adjustedRange.y}`;

      // アイテムの内容を設定
      moveElement.innerHTML = `
        <span class="ai-piece-type ${minoType}">${minoType}</span>
        <span>${index + 1}手目: 向き${orientation}, 位置${position}</span>
      `;

      // クリックイベントを設定
      moveElement.addEventListener('click', () => {
        this._selectMove(index);
      });

      // ダブルクリックイベントを設定
      moveElement.addEventListener('dblclick', () => {
        const currentMove = state.moveHistory[index];
        if (currentMove) {
          this._aiManager.applyMove(currentMove);
          this.closeAIModal();
        }
      });

      fragment.appendChild(moveElement);
    });

    this._dom.moveHistory.appendChild(fragment);

    // 適用ボタンの状態を更新
    if (this._dom.applyButton) {
      this._dom.applyButton.disabled = state.currentIndex === -1;
    }
  }

  /**
   * 手の選択
   */
  _selectMove(index) {
    const move = this._aiStateManager._moveHistory[index];
    if (move) {
      this._aiStateManager.updateState(this._aiStateManager._moveHistory, index);
    }
  }

  /**
   * イベントを発火する
   * @param {string} eventName - イベント名
   * @param {Object} detail - イベントの詳細データ
   */
  _dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, {
      detail: detail
    });
    document.dispatchEvent(event);
  }
} 