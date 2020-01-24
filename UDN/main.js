console.log = function () { };  // ログを出す時にはコメントアウトする
// viewportの設定
{
    let vpW = 480;
    let vpH = 320;
    let scrnH = screen.height;
    let scrnW = screen.width;
    let scrnS = 1.0;

    let aspectW = scrnW / scrnH;
    if (aspectW < 1.5) {
        scrnS = scrnW / vpW;
    } else {
        scrnS = scrnH / vpH;
    }

    document.getElementsByName('viewport')[0].setAttribute('content', 'width=' + vpW + ',initial-scale=' + scrnS + ',user-scalable=0');
}
const SCRN_WIDTH = 13;// スクリーン幅（キャラ数）
const SCRN_HEIGHT = 6;// スクリーン高さ（キャラ数）
const SCRN_BOTTOM = SCRN_WIDTH * (SCRN_HEIGHT - 1);// スクリーン下左端

let qYpos = new Array(11); // 胡瓜のY座標
let qYdly = new Array(11); // 胡瓜の落下遅延値（大きいほど遅い）
let qYcnt = new Array(11); // 胡瓜の落下遅延カウンタ
let qKind = new Array(11); // 2:胡瓜 3:うどん
let qCount = 0; // 胡瓜発生回数
let qYdlyOfs = 0; // 全体落下遅延値（大きいほど遅い）
let shopCtrlCount = 0; //開店／準備中をコントロールするカウンタ 
let shopStatus = true; //true:開店 false:準備中
let houseCtrlCounter = 0;
let scrn = new Array(SCRN_WIDTH * SCRN_HEIGHT); // 仮想画面
let goalCount = 0; // ゴール回数
let udnCount = 0; // うどん獲得回数
let score = 0; // スコア
let myXpos = 0;  // 自キャラX座標
let flag = false;   // ゲームの実行フラグ
var tID;

// ページ読み込み完了時の画面構築
const initpat =
    "2D2D2D2D2D2D2D2D2D2D2D2D2D" +
    "2J2D2D2D2D2D2D2D2D2D2D2D2K" +
    "2L2D2D2D2D2D2D2D2D2D2D2D2N" +
    "2L2D2D2D2D2D2D2D2D2D2D2D2N" +
    "2M2D2D2D2D2D2D2D2D2D2D2D2O" +
    "2P2D2D2D2D2D2D2D2D2D2D2D2G" +
    "2C2C2C2C2C2C2C2C2C2C2C2C2C";
function init0() {
    for (let ii = 0; ii < SCRN_WIDTH * (SCRN_HEIGHT + 1); ii++) {
        let H = initpat.charAt(ii * 2);
        let L = initpat.charAt(ii * 2 + 1);
        document.images[ii].src = "./resource/" + H + L + ".png";
    }
    start();
}

// ページ読み込み完了時の画面構築
const startpat =
    "2D2D2D2D2D2D2D2D2D2D2D2D2D" +
    "2J2D2D2D2D2D2D2D2D2D2D2D2K" +
    "2L2D2D2D2D2D2D2D2D2D2D2D2N" +
    "2L2D2D2D2D2D2D2D2D2D2D2D2N" +
    "2M2D2D2D2D2D2D2D2D2D2D2D2O" +
    "2A2D2D2D2D2D2D2D2D2D2D2D2G" +
    "2C2C2C2C2C2C2C2C2C2C2C2C2C";
function start() {
    if (flag === true) return;
    for (let ii = 0; ii < SCRN_WIDTH * (SCRN_HEIGHT + 1); ii++) {
        let H = startpat.charAt(ii * 2);
        let L = startpat.charAt(ii * 2 + 1);
        document.images[ii].src = "./resource/" + H + L + ".png";
    }
    myXpos = 0;
    goalCount = 0;
    udnCount = 0;
    score = 0;
    qYdlyOfs = 30;
    shopCtrlCount = 0;
    shopStatus = true;
    houseCtrlCounter = 0;
    for (let ii = 0; ii < 11; ii++) {
        qYpos[ii] = 0;
        qYdly[ii] = Math.floor(Math.random() * 120);
        qYdly[ii] = 0;
        qYcnt[ii] = qYdly[ii];
    }
    qCount = 0;
    for (let ii = 0; ii < SCRN_WIDTH * SCRN_HEIGHT; ii++) {
        scrn[ii] = 0;
    }

    for (let ii = 0; ii < 1000; ii++) {
        qMoves();
    }

    document.images[SCRN_WIDTH * 8 - 2].src = "./resource/2F.png";
    clearTweetButton();

    tID = setTimeout('main()', 16);
    flag = true;
}

// 胡瓜移動
function qMoves() {
    for (let xPos = 0; xPos < 11; xPos++) {
        if (--qYcnt[xPos] > 0) continue;
        qYcnt[xPos] = qYdly[xPos];
        document.images[SCRN_WIDTH * qYpos[xPos] + xPos + 1].src = "./resource/2D.png";
        scrn[SCRN_WIDTH * qYpos[xPos] + xPos + 1] = 0;
        qYpos[xPos]++;
        if (qYpos[xPos] > 5) {
            document.images[SCRN_BOTTOM + xPos + 1].src = "./resource/2D.png";
            qYpos[xPos] = 0;
            qYdly[xPos] = Math.floor(Math.random() * 50) + 10 + qYdlyOfs;
            qYcnt[xPos] = qYdly[xPos];
            if (++qCount > 30) {
                qKind[xPos] = 3;
                qCount = 0;
            } else {
                qKind[xPos] = 2;
            }
        }
        let tmpPng = qKind[xPos] == 2 ? "2B" : "2I";
        document.images[SCRN_WIDTH * qYpos[xPos] + xPos + 1].src = "./resource/" + tmpPng + ".png";
        scrn[SCRN_WIDTH * qYpos[xPos] + xPos + 1] = qKind[xPos];
    }
}

// 開店チェック
function checkStartStatus() {
    if (++shopCtrlCount >= 60 * 10) {
        shopCtrlCount = 0;
    }
    let tmpShopStatus = shopStatus;
    if (shopCtrlCount < 60 * 8) {
        shopStatus = true;
        if (tmpShopStatus != shopStatus) {
            document.images[SCRN_BOTTOM + 12].src = "./resource/2G.png";
        }
    } else if (shopCtrlCount < 60 * 10) {
        shopStatus = false;
        if (tmpShopStatus != shopStatus) {
            document.images[SCRN_BOTTOM + 12].src = "./resource/2E.png";
        }
    }
}

// 開店チェック
function checkShopStatus() {
    if (myXpos != 0) {
        return
    }
    if (++shopCtrlCount < 60 * 10) {
        return;
    }
    shopCtrlCount = 0;
    right();
}

// メイン
function main() {
    if (flag === false) {
        return;
    }
    checkStartStatus();
    checkShopStatus();
    qMoves();
    checkColi();
    // スコアを表示
    {
        let scStr = score.toString(10);
        let scStrLen = scStr.length;
        for (let idx = 0; idx < scStrLen; idx++) {
            let tmp = scStr.substring(idx, idx + 1);
            document.images[SCRN_WIDTH * 0 + (8 + (5 - scStrLen) + idx)].src = "./resource/0" + tmp + ".png";
        }
    }
    tID = setTimeout('main()', 16);
}

// 当たり判定
function checkColi() {
    if (scrn[SCRN_BOTTOM + myXpos] === 2) {
        document.images[SCRN_WIDTH * 2 + 2].src = "./resource/0G.png";
        document.images[SCRN_WIDTH * 2 + 3].src = "./resource/0A.png";
        document.images[SCRN_WIDTH * 2 + 4].src = "./resource/0M.png";
        document.images[SCRN_WIDTH * 2 + 5].src = "./resource/0E.png";
        document.images[SCRN_WIDTH * 2 + 7].src = "./resource/0O.png";
        document.images[SCRN_WIDTH * 2 + 8].src = "./resource/0V.png";
        document.images[SCRN_WIDTH * 2 + 9].src = "./resource/0E.png";
        document.images[SCRN_WIDTH * 2 + 10].src = "./resource/0R.png";

        document.images[SCRN_BOTTOM + myXpos].src = "./resource/2H.png";
        flag = false;
        document.images[SCRN_WIDTH * 8 - 2].src = "./resource/START.png";
        setTweetButton();
    } else if (scrn[SCRN_BOTTOM + myXpos] === 3) {
        let tmpXpos = myXpos - 1;
        if (qYdlyOfs > 0) qYdlyOfs--;
        document.images[SCRN_BOTTOM + myXpos].src = "./resource/2A.png";
        qYpos[tmpXpos] = 0;
        qYdly[tmpXpos] = Math.floor(Math.random() * 50) + 10 + qYdlyOfs;
        qYcnt[tmpXpos] = qYdly[tmpXpos];
        if (++qCount > 30) {
            qKind[tmpXpos] = 3;
            qCount = 0;
        } else {
            qKind[tmpXpos] = 2;
        }
        let tmpPng = qKind[tmpXpos] == 2 ? "2B" : "2I";
        document.images[SCRN_WIDTH * qYpos[tmpXpos] + tmpXpos + 1].src = "./resource/" + tmpPng + ".png";
        scrn[SCRN_BOTTOM + myXpos] = 0;
        scrn[SCRN_WIDTH * qYpos[tmpXpos] + tmpXpos + 1] = qKind[tmpXpos];
        udnCount++;
    }
}

// 自キャラ左移動
function left() {
    if (flag === false) return;
    if (myXpos <= 1) return;
    document.images[SCRN_BOTTOM + myXpos].src = "./resource/2D.png";
    myXpos--;
    document.images[SCRN_BOTTOM + myXpos].src = "./resource/2A.png";
    checkColi();
}

// 自キャラ右移動
function right() {
    if (flag === false) return;
    if (myXpos === 11) {
        if (shopStatus === false) return;   // 準備中
    }

    if (myXpos === 0) {
        document.images[SCRN_BOTTOM + myXpos].src = "./resource/2P.png";

    } else {
        document.images[SCRN_BOTTOM + myXpos].src = "./resource/2D.png";
    }
    myXpos++;
    document.images[SCRN_BOTTOM + myXpos].src = "./resource/2A.png";
    checkColi();
    if (myXpos < 12) return;
    if (qYdlyOfs > 0) qYdlyOfs--;
    goalCount++;
    score += goalCount * (udnCount + 1);
    udnCount = 0;
    shopCtrlCount = 0;
    document.images[SCRN_BOTTOM + myXpos].src = "./resource/2G.png";
    myXpos = 0;
    document.images[SCRN_BOTTOM + myXpos].src = "./resource/2A.png";
    qMoves();
}

// Tweetボタンを消す
function clearTweetButton() {
    let element = document.getElementById("tweet-area");
    if (element.hasChildNodes()) {
        // 子ノードを全削除
        for (let ii = element.childNodes.length - 1; ii >= 0; ii--) {
            element.removeChild(element.childNodes[ii]);
        }
    }
}

// Tweetボタンを表示する
function setTweetButton() {
    clearTweetButton(); //既存のボタン消す
    // オプションは公式よんで。
    twttr.widgets.createShareButton(
        "https://iwasaku.github.io/test5/UDN/index.html",   // url
        document.getElementById("tweet-area"),
        {
            size: "small", //ボタンサイズ
            text: "スコア＝" + score, // メッセージ
            hashtags: "ネムレス,NEMLESSS,NMUDN", // ハッシュタグ
        }
    );
}
