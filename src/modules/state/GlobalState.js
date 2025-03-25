/**
 * グローバルな状態管理クラス
 */
export class GlobalState {
  static _instance = null;
  
  constructor() {
    if (GlobalState._instance) {
      return GlobalState._instance;
    }
    
    this._state = {
      ai: {
        moves: [],
        currentIndex: -1,
        listeners: new Set()
      }
    };
    
    GlobalState._instance = this;
  }

  /**
   * シングルトンインスタンスを取得
   */
  static getInstance() {
    if (!GlobalState._instance) {
      GlobalState._instance = new GlobalState();
    }
    return GlobalState._instance;
  }

  /**
   * AIの手を追加
   * @param {Object} move - 追加する手の情報
   */
  addAIMoves(moves) {
    this._state.ai.moves.push(...moves);
    this._notifyAIStateListeners();
  }

  /**
   * AIの手の履歴をクリア
   */
  clearAIMoves() {
    this._state.ai.moves = [];
    this._state.ai.currentIndex = -1;
    this._notifyAIStateListeners();
  }

  /**
   * AIの手を選択
   * @param {number} index - 選択する手のインデックス
   * @returns {Object|null} - 選択された手、または範囲外の場合はnull
   */
  selectAIMove(index) {
    if (index >= 0 && index < this._state.ai.moves.length) {
      this._state.ai.currentIndex = index;
      this._notifyAIStateListeners();
      return this._state.ai.moves[index];
    }
    return null;
  }

  /**
   * 次のAIの手を選択
   * @returns {Object|null} - 次の手、または存在しない場合はnull
   */
  nextAIMove() {
    if (this._state.ai.currentIndex < this._state.ai.moves.length - 1) {
      return this.selectAIMove(this._state.ai.currentIndex + 1);
    }
    return null;
  }

  /**
   * 前のAIの手を選択
   * @returns {Object|null} - 前の手、または存在しない場合はnull
   */
  previousAIMove() {
    if (this._state.ai.currentIndex > 0) {
      return this.selectAIMove(this._state.ai.currentIndex - 1);
    }
    return null;
  }

  /**
   * AIの状態を監視
   * @param {Function} callback - 状態変更時に呼び出されるコールバック
   */
  addAIStateListener(callback) {
    this._state.ai.listeners.add(callback);
  }

  /**
   * AIの状態の監視を解除
   * @param {Function} callback - 解除するコールバック
   */
  removeAIStateListener(callback) {
    this._state.ai.listeners.delete(callback);
  }

  /**
   * 現在選択されているインデックスを取得
   * @returns {number} 現在のインデックス
   */
  getCurrentIndex() {
    return this._state.ai.currentIndex;
  }

  /**
   * AIの状態を取得
   * @returns {Object} - 現在のAIの状態
   */
  getAIState() {
    return {
      moves: [...this._state.ai.moves],
      currentIndex: this._state.ai.currentIndex,
      currentMove: this._state.ai.currentIndex >= 0 ? 
        this._state.ai.moves[this._state.ai.currentIndex] : null
    };
  }

  /**
   * AIの状態変更をリスナーに通知
   * @private
   */
  _notifyAIStateListeners() {
    const state = this.getAIState();
    this._state.ai.listeners.forEach(listener => listener(state));
  }

  /**
   * 現在選択されている手を取得
   * @returns {Object|null} 現在の手、または選択されていない場合はnull
   */
  getCurrentMove() {
    const index = this._state.ai.currentIndex;
    return index >= 0 && index < this._state.ai.moves.length ? 
      this._state.ai.moves[index] : null;
  }
} 