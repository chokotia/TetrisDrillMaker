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
        -24,   // bumpiness: 高さの凹凸に対するペナルティ
        -7,    // bumpiness_sq: 高さの凹凸の2乗に対するペナルティ
        -5,    // row_transitions: 行の遷移回数に対するペナルティ
        -39,   // height: 全体的な高さに対するペナルティ
        -150,  // top_half: 上半分の高さに対するペナルティ
        -511,  // top_quarter: 最上部の高さに対するペナルティ
        -500,  // cavity_cells: 空洞セルに対するペナルティ
        -500,    // cavity_cells_sq: 空洞セルの2乗に対するペナルティ
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
        50,   // tspin1: Tスピン1の評価
        510,   // tspin2: Tスピン2の評価
        602,   // tspin3: Tスピン3の評価
        -158,  // mini_tspin1: ミニTスピン1の評価
        -93,   // mini_tspin2: ミニTスピン2の評価
        -9000,   // perfect_clear: パーフェクトクリアのボーナス
        200,   // combo_garbage: コンボによるガベージ評価
        17,    // tank[0]: クリーン
        4,     // tank[1]: メッシー
        115    // spike: スパイク評価
    ],

    cc_standard_like: [// https://github.com/MinusKelvin/cold-clear/blob/master/bot/src/evaluation/standard.rs#L52-L84
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
        20,   // well_column[0]
        23,   // well_column[1]
        20,    // well_column[2]
        50,    // well_column[3]
        59,    // well_column[4]
        21,    // well_column[5]
        59,    // well_column[6]
        10,    // well_column[7]
        -10,   // well_column[8]
        24,   // well_column[9]
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
        150,   // combo_garbage: コンボによるガベージ評価
        17,    // tank[0]: クリーン
        4,     // tank[1]: メッシー
        115    // spike: スパイク評価
    ],

    cc_fast_like: [// https://github.com/MinusKelvin/cold-clear/blob/master/bot/src/evaluation/standard.rs#L52-L84
        10,    // back_to_back: B2Bのボーナス
        -7,   // bumpiness: 高さの凹凸に対するペナルティ
        -28,    // bumpiness_sq: 高さの凹凸の2乗に対するペナルティ
        -5,    // row_transitions: 行の遷移回数に対するペナルティ
        -46,   // height: 全体的な高さに対するペナルティ
        -126,  // top_half: 上半分の高さに対するペナルティ
        -493,  // top_quarter: 最上部の高さに対するペナルティ
        -176,  // cavity_cells: 空洞セルに対するペナルティ
        -6,    // cavity_cells_sq: 空洞セルの2乗に対するペナルティ
        -47,   // overhang_cells: オーバーハングセルに対するペナルティ
        -9,    // overhang_cells_sq: オーバーハングセルの2乗に対するペナルティ
        -25,   // covered_cells: 覆われたセルに対するペナルティ
        1,    // covered_cells_sq: 覆われたセルの2乗に対するペナルティ
        0,     // tslot[0]: TSMS
        150,   // tslot[1]: TSS
        296,   // tslot[2]: TSD
        207,   // tslot[3]: TST
        158,    // well_depth: ウェルの深さに対するボーナス
        -2,    // max_well_depth: ウェルの最大深さ
        31,   // well_column[0]
        16,   // well_column[1]
        -41,    // well_column[2]
        37,    // well_column[3]
        49,    // well_column[4]
        30,    // well_column[5]
        56,    // well_column[6]
        48,    // well_column[7]
        -27,   // well_column[8]
        22,   // well_column[9]
        -147,  // wasted_t: 無駄なTミノに対するペナルティ
        74,   // b2b_clear: B2Bクリアのボーナス
        -122,  // clear1: 1ライン消しの評価
        -174,  // clear2: 2ライン消しの評価
        11,   // clear3: 3ライン消しの評価
        424,   // clear4: 4ライン消しの評価
        131,   // tspin1: Tスピン1の評価
        392,   // tspin2: Tスピン2の評価
        628,   // tspin3: Tスピン3の評価
        -188,  // mini_tspin1: ミニTスピン1の評価
        -682,   // mini_tspin2: ミニTスピン2の評価
        991,   // perfect_clear: パーフェクトクリアのボーナス
        272,   // combo_garbage: コンボによるガベージ評価
        0,    // tank[0]: クリーン
        0,     // tank[1]: メッシー
        0    // spike: スパイク評価
    ],
}; 