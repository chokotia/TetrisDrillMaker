import { minoColors, minoShapes } from '../utils/config.js';
import { GlobalState } from '../store/GlobalState.js';

/**
 * ミノを描画
 * @param {string} minoType - ミノタイプ
 * @param {HTMLElement} container - コンテナ要素
 */
export function drawMino(minoType, container) {
  const shape = minoShapes[minoType];
  if (!shape) return;

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

  container.appendChild(minoElement);
} 

export function renderVisibleNextPieces_new() {
  const globalState = GlobalState.getInstance();
  const boardState = globalState.getBoardState();
  const settings = globalState.getSettings();
  
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
      const container = document.createElement('div');
      container.classList.add('next-piece-container');
      drawMino(mino, container);
      
      fragment.appendChild(container);
    }
  });
  
  nextContainer.appendChild(fragment);
}