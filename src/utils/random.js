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
 * ベースシードを生成する
 * @returns {string} 生成されたシード文字列
 */
export function generateBaseSeed() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let seed = '';
  for (let i = 0; i < 4; i++) {
    seed += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return seed;
}

/**
 * シード付き乱数生成器を作成する
 * @param {string} base - ベースシード
 * @param {number} number - 問題番号
 * @returns {function} 乱数生成関数
 */
export function createSeededGenerator(base, number) {
  const seedString = `${base}_${number}`;
  let seed = 0;
  for (let i = 0; i < seedString.length; i++) {
    seed += seedString.charCodeAt(i);
  }
  return mulberry32(seed);
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