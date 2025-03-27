import { config, minoColors } from '../utils/config.js';
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
  static createBoard(onCellClick) {
    const boardElement = document.getElementById('board');

    const settings = GlobalState.getInstance().getSettings();
    const { width, height  } = settings.boardSettings;


    boardElement.style.setProperty('--width', width);
    boardElement.style.setProperty('--height', height);
    boardElement.innerHTML = '';
    
    const fragment = document.createDocumentFragment();
    const totalCells = width * height;

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.style.width = `${config.CELL_SIZE}px`;
      cell.style.height = `${config.CELL_SIZE}px`;

      if (onCellClick) {
        cell.addEventListener('click', () => {
          onCellClick(cell, i, width, height);
        });
      }

      fragment.appendChild(cell);
    }

    boardElement.appendChild(fragment);
    

    return;
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