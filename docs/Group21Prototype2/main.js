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

/** @type {{pos: Vector, vy: number, posHistory: Vector[], isJumping: boolean}} */
let bird;
/** @type {{index: number, targetIndex: number}[]} */
let chicks;
/** @type {{pos: Vector, vy: number}[]} */
let fallingChicks;
/** @type {{pos: Vector, width: number, hasChick: boolean}[]} */
let floors;

/** @type {{pos: Vector, vx: number}[]} */
let bullets;
/** @type {{pos: Vector, vx: number}[]} */
let spawnedChicks;

let nextBulletDist;
let nextChickDist;
let isFalling;
let nextFloorDist;

function update() {
  //Initializer function
  if (!ticks) {
    bird = { pos: vec(64, 32), vy: 0, posHistory: [], isJumping: true };
    chicks = [];
    fallingChicks = [];
    spawnedChicks = [];
    floors = [
      { pos: vec(70, 70), width: 90, hasChick: false },
      { pos: vec(150, 50), width: 90, hasChick: true },
    ];
    nextFloorDist = 0;
    bullets = [];
    nextBulletDist = 99;
    nextChickDist = 80;
    isFalling = false;
  }

  const scoreModifier = sqrt(difficulty);
  if (bird.isJumping) {
    //Double jump
    if (chicks.length > 0 && input.isJustPressed) {
      play("jump");
      play("hit");
      //bird.vy = -2 * sqrt(difficulty);
      // chicks.shift();
      // fallingChicks.push({ pos: vec(bird.posHistory[2]), vy: 0 });
    }

    //Moving the bird when in the air
    const MOVEMENTS_PER_FRAME = 10;
    const pp = vec(bird.pos);
    //bird.vy += (input.isPressed ? -0.2 : 0.2) * difficulty;
    bird.vy = (input.isPressed ? -0.8 : 0.8) * difficulty;
    bird.pos.y += bird.vy;
    const op = vec(bird.pos).sub(pp).div(MOVEMENTS_PER_FRAME);
    color("white");
    //Discrete movements for collision checking
    times(MOVEMENTS_PER_FRAME, () => {
      pp.add(op);
      box(pp, 6);
    });
  } else {
    //Make the player jump
    if (input.isJustPressed) {
      play("jump");
      //bird.vy = -2 * sqrt(difficulty);
      bird.isJumping = true;
    }
  }
  color("black");

  //Select correct sprite, jumping = b or falling = a
  char(bird.vy < 0 ? "b" : "a", bird.pos);
  nextFloorDist -= scoreModifier;
  //Create floor
  if (nextFloorDist < 0) {
    const width = rnd(40, 80);
    /*
    floors.push({
      pos: vec(200 + width / 2, rndi(30, 90)),
      width,
      hasChick: true,
    });
    */
    nextFloorDist += width + rnd(10, 30);
  }

  remove(floors, (f) => {
    f.pos.x -= scoreModifier;
    color("light_yellow");

    //Collision with yellow platform
    const c = box(f.pos, f.width, 4).isColliding.rect;
    if (bird.vy > 0 && c.white) {
      bird.pos.y = f.pos.y - 5;
      bird.isJumping = false;
      bird.vy = 0;
    }

    //If a platform has a chick
    /*
    if (f.hasChick) {
      color("black");
      const c = char("c", f.pos.x, f.pos.y - 5).isColliding.char;

      //Pick it up if you touch it (and you have < 30)
      if (c.a || c.b) {
        if (chicks.length < 30) {
          chicks.push({ index: 0, targetIndex: 0 });
        }
        play("select");
        addScore(chicks.length, f.pos.x, f.pos.y - 5);
        f.hasChick = false;
      }
    }
    */
    return f.pos.x < -f.width / 2;
  });
  // if (Math.random() < 0.001) {
  //   color("black");
  //   console.log("Triggered");
  //   const c = char("c", VIEW_X + 50, rnd(10, VIEW_Y - 10)).isColliding.char;
  //   spawnedChicks.push(c);
  //   console.log(spawnedChicks);
  //   //Pick it up if you touch it (and you have < 30)
  //   if (c.a || c.b) {
  //     if (chicks.length < 30) {
  //       chicks.push({ index: 0, targetIndex: 0 });
  //     }
  //     play("select");

  //     //
  //   }
  // }

  nextChickDist -= scoreModifier;
  if (nextChickDist < 0) {
    spawnedChicks.push({ pos: vec(203, rndi(10, 90)), vx: rnd(1, difficulty) * 0.3 });
    nextChickDist += rnd(50, 80) / sqrt(difficulty);
  }
  color("black");
  //cleaning up chicks  and handling chick collision, and moving
  remove(spawnedChicks, (chick) => {
    //update bullet position by velocity
    chick.pos.x -= chick.vx + scoreModifier;

    const c = char("c", chick.pos).isColliding.char;
    if (c.a || c.b) {
      if (chicks.length < 30) {
          chicks.push({ index: 0, targetIndex: 0 });
      }
      play("select");
      addScore(chicks.length, chick.pos.x, chick.pos.y - 5);
      return true;
    }
    return chick.pos.x < -3;
  });
 

  //Causes chicks to follow behind you
  bird.posHistory.forEach((p) => {
    p.x -= .65;
  });

  //Add birds position to vector history, dont let history be longer than 99 entries
  bird.posHistory.unshift(vec(bird.pos));
  if (bird.posHistory.length > 99) {
    bird.posHistory.pop();
  }
  color("transparent");

  //Set isJumping to true if player falls off platform
  if (!bird.isJumping) {
    if (!box(bird.pos.x, bird.pos.y + 4, 9, 2).isColliding.rect.light_yellow) {
      bird.isJumping = true;
    }
  }

  //Bullet spawning
  nextBulletDist -= scoreModifier;
  if (nextBulletDist < 0) {
    bullets.push({ pos: vec(203, rndi(10, 90)), vx: rnd(1, difficulty) * 0.3 });
    nextBulletDist += rnd(50, 80) / sqrt(difficulty);
  }
  color("black");
  //cleaning up bullets  and handling bullet collision, and moving
  remove(bullets, (b) => {
    //update bullet position by velocity
    b.pos.x -= b.vx + scoreModifier;

    const c = char("d", b.pos).isColliding.char;
    if (c.a || c.b) {
      play("explosion");
      if (chicks.length > 0) {
        isFalling = true;
        bird.vy = 3 * sqrt(difficulty);
      } else {
        end();
      }
      return true;
    }
    return b.pos.x < -3;
  });
  color("black");
  let isHit = isFalling;
  isFalling = false;

  remove(chicks, (c, i) => {
    c.targetIndex = 3 * (i + 1);
    c.index += (c.targetIndex - c.index) * 0.05;
    const p = bird.posHistory[floor(c.index)];
    const cl = char("c", p).isColliding;
    //If a chick gets hit by a bullet
    if (cl.char.d) {
      play("powerUp");
      isHit = true;
    }

    //Add chick to fallingChicks array
    if (isHit) {
      console.log("Triggered");
      fallingChicks.push({ pos: vec(p), vy: 0 });
      return true;
    }
  });

  //Remove chick when they fall off screen
  remove(fallingChicks, (f) => {
    f.vy += 0.3 * difficulty;
    f.pos.y += f.vy;
    char("c", f.pos, { mirror: { y: -1 } });
    return f.pos.y > 103;
  });
  color("black");
  char(bird.vy < 0 ? "b" : "a", bird.pos);

  if (bird.pos.y > VIEW_Y - 1) {
    play("explosion");
    end();
  }
}
