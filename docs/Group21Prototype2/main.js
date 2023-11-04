title = "Prototype 2";

description = `
[Tap to Snake]
`;

characters = [
  `
ggGbG
ggGGG
ggGGG
ggGGG
ggGbG
`,
  `
ggGbG
ggGGG
ggGGGr
ggGGG
ggGbG
`,
  `
 gg 
gggg
gggg
 gg
`,
  `
 rrr l
rrrr l
rrrr l
rrrr l
rrrr l
 rrr l
`,
];
const VIEW_X = 150;
const VIEW_Y = 150;
options = {
  viewSize: { x: VIEW_X, y: VIEW_Y },
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 50,
};

/** @type {{pos: Vector, turnCenter: Vector, vy: number, posHistory: Vector[], angle: number}} */
let snakeHead;
/** @type {{index: number, targetIndex: number}[]} */
let snakeTails;
/** @type {{pos: Vector, vy: number}[]} */
let fallingsnakeTails;

/** @type {{pos: Vector, vx: number}[]} */
let bullets;
/** @type {{pos: Vector, vx: number}[]} */
let spawnedFood;

let nextBulletDist;
let nextFoodDist;

let movingUp = false;
let angularSpeed = 0.04;
let radius = 16;

function update() {
  //Initializer function
  if (!ticks) {
    snakeHead = { pos: vec(64, 32), turnCenter: vec(64+radius, 32), vy: 0, posHistory: [], angle: 0 };
    snakeTails = [];
    fallingsnakeTails = [];
    spawnedFood = [];
    bullets = [];
    nextBulletDist = 99;
    nextFoodDist = 80;
  }

  const scoreModifier = sqrt(difficulty);

  //Flip the turning direction of the snake when you press the button
  if (input.isJustPressed) { 
    const deltaX = snakeHead.pos.x - snakeHead.turnCenter.x;
    const deltaY = snakeHead.pos.y - snakeHead.turnCenter.y;
  
    const newTurnCenterX = snakeHead.pos.x + deltaX;
    const newTurnCenterY = snakeHead.pos.y + deltaY;
  
    snakeHead.turnCenter.x = newTurnCenterX;
    snakeHead.turnCenter.y = newTurnCenterY;

    // Reverse the angle to keep snakeHead.pos in the same place
    snakeHead.angle = Math.atan2(snakeHead.pos.y - snakeHead.turnCenter.y, snakeHead.pos.x - snakeHead.turnCenter.x);
    angularSpeed = -angularSpeed;
  }
  
  snakeHead.angle += angularSpeed;
  snakeHead.pos.x = snakeHead.turnCenter.x + radius * Math.cos(snakeHead.angle);
  snakeHead.pos.y = snakeHead.turnCenter.y + radius * Math.sin(snakeHead.angle);


  //Select correct sprite, jumping = b or falling = a
  char(snakeHead.vy < 0 ? "b" : "a", snakeHead.pos);

  nextFoodDist -= scoreModifier;
  if (nextFoodDist < 0) {
    spawnedFood.push({ pos: vec(rndi(10, 140), rndi(10, 140)), vx: rnd(1, difficulty) * 0.3 });
    nextFoodDist += rnd(50, 80) / sqrt(difficulty);
  }
  color("black");
  // cleaning up snakeTails and moving
  remove(spawnedFood, (food) => {
    //update bullet position by velocity

    const c = char("c", food.pos).isColliding.char;
    if (c.a || c.b) {
      if (snakeTails.length < 30) {
          snakeTails.push({ index: 0, targetIndex: 0 });
      }
      play("select");
      addScore(snakeTails.length, food.pos.x, food.pos.y - 5);
      return true;
    }
    return food.pos.x < -3;
  });

  //Add snakeHeads position to vector history, dont let history be longer than 99 entries
  snakeHead.posHistory.unshift(vec(snakeHead.pos));
  if (snakeHead.posHistory.length > 99) {
    snakeHead.posHistory.pop();
  }
  color("transparent");

  //Bullet spawning
  // nextBulletDist -= scoreModifier;
  // if (nextBulletDist < 0) {
  //   bullets.push({ pos: vec(203, rndi(10, 90)), vx: rnd(1, difficulty) * 0.3 });
  //   nextBulletDist += rnd(50, 80) / sqrt(difficulty);
  // }
  color("black");
  //cleaning up bullets and handling bullet collision, and moving
  let isHit = false;
  remove(bullets, (bullet) => {
    //update bullet position by velocity
    bullet.pos.x -= bullet.vx + scoreModifier;

    const c = char("d", bullet.pos).isColliding.char;
    if (c.a || c.b) {
      play("explosion");
      if (snakeTails.length > 0) {
        isHit = true;
        snakeHead.vy = 3 * sqrt(difficulty);
      } else {
        end();
      }
      return true;
    }
    return bullet.pos.x < -3;
  });
  color("black");

  remove(snakeTails, (tail, i) => {
    tail.targetIndex = 3 * (i + 1);
    tail.index += (tail.targetIndex - tail.index) * 0.05;
    const p = snakeHead.posHistory[floor(tail.index)];
    const cl = char("c", p).isColliding;
    //If a tail segment gets hit by a bullet
    if (cl.char.d) {
      play("powerUp");
      isHit = true;
    }

    //Add tail segment to fallingsnakeTails array
    if (isHit) {
      console.log("Triggered");
      fallingsnakeTails.push({ pos: vec(p), vy: 0 });
      return true;
    }
  });

  //Remove food when they fall off screen
  remove(fallingsnakeTails, (tail) => {
    tail.vy += 0.3 * difficulty;
    tail.pos.y += tail.vy;
    char("c", tail.pos, { mirror: { y: -1 } });
    return tail.pos.y > 103;
  });
  color("black");
  char(snakeHead.vy < 0 ? "b" : "a", snakeHead.pos);

  if (snakeHead.pos.y > VIEW_Y - 1) {
    play("explosion");
    end();
  }
}
