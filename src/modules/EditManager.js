import { minoColors } from '../utils/config.js';
import { BoardManager } from './BoardManager.js';
import { GlobalState } from '../store/GlobalState.js';

/**
 * 編集モード管理クラス
 * ボード編集機能を担当
 */
export class EditManager {
  /**
   * 編集マネージャーを初期化
   * @returns {Object} 編集マネージャーの状態
   */
  static initialize() {
    return {
      currentEditAction: 'gray', // 編集モードの初期値 gray/delete
      isDragging: false
    };
  }

  /**
   * 編集アクションを設定
   * @param {Object} state - 編集マネージャーの状態
   * @param {string} action - 設定するアクション
   * @returns {Object} 更新された状態
   */
  static setEditAction(state, action) {
    const newState = { ...state };
        
    newState.currentEditAction = action;
    return newState;
  }

  /**
   * 編集ボタンの状態を更新
   * @param {NodeList} buttons - 編集ボタン要素のリスト
   * @param {string} selectedAction - 選択されたアクション
   */
  static updateEditButtonState(buttons, selectedAction) {
    buttons.forEach(btn => {
      if (btn.dataset.action === selectedAction) {
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('selected');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  }

  /**
   * セルクリック時の編集処理
   * @param {HTMLElement} cell - クリックされたセル要素
   * @param {Object} state - 編集マネージャーの状態
   * @returns {Object} 更新された状態
   */
  static handleEditCellClick(cell, x, y, state) {
    if (cell.classList.contains('initial-block')) {
      return state;
    }

    const newState = { ...state };
    
    switch (newState.currentEditAction) {
      case 'delete':
        this.handleDeleteAction(cell, x, y);
        break;
      case 'gray':
        this.handleGrayAction(cell, x, y);
        break;
      default:
        // pass
        break;
    }
    
    return newState;
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