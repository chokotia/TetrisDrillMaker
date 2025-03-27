import { minoColors, minoShapes } from '../utils/config.js';

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