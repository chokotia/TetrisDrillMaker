import { createSeededGenerator } from '../utils/random.js';
import { generateNextPieces } from './GenerateNextPieces.js';
import { GlobalState } from '../store/GlobalState.js';

const _g = GlobalState.getInstance();

/**
 * 問題の生成
 * @param {boolean} isUpdateSeed - シード値を更新するかどうか
 * @param {boolean} isClearAIHistory - AIの履歴をクリアするかどうか
 */
export function generateProblem(isUpdateSeed = true, isClearAIHistory = true) {
  // AIの履歴の削除
  if (isClearAIHistory) {
    const aiState = _g.getAIState();
    if (aiState.moves.length > 0) {
      if (!confirm('AIの履歴があります。新しい問題を生成すると履歴が削除されますが、よろしいですか？')) {
        return;  // キャンセルされた場合、ここで処理を中断する
      }
      // AIの履歴をクリア
      _g.clearAIMoves();
    }
  }

  // 必要に応じてシード値を更新し、乱数生成器を
  const seed = isUpdateSeed ? _g.updateSeed() : _g.getSeed();
  const randomGenerator = createSeededGenerator(seed);

  // 保存されている設定を取得
  const settings = _g.getSettings();
  const { width, height } = settings.boardSettings;

  // ボードを初期化
  let grid = Array(height).fill().map(() => Array(width).fill(null));
  grid[1][1] = 'I';    grid[2][1] = 'J'; // テスト用
  _g.updateGridAll(grid);

  // ホールドをクリア
  _g.updateHold("T");

  // ネクストを更新
  const nextPieces = generateNextPieces(randomGenerator, settings.minoMode);
  _g.updateNext(nextPieces);

  // グリッドを表示
  _g.setGridHidden(false);
} 