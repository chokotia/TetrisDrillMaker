import { config, minoColors } from '../utils/config.js';

/**
 * ボード管理クラス
 * テトリスボードの作成と管理を担当
 */
export class BoardManager {
  /**
   * ボードを作成する
   * @param {HTMLElement} boardElement - ボード要素
   * @param {number} width - ボードの幅
   * @param {number} height - ボードの高さ
   * @param {number} blockCount - 初期ブロック数
   * @param {Function} randomGenerator - 乱数生成関数
   * @param {Function} onCellClick - セルクリック時のコールバック
   * @returns {Object} 作成されたボード情報
   */
  static createBoard(boardElement, width, height, blockCount = 0, randomGenerator, onCellClick) {
    if (!boardElement) return null;

    this.setupBoardStyles(boardElement, width, height);
    this.createBoardCells(boardElement, width, height, onCellClick);
    
    if (blockCount > 0) {
      this.placeInitialBlocks(boardElement, width, height, blockCount, randomGenerator);
    }

    return { width, height };
  }

  /**
   * ボードのスタイル設定
   * @param {HTMLElement} boardElement - ボード要素
   * @param {number} width - ボードの幅
   * @param {number} height - ボードの高さ
   */
  static setupBoardStyles(boardElement, width, height) {
    boardElement.style.setProperty('--width', width);
    boardElement.style.setProperty('--height', height);
    boardElement.innerHTML = '';
  }

  /**
   * ボードのセルを作成
   * @param {HTMLElement} boardElement - ボード要素
   * @param {number} width - ボードの幅
   * @param {number} height - ボードの高さ
   * @param {Function} onCellClick - セルクリック時のコールバック
   */
  static createBoardCells(boardElement, width, height, onCellClick) {
    const fragment = document.createDocumentFragment();
    const totalCells = width * height;

    for (let i = 0; i < totalCells; i++) {
      const cell = this.createBoardCell(i, width, height, onCellClick);
      fragment.appendChild(cell);
    }

    boardElement.appendChild(fragment);
  }

  /**
   * 個別のセルを作成
   * @param {number} index - セルのインデックス
   * @param {number} width - ボードの幅
   * @param {number} height - ボードの高さ
   * @param {Function} onCellClick - セルクリック時のコールバック
   * @returns {HTMLElement} 作成されたセル要素
   */
  static createBoardCell(index, width, height, onCellClick) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.style.width = `${config.CELL_SIZE}px`;
    cell.style.height = `${config.CELL_SIZE}px`;

    if (onCellClick) {
      cell.addEventListener('click', () => {
        onCellClick(cell, index, width, height);
      });
    }

    return cell;
  }

  /**
   * 初期ブロックを配置
   * @param {HTMLElement} boardElement - ボード要素
   * @param {number} width - ボードの幅
   * @param {number} height - ボードの高さ
   * @param {number} blockCount - 配置するブロック数
   * @param {Function} randomGenerator - 乱数生成関数
   */
  static placeInitialBlocks(boardElement, width, height, blockCount, randomGenerator) {
    if (blockCount <= 0) return;

    const cells = Array.from(boardElement.children);
    const columnIndices = Array.from({ length: width }, (_, i) => i);
    const placedBlocks = new Set();

    for (let i = 0; i < blockCount; i++) {
      this.placeBlockInColumn(columnIndices, cells, width, height, placedBlocks, i, randomGenerator);
    }
  }

  /**
   * 列にブロックを配置
   * @param {Array} columnIndices - 列インデックスの配列
   * @param {Array} cells - セル要素の配列
   * @param {number} width - ボードの幅
   * @param {number} height - ボードの高さ
   * @param {Set} placedBlocks - 配置済みブロックの集合
   * @param {number} blockIndex - ブロックのインデックス
   * @param {Function} randomGenerator - 乱数生成関数
   */
  static placeBlockInColumn(columnIndices, cells, width, height, placedBlocks, blockIndex, randomGenerator) {
    let column;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      column = this.getRandomColumn(columnIndices, randomGenerator);
      attempts++;
      if (attempts > maxAttempts) break;
    } while (placedBlocks.has(`${column}-${blockIndex}`));

    this.placeBlockInFirstEmptyCell(column, cells, width, height, placedBlocks, blockIndex);
  }

  /**
   * ランダムな列を取得
   * @param {Array} columnIndices - 列インデックスの配列
   * @param {Function} randomGenerator - 乱数生成関数
   * @returns {number} ランダムな列インデックス
   */
  static getRandomColumn(columnIndices, randomGenerator) {
    return columnIndices[Math.floor(randomGenerator() * columnIndices.length)];
  }

  /**
   * 列の最初の空きセルにブロックを配置
   * @param {number} column - 列インデックス
   * @param {Array} cells - セル要素の配列
   * @param {number} width - ボードの幅
   * @param {number} height - ボードの高さ
   * @param {Set} placedBlocks - 配置済みブロックの集合
   * @param {number} blockIndex - ブロックのインデックス
   */
  static placeBlockInFirstEmptyCell(column, cells, width, height, placedBlocks, blockIndex) {
    for (let row = height - 1; row >= 0; row--) {
      const index = row * width + column;
      if (!cells[index].classList.contains('block')) {
        this.createInitialBlock(cells[index]);
        placedBlocks.add(`${column}-${blockIndex}`);
        break;
      }
    }
  }

  /**
   * 初期ブロックを作成
   * @param {HTMLElement} cell - セル要素
   */
  static createInitialBlock(cell) {
    cell.classList.add('block', 'initial-block');
    cell.style.backgroundColor = minoColors['default'];
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
   * 2つの色が同じかどうか比較
   * @param {string} colorA - 色A
   * @param {string} colorB - 色B
   * @returns {boolean} 同じ色の場合はtrue
   */
  static isSameColor(colorA, colorB) {
    if (!colorA || !colorB) return false;
    return colorA.toLowerCase() === colorB.toLowerCase();
  }

  /**
   * 白ブロックかどうかの判定
   * @param {string} color - 色
   * @returns {boolean} 白ブロックの場合はtrue
   */
  static isWhiteBlock(color) {
    return color && color.toLowerCase() === minoColors.white.toLowerCase();
  }

  /**
   * 既存ブロックのチェック
   * @param {HTMLElement} cell - セル要素
   * @param {string} color - 色
   * @returns {boolean} 既存ブロックの場合はtrue
   */
  static isExistingBlock(cell, color) {
    return cell.classList.contains('block') && color !== '';
  }
} 