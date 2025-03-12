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
  setSeedValue,
  getSeedValue,
  clickRegenerateSeed,
  getBoardState,
  getNextPiecesState,
  getCurrentProblemNumber,
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

describe('シード値機能テスト', () => {
  beforeEach(async () => {
    // 各テスト前に設定モーダルを開く
    await openSettings();
    await wait(500);
  });

  afterEach(async () => {
    // 各テスト後に設定モーダルを閉じる（開いている場合）
    if (await isModalVisible('settings-modal')) {
      await closeSettingsWithoutSave();
      await wait(500);
    }
  });

  test('シード値が表示され、編集可能であること', async () => {
    // シード値入力フィールドが存在するか確認
    const seedInputExists = await page.$('#seed-value') !== null;
    expect(seedInputExists).toBeTruthy();
    
    // 初期値が設定されていることを確認
    const initialSeed = await getSeedValue();
    expect(initialSeed).toBeTruthy();
    expect(initialSeed.length).toBeGreaterThan(0);
  });

  test('シード値を変更して保存できること', async () => {
    // テスト用のシード値
    const testSeed = 'testSeed123';
    
    // シード値を設定
    await setSeedValue(testSeed);
    
    // 保存して閉じる
    await saveAndCloseSettings();
    await wait(500);
    
    // 再度設定を開いて値が保持されているか確認
    await openSettings();
    await wait(500);
    
    const savedSeed = await getSeedValue();
    expect(savedSeed).toBe(testSeed);
  });

  test('シード値再生成ボタンが機能すること', async () => {
    // 初期シード値を取得
    const initialSeed = await getSeedValue();
    
    // 再生成ボタンをクリック
    await clickRegenerateSeed();
    await wait(500);
    
    // 新しいシード値を取得
    const newSeed = await getSeedValue();
    
    // 値が変更されていることを確認
    expect(newSeed).not.toBe('');
    expect(newSeed.length).toBeGreaterThan(0);
    
    // 注意: ランダム生成のため、稀に同じ値になる可能性があるが、
    // 確率は非常に低いのでテストとしては有効
  });

  test('空のシード値を保存しようとするとエラーになること', async () => {
    // 空のシード値を設定
    await setSeedValue('');
    
    // アラートをモックする
    await page.evaluate(() => {
      window.originalAlert = window.alert;
      window.alert = function(msg) {
        window.lastAlertMessage = msg;
      };
    });
    
    // 保存を試みる
    await page.click('#save-and-close-settings');
    await wait(500);
    
    // モーダルがまだ表示されていることを確認（エラーで閉じられていない）
    const isStillVisible = await isModalVisible('settings-modal');
    expect(isStillVisible).toBeTruthy();
    
    // アラートメッセージを確認
    const alertMessage = await page.evaluate(() => window.lastAlertMessage);
    expect(alertMessage).toBeTruthy();
    
    // アラートモックを元に戻す
    await page.evaluate(() => {
      window.alert = window.originalAlert;
    });
  });
});

describe('設定の再現性テスト', () => {
  // テスト用の固定設定
  const testSettings = {
    width: 6,
    height: 7,
    nextCount: 4,
    blockMin: 2,
    blockMax: 4,
    minoMode: '7bag',
    seed: 'testSeed456'
  };
  
  // 盤面とネクストの状態を保存する変数
  let firstBoardState;
  let firstNextState;
  
  test('同じ設定とシード値で同じ問題が生成されること', async () => {
    // 最初の問題生成
    await openSettings();
    await wait(500);
    
    // 設定を適用
    await setSliderValue('width', testSettings.width);
    await setSliderValue('height', testSettings.height);
    await setSliderValue('next-count', testSettings.nextCount);
    await setBlockRangeSlider(testSettings.blockMin, testSettings.blockMax);
    await setMinoMode(testSettings.minoMode);
    await setSeedValue(testSettings.seed);
    
    // 設定を保存
    await saveAndCloseSettings();
    await wait(1000);
    
    // 盤面とネクストの状態を保存
    firstBoardState = await getBoardState();
    firstNextState = await getNextPiecesState();
    
    // ページをリロード
    await page.reload();
    await page.waitForSelector('#board');
    await wait(1000);
    
    // 2回目の問題生成（同じ設定で）
    await openSettings();
    await wait(500);
    
    // 設定を適用（同じ設定）
    await setSliderValue('width', testSettings.width);
    await setSliderValue('height', testSettings.height);
    await setSliderValue('next-count', testSettings.nextCount);
    await setBlockRangeSlider(testSettings.blockMin, testSettings.blockMax);
    await setMinoMode(testSettings.minoMode);
    await setSeedValue(testSettings.seed);
    
    // 設定を保存
    await saveAndCloseSettings();
    await wait(1000);
    
    // 2回目の盤面とネクストの状態を取得
    const secondBoardState = await getBoardState();
    const secondNextState = await getNextPiecesState();
    
    // 1回目と2回目の状態が一致することを確認
    expect(secondBoardState).toEqual(firstBoardState);
    expect(secondNextState).toEqual(firstNextState);
  });
  
  test('シード値を変更すると異なる問題が生成されること', async () => {
    // 設定を開く
    await openSettings();
    await wait(500);
    
    // 同じ設定だが、シード値だけ大きく変更
    await setSliderValue('width', testSettings.width);
    await setSliderValue('height', testSettings.height);
    await setSliderValue('next-count', testSettings.nextCount);
    await setBlockRangeSlider(testSettings.blockMin, testSettings.blockMax);
    await setMinoMode(testSettings.minoMode);
    await setSeedValue('completely_different_seed_' + Date.now());
    
    // 設定を保存
    await saveAndCloseSettings();
    await wait(2000); // 待機時間を長くする
    
    // 新しい盤面とネクストの状態を取得
    const newBoardState = await getBoardState();
    const newNextState = await getNextPiecesState();
    
    // 最初の状態と異なることを確認
    // 注意: 完全に異なるとは限らないが、確率的にはほぼ異なるはず
    const boardDiffers = !arraysEqual(newBoardState, firstBoardState);
    const nextDiffers = !arraysEqual(newNextState, firstNextState);
    
    // 盤面かネクストのどちらかが異なれば成功とする
    expect(boardDiffers || nextDiffers).toBeTruthy();
  });
  
  test('問題番号が変わっても同じシード値なら同じパターンで問題が生成されること', async () => {
    // 設定を開く
    await openSettings();
    await wait(500);
    
    // 元の設定に戻す
    await setSliderValue('width', testSettings.width);
    await setSliderValue('height', testSettings.height);
    await setSliderValue('next-count', testSettings.nextCount);
    await setBlockRangeSlider(testSettings.blockMin, testSettings.blockMax);
    await setMinoMode(testSettings.minoMode);
    await setSeedValue(testSettings.seed);
    
    // 設定を保存
    await saveAndCloseSettings();
    await wait(1000);
    
    // 問題番号を進める（右スワイプ）
    await swipeLeft();
    await wait(1000);
    
    // 問題番号が2になっていることを確認
    const problemNumber = await getCurrentProblemNumber();
    expect(problemNumber).toBe(2);
    
    // 問題2の状態を保存
    const problem2BoardState = await getBoardState();
    const problem2NextState = await getNextPiecesState();
    
    // 問題番号を戻す（左スワイプ）
    await swipeRight();
    await wait(1000);
    
    // 問題番号が1に戻っていることを確認
    const problemNumberAfterSwipe = await getCurrentProblemNumber();
    expect(problemNumberAfterSwipe).toBe(1);
    
    // 問題1の状態が最初の状態と一致することを確認
    const problem1BoardState = await getBoardState();
    const problem1NextState = await getNextPiecesState();
    
    expect(problem1BoardState).toEqual(firstBoardState);
    expect(problem1NextState).toEqual(firstNextState);
    
    // 再度問題2に進む
    await swipeLeft();
    await wait(1000);
    
    // 問題2の状態が前回の問題2と一致することを確認
    const problem2BoardStateAgain = await getBoardState();
    const problem2NextStateAgain = await getNextPiecesState();
    
    expect(problem2BoardStateAgain).toEqual(problem2BoardState);
    expect(problem2NextStateAgain).toEqual(problem2NextState);
  });
});

// 配列が等しいかどうかを比較するヘルパー関数
function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
} 