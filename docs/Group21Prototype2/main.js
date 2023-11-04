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
gg
gg
gg
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

/** @type {{pos: Vector, vy: number, posHistory: Vector[]}} */
let snakeHead;
/** @type {{index: number, targetIndex: number}[]} */
let snakeTails;
/** @type {{pos: Vector, vy: number}[]} */
let fallingsnakeTails;

/** @type {{pos: Vector, vx: number}[]} */
let bullets;
/** @type {{pos: Vector, vx: number}[]} */
let spawnedsnakeTails;

let nextBulletDist;
let nextFoodDist;

let movingUp = false;

function update() {
  //Initializer function
  if (!ticks) {
    snakeHead = { pos: vec(64, 32), vy: 0, posHistory: [] };
    snakeTails = [];
    fallingsnakeTails = [];
    spawnedsnakeTails = [];
    bullets = [];
    nextBulletDist = 99;
    nextFoodDist = 80;
  }

  const scoreModifier = sqrt(difficulty);

  if (input.isJustPressed) {
    movingUp = !movingUp;
  }

  //Moving the snakeHead 
    const MOVEMENTS_PER_FRAME = 10;
    const pp = vec(snakeHead.pos);
    snakeHead.vy = (movingUp ? -0.8 : 0.8) * difficulty;
    snakeHead.pos.y += snakeHead.vy;
    const op = vec(snakeHead.pos).sub(pp).div(MOVEMENTS_PER_FRAME);
    color("white");
    //Discrete movements for collision checking
    times(MOVEMENTS_PER_FRAME, () => {
      pp.add(op);
      box(pp, 6);
    });
    color("black");

  //Select correct sprite, jumping = b or falling = a
  char(snakeHead.vy < 0 ? "b" : "a", snakeHead.pos);

  nextFoodDist -= scoreModifier;
  if (nextFoodDist < 0) {
    spawnedsnakeTails.push({ pos: vec(203, rndi(10, 90)), vx: rnd(1, difficulty) * 0.3 });
    nextFoodDist += rnd(50, 80) / sqrt(difficulty);
  }
  color("black");
  //cleaning up snakeTails and moving
  remove(spawnedsnakeTails, (food) => {
    //update bullet position by velocity
    food.pos.x -= food.vx + scoreModifier;

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
 

  //Causes snakeTails to follow behind you
  snakeHead.posHistory.forEach((p) => {
    p.x -= .65;
  });

  //Add snakeHeads position to vector history, dont let history be longer than 99 entries
  snakeHead.posHistory.unshift(vec(snakeHead.pos));
  if (snakeHead.posHistory.length > 99) {
    snakeHead.posHistory.pop();
  }
  color("transparent");

  //Bullet spawning
  nextBulletDist -= scoreModifier;
  if (nextBulletDist < 0) {
    bullets.push({ pos: vec(203, rndi(10, 90)), vx: rnd(1, difficulty) * 0.3 });
    nextBulletDist += rnd(50, 80) / sqrt(difficulty);
  }
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
