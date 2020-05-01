const gridSize = 30;
const c = 20;
const r = 12;
const cWidth = 600;
const cHeight = (r+2)*3*gridSize;
const grids = [];
let rays = [];
let editMode = false;
let drawing = false;
let globalNextState = false;
let player = null;
let blocks = [];
let selectedBlock = 2;
let blocksContainerY;
const RAD = 57.2957795;

const MENU_X = c*gridSize - 170;
const MENU_Y = r*gridSize+5;
let processing = false;
let importMap = null;

let defaultTexture;
let brickTexture;
let stoneBrickTexture;
let barrelTexture;
let concreteTexture;

function preload() {
  defaultTexture = loadImage('assets/test.png');
  brickTexture = loadImage('assets/brick.jpg');
  stoneBrickTexture = loadImage('assets/stone_brick.jpg');
  barrelTexture = loadImage('assets/barrel.png');
  concreteTexture = loadImage('assets/concrete.png');
  
  
  blocks = [
  {
    name: "Default",
    texture: defaultTexture,
    col: color(255, 255, 255)
  }, 
  {
    name: "Brick", 
    texture: brickTexture, 
    col: color(189, 126, 96)
  }, 
  {
    name: "Stone Brick", 
    texture: stoneBrickTexture, 
    col: color(150, 150, 150)
  },
  {
    name: "Barrel", 
    texture: barrelTexture, 
    col: color(151, 120, 91)
  },
  {
    name: "Concrete", 
    texture: concreteTexture, 
    col: color(207, 206, 205)
  }
 ];
    
}

function setup() {
  // Create the canvas
  createCanvas(cWidth, cHeight);
  
  stroke(255);
  mapInput = createFileInput(handleFile);
  mapInput.position(0,0);
  
  // Instantiate the player to the middle of the map
  player = new Player(c/2*gridSize, r/2*gridSize, 0);
  
  // Draw the cells
  for (let i = 0; i<c; i++) {
    for (let j = 0; j<r; j++) {
      let state = i==0 || i == c-1 || j == 0 || j == r-1;
      let cell = new Cell(i, j, state);
      cell.setBlock(1);
      append(grids, cell);
    }
  }
}

function handleFile(file){
  importMap = file;
}

function draw() {
  background(0);
  for (let c in grids) {
    curC = grids[c];
    curC.display();
  }
  if (editMode) {
    if (drawing) {
      this.drawCells();
    }
  }

  if (player) {
    player.display();
    player.castRays();
    for (let r in rays) {
      if (rays[r]) {
        rays[r].display();
      }
    }
    if (!editMode) {
      if (keyIsDown(87)) {
        player.move(1);
      }
      if (keyIsDown(83)) {
        player.move(-1);
      }
      if (keyIsDown(65)) {
        player.rotate(-1);
      }
      if (keyIsDown(68)) {
        player.rotate(1);
      }
      if (keyIsDown(UP_ARROW)) {
        player.adjustCameraAngle(1);
      }
      if (keyIsDown(DOWN_ARROW)) {
        player.adjustCameraAngle(-1);
      }
      if (keyIsDown(LEFT_ARROW)) {
        player.adjustCameraFoV(-1);
      }
      if (keyIsDown(RIGHT_ARROW)) {
        player.adjustCameraFoV(1);
      }
    }
  }
  noStroke();
  fill(255);
  text("x: " + mouseX + ", y: " + mouseY, 0, (r)*gridSize+gridSize / 2 + 5);
  
  let sceneHeight = 400;
  draw3DScene(0, (r+1) * gridSize, c*gridSize, sceneHeight);
  
  blocksContainerY = (r+2) * gridSize +sceneHeight;
  drawBlocks(0, blocksContainerY , c*gridSize);
  
  fill(255);
  rect(MENU_X,MENU_Y,80,20);
  fill(0);
  text("Import", MENU_X + 20,MENU_Y + 5,80,20);
  
  fill(255);
  rect(MENU_X + 90,MENU_Y,80,20);
  fill(0);
  text("Export", MENU_X + 110,MENU_Y + 5,80,20);
}

function keyPressed() {
  if (keyCode === CONTROL) {   
    editMode = !editMode;
  }
  if (keyCode === 67) {
    if (editMode) {
      for (let g in grids) {
        grids[g].setState(0);
      }
    }
  }
}

function sumOfPrevRays(i, w) {
  let sum = 0;
  let rayCount = rays.length;
  for (let j=0; j<i; j++) {
    let currentRay = rays[j];
    sum += w/rayCount;
  }
  return sum;
}

function drawBlocks(x, y, w) {
  for (let i = 0; i<blocks.length; i++) {
    if (i == selectedBlock) {
      stroke(0, 255, 0);
      strokeWeight(4);
    } else {
      noStroke();
    }   
    noFill();
    let b_x = (i % floor(w / gridSize))*gridSize;
    let b_y = floor(i / floor(w / gridSize)) * gridSize;
    rect(x + 2 + b_x, y + b_y, gridSize - 2, gridSize - 2);
    image(blocks[i].texture, x + 2 + b_x, y + b_y, gridSize - 2, gridSize - 2);
  }
}

const Y_AXIS = 1;
const X_AXIS = 2;

function setGradient(x, y, w, h, c1, c2, axis) {
  noFill();

  if (axis === Y_AXIS) {
    // Top to bottom gradient
    for (let i = y; i <= y + h; i++) {
      let inter = map(i, y, y + h, 0, 1);
      let c = lerpColor(c1, c2, inter);
      stroke(c);
      line(x, i, x + w, i);
    }
  } else if (axis === X_AXIS) {
    // Left to right gradient
    for (let i = x; i <= x + w; i++) {
      let inter = map(i, x, x + w, 0, 1);
      let c = lerpColor(c1, c2, inter);
      stroke(c);
      line(i, y, i, y + h);
    }
  }
}

function draw3DScene(x, y, w, h) {
  stroke(255);
  setGradient(x, y, w, h/2,color(50,20,40),color(0),Y_AXIS);
  setGradient(x, y+h/2, w, h/2,color(0),color(60),Y_AXIS);
  let rayCount = rays.length;
  for (let i=0; i<rayCount; i++) {
    let currentRay = rays[i];
    if (currentRay) {
      let rayW = round(w/rayCount);
      let rayH = gridSize*h/(currentRay.len*cos(player.dir - currentRay.angle)); //10000/currentRay.len*cos(player.dir - currentRay.angle) ;//map(currentRay.len*cos(currentRay.angle), 0, 600, h, 0);
      //noStroke();
      //fill(map(currentRay.len,0,cHeight,255,0));
      //rect(x +i*rayW,y + h/2 - rayH/2, rayW,rayH );
      // if(round(currentRay.xTo)% gridSize == 0){
      // vertical wall
      //if (rayH < h) {
        noStroke();
        let texCol;
        let currentTexture = currentRay.hitInfo && currentRay.hitInfo.block.texture ? currentRay.hitInfo.block.texture : defaultTexture;
        let col = color(255, 255, 255);
        switch(currentRay.axis) {
        case 0:
          texCol = currentTexture.width * (currentRay.yTo%gridSize)/gridSize;
          break;   
        case 1:
          texCol = currentTexture.width * (currentRay.xTo%gridSize)/gridSize;
          break;   
        case 2:
          texCol = currentTexture.width * (currentRay.xTo%gridSize)/gridSize;
          col = currentRay.hitInfo && currentRay.hitInfo.block.col ? currentRay.hitInfo.block.col : color(255,255,255);
          break;
        }
        if (texCol) {
          if(rayH < h){
            image(currentTexture, x +i*rayW, y + h/2 - rayH/2, rayW, rayH, texCol, 0, rayW, currentTexture.height);
          }else{
            let hX = (currentTexture.height * h) / rayH;
            image(currentTexture, x+i*rayW,y,rayW,h,texCol,(currentTexture.height - hX) / 2,rayW,hX);
          }
        } else {
          fill(col);
          rect(x +i*rayW, y + h/2 - rayH/2, rayW, rayH );
        }
        // fog
        fill(color(0, 0, 0, map(currentRay.len, 0, cHeight, 0, 255)*1.5));
        rect(x +i*rayW, y + h/2 - rayH/2-1, rayW, rayH+2 );
      //}

      // }else if(round(currentRay.yTo)% gridSize == 0){
      // horizontal wall
      //    let texCol = defaultTexture.width * (currentRay.xTo%gridSize)/gridSize;
      //    image(defaultTexture, x +i*rayW, y + h/2 - rayH/2, rayW, rayH, texCol, 0, rayW, defaultTexture.height);
      /* }else{
       noStroke();
       fill(map(currentRay.len,0,cHeight,255,0));
       rect(x +i*rayW,y + h/2 - rayH/2, rayW,rayH );
       }
       */
    }
  }
}

function getIndex(col, row) {
  if (col < 0 || row < 0 || col > c || row > r) {
    return -1;
  }
  return col*r + row;
}

function isFree(x, y) {
  let col = floor(x/gridSize);
  let row = floor(y/gridSize);
  return !grids[getIndex(col, row)].state;
}

function drawCells() {
  let col = floor(mouseX/gridSize);
  let row = floor(mouseY/gridSize);
  if (col < 0 || row < 0 || col >= c || row >= r) {
    return;
  }
  grids[getIndex(col, row)].setState(globalNextState);
  grids[getIndex(col, row)].setBlock(selectedBlock);
}
function mousePressed() {
  if (editMode) {
    if (mouseY < r * gridSize) {
      let col = floor(mouseX/gridSize);
      let row = floor(mouseY/gridSize);
      if (col > 0 || row > 0 || col < c || row < r) {
        if (!keyIsDown(ALT)){
          drawing = true;
          globalNextState = !grids[getIndex(col, row)].state;
        }else{
          selectedBlock = blocks.indexOf(grids[getIndex(col, row)].block);
        }
      }
    } else if ((mouseX > 0 && mouseX < blocks.length*gridSize) &&(mouseY > blocksContainerY && mouseY < (blocksContainerY + ceil(blocks.length / c) * gridSize))) {
      selectedBlock = getIndex(floor((mouseY - blocksContainerY) / gridSize), floor(mouseX/gridSize));
    }
  }
  if(!processing){
    if ((mouseX > MENU_X && mouseX < (MENU_X + 80)) && (mouseY > MENU_Y && mouseY < (MENU_Y + 20))) {
        console.log("import");
        processing = true;
        if(importMap){
          let map = importMap.data.split(",");
          map.pop();
          for(let i = 0; i< map.length; i++){
            let currentBlock = map[i];
            if(currentBlock !== "-1"){
              grids[i].setBlock(currentBlock);
            }
            grids[i].setState(currentBlock !== "-1");
          }
        }
        processing = false;
    } 
    
    if ((mouseX > MENU_X+90 && mouseX < (MENU_X + 170)) && (mouseY > MENU_Y && mouseY < (MENU_Y + 20))) {
        console.log("export");
        processing = true;
        let mapName = prompt("Please enter the name of this map:");
        mapWriter = createWriter(mapName+".map");
        for(let g in grids){
          let curCell = grids[g];
          mapWriter.write(curCell.state ? (curCell.blockType+",") : "-1,");
        }
        mapWriter.close();
        processing = false;
    }
  }
  
}

function mouseReleased() {
  drawing = false;
}


class Cell {
  constructor(c, r, state) {
    this.c = c;
    this.r = r;
    this.state = state;
    this.x = c * gridSize;
    this.y = r * gridSize;
    this.blockType = selectedBlock;
    this.block = blocks[selectedBlock];
  }

  setState(state) {
    if (this.state != state) {
      this.state = state;
    }
  }

  setBlock(block) {
    this.blockType = block;
    this.block = blocks[block];
  }

  display() {
    fill(this.state ? this.block.col : 0);
    if (editMode) {
      stroke(255);
    } else {
      noStroke();
    }
    rect(this.x, this.y, gridSize, gridSize);
  }
}


class Player {
  constructor(x, y, dir) {
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.speed = 2;
    this.rotateSpeed = 0.04;
    this.cameraAngle = 1.57 ;
    this.rayCount = this.cameraAngle*100;
    this.FoV = 0;
  }

  isCollided(x, y, r) {
    let col = floor(x/gridSize);
    let colLeft = floor((x-r)/gridSize);
    let colRight = floor((x+r)/gridSize);
    let row = floor(y/gridSize);
    let rowUp = floor((y+r)/gridSize);
    let rowDown = floor((y-r)/gridSize);


    let iUp = getIndex(col, rowUp);
    let iDown = getIndex(col, rowDown);
    let iLeft = getIndex(colLeft, row);
    let iRight = getIndex(colRight, row);
    if (!grids[iUp] || !grids[iDown] || !grids[iLeft] || !grids[iRight]) {
      return true;
    }

    return grids[iUp].state || grids[iDown].state || grids[iLeft].state || grids[iRight].state;
  }

  adjustCameraAngle(dir) {
    this.cameraAngle += dir * this.rotateSpeed;
  }

  adjustCameraFoV(dir) {
    this.FoV += dir;
  }

  move(dir) {
    let xSpeed = this.speed * cos(this.dir);
    let ySpeed = this.speed * sin(this.dir);

    if (!this.isCollided(this.x + dir *xSpeed, this.y + dir *ySpeed, 5)) {  
      this.x += dir * xSpeed;
      this.y += dir * ySpeed;
    }else{
      if (!this.isCollided(this.x + dir *xSpeed, this.y, 5)){
        this.x += dir* xSpeed;
      }
      if (!this.isCollided(this.x, this.y + dir *ySpeed, 5)){
        this.y += dir *ySpeed;
      }
    }
  } 

  rotate(dir) {
   this.dir += dir * this.rotateSpeed;
  }

  castRays() {
    rays = [];
    let angle = this.dir - this.cameraAngle / 2;

    for (let i=0; i<this.rayCount; i++) {

      // My method of casting rays 
      // not as efficient as other method but it works
      // disadvantage we don't know the vertical or horizontal information

      let x = this.x;
      let y = this.y;
      let xTo = x + cos(angle);
      let yTo = y + sin(angle);

      while (isFree(xTo, yTo) && (isFree(xTo,y) && isFree(x,yTo))) {
        x = xTo;
        y = yTo;
        xTo = x + cos(angle);
        yTo = y + sin(angle);
      }
      let axis = -1;
      let leftEmpty = isFree(x-1, y);
      let rightEmpty = isFree(x+1, y);
      let topEmpty = isFree(x, y-1);
      let bottomEmpty = isFree(x, y+1);
      let bottomRightEmpty = isFree(x+1,y+1);
      let bottomLeftEmpty = isFree(x-1,y+1);
      let topRightEmpty = isFree(x+1,y-1);
      let topLeftEmpty = isFree(x-1,y-1);
      let hitInfo;
      if ((!rightEmpty || !leftEmpty) && (topEmpty && bottomEmpty)) {
        // vertical        
        axis = 0;
        if (!rightEmpty) {
          hitInfo = grids[getIndex(floor((x+1)/gridSize), floor(y/gridSize))];
        } else {
          hitInfo = grids[getIndex(floor((x-1)/gridSize), floor(y/gridSize))];
        }
      } else if ((rightEmpty && leftEmpty) && (!topEmpty || !bottomEmpty)) {
        // horizontal
        axis = 1;
        if (!topEmpty) {
          hitInfo = grids[getIndex(floor(x/gridSize), floor((y-1)/gridSize))];
        } else {
          hitInfo = grids[getIndex(floor(x/gridSize), floor((y+1)/gridSize))];
        }
      } else {
        // corner
        axis = 2;
        switch (true) {
          case (!topRightEmpty):
          hitInfo = grids[getIndex(floor((x+1)/gridSize), floor((y-1)/gridSize))];
          break;
          case (!topLeftEmpty):
          hitInfo = grids[getIndex(floor((x-1)/gridSize), floor((y-1)/gridSize))];
          break;
          case (!bottomRightEmpty):
          hitInfo = grids[getIndex(floor((x+1)/gridSize), floor((y+1)/gridSize))];
          break;
          case (!bottomLeftEmpty):
          hitInfo = grids[getIndex(floor((x-1)/gridSize), floor((y+1)/gridSize))];
          break;
        }
      }
      let projectionLen = this.FoV / cos(angle -  this.dir);
      let newRay = new Ray(this.x, this.y, x, y, angle, projectionLen - this.FoV, axis, hitInfo);
      if (sqrt(sq(x-this.x) + sq(y - this.y)) > sqrt(sq(projectionLen*cos(angle)) + sq(projectionLen*sin(angle)))) {
        append(rays, newRay);
      } else {
        append(rays, null);
      }
      angle += this.cameraAngle / (this.rayCount -1);
    }
  }

  display() {
    let nextX = this.x + this.speed*cos(this.dir);
    let nextY = this.y + this.speed*sin(this.dir);

    fill(color(100, 0, 0));
    noStroke();
    circle(this.x, this.y, 10);
    stroke(255);
    strokeWeight(1);
    line(this.x, this.y, this.x + 40*cos(this.dir), this.y + 40*sin(this.dir));

    let projectionAngle = this.dir-this.cameraAngle/2;
    let rayCount = this.cameraAngle*100;
    for (let i=0; i<rayCount; i++) {
      let projectionLen = this.FoV / cos(projectionAngle -  this.dir);
      line(this.x, this.y, this.x + projectionLen*cos(projectionAngle), this.y +projectionLen*sin(projectionAngle));
      projectionAngle += this.cameraAngle / (rayCount -1);
    }
    //fill(this.isCollided(nextX,nextY,10) ? color(255,0,0) : color(0,255,0));
    //circle(nextX,nextY,20);
  }
}

class Ray {
  constructor(x, y, xTo, yTo, angle, FoVDiff, axis, hitInfo) {
    this.angle = angle;
    this.FoVDiff = FoVDiff;
    this.x=x;
    this.y=y;
    this.xTo=xTo;
    this.yTo=yTo;
    this.c = color(255, 255, 0, 50);
    this.w = 2;
    this.len = sqrt(sq(xTo - x) + sq(yTo - y));
    this.axis = axis;
    this.hitInfo = hitInfo;
  }

  display() {
    stroke(this.c);
    strokeWeight(this.w);
    line(this.x, this.y, this.xTo, this.yTo);
  }
}
