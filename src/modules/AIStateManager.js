/**
 * AIの状態を管理するクラス
 */
export class AIStateManager {
  constructor() {
    this._currentMove = null;
    this._moveHistory = [];
    this._currentMoveIndex = -1;
    this._status = 'waiting';
    this._isSearching = false;
    this._statusMessage = '';
    this._listeners = new Set();
  }

  // 状態更新メソッド
  updateState(moves, currentIndex = 0) {
    this._moveHistory = moves;
    this._currentMoveIndex = currentIndex;
    this._currentMove = moves[currentIndex];
    this._notifyListeners();
  }

  // 手を進める
  nextMove() {
    if (this._currentMoveIndex < this._moveHistory.length - 1) {
      this._currentMoveIndex++;
      this._currentMove = this._moveHistory[this._currentMoveIndex];
      this._notifyListeners();
      return this._currentMove;
    }
    return null;
  }

  // 手を戻す
  previousMove() {
    if (this._currentMoveIndex > 0) {
      this._currentMoveIndex--;
      this._currentMove = this._moveHistory[this._currentMoveIndex];
      this._notifyListeners();
      return this._currentMove;
    }
    return null;
  }

  // 探索状態の更新
  updateSearchStatus(isSearching, status) {
    this._isSearching = isSearching;
    this._status = status;
    this._notifyListeners();
  }

  // ステータスメッセージの更新
  updateStatusMessage(message) {
    this._statusMessage = message;
    this._notifyListeners();
  }

  // エラー状態の設定
  setError(errorMessage) {
    this._status = 'error';
    this._statusMessage = errorMessage;
    this._notifyListeners();
  }

  // 履歴のリセット
  resetHistory() {
    this._moveHistory = [];
    this._currentMoveIndex = -1;
    this._currentMove = null;
    this._notifyListeners();
  }

  // 監視の追加
  addListener(callback) {
    this._listeners.add(callback);
  }

  // 監視の削除
  removeListener(callback) {
    this._listeners.delete(callback);
  }

  // リスナーに通知
  _notifyListeners() {
    const state = {
      currentMove: this._currentMove,
      moveHistory: this._moveHistory,
      currentIndex: this._currentMoveIndex,
      status: this._status,
      isSearching: this._isSearching,
      statusMessage: this._statusMessage
    };
    this._listeners.forEach(listener => listener(state));
  }
} 