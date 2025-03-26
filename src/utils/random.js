/**
 * シード付き乱数生成器 (Mulberry32)
 * @param {number} a - シード値
 * @returns {function} 乱数生成関数
 */
export function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * シード付きの乱数生成器を作成
 * @param {string} seed - シード文字列
 * @returns {Function} 乱数生成関数
 */
export function createSeededGenerator(seed) {
  let seedValue = 0;
  for (let i = 0; i < seed.length; i++) {
    seedValue += seed.charCodeAt(i);
  }
  return mulberry32(seedValue);
}

/**
 * Fisher–Yates シャッフル (シード付き乱数を利用)
 * @param {Array} array - シャッフルする配列
 * @param {function} random - 乱数生成関数
 * @returns {Array} シャッフルされた配列
 */
export function shuffle(array, random) {
  const result = [...array]; // 元の配列を変更しないようにコピー
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * シード値を生成
 * @param {number} [length=13] - 生成するシード値の長さ
 * @returns {string} 生成されたシード値
 */
export function generateSeed(length = 13) {
  return Math.random().toString(36).substring(2, 2 + length);
} 