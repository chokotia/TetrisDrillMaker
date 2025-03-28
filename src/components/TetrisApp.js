import { createSeededGenerator} from '../utils/random.js';
import { SettingsPanel } from './SettingsPanel.js';
import { EditManager } from '../modules/EditManager.js';
import { AISuggestionPanel } from './AISuggestionPanel.js';
import { AIControlPanel } from './AIControlPanel.js';
import { GlobalState } from '../store/GlobalState.js';
import { Hold } from './Hold.js';
import { Next } from './Next.js';
import { Board } from './Board.js';
import { EditModePanel } from './EditModePanel.js';
import { generateNextPieces } from '../utils/minoUtils.js';


/**
 * テトリスアプリケーションクラス
 * アプリケーション全体の管理を担当
 */
export class TetrisApp {
  /**
   * コンストラクタ
   */
  constructor() {
    
    this._globalState = GlobalState.getInstance();
    
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
      board: new Board((x, y) => EditManager.handleEditCellClick(x, y)),
      EditModePanel: new EditModePanel(),
    };

    // 乱数生成器を生成
    const _seed = this._globalState.getSeed();
    this.randomGenerator = createSeededGenerator(_seed);
          
    // TODO: この処理は非同期だが、このままでよいのかは要検討
    this.components.aiSuggestionPanel.initialize();

    this.generateProblem();
    
    // ボタンのイベントリスナー設定
    this.dom.clearBoard?.addEventListener('click', () => this.generateProblem(false, false));
    this.dom.newProblemButton?.addEventListener('click', () => this.generateProblem());   

    // 設定変更のリスナーを追加
    this._globalState.addSettingsListener((settings) => {this.generateProblem();});
  }

  /**
   * 問題の生成
   */
  generateProblem(isUpdateSeed = true, isClearAIHistory = true) {

  	// AIの履歴の削除
    if (isClearAIHistory) {
      const aiState = this._globalState.getAIState();
      if (aiState.moves.length > 0) {
        if (!confirm('AIの履歴があります。新しい問題を生成すると履歴が削除されますが、よろしいですか？')) {
          return;  // キャンセルされた場合、ここで処理を中断する
        }
        // AIの履歴をクリア
        this._globalState.clearAIMoves();
      }
    }

    // シードの更新
    const _seed = isUpdateSeed ? this._globalState.updateSeed() : this._globalState.getSeed();
    this.randomGenerator = createSeededGenerator(_seed);

    // 保存されている設定を取得
    const settings = this._globalState.getSettings();
    const { width, height } = settings.boardSettings;

    // ボードを初期化
    let grid = Array(height).fill().map(() => Array(width).fill(null));
    grid[1][1] = 'I';    grid[2][1] = 'J'; // テスト用
    this._globalState.updateGridAll(grid);

    // ホールドをクリア
    this._globalState.updateHold("T");

    // ネクストを更新
    const nextPieces = generateNextPieces(this.randomGenerator, settings.minoMode);
    this._globalState.updateNext(nextPieces);

    // グリッドを表示
    this._globalState.setGridHidden(false);
  }

} 