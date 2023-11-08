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
  `
ggGRG
ggGGG
ggGGG
ggGGG
ggGRG
`,
  `
ggGRG
ggGGG
ggGGGr
ggGGG
ggGRG
`,

  `
 gg 
gggg
gggg
 gg
`,
  ,
  `
 gg 
gggg
gggg
 gg
`,
];
const VIEW_X = 200;
const VIEW_Y = 200;
options = {
  viewSize: { x: VIEW_X, y: VIEW_Y },
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 50,
};

/** @type {{pos: Vector, turnCenter: Vector, vy: number, posHistory: Vector[], angle: number, tails : {index: number, targetIndex: number}[], fallingTails :{pos: Vector, vy: number}[], isHit: boolean, angularSpeed: number}}*/
let snakeHead1;

/** @type {{pos: Vector, turnCenter: Vector, vy: number, posHistory: Vector[], angle: number, tails : {index: number, targetIndex: number}[], fallingTails :{pos: Vector, vy: number}[], isHit: boolean, angularSpeed: number}}*/
let snakeHead2;

/* 
/** @type {{index: number, targetIndex: number}[]} 
let snakeTails;
/** @type {{pos: Vector, vy: number}[]} 
let fallingsnakeTails;
*/
/** @type {{pos: Vector, vx: number}[]} */
let bullets;
/** @type {{pos: Vector, vx: number}[]} */
let spawnedFood;

let nextBulletDist;
let nextFoodDist;

let movingUp = false;
let DEFAULT_ANGULAR_SPEED = 0.04;
let radius = 16;

const BOX_SIZE = 40;

function update() {
  //Initializer function
  if (!ticks) {
    create_snakes();

    spawnedFood = [];
    bullets = [];
    nextBulletDist = 99;
    nextFoodDist = 80;
  }

  //Create both squares where player input will be checked for
  color("light_blue");
  rect(0, VIEW_Y - BOX_SIZE, BOX_SIZE, BOX_SIZE);

  color("light_red");
  rect(VIEW_X - BOX_SIZE, VIEW_Y - BOX_SIZE, BOX_SIZE, BOX_SIZE);

  const scoreModifier = sqrt(difficulty);

  //Flip the turning direction of the snake when you press the button
  if (input.isJustPressed) {
    let x = input.pos.x;
    let y = input.pos.y;
    if (0 < x && x < BOX_SIZE && y > VIEW_Y - BOX_SIZE) {
      changeSnakeDirection(snakeHead1);
      snakeHead1.angularSpeed = -snakeHead1.angularSpeed;
    }
    if (x > VIEW_X - BOX_SIZE && y > VIEW_Y - BOX_SIZE) {
      changeSnakeDirection(snakeHead2);
      snakeHead2.angularSpeed = -snakeHead2.angularSpeed;
    }
  }

  updateSnakeAngleAndDirection(snakeHead1);
  updateSnakeAngleAndDirection(snakeHead2);

  //Select correct sprite, jumping = b or falling = a
  drawSnakeHeads();

  nextFoodDist -= scoreModifier;
  if (nextFoodDist < 0 && spawnedFood.length < 20) {
    spawnedFood.push({
      pos: vec(rndi(10, VIEW_X - 10), rndi(10, VIEW_Y - 10)),
      vx: rnd(1, difficulty) * 0.3,
    });
    nextFoodDist = rnd(50, 80) / sqrt(difficulty);
  }
  color("black");
  // cleaning up snakeTails and moving
  remove(spawnedFood, (food) => {
    //update bullet position by velocity

    const c = char("c", food.pos).isColliding.char;

    //Snake 1 collision
    if (c.a || c.b) {
      return handleSnakeCollision(snakeHead1, food);
    }
    if (c.e || c.f) {
      return handleSnakeCollision(snakeHead2, food);
    }

    //Snake 2 collision

    return food.pos.x < -3;
  });

  //Add snakeHeads position to vector history, dont let history be longer than 99 entries
  updateSnakePositionHistory(snakeHead1);
  updateSnakePositionHistory(snakeHead2);

  //Unsure if two lines below are needed - Wyatt
  color("transparent");
  color("black");

  //cleaning up bullets and handling bullet collision, and moving
  snakeHead1.isHit = false;
  snakeHead2.isHit = false;

  color("black");

  //   handleSnakeTail(snakeHead1, "g");
  //   handleSnakeTail(snakeHead2, "h");

  handleSnakeTail(snakeHead1, "g");
  handleSnakeTail(snakeHead2, "c");

  color("black");

  //Redraw head ontop of tails
  drawSnakeHeads();

  handleSnakeOutOfBounds(snakeHead1);
  handleSnakeOutOfBounds(snakeHead2);
}

//-----------------------------------
//----------FUNCTIONS----------------
//-----------------------------------

function create_snakes() {
  snakeHead1 = {
    pos: vec(80, 64),
    turnCenter: vec(80 + radius, 64),
    vy: 0,
    posHistory: [],
    angle: 0,
    tails: [],
    fallingTails: [],
    isHit: false,
    angularSpeed: DEFAULT_ANGULAR_SPEED,
  };
  snakeHead2 = {
    pos: vec(20, 80),
    turnCenter: vec(20 + radius, 80),
    vy: 0,
    posHistory: [],
    angle: 0,
    tails: [],
    fallingTails: [],
    isHit: false,
    angularSpeed: -DEFAULT_ANGULAR_SPEED,
  };
}
function changeSnakeDirection(snake) {
  const deltaX = snake.pos.x - snake.turnCenter.x;
  const deltaY = snake.pos.y - snake.turnCenter.y;

  const newTurnCenterX = snake.pos.x + deltaX;
  const newTurnCenterY = snake.pos.y + deltaY;

  snake.turnCenter.x = newTurnCenterX;
  snake.turnCenter.y = newTurnCenterY;

  // Reverse the angle to keep snakeHead.pos in the same place
  snake.angle = Math.atan2(
    snake.pos.y - snake.turnCenter.y,
    snake.pos.x - snake.turnCenter.x
  );
}

function updateSnakeAngleAndDirection(snake) {
  snake.angle += snake.angularSpeed;
  snake.pos.x = snake.turnCenter.x + radius * Math.cos(snake.angle);
  snake.pos.y = snake.turnCenter.y + radius * Math.sin(snake.angle);
}

function updateSnakePositionHistory(snake) {
  snake.posHistory.unshift(vec(snake.pos));
  if (snake.posHistory.length > 99) {
    snake.posHistory.pop();
  }
}

function handleSnakeCollision(snake, food) {
  ///////////////
  if (snake.tails.length < 30) {
    snake.tails.push({ index: 0, targetIndex: 0 });
  }
  play("select");
  addScore(snake.tails.length, food.pos.x, food.pos.y - 5);
  return true;
}

function handleSnakeTail(snake, skin) {
  remove(snake.tails, (tail, i) => {
    tail.targetIndex = 3 * (i + 1);
    tail.index += (tail.targetIndex - tail.index) * 0.05;
    const p = snake.posHistory[floor(tail.index)];
    const cl = char(skin, p).isColliding;
    //If a tail segment gets hit by a bullet
    if (cl.char.d) {
      play("powerUp");
      snake.isHit = true;
    }
    //Check snake1 collision with h
    checkTailCollision(cl, skin);

    //Add tail segment to fallingsnakeTails array
    if (snake.isHit) {
      console.log("Triggered");
      snake.fallingTails.push({ pos: vec(p), vy: 0 });
      return true;
    }
  });
}

function checkTailCollision(cl, skin) {
  //Check if the snake with skin g is colliding with tail e (tail of the other snake)
  if (skin == "g" && cl.char.e) {
    endGame();
  }
  //Vice versa
  if (skin == "c" && cl.char.a) {
    endGame();
  }
}

function handleTailFalling(snake) {
  remove(snake.fallingTails, (tail) => {
    tail.vy += 0.3 * difficulty;
    tail.pos.y += tail.vy;
    char("g", tail.pos, { mirror: { y: -1 } });
    return tail.pos.y > 103;
  });
}

function handleSnakeOutOfBounds(snake) {
  const LEEWAY = 15;
  if (
    snake.pos.y > VIEW_Y + LEEWAY ||
    snake.pos.y < -LEEWAY ||
    snake.pos.x < -LEEWAY ||
    snake.pos.x > VIEW_X + LEEWAY
  ) {
    endGame();
  }
}

function drawSnakeHeads() {
  char(snakeHead1.vy < 0 ? "b" : "a", snakeHead1.pos, {
    rotation:
      (snakeHead1.angle / Math.PI) * 2 +
      1 * (snakeHead1.angularSpeed / Math.abs(snakeHead1.angularSpeed)),
  });
  char(snakeHead2.vy < 0 ? "f" : "e", snakeHead2.pos, {
    rotation:
      (snakeHead2.angle / Math.PI) * 2 +
      1 * (snakeHead2.angularSpeed / Math.abs(snakeHead2.angularSpeed)),
  });
}

function endGame() {
  play("explosion");
  end();
}
