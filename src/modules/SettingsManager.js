import { config, defaultSettings } from '../utils/config.js';

/**
 * 設定管理クラス
 * アプリケーション設定の読み込み、検証、保存を担当
 */
export class SettingsManager {
  _state;
  _modalElement;
  _modal;

  constructor() {
    // 反応的なデータモデル
    this._state = {
      boardSettings: {
        width: defaultSettings.width,
        height: defaultSettings.height,
        nextCount: defaultSettings.nextCount,
        blockRange: {
          min: defaultSettings.blockCountMin,
          max: defaultSettings.blockCountMax,
        },
        minoMode: defaultSettings.minoMode,
        seed: Math.random().toString(36).substring(2, 15),
      },
      aiSettings: {
        searchTime: 1.0,
        movesCount: 5,
      }
    };

    // 設定の読み込み
    this._loadSettings();

    // DOM要素の初期化
    this._modalElement = document.getElementById('settings-modal');
    this._initializeModal();
    this._initializeEventListeners();
    
  }

  /**
   * 設定の取得
   * @returns {Object} 現在の設定
   */
  getSettings() {
    return this._state;
  }

  /**
   * 設定モーダルを開く
   */
  openSettingsModal() {
    this._modal?.show();
  }

  /**
   * 設定モーダーを閉じる
   */
  _closeSettingsModal() {
    this._modal?.hide();
  }

  /**
   * モーダルの初期化
   */
  _initializeModal() {
    if (!this._modalElement) {
      console.error('設定モーダルの要素が見つかりません');
      return;
    }

    this._modalElement.addEventListener('hidden.bs.modal', () => {
      this._dispatchEvent('settingsModalClosed', {});
    });
    this._modal = new bootstrap.Modal(this._modalElement);
  }

  /**
   * イベントリスナーの初期化
   */
  _initializeEventListeners() {
    // 設定の更新とイベント発行の共通処理
    const updateAndNotify = () => {
      if (this._validateSettings(this._state)) {
        this._saveSettings(this._state);
        this._dispatchEvent('settingsChanged', { settings: this._state });
      }
    };

    // DOM要素の取得
    const elements = {
      width: document.getElementById('width'),
      widthValue: document.getElementById('width-value'),
      height: document.getElementById('height'),
      heightValue: document.getElementById('height-value'),
      nextCount: document.getElementById('next-count'),
      nextCountValue: document.getElementById('next-count-value'),
      blockRange: document.getElementById('block-range-slider'),
      blockRangeValues: document.getElementById('block-range-values'),
      minoMode: document.getElementById('mino-mode'),
      seed: document.getElementById('seed-value'),
      regenerateSeed: document.getElementById('regenerate-seed'),
      searchTime: document.getElementById('ai-search-time'),
      searchTimeValue: document.getElementById('ai-search-time-value'),
      movesCount: document.getElementById('ai-moves-count'),
      movesCountValue: document.getElementById('ai-moves-count-value'),
    };

    // ブロック範囲スライダーの初期化
    if (elements.blockRange) {
      noUiSlider.create(elements.blockRange, {
        start: [this._state.boardSettings.blockRange.min, this._state.boardSettings.blockRange.max],
        connect: true,
        range: {
          'min': config.BLOCKS.MIN_COUNT,
          'max': config.BLOCKS.MAX_COUNT
        },
        step: 1,
        format: {
          to: value => Math.round(value),
          from: value => Math.round(value)
        }
      });
    }

    // スライダー値の更新と通知の共通処理
    const updateSliderAndNotify = (element, valueElement, path, parser = parseInt) => {
      if (element) {
        element.addEventListener('input', () => {
          const value = parser(element.value, 10);
          this._updateState(path, value);
          if (valueElement) {
            valueElement.textContent = value;
          }
          updateAndNotify();
        });
      }
    };

    // 盤面設定のスライダー値の更新
    updateSliderAndNotify(elements.width, elements.widthValue, 'boardSettings.width');
    updateSliderAndNotify(elements.height, elements.heightValue, 'boardSettings.height');
    updateSliderAndNotify(elements.nextCount, elements.nextCountValue, 'boardSettings.nextCount');

    // AI設定のスライダー値の更新
    updateSliderAndNotify(elements.searchTime, elements.searchTimeValue, 'aiSettings.searchTime', parseFloat);
    updateSliderAndNotify(elements.movesCount, elements.movesCountValue, 'aiSettings.movesCount');

    // ブロック範囲スライダーの更新
    if (elements.blockRange?.noUiSlider) {
      elements.blockRange.noUiSlider.on('update', () => {
        const values = elements.blockRange.noUiSlider.get();
        const min = Math.round(parseFloat(values[0]));
        const max = Math.round(parseFloat(values[1]));
        this._updateState('boardSettings.blockRange', {
          min,
          max,
        });
        if (elements.blockRangeValues) {
          elements.blockRangeValues.textContent = `${min} - ${max}`;
        }
        updateAndNotify();
      });
    }

    // シード値の再生成
    elements.regenerateSeed?.addEventListener('click', () => {
      const newSeed = Math.random().toString(36).substring(2, 6);
      this._updateState('boardSettings.seed', newSeed);
      elements.seed.value = newSeed;
      updateAndNotify();
    });

    // ミノモードの変更
    elements.minoMode?.addEventListener('change', (e) => {
      this._updateState('boardSettings.minoMode', e.target.value);
      updateAndNotify();
    });

    // モーダルの閉じるボタン
    document.getElementById('close-settings')?.addEventListener('click', () => this._closeSettingsModal());
  }

  /**
   * 状態の更新
   * @param {string} path - 更新する状態のパス（例: 'boardSettings.width'）
   * @param {any} value - 新しい値
   */
  _updateState(path, value) {
    const keys = path.split('.');
    let current = this._state;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
      if (!current) {
        throw new Error(`Invalid path: ${path}`);
      }
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * 設定の保存
   * @param {Object} settings - 保存する設定
   */
  _saveSettings(settings) {
    try {
      localStorage.setItem('tetrisSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      this._dispatchEvent('settingsError', { error: '設定の保存に失敗しました' });
    }
  }

  /**
   * 保存された設定の読み込み
   */
  _loadSettings() {
    try {
      const savedSettings = localStorage.getItem('tetrisSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (this._validateSettings(settings)) {
          this._applySettings(settings);
        } else {
          console.warn('保存された設定が無効です。デフォルト設定を使用します。');
        }
      }
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error);
      this._dispatchEvent('settingsError', { error: '設定の読み込みに失敗しました' });
    }
  }

  /**
   * 設定の適用
   * @param {Object} settings - 適用する設定
   */
  _applySettings(settings) {
    // DOM要素の取得
    const elements = {
      width: document.getElementById('width'),
      widthValue: document.getElementById('width-value'),
      height: document.getElementById('height'),
      heightValue: document.getElementById('height-value'),
      nextCount: document.getElementById('next-count'),
      nextCountValue: document.getElementById('next-count-value'),
      blockRange: document.getElementById('block-range-slider'),
      blockRangeValues: document.getElementById('block-range-values'),
      minoMode: document.getElementById('mino-mode'),
      seed: document.getElementById('seed-value'),
      searchTime: document.getElementById('ai-search-time'),
      searchTimeValue: document.getElementById('ai-search-time-value'),
      movesCount: document.getElementById('ai-moves-count'),
      movesCountValue: document.getElementById('ai-moves-count-value'),
    };

    // 盤面設定の適用
    const { boardSettings } = settings;
    
    // 幅と高さの設定
    elements.width.value = boardSettings.width;
    elements.widthValue.textContent = boardSettings.width;
    elements.height.value = boardSettings.height;
    elements.heightValue.textContent = boardSettings.height;

    // NEXT数の設定
    elements.nextCount.value = boardSettings.nextCount;
    elements.nextCountValue.textContent = boardSettings.nextCount;

    // ブロック範囲の設定
    elements.blockRange.noUiSlider?.set([
      boardSettings.blockRange.min,
      boardSettings.blockRange.max,
    ]);
    elements.blockRangeValues.textContent = `${boardSettings.blockRange.min} - ${boardSettings.blockRange.max}`;

    // ミノモードの設定
    elements.minoMode.value = boardSettings.minoMode;

    // シード値の設定
    elements.seed.value = boardSettings.seed;

    // AI設定の適用
    const { aiSettings } = settings;
    // 検索時間の設定
    elements.searchTime.value = aiSettings.searchTime;
    elements.searchTimeValue.textContent = aiSettings.searchTime;

    // 手数の設定
    elements.movesCount.value = aiSettings.movesCount;
    elements.movesCountValue.textContent = aiSettings.movesCount;

    // 状態の更新
    this._state = settings;
  }

  /**
   * 設定の検証
   * @param {Object} settings - 検証する設定
   * @returns {boolean} 有効な場合はtrue
   */
  _validateSettings(settings) {
    if (!settings || typeof settings !== 'object') {
      return false;
    }

    const { boardSettings, aiSettings } = settings;
    
    return (
      this._validateBoardSettings(boardSettings) &&
      this._validateAISettings(aiSettings)
    );
  }

  /**
   * 盤面設定の検証
   * @param {Object} boardSettings - 盤面設定
   * @returns {boolean} 有効な場合はtrue
   */
  _validateBoardSettings(boardSettings) {
    if (!boardSettings || typeof boardSettings !== 'object') {
      return false;
    }

    const isValidBoardSize = (
      boardSettings.width >= config.BOARD.MIN_WIDTH &&
      boardSettings.width <= config.BOARD.MAX_WIDTH &&
      boardSettings.height >= config.BOARD.MIN_HEIGHT &&
      boardSettings.height <= config.BOARD.MAX_HEIGHT
    );

    const isValidNextCount = (
      boardSettings.nextCount >= config.NEXT.MIN_COUNT &&
      boardSettings.nextCount <= config.NEXT.MAX_COUNT
    );

    const isValidBlockRange = (
      boardSettings.blockRange?.min >= config.BLOCKS.MIN_COUNT &&
      boardSettings.blockRange?.max <= config.BLOCKS.MAX_COUNT &&
      boardSettings.blockRange?.min <= boardSettings.blockRange?.max
    );

    return isValidBoardSize && isValidNextCount && isValidBlockRange;
  }

  /**
   * AI設定の検証
   * @param {Object} aiSettings - AI設定
   * @returns {boolean} 有効な場合はtrue
   */
  _validateAISettings(aiSettings) {
    if (!aiSettings || typeof aiSettings !== 'object') {
      return false;
    }

    return (
      aiSettings.searchTime >= 0.5 &&
      aiSettings.searchTime <= 10 &&
      aiSettings.movesCount >= 1 &&
      aiSettings.movesCount <= 20
    );
  }

  /**
   * イベントを発火する
   * @param {string} eventName - イベント名
   * @param {Object} detail - イベントの詳細データ
   */
  _dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, {
      detail: detail
    });
    document.dispatchEvent(event);
  }
} 