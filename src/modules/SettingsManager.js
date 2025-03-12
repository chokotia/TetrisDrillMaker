import { config, defaultSettings } from '../utils/config.js';

/**
 * 設定管理クラス
 * アプリケーション設定の読み込み、検証、保存を担当
 */
export class SettingsManager {
  /**
   * 設定を取得する
   * @param {Object} dom - DOMオブジェクト
   * @returns {Object} 現在の設定
   */
  static getSettings(dom) {
    return {
      ...this.getSliderSettings(dom),
      ...this.getMinoModeSettings(),
    };
  }

  /**
   * スライダーの設定を取得
   * @param {Object} dom - DOMオブジェクト
   * @returns {Object} スライダー設定
   */
  static getSliderSettings(dom) {
    return {
      ...this.getBoardSettings(dom),
      ...this.getNextSettings(dom),
      ...this.getBlockCountSettings(dom),
    };
  }

  /**
   * ボード設定を取得
   * @param {Object} dom - DOMオブジェクト
   * @returns {Object} ボード設定
   */
  static getBoardSettings(dom) {
    return {
      width: this.getSliderValue(dom, 'width', config.BOARD.MIN_WIDTH),
      height: this.getSliderValue(dom, 'height', config.BOARD.MIN_HEIGHT),
    };
  }

  /**
   * NEXT設定を取得
   * @param {Object} dom - DOMオブジェクト
   * @returns {Object} NEXT設定
   */
  static getNextSettings(dom) {
    return {
      nextCount: this.getSliderValue(dom, 'nextCount', config.NEXT.MIN_COUNT),
    };
  }

  /**
   * ブロック数設定を取得
   * @param {Object} dom - DOMオブジェクト
   * @returns {Object} ブロック数設定
   */
  static getBlockCountSettings(dom) {
    const { blockCountMin, blockCountMax } = this.getBlockRangeValues(dom);
    return { blockCountMin, blockCountMax };
  }

  /**
   * 個別のスライダー値を取得
   * @param {Object} dom - DOMオブジェクト
   * @param {string} key - スライダーのキー
   * @param {number} defaultValue - デフォルト値
   * @returns {number} スライダー値
   */
  static getSliderValue(dom, key, defaultValue) {
    const slider = dom.sliders[key];
    return slider ? this.parseSliderValue(slider.value, defaultValue) : defaultValue;
  }

  /**
   * スライダー値をパース
   * @param {string} value - スライダー値
   * @param {number} defaultValue - デフォルト値
   * @returns {number} パースされた値
   */
  static parseSliderValue(value, defaultValue) {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * ブロック数範囲の値を取得
   * @param {Object} dom - DOMオブジェクト
   * @returns {Object} ブロック数範囲
   */
  static getBlockRangeValues(dom) {
    if (!this.hasValidBlockRangeSlider(dom)) {
      return this.getDefaultBlockRangeValues();
    }
    return this.parseBlockRangeValues(dom);
  }

  /**
   * ブロック数スライダーの有効性チェック
   * @param {Object} dom - DOMオブジェクト
   * @returns {boolean} 有効な場合はtrue
   */
  static hasValidBlockRangeSlider(dom) {
    return dom.sliders.blockRange && dom.sliders.blockRange.noUiSlider;
  }

  /**
   * デフォルトのブロック数範囲を取得
   * @returns {Object} デフォルトのブロック数範囲
   */
  static getDefaultBlockRangeValues() {
    return {
      blockCountMin: config.BLOCKS.MIN_COUNT,
      blockCountMax: config.BLOCKS.MAX_COUNT,
    };
  }

  /**
   * ブロック数範囲の値をパース
   * @param {Object} dom - DOMオブジェクト
   * @returns {Object} パースされたブロック数範囲
   */
  static parseBlockRangeValues(dom) {
    const values = dom.sliders.blockRange.noUiSlider.get();
    return {
      blockCountMin: Math.round(parseFloat(values[0])),
      blockCountMax: Math.round(parseFloat(values[1])),
    };
  }

  /**
   * ミノモードの設定を取得
   * @returns {Object} ミノモード設定
   */
  static getMinoModeSettings() {
    return {
      minoMode: this.getMinoMode(),
    };
  }

  /**
   * ミノモードを取得
   * @returns {string} ミノモード
   */
  static getMinoMode() {
    const minoModeEl = document.getElementById('mino-mode');
    return minoModeEl ? minoModeEl.value : 'random';
  }

  /**
   * 設定をローカルストレージに保存
   * @param {Object} settings - 保存する設定
   */
  static saveSettings(settings) {
    try {
      localStorage.setItem('tetrisSettings', JSON.stringify(settings));
      console.log('設定を保存しました');
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
    }
  }

  /**
   * 保存された設定を取得
   * @returns {Object|null} 保存された設定、または null
   */
  static getSavedSettings() {
    try {
      const settings = localStorage.getItem('tetrisSettings');
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error);
      return null;
    }
  }

  /**
   * 設定の有効性をチェック
   * @param {Object} settings - チェックする設定
   * @returns {boolean} 有効な場合はtrue
   */
  static isValidSettings(settings) {
    return settings && typeof settings === 'object' &&
           this.hasRequiredSettings(settings) &&
           this.isWithinValidRange(settings);
  }

  /**
   * 必要な設定が存在するかチェック
   * @param {Object} settings - チェックする設定
   * @returns {boolean} 必要な設定が存在する場合はtrue
   */
  static hasRequiredSettings(settings) {
    const required = ['width', 'height', 'nextCount', 'blockCountMin', 'blockCountMax', 'minoMode'];
    return required.every(key => key in settings);
  }

  /**
   * 設定値が有効範囲内かチェック
   * @param {Object} settings - チェックする設定
   * @returns {boolean} 有効範囲内の場合はtrue
   */
  static isWithinValidRange(settings) {
    return this.isValidBoardSize(settings) &&
           this.isValidNextCount(settings) &&
           this.isValidBlockCount(settings);
  }

  /**
   * ボードサイズの有効性チェック
   * @param {Object} settings - チェックする設定
   * @returns {boolean} 有効な場合はtrue
   */
  static isValidBoardSize(settings) {
    return settings.width >= config.BOARD.MIN_WIDTH &&
           settings.width <= config.BOARD.MAX_WIDTH &&
           settings.height >= config.BOARD.MIN_HEIGHT &&
           settings.height <= config.BOARD.MAX_HEIGHT;
  }

  /**
   * NEXT数の有効性チェック
   * @param {Object} settings - チェックする設定
   * @returns {boolean} 有効な場合はtrue
   */
  static isValidNextCount(settings) {
    return settings.nextCount >= config.NEXT.MIN_COUNT &&
           settings.nextCount <= config.NEXT.MAX_COUNT;
  }

  /**
   * ブロック数の有効性チェック
   * @param {Object} settings - チェックする設定
   * @returns {boolean} 有効な場合はtrue
   */
  static isValidBlockCount(settings) {
    return settings.blockCountMin >= config.BLOCKS.MIN_COUNT &&
           settings.blockCountMax <= config.BLOCKS.MAX_COUNT &&
           settings.blockCountMin <= settings.blockCountMax;
  }

  /**
   * 設定を読み込んで適用
   * @param {Object} dom - DOMオブジェクト
   * @returns {Object} 適用された設定
   */
  static loadSettings(dom) {
    try {
      const settings = this.loadStoredSettings();
      if (this.isValidSettings(settings)) {
        this.applySettings(settings, dom);
        return settings;
      } else {
        this.applyDefaultSettings(dom);
        return defaultSettings;
      }
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error);
      this.applyDefaultSettings(dom);
      return defaultSettings;
    }
  }

  /**
   * 保存された設定を読み込み
   * @returns {Object} 読み込まれた設定
   */
  static loadStoredSettings() {
    const savedSettings = this.getSavedSettings();
    return savedSettings || defaultSettings;
  }

  /**
   * 設定を適用
   * @param {Object} settings - 適用する設定
   * @param {Object} dom - DOMオブジェクト
   */
  static applySettings(settings, dom) {
    this.applySliderSettings(settings, dom);
    this.applyMinoModeSettings(settings);
    this.applyBlockRangeSettings(settings, dom);
  }

  /**
   * スライダー設定を適用
   * @param {Object} settings - 適用する設定
   * @param {Object} dom - DOMオブジェクト
   */
  static applySliderSettings(settings, dom) {
    Object.entries(settings).forEach(([key, value]) => {
      if (dom.sliders[key] && key !== 'blockRange') {
        dom.sliders[key].value = value;
        if (dom.sliderValues[key]) {
          dom.sliderValues[key].textContent = value;
          this.updateAriaValue(dom.sliders[key], dom.sliderValues[key]);
        }
      }
    });
  }

  /**
   * ミノモード設定を適用
   * @param {Object} settings - 適用する設定
   */
  static applyMinoModeSettings(settings) {
    if (settings.minoMode) {
      const minoModeEl = document.getElementById('mino-mode');
      if (minoModeEl) {
        minoModeEl.value = settings.minoMode;
      }
    }
  }

  /**
   * ブロック数範囲の設定を適用
   * @param {Object} settings - 適用する設定
   * @param {Object} dom - DOMオブジェクト
   */
  static applyBlockRangeSettings(settings, dom) {
    const { blockCountMin, blockCountMax } = settings;
    if (this.hasValidBlockRangeSlider(dom)) {
      dom.sliders.blockRange.noUiSlider.set([blockCountMin, blockCountMax]);
    }
  }

  /**
   * デフォルト設定を適用
   * @param {Object} dom - DOMオブジェクト
   */
  static applyDefaultSettings(dom) {
    this.applySettings(defaultSettings, dom);
  }

  /**
   * ARIA属性の更新
   * @param {HTMLElement} slider - スライダー要素
   * @param {HTMLElement} output - 出力要素
   */
  static updateAriaValue(slider, output) {
    slider.setAttribute('aria-valuenow', slider.value);
  }
} 