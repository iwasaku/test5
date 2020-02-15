console.log = function () { };  // ログを出す時にはコメントアウトする

const SCREEN_WIDTH = 416;              // スクリーン幅
const SCREEN_HEIGHT = 250;              // スクリーン高さ
const SCREEN_CENTER_X = SCREEN_WIDTH / 2;   // スクリーン幅の半分
const SCREEN_CENTER_Y = SCREEN_HEIGHT / 2;  // スクリーン高さの半分

const FONT_FAMILY = "'Press Start 2P','Meiryo',sans-serif";
const ASSETS = {
    "player": "./resource/2A.png",
    "hit": "./resource/2H.png",
    "cuke": "./resource/2B.png", // 胡瓜
    "cup": "./resource/2I.png", // カップうどん
    "home_door": "./resource/2P.png",   // 家のドア
    "shop_door": "./resource/2E.png",   // 店のドア
    "udon": "./resource/2G.png",    // 天ぷらうどん

    "bg": "./resource/bg.png",  // 背景
};

// 定義
const PL_STATUS = defineEnum({
    INIT: {
        value: 0,
        isStart: Boolean(0),
        isDead: Boolean(0),
        string: 'init'
    },
    START: {
        value: 1,
        isStart: Boolean(1),
        isDead: Boolean(0),
        string: 'stand'
    },
    DEAD: {
        value: 2,
        isStart: Boolean(0),
        isDead: Boolean(1),
        string: 'dead'
    },
});
const SCRN_WIDTH = 13;// スクリーン幅（キャラ数）
const SCRN_HEIGHT = 6;// スクリーン高さ（キャラ数）
const FPS = 60; // 60フレ

// 落下物の配列は13個用意するけど、実際に使うのは1〜11で、0と12は使用不可
let foSprite = new Array(13); // 落下物のスプライト
let foYpos = new Array(13); // 落下物(fallen object)のY座標
let foYdly = new Array(13); // 落下物の落下遅延値（大きいほど遅い）
let foYcnt = new Array(13); // 落下物の落下遅延カウンタ
let foKind = new Array(13); // 落下物の種別 1:胡瓜 2:うどん
let foCount = 0; // 落下物発生回数
let foYdlyOfs = 0; // 落下物全体落下遅延値（大きいほど遅い）

let shopCtrlCount = 0; //開店／準備中をコントロールするカウンタ 
let shopStatus = true; //true:開店 false:準備中
let homeCtrlCount = 0;
let homeStatus = true; //true:開 false:閉
// 仮想画面
//new Array(SCRN_WIDTH * SCRN_HEIGHT);
// 0:空 1:胡瓜 2:カップ麺
let vScreen = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];
const xPosTable = [16 + 32 * 0, 16 + 32 * 1, 16 + 32 * 2, 16 + 32 * 3, 16 + 32 * 4, 16 + 32 * 5, 16 + 32 * 6, 16 + 32 * 7, 16 + 32 * 8, 16 + 32 * 9, 16 + 32 * 10, 16 + 32 * 11, 16 + 32 * 12];
const yPosTable = [16 + 32 * 0, 16 + 32 * 1, 16 + 32 * 2, 16 + 32 * 3, 16 + 32 * 4, 16 + 32 * 5];
let scoreBase = 1; // 基準スコア
let cuCount = 0; // カップうどん獲得回数
let score = 0; // スコア
let myXpos = 0;  // 自キャラX座標
let frame = 0;
let delayOffset = 0;

let group0 = null;
let group1 = null;
let group2 = null;
let player = null;
let homeDoor = null;
let shopDoor = null;
let shopUdon = null;
tm.main(function () {
    // アプリケーションクラスを生成
    var app = tm.display.CanvasApp("#world");
    app.resize(SCREEN_WIDTH, SCREEN_HEIGHT);    // サイズ(解像度)設定
    app.fitWindow();                            // 自動フィッティング有効
    app.background = "rgba(77, 136, 255, 1.0)"; // 背景色
    app.fps = FPS;                              // フレーム数

    var loading = tm.ui.LoadingScene({
        assets: ASSETS,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    });

    // 読み込み完了後に呼ばれるメソッドを登録
    loading.onload = function () {
        app.replaceScene(LogoScene());
    };

    // ローディングシーンに入れ替える
    app.replaceScene(loading);

    // 実行
    app.run();
});

/*
 * ロゴ
 */
tm.define("LogoScene", {
    superClass: "tm.app.Scene",

    init: function () {
        this.superInit();
        this.fromJSON({
            children: [
                {
                    type: "Label", name: "logoLabel",
                    x: SCREEN_CENTER_X,
                    y: 320,
                    fillStyle: "#888",
                    fontSize: 64,
                    fontFamily: FONT_FAMILY,
                    text: "LOGO",
                    align: "center",
                },
            ]
        });
        this.localTimer = 0;
    },

    update: function (app) {
        // 時間が来たらタイトルへ
        //        if(++this.localTimer >= 5*app.fps)
        this.app.replaceScene(TitleScene());
    }
});

/*
 * タイトル
 */
tm.define("TitleScene", {
    superClass: "tm.app.Scene",

    init: function () {
        this.superInit();
        this.fromJSON({
            children: [
                {
                    type: "Label", name: "titleLabel",
                    x: SCREEN_CENTER_X,
                    y: SCREEN_CENTER_Y,
                    fillStyle: "#fff",
                    fontSize: 32,
                    fontFamily: FONT_FAMILY,
                    text: "UDN",
                    align: "center",
                },
                {
                    type: "FlatButton", name: "startButton",
                    init: [
                        {
                            text: "START",
                            fontFamily: FONT_FAMILY,
                            fontSize: 16,
                            width: 128,
                            height: 32,
                            bgColor: "hsl(240, 0%, 70%)",
                        }
                    ],
                    x: SCREEN_CENTER_X,
                    y: SCREEN_CENTER_Y + 64,
                },
            ]
        });
        this.localTimer = 0;

        var self = this;
        this.startButton.onpointingstart = function () {
            self.app.replaceScene(GameScene());
        };
    },

    update: function (app) {
        app.background = "rgba(0, 0, 0, 1.0)"; // 背景色
    }
});

/*
 * ゲーム
 */
tm.define("GameScene", {
    superClass: "tm.app.Scene",

    init: function () {
        this.superInit();

        group0 = tm.display.CanvasElement().addChildTo(this);   // 背景、ドア
        group1 = tm.display.CanvasElement().addChildTo(this);   // 落下物
        group2 = tm.display.CanvasElement().addChildTo(this);   // プレイヤー

        this.bg = tm.display.Sprite("bg", SCREEN_WIDTH, SCREEN_HEIGHT * 1.005).addChildTo(group0);
        this.bg.setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y + 1);
        homeDoor = new HomeDoorSprite().addChildTo(group0);
        shopUdon = new ShopUdonSprite().addChildTo(group0);
        shopDoor = new ShopDoorSprite().addChildTo(group0);
        for (let ii = 1; ii <= 11; ii++) {
            foSprite[ii] = new FoSprite(ii, "cuke").addChildTo(group1);
        }
        player = new MySprite("player").addChildTo(group2);

        this.fromJSON({
            children: [
                {
                    type: "Label", name: "nowScoreLabel",
                    x: SCREEN_WIDTH - 16,
                    y: 16,
                    fillStyle: "#000",
                    shadowColor: "#000",
                    shadowBlur: 0,
                    fontSize: 16,
                    fontFamily: FONT_FAMILY,
                    text: "0",
                    align: "right",
                },
                {
                    type: "Label", name: "gameOverLabel",
                    x: SCREEN_CENTER_X,
                    y: SCREEN_CENTER_Y - 32 - 16,
                    fillStyle: "#000",
                    shadowColor: "#000",
                    shadowBlur: 0,
                    fontSize: 16,
                    fontFamily: FONT_FAMILY,
                    text: "G A M E  O V E R",
                    align: "center",
                },
                {
                    type: "FlatButton", name: "tweetButton",
                    init: [
                        {
                            text: "TWEET",
                            fontFamily: FONT_FAMILY,
                            fontSize: 16,
                            width: 84,
                            height: 32,
                            bgColor: "hsl(205, 81%, 63%)",
                        }
                    ],
                    x: SCREEN_CENTER_X + 32 * 2 - 4,
                    y: SCREEN_CENTER_Y + 32 * 3 + 8,
                    alpha: 0.0,
                },
                {
                    type: "FlatButton", name: "restartButton",
                    init: [
                        {
                            text: "RESTART",
                            fontFamily: FONT_FAMILY,
                            fontSize: 16,
                            width: 120,
                            height: 32,
                            bgColor: "hsl(240, 0%, 70%)",
                        }
                    ],
                    x: SCREEN_CENTER_X - 32 * 2 + 4,
                    y: SCREEN_CENTER_Y + 32 * 3 + 8,
                    alpha: 0.0,
                },
                {
                    type: "FlatButton", name: "leftButton",
                    init: [
                        {
                            text: "◀︎",
                            fontFamily: FONT_FAMILY,
                            fontSize: 32,
                            width: 72,
                            height: 48,
                            bgColor: "hsl(0, 100%, 50%)",
                        }
                    ],
                    x: SCREEN_CENTER_X - 32 * 6 + 20,
                    y: SCREEN_CENTER_Y + 32 * 3 - 4,
                    alpha: 1.0,
                },
                {
                    type: "FlatButton", name: "rightButton",
                    init: [
                        {
                            text: "▶︎",
                            fontFamily: FONT_FAMILY,
                            fontSize: 32,
                            width: 72,
                            height: 48,
                            bgColor: "hsl(0, 100%, 50%)",
                        }
                    ],
                    x: SCREEN_CENTER_X + 32 * 6 - 20,
                    y: SCREEN_CENTER_Y + 32 * 3 - 4,
                    alpha: 1.0,
                },
            ]
        });

        this.tweetButton.sleep();
        this.restartButton.sleep();

        var self = this;
        this.restartButton.onpointingstart = function () {
            self.app.replaceScene(GameScene());
        };

        this.leftButton.sleep();
        this.leftButton.onpointingstart = function () {
            left();
        };

        this.rightButton.sleep();
        this.rightButton.onpointingstart = function () {
            right();
        };

        this.buttonAlpha = 0.0;

        frame = 0;
        myXpos = 0;
        scoreBase = 1;
        cuCount = 0;
        score = 0;
        foYdlyOfs = 30;
        shopCtrlCount = 0;
        shopStatus = true;
        homeCtrlCount = 0;
        homeStatus = true;

        // 落下物初期化
        for (let ii = 1; ii <= 11; ii++) {
            foYpos[ii] = 0;
            foYdly[ii] = 0;
            foYcnt[ii] = foYdly[ii];
            foKind[ii] = 1;
        }
        foCount = 0;

        // 仮想スクリーン初期化
        for (let yy = 0; yy < SCRN_HEIGHT; yy++) {
            for (let xx = 0; xx < SCRN_WIDTH; xx++) {
                setVScreen(xx, yy, 0);
            }
        }

        // 初期状態作成
        for (let ii = 0; ii < 1000; ii++) {
            foMove();
        }
    },

    // main loop
    update: function (app) {

        if (!player.status.isDead) {
            if (!player.status.isStart) {
                this.gameOverLabel.setAlpha(0.0);
                this.leftButton.setAlpha(0.4);
                this.rightButton.setAlpha(0.4);

                this.leftButton.wakeUp();
                this.rightButton.wakeUp();
                player.status = PL_STATUS.START;
            }

            checkHomeStatus();
            checkShopStatus();
            foMove();
            checkColi();
            this.nowScoreLabel.text = score;
            if (++frame % FPS === 0) calcfoYdlyOfs();

        } else {
            var self = this;
            // tweet ボタン
            this.tweetButton.onclick = function () {
                var twitterURL = tm.social.Twitter.createURL({
                    type: "tweet",
                    text: "UDN スコア：" + self.nowScoreLabel.text,
                    hashtags: ["ネムレス", "NEMLESSS"],
                    url: "https://iwasaku.github.io/test5/UDN/",
                });
                window.open(twitterURL);
            };

            this.leftButton.sleep();
            this.rightButton.sleep();

            this.buttonAlpha += 0.05;
            if (this.buttonAlpha > 1.0) {
                this.buttonAlpha = 1.0;
            }
            this.gameOverLabel.setAlpha(this.buttonAlpha);
            this.tweetButton.setAlpha(this.buttonAlpha);
            this.restartButton.setAlpha(this.buttonAlpha);
            if (this.buttonAlpha > 0.7) {
                this.tweetButton.wakeUp();
                this.restartButton.wakeUp();
            }
        }
    }
});

/*
 * Player
 */
tm.define("MySprite", {
    superClass: "tm.app.Sprite",

    init: function (sprName) {
        this.superInit(sprName, 32, 32);
        this.direct = '';
        this.setInteractive(false);
        this.setBoundingType("rect");
        this.alpha = 1.0;
        this.x = xPosTable[myXpos];
        this.y = yPosTable[5];

        this.status = PL_STATUS.INIT;
    },

    update: function (app) {
        this.x = xPosTable[myXpos];
    },
});

/*
 * 落下物
 */
tm.define("FoSprite", {
    superClass: "tm.app.Sprite",

    init: function (xIndex, sprName) {
        this.superInit(sprName, 32, 32);
        this.direct = '';
        this.setInteractive(false);
        this.setBoundingType("rect");
        this.alpha = 1.0;
        this.xIndex = xIndex;
        this.x = xPosTable[xIndex];
        this.y = yPosTable[0];
    },

    update: function (app) {
        if (player.status.isDead) return;

        // 移動
        this.y = yPosTable[foYpos[this.xIndex]]
    },
});

/*
 * 家のドア
 */
tm.define("HomeDoorSprite", {
    superClass: "tm.app.Sprite",

    init: function () {
        this.superInit("home_door", 32, 32);
        this.direct = '';
        this.setInteractive(false);
        this.setBoundingType("rect");
        this.alpha = 1.0;
        this.x = xPosTable[0];
        this.y = yPosTable[5];
    },

    update: function (app) {
        if (homeStatus) this.alpha = 0.0;
        else this.alpha = 1.0;
    },
});

/*
 * 店のドア
 */
tm.define("ShopDoorSprite", {
    superClass: "tm.app.Sprite",

    init: function () {
        this.superInit("shop_door", 32, 32);
        this.direct = '';
        this.setInteractive(false);
        this.setBoundingType("rect");
        this.alpha = 1.0;
        this.x = xPosTable[12];
        this.y = yPosTable[5];
    },

    update: function (app) {
        if (shopStatus) this.alpha = 0.0;
        else this.alpha = 1.0;
    },
});
/*
 * 店のうどん
 */
tm.define("ShopUdonSprite", {
    superClass: "tm.app.Sprite",

    init: function () {
        this.superInit("udon", 32, 32);
        this.direct = '';
        this.setInteractive(false);
        this.setBoundingType("rect");
        this.alpha = 1.0;
        this.x = xPosTable[12];
        this.y = yPosTable[5];
    },

    update: function (app) {
    },
});

// 落下物移動
function foMove() {
    for (let xIndex = 1; xIndex <= 11; xIndex++) {
        if (--foYcnt[xIndex] > 0) continue;
        foYcnt[xIndex] = foYdly[xIndex];
        setVScreen(xIndex, foYpos[xIndex], 0);
        foYpos[xIndex]++;
        if (foYpos[xIndex] > 5) {
            foYpos[xIndex] = 0;
            foYdly[xIndex] = Math.floor(Math.random() * 30) + 25 + foYdlyOfs;
            if (foYdly[xIndex] < 5) foYdly[xIndex] = 5;
            foYcnt[xIndex] = foYdly[xIndex];
            if (++foCount > 30) {
                if (foKind[xIndex] === 1) {
                    foSprite[xIndex].remove();
                    foSprite[xIndex] = new FoSprite(xIndex, "cup").addChildTo(group1);
                }
                foKind[xIndex] = 2;
                foCount = 0;
            } else {
                if (foKind[xIndex] === 2) {
                    foSprite[xIndex].remove();
                    foSprite[xIndex] = new FoSprite(xIndex, "cuke").addChildTo(group1);
                }
                foKind[xIndex] = 1;
            }
        }
        setVScreen(xIndex, foYpos[xIndex], foKind[xIndex]);
    }
}

// 開店チェック
function checkShopStatus() {
    if (++shopCtrlCount >= 60 * 10) {
        shopCtrlCount = 0;
    }
    if (shopCtrlCount < 60 * 8) {
        shopStatus = true;
    } else if (shopCtrlCount < 60 * 10) {
        shopStatus = false;
    }
}

// 追い出しチェック
function checkHomeStatus() {
    homeStatus = false;
    if (myXpos != 0) {
        homeCtrlCount = 0;
    } else {
        if (++homeCtrlCount < 60 * 10) {
            homeStatus = true;
        } else {
            homeCtrlCount = 0;
            right();
        }
    }
}

function calcfoYdlyOfs() {
    if (--foYdlyOfs < -30) {
        foYdlyOfs = 30 - (++delayOffset * 2);
        if (foYdlyOfs < 0) foYdlyOfs = 0;
    }
}

// 当たり判定
function checkColi() {
    if (getVScreen(myXpos, 5) === 1) {
        // 胡瓜の場合
        // プレイヤーヒットキャラに差し替え
        player.remove();
        player = new MySprite("hit").addChildTo(group1);

        player.status = PL_STATUS.DEAD;
        foSprite[myXpos].alpha = 0.0;
    } else if (getVScreen(myXpos, 5) === 2) {
        // カップうどんの場合
        calcfoYdlyOfs();
        foYpos[myXpos] = 0;
        foYdly[myXpos] = Math.floor(Math.random() * 30) + 25 + foYdlyOfs;
        if (foYdly[myXpos] < 5) foYdly[myXpos] = 5;
        foYcnt[myXpos] = foYdly[myXpos];
        if (++foCount > 30) {
            if (foKind[myXpos] === 1) {
                foSprite[myXpos].remove();
                foSprite[myXpos] = new FoSprite(myXpos, "cup").addChildTo(group1);
            }
            foKind[myXpos] = 2;
            foCount = 0;
        } else {
            if (foKind[myXpos] === 2) {
                foSprite[myXpos].remove();
                foSprite[myXpos] = new FoSprite(myXpos, "cuke").addChildTo(group1);
            }
            foKind[myXpos] = 1;
        }
        setVScreen(myXpos, 5, 0);
        setVScreen(myXpos, 0, foKind[myXpos]);
        cuCount++;
    }
}

// 自キャラ左移動
function left() {
    if (player.status.isDead) return;
    if (myXpos <= 1) return;
    myXpos--;
    checkColi();
}

// 自キャラ右移動
function right() {
    if (player.status.isDead) return;
    if (myXpos === 11) {
        if (shopStatus === false) return;   // 準備中
    }

    myXpos++;
    checkColi();

    // 店到着判定
    if (myXpos < 12) return;
    calcfoYdlyOfs();
    score += scoreBase * (cuCount + 1);
    scoreBase = scoreBase * 2;
    if (scoreBase > 1024) scoreBase = 1024;
    cuCount = 0;
    shopCtrlCount = 0;
    homeCtrlCount = 0;
    myXpos = 0;
    foMove();
}

// 仮想画面へのアクセサ
function setVScreen(x, y, val) {
    vScreen[y][x] = val;
}
function getVScreen(x, y) {
    return vScreen[y][x];
}
