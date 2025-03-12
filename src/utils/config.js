// アプリケーション設定
export const config = {
  // 表示設定
  CELL_SIZE: 30,  // セルのサイズ（ピクセル）
  VERSION: '0.3.0',  // アプリケーションバージョン

  // ボードサイズの制限
  BOARD: {
    MIN_WIDTH: 3,
    MAX_WIDTH: 10,
    MIN_HEIGHT: 6,
    MAX_HEIGHT: 20,
  },

  // NEXTの表示数制限
  NEXT: {
    MIN_COUNT: 2,
    MAX_COUNT: 10,
  },

  // 初期配置ブロック数の制限
  BLOCKS: {
    MIN_COUNT: 0,
    MAX_COUNT: 30,
  },
};

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

// ミノの形状パターン定義
export const MINO_PATTERNS = {
  I: [
    // 横向き
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ],
    // 縦向き
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
    ],
  ],
  O: [
    // 正方形（回転なし）
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  ],
  T: [
    // 上向き
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
    ],
    // 右向き
    [
      { x: 0, y: 1 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
    // 下向き
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    // 左向き
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 1 },
    ],
  ],
  S: [
    // 横向き
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    // 縦向き
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  ],
  Z: [
    // 横向き
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    // 縦向き
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
    ],
  ],
  J: [
    // 上向き
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
    ],
    // 右向き
    [
      { x: 0, y: 2 },
      { x: 0, y: 1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ],
    // 下向き
    [
      { x: 2, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: 0, y: 0 },
    ],
    // 左向き
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
    ],
  ],
  L: [
    // 上向き
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
    // 右向き
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 0 },
    ],
    // 下向き
    [
      { x: 1, y: 2 },
      { x: 1, y: 1 },
      { x: 1, y: 0 },
      { x: 0, y: 0 },
    ],
    // 左向き
    [
      { x: 2, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    ],
  ],
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

// デフォルト設定
export const defaultSettings = {
  width: config.BOARD.MIN_WIDTH,
  height: config.BOARD.MIN_HEIGHT,
  nextCount: config.NEXT.MIN_COUNT,
  blockCountMin: config.BLOCKS.MIN_COUNT,
  blockCountMax: config.BLOCKS.MAX_COUNT,
  minoMode: 'random',
}; 