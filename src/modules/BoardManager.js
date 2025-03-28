import { config, BLOCK_TYPE, BLOCK_COLORS } from '../utils/config.js';
import { GlobalState } from '../store/GlobalState.js';



/**
 * ボード管理クラス
 * テトリスボードの作成と管理を担当
 */
export class BoardManager {
  /**
   * ボードを作成する
   * @param {Function} onCellClick - セルクリック時のコールバック
   * @returns {Object} 作成されたボード情報
   */
  // static createBoard(onCellClick) {
  //   this.onCellClick = onCellClick;
  //   this.updateDisplay();
  // }

  // /**
  //  * 表示の更新
  //  */
  // static updateDisplay() {
  //   const boardElement = document.getElementById('board');
    
  //   const globalState = GlobalState.getInstance();
  //   const boardState = globalState.getBoardState();
  //   // const { grid } = boardState; 
    
  //   // テスト用のダミーデータ
  //   const _grid = Array(10).fill().map(() => Array(5).fill(null));
  //   _grid[9] = ['I', 'J', 'T', 'O', 'S'];  // 最下段にミノを配置
  //   _grid[8] = ['T', 'Z', null, 'GRAY', null];  // その上にミノとお邪魔ブロックを配置
  //   _grid[7] = ["WHITE", 'GRAY', 'I', null, 'J'];  // さらにその上にミノとお邪魔ブロックを配置
    
  //   // 既存のボードをクリア
  //   boardElement.innerHTML = '';
    
  //   // 新しいボードを描画
  //   this._drawBoard(boardElement, _grid, this.onCellClick);
  // }

  // /**
  //  * ボードを描画
  //  * @private
  //  * @param {HTMLElement} boardElement - ボード要素
  //  * @param {Array} grid - グリッドデータ
  //  * @param {Function} onCellClick - セルクリック時のコールバック
  //  */
  // static _drawBoard(boardElement, grid, onCellClick) {
  //   const width = grid[0].length;
  //   const height = grid.length;

  //   boardElement.style.setProperty('--width', width);
  //   boardElement.style.setProperty('--height', height);
    
  //   const fragment = document.createDocumentFragment();

  //   for (let y = 0; y < height; y++) {
  //     for (let x = 0; x < width; x++) {
  //       const cell = document.createElement('div');
  //       cell.classList.add('cell');
  //       cell.style.width = `${config.CELL_SIZE}px`;
  //       cell.style.height = `${config.CELL_SIZE}px`;

  //       cell.addEventListener('click', () => {onCellClick(cell, x, y);});

  //       // グリッドの値に基づいて色を設定
  //       const cellValue = grid[y][x];
  //       if (cellValue) {
  //         cell.style.backgroundColor = BLOCK_COLORS[cellValue];
  //         cell.classList.add('block');
  //       }

  //       fragment.appendChild(cell);
  //     }
  //   }

  //   boardElement.appendChild(fragment);
  // }

  /**
   * セルの色を設定
   * @param {HTMLElement} cellElement - セル要素
   * @param {string} color - 設定する色
   */
  static paintCell(cellElement, x, y, blockType) {
    
    GlobalState.getInstance().updateGrid(x, y, blockType);
  }

  /**
   * セルをクリア
   * @param {HTMLElement} cellElement - セル要素
   */
  static clearCell(cellElement) {
    this.paintCell(cellElement, null);
  }

  /**
   * 初期状態以外のセルをリセット
   * @param {HTMLElement} boardElement - ボード要素
   */
  static resetToInitialBoard(boardElement) {
    if (!boardElement) return;
    
    const cells = Array.from(boardElement.children);
    cells.forEach(cell => {
      if (!cell.classList.contains('initial-block')) {
        cell.style.backgroundColor = '';
        cell.classList.remove('block');
      }
    });
  }

  
  /**
   * AIから返された盤面状態をボードに適用
   * @param {HTMLElement} boardElement - ボード要素
   * @param {Array} aiBoard - AIから返された盤面状態
   * @param {number} width - ボードの幅
   * @param {number} height - ボードの高さ
   */
  static applyAIBoard(boardElement, aiBoard, width, height) {

  }

} 