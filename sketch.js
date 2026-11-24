let bgImage; // 儲存背景圖片 bg/3.png
let bgOffsetX = 0; // 記錄背景水平捲動偏移量（負值代表背景往左移動）
let characterSprite; // 儲存角色一的精靈圖
let walkSprite; // 儲存角色一的走路精靈圖
let magicSprite; // 儲存角色一的施法精靈圖
let magicEffectSprite; // 儲存角色一的魔法特效精靈圖
let char2StopSprite; // 儲存角色二的待機精靈圖 2/stop/stop.png
let char2ActionSprite; // 儲存角色二的動作精靈圖 2/action/action.png

let characterX; // 儲存角色一目前的水平中心位置
let isWalking = false; // 記錄角色是否已切換為走路動畫
let facingDirection = 1; // 記錄角色朝向（1 為右，-1 為左）
let isCasting = false; // 記錄角色是否正在播放施法動畫
let magicStartFrame = 0; // 記錄施法動畫開始時的畫面計數
let magicDirection = 1; // 記錄施法時鎖定的方向
let spaceIsDown = false; // 記錄空白鍵是否已按住以避免重複觸發
let activeEffects = []; // 儲存目前畫面上飛行中的魔法特效

// 初學者桌球發球規則選擇題
const quizData = {
  question: "【桌球發球規則】發球時將球靜止放在攤平的手掌心後，應該怎麼把球拋起？",
  options: [
    "(A) 幾乎垂直向上拋起至少 16 公分",
    "(B) 直接朝對手方向往前丟出去",
    "(C) 不用拋球，直接拿著球揮拍擊球",
    "(D) 先讓球在自己桌上彈一下再發"
  ],
  answerIndex: 0, // 0 代表 (A)
  correctHint: "答對了！發球需垂直上拋至少 16 公分且不可旋轉拋球。",
  wrongHint: "再試一次！發球要「垂直向上拋起至少 16 公分」喔！"
};
let selectedOption = null; // 儲存玩家選擇的選項索引（0~3）
let quizOptionBounds = []; // 儲存各選項在畫布上的點擊區域

const frameCountInSprite = 10; // 設定精靈圖包含的影格數
const frameWidth = 139.5; // 設定每個影格的寬度（1395 除以 10）
const frameHeight = 196; // 設定每個影格的高度
const walkFrameCount = 9; // 設定走路精靈圖包含的影格數
const walkFrameWidth = 1246 / walkFrameCount; // 計算走路動畫每格的寬度
const walkFrameHeight = 198; // 設定走路動畫每格的高度
const magicFrameCount = 4; // 設定施法精靈圖包含的影格數
const magicFrameWidth = 1039 / magicFrameCount; // 計算施法動畫每格的寬度
const magicFrameHeight = 146; // 設定施法動畫每格的高度
const effectFrameCount = 5; // 設定魔法特效包含的影格數
const effectFrameWidth = 740 / effectFrameCount; // 計算魔法特效每格的寬度
const effectFrameHeight = 19; // 設定魔法特效每格的高度
const framesPerStep = 8; // 設定動畫每隔幾個畫面更新一格

// 角色二精靈圖規格設定
const char2StopFrameCount = 8; // 2/stop/stop.png 共 8 張
const char2StopFrameWidth = 699 / char2StopFrameCount; // 全寬 699 除以 8
const char2StopFrameHeight = 190; // 高度 190

const char2ActionFrameCount = 12; // 2/action/action.png 共 12 張
const char2ActionFrameWidth = 1627 / char2ActionFrameCount; // 全寬 1627 除以 12
const char2ActionFrameHeight = 171; // 高度 171

function loadImgSafe(path) {
  return loadImage(
    path,
    () => console.log("載入成功:", path),
    () => console.warn("載入失敗，請檢查路徑或檔名:", path)
  );
}

function preload() { // 在畫布建立前載入圖片資源
  bgImage = loadImgSafe("bg/3.png");
  characterSprite = loadImgSafe("1/stop/stop.png");
  walkSprite = loadImgSafe("1/walk/walk.png");
  magicSprite = loadImgSafe("1/magic/magic.png");
  magicEffectSprite = loadImgSafe("1/magic_effect/magic_effect.png");
  char2StopSprite = loadImgSafe("2/stop/stop.png");
  char2ActionSprite = loadImgSafe("2/action/action.png");
} // 結束圖片載入函式

function setup() { // 初始化畫布與繪圖模式
  createCanvas(windowWidth, windowHeight); // 建立符合視窗尺寸的畫布
  imageMode(CENTER); // 讓座標代表影格的中心點
  characterX = (width * 2) / 3; // 將角色初始位置設在畫布寬度的三分之二處
  frameRate(60); // 將動畫更新速率設定為每秒六十格
} // 結束初始化函式

function draw() { // 每個畫面更新一次背景與角色
  background("#87CEEB"); // 預設底色避免圖片載入前空白

  // 計算單張背景圖片依畫布高度等比例縮放後的寬度（確保至少與畫布同寬以完整覆蓋畫面）
  const bgAspect = bgImage && bgImage.height > 0 ? bgImage.width / bgImage.height : 1;
  const singleBgWidth = max(width, height * bgAspect);
  const singleBgHeight = height;

  // 計算三張背景串接後的可捲動範圍
  const minBgOffset = width - singleBgWidth * 2;
  const maxBgOffset = singleBgWidth;
  const anchorX = (width * 2) / 3; // 角色在捲動模式下的基準水平位置

  const movingRight = keyIsDown(RIGHT_ARROW); // 檢查右方向鍵目前是否按住
  const movingLeft = keyIsDown(LEFT_ARROW); // 檢查左方向鍵目前是否按住
  isWalking = movingRight || movingLeft; // 沒有按住左右鍵時切回站立動畫
  const movementStep = constrain(width * 0.004, 2, 8); // 依畫布寬度計算適合不同裝置的移動速度

  // 維持角色高度為畫布高度的 1/3，寬度依原圖寬高比等比例縮放
  const characterScale = (height / 3) / frameHeight;
  const characterWidth = frameWidth * characterScale; // 計算角色基本顯示寬度
  const characterHeight = height / 3;

  if (movingRight) { // 按住右方向鍵
    isWalking = true; // 切換至走路動畫
    facingDirection = 1; // 設定角色朝向右方
    if (characterX < anchorX) {
      characterX = min(anchorX, characterX + movementStep);
    } else if (bgOffsetX > minBgOffset) {
      bgOffsetX = max(minBgOffset, bgOffsetX - movementStep);
    } else {
      characterX += movementStep; // 讓角色向右移動
    }
  } else if (movingLeft) { // 按住左方向鍵
    isWalking = true; // 切換至走路動畫
    facingDirection = -1; // 設定角色朝向左方
    if (characterX > anchorX) {
      characterX = max(anchorX, characterX - movementStep);
    } else if (bgOffsetX < maxBgOffset) {
      bgOffsetX = min(maxBgOffset, bgOffsetX + movementStep);
    } else {
      characterX -= movementStep; // 讓角色向左移動
    }
  }

  // 限制角色中心避免超出畫布左右邊界
  characterX = constrain(characterX, characterWidth / 2, width - characterWidth / 2);

  // 繪製三張左右串接的背景圖片（左、中、右）
  if (bgImage && bgImage.width > 0) {
    push();
    imageMode(CORNER); // 背景使用左上角座標對齊無縫串接
    for (let i = -1; i <= 1; i++) {
      const drawX = bgOffsetX + i * singleBgWidth;
      image(bgImage, drawX, 0, singleBgWidth, singleBgHeight);
    }
    pop();
  }

  // 計算角色二位置：最左邊背景圖（i = -1）的正中央
  const leftmostBgLeftX = bgOffsetX - singleBgWidth;
  const char2X = leftmostBgLeftX + singleBgWidth / 2;

  // 先算出角色二目前尺寸，用實際角色寬度判斷是否真正接近／碰到角色二
  const char2Scale = (height / 3) / char2StopFrameHeight;
  const approxChar2W = char2StopFrameWidth * char2Scale;
  const touchThreshold = (characterWidth + approxChar2W) * 0.65;
  const isNearChar2 = abs(characterX - char2X) <= touchThreshold;

  // 若遠離角色二，重置作答狀態
  if (!isNearChar2) {
    selectedOption = null;
  }

  // 依接近狀態選擇角色二精靈圖與影格參數
  const char2Sprite = isNearChar2 ? char2ActionSprite : char2StopSprite;
  const char2FrameCount = isNearChar2 ? char2ActionFrameCount : char2StopFrameCount;
  const char2FrameW = isNearChar2 ? char2ActionFrameWidth : char2StopFrameWidth;
  const char2FrameH = isNearChar2 ? char2ActionFrameHeight : char2StopFrameHeight;

  const actualChar2Scale = (height / 3) / char2FrameH;
  const char2DrawW = char2FrameW * actualChar2Scale;
  const char2DrawH = char2FrameH * actualChar2Scale;
  const char2Y = height - char2DrawH / 2;
  const char2FrameIndex = floor(frameCount / framesPerStep) % char2FrameCount;
  const char2SourceX = char2FrameIndex * char2FrameW;
  const char2Facing = characterX >= char2X ? 1 : -1;

  if (char2Sprite && char2Sprite.width > 0) {
    push();
    translate(char2X, char2Y);
    scale(char2Facing, 1);
    image(char2Sprite, 0, 0, char2DrawW, char2DrawH, char2SourceX, 0, char2FrameW, char2FrameH);
    pop();
  }

  if (isCasting && frameCount - magicStartFrame >= magicFrameCount * framesPerStep) { // 檢查施法動畫是否已完整播放一次
    isCasting = false; // 結束施法動畫並恢復一般角色動作
    activeEffects.push({ x: characterX + magicDirection * characterWidth / 2, y: height - characterHeight * 0.58, direction: magicDirection }); // 在角色前方建立朝施法方向飛行的特效
  } // 結束施法動畫完成判斷

  const activeSprite = isCasting ? magicSprite : isWalking ? walkSprite : characterSprite; // 根據角色狀態選擇施法、走路或站立精靈圖
  const activeFrameCount = isCasting ? magicFrameCount : isWalking ? walkFrameCount : frameCountInSprite; // 取得目前精靈圖的影格總數
  const activeFrameWidth = isCasting ? magicFrameWidth : isWalking ? walkFrameWidth : frameWidth; // 取得目前精靈圖每格的寬度
  const activeFrameHeight = isCasting ? magicFrameHeight : isWalking ? walkFrameHeight : frameHeight; // 取得目前精靈圖每格的高度
  const elapsedMagicFrames = frameCount - magicStartFrame; // 計算施法動畫已播放的畫面數
  const frameIndex = isCasting ? floor(elapsedMagicFrames / framesPerStep) : floor(frameCount / framesPerStep) % activeFrameCount; // 計算目前要顯示的精靈影格
  const sourceX = frameIndex * activeFrameWidth; // 計算目前影格在精靈圖中的水平起點
  const activeWidth = activeFrameWidth * characterScale; // 計算目前角色影格的顯示寬度
  const activeHeight = activeFrameHeight * characterScale; // 計算目前角色影格的顯示高度
  const characterY = height - activeHeight / 2; // 將目前角色影格底部對齊畫布底部

  if (activeSprite && activeSprite.width > 0) {
    push(); // 暫存目前的繪圖座標轉換狀態
    translate(characterX, characterY); // 將繪圖原點移至角色中心
    scale(isCasting ? magicDirection : facingDirection, 1); // 依施法或角色朝向決定是否水平翻轉
    image(activeSprite, 0, 0, activeWidth, activeHeight, sourceX, 0, activeFrameWidth, activeFrameHeight); // 裁切並繪製目前角色影格
    pop(); // 還原繪圖座標轉換狀態
  } else {
    // 備援提示：若角色一圖片尚未載入完成，顯示位置框方便排查
    push();
    rectMode(CENTER);
    fill(100, 180, 255, 180);
    rect(characterX, characterY, characterWidth, characterHeight);
    fill(0);
    textAlign(CENTER, CENTER);
    text("角色1載入中", characterX, characterY);
    pop();
  }

  const effectScale = characterScale; // 使用角色縮放倍率讓特效適應不同畫布
  const effectWidth = effectFrameWidth * effectScale; // 計算特效影格的顯示寬度
  const effectHeight = effectFrameHeight * effectScale; // 計算特效影格的顯示高度
  const effectSpeed = max(6, width * 0.008); // 依畫布寬度計算特效飛行速度
  for (let effectIndex = activeEffects.length - 1; effectIndex >= 0; effectIndex--) { // 由後往前更新所有飛行中的特效
    const effect = activeEffects[effectIndex]; // 取得目前更新的特效資料
    effect.x += effect.direction * effectSpeed; // 依特效方向更新水平位置
    if (effect.x > width || effect.x < 0) { // 判斷特效是否已抵達畫布左右邊緣
      activeEffects.splice(effectIndex, 1); // 移除已飛出畫布的特效
      continue; // 略過已移除特效的繪製
    } // 結束特效邊界判斷
    const effectFrameIndex = floor(frameCount / framesPerStep) % effectFrameCount; // 計算特效目前播放的影格
    if (magicEffectSprite && magicEffectSprite.width > 0) {
      push(); // 暫存目前的繪圖座標轉換狀態
      translate(effect.x, effect.y); // 將繪圖原點移至特效中心
      scale(effect.direction, 1); // 依飛行方向翻轉特效影格
      image(magicEffectSprite, 0, 0, effectWidth, effectHeight, effectFrameIndex * effectFrameWidth, 0, effectFrameWidth, effectFrameHeight); // 裁切並繪製目前特效影格
      pop(); // 還原繪圖座標轉換狀態
    }
  } // 結束飛行中特效更新迴圈

  // 當角色1真正接近角色2時，在畫布上方中央繪製透明度為 80 的白色方框與桌球發球規則選擇題
  if (isNearChar2) {
    drawTableTennisQuizBox();
  } else {
    quizOptionBounds = [];
  }
} // 結束繪圖函式

function drawTableTennisQuizBox() {
  const boxW = width / 3; // 寬度為整個畫布寬的 1/3
  const boxH = height / 2; // 高度為整個畫布高的 1/2
  const topMargin = height * 0.02; // 靠近畫布上方
  const boxCenterX = width / 2; // 方框中間對準畫布中間
  const boxCenterY = topMargin + boxH / 2;
  const boxLeft = boxCenterX - boxW / 2;
  const boxTop = boxCenterY - boxH / 2;

  push();
  rectMode(CORNER);
  // 透明度為 80 的白色方框
  fill(255, 255, 255, 80);
  stroke(255, 255, 255, 210);
  strokeWeight(2);
  rect(boxLeft, boxTop, boxW, boxH, 14);

  const outerPadX = max(10, boxW * 0.04);
  const outerPadY = max(8, boxH * 0.03);
  const innerW = boxW - outerPadX * 2;
  const innerLeft = boxLeft + outerPadX;

  // 分配垂直高度：題目區 28%、四個選項區 54%、底部提示區 12%、間距 6%
  const qBoxH = boxH * 0.28;
  const optionsTotalH = boxH * 0.54;
  const hintBoxH = boxH * 0.12;
  const sectionGap = boxH * 0.03;

  const qTop = boxTop + outerPadY;
  noStroke();
  fill(255, 255, 255, 185);
  rect(innerLeft, qTop, innerW, qBoxH, 8);

  const qFontSize = constrain(min(innerW * 0.046, qBoxH * 0.27), 12, 19);
  fill(15, 23, 42);
  textAlign(LEFT, TOP);
  textSize(qFontSize);
  textLeading(qFontSize * 1.25);
  text(quizData.question, innerLeft + 8, qTop + 6, innerW - 16, qBoxH - 10);

  // 繪製四個選項（嚴格限制在 optionsTotalH 內，不超出方框）
  quizOptionBounds = [];
  const optionsTop = qTop + qBoxH + sectionGap;
  const rowGap = max(4, optionsTotalH * 0.035);
  const optionH = (optionsTotalH - rowGap * (quizData.options.length - 1)) / quizData.options.length;
  const optFontSize = constrain(min(innerW * 0.04, optionH * 0.52), 11, 16);

  for (let i = 0; i < quizData.options.length; i++) {
    const optY = optionsTop + i * (optionH + rowGap);

    quizOptionBounds.push({
      x: innerLeft,
      y: optY,
      w: innerW,
      h: optionH
    });

    if (selectedOption === i) {
      if (i === quizData.answerIndex) {
        fill(74, 222, 128, 220);
      } else {
        fill(248, 113, 113, 220);
      }
    } else {
      fill(255, 255, 255, 185);
    }
    stroke(30, 41, 59, 110);
    strokeWeight(1);
    rect(innerLeft, optY, innerW, optionH, 6);

    noStroke();
    fill(15, 23, 42);
    textAlign(LEFT, CENTER);
    textSize(optFontSize);
    text(quizData.options[i], innerLeft + 8, optY + optionH / 2);
  }

  // 底部回饋或提示文字
  const hintY = optionsTop + optionsTotalH + sectionGap * 0.6;
  const hintFontSize = constrain(min(innerW * 0.038, hintBoxH * 0.55), 11, 15);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(hintFontSize);

  if (selectedOption === null) {
    fill(15, 23, 42);
    text("點擊選項或按 1 ~ 4 作答", innerLeft + innerW / 2, hintY + hintBoxH / 2);
  } else if (selectedOption === quizData.answerIndex) {
    fill(15, 110, 45);
    text(quizData.correctHint, innerLeft + innerW / 2, hintY + hintBoxH / 2);
  } else {
    fill(185, 28, 28);
    text(quizData.wrongHint, innerLeft + innerW / 2, hintY + hintBoxH / 2);
  }

  pop();
}

function mousePressed() {
  if (quizOptionBounds.length === 0) return;
  for (let i = 0; i < quizOptionBounds.length; i++) {
    const b = quizOptionBounds[i];
    if (mouseX >= b.x && mouseX <= b.x + b.w && mouseY >= b.y && mouseY <= b.y + b.h) {
      selectedOption = i;
      break;
    }
  }
}

function keyPressed() { // 按下方向鍵時切換角色狀態與朝向
  if (quizOptionBounds.length > 0) {
    if (key === "1") { selectedOption = 0; return false; }
    if (key === "2") { selectedOption = 1; return false; }
    if (key === "3") { selectedOption = 2; return false; }
    if (key === "4") { selectedOption = 3; return false; }
  }

  if (keyCode === RIGHT_ARROW) { // 判斷是否按下右方向鍵
    isWalking = true; // 啟用走路動畫
    facingDirection = 1; // 讓角色面向右方
    return false; // 防止方向鍵捲動網頁
  } // 結束右方向鍵判斷
  if (keyCode === LEFT_ARROW) { // 判斷是否按下左方向鍵
    isWalking = true; // 啟用走路動畫
    facingDirection = -1; // 讓角色面向左方
    return false; // 防止方向鍵捲動網頁
  } // 結束左方向鍵判斷
  if (keyCode === 32) { // 判斷是否按下空白鍵
    if (!spaceIsDown && !isCasting) { // 僅在空白鍵新按下且角色未施法時觸發
      isCasting = true; // 開始播放施法動畫
      magicStartFrame = frameCount; // 記錄施法動畫的起始畫面
      magicDirection = facingDirection; // 鎖定施法當下角色面向
    } // 結束施法啟動判斷
    spaceIsDown = true; // 記錄空白鍵已按住以避免連續觸發
    return false; // 防止空白鍵捲動網頁
  } // 結束空白鍵判斷
} // 結束按鍵事件處理函式

function keyReleased() { // 鍵盤按鍵放開時更新按鍵狀態
  if (keyCode === 32) { // 判斷放開的是否為空白鍵
    spaceIsDown = false; // 允許下次按空白鍵重新施法
  } // 結束空白鍵放開判斷
} // 結束按鍵放開事件處理函式

function windowResized() { // 視窗尺寸改變時重新調整畫布
  resizeCanvas(windowWidth, windowHeight); // 將畫布同步為新的視窗尺寸
  characterX = constrain(characterX, 1, width - 1); // 將角色位置限制在縮放後畫布內
} // 結束視窗縮放處理函式