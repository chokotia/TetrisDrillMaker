import { GlobalState } from '../store/GlobalState.js';
import { EDIT_MODE } from '../utils/tetrisDef.js';


/**
 * 編集モード管理クラス
 * ボード編集機能を担当
 */
export class EditManager {

  /**
   * セルクリック時の編集処理
   */
  static handleEditCellClick(x, y) {

    const { selectedOption } = GlobalState.getInstance().getEditMode();
    switch (selectedOption) {
      case EDIT_MODE.DEL:
        this.handleDeleteAction(x, y);
        break;
      case EDIT_MODE.GRAY:
        this.handleGrayAction(x, y);
        break;
      default:
        // pass
        break;
    }
  }

  /**
   * 削除アクション
   * @param {HTMLElement} cell - セル要素
   */
  static handleDeleteAction(x, y) {
    GlobalState.getInstance().updateGrid(x, y, null);
  }

  /**
   * グレーブロックアクション
   * @param {HTMLElement} cell - セル要素
   */
  static handleGrayAction(x, y) {
    GlobalState.getInstance().updateGrid(x, y, "GRAY");
  }
  
} 