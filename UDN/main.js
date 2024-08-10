phina.globalize();

console.log = function () { };  // ログを出す時にはコメントアウトする

const SCREEN_WIDTH = 416;              // スクリーン幅
const SCREEN_HEIGHT = 250;              // スクリーン高さ
const SCREEN_CENTER_X = SCREEN_WIDTH / 2;   // スクリーン幅の半分
const SCREEN_CENTER_Y = SCREEN_HEIGHT / 2;  // スクリーン高さの半分

const FONT_FAMILY = "'Press Start 2P','Meiryo',sans-serif";
const ASSETS = {
    image: {
        "player": "./resource/2A.png",
        "hit": "./resource/2H.png",
        "cuke": "./resource/2B.png", // 胡瓜
        "cup": "./resource/2I.png", // カップうどん
        "home_door": "./resource/2P.png",   // 家のドア
        "shop_door": "./resource/2E.png",   // 店のドア
        "udon": "./resource/2G.png",    // 天ぷらうどん

        "bg": "./resource/bg.png",  // 背景
    },
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
let group3 = null;
let player = null;
let homeDoor = null;
let shopDoor = null;
let shopUdon = null;

phina.main(function () {
    var app = GameApp({
        startLabel: 'logo',
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        assets: ASSETS,
        fps: FPS,
        backgroundColor: 'black',

        // シーンのリストを引数で渡す
        scenes: [
            {
                className: 'LogoScene',
                label: 'logo',
                nextLabel: 'title',
            },
            {
                className: 'TitleScene',
                label: 'title',
                nextLabel: 'game',
            },
            {
                className: 'GameScene',
                label: 'game',
                nextLabel: 'game',
            },
        ]
    });

    // iOSなどでユーザー操作がないと音がならない仕様対策
    // 起動後初めて画面をタッチした時に『無音』を鳴らす
    app.domElement.addEventListener('touchend', function dummy() {
        var s = phina.asset.Sound();
        s.loadFromBuffer();
        s.play().stop();
        app.domElement.removeEventListener('touchend', dummy);
    });

    // fps表示
    //app.enableStats();

    // 実行
    app.run();
});

/*
* ローディング画面をオーバーライド
*/
phina.define('LoadingScene', {
    superClass: 'DisplayScene',

    init: function (options) {
        this.superInit(options);
        // 背景色
        var self = this;
        var loader = phina.asset.AssetLoader();

        // 明滅するラベル
        let label = phina.display.Label({
            text: "",
            fontSize: 64,
            fill: 'white',
        }).addChildTo(this).setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y);

        // ロードが進行したときの処理
        loader.onprogress = function (e) {
            // 進捗具合を％で表示する
            label.text = "{0}%".format((e.progress * 100).toFixed(0));
        };

        // ローダーによるロード完了ハンドラ
        loader.onload = function () {
            // Appコアにロード完了を伝える（==次のSceneへ移行）
            self.flare('loaded');
        };

        // ロード開始
        loader.load(options.assets);
    },
});

/*
 * ロゴ
 */
phina.define("LogoScene", {
    superClass: 'DisplayScene',

    init: function (option) {
        this.superInit(option);
        this.localTimer = 0;
    },

    update: function (app) {
        // フォント読み込み待ち
        var self = this;
        document.fonts.load('12px "Press Start 2P"').then(function () {
            self.exit();
        });
    }
});

/*
 * タイトル
 */
phina.define("TitleScene", {
    superClass: 'DisplayScene',

    init: function (option) {
        this.superInit(option);

        this.titleLabel = Label({
            text: "UDN",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#fff",
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y,
        }).addChildTo(this);
        this.startButton = Button({
            text: "START",
            fontSize: 16,
            fontFamily: FONT_FAMILY,
            fill: "#444",
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y + 64,
            cornerRadius: 8,
            width: 128,
            height: 32,
        }).addChildTo(this);

        this.localTimer = 0;

        var self = this;
        this.startButton.onpointstart = function () {
            self.exit();
        };
    },

    update: function (app) {
    }
});

/*
 * ゲーム
 */
phina.define("GameScene", {
    superClass: 'DisplayScene',

    init: function (option) {
        this.superInit(option);

        group0 = DisplayElement().addChildTo(this);   // 背景、ドア
        group1 = DisplayElement().addChildTo(this);   // 落下物
        group2 = DisplayElement().addChildTo(this);   // プレイヤー
        group3 = DisplayElement().addChildTo(this);   // ステータス

        this.bg = phina.display.Sprite("bg").addChildTo(group0);
        this.bg.setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y + 1).setSize(SCREEN_WIDTH, SCREEN_HEIGHT * 1.005);
        homeDoor = new HomeDoorSprite().addChildTo(group0);
        shopUdon = new ShopUdonSprite().addChildTo(group0);
        shopDoor = new ShopDoorSprite().addChildTo(group0);
        for (let ii = 1; ii <= 11; ii++) {
            foSprite[ii] = new FoSprite(ii, "cuke").addChildTo(group1);
        }
        player = new MySprite("player").addChildTo(group2);

        this.nowScoreLabel = Label({
            text: "0",
            fontSize: 16,
            fontFamily: FONT_FAMILY,
            align: "right",
            fill: "#000",
            shadow: "#000",
            shadowBlur: 0,
            x: SCREEN_WIDTH - 16,
            y: 16,
        }).addChildTo(group3);
        this.gameOverLabel = Label({
            text: "G A M E  O V E R",
            fontSize: 16,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#000",
            shadow: "#000",
            shadowBlur: 0,
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y - 32 - 16,
        }).addChildTo(group3);
        this.tweetButton = Button({
            text: "POST",
            fontSize: 16,
            fontFamily: FONT_FAMILY,
            fill: "#7575EF",  // ボタン色
            x: SCREEN_CENTER_X - (32 * 2 + 4),
            y: SCREEN_CENTER_Y + 32 * 3 + 8,
            cornerRadius: 8,
            width: 120,
            height: 32,
        }).addChildTo(group3);
        this.tweetButton.alpha = 0.0;
        this.restartButton = Button({
            text: "RESTART",
            fontSize: 16,
            fontFamily: FONT_FAMILY,
            fill: "#B2B2B2",
            x: SCREEN_CENTER_X + (32 * 2 + 4),
            y: SCREEN_CENTER_Y + 32 * 3 + 8,
            cornerRadius: 8,
            width: 120,
            height: 32,
        }).addChildTo(group3);
        this.restartButton.alpha = 0.0;
        this.leftButton = Button({
            text: "◀︎",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            fontColor: "#000",
            fill: "#fff",
            x: SCREEN_CENTER_X - 32 * 6 + 20,
            y: SCREEN_CENTER_Y + 32 * 3 - 4,
            width: 72,
            height: 48,
        }).addChildTo(group3);
        this.rightButton = Button({
            text: "▶︎",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            fontColor: "#000",
            fill: "#fff",
            x: SCREEN_CENTER_X + 32 * 6 - 20,
            y: SCREEN_CENTER_Y + 32 * 3 - 4,
            width: 72,
            height: 48,
        }).addChildTo(group3);

        this.tweetButton.sleep();
        this.restartButton.sleep();

        var self = this;
        this.tweetButton.onclick = function () {
            var twitterURL = phina.social.Twitter.createURL({
                type: "tweet",
                text: "UDN スコア：" + self.nowScoreLabel.text + "\n",
                hashtags: ["ネムレス", "NEMLESSS"],
                url: "https://iwasaku.github.io/test5/UDN/",
            });
            window.open(twitterURL);
        };

        this.restartButton.onpointstart = function () {
            self.exit();
        };

        this.leftButton.sleep();
        this.leftButton.onpointstart = function () {
            left();
        };

        this.rightButton.sleep();
        this.rightButton.onpointstart = function () {
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
                this.gameOverLabel.alpha = 0.0;
                this.leftButton.alpha = 0.5;
                this.rightButton.alpha = 0.5;

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
            this.leftButton.sleep();
            this.rightButton.sleep();

            this.buttonAlpha += 0.05;
            if (this.buttonAlpha > 1.0) {
                this.buttonAlpha = 1.0;
            }
            this.gameOverLabel.alpha = this.buttonAlpha;
            this.tweetButton.alpha = this.buttonAlpha;
            this.restartButton.alpha = this.buttonAlpha;
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
phina.define("MySprite", {
    superClass: "Sprite",

    init: function (sprName) {
        this.superInit(sprName);
        this.direct = '';
        this.setPosition(xPosTable[myXpos], yPosTable[5]).setSize(32, 32).setScale(1, 1);
        this.setInteractive(false);
        this.setBoundingType("rect");
        this.alpha = 1.0;

        this.status = PL_STATUS.INIT;
    },

    update: function (app) {
        this.x = xPosTable[myXpos];
    },
});

/*
 * 落下物
 */
phina.define("FoSprite", {
    superClass: "Sprite",

    init: function (xIndex, sprName) {
        this.superInit(sprName);
        this.direct = '';
        this.setPosition(xPosTable[xIndex], yPosTable[0]).setSize(32, 32).setScale(1, 1);
        this.setInteractive(false);
        this.setBoundingType("rect");
        this.alpha = 1.0;
        this.xIndex = xIndex;
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
phina.define("HomeDoorSprite", {
    superClass: "Sprite",

    init: function (option) {
        this.superInit("home_door");
        this.direct = '';
        this.setPosition(xPosTable[0], yPosTable[5]).setSize(32, 32).setScale(1, 1);
        this.setInteractive(false);
        this.setBoundingType("rect");
        this.alpha = 1.0;
    },

    update: function (app) {
        if (homeStatus) this.alpha = 0.0;
        else this.alpha = 1.0;
    },
});

/*
 * 店のドア
 */
phina.define("ShopDoorSprite", {
    superClass: "Sprite",

    init: function (option) {
        this.superInit("shop_door");
        this.direct = '';
        this.setPosition(xPosTable[12], yPosTable[5]).setSize(32, 32).setScale(1, 1);
        this.setInteractive(false);
        this.setBoundingType("rect");
        this.alpha = 1.0;
    },

    update: function (app) {
        if (shopStatus) this.alpha = 0.0;
        else this.alpha = 1.0;
    },
});
/*
 * 店のうどん
 */
phina.define("ShopUdonSprite", {
    superClass: "Sprite",

    init: function (option) {
        this.superInit("udon");
        this.direct = '';
        this.setPosition(xPosTable[12], yPosTable[5]).setSize(32, 32).setScale(1, 1);
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
