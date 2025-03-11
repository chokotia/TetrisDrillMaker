import { minoColors } from '../utils/config.js';
import { BoardManager } from './BoardManager.js';
import { MinoManager } from './MinoManager.js';

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
      currentEditAction: 'auto',
      autoCells: [],
      isAutoInProgress: false,
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
    
    if (action !== 'auto') {
      this.resetAutoCells(newState);
    }
    
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
   * @param {number} index - セルのインデックス
   * @param {number} width - ボードの幅
   * @param {number} height - ボードの高さ
   * @param {Object} state - 編集マネージャーの状態
   * @returns {Object} 更新された状態
   */
  static handleEditCellClick(cell, index, width, height, state) {
    if (cell.classList.contains('initial-block')) {
      return state;
    }

    const newState = { ...state };
    
    switch (newState.currentEditAction) {
      case 'delete':
        this.handleDeleteAction(cell);
        break;
      case 'gray':
        this.handleGrayAction(cell);
        break;
      case 'auto':
        return this.handleAutoAction(cell, index, width, height, newState);
      default:
        this.handleColorAction(cell, newState.currentEditAction, newState.isDragging);
        break;
    }
    
    return newState;
  }

  /**
   * 削除アクション
   * @param {HTMLElement} cell - セル要素
   */
  static handleDeleteAction(cell) {
    BoardManager.paintCell(cell, '');
  }

  /**
   * グレーブロックアクション
   * @param {HTMLElement} cell - セル要素
   */
  static handleGrayAction(cell) {
    BoardManager.paintCell(cell, minoColors['gray']);
  }

  /**
   * 通常のカラーブロックアクション
   * @param {HTMLElement} cell - セル要素
   * @param {string} action - 編集アクション
   * @param {boolean} isDragging - ドラッグ中かどうか
   */
  static handleColorAction(cell, action, isDragging) {
    const oldColor = cell.style.backgroundColor;
    const newColor = minoColors[action];
    if (!newColor) return;

    if (isDragging) {
      BoardManager.paintCell(cell, newColor);
    } else {
      if (BoardManager.isSameColor(oldColor, newColor)) {
        BoardManager.paintCell(cell, '');
      } else {
        BoardManager.paintCell(cell, newColor);
      }
    }
  }

  /**
   * 自動配置アクション
   * @param {HTMLElement} cell - セル要素
   * @param {number} index - セルのインデックス
   * @param {number} width - ボードの幅
   * @param {number} height - ボードの高さ
   * @param {Object} state - 編集マネージャーの状態
   * @returns {Object} 更新された状態
   */
  static handleAutoAction(cell, index, width, height, state) {
    const newState = { ...state };
    const oldColor = cell.style.backgroundColor;
    
    // 白ブロックの削除処理
    if (BoardManager.isWhiteBlock(oldColor)) {
      return this.removeWhiteBlock(cell, newState);
    }

    // 既存ブロックのチェック
    if (BoardManager.isExistingBlock(cell, oldColor)) {
      return newState;
    }

    // 新規ブロックの配置
    if (this.canAddNewBlock(newState)) {
      return this.addNewAutoBlock(cell, index, width, height, newState);
    }
    
    return newState;
  }

  /**
   * 白ブロックの削除
   * @param {HTMLElement} cell - セル要素
   * @param {Object} state - 編集マネージャーの状態
   * @returns {Object} 更新された状態
   */
  static removeWhiteBlock(cell, state) {
    const newState = { ...state };
    BoardManager.clearCell(cell);
    
    const cellIndex = newState.autoCells.findIndex(c => c.cellEl === cell);
    if (cellIndex !== -1) {
      newState.autoCells.splice(cellIndex, 1);
    }
    
    return newState;
  }

  /**
   * 新規ブロック追加可能かどうかの判定
   * @param {Object} state - 編集マネージャーの状態
   * @returns {boolean} 追加可能な場合はtrue
   */
  static canAddNewBlock(state) {
    return state.autoCells.length < 4;
  }

  /**
   * 新規自動ブロックの追加
   * @param {HTMLElement} cell - セル要素
   * @param {number} index - セルのインデックス
   * @param {number} width - ボードの幅
   * @param {number} height - ボードの高さ
   * @param {Object} state - 編集マネージャーの状態
   * @returns {Object} 更新された状態
   */
  static addNewAutoBlock(cell, index, width, height, state) {
    const newState = { ...state };
    BoardManager.paintCell(cell, minoColors['white']);
    
    const x = index % width;
    const y = Math.floor(index / width);
    newState.autoCells.push({ x, y, cellEl: cell });
    newState.isAutoInProgress = true;

    if (newState.autoCells.length === 4) {
      return this.completeAutoPlacement(newState);
    }
    
    return newState;
  }

  /**
   * 自動配置の完了処理
   * @param {Object} state - 編集マネージャーの状態
   * @returns {Object} 更新された状態
   */
  static completeAutoPlacement(state) {
    const newState = { ...state };
    const positions = newState.autoCells.map(c => ({ x: c.x, y: c.y }));
    const detectedMino = MinoManager.detectMinoShape(positions);
    
    if (detectedMino) {
      const color = minoColors[detectedMino];
      newState.autoCells.forEach(c => BoardManager.paintCell(c.cellEl, color));
    } else {
      this.resetAutoCells(newState);
    }
    
    newState.autoCells = [];
    newState.isAutoInProgress = false;
    return newState;
  }

  /**
   * 自動配置セルをリセット
   * @param {Object} state - 編集マネージャーの状態
   * @returns {Object} 更新された状態
   */
  static resetAutoCells(state) {
    const newState = { ...state };
    newState.autoCells.forEach(({ cellEl }) => {
      BoardManager.clearCell(cellEl);
    });
    
    newState.autoCells = [];
    newState.isAutoInProgress = false;
    return newState;
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