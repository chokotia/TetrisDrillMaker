import { GlobalState } from '../modules/state/GlobalState.js';

/**
 * 設定管理クラス
 * アプリケーション設定のUI表示とユーザーインタラクションを担当
 */
export class SettingsPanel {
  _modalElement;
  _modal;
  _globalState;
  _elements;

  constructor() {
    this._globalState = GlobalState.getInstance();
    
    // DOM要素の初期化
    this._modalElement = document.getElementById('settings-modal');
    this._elements = this._initializeDOMElements();
    this._initializeModal();
    this._initializeEventListeners();
  }

  /**
   * DOM要素の初期化
   * @returns {Object} DOM要素オブジェクト
   */
  _initializeDOMElements() {
    return {
      width: document.getElementById('width'),
      widthValue: document.getElementById('width-value'),
      height: document.getElementById('height'),
      heightValue: document.getElementById('height-value'),
      nextCount: document.getElementById('next-count'),
      nextCountValue: document.getElementById('next-count-value'),
      blockRange: document.getElementById('block-range-slider'),
      blockRangeValues: document.getElementById('block-range-values'),
      minoMode: document.getElementById('mino-mode'),
      searchTime: document.getElementById('ai-search-time'),
      searchTimeValue: document.getElementById('ai-search-time-value'),
      movesCount: document.getElementById('ai-moves-count'),
      movesCountValue: document.getElementById('ai-moves-count-value'),
      weightsName: document.getElementById('ai-weights-name'),
    };
  }

  /**
   * 設定モーダルを開く
   */
  openModal() {
    this._updateUIWithCurrentSettings();
    this._modal?.show();
  }

  /**
   * 現在の設定値をUIに反映
   */
  _updateUIWithCurrentSettings() {
    const settings = this._globalState.getSettings();
    
    // 盤面設定の反映
    this._updateSliderValue('width', settings.boardSettings.width);
    this._updateSliderValue('height', settings.boardSettings.height);
    this._updateSliderValue('nextCount', settings.boardSettings.nextCount);
    
    // ブロック範囲スライダーの更新
    if (this._elements.blockRange?.noUiSlider) {
      this._elements.blockRange.noUiSlider.set([
        settings.boardSettings.blockRange.min,
        settings.boardSettings.blockRange.max
      ]);
      this._elements.blockRangeValues.textContent = 
        `${settings.boardSettings.blockRange.min} - ${settings.boardSettings.blockRange.max}`;
    }

    // その他の設定値の更新
    this._elements.minoMode.value = settings.boardSettings.minoMode;
    this._updateSliderValue('searchTime', settings.aiSettings.searchTime, parseFloat);
    this._updateSliderValue('movesCount', settings.aiSettings.movesCount);
    this._elements.weightsName.value = settings.aiSettings.weights_name;
  }

  /**
   * スライダー値の更新
   * @param {string} key - 要素のキー
   * @param {number} value - 設定値
   * @param {Function} [parser=parseInt] - 値のパース関数
   */
  _updateSliderValue(key, value, parser = parseInt) {
    const element = this._elements[key];
    const valueElement = this._elements[`${key}Value`];
    
    if (element) {
      element.value = value;
      if (valueElement) {
        valueElement.textContent = value;
      }
    }
  }

  /**
   * 設定モーダーを閉じる
   */
  _closeModal() {
    // モーダルを閉じる前にフォーカスを外す
    if (document.activeElement) {
      document.activeElement.blur();
    }
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
    this._modal = new bootstrap.Modal(this._modalElement);
  }

  /**
   * イベントリスナーの初期化
   */
  _initializeEventListeners() {
    this._initializeBlockRangeSlider();
    this._initializeSliders();
    this._initializeButtons();
  }

  /**
   * ブロック範囲スライダーの初期化
   */
  _initializeBlockRangeSlider() {
    if (!this._elements.blockRange) return;

    const settings = this._globalState.getSettings();
    noUiSlider.create(this._elements.blockRange, {
      start: [settings.boardSettings.blockRange.min, 
              settings.boardSettings.blockRange.max],
      connect: true,
      range: {
        'min': 0,
        'max': 1
      },
      step: 1,
      format: {
        to: value => Math.round(value),
        from: value => Math.round(value)
      }
    });

    this._elements.blockRange.noUiSlider.on('update', () => {
      const values = this._elements.blockRange.noUiSlider.get();
      const min = Math.round(parseFloat(values[0]));
      const max = Math.round(parseFloat(values[1]));
      this._updateSettings('boardSettings.blockRange', { min, max });
      if (this._elements.blockRangeValues) {
        this._elements.blockRangeValues.textContent = `${min} - ${max}`;
      }
    });
  }

  /**
   * スライダーの初期化
   */
  _initializeSliders() {
    const sliderConfigs = [
      { key: 'width', path: 'boardSettings.width', parser: parseInt },
      { key: 'height', path: 'boardSettings.height', parser: parseInt },
      { key: 'nextCount', path: 'boardSettings.nextCount', parser: parseInt },
      { key: 'searchTime', path: 'aiSettings.searchTime', parser: parseFloat },
      { key: 'movesCount', path: 'aiSettings.movesCount', parser: parseInt }
    ];

    sliderConfigs.forEach(({ key, path, parser = parseInt }) => {
      const element = this._elements[key];
      const valueElement = this._elements[`${key}Value`];
      
      if (element) {
        element.addEventListener('input', () => {
          const value = parser(element.value, 10);
          this._updateSettings(path, value);
          if (valueElement) {
            valueElement.textContent = value;
          }
        });
      }
    });
  }

  /**
   * ボタンの初期化
   */
  _initializeButtons() {
    // ミノモードの変更
    this._elements.minoMode?.addEventListener('change', (e) => {
      this._updateSettings('boardSettings.minoMode', e.target.value);
    });

    // 重み設定の変更
    this._elements.weightsName?.addEventListener('change', (e) => {
      this._updateSettings('aiSettings.weights_name', e.target.value);
    });

    // モーダルの閉じるボタン
    document.getElementById('close-settings')?.addEventListener('click', () => this._closeModal());
  }

  /**
   * 設定の更新
   * @param {string} path - 更新する設定のパス
   * @param {any} value - 新しい値
   */
  _updateSettings(path, value) {
    const settings = { ...this._globalState.getSettings() };
    const keys = path.split('.');
    
    let target = settings;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) {
        throw new Error(`Invalid path: ${path}`);
      }
      target = target[keys[i]];
    }
    
    target[keys[keys.length - 1]] = value;
    this._globalState.updateSettings(settings);
  }
} 