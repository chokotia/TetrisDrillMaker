import { GlobalState } from '../store/GlobalState.js';
import { BLOCK_COLORS, minoShapes } from '../utils/tetrisDef.js';

/**
 * ホールドミノの表示を管理するクラス
 * ホールドミノのUI表示と状態管理を担当
 */
export class Hold {
  _globalState;
  _dom;
  _state;

  constructor() {
    this._g = GlobalState.getInstance();
    this._state = {};

    // DOM要素の初期化
    this._dom = {
        holdArea: document.getElementById('hold'),
      };

    // ボードの状態変更を監視
    this._g.addBoardStateListener(() => this._updateDisplay());

    // 初期表示を更新
    this._updateDisplay();
  }

  /**
   * 表示の更新
   */
  _updateDisplay() {
    
    // ホールドエリアをクリア
    this._dom.holdArea.innerHTML = '';
    
    // ホールドミノを描画した要素を作成
    const holdType = this._g.getBoardState().hold;
    const minoElement = this._drawMino(holdType);
    
    // ホールドエリアに追加
    this._dom.holdArea.appendChild(minoElement);
    
  }

  /**
   * ミノを描画
   * @param {string} minoType - ミノタイプ
   * @returns {HTMLElement|null} ミノ要素
   */
  _drawMino(minoType) {

    // ミノ表示用のコンテナを作成（ネクストと同じスタイルを使用）
    const minoDisplayContainer = document.createElement('div');
    minoDisplayContainer.className = 'next-piece-container';

    const shape = minoShapes[minoType];
    if (!shape) return minoDisplayContainer;

    const minoElement = document.createElement('div');
    minoElement.classList.add('next-piece');
    minoElement.style.display = 'grid';
    minoElement.style.gridTemplateColumns = `repeat(${shape[0].length}, 1fr)`;

    shape.forEach(row => {
      row.forEach(cell => {
        if (cell) {
          const cellElement = document.createElement('div');
          cellElement.classList.add('block');
          cellElement.style.backgroundColor = BLOCK_COLORS[minoType];
          minoElement.appendChild(cellElement);
        } else {
          minoElement.appendChild(document.createElement('div'));
        }
      });
    });

    minoDisplayContainer.appendChild(minoElement);
    return minoDisplayContainer;
  } 
}