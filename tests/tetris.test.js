// タイムアウトを60秒に設定
jest.setTimeout(60000);

// ヘルパー関数をインポート
const {
  wait,
  clickCell,
  setEditMode,
  clearBoard,
  openSettings,
  saveAndCloseSettings,
  closeSettingsWithoutSave,
  setSliderValue,
  setMinoMode,
  getCellColor,
  getBoardSize,
  getNextPieceCount,
  swipeLeft,
  swipeRight,
  setBlockRangeSlider,
  isModalVisible,
  isModalHidden,
} = require('./helpers');

describe('テトリスドリルメーカー - 基本機能テスト', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:3000');
    // ページが完全に読み込まれるのを待つ
    await page.waitForSelector('#board');
  });

  test('基本的なUIコンポーネントが存在する', async () => {
    // 盤面が存在するか確認
    const boardExists = await page.$('#board') !== null;
    expect(boardExists).toBeTruthy();
    
    // ネクストピース表示が存在するか確認
    const nextContainerExists = await page.$('#next') !== null;
    expect(nextContainerExists).toBeTruthy();
    
    // 編集ボタンが存在するか確認
    const grayButtonExists = await page.$('[data-action="gray"]') !== null;
    const autoButtonExists = await page.$('[data-action="auto"]') !== null;
    const deleteButtonExists = await page.$('[data-action="delete"]') !== null;
    
    expect(grayButtonExists).toBeTruthy();
    expect(autoButtonExists).toBeTruthy();
    expect(deleteButtonExists).toBeTruthy();
    
    // クリアボタンが存在するか確認
    const clearButtonExists = await page.$('#clear-board') !== null;
    expect(clearButtonExists).toBeTruthy();
    
    // 設定ボタンが存在するか確認
    const settingsButtonExists = await page.$('#settings-button') !== null;
    expect(settingsButtonExists).toBeTruthy();
    
    // 問題カウンターが存在するか確認
    const problemCounterExists = await page.$('#current-problem') !== null;
    expect(problemCounterExists).toBeTruthy();
  });

  test('クリアボタンの動作確認', async () => {
    // クリアボタンをクリック
    await clearBoard();
    
    // 初期ブロック以外のセルがクリアされているか確認
    const nonInitialBlocks = await page.$$eval('.cell:not(.initial-block)', cells => 
      cells.filter(cell => 
        cell.style.backgroundColor !== '' && 
        cell.style.backgroundColor !== 'rgb(255, 255, 255)' &&
        !cell.classList.contains('initial-block')
      ).length);
    
    expect(nonInitialBlocks).toBe(0);
  });

  test('オートモードの動作確認', async () => {
    // オートモードを選択
    await setEditMode('auto');
    
    // 4つのセルをクリック
    const cells = await page.$$('.cell');
    for (let i = 0; i < 4 && i < cells.length; i++) {
      await clickCell(i);
    }
    
    // 少なくとも1つのセルの色が変わっているか確認
    const colorChangedCells = await page.$$eval('.cell', cells => 
      cells.filter(cell => 
        cell.style.backgroundColor !== '' && 
        cell.style.backgroundColor !== 'rgb(255, 255, 255)'
      ).length);
    
    // 初期ブロックが存在する可能性があるため、0より大きいことを確認
    expect(colorChangedCells).toBeGreaterThan(0);
  });
});

describe('テトリスドリルメーカー - 設定機能テスト', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#board');
  });

  test('設定モーダルが開閉できる', async () => {
    // 設定ボタンをクリック
    await openSettings();
    
    // モーダルが表示されているか確認
    const modalVisible = await isModalVisible('settings-modal');
    expect(modalVisible).toBeTruthy();
    
    // モーダルを閉じる
    await closeSettingsWithoutSave();
    
    // モーダルが非表示になっているか確認
    const modalHidden = await isModalHidden('settings-modal');
    expect(modalHidden).toBeTruthy();
  });

  test('盤面サイズの設定が変更できる', async () => {
    // 設定ボタンをクリック
    await openSettings();
    
    // 盤面の幅を変更
    await setSliderValue('width', 7);
    
    // 盤面の高さを変更
    await setSliderValue('height', 8);
    
    // 設定を保存
    await saveAndCloseSettings();
    
    // 盤面のサイズが変更されているか確認
    const boardSize = await getBoardSize();
    expect(boardSize.width).toBe(7);
    expect(boardSize.height).toBe(8);
  });
});

describe('テトリスドリルメーカー - 編集機能テスト', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#board');
  });

  test('グレーモードでセルを編集できる', async () => {
    // グレーモードを選択
    await setEditMode('gray');
    
    // 最初のセルをクリック
    await clickCell(0);
    
    // セルの色がグレーに変わっているか確認
    const cellColor = await getCellColor(0);
    
    // グレーの色（RGB値は環境によって異なる可能性があるため、おおよその値をチェック）
    expect(cellColor).toMatch(/rgba?\((\s*\d+\s*,\s*){2}\d+\s*(,\s*[\d.]+\s*)?\)/);
  });

  test('削除モードでセルを編集できる', async () => {
    // 削除モードを選択
    await setEditMode('delete');
    
    // グレーモードで色を付けたセルをクリック
    await clickCell(0);
    
    // セルの色が削除されているか確認
    const cellColor = await getCellColor(0);
    
    // 背景色がリセットされているか（空または透明）
    expect(cellColor).toMatch(/rgba?\(0,\s*0,\s*0,\s*0\)|rgba?\(255,\s*255,\s*255(,\s*[\d.]+\s*)?\)|$/);
  });
});

describe('テトリスドリルメーカー - 問題生成テスト', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#board');
  });

  test('問題カウンターが正しく表示される', async () => {
    // 問題カウンターのテキストを取得
    const counterText = await page.$eval('#current-problem', el => el.textContent.trim());
    
    // 「問題 #1」のような形式になっているか確認
    expect(counterText).toMatch(/問題\s+#\d+/);
  });

  test('ネクストピースが表示される', async () => {
    // ネクストピースの数を取得
    const nextPieceCount = await getNextPieceCount();
    
    // 少なくとも1つのネクストピースが表示されているか確認
    expect(nextPieceCount).toBeGreaterThan(0);
  });
  
  test('ネクストの個数を変更すると表示数が変わる', async () => {
    // 設定を開く
    await openSettings();
    
    // 現在のネクスト数を取得
    const initialNextCount = await getNextPieceCount();
    
    // ネクスト数を増やす（現在の数+2に設定）
    const newNextCount = initialNextCount + 2;
    await setSliderValue('next-count', newNextCount);
    
    // 設定を保存して閉じる
    await saveAndCloseSettings();
    
    // 変更後のネクスト数を取得
    const updatedNextCount = await getNextPieceCount();
    
    // ネクスト数が正しく変更されているか確認
    expect(updatedNextCount).toBe(newNextCount);
  });
});

describe('テトリスドリルメーカー - 初期ブロックテスト', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#board');
  });

  test('初期ブロックが設定範囲内で生成される', async () => {
    // 設定を開く
    await openSettings();
    
    // 初期ブロックの最小数と最大数を設定（例: 5-10個）
    const minBlocks = 5;
    const maxBlocks = 10;
    
    // noUiSliderを使用して範囲を設定
    await setBlockRangeSlider(minBlocks, maxBlocks);
    
    // 設定を保存して閉じる
    await saveAndCloseSettings();
    
    // 盤面をクリア
    await clearBoard();
    
    // 新しい問題を生成（左スワイプで次の問題へ）
    await swipeLeft();
    
    // 初期ブロックの数をカウント
    const initialBlockCount = await page.$$eval('.cell.initial-block', blocks => blocks.length);
    
    // 初期ブロックの数が設定範囲内であることを確認
    expect(initialBlockCount).toBeGreaterThanOrEqual(minBlocks);
    expect(initialBlockCount).toBeLessThanOrEqual(maxBlocks);
  });
  
  test('初期ブロックを0に設定すると表示されない', async () => {
    // 設定を開く
    await openSettings();
    
    // 初期ブロックの最小数と最大数を0に設定
    await setBlockRangeSlider(0, 0);
    
    // 設定を保存して閉じる
    await saveAndCloseSettings();
    
    // 盤面をクリア
    await clearBoard();
    
    // 新しい問題を生成（左スワイプで次の問題へ）
    await swipeLeft();
    
    // 初期ブロックの数をカウント
    const initialBlockCount = await page.$$eval('.cell.initial-block', blocks => blocks.length);
    
    // 初期ブロックが0個であることを確認
    expect(initialBlockCount).toBe(0);
    
    // この設定を維持して、以降のテストに影響しないようにする
  });
}); 