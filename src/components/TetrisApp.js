import { Hold } from './Hold.js';
import { Next } from './Next.js';
import { Board } from './Board.js';
import { EditModePanel } from './EditModePanel.js';
import { SettingsPanel } from './SettingsPanel.js';
import { AISuggestionPanel } from './AISuggestionPanel.js';
import { AIControlPanel } from './AIControlPanel.js';

import { GlobalState } from '../store/GlobalState.js';
import { createSeededGenerator} from '../utils/random.js';
import { generateNextPieces } from '../services/GenerateNextPieces.js';
import { handleEditCellClick } from '../services/EditManager.js';

/**
 * テトリスアプリケーションクラス
 * アプリケーション全体の管理を担当
 */
export class TetrisApp {
  /**
   * コンストラクタ
   */
  constructor() {
    
    this._g = GlobalState.getInstance();
    
    this.dom = {
      clearBoard: document.getElementById('clear-board'),
      newProblemButton: document.getElementById('new-problem-button'),
    };    
  
    // コンポーネントの管理
    this.components = {
      settingsPanel: new SettingsPanel(),
      aiSuggestionPanel: new AISuggestionPanel(),
      aiControlPanel: new AIControlPanel(),
      hold: new Hold(),
      next: new Next(),
      board: new Board((x, y) => handleEditCellClick(x, y)),
      EditModePanel: new EditModePanel(),
    };
          
    // TODO: この処理は非同期だが、このままでよいのかは要検討
    this.components.aiSuggestionPanel.initialize();

    this.generateProblem();
    
    // ボタンのイベントリスナー設定
    this.dom.clearBoard?.addEventListener('click', () => this.generateProblem(false, false));
    this.dom.newProblemButton?.addEventListener('click', () => this.generateProblem());   

    // 設定変更のリスナーを追加
    this._g.addSettingsListener((settings) => {this.generateProblem();});
  }

  /**
   * 問題の生成
   */
  generateProblem(isUpdateSeed = true, isClearAIHistory = true) {

  	// AIの履歴の削除
    if (isClearAIHistory) {
      const aiState = this._g.getAIState();
      if (aiState.moves.length > 0) {
        if (!confirm('AIの履歴があります。新しい問題を生成すると履歴が削除されますが、よろしいですか？')) {
          return;  // キャンセルされた場合、ここで処理を中断する
        }
        // AIの履歴をクリア
        this._g.clearAIMoves();
      }
    }

    // 必要に応じてシード値を更新し、乱数生成器を
    const seed = isUpdateSeed ? this._g.updateSeed() : this._g.getSeed();
    const randomGenerator = createSeededGenerator(seed);

    // 保存されている設定を取得
    const settings = this._g.getSettings();
    const { width, height } = settings.boardSettings;

    // ボードを初期化
    let grid = Array(height).fill().map(() => Array(width).fill(null));
    grid[1][1] = 'I';    grid[2][1] = 'J'; // テスト用
    this._g.updateGridAll(grid);

    // ホールドをクリア
    this._g.updateHold("T");

    // ネクストを更新
    const nextPieces = generateNextPieces(randomGenerator, settings.minoMode);
    this._g.updateNext(nextPieces);

    // グリッドを表示
    this._g.setGridHidden(false);
  }

} 