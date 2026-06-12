const canvas = document.querySelector("#board");
const ctx = canvas.getContext("2d");
const rainCanvas = document.querySelector("#matrixRain");
const rainCtx = rainCanvas.getContext("2d");
const overlay = document.querySelector("#overlay");
const playButton = document.querySelector("#play");
const gameOverTitle = document.querySelector("#gameOverTitle");
const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best");

const cells = 24;
const cellSize = canvas.width / cells;
const startTickMs = 104;
const fastestTickMs = 58;
const bestKey = "snake-game-best";

let snake;
let food;
let direction;
let queuedDirection;
let score = 0;
let best = Number(localStorage.getItem(bestKey) || 0);
let timer = null;
let currentTickMs = startTickMs;
let running = false;
let ended = false;
let rainColumns = [];
let rainFontSize = 18;
let rainFrame = 0;

bestEl.textContent = best;

function resetGame(startNow = false) {
  snake = [
    { x: 13, y: 12 },
    { x: 12, y: 12 },
    { x: 11, y: 12 },
    { x: 10, y: 12 },
    { x: 9, y: 12 }
  ];
  direction = { x: 1, y: 0 };
  queuedDirection = direction;
  score = 0;
  currentTickMs = startTickMs;
  ended = false;
  gameOverTitle.hidden = true;
  playButton.classList.remove("is-restart");
  updateScore();
  placeFood();
  draw();

  if (startNow) {
    startGame();
  } else {
    stopGame();
  }
}

function startGame() {
  overlay.classList.remove("visible");
  running = true;
  clearInterval(timer);
  timer = setInterval(step, currentTickMs);
}

function stopGame() {
  running = false;
  clearInterval(timer);
  timer = null;
}

function gameOver() {
  stopGame();
  ended = true;
  gameOverTitle.hidden = false;
  playButton.textContent = "Start again";
  playButton.classList.add("is-restart");
  overlay.classList.add("visible");
}

function step() {
  direction = queuedDirection;
  const head = snake[0];
  const next = {
    x: head.x + direction.x,
    y: head.y + direction.y
  };
  const eating = next.x === food.x && next.y === food.y;
  const bodyToCheck = eating ? snake : snake.slice(0, -1);

  if (isOutsideBoard(next)) {
    gameOver();
    draw();
    return;
  }

  if (bodyToCheck.some(part => part.x === next.x && part.y === next.y)) {
    gameOver();
    draw();
    return;
  }

  snake.unshift(next);

  if (eating) {
    score += 1;
    if (score > best) {
      best = score;
      localStorage.setItem(bestKey, best);
    }
    updateScore();
    increaseDifficulty();
    placeFood();
  } else {
    snake.pop();
  }

  draw();
}

function isOutsideBoard(point) {
  return point.x < 0 || point.x >= cells || point.y < 0 || point.y >= cells;
}

function updateScore() {
  scoreEl.textContent = score;
  bestEl.textContent = best;
}

function increaseDifficulty() {
  currentTickMs = Math.max(fastestTickMs, startTickMs - score * 4);
  if (running) {
    clearInterval(timer);
    timer = setInterval(step, currentTickMs);
  }
}

function placeFood() {
  const margin = 2;
  const playableCells = cells - margin * 2;

  do {
    food = {
      x: margin + Math.floor(Math.random() * playableCells),
      y: margin + Math.floor(Math.random() * playableCells)
    };
  } while (snake.some(part => part.x === food.x && part.y === food.y));
}

function setDirection(nextName) {
  const next = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  }[nextName];

  if (!next) return;
  if (next.x + direction.x === 0 && next.y + direction.y === 0) return;

  queuedDirection = next;
  if (!running && !ended) startGame();
}

function draw() {
  drawDuneBoard();

  drawFood();
  drawWorm();
}

function drawDuneBoard() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#211306");
  gradient.addColorStop(0.55, "#120b05");
  gradient.addColorStop(1, "#2a1607");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255, 208, 138, 0.055)";
  ctx.lineWidth = 1;
  for (let y = 120; y < canvas.height; y += 68) {
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += 24) {
      const waveY = y + Math.sin((x + y) * 0.018) * 12;
      if (x === 0) {
        ctx.moveTo(x, waveY);
      } else {
        ctx.lineTo(x, waveY);
      }
    }
    ctx.stroke();
  }

  const glow = ctx.createRadialGradient(
    canvas.width * 0.52,
    canvas.height * 0.56,
    20,
    canvas.width * 0.52,
    canvas.height * 0.56,
    canvas.width * 0.62
  );
  glow.addColorStop(0, "rgba(244, 185, 66, 0.11)");
  glow.addColorStop(1, "rgba(244, 185, 66, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawFood() {
  const centerX = food.x * cellSize + cellSize / 2;
  const centerY = food.y * cellSize + cellSize / 2;
  const radius = cellSize * 0.28;

  ctx.fillStyle = "rgba(255, 47, 146, 0.22)";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 1.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff2f92";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(0, 217, 255, 0.72)";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    food.x * cellSize + 7,
    food.y * cellSize + 7,
    cellSize - 14,
    cellSize - 14
  );
}

function drawWorm() {
  const points = snake.map(part => ({
    x: part.x * cellSize + cellSize / 2,
    y: part.y * cellSize + cellSize / 2
  }));

  drawWormBody(points, cellSize * 0.72, "rgba(61, 35, 16, 0.72)");
  drawWormBody(points, cellSize * 0.58, "#b77a37");
  drawWormBody(points, cellSize * 0.34, "rgba(255, 208, 138, 0.72)");
  drawWormRidges(points);
  drawWormHead(points[0]);
}

function drawWormBody(points, width, color) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.shadowColor = "rgba(200, 145, 75, 0.26)";
  ctx.shadowBlur = width * 0.42;

  beginBrokenPath(points);
  ctx.stroke();
  ctx.restore();
}

function beginBrokenPath(points) {
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
      return;
    }

    const previous = points[index - 1];
    const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
    if (distance > cellSize * 1.6) {
      ctx.moveTo(point.x, point.y);
    } else {
      const midX = (previous.x + point.x) / 2;
      const midY = (previous.y + point.y) / 2;
      ctx.quadraticCurveTo(previous.x, previous.y, midX, midY);
    }
  });
}

function drawWormRidges(points) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(42, 24, 11, 0.42)";
  ctx.lineWidth = 2.2;

  points.slice(1).forEach((point, index) => {
    const previous = points[index];
    if (Math.hypot(point.x - previous.x, point.y - previous.y) > cellSize * 1.6) return;

    const dx = point.x - previous.x;
    const dy = point.y - previous.y;
    const length = Math.hypot(dx, dy) || 1;
    const normalX = -dy / length;
    const normalY = dx / length;
    const ridgeLength = cellSize * 0.38;

    ctx.beginPath();
    ctx.moveTo(point.x - normalX * ridgeLength, point.y - normalY * ridgeLength);
    ctx.lineTo(point.x + normalX * ridgeLength, point.y + normalY * ridgeLength);
    ctx.stroke();
  });

  ctx.restore();
}

function drawWormHead(head) {
  const radius = cellSize * 0.42;
  const mouthX = head.x + direction.x * radius * 0.32;
  const mouthY = head.y + direction.y * radius * 0.32;

  ctx.save();
  ctx.shadowColor = "rgba(255, 208, 138, 0.5)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#ffd08a";
  ctx.beginPath();
  ctx.arc(head.x, head.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(90, 50, 20, 0.72)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(mouthX, mouthY, radius * 0.42, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(24, 11, 7, 0.9)";
  ctx.beginPath();
  ctx.arc(mouthX, mouthY, radius * 0.23, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 47, 146, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(mouthX, mouthY, radius * 0.56, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function newRun() {
  playButton.textContent = "Start";
  playButton.classList.remove("is-restart");
  gameOverTitle.hidden = true;
  overlay.classList.add("visible");
  resetGame(false);
}

playButton.addEventListener("click", () => resetGame(true));

document.querySelectorAll("[data-dir]").forEach(button => {
  button.addEventListener("click", () => setDirection(button.dataset.dir));
});

window.addEventListener("keydown", event => {
  const keyMap = {
    ArrowUp: "up",
    KeyW: "up",
    ArrowDown: "down",
    KeyS: "down",
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right"
  };

  if (event.code === "Space") {
    event.preventDefault();
    if (ended || !running) resetGame(true);
    return;
  }

  const next = keyMap[event.code];
  if (next) {
    event.preventDefault();
    setDirection(next);
  }
});

resetGame(false);

function resizeMatrixRain() {
  const scale = window.devicePixelRatio || 1;
  rainCanvas.width = Math.floor(window.innerWidth * scale);
  rainCanvas.height = Math.floor(window.innerHeight * scale);
  rainCanvas.style.width = `${window.innerWidth}px`;
  rainCanvas.style.height = `${window.innerHeight}px`;
  rainCtx.setTransform(scale, 0, 0, scale, 0, 0);

  rainFontSize = window.innerWidth < 700 ? 14 : 18;
  const columnCount = Math.ceil(window.innerWidth / rainFontSize);
  rainColumns = Array.from({ length: columnCount }, () => Math.random() * window.innerHeight);
}

function drawMatrixRain() {
  const glyphs = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/[]{}";
  rainCtx.fillStyle = "rgba(1, 3, 2, 0.13)";
  rainCtx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  rainCtx.font = `${rainFontSize}px Consolas, monospace`;
  rainCtx.textAlign = "center";

  rainFrame += 1;
  rainColumns.forEach((y, index) => {
    const x = index * rainFontSize + rainFontSize / 2;
    const glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
    rainCtx.fillStyle = rainFrame % 9 === 0 ? "rgba(218, 255, 230, 0.78)" : "rgba(0, 255, 136, 0.42)";
    rainCtx.fillText(glyph, x, y);

    rainColumns[index] = y > window.innerHeight + Math.random() * 900 ? 0 : y + rainFontSize * 0.28;
  });

  requestAnimationFrame(drawMatrixRain);
}

resizeMatrixRain();
drawMatrixRain();
window.addEventListener("resize", resizeMatrixRain);
