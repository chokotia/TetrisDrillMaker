import { GlobalState } from '../store/GlobalState.js';
import { minoShapes } from '../utils/config.js';
import { drawMino } from '../modules/MinoDrawer.js';

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
    this._globalState.addBoardStateListener(() => this._updateDisplay());

    // 初期表示を更新
    this._updateDisplay();
  }

  /**
   * 表示の更新
   */
  _updateDisplay() {
    if (!this._dom.holdContainer) return;
    
    // ホールドコンテナをクリア
    this._dom.holdContainer.innerHTML = '';
    
    // ホールド用のコンテナを作成（ネクストと同じスタイルを使用）
    const holdPieceContainer = document.createElement('div');
    holdPieceContainer.className = 'next-piece-container';
    
    // ホールドミノを描画
    // const holdType = this._globalState.getBoardState().hold;
    const holdType = "T";
    
    drawMino(holdType, holdPieceContainer);

    // ホールドコンテナに追加
    this._dom.holdContainer.appendChild(holdPieceContainer);
  }
}