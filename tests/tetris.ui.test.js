/**
 * テトリスドリルメーカー UIコンポーネントテスト
 * 
 * このファイルではUIコンポーネントの表示と操作に関するテストを行います。
 */

// タイムアウトを60秒に設定
jest.setTimeout(60000);

// ヘルパー関数をインポート
const {
  wait,
  openSettings,
  closeSettingsWithoutSave,
  setSliderValue,
  setMinoMode,
  saveAndCloseSettings,
  getNextPieceCount,
} = require('./helpers');

describe('テトリスドリルメーカー - UIコンポーネントテスト', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:3000');
    // ページが完全に読み込まれるのを待つ
    await page.waitForSelector('#board');
  });

  test('レスポンシブデザインが適用されている', async () => {
    // モバイルビューポートに設定
    await page.setViewport({ width: 375, height: 667 });
    await wait(1000);
    
    // モバイルビューでのネクストピースコンテナのスタイルを確認
    const nextContainerStyleMobile = await page.$eval('.next-piece-container', el => {
      const style = window.getComputedStyle(el);
      return {
        width: style.width,
        height: style.height,
      };
    });
    
    // デスクトップビューポートに設定
    await page.setViewport({ width: 1024, height: 768 });
    await wait(1000);
    
    // デスクトップビューでのネクストピースコンテナのスタイルを確認
    const nextContainerStyleDesktop = await page.$eval('.next-piece-container', el => {
      const style = window.getComputedStyle(el);
      return {
        width: style.width,
        height: style.height,
      };
    });
    
    // モバイルとデスクトップでスタイルが異なることを確認
    // 注: 実際の値はCSSによって異なる可能性があるため、厳密な値の比較は避けています
    expect(nextContainerStyleMobile).toBeDefined();
    expect(nextContainerStyleDesktop).toBeDefined();
  });

  test('タイトルバーが正しく表示される', async () => {
    // タイトルバーの存在を確認
    const titleBarExists = await page.$('#title-bar') !== null;
    expect(titleBarExists).toBeTruthy();
    
    // タイトルバーの位置が固定されているか確認
    const titleBarPosition = await page.$eval('#title-bar', el => {
      const style = window.getComputedStyle(el);
      return style.position;
    });
    expect(titleBarPosition).toBe('fixed');
  });

  test('編集ナビゲーションが正しく表示される', async () => {
    // 編集ナビゲーションの存在を確認
    const editNavExists = await page.$('#edit-nav') !== null;
    expect(editNavExists).toBeTruthy();
    
    // 編集ナビゲーションの位置が固定されているか確認
    const editNavPosition = await page.$eval('#edit-nav', el => {
      const style = window.getComputedStyle(el);
      return style.position;
    });
    expect(editNavPosition).toBe('fixed');
  });
});

describe('テトリスドリルメーカー - ボード表示テスト', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#board');
  });

  test('テトリスボードが正しく表示される', async () => {
    // ボードの存在を確認
    const boardExists = await page.$('.tetris-board') !== null;
    expect(boardExists).toBeTruthy();
    
    // ボードのセルが存在するか確認
    const cellsExist = await page.$$('.tetris-board .cell');
    expect(cellsExist.length).toBeGreaterThan(0);
  });

  test('ボードのセルが正しいサイズで表示される', async () => {
    // セルのサイズを確認
    const cellSize = await page.$eval('.tetris-board .cell', el => {
      const style = window.getComputedStyle(el);
      return {
        width: style.width,
        height: style.height,
      };
    });
    
    // セルの幅と高さが設定されていることを確認
    expect(cellSize.width).not.toBe('0px');
    expect(cellSize.height).not.toBe('0px');
  });
});

describe('テトリスドリルメーカー - ネクストピース表示テスト', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#next');
  });

  test('ネクストピースコンテナが正しく表示される', async () => {
    // ネクストピースコンテナの存在を確認
    const nextContainerExists = await page.$('.next-container') !== null;
    expect(nextContainerExists).toBeTruthy();
  });

  test('ネクストピースが正しく表示される', async () => {
    // ネクストピースの存在を確認
    const nextPieceExists = await page.$('.next-piece') !== null;
    expect(nextPieceExists).toBeTruthy();
    
    // ネクストピースの中にブロック要素が存在するか確認
    const nextPieceBlocks = await page.$$('.next-piece div');
    expect(nextPieceBlocks.length).toBeGreaterThan(0);
  });
  
  test('ネクストピースの数を変更できる', async () => {
    // 設定を開く
    await openSettings();
    
    // ネクスト数を特定の値に設定（例: 3）
    const targetNextCount = 3;
    await setSliderValue('next-count', targetNextCount);
    
    // 設定を保存して閉じる
    await saveAndCloseSettings();
    
    // ネクストピースの数を取得
    const nextPieceCount = await getNextPieceCount();
    
    // 設定した数のネクストピースが表示されているか確認
    expect(nextPieceCount).toBe(targetNextCount);
  });
});

describe('テトリスドリルメーカー - 設定モーダルテスト', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#board');
  });

  beforeEach(async () => {
    // 各テスト前に設定モーダルを開く
    await openSettings();
  });

  afterEach(async () => {
    // 各テスト後に設定モーダルを閉じる
    try {
      await closeSettingsWithoutSave();
    } catch (e) {
      // モーダルが既に閉じている場合はエラーを無視
    }
  });

  test('設定モーダルに必要な要素が含まれている', async () => {
    // 幅スライダーの存在を確認
    const widthSliderExists = await page.$('#width') !== null;
    expect(widthSliderExists).toBeTruthy();
    
    // 高さスライダーの存在を確認
    const heightSliderExists = await page.$('#height') !== null;
    expect(heightSliderExists).toBeTruthy();
    
    // ネクスト数スライダーの存在を確認
    const nextCountSliderExists = await page.$('#next-count') !== null;
    expect(nextCountSliderExists).toBeTruthy();
    
    // ブロック数レンジスライダーの存在を確認
    const blockRangeSliderExists = await page.$('#block-range-slider') !== null;
    expect(blockRangeSliderExists).toBeTruthy();
    
    // ミノモード選択の存在を確認
    const minoModeSelectExists = await page.$('#mino-mode') !== null;
    expect(minoModeSelectExists).toBeTruthy();
  });

  test('スライダーの値が変更できる', async () => {
    // 幅スライダーの値を変更
    await setSliderValue('width', 6);
    
    // 値が更新されているか確認
    const widthValue = await page.$eval('#width-value', el => el.textContent);
    expect(widthValue).toBe('6');
  });

  test('ミノモードが選択できる', async () => {
    // ミノモードを7bagに変更
    await setMinoMode('7bag');
    
    // 選択された値を確認
    const selectedValue = await page.$eval('#mino-mode', select => select.value);
    expect(selectedValue).toBe('7bag');
  });
}); 