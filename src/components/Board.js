import { GlobalState } from '../store/GlobalState.js';
import { config, BLOCK_COLORS } from '../utils/config.js';

/**
 * ホールドミノの表示を管理するクラス
 * ホールドミノのUI表示と状態管理を担当
 */
export class Board {
  _globalState;
  _dom;
  _state;

  constructor(onCellClick) {
    
    this.onCellClick = onCellClick;
    
    this._globalState = GlobalState.getInstance();
    this._state = {};

    // DOM要素の初期化
    this._dom = {
        boardArea: document.getElementById('board'),
      };

    // ボードの状態変更を監視
    this._globalState.addBoardStateListener(() => this._updateDisplay());

    // 初期表示を更新
    this._setInitialBoard();
  }

  /**
   * ボードの初期化
   */
  _setInitialBoard() {

    const {width, height} = this._globalState.getSettings().boardSettings;
    
    let grid = Array(height).fill().map(() => Array(width).fill(null));
    grid[1][1] = 'I';
    grid[2][1] = 'J';

    this._globalState.updateGridAll(grid);
  }

  /**
   * 表示の更新
   */
  _updateDisplay() {
   
    const globalState = GlobalState.getInstance();
    const boardState = globalState.getBoardState();
    const { grid } = boardState;   
    
    this._drawBoard(grid);
  }

  /**
   * ボードを描画
   */
  _drawBoard(grid) {
    const width = grid[0].length;
    const height = grid.length;

    // 既存のボードをクリア
    this._dom.boardArea.innerHTML = '';

    this._dom.boardArea.style.setProperty('--width', width);
    this._dom.boardArea.style.setProperty('--height', height);
    
    const fragment = document.createDocumentFragment();

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.style.width = `${config.CELL_SIZE}px`;
        cell.style.height = `${config.CELL_SIZE}px`;

        cell.addEventListener('click', () => {this.onCellClick(cell, x, y);});

        // グリッドの値に基づいて色を設定
        const cellValue = grid[y][x];
        if (cellValue) {
          cell.style.backgroundColor = BLOCK_COLORS[cellValue];
          cell.classList.add('block');
        }

        fragment.appendChild(cell);
      }
    }

    this._dom.boardArea.appendChild(fragment);
  }
}