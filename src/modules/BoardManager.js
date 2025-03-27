import { config, minoColors } from '../utils/config.js';
import { GlobalState } from '../store/GlobalState.js';

// ミノとカラーの対応表
const MINO_COLORS = {
  // 通常のミノの色
  I: '#0F9BD7',
  J: '#2141C6',
  L: '#E35B02',
  O: '#E39F02',
  S: '#59B101',
  T: '#AF298A',
  Z: '#D70F37',
  
  // 特殊な状態の色
  G: '#CCCCCC', // gray お邪魔ブロック
  W: '#FFFFFF', // 編集途中の白いセル
};

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
  static createBoard(onCellClick) {
    this.updateDisplay(onCellClick);
  }

  /**
   * 表示の更新
   * @param {Function} onCellClick - セルクリック時のコールバック
   */
  static updateDisplay(onCellClick) {
    const boardElement = document.getElementById('board');
    
    // テスト用のダミーデータ
    const grid = Array(10).fill().map(() => Array(5).fill(null));
    grid[9] = ['I', 'J', 'L', 'O', 'S'];  // 最下段にミノを配置
    grid[8] = ['T', 'Z', null, 'G', null];  // その上にミノとお邪魔ブロックを配置
    grid[7] = ["W", 'G', 'I', null, 'J'];  // さらにその上にミノとお邪魔ブロックを配置
    
    // 既存のボードをクリア
    boardElement.innerHTML = '';
    
    // 新しいボードを描画
    this._drawBoard(boardElement, grid, onCellClick);
  }

  /**
   * ボードを描画
   * @private
   * @param {HTMLElement} boardElement - ボード要素
   * @param {Array} grid - グリッドデータ
   * @param {Function} onCellClick - セルクリック時のコールバック
   */
  static _drawBoard(boardElement, grid, onCellClick) {
    const width = grid[0].length;
    const height = grid.length;

    boardElement.style.setProperty('--width', width);
    boardElement.style.setProperty('--height', height);
    
    const fragment = document.createDocumentFragment();

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.style.width = `${config.CELL_SIZE}px`;
        cell.style.height = `${config.CELL_SIZE}px`;

        cell.addEventListener('click', () => {onCellClick(cell);});

        // グリッドの値に基づいて色を設定
        const cellValue = grid[y][x];
        if (cellValue) {
          cell.style.backgroundColor = MINO_COLORS[cellValue];
          cell.classList.add('block');
        }

        fragment.appendChild(cell);
      }
    }

    boardElement.appendChild(fragment);
  }

  /**
   * セルの色を設定
   * @param {HTMLElement} cellElement - セル要素
   * @param {string} color - 設定する色
   */
  static paintCell(cellElement, color) {
    cellElement.style.backgroundColor = color;
    if (color) {
      cellElement.classList.add('block');
    } else {
      cellElement.classList.remove('block');
    }
  }

  /**
   * セルをクリア
   * @param {HTMLElement} cellElement - セル要素
   */
  static clearCell(cellElement) {
    this.paintCell(cellElement, '');
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
    if (!boardElement || !aiBoard || !aiBoard.length) return;
    
    const cells = boardElement.querySelectorAll('.cell');
    
    // 盤面サイズが一致しない場合は処理しない
    if (aiBoard[0].length !== width) {
      console.error('AI盤面の幅がアプリの盤面と一致しません');
      return;
    }
    
    // 高さは最大20行だが、現在の表示領域に合わせる
    const effectiveHeight = Math.min(height, aiBoard.length);
    const y_diff = aiBoard.length - height
    
    // 各セルを更新
    for (let y = 0; y < effectiveHeight; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const cell = cells[index];
        const cellValue = aiBoard[y+y_diff][x];
        
        if (cellValue) {
          // ブロックを配置
          let color = minoColors[cellValue];
          if (!color && cellValue === 'G') {
            // お邪魔ブロックの場合
            this.paintCell(cell, minoColors.gray);
          }
          
          if (color) {
            this.paintCell(cell, color);
          }
        } else {
          // 空のセル
          this.clearCell(cell);
        }
      }
    }
  }

} 