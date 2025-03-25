/**
 * AIの重み設定を定義するファイル
 * loadWeights関数で使用する配列形式で定義
 * 各パラメータの説明:
 * [0] back_to_back: B2Bのボーナス
 * [1] bumpiness: 高さの凹凸に対するペナルティ
 * [2] bumpiness_sq: 高さの凹凸の2乗に対するペナルティ
 * [3] row_transitions: 行の遷移回数に対するペナルティ
 * [4] height: 全体的な高さに対するペナルティ
 * [5] top_half: 上半分の高さに対するペナルティ
 * [6] top_quarter: 最上部の高さに対するペナルティ
 * [7] cavity_cells: 空洞セルに対するペナルティ
 * [8] cavity_cells_sq: 空洞セルの2乗に対するペナルティ
 * [9] overhang_cells: オーバーハングセルに対するペナルティ
 * [10] overhang_cells_sq: オーバーハングセルの2乗に対するペナルティ
 * [11] covered_cells: 覆われたセルに対するペナルティ
 * [12] covered_cells_sq: 覆われたセルの2乗に対するペナルティ
 * [13-16] tslot: Tスピンのスロット評価 [TSMS, TSS, TSD, TST]
 * [17] well_depth: ウェルの深さに対するボーナス
 * [18] max_well_depth: ウェルの最大深さ
 * [19-28] well_column: 各列のウェル評価
 * [29] wasted_t: 無駄なTミノに対するペナルティ
 * [30] b2b_clear: B2Bクリアのボーナス
 * [31] clear1: 1ライン消しの評価
 * [32] clear2: 2ライン消しの評価
 * [33] clear3: 3ライン消しの評価
 * [34] clear4: 4ライン消しの評価
 * [35] tspin1: Tスピン1の評価
 * [36] tspin2: Tスピン2の評価
 * [37] tspin3: Tスピン3の評価
 * [38] mini_tspin1: ミニTスピン1の評価
 * [39] mini_tspin2: ミニTスピン2の評価
 * [40] perfect_clear: パーフェクトクリアのボーナス
 * [41] combo_garbage: コンボによるガベージ評価
 * [42-43] tank: タンク評価 [クリーン, メッシー]
 * [44] spike: スパイク評価
 */

// AIの重み設定を定義
export const weights = {
    // 標準的な重み設定（Tスピン重視）
    default: [
        52,    // back_to_back: B2Bのボーナス
        -24,   // bumpiness: 高さの凹凸に対するペナルティ
        -7,    // bumpiness_sq: 高さの凹凸の2乗に対するペナルティ
        -5,    // row_transitions: 行の遷移回数に対するペナルティ
        -39,   // height: 全体的な高さに対するペナルティ
        -150,  // top_half: 上半分の高さに対するペナルティ
        -511,  // top_quarter: 最上部の高さに対するペナルティ
        -173,  // cavity_cells: 空洞セルに対するペナルティ
        -3,    // cavity_cells_sq: 空洞セルの2乗に対するペナルティ
        -34,   // overhang_cells: オーバーハングセルに対するペナルティ
        -1,    // overhang_cells_sq: オーバーハングセルの2乗に対するペナルティ
        -17,   // covered_cells: 覆われたセルに対するペナルティ
        -1,    // covered_cells_sq: 覆われたセルの2乗に対するペナルティ
        8,     // tslot[0]: TSMS
        148,   // tslot[1]: TSS
        192,   // tslot[2]: TSD
        407,   // tslot[3]: TST
        57,    // well_depth: ウェルの深さに対するボーナス
        17,    // max_well_depth: ウェルの最大深さ
        -30,   // well_column[0]
        -50,   // well_column[1]
        20,    // well_column[2]
        50,    // well_column[3]
        60,    // well_column[4]
        60,    // well_column[5]
        50,    // well_column[6]
        20,    // well_column[7]
        -50,   // well_column[8]
        -30,   // well_column[9]
        -152,  // wasted_t: 無駄なTミノに対するペナルティ
        104,   // b2b_clear: B2Bクリアのボーナス
        -143,  // clear1: 1ライン消しの評価
        -100,  // clear2: 2ライン消しの評価
        -58,   // clear3: 3ライン消しの評価
        390,   // clear4: 4ライン消しの評価
        121,   // tspin1: Tスピン1の評価
        410,   // tspin2: Tスピン2の評価
        602,   // tspin3: Tスピン3の評価
        -158,  // mini_tspin1: ミニTスピン1の評価
        -93,   // mini_tspin2: ミニTスピン2の評価
        999,   // perfect_clear: パーフェクトクリアのボーナス
        200,   // combo_garbage: コンボによるガベージ評価
        17,    // tank[0]: クリーン
        4,     // tank[1]: メッシー
        115    // spike: スパイク評価
    ],

    // 右端空け平積み用の重み設定（Tスピン不使用）
    rightWellFlat: [
        52,    // back_to_back: B2Bのボーナス
        -24,   // bumpiness: 高さの凹凸に対するペナルティ
        -7,    // bumpiness_sq: 高さの凹凸の2乗に対するペナルティ
        -5,    // row_transitions: 行の遷移回数に対するペナルティ
        -39,   // height: 全体的な高さに対するペナルティ
        -150,  // top_half: 上半分の高さに対するペナルティ
        -511,  // top_quarter: 最上部の高さに対するペナルティ
        -500,  // cavity_cells: 空洞セルに対するペナルティ
        -500,  // cavity_cells_sq: 空洞セルの2乗に対するペナルティ
        -500,  // overhang_cells: オーバーハングセルに対するペナルティ
        -500,  // overhang_cells_sq: オーバーハングセルの2乗に対するペナルティ
        -500,  // covered_cells: 覆われたセルに対するペナルティ
        -500,  // covered_cells_sq: 覆われたセルの2乗に対するペナルティ
        -9999, // tslot[0]: TSMS
        -9999, // tslot[1]: TSS
        -9999, // tslot[2]: TSD
        -9999, // tslot[3]: TST
        57,    // well_depth: ウェルの深さに対するボーナス
        17,    // max_well_depth: ウェルの最大深さ
        -9999, // well_column[0]
        -9999, // well_column[1]
        -9999, // well_column[2]
        -9999, // well_column[3]
        -9999, // well_column[4]
        -9999, // well_column[5]
        -9999, // well_column[6]
        -9999, // well_column[7]
        -9999, // well_column[8]
        0,     // well_column[9]: 右端のみ評価
        0,     // wasted_t: TスピンできなかったTミノにペナルティなし
        104,   // b2b_clear: B2Bクリアのボーナス
        -500,  // clear1: 1ライン消しの評価
        -500,  // clear2: 2ライン消しの評価
        -500,  // clear3: 3ライン消しの評価
        500,   // clear4: 4ライン消しの評価
        -9999, // tspin1: Tスピン1の評価
        -9999, // tspin2: Tスピン2の評価
        -9999, // tspin3: Tスピン3の評価
        -9999, // mini_tspin1: ミニTスピン1の評価
        -9999, // mini_tspin2: ミニTスピン2の評価
        0,     // perfect_clear: パーフェクトクリアのボーナスなし
        200,   // combo_garbage: コンボによるガベージ評価
        17,    // tank[0]: クリーン
        4,     // tank[1]: メッシー
        115    // spike: スパイク評価
    ],

    // 安定積み用の重み設定（空中Tスピン不使用）
    stableStack: [
        52,    // back_to_back: B2Bのボーナス
        -50,   // bumpiness: 高さの凹凸に対するペナルティ（強化）
        -15,   // bumpiness_sq: 高さの凹凸の2乗に対するペナルティ（強化）
        -10,   // row_transitions: 行の遷移回数に対するペナルティ（強化）
        -45,   // height: 全体的な高さに対するペナルティ（強化）
        -200,  // top_half: 上半分の高さに対するペナルティ（強化）
        -600,  // top_quarter: 最上部の高さに対するペナルティ（強化）
        -800,  // cavity_cells: 空洞セルに対するペナルティ（大幅強化）
        -400,  // cavity_cells_sq: 空洞セルの2乗に対するペナルティ（強化）
        -600,  // overhang_cells: オーバーハングセルに対するペナルティ（大幅強化）
        -300,  // overhang_cells_sq: オーバーハングセルの2乗に対するペナルティ（強化）
        -400,  // covered_cells: 覆われたセルに対するペナルティ（強化）
        -200,  // covered_cells_sq: 覆われたセルの2乗に対するペナルティ（強化）
        -100,  // tslot[0]: TSMS（空中Tスピン抑制）
        -200,  // tslot[1]: TSS（空中Tスピン抑制）
        -300,  // tslot[2]: TSD（空中Tスピン抑制）
        -400,  // tslot[3]: TST（空中Tスピン抑制）
        30,    // well_depth: ウェルの深さに対するボーナス（調整）
        10,    // max_well_depth: ウェルの最大深さ（調整）
        -20,   // well_column[0]
        -30,   // well_column[1]
        -10,   // well_column[2]
        10,    // well_column[3]
        20,    // well_column[4]
        20,    // well_column[5]
        10,    // well_column[6]
        -10,   // well_column[7]
        -30,   // well_column[8]
        -20,   // well_column[9]
        -100,  // wasted_t: 無駄なTミノに対するペナルティ
        104,   // b2b_clear: B2Bクリアのボーナス
        -100,  // clear1: 1ライン消しの評価
        -50,   // clear2: 2ライン消しの評価
        -20,   // clear3: 3ライン消しの評価
        300,   // clear4: 4ライン消しの評価
        -100,  // tspin1: Tスピン1の評価（空中Tスピン抑制）
        -200,  // tspin2: Tスピン2の評価（空中Tスピン抑制）
        -300,  // tspin3: Tスピン3の評価（空中Tスピン抑制）
        -150,  // mini_tspin1: ミニTスピン1の評価（空中Tスピン抑制）
        -200,  // mini_tspin2: ミニTスピン2の評価（空中Tスピン抑制）
        500,   // perfect_clear: パーフェクトクリアのボーナス
        150,   // combo_garbage: コンボによるガベージ評価
        20,    // tank[0]: クリーン（強化）
        5,     // tank[1]: メッシー（調整）
        100    // spike: スパイク評価
    ]
}; 