import { GlobalState } from '../store/GlobalState.js';
import { MinoManager } from '../modules/MinoManager.js';

/**
 * ホールドミノの表示を管理するクラス
 * ホールドミノのUI表示と状態管理を担当
 */
export class Hold {
  _globalState;
  _dom;
  _state;

  constructor() {
    this._globalState = GlobalState.getInstance();
    this._state = {};

    // DOM要素の初期化
    this._dom = {
        holdContainer: document.getElementById('hold'),
      };

    // ボードの状態変更を監視
    this._globalState.addBoardStateListener(this._onBoardStateChange.bind(this));

    // 初期表示を更新
    this._updateDisplay();
  }

  /**
   * ホールドミノを更新
   * @param {string|null} holdType - ホールドするミノのタイプ
   */
  updateHold(holdType) {
    const currentState = this._globalState.getBoardState();
    this._globalState.updateBoardState({
      ...currentState,
      hold: holdType
    });
  }

  /**
   * ボードの状態が変更されたときのコールバック
   */
  _onBoardStateChange(state) {
    this._updateDisplay(state.hold);
  }

  /**
   * 表示の更新
   */
  _updateDisplay(holdType) {
    if (!this._dom.holdContainer) return;
    
    // ホールドコンテナをクリア
    this._dom.holdContainer.innerHTML = '';
    
    // ホールド用のコンテナを作成（ネクストと同じスタイルを使用）
    const holdPieceContainer = document.createElement('div');
    holdPieceContainer.className = 'next-piece-container';
    
    // holdTypeがあれば描画、なければ空のコンテナを表示
    if (holdType) {
      // MinoManagerのdrawMino関数を使ってミノを描画
      MinoManager.drawMino(holdType, holdPieceContainer);
    }
    
    // ホールドコンテナに追加
    this._dom.holdContainer.appendChild(holdPieceContainer);
  }
}