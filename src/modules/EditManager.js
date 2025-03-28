import { GlobalState } from '../store/GlobalState.js';
import { EDIT_MODE } from '../utils/config.js';

/**
 * 編集モード管理クラス
 * ボード編集機能を担当
 */
export class EditManager {

  /**
   * セルクリック時の編集処理
   * @param {HTMLElement} cell - クリックされたセル要素
   * @param {Object} state - 編集マネージャーの状態
   * @returns {Object} 更新された状態
   */
  static handleEditCellClick(cell, x, y) {

    const { selectedOption } = GlobalState.getInstance().getEditMode();
    switch (selectedOption) {
      case EDIT_MODE.DEL:
        this.handleDeleteAction(cell, x, y);
        break;
      case EDIT_MODE.GRAY:
        this.handleGrayAction(cell, x, y);
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
  static handleDeleteAction(cell, x, y) {
    GlobalState.getInstance().updateGrid(x, y, null);
  }

  /**
   * グレーブロックアクション
   * @param {HTMLElement} cell - セル要素
   */
  static handleGrayAction(cell, x, y) {
    GlobalState.getInstance().updateGrid(x, y, "GRAY");
  }
  
  /**
   * パン開始時の処理
   * @param {Object} state - 編集マネージャーの状態
   * @returns {Object} 更新された状態
   */
  static handlePanStart(state) {
    if (!state.currentEditAction) return state;
    
    const newState = { ...state };
    newState.isDragging = false;
    return newState;
  }

  /**
   * パン移動時の処理
   * @param {Object} state - 編集マネージャーの状態
   * @returns {Object} 更新された状態
   */
  static handlePanMove(state) {
    if (!state.currentEditAction) return state;
    
    const newState = { ...state };
    newState.isDragging = true;
    return newState;
  }

  /**
   * パン終了時の処理
   * @param {Object} state - 編集マネージャーの状態
   * @returns {Object} 更新された状態
   */
  static handlePanEnd(state) {
    const newState = { ...state };
    newState.isDragging = false;
    return newState;
  }
} 