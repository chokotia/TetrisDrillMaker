// アプリケーション設定
export const config = {
  // 表示設定
  CELL_SIZE: 27,  // セルのサイズ（ピクセル）
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

// デフォルト設定
export const defaultSettings = {
  width: config.BOARD.MIN_WIDTH,
  height: config.BOARD.MIN_HEIGHT,
  nextCount: config.NEXT.MIN_COUNT,
  blockCountMin: config.BLOCKS.MIN_COUNT,
  blockCountMax: config.BLOCKS.MAX_COUNT,
  minoMode: 'random',
};

// ネクストピースの最大数
export const TOTAL_NEXT_COUNT = 100; 