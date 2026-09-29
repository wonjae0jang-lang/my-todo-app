const canvas = document.querySelector('#game-board');
const context = canvas.getContext('2d');
const scoreElement = document.querySelector('#score');
const bestScoreElement = document.querySelector('#best-score');
const startButton = document.querySelector('#start-button');
const statusElement = document.querySelector('#board-status');
const statusText = document.querySelector('#status-text');
const levelElement = document.querySelector('#level');
const pauseButton = document.querySelector('#pause-button');
const difficultyFieldset = document.querySelector('#difficulty');

const tileSize = 20;
const tileCount = canvas.width / tileSize;
const pointsPerLevel = 50;
const speedUpPerLevel = 10;
const minTickDuration = 30;
const bestScoreKey = 'little-snake-club-best';

let snake = [];
let food = { x: 14, y: 10 };
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let level = 1;
let tickDuration = readDifficulty();
let bestScore = readBestScore();
let gameState = 'ready';
let lastTick = 0;
let animationFrame = 0;

bestScoreElement.textContent = formatScore(bestScore);
resetBoard();

function formatScore(value) {
  return String(value).padStart(3, '0');
}

function readDifficulty() {
  const selected = difficultyFieldset.querySelector('input[name="difficulty"]:checked');
  return Number(selected.value);
}

function updateLevel() {
  level = Math.floor(score / pointsPerLevel) + 1;
  tickDuration = Math.max(minTickDuration, readDifficulty() - (level - 1) * speedUpPerLevel);
  levelElement.textContent = String(level).padStart(2, '0');
}

function setPauseButton(label, icon) {
  pauseButton.innerHTML = `<span class="button-icon" aria-hidden="true">${icon}</span><span>${label}</span>`;
}

function readBestScore() {
  try {
    return Number(localStorage.getItem(bestScoreKey)) || 0;
  } catch {
    return 0;
  }
}

function saveBestScore(value) {
  try {
    localStorage.setItem(bestScoreKey, String(value));
  } catch {
    // The game remains playable when browser storage is unavailable.
  }
}

function resetBoard() {
  snake = [
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  food = placeFood();
  draw();
}

function placeFood() {
  const emptyCells = [];
  for (let y = 0; y < tileCount; y += 1) {
    for (let x = 0; x < tileCount; x += 1) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) {
        emptyCells.push({ x, y });
      }
    }
  }
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function startGame() {
  cancelAnimationFrame(animationFrame);
  score = 0;
  scoreElement.textContent = formatScore(score);
  updateLevel();
  gameState = 'running';
  statusText.textContent = 'IN PLAY';
  statusElement.classList.remove('is-over');
  startButton.innerHTML = '<span class="button-icon" aria-hidden="true">↻</span><span>다시 시작</span>';
  pauseButton.disabled = false;
  setPauseButton('일시정지', '❚❚');
  difficultyFieldset.disabled = true;
  resetBoard();
  lastTick = 0;
  animationFrame = requestAnimationFrame(gameLoop);
}

function togglePause() {
  if (gameState === 'running') {
    gameState = 'paused';
    cancelAnimationFrame(animationFrame);
    statusText.textContent = 'PAUSED';
    setPauseButton('재개', '▶');
  } else if (gameState === 'paused') {
    gameState = 'running';
    statusText.textContent = `IN PLAY · LV ${level}`;
    setPauseButton('일시정지', '❚❚');
    // Resume with a full tick rather than moving immediately.
    lastTick = performance.now();
    animationFrame = requestAnimationFrame(gameLoop);
  }
}

function endGame() {
  gameState = 'over';
  statusText.textContent = 'GAME OVER';
  statusElement.classList.add('is-over');
  startButton.innerHTML = '<span class="button-icon" aria-hidden="true">↻</span><span>다시 시작</span>';
  pauseButton.disabled = true;
  setPauseButton('일시정지', '❚❚');
  difficultyFieldset.disabled = false;
}

function gameLoop(timestamp) {
  if (gameState !== 'running') return;

  if (timestamp - lastTick >= tickDuration) {
    lastTick = timestamp;
    step();
  }

  if (gameState === 'running') {
    animationFrame = requestAnimationFrame(gameLoop);
  }
}

function step() {
  direction = nextDirection;
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };
  const eating = head.x === food.x && head.y === food.y;
  const bodyToCheck = eating ? snake : snake.slice(0, -1);
  const hitWall = head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount;
  const hitSelf = bodyToCheck.some((segment) => segment.x === head.x && segment.y === head.y);

  if (hitWall || hitSelf) {
    endGame();
    draw();
    return;
  }

  snake.unshift(head);
  if (eating) {
    score += 10;
    scoreElement.textContent = formatScore(score);
    if (score > bestScore) {
      bestScore = score;
      bestScoreElement.textContent = formatScore(bestScore);
      saveBestScore(bestScore);
    }
    const previousLevel = level;
    updateLevel();
    if (level > previousLevel) {
      statusText.textContent = `LEVEL UP · LV ${level}`;
    }
    food = placeFood();
  } else {
    snake.pop();
  }

  draw();
}

function draw() {
  context.fillStyle = '#f4f6e9';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = '#e5ead7';
  context.lineWidth = 1;
  for (let position = tileSize; position < canvas.width; position += tileSize) {
    context.beginPath();
    context.moveTo(position + 0.5, 0);
    context.lineTo(position + 0.5, canvas.height);
    context.stroke();
    context.beginPath();
    context.moveTo(0, position + 0.5);
    context.lineTo(canvas.width, position + 0.5);
    context.stroke();
  }

  if (food) {
    const center = food.x * tileSize + tileSize / 2;
    const centerY = food.y * tileSize + tileSize / 2;
    context.fillStyle = '#e45e46';
    context.beginPath();
    context.arc(center, centerY, 7, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#83bd58';
    context.fillRect(center - 1, centerY - 10, 3, 4);
  }

  snake.forEach((segment, index) => {
    context.fillStyle = index === 0 ? '#214f38' : '#3b8058';
    context.fillRect(
      segment.x * tileSize + 2,
      segment.y * tileSize + 2,
      tileSize - 4,
      tileSize - 4,
    );
  });

  drawEyes();
}

function drawEyes() {
  const head = snake[0];
  if (!head) return;

  const eyePositions = direction.x === 1
    ? [[14, 6], [14, 13]]
    : direction.x === -1
      ? [[5, 6], [5, 13]]
      : direction.y === 1
        ? [[6, 14], [13, 14]]
        : [[6, 5], [13, 5]];

  context.fillStyle = '#f4f6e9';
  eyePositions.forEach(([offsetX, offsetY]) => {
    context.fillRect(head.x * tileSize + offsetX, head.y * tileSize + offsetY, 3, 3);
  });
}

const keyDirections = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

document.addEventListener('keydown', (event) => {
  const requestedDirection = keyDirections[event.key];
  if (!requestedDirection) return;
  event.preventDefault();
  if (gameState !== 'running') return;

  if (requestedDirection.x !== -direction.x || requestedDirection.y !== -direction.y) {
    nextDirection = requestedDirection;
  }
});

startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePause);
difficultyFieldset.addEventListener('change', updateLevel);
