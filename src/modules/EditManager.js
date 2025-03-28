import { GlobalState } from '../store/GlobalState.js';
import { EDIT_MODE } from '../utils/tetrisDef.js';

/**
 * セルクリック時の編集処理
 */
export function handleEditCellClick(x, y) {
  const { selectedOption } = GlobalState.getInstance().getEditMode();
  switch (selectedOption) {
    case EDIT_MODE.DEL:
      _handleDeleteAction(x, y);
      break;
    case EDIT_MODE.GRAY:
      _handleGrayAction(x, y);
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
function _handleDeleteAction(x, y) {
  GlobalState.getInstance().updateGrid(x, y, null);
}

/**
 * グレーブロックアクション
 * @param {HTMLElement} cell - セル要素
 */
function _handleGrayAction(x, y) {
  GlobalState.getInstance().updateGrid(x, y, "GRAY");
} 