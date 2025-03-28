// ミノの種類
export const MINO_TYPES = ["I", "O", "T", "S", "Z", "J", "L"];

// ブロックの種類
export const BLOCK_TYPE = [...MINO_TYPES, "GRAY", "WHITE", null];

// ミノとカラーの対応表
export const minoColors = {
  // 通常のミノの色
  I: '#0F9BD7',
  J: '#2141C6',
  L: '#E35B02',
  O: '#E39F02',
  S: '#59B101',
  T: '#AF298A',
  Z: '#D70F37',
  
  // 特殊な状態の色
  gray: '#CCCCCC',
  white: '#FFFFFF',
  default: '#B0C4DE',
};

// 編集モードのオプション
export const EDIT_MODE = {
  // AUTO: 'Auto', 将来的に追加予定
  DEL: 'Del',
  GRAY: 'Gray'
};

// ミノとカラーの対応表
export const BLOCK_COLORS = {
  // 通常のミノの色
  I: '#0F9BD7',
  J: '#2141C6',
  L: '#E35B02',
  O: '#E39F02',
  S: '#59B101',
  T: '#AF298A',
  Z: '#D70F37',
  
  // 特殊な状態の色
  GRAY: '#CCCCCC', // gray お邪魔ブロック
  WHITE: '#FFFFFF', // 編集途中の白いセル
};


// ミノの形状データ（ネクスト表示用）
export const minoShapes = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
};

// ミノ生成モード
export const NEXT_QUEUE_GEN_MODE = {
  RANDOM: 'random',
  SEVEN_BAG_RANDOM: '7bag-random',
  SEVEN_BAG_PURE: '7bag-pure'
};
