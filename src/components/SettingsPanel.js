import { config, defaultSettings } from '../utils/config.js';
import { dispatchEvent } from '../utils/eventUtils.js';
import { GlobalState } from '../modules/state/GlobalState.js';

/**
 * 設定管理クラス
 * アプリケーション設定のUI表示とユーザーインタラクションを担当
 */
export class SettingsPanel {
  _modalElement;
  _modal;
  _globalState;

  constructor() {
    this._globalState = GlobalState.getInstance();
    
    // DOM要素の初期化
    this._modalElement = document.getElementById('settings-modal');
    this._initializeModal();
    this._initializeEventListeners();
  }

  /**
   * 設定モーダルを開く
   */
  openModal() {
    this._modal?.show();
  }

  /**
   * 設定モーダーを閉じる
   */
  _closeModal() {
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
      dispatchEvent('settingsModalClosed', {});
    });
    this._modal = new bootstrap.Modal(this._modalElement);
  }

  /**
   * イベントリスナーの初期化
   */
  _initializeEventListeners() {
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
        start: [this._globalState.getSettings().boardSettings.blockRange.min, 
                this._globalState.getSettings().boardSettings.blockRange.max],
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
          this._updateSettings(path, value);
          if (valueElement) {
            valueElement.textContent = value;
          }
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
        this._updateSettings('boardSettings.blockRange', {
          min,
          max,
        });
        if (elements.blockRangeValues) {
          elements.blockRangeValues.textContent = `${min} - ${max}`;
        }
      });
    }

    // シード値の再生成
    elements.regenerateSeed?.addEventListener('click', () => {
      const newSeed = Math.random().toString(36).substring(2, 6);
      this._updateSettings('boardSettings.seed', newSeed);
      elements.seed.value = newSeed;
    });

    // ミノモードの変更
    elements.minoMode?.addEventListener('change', (e) => {
      this._updateSettings('boardSettings.minoMode', e.target.value);
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
    
    // パスの最後のキー以外のオブジェクトを辿る
    let target = settings;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) {
        throw new Error(`Invalid path: ${path}`);
      }
      target = target[keys[i]];
    }
    
    // 最後のキーで値を更新
    target[keys[keys.length - 1]] = value;
    this._globalState.updateSettings(settings);
  }
} 