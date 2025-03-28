import { GlobalState } from '../store/GlobalState.js';
import { minoColors, minoShapes } from '../utils/tetrisDef.js';

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

    // ボードの状態変更と設定変更を監視
    this._globalState.addBoardStateListener(() => this._renderVisibleNextPieces());
    this._globalState.addSettingsListener(() => this._renderVisibleNextPieces());

    // 初期表示を更新
    this._renderVisibleNextPieces();
  }


  _renderVisibleNextPieces() {
    const boardState = this._globalState.getBoardState();
    const settings = this._globalState.getSettings();
    
    let currentPieces = boardState.next;
    let visibleCount = settings.boardSettings.nextCount;
    let nextContainer = document.getElementById('next');

    // NEXTコンテナをクリア
    nextContainer.innerHTML = '';
    
    // 表示範囲のピースを取得
    const endIndex = Math.min(visibleCount, currentPieces.length);
    const visiblePieces = currentPieces.slice(0, endIndex);
    
    const fragment = document.createDocumentFragment();
    
    // 各ピースをレンダリング
    visiblePieces.forEach((mino, index) => {
      if (mino) {
        const container = this._drawMino(mino);
        fragment.appendChild(container);
      }
    });
    
    nextContainer.appendChild(fragment);
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
          cellElement.style.backgroundColor = minoColors[minoType];
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