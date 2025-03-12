const jstrisToCenterX = [[1, 2, 2, 1], [1, 1, 2, 2], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]]
  , jstrisToCenterY = [[1, 1, 2, 2], [2, 1, 1, 2], [2, 2, 2, 2], [2, 2, 2, 2], [2, 2, 2, 2], [2, 2, 2, 2], [2, 2, 2, 2]]
  , pIndex = ["I", "O", "T", "L", "J", "S", "Z"]
  , rIndex = ["north", "east", "south", "west"]
  , reverseRIndex = {
    north: 0,
    east: 1,
    south: 2,
    west: 3
}
  , reversePIndex = {
    I: 0,
    O: 1,
    T: 2,
    L: 3,
    J: 4,
    S: 5,
    Z: 6
}
  , stats_copy = {
    CLEAR1: 0,
    CLEAR2: 0,
    CLEAR3: 0,
    CLEAR4: 0,
    TSMS: 0,
    TSS: 0,
    TSD: 0,
    TST: 0,
    PC: 0,
    WASTE: 0,
    ATTACK: 0,
    B2B: 0,
    COMBO: 0,
    CLEAN_RECIEVED: 0,
    MESSY_RECIEVED: 0,
    SPIKE: 0
};
function TFstate(t) {
    let e = (t = copyNState(t)).board;
    
    // 20行から21行に変換
    let nullRow = Array(10).fill(null);
    e.unshift(nullRow);

    for (let t = 0; t < e.length; t++)
        for (let i = 0; i < e[t].length; i++)
            null == e[t][i] ? e[t][i] = 0 : "G" == e[t][i] ? e[t][i] = 8 : e[t][i] = reversePIndex[e[t][i]] + 1;
    let i = e.shift()
      , s = {
        matrix: e,
        deadline: i,
        comboCounter: t.combo,
        isBack2Back: t.back_to_back,
        incomingGarbage: [],
        stats: {
            ...stats_copy
        },
        queue: t.queue.map(t => new Block(reversePIndex[t])),
        currSpike: 0,
        hold: {}
    };
    return t.hold && (s.hold = new Block(reversePIndex[t.hold])),
    s
}
function FTmove(t, e) {
    let i = {};
    i.type = pIndex[t.piece.id],
    i.orientation = rIndex[t.r];
    let s = jstrisToCenterX[t.piece.id][t.r] + t.x
      , a = jstrisToCenterY[t.piece.id][t.r] + t.y;
    i.x = s,
    i.y = 19 - a;
    let o = "none";
    if (e == "TSD" || e == "TST" || e == "TSS") {
        o = "full";
    }    
    const moveResult = {
        location: i,
        spin: o
    };
    
    return addAbsoluteBlockPositions(moveResult);
}
function TFmove(t) {
    let e = t.spin
      , i = t.location
      , s = reverseRIndex[i.orientation]
      , a = reversePIndex[i.type];
    return {
        x: i.x - jstrisToCenterX[a][s],
        y: 19 - i.y - jstrisToCenterY[a][s],
        r: s,
        piece: new Block(a),
        tcheck: !1,
        spin: e,
        actions: []
    }
}
function copyState(t) {
    return {
        matrix: t.matrix.map(function(t) {
            return t.slice()
        }),
        queue: [...t.queue],
        hold: {
            ...t.hold
        },
        deadline: [...t.deadline],
        comboCounter: t.comboCounter,
        isBack2Back: t.isBack2Back,
        stats: {
            ...t.stats
        },
        incomingGarbage: [...t.incomingGarbage],
        currSpike: t.currSpike
    }
}
function copyNState(t) {
    return {
        board: t.board.map(function(t) {
            return t.slice()
        }),
        queue: [...t.queue],
        combo: t.combo,
        back_to_back: t.back_to_back,
        hold: t.hold
    }
}
function columnHeight(t, e) {
    let i = 0;
    for (; i < t.length && 0 == t[i][e]; i++)
        ;
    return t.length - i
}
function Game() {
    this.blockSets = getBlockSets(),
    this.comboAttack = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5],
    this.linesAttack = [0, 0, 1, 2, 4, 4, 6, 2, 0, 10, 1];
    this.TSLOTS = [function(t, e) {
        if (e + 1 > 9)
            return !1;
        let i = columnHeight(t, e)
          , s = columnHeight(t, e + 1)
          , a = columnHeight(t, e + 2);
        if (!(i >= a + 2))
            return !1;
        if (!(a >= s + 1))
            return !1;
        let o = [[1, 2, 2], [0, 2, 2], [1, 2, 2]]
          , r = 20 - a - 2;
        for (let i = 0; i < 3; i++) {
            let s = r + i;
            for (let a = 0; a < 3; a++) {
                let r = e + a;
                if (o[i][a] > 0 != t[s][r] > 0 && 2 != o[i][a])
                    return !1
            }
        }
        return {
            x: e,
            y: r - 1,
            r: 2,
            piece: new Block(2),
            tcheck: !0
        }
    }
    , function(t, e) {
        if (e + 1 > 9)
            return !1;
        let i = columnHeight(t, e)
          , s = columnHeight(t, e + 1);
        if (!(columnHeight(t, e + 2) >= i + 2))
            return !1;
        if (!(i >= s + 1))
            return !1;
        let a = [[2, 2, 1], [2, 2, 0], [2, 2, 1]]
          , o = 20 - i - 2;
        for (let i = 0; i < 3; i++) {
            let s = o + i;
            for (let o = 0; o < 3; o++) {
                let r = e + o;
                if (a[i][o] > 0 != t[s][r] > 0 && 2 != a[i][o])
                    return !1
            }
        }
        return {
            x: e,
            y: o - 1,
            r: 2,
            piece: new Block(2),
            tcheck: !0
        }
    }
    , function(t, e) {
        if (e + 2 > 9)
            return !1;
        let i = columnHeight(t, e)
          , s = columnHeight(t, e + 1)
          , a = columnHeight(t, e + 2);
        if (i != s)
            return !1;
        if (!(a >= s + 2))
            return !1;
        if (!(a >= 5))
            return !1;
        let o = [[2, 2, 1], [2, 2, 0], [2, 2, 0], [2, 0, 0], [2, 2, 0]]
          , r = 20 - a;
        if (t[r][e - 1] != t[r + 1][e - 1])
            return !1;
        for (let i = 0; i < 3; i++) {
            let s = r + i;
            for (let a = 0; a < 3; a++) {
                let r = e + a;
                if (o[i][a] > 0 != t[s][r] > 0 && 2 != o[i][a])
                    return !1
            }
        }
        return {
            x: e + 1,
            y: r + 1,
            r: 3,
            piece: new Block(2),
            tcheck: !0
        }
    }
    , function(t, e) {
        if (e + 2 > 9)
            return !1;
        let i = columnHeight(t, e)
          , s = columnHeight(t, e + 1)
          , a = columnHeight(t, e + 2);
        if (!(i >= 5))
            return !1;
        if (a != s)
            return !1;
        if (!(i >= s + 2))
            return !1;
        let o = [[1, 2, 2], [0, 2, 2], [0, 2, 2], [0, 0, 2], [0, 2, 2]]
          , r = 20 - i;
        if (t[r][e + 3] != t[r + 1][e + 3])
            return !1;
        for (let i = 0; i < 3; i++) {
            let s = r + i;
            for (let a = 0; a < 3; a++) {
                let r = e + a;
                if (o[i][a] > 0 != t[s][r] > 0 && 2 != o[i][a])
                    return !1
            }
        }
        return {
            x: e - 1,
            y: r + 1,
            r: 1,
            piece: new Block(2),
            tcheck: !0
        }
    }
    ]
}
function objCopy(t) {
    if (null == t || "object" != typeof t)
        return t;
    var e = {};
    for (var i in t)
        t.hasOwnProperty(i) && (e[i] = t[i]);
    return e
}
function Block(t) {
    this.id = t,
    this.set = 0,
    this.pos = {
        x: 3,
        y: 0
    },
    this.rot = 0,
    this.item = 0
}
function BlockSet() {
    this.blocks = {},
    this.step = 1,
    this.scale = 1,
    this.items = !1,
    this.previewAs = null,
    this.equidist = !0,
    this.allspin = null
}
function getBlockSets() {
    let t = null;
    if (null !== t)
        return t;
    var e = new BlockSet;
    e.items = !0;
    var i = [{
        "-1": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
        1: [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        2: [[0, 0], [0, 1]]
    }, {
        "-1": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
        1: [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
        2: [[0, 0], [1, 0]]
    }, {
        "-1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        1: [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
        2: [[0, 0], [0, -1]]
    }, {
        "-1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        1: [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        2: [[0, 0], [-1, 0]]
    }];
    return e.blocks = [{
        id: 0,
        name: "I",
        color: 5,
        blocks: [[[0, 0, 0, 0], [1, 2, 3, 4], [0, 0, 0, 0], [0, 0, 0, 0]], [[0, 0, 1, 0], [0, 0, 2, 0], [0, 0, 3, 0], [0, 0, 4, 0]], [[0, 0, 0, 0], [0, 0, 0, 0], [4, 3, 2, 1], [0, 0, 0, 0]], [[0, 4, 0, 0], [0, 3, 0, 0], [0, 2, 0, 0], [0, 1, 0, 0]]],
        cc: [0, 2, 0, 1],
        yp: [1, 1],
        spawn: [3, -1],
        kicks: [{
            "-1": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
            1: [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
            2: [[0, 0], [0, 1]]
        }, {
            "-1": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
            1: [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
            2: [[0, 0], [1, 0]]
        }, {
            "-1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
            1: [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
            2: [[0, 0], [0, -1]]
        }, {
            "-1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
            1: [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
            2: [[0, 0], [-1, 0]]
        }],
        h: [1, 4, 1, 4]
    }, {
        id: 1,
        name: "O",
        color: 3,
        blocks: [[[0, 0, 0, 0], [0, 1, 2, 0], [0, 3, 4, 0], [0, 0, 0, 0]], [[0, 0, 0, 0], [0, 3, 1, 0], [0, 4, 2, 0], [0, 0, 0, 0]], [[0, 0, 0, 0], [0, 4, 3, 0], [0, 2, 1, 0], [0, 0, 0, 0]], [[0, 0, 0, 0], [0, 2, 4, 0], [0, 1, 3, 0], [0, 0, 0, 0]]],
        cc: [1, 1, 1, 1],
        yp: [1, 2],
        spawn: [3, -2],
        kicks: [{
            "-1": [[0, 0]],
            1: [[0, 0]],
            2: [[0, 0]]
        }, {
            "-1": [[0, 0]],
            1: [[0, 0]],
            2: [[0, 0]]
        }, {
            "-1": [[0, 0]],
            1: [[0, 0]],
            2: [[0, 0]]
        }, {
            "-1": [[0, 0]],
            1: [[0, 0]],
            2: [[0, 0]]
        }],
        h: [2, 2, 2, 2]
    }, {
        id: 2,
        name: "T",
        color: 7,
        blocks: [[[0, 0, 0, 0], [0, 1, 0, 0], [2, 3, 4, 0], [0, 0, 0, 0]], [[0, 0, 0, 0], [0, 2, 0, 0], [0, 3, 1, 0], [0, 4, 0, 0]], [[0, 0, 0, 0], [0, 0, 0, 0], [4, 3, 2, 0], [0, 1, 0, 0]], [[0, 0, 0, 0], [0, 4, 0, 0], [1, 3, 0, 0], [0, 2, 0, 0]]],
        cc: [0, 1, 0, 0],
        yp: [1, 2],
        spawn: [3, -2],
        kicks: i,
        h: [2, 3, 3, 3]
    }, {
        id: 3,
        name: "L",
        color: 2,
        blocks: [[[0, 0, 0, 0], [0, 0, 1, 0], [2, 3, 4, 0], [0, 0, 0, 0]], [[0, 0, 0, 0], [0, 2, 0, 0], [0, 3, 0, 0], [0, 4, 1, 0]], [[0, 0, 0, 0], [0, 0, 0, 0], [4, 3, 2, 0], [1, 0, 0, 0]], [[0, 0, 0, 0], [1, 4, 0, 0], [0, 3, 0, 0], [0, 2, 0, 0]]],
        cc: [0, 1, 0, 0],
        yp: [1, 2],
        spawn: [3, -2],
        kicks: i,
        h: [2, 3, 2, 3]
    }, {
        id: 4,
        name: "J",
        color: 6,
        blocks: [[[0, 0, 0, 0], [1, 0, 0, 0], [2, 3, 4, 0], [0, 0, 0, 0]], [[0, 0, 0, 0], [0, 2, 1, 0], [0, 3, 0, 0], [0, 4, 0, 0]], [[0, 0, 0, 0], [0, 0, 0, 0], [4, 3, 2, 0], [0, 0, 1, 0]], [[0, 0, 0, 0], [0, 4, 0, 0], [0, 3, 0, 0], [1, 2, 0, 0]]],
        cc: [0, 1, 0, 0],
        yp: [1, 2],
        spawn: [3, -2],
        kicks: i,
        h: [2, 3, 2, 3]
    }, {
        id: 5,
        name: "S",
        color: 4,
        blocks: [[[0, 0, 0, 0], [0, 1, 2, 0], [3, 4, 0, 0], [0, 0, 0, 0]], [[0, 0, 0, 0], [0, 3, 0, 0], [0, 4, 1, 0], [0, 0, 2, 0]], [[0, 0, 0, 0], [0, 0, 0, 0], [0, 4, 3, 0], [2, 1, 0, 0]], [[0, 0, 0, 0], [2, 0, 0, 0], [1, 4, 0, 0], [0, 3, 0, 0]]],
        cc: [0, 1, 0, 0],
        yp: [1, 2],
        spawn: [3, -2],
        kicks: i,
        h: [2, 3, 2, 3]
    }, {
        id: 6,
        name: "Z",
        color: 1,
        blocks: [[[0, 0, 0, 0], [1, 2, 0, 0], [0, 3, 4, 0], [0, 0, 0, 0]], [[0, 0, 0, 0], [0, 0, 1, 0], [0, 3, 2, 0], [0, 4, 0, 0]], [[0, 0, 0, 0], [0, 0, 0, 0], [4, 3, 0, 0], [0, 2, 1, 0]], [[0, 0, 0, 0], [0, 4, 0, 0], [2, 3, 0, 0], [1, 0, 0, 0]]],
        cc: [0, 1, 0, 0],
        yp: [1, 2],
        spawn: [3, -2],
        kicks: i,
        h: [2, 3, 2, 3]
    }],
    e.allspin = [[[[-1, 1, 4, 1], [[1, 0, 2, 0], [1, 2, 2, 2]]], [[2, -1, 2, 4], [[1, 1, 1, 2], [3, 1, 3, 2]]], [[-1, 2, 4, 2], [[1, 1, 2, 1], [1, 3, 2, 3]]], [[1, -1, 1, 4], [[0, 1, 0, 2], [2, 1, 2, 2]]]], null, null, [[[0, 3, 2, 3], [0, 1, 1, 1]], [[0, 1, 0, 3], [2, 1, 2, 2]], [[0, 1, 2, 1], [1, 3, 2, 3]], [[2, 1, 2, 3], [0, 2, 0, 3]]], [[[0, 3, 2, 3], [1, 1, 2, 1]], [[0, 1, 0, 3], [2, 2, 2, 3]], [[0, 1, 2, 1], [0, 3, 1, 3]], [[2, 1, 2, 3], [0, 1, 0, 2]]], [[[3, 1, -1, 2], [0, 1, 2, 2]], [[1, 0, 2, 4], [2, 1, 1, 3]], [[3, 2, -1, 3], [0, 2, 2, 3]], [[0, 0, 1, 4], [1, 1, 0, 3]]], [[[-1, 1, 3, 2], [0, 2, 2, 1]], [[2, 0, 1, 4], [1, 1, 2, 3]], [[-1, 2, 3, 3], [2, 2, 0, 3]], [[-1, 2, 0, 4], [0, 1, 1, 3]]]],
    t = [e]
}
Game.prototype.ai_legalMoves = function(t, e) {
    let i = new Map;
    const s = {
        x: e.pos.x,
        y: e.pos.y,
        r: e.rot,
        actions: [],
        piece: {
            ...e
        },
        tcheck: !1
    };
    for (let a = 0; a < 4; a++) {
        let o = s;
        1 == a ? o = this.ai_simulateAction(o, "cw", t, e, !0) : 2 == a ? o = this.ai_simulateAction(o, "180", t, e, !0) : 3 == a && (o = o = this.ai_simulateAction(o, "ccw", t, e, !0));
        let r = {
            x: o.x,
            y: o.y,
            r: o.r,
            actions: [...o.actions],
            piece: o.piece,
            tcheck: o.tcheck
        }
          , c = this.ai_simulateAction(o, "sd", t, e, !0);
        i.set(c.x + " " + c.y + " " + c.r, c);
        for (let s = 0; s < 10; s++) {
            if (o.x == (o = this.ai_simulateAction(o, ">", t, e, !0)).x)
                break;
            let s = this.ai_simulateAction(o, "sd", t, e, !0);
            i.set(s.x + " " + s.y + " " + s.r, s)
        }
        o = r;
        for (let s = 0; s < 10; s++) {
            if (o.x == (o = this.ai_simulateAction(o, "<", t, e, !0)).x)
                break;
            let s = this.ai_simulateAction(o, "sd", t, e, !0);
            i.set(s.x + " " + s.y + " " + s.r, s)
        }
    }
    let a = [...i.values()];
    for (let s = 0; s < 5 && 0 != a.length; s++) {
        let s = [];
        for (let o of a) {
            let a = [];
            a.push(this.ai_simulateAction(o, "<", t, e, !0)),
            a.push(this.ai_simulateAction(o, ">", t, e, !0)),
            a.push(this.ai_simulateAction(o, "sd", t, e, !0)),
            a.push(this.ai_simulateAction(o, "180", t, e, !0)),
            a.push(this.ai_simulateAction(o, "cw", t, e, !0)),
            a.push(this.ai_simulateAction(o, "ccw", t, e, !0));
            for (let o of a)
                this.ai_checkIntersection(o.x, o.y + 1, o.r, t, e) || (o = this.ai_simulateAction(o, "sd", t, e, !0)),
                i.has(o.x + " " + o.y + " " + o.r) ? (0 == i.get(o.x + " " + o.y + " " + o.r).tcheck && o.tcheck || i.get(o.x + " " + o.y + " " + o.r).actions.lenth > o.actions.length) && (i.set(o.x + " " + o.y + " " + o.r, o),
                s.push(o)) : (i.set(o.x + " " + o.y + " " + o.r, o),
                s.push(o))
        }
        a = s
    }
    return Array.from(i.values())
}
,
Game.prototype.ai_simRotate = function(t, e, i, s) {
    var a = {
        x: t.x,
        y: t.y,
        r: t.r,
        actions: [...t.actions],
        piece: t.piece,
        tcheck: t.tcheck
    };
    let o = -1 === e ? "-1" : 1 === e ? "1" : "2"
      , r = (a.r + e + 4) % 4
      , c = this.blockSets[s.set].blocks[s.id].kicks[a.r][o]
      , n = c.length;
    for (let t = 0; t < n; t++) {
        let e = c[t][0]
          , o = c[t][1];
        if (!this.ai_checkIntersection(a.x + e, a.y - o, r, i, s))
            return a.x += e,
            a.y -= o,
            a.r = r,
            a.tcheck = !0,
            a
    }
    return a
}
,
Game.prototype.ai_simulateAction = function(t, e, i, s, a) {
    var o = {
        x: t.x,
        y: t.y,
        r: t.r,
        actions: [...t.actions],
        piece: t.piece,
        tcheck: t.tcheck
    };
    if (a && ("hd" == o.actions[o.actions.length - 1] && o.actions.pop(),
    o.actions.push(e),
    o.actions.push("hd")),
    "<<" == e) {
        for (let t = 1; t < 15; t++)
            if (this.ai_checkIntersection(o.x - t, o.y, o.r, i, s))
                return o.x -= t - 1,
                1 != t && (o.tcheck = !1),
                o
    } else if (">>" == e) {
        for (let t = 1; t < 15; t++)
            if (this.ai_checkIntersection(o.x + t, o.y, o.r, i, s))
                return o.x += t - 1,
                1 != t && (o.tcheck = !1),
                o
    } else {
        if ("<" == e)
            return this.ai_checkIntersection(o.x - 1, o.y, o.r, i, s) ? o : (o.x--,
            o.tcheck = !1,
            o);
        if (">" == e)
            return this.ai_checkIntersection(o.x + 1, o.y, o.r, i, s) ? o : (o.x++,
            o.tcheck = !1,
            o);
        if ("cw" == e)
            return this.ai_simRotate(o, 1, i, s);
        if ("ccw" == e)
            return this.ai_simRotate(o, -1, i, s);
        if ("180" == e)
            return this.ai_simRotate(o, 2, i, s);
        if ("sd" == e)
            for (let t = 1; t < 40; t++)
                if (this.ai_checkIntersection(o.x, o.y + t, o.r, i, s))
                    return o.y = o.y + t - 1,
                    1 != t && (o.tcheck = !1),
                    o
    }
}
,
Game.prototype.ai_addGarbage = function(t, e) {
    if (e <= 0)
        return;
    let i = [9, 9, 9, 9, 9, 9, 9, 9, 9, 9];
    e <= t.matrix.length ? t.deadline = t.matrix[e - 1].slice(0) : t.deadline = i.slice(0);
    let s = t.matrix.length;
    for (let a = 0; a < s; a++)
        t.matrix[a] = s - a > e ? t.matrix[a + e].slice(0) : i.slice(0)
}
,
Game.prototype.ai_checkIntersection = function(t, e, i, s, a) {
    i = null === i ? a.rot : i;
    let o = this.blockSets[a.set]
      , r = o.blocks[a.id].blocks
      , c = o.blocks[a.id].blocks[i].length;
    for (var n = 0; n < c; n++)
        for (var l = 0; l < c; l++)
            if (r[i][n][l] > 0) {
                if (e + n >= 20)
                    return !0;
                if (t + l < 0 || t + l >= 10)
                    return !0;
                if (e + n >= 0 && s[e + n][t + l] > 0)
                    return !0
            }
    return !1
}
,
Game.prototype.ai_nextState = function(t, e) {
    let i = copyState(t);
    i.matrix = this.ai_placeBlock(e.x, e.y, e.r, i.matrix, e.piece);
    let s = 0
      , a = 0
      , o = 0
      , r = !1
      , c = !1
      , n = "";
    if (2 == e.piece.id) {
        let t = this.ai_checkTSpin(i, e);
        r = t.spinMiniPossible,
        c = t.spinPossible
    }
    for (let t = 0; t < 10; t++)
        if (0 != i.deadline[t])
            a++;
        else if (a > 0)
            break;
    10 == a ? (i.deadline = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    a++) : o += a;
    for (let t = 0; t < 20; t++) {
        a = 0;
        for (let e = 0; e < 10; e++) {
            let s = i.matrix[t][e];
            if (9 == s)
                break;
            if (0 != s)
                a++;
            else if (o + a > 0)
                break
        }
        if (10 == a) {
            for (let e = t; e > 0; e--)
                i.matrix[e] = i.matrix[e - 1];
            i.matrix[0] = i.deadline.slice(),
            i.deadline = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            a = 0,
            s++
        }
        o += a
    }
    let l = 0;
    if (s > 0) {
        switch (s) {
        case 1:
            l = this.linesAttack[1],
            c ? (n = "TSS",
            l = this.linesAttack[7],
            i.isBack2Back ? (i.stats.B2B++,
            l += this.linesAttack[10]) : i.isBack2Back = !0,
            i.stats.TSS++) : r ? (n = "TSMS",
            i.isBack2Back ? i.stats.B2B++ : i.isBack2Back = !0,
            l = this.linesAttack[8],
            i.stats.TSMS++) : (i.isBack2Back = !1,
            n = "CLEAR1",
            i.stats.CLEAR1++);
            break;
        case 2:
            l = this.linesAttack[2],
            c || r ? (i.stats.TSD++,
            l = this.linesAttack[5],
            n = "TSD",
            i.isBack2Back ? (i.stats.B2B++,
            l += this.linesAttack[10]) : i.isBack2Back = !0) : (i.isBack2Back = !1,
            n = "CLEAR2",
            i.stats.CLEAR2++);
            break;
        case 3:
            l = this.linesAttack[3],
            c || r ? (l = this.linesAttack[6],
            n = "TST",
            i.isBack2Back ? (i.stats.B2B++,
            l += this.linesAttack[10]) : i.isBack2Back = !0,
            i.stats.TST++) : (i.isBack2Back = !1,
            n = "CLEAR3",
            i.stats.CLEAR3++);
            break;
        case 4:
        default:
            i.stats.CLEAR4++,
            n = "CLEAR4",
            l = this.linesAttack[4],
            i.isBack2Back ? (i.stats.B2B++,
            l += this.linesAttack[10]) : i.isBack2Back = !0
        }
        0 == o && i.stats.CLEAN_RECIEVED + i.stats.MESSY_RECIEVED <= 0 && (i.stats.PC++,
        l = this.linesAttack[9],
        n = "PC"),
        i.comboCounter++;
        let t = i.comboCounter <= 12 ? this.comboAttack[i.comboCounter] : this.comboAttack[this.comboAttack.length - 1];
        if (i.stats.COMBO += t,
        (l += t) > 0) {
            for (let t = 0; t < i.incomingGarbage.length && 0 != i.incomingGarbage[t]; t++) {
                if (!((l -= i.incomingGarbage[t]) > 0)) {
                    i.incomingGarbage[t] = -l,
                    l = 0;
                    break
                }
                i.incomingGarbage[t] = 0
            }
            for (; 0 == i.incomingGarbage[0]; )
                i.incomingGarbage.shift()
        } else
            i.incomingGarbage.length > 0 && (0 == i.incomingGarbage[0] ? i.incomingGarbage.shift() : i.incomingGarbage[1] > 0 && (i.incomingGarbage[1] = i.incomingGarbage[0],
            i.incomingGarbage.shift()))
    } else
        for (i.comboCounter = -1; i.incomingGarbage.length > 0; ) {
            if (0 == i.incomingGarbage[0]) {
                i.incomingGarbage.shift();
                break
            }
            this.ai_addGarbage(i, i.incomingGarbage[0]),
            i.incomingGarbage < 4 ? i.stats.MESSY_RECIEVED += i.incomingGarbage[0] : i.stats.CLEAN_RECIEVED += i.incomingGarbage[0],
            i.incomingGarbage.shift()
        }
    ("TSMS" == n || s <= 0 && 2 == e.piece.id) && i.stats.WASTE++,
    i.stats.ATTACK += l,
    i.currSpike >= 0 ? l > 0 ? (i.currSpike += l,
    i.stats.SPIKE = Math.max(i.currSpike, i.stats.SPIKE)) : i.currSpike *= -1 : i.currSpike < 0 && (i.currSpike = l > 0 ? -.7 * i.currSpike + l : 0),
    i.action = n,
    e.piece.id == i.queue[0].id ? i.queue.shift() : e.piece.id == i.hold.id ? i.hold = i.queue.shift() : e.piece.id == i.queue[1].id && (i.hold = i.queue.shift(),
    i.queue.shift());
    let h = i.queue[0];
    if (h) {
        let t = this.blockSets[h.set].blocks[h.id];
        if (h.pos.x = t.spawn[0],
        h.pos.y = t.spawn[1],
        0 === h.set) {
            let e = t.blocks[0][-h.pos.y];
            (i.matrix[0][3] && e[0] || i.matrix[0][4] && e[1] || i.matrix[0][5] && e[2] || i.matrix[0][6] && e[3]) && h.pos.y--
        } else
            for (; this.ai_checkIntersection(h.pos.x, h.pos.y, h.rot, i.matrix, i.deadline); )
                h.pos.y--;
        let e = t.blocks[0].length;
        var u = -(1 + h.pos.y);
        if (u >= 0 && u < e)
            for (var p = 0; p < e; ++p)
                if (t.blocks[h.rot][u][p] && i.deadline[h.pos.x + p]) {
                    i.dead = !0;
                    break
                }
    }
    return i
}
,
Game.prototype.ai_placeBlock = function(t, e, i, s, a) {
    let o = s.map(t => t.slice());
    i = null === i ? a.rot : i;
    let r = this.blockSets[a.set]
      , c = r.blocks[a.id].blocks
      , n = r.blocks[a.id].blocks[i].length;
    for (let s = 0; s < n; s++)
        for (let r = 0; r < n; r++)
            if (c[i][s][r] > 0) {
                if (e + s >= 20)
                    continue;
                if (t + r < 0 || t + r >= 10)
                    continue;
                e + s >= 0 && (o[e + s][t + r] = a.id + 1)
            }
    return o
}
,
Game.prototype.ai_fireAction = function(t, e) {
    if (e = e || this.timestamp(),
    "<<" == t)
        this.activateDAS(-1, e),
        this.ARRon[-1] = !1;
    else if (">>" == t)
        this.activateDAS(1, e),
        this.ARRon[1] = !1;
    else if ("<" == t) {
        let t = e;
        this.moveCurrentBlock(-1, !1, t),
        this.pressedDir[-1] = t,
        this.Replay.add(new ReplayAction(this.Replay.Action.MOVE_LEFT,this.pressedDir[-1]))
    } else if (">" == t) {
        let t = e;
        this.moveCurrentBlock(1, !1, t),
        this.pressedDir[1] = t,
        this.Replay.add(new ReplayAction(this.Replay.Action.MOVE_RIGHT,this.pressedDir[1]))
    } else
        "hold" == t ? this.holdBlock() : "cw" == t ? (this.rotateCurrentBlock(1),
        this.Replay.add(new ReplayAction(this.Replay.Action.ROTATE_RIGHT,e))) : "ccw" == t ? (this.rotateCurrentBlock(-1),
        this.Replay.add(new ReplayAction(this.Replay.Action.ROTATE_LEFT,e))) : "180" == t ? (this.rotateCurrentBlock(2),
        this.Replay.add(new ReplayAction(this.Replay.Action.ROTATE_180,e))) : "hd" == t ? this.hardDrop(e) : "sd" == t && (this.softDropSet(!0, e),
        this.update(0, e),
        this.softDropSet(!1, e))
}
,
Game.prototype.ai_checkTSpin = function(t, e) {
    if (1 == !e.tcheck)
        return {
            spinPossible: !1,
            spinMiniPossible: !1
        };
    let i = 0
      , s = 0
      , a = e.r
      , o = e.x
      , r = e.y;
    if (r < -2)
        return !1;
    switch (a) {
    case 0:
        r >= -1 ? i = (t.matrix[r + 1][o] > 0) + (t.matrix[r + 1][o + 2] > 0) : -2 === r && (i = (t.deadline[o] > 0) + (t.deadline[o + 2] > 0)),
        s = 17 === r ? 2 : (t.matrix[r + 3][o] > 0) + (t.matrix[r + 3][o + 2] > 0);
        break;
    case 1:
        -1 === o && (s = 2),
        r >= -1 ? (i = (t.matrix[r + 1][o + 2] > 0) + (t.matrix[r + 3][o + 2] > 0),
        s || (s = (t.matrix[r + 1][o] > 0) + (t.matrix[r + 3][o] > 0))) : -2 === r && (i = (t.deadline[o + 2] > 0) + (t.matrix[r + 3][o + 2] > 0),
        s || (s = (t.deadline[o] > 0) + (t.matrix[r + 3][o] > 0)));
        break;
    case 2:
        r >= -1 ? s = (t.matrix[r + 1][o] > 0) + (t.matrix[r + 1][o + 2] > 0) : -2 === r && (s = (t.deadline[o] > 0) + (t.deadline[o + 2] > 0)),
        i = 17 === r ? 2 : (t.matrix[r + 3][o] > 0) + (t.matrix[r + 3][o + 2] > 0);
        break;
    case 3:
        8 === o && (s = 2),
        r >= -1 ? (i = (t.matrix[r + 1][o] > 0) + (t.matrix[r + 3][o] > 0),
        s || (s = (t.matrix[r + 1][o + 2] > 0) + (t.matrix[r + 3][o + 2] > 0))) : -2 === r && (i = (t.deadline[o] > 0) + (t.matrix[r + 3][o] > 0),
        s || (s = (t.deadline[o + 2] > 0) + (t.matrix[r + 3][o + 2] > 0)))
    }
    return {
        spinPossible: 2 === i && s >= 1,
        spinMiniPossible: 1 === i && 2 === s
    }
}
,
Game.prototype.matchTspin = function(t) {
    let e = {
        tslot: -1
    }
      , i = null;
    for (let s of this.TSLOTS)
        for (let a = 0; a < 7; a++) {
            let o = s(t.matrix, a);
            if (0 == o)
                continue;
            let r = this.ai_nextState(t, o);
            "TSS" == r.action ? o.tslot = 1 : "TSD" == r.action ? o.tslot = 2 : "TST" == r.action ? o.tslot = 3 : o.tslot = 0,
            o.tslot > e.tslot && (e = o,
            (i = r).tslot = o.tslot)
        }
    return i
}
,
Game.prototype.getValue = function(t, e, i) {
    let s = 0
      , a = t.matrix
      , o = 0
      , r = Math.min(7, t.queue.length);
    for (let e = 0; e < r; e++)
        "T" == this.blockSets[t.queue[e].set].blocks[t.queue[e].id].name && o++;
    o = Math.min(o, 3);
    let c = copyState(t);
    for (let t = 0; t < o && null != (c = this.matchTspin(c)); t++)
        a = c.matrix,
        s += i.tslot[c.tslot];
    let n = [];
    for (let t = 0; t < a[0].length; t++)
        n.push(columnHeight(a, t));
    let l = Math.max(...n);
    s += i.top_quarter * Math.max(l - 15, 0),
    s += i.top_half * Math.max(l - 10, 0),
    s += i.height * l;
    let h = 0;
    for (let t of a) {
        let e = !0;
        for (let i = 0; i <= t.length; i++)
            0 != t[i] != e && (h++,
            e = 0 != t[i])
    }
    s += i.row_transitions * h;
    let u = 0;
    for (let t = 0; t < 10; t++)
        for (let e = n[t] - 2; e >= 0; e--)
            if (0 == a[19 - e][t]) {
                u += Math.min(6, n[t] - e - 1)
            }
    s += i.covered_cells * u + u * u * i.covered_cells_sq;
    let p = 0
      , k = 0;
    for (let t = 19; t > 19 - l; t--)
        for (let e = 0; e < 10; e++) {
            let i = 19 - t;
            0 != a[t][e] || i >= n[e] || (e > 1 && n[e - 1] <= i - 1 && n[e - 2] <= i ? k += 1 : e < 8 && n[e + 1] <= i - 1 && n[e + 2] <= i ? k += 1 : p += 1)
        }
    s += i.overhang_cells * k + i.overhang_cells_sq * k * k,
    s += i.cavity_cells * p + i.cavity_cells_sq * p * p;
    let m = 0;
    for (let t = 1; t < a[0].length; t++)
        n[t] <= n[m] && (m = t);
    s += t.stats.CLEAN_RECIEVED * i.tank[0] + t.stats.MESSY_RECIEVED * i.tank[1];
    let f = 0;
    for (let t = 19 - n[m]; t >= 0; t--) {
        let e = !1;
        for (let i = 0; i < 10; i++)
            i != m && 0 == a[t][i] && (e = !0);
        if (e)
            break;
        f++
    }
    s += i.well_depth * Math.min(f, i.max_well_depth),
    f > 0 && (s += i.well_column[m]),
    t.isBack2Back && (s += i.back_to_back);
    let d = -1
      , b = -1
      , g = 1;
    0 != m && (g = 0);
    for (let t = 0; t < 10; t++) {
        if (t == m)
            continue;
        let e = Math.abs(n[g] - n[t]);
        d += e,
        b += e * e,
        g = t
    }
    return s += i.bumpiness * d + i.bumpiness_sq * d * d,
    s += i.clear1 * t.stats.CLEAR1,
    s += i.clear2 * t.stats.CLEAR2,
    s += i.clear3 * t.stats.CLEAR3,
    s += i.clear4 * t.stats.CLEAR4,
    s += i.mini_tspin1 * t.stats.TSMS,
    s += i.tspin1 * t.stats.TSS,
    s += i.tspin2 * t.stats.TSD,
    s += i.tspin3 * t.stats.TST,
    s += i.perfect_clear * t.stats.PC,
    s += i.wasted_t * t.stats.WASTE,
    s += i.b2b_clear * t.stats.B2B,
    s += i.combo_garbage * t.stats.COMBO,
    t.stats.SPIKE > 7 && (s += i.spike * t.stats.SPIKE),
    s
}
;
let game = new Game;
class Node {
    constructor(t=null, e=null, i=null, s=0) {
        this.parent = t,
        this.children = [],
        this.orphans = [],
        this.move = i,
        this.state = e,
        this.value = s,
        this.dead = !1
    }
}
class Bot {
    constructor() {
        this.settings = {
            weights: {
                back_to_back: 52,
                bumpiness: -24,
                bumpiness_sq: -7,
                row_transitions: -5,
                height: -39,
                top_half: -150,
                top_quarter: -511,
                cavity_cells: -173,
                cavity_cells_sq: -3,
                overhang_cells: -34,
                overhang_cells_sq: -1,
                covered_cells: -17,
                covered_cells_sq: -1,
                tslot: [8, 148, 192, 407],
                well_depth: 57,
                max_well_depth: 17,
                well_column: [-30, -50, 20, 50, 60, 60, 50, 20, -50, -30],
                wasted_t: -152,
                b2b_clear: 104,
                clear1: -143,
                clear2: -100,
                clear3: -58,
                clear4: 390,
                tspin1: 121,
                tspin2: 410,
                tspin3: 602,
                mini_tspin1: -158,
                mini_tspin2: -93,
                perfect_clear: 999,
                combo_garbage: 200,
                tank: [17, 4],
                spike: 115
            },
            useHold: !0,
            botIters: 1e4,
            cheesyCutoff: -1e3
        },
        this.state = null,
        this.root = null,
        this.iters = 0,
        this.calculating = !1
    }
    loadWeights(t) {
        this.settings.weights = {
            back_to_back: t[0],
            bumpiness: t[1],
            bumpiness_sq: t[2],
            row_transitions: t[3],
            height: t[4],
            top_half: t[5],
            top_quarter: t[6],
            cavity_cells: t[7],
            cavity_cells_sq: t[8],
            overhang_cells: t[9],
            overhang_cells_sq: t[10],
            covered_cells: t[11],
            covered_cells_sq: t[12],
            tslot: [t[13], t[14], t[15], t[16]],
            well_depth: t[17],
            max_well_depth: t[18],
            well_column: [t[19], t[20], t[21], t[22], t[23], t[24], t[25], t[26], t[27], t[28]],
            wasted_t: t[29],
            b2b_clear: t[30],
            clear1: t[31],
            clear2: t[32],
            clear3: t[33],
            clear4: t[34],
            tspin1: t[35],
            tspin2: t[36],
            tspin3: t[37],
            mini_tspin1: t[38],
            mini_tspin2: t[39],
            perfect_clear: t[40],
            combo_garbage: t[41],
            tank: [t[42], t[43]],
            spike: t[44]
        }
    }
    loadState(t, e=!1) {
        this.state = e ? copyState(t) : TFstate(t),
        this.root = new Node(null,copyState(this.state)),
        this.expandNode(this.root),
        this.backprop(this.root)
    }
    async think() {
        if (null != this.state && this.calculating)
            for (this.iters = 0; this.iters < this.settings.botIters; ) {
                if (this.iters % 50 == 0 && await new Promise(t => setTimeout(t, 0)),
                !this.calculating)
                    return;
                this.iters++;
                let t = this.selectNode(this.root);
                this.expandNode(t),
                this.backprop(t)
            }
    }
    getMoves() {
        this.root.children = this.root.children.concat(this.root.orphans);
        
        return this.root.children.map(child => {
            // 盤面の数値をミノの種類に変換
            const convertedBoard = child.state.matrix.map(row => 
                row.map(cell => {
                    if (cell === 0) return null;
                    if (cell === 8) return "G";
                    return pIndex[cell - 1];  // 1-indexedなので-1する
                })
            );
            
            // ネクストミノとホールドの情報を変換
            const nextQueue = child.state.queue.map(piece => pIndex[piece.id]);
            const holdPiece = child.state.hold && child.state.hold.id !== undefined ? pIndex[child.state.hold.id] : null;
            
            // 使用したミノの情報を取得
            const usedPieceId = child.move.piece.id;
            const originalQueue = this.state.queue.map(piece => pIndex[piece.id]);
            const originalHold = this.state.hold && this.state.hold.id !== undefined ? pIndex[this.state.hold.id] : null;
            
            // 使用したミノに基づいて、更新されたネクストとホールドを計算
            let updatedNext = [...originalQueue];
            let updatedHold = originalHold;
            
            if (usedPieceId === this.state.queue[0].id) {
                // 現在のミノを使用した場合
                updatedNext.shift();
            } else if (this.state.hold && usedPieceId === this.state.hold.id) {
                // ホールドを使用した場合
                updatedHold = pIndex[this.state.queue[0].id];
                updatedNext.shift();
            } else if (this.state.queue.length > 1 && usedPieceId === this.state.queue[1].id) {
                // ホールドに入れて次のミノを使用した場合
                updatedHold = pIndex[this.state.queue[0].id];
                updatedNext.splice(0, 2);
            }
            
            return {
                move: FTmove(child.move, child.state.action),
                board: convertedBoard,
                value: child.value,
                action: child.state.action,
                next: updatedNext,
                hold: updatedHold
            };
        });
    }    
    processMove(t) {
        t = TFmove(t);
        let e = game.ai_nextState(this.state, t);
        this.loadState(e, !0)
    }
    addPieceToQueue(t) {
        this.state.queue.push(new Block(reversePIndex[t]))
    }
    expandNode(t) {
        let e = t.state;
        if (0 == e.queue.length)
            return;
        let i = game.ai_legalMoves(e.matrix, e.queue[0]);
        this.settings.useHold && (null == e.hold.id ? e.queue.length >= 2 && (i = i.concat(game.ai_legalMoves(e.matrix, e.queue[1]))) : i = i.concat(game.ai_legalMoves(e.matrix, e.hold)));
        for (let s of i) {
            let i = game.ai_nextState(e, s)
              , a = new Node(t,i,s,game.getValue(i, s, this.settings.weights));
            t.children.push(a)
        }
    }
    selectNode(t) {
        for (; t.children.length > 0; ) {
            let e = t.children.length
              , i = []
              , s = 0;
            for (let t = 0; t < e; t++)
                s += 1 / (t + 1) ** 2,
                i[t] = 1 / (t + 1) ** 2;
            let a = 0
              , o = Math.random() * s;
            for (let t = 0; t < i.length; t++)
                (o -= i[t]) < 0 && (a = t,
                t = i.length);
            t = t.children[a]
        }
        return t
    }
    backprop(t) {
        for (; null != t; )
            t.children.length > 0 && (t.parent,
            t.children.sort( (t, e) => t.value < e.value ? 1 : -1),
            t.value = t.children[0].value),
            t = t.parent
    }
    frontprop(t, e) {
        let i = t
          , s = (t.goal,
        []);
        for (; null != i && e > 0 && (e--,
        0 != i.children.length); )
            i = i.children[0],
            s.push(i.move);
        return s
    }
}
let bot = new Bot;
function start() {
    postMessage({
        type: "info",
        name: "freybot",
        author: "freyhoe",
        version: "0.0",
        features: ["uses hold", "uses previews", "uses spins", "uses cat power"]
    })
}

// AI側のログ関数
function aiLog(message) {
  console.log(`[AI] ${message}`);
}

/**
 * テトリミノの形状定義
 * 中心点(0,0)からの相対座標で4つのブロック位置を定義
 */
const tetriminoShapes = {
    "I": {
        "north": [[0,0], [-1,0], [1,0], [2,0]],
        "east":  [[0,0], [0,1], [0,-1], [0,-2]],
        "south": [[0,0], [-2,0], [-1,0], [1,0]],
        "west":  [[0,0], [0,2], [0,1], [0,-1]]
    },
    "O": {
        "north": [[0,0], [1,0], [0,1], [1,1]],
        "east":  [[0,0], [1,0], [0,-1], [1,-1]],
        "south": [[0,0], [-1,0], [0,-1], [-1,-1]],
        "west":  [[0,0], [0,1], [-1,0], [-1,1]]
    },
    "T": {
        "north": [[0,0], [-1,0], [1,0], [0,1]],
        "east":  [[0,0], [0,1], [1,0], [0,-1]],
        "south": [[0,0], [-1,0], [1,0], [0,-1]],
        "west":  [[0,0], [0,1], [-1,0], [0,-1]]
    },
    "J": {
        "north": [[0,0], [-1,0], [1,0], [-1,1]],
        "east":  [[0,0], [0,1], [0,-1], [1,1]],
        "south": [[0,0], [-1,0], [1,0], [1,-1]],
        "west":  [[0,0], [0,1], [0,-1], [-1,-1]]
    },
    "L": {
        "north": [[0,0], [-1,0], [1,0], [1,1]],
        "east":  [[0,0], [0,-1], [0,1], [1,-1]],
        "south": [[0,0], [-1,0], [1,0], [-1,-1]],
        "west":  [[0,0], [0,-1], [0,1], [-1,1]]
    },
    "S": {
        // Sミノの形状
        "north": [[0,0], [1,0], [0,1], [-1,1]],
        "east":  [[0,0], [0,1], [1,0], [1,-1]],
        "south": [[0,0], [-1,0], [0,-1], [1,-1]],
        "west":  [[0,0], [0,-1], [-1,0], [-1,1]]
    },
    "Z": {
        // Zミノの形状
        "north": [[0,0], [-1,0], [0,1], [1,1]],
        "east":  [[0,0], [1,0], [0,1], [1,-1]],
        "south": [[0,0], [1,0], [0,-1], [-1,-1]],
        "west":  [[0,0], [-1,0], [0,-1], [-1,1]]
    }
};

/**
 * ミノの中心座標から4つのブロックの絶対座標を計算して追加する
 * @param {Object} move - AIが提案した移動情報
 * @returns {Object} ブロック位置情報が追加された移動情報
 */
function addAbsoluteBlockPositions(move) {
    const pieceType = move.location.type;
    const orientation = move.location.orientation;
    const centerX = move.location.x;
    const centerY = move.location.y;
    
    // ピースの形状を取得
    const shape = tetriminoShapes[pieceType][orientation];
    
    // 各ブロックの絶対座標を計算
    const blockPositions = shape.map(([relX, relY]) => [centerX + relX, centerY + relY])
        .sort(([x1, y1], [x2, y2]) => {
            // まずx座標で比較、同じならy座標で比較
            if (x1 !== x2) return x1 - x2;
            return y1 - y2;
        });
    
    // x座標とy座標の最小値と最大値を計算
    const xValues = blockPositions.map(([x, _]) => x);
    const yValues = blockPositions.map(([_, y]) => y);
    
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    
    // 各ブロックの位置をログに表示
    const blockPositionsStr = blockPositions.map(pos => `(${pos[0].toString().padStart(2)},${pos[1].toString().padStart(2)})`).join('  ');
    
    // 元のmoveオブジェクトに情報を追加
    const enhancedMove = {
        ...move,
        location: {
            ...move.location,
            range: {
                x: `${xMin+1}-${xMax+1}`,
                y: `${yMin+1}-${yMax+1}`
            },
            blockPositions: blockPositions
        },
    };
    
    return enhancedMove;
}

/**
 * ゲームデータの検証を行う関数
 * @param {Object} gameData - 検証するゲームデータ
 * @returns {Object} 検証結果 {isValid: boolean, message: string, convertedData?: Object}
 */
function validateGameData(gameData) {
    // ボードデータの検証
    if (!gameData || !gameData.board || !Array.isArray(gameData.board)) {
        return { isValid: false, message: "ボードデータが無効です" };
    }
    
    const boardData = gameData.board;
    
    // ボードの高さをチェック（20行であることを確認）
    if (boardData.length !== 20) {
        return { 
            isValid: false, 
            message: `ボードの高さが不正です: ${boardData.length}行（期待値: 20行）` 
        };
    }
    
    // ボードの幅と値をチェック
    for (let i = 0; i < boardData.length; i++) {
        // 行が配列かチェック
        if (!Array.isArray(boardData[i])) {
            return { 
                isValid: false, 
                message: `ボードの${i}行目が配列ではありません` 
            };
        }
        
        // 幅をチェック
        if (boardData[i].length !== 10) {
            return { 
                isValid: false, 
                message: `ボードの${i}行目の幅が不正です: ${boardData[i].length}（期待値: 10）` 
            };
        }
        
        // 各セルの値をチェック
        for (let j = 0; j < boardData[i].length; j++) {
            const cell = boardData[i][j];
            if (!["I", "O", "T", "L", "J", "S", "Z", "G", null].includes(cell)) {
                return { 
                    isValid: false, 
                    message: `ボードの[${i},${j}]の値が不正です: "${cell}"（有効値: null, "I", "O", "T", "L", "J", "S", "Z", "G")` 
                };
            }
        }
    }
    
    // キューとホールドのチェック
    if (!gameData.queue || !Array.isArray(gameData.queue)) {
        return { isValid: false, message: "キューデータが無効です" };
    }
    
    // キューのサイズチェック（3以上であることを確認）
    if (gameData.queue.length < 3) {
        return { 
            isValid: false, 
            message: `キューのサイズが不足しています: ${gameData.queue.length}個（最小必要数: 3個）` 
        };
    }
    
    // キューの各ピースをチェック
    for (let i = 0; i < gameData.queue.length; i++) {
        if (!["I", "O", "T", "L", "J", "S", "Z"].includes(gameData.queue[i])) {
            return { 
                isValid: false, 
                message: `キューの${i}番目の値が不正です: "${gameData.queue[i]}"（有効値: ${["I", "O", "T", "L", "J", "S", "Z"].join(', ')})` 
            };
        }
    }
    
    // ホールドのチェック（nullまたは有効なピースタイプ）
    if (gameData.hold !== null && gameData.hold !== undefined && !["I", "O", "T", "L", "J", "S", "Z"].includes(gameData.hold)) {
        return { 
            isValid: false, 
            message: `ホールドの値が不正です: "${gameData.hold}"（有効値: null または ${["I", "O", "T", "L", "J", "S", "Z"].join(', ')})` 
        };
    }
    
    // コンボとB2Bのデフォルト値設定
    const combo = gameData.combo !== undefined ? gameData.combo : 0;
    const back_to_back = gameData.back_to_back !== undefined ? gameData.back_to_back : false;
    
    // 変換後のデータを返す
    return {
        isValid: true,
        message: "検証成功",
        convertedData: {
            board: boardData,
            queue: gameData.queue,
            hold: gameData.hold,
            combo: combo,
            back_to_back: back_to_back
        }
    };
}


onmessage = function(t) {
    let e = t.data;
    aiLog(`メッセージを受信: type=${e.type}`);
    
    switch (e.type) {
    case "rules":
        aiLog("ルール情報を受信、準備完了を通知します");
        postMessage({
            type: "ready"
        });
        break;
        
    case "start":
        aiLog("開始命令を受信、状態を読み込みます");
        bot.calculating = !1;

        const validationResult = validateGameData(e);
        if (!validationResult.isValid) {
            aiLog("error: "+ validationResult.message);
            return;
        }

        let t = {
            hold: e.hold,
            queue: e.queue,
            combo: e.combo,
            back_to_back: e.back_to_back,
            board: e.board
        };
        aiLog(`状態データ: hold=${t.hold}, queue長さ=${t.queue.length}, combo=${t.combo}, b2b=${t.back_to_back}`);
        aiLog("状態を読み込みます");
        bot.loadState(t);
        aiLog("計算を開始します");
        bot.calculating = !0;
        bot.think();
        break;
        
    case "suggest":
        aiLog("推奨手の要求を受信");
        bot.calculating = !1;
        const moves = bot.getMoves();
        aiLog(`計算された手: ${moves.length}個, iters cnt: ${bot.iters + 1}`);
        if (moves.length > 0) {
            aiLog(`最善手: ${JSON.stringify(moves[0].move)}`);
            aiLog(`評価値: ${moves[0].value}`);
            if (moves[0].action) {
                aiLog(`アクション: ${moves[0].action}`);
            }
            if (moves[0].next) {
                aiLog(`次のミノ: ${JSON.stringify(moves[0].next)}`);
            }
            if (moves[0].hold !== null) {
                aiLog(`ホールド: ${moves[0].hold}`);
            }
        }
        postMessage({
            type: "suggestion",
            moves: moves,
            move_info: {
                rollouts: bot.iters + 1
            }
        });
        break;
        
    case "play":
        aiLog(`手の適用を受信: ${JSON.stringify(e.move)}`);
        bot.calculating = !1;
        aiLog("手を処理します");
        bot.processMove(e.move);
        aiLog("計算を再開します");
        bot.calculating = !0;
        bot.think();
        break;
        
    case "new_piece":
        aiLog(`新しいピースを受信: ${e.piece}`);
        bot.addPieceToQueue(e.piece);
        aiLog("キューにピースを追加しました");
        break;
        
    case "stop":
    case "quit":
        aiLog("停止命令を受信");
        bot.calculating = !1;
        break;
        
    default:
        aiLog(`不明なメッセージタイプ: ${e.type}`);
    }
}
,
start();
