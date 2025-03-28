import { shuffle } from './random.js';
import { TOTAL_NEXT_COUNT }  from './config.js';
import { MINO_TYPES, NEXT_QUEUE_GEN_MODE } from './tetrisDef.js';

/**
 * NEXTピースを生成
 * @param {Function} randomGenerator - 乱数生成関数
 * @param {string} minoMode - ミノ生成モード
 * @param {number} [count=TOTAL_NEXT_COUNT] - 生成するピース数（省略時はTOTAL_NEXT_COUNT）
 * @returns {Array} 生成されたピース配列
 */
export function generateNextPieces(randomGenerator, minoMode, count = TOTAL_NEXT_COUNT) {
  switch (minoMode) {
    case NEXT_QUEUE_GEN_MODE.SEVEN_BAG_RANDOM:
      return _generate7BagPieces(count, randomGenerator, true);
    case NEXT_QUEUE_GEN_MODE.SEVEN_BAG_PURE:
      return _generate7BagPieces(count, randomGenerator, false);
    default:
      return _generateRandomPieces(count, randomGenerator);
  }
} 

/**
 * 7-bagシステムによるピース生成
 * @param {number} count - 生成するピース数
 * @param {Function} randomGenerator - 乱数生成関数
 * @param {boolean} useRandomOffset - ランダムなオフセットを使用するかどうか
 * @returns {Array} 生成されたピース配列
 */
function _generate7BagPieces(count, randomGenerator, useRandomOffset) {
  const pieces = [];
  
  if (useRandomOffset) {
    // ランダムなオフセットを計算（0-6の範囲）
    const offset = Math.floor(randomGenerator() * 7);
    // シャッフルされたバッグを生成し、オフセットを適用
    let bag = shuffle([...MINO_TYPES], randomGenerator).slice(offset);
    pieces.push(...bag);
  }

  // 必要な数になるまで新しいバッグを追加
  while (pieces.length < count) {
    pieces.push(...shuffle([...MINO_TYPES], randomGenerator));
  }

  return pieces.slice(0, count);
}

/**
 * ランダム生成によるピース生成
 * @param {number} count - 生成するピース数
 * @param {Function} randomGenerator - 乱数生成関数
 * @returns {Array} 生成されたピース配列
 */
function _generateRandomPieces(count, randomGenerator) {
  return Array.from({ length: count }, () => {
    const randomIndex = Math.floor(randomGenerator() * MINO_TYPES.length);
    return MINO_TYPES[randomIndex];
  });
}
