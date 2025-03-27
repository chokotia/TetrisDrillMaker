import { GlobalState } from '../store/GlobalState.js';
import { minoShapes } from '../utils/config.js';
import { drawMino } from '../modules/MinoDrawer.js';

/**
 * ホールドミノの表示を管理するクラス
 * ホールドミノのUI表示と状態管理を担当
 */
export class Hold {
  _globalState;
  _dom;
  _state;

  constructor() {
    this._globalState = GlobalState.getInstance();
    this._state = {};

    // DOM要素の初期化
    this._dom = {
        holdContainer: document.getElementById('hold'),
      };

    // ボードの状態変更を監視
    this._globalState.addBoardStateListener(this._onBoardStateChange.bind(this));

    // 初期表示を更新
    this._updateDisplay();
  }

  /**
   * ホールドミノを更新
   * @param {string|null} holdType - ホールドするミノのタイプ
   */
  updateHold(holdType) {
    const currentState = this._globalState.getBoardState();
    this._globalState.updateBoardState({
      ...currentState,
      hold: holdType
    });
  }

  /**
   * ボードの状態が変更されたときのコールバック
   */
  _onBoardStateChange(state) {
    this._updateDisplay();
  }

  /**
   * 表示の更新
   */
  _updateDisplay() {
    if (!this._dom.holdContainer) return;
    
    // ホールドコンテナをクリア
    this._dom.holdContainer.innerHTML = '';
    
    // ホールド用のコンテナを作成（ネクストと同じスタイルを使用）
    const holdPieceContainer = document.createElement('div');
    holdPieceContainer.className = 'next-piece-container';
    
    // ホールドミノを描画
    // const holdType = this._globalState.getBoardState().hold;
    const holdType = "J";
    
    //this._drawMino(holdType, holdPieceContainer);
    drawMino(holdType, holdPieceContainer);

    
    // ホールドコンテナに追加
    this._dom.holdContainer.appendChild(holdPieceContainer);
  }

  /**
   * ミノを描画
   * @param {string} minoType - ミノタイプ
   * @param {HTMLElement} container - コンテナ要素
   */
  _drawMino(minoType, container) {
    const shape = minoShapes[minoType];
    if (!shape) return;

    const minoElement = this._createMinoElement(shape);
    this._fillMinoShape(minoElement, shape, minoType);
    container.appendChild(minoElement);
  }

  /**
   * ミノの要素を作成
   * @param {Array} shape - ミノの形状
   * @returns {HTMLElement} 作成されたミノ要素
   */
  _createMinoElement(shape) {
    const minoElement = document.createElement('div');
    minoElement.classList.add('mino');
    
    // ミノのグリッドを作成
    shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const cellElement = document.createElement('div');
          cellElement.classList.add('cell');
          cellElement.style.gridColumn = x + 1;
          cellElement.style.gridRow = y + 1;
          minoElement.appendChild(cellElement);
        }
      });
    });
    
    return minoElement;
  }

  /**
   * ミノの形状を塗りつぶす
   * @param {HTMLElement} minoElement - ミノ要素
   * @param {Array} shape - ミノの形状
   * @param {string} minoType - ミノタイプ
   */
  _fillMinoShape(minoElement, shape, minoType) {
    const cells = minoElement.querySelectorAll('.cell');
    cells.forEach(cell => {
      cell.style.backgroundColor = `var(--${minoType.toLowerCase()}-color)`;
    });
  }
}