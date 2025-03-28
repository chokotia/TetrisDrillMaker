import { GlobalState } from '../store/GlobalState.js';

/**
 * ホールドミノの表示を管理するクラス
 * ホールドミノのUI表示と状態管理を担当
 */
export class EditModePanel {
  _globalState;
  _dom;
  _state;

  constructor() {
    this._globalState = GlobalState.getInstance();
    this._state = {};

    // DOM要素の初期化
    this._dom = {
      editOptionButtons: document.querySelectorAll('.edit-option'),
    };

    // ボタンのクリックイベントリスナーを設定
    this._dom.editOptionButtons.forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        this._handleEditOptionClick(action);
      });
    });

    // グローバル状態の変更を監視
    this._globalState.addEditModeListener(() => this._updateDisplay());

    // 初期表示を更新
    this._updateDisplay();
  }

  /**
   * 編集オプションのクリックハンドラ
   * @param {string} action - クリックされたボタンのアクション
   */
  _handleEditOptionClick(action) {
    // グローバル状態を更新
    this._globalState.updateEditMode(action);
  }

  /**
   * 表示の更新
   */
  _updateDisplay() {
    const { selectedOption } = this._globalState.getEditMode();
    
    // 編集ボタンの状態を更新
    this._dom.editOptionButtons.forEach(button => {
      if (button.dataset.action === selectedOption) {
        button.classList.add('selected');
        button.setAttribute('aria-pressed', 'true');
      } else {
        button.classList.remove('selected');
        button.setAttribute('aria-pressed', 'false');
      }
    });
  }
}