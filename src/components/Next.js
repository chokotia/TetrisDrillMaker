import { GlobalState } from '../store/GlobalState.js';
import { minoShapes } from '../utils/config.js';

/**
 * ネクストミノの表示を管理するクラス
 * ネクストミノのUI表示のみを担当
 */
export class Next {
  _globalState;
  _dom;

  constructor() {
    this._globalState = GlobalState.getInstance();

    // DOM要素の初期化
    this._dom = {
      nextContainer: document.getElementById('next'),
    };

    // ボードの状態変更を監視
    this._globalState.addBoardStateListener(this._onBoardStateChange.bind(this));

    // 設定変更を監視
    this._globalState.addSettingsListener(this._onSettingsChange.bind(this));

    // 初期表示を更新
    this._updateDisplay();
  }

  /**
   * ボードの状態が変更されたときのコールバック
   */
  _onBoardStateChange(state) {
    this._updateDisplay();
  }

  /**
   * 設定が変更されたときのコールバック
   */
  _onSettingsChange(settings) {
    // 表示件数が変更された場合は表示を更新
    this._updateDisplay();
  }

  /**
   * 表示の更新
   */
  _updateDisplay() {
    if (!this._dom.nextContainer) return;
    
    // ネクストコンテナをクリア
    this._dom.nextContainer.innerHTML = '';   
    const fragment = document.createDocumentFragment();
    
    // 設定から表示件数を取得
    const nextCount = this._globalState.getSettings().boardSettings.nextCount;

    // ネクストピースを取得
    const nextPieces = this._globalState.getBoardState().next;

    // 表示件数分のピースをレンダリング
    nextPieces.slice(0, nextCount).forEach(mino => {
      if (mino) {
        const container = this._createNextPieceContainer();
        this._drawMino(mino, container);
        fragment.appendChild(container);
      }
    });
    
    this._dom.nextContainer.appendChild(fragment);
  }

  /**
   * ネクストピースのコンテナ作成
   * @returns {HTMLElement} 作成されたコンテナ要素
   */
  _createNextPieceContainer() {
    const container = document.createElement('div');
    container.classList.add('next-piece-container');
    return container;
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