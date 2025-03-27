import { GlobalState } from '../store/GlobalState.js';
import { renderVisibleNextPieces_new } from '../modules/MinoDrawer.js';

/**
 * ネクストミノの表示を管理するクラス
 * ネクストミノのUI表示のみを担当
 */
export class Next {
  _globalState;
  _dom;

  constructor() {
    this._globalState = GlobalState.getInstance();

    // DOM要素の初期化
    this._dom = {
      nextContainer: document.getElementById('next'),
    };

    // ボードの状態変更と設定変更を監視
    this._globalState.addBoardStateListener(() => renderVisibleNextPieces_new());
    this._globalState.addSettingsListener(() => renderVisibleNextPieces_new());

    // 初期表示を更新
    renderVisibleNextPieces_new();
  }
}