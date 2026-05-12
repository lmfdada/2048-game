document.addEventListener('DOMContentLoaded', () => {
  const boardSize = 4;
  let board = [];
  let score = 0;
  let bestScore = localStorage.getItem('2048-best-score') || 0;
  let hasWon = false;
  let isGameOver = false;

  const scoreEl = document.getElementById('score');
  const bestScoreEl = document.getElementById('best-score');
  const tileContainer = document.getElementById('tile-container');
  const restartBtn = document.getElementById('restart-btn');
  const retryBtn = document.getElementById('retry-btn');
  const gameMessage = document.getElementById('game-message');
  const gameMessageText = document.getElementById('game-message-text');
  const gameSelect = document.getElementById('game-select');
  const gameTitle = document.getElementById('game-title');
  const gameSubtitle = document.getElementById('game-subtitle');
  const view2048 = document.getElementById('game-2048');
  const viewSnake = document.getElementById('game-snake');
  const snakeCanvas = document.getElementById('snake-canvas');
  const snakeMessage = document.getElementById('snake-message');
  const snakeMessageText = document.getElementById('snake-message-text');
  const snakeRetryBtn = document.getElementById('snake-retry-btn');
  const viewTetris = document.getElementById('game-tetris');
  const tetrisCanvas = document.getElementById('tetris-canvas');
  const tetrisMessage = document.getElementById('tetris-message');
  const tetrisMessageText = document.getElementById('tetris-message-text');
  const tetrisRetryBtn = document.getElementById('tetris-retry-btn');
  const gameInstructions = document.getElementById('game-instructions');

  let currentGame = '2048';

  const instructionsData = {
    '2048': {
      title: '操作说明',
      items: [
        { label: '移动方块', value: '滑动屏幕 或 键盘 ↑↓←→ / WASD' },
        { label: '游戏目标', value: '合并相同数字直到得到 2048' }
      ]
    },
    'snake': {
      title: '操作说明',
      items: [
        { label: '控制方向', value: '滑动屏幕 或 键盘 ↑↓←→ / WASD' },
        { label: '游戏目标', value: '吃掉红点变长，避开墙壁和自身' }
      ]
    },
    'tetris': {
      title: '操作说明',
      items: [
        { label: '旋转方块', value: '点击屏幕、向上滑动 或 键盘 ↑ / W' },
        { label: '移动方块', value: '左右滑动 或 键盘 ← → / A D' },
        { label: '加速下落', value: '向下滑动 或 键盘 ↓ / S' },
        { label: '快速下落', value: '按键盘 空格键 (Hard Drop)' }
      ]
    }
  };

  function updateInstructions(game) {
    const data = instructionsData[game];
    if (!data) return;

    let html = `<div class="instruction-title">${data.title}</div>`;
    html += `<ul class="instruction-list">`;
    data.items.forEach(item => {
      html += `
        <li class="instruction-item">
          <span class="instruction-label">${item.label}</span>
          <span class="instruction-value">${item.value}</span>
        </li>
      `;
    });
    html += `</ul>`;
    gameInstructions.innerHTML = html;
  }

  // Snake Game State
  let snake = [];
  let food = { x: 0, y: 0 };
  let direction = 'right';
  let nextDirection = 'right';
  let snakeSpeed = 150;
  let snakeInterval = null;
  let snakeScore = 0;
  const gridSize = 20;

  // Tetris Game State
  const tetrisCols = 10;
  const tetrisRows = 20;
  let tetrisBoard = [];
  let currentPiece = null;
  let tetrisInterval = null;
  let tetrisScore = 0;
  let tetrisSpeed = 800;

  const tetrisPieces = {
    'I': { shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], color: '#22d3ee' },
    'J': { shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], color: '#3b82f6' },
    'L': { shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], color: '#fb923c' },
    'O': { shape: [[1, 1], [1, 1]], color: '#facc15' },
    'S': { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: '#4ade80' },
    'T': { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], color: '#c084fc' },
    'Z': { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: '#f87171' }
  };

  bestScoreEl.textContent = bestScore;

  function initGame() {
    stopAllGames();
    const selectedGame = gameSelect.value;
    updateInstructions(selectedGame);
    
    if (selectedGame === '2048') {
      currentGame = '2048';
      gameTitle.textContent = '2048';
      gameSubtitle.innerHTML = 'Join the numbers and get to the <strong>2048 tile!</strong>';
      view2048.classList.remove('hidden');
      viewSnake.classList.add('hidden');
      viewTetris.classList.add('hidden');
      init2048();
    } else if (selectedGame === 'snake') {
      currentGame = 'snake';
      gameTitle.textContent = 'Snake';
      gameSubtitle.innerHTML = 'Eat the food and grow longer. <strong>Don\'t hit the walls!</strong>';
      view2048.classList.add('hidden');
      viewSnake.classList.remove('hidden');
      viewTetris.classList.add('hidden');
      initSnake();
    } else if (selectedGame === 'tetris') {
      currentGame = 'tetris';
      gameTitle.textContent = 'Tetris';
      gameSubtitle.innerHTML = 'Stack the blocks and clear the lines. <strong>Arrow Up to rotate!</strong>';
      view2048.classList.add('hidden');
      viewSnake.classList.add('hidden');
      viewTetris.classList.remove('hidden');
      initTetris();
    }
  }

  function stopAllGames() {
    if (snakeInterval) {
      clearInterval(snakeInterval);
      snakeInterval = null;
    }
    if (tetrisInterval) {
      clearInterval(tetrisInterval);
      tetrisInterval = null;
    }
  }

  function init2048() {
    board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
    score = 0;
    hasWon = false;
    isGameOver = false;
    scoreEl.textContent = score;
    bestScore = localStorage.getItem('2048-best-score') || 0;
    bestScoreEl.textContent = bestScore;
    gameMessage.classList.remove('game-over', 'game-won');
    tileContainer.innerHTML = '';
    
    addRandomTile();
    addRandomTile();
    renderBoard();
  }

  function initSnake() {
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    direction = 'right';
    nextDirection = 'right';
    snakeScore = 0;
    scoreEl.textContent = snakeScore;
    bestScore = localStorage.getItem('snake-best-score') || 0;
    bestScoreEl.textContent = bestScore;
    snakeMessage.classList.remove('game-over');
    
    createFood();
    startSnakeLoop();
  }

  function initTetris() {
    tetrisBoard = Array(tetrisRows).fill(null).map(() => Array(tetrisCols).fill(0));
    tetrisScore = 0;
    scoreEl.textContent = tetrisScore;
    bestScore = localStorage.getItem('tetris-best-score') || 0;
    bestScoreEl.textContent = bestScore;
    tetrisMessage.classList.remove('game-over');
    tetrisSpeed = 800;
    
    spawnTetrisPiece();
    startTetrisLoop();
  }

  function spawnTetrisPiece() {
    const keys = Object.keys(tetrisPieces);
    const type = keys[Math.floor(Math.random() * keys.length)];
    const piece = tetrisPieces[type];
    
    currentPiece = {
      shape: JSON.parse(JSON.stringify(piece.shape)), // Deep copy
      color: piece.color,
      x: Math.floor(tetrisCols / 2) - Math.floor(piece.shape[0].length / 2),
      y: -1 // Start slightly above
    };

    if (checkTetrisCollision()) {
      gameOverTetris();
    }
    drawTetris();
  }

  function checkTetrisCollision(piece = currentPiece) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardX = piece.x + x;
          const boardY = piece.y + y;
          
          // Check horizontal boundaries
          if (boardX < 0 || boardX >= tetrisCols) return true;
          // Check vertical bottom boundary
          if (boardY >= tetrisRows) return true;
          // Check collision with existing blocks on board
          if (boardY >= 0 && tetrisBoard[boardY][boardX]) return true;
        }
      }
    }
    return false;
  }

  function rotateTetrisPiece() {
    if (!currentPiece) return;
    
    const oldShape = currentPiece.shape;
    const oldX = currentPiece.x;
    const oldY = currentPiece.y;
    
    // Matrix rotation
    const size = currentPiece.shape.length;
    const newShape = Array(size).fill(null).map(() => Array(size).fill(0));
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        newShape[x][size - 1 - y] = currentPiece.shape[y][x];
      }
    }
    
    currentPiece.shape = newShape;
    
    // Enhanced Wall Kick: Try various offsets to make rotation possible
    const kicks = [
      [0, 0], [1, 0], [-1, 0], [0, -1], [2, 0], [-2, 0], [0, -2]
    ];
    
    let success = false;
    for (const [kickX, kickY] of kicks) {
      currentPiece.x = oldX + kickX;
      currentPiece.y = oldY + kickY;
      if (!checkTetrisCollision()) {
        success = true;
        break;
      }
    }
    
    if (!success) {
      currentPiece.shape = oldShape;
      currentPiece.x = oldX;
      currentPiece.y = oldY;
    }
    
    drawTetris();
  }

  function moveTetrisPiece(dx, dy) {
    currentPiece.x += dx;
    currentPiece.y += dy;
    if (checkTetrisCollision()) {
      currentPiece.x -= dx;
      currentPiece.y -= dy;
      if (dy > 0) {
        freezeTetrisPiece();
        clearTetrisLines();
        spawnTetrisPiece();
      }
      return false;
    }
    drawTetris();
    return true;
  }

  function freezeTetrisPiece() {
    currentPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const boardY = currentPiece.y + y;
          const boardX = currentPiece.x + x;
          if (boardY >= 0) {
            tetrisBoard[boardY][boardX] = currentPiece.color;
          }
        }
      });
    });
  }

  function clearTetrisLines() {
    let linesCleared = 0;
    for (let y = tetrisRows - 1; y >= 0; y--) {
      if (tetrisBoard[y].every(cell => cell !== 0)) {
        tetrisBoard.splice(y, 1);
        tetrisBoard.unshift(Array(tetrisCols).fill(0));
        linesCleared++;
        y++;
      }
    }
    if (linesCleared > 0) {
      tetrisScore += [0, 100, 300, 500, 800][linesCleared];
      scoreEl.textContent = tetrisScore;
      if (tetrisScore > bestScore) {
        bestScore = tetrisScore;
        bestScoreEl.textContent = bestScore;
        localStorage.setItem('tetris-best-score', bestScore);
      }
      // Speed up slightly
      tetrisSpeed = Math.max(100, 800 - Math.floor(tetrisScore / 500) * 50);
      startTetrisLoop();
    }
  }

  function startTetrisLoop() {
    if (tetrisInterval) clearInterval(tetrisInterval);
    tetrisInterval = setInterval(() => {
      moveTetrisPiece(0, 1);
    }, tetrisSpeed);
  }

  function drawTetris() {
    const ctx = tetrisCanvas.getContext('2d');
    const width = tetrisCanvas.width = tetrisCanvas.offsetWidth * window.devicePixelRatio;
    const height = tetrisCanvas.height = tetrisCanvas.offsetHeight * window.devicePixelRatio;
    const cellW = width / tetrisCols;
    const cellH = height / tetrisRows;

    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)'; // Subtle cell-bg color
    ctx.lineWidth = 1;
    for (let x = 0; x <= tetrisCols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellW, 0);
      ctx.lineTo(x * cellW, height);
      ctx.stroke();
    }
    for (let y = 0; y <= tetrisRows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellH);
      ctx.lineTo(width, y * cellH);
      ctx.stroke();
    }

    // Draw board
    tetrisBoard.forEach((row, y) => {
      row.forEach((color, x) => {
        if (color) {
          drawTetrisBlock(ctx, x, y, color, cellW, cellH);
        }
      });
    });

    // Draw current piece
    if (currentPiece) {
      currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            drawTetrisBlock(ctx, currentPiece.x + x, currentPiece.y + y, currentPiece.color, cellW, cellH);
          }
        });
      });
    }
  }

  function drawTetrisBlock(ctx, x, y, color, w, h) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x * w + 1, y * h + 1, w - 2, h - 2, 4);
    ctx.fill();
    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x * w + 1, y * h + 1, w - 2, h / 4);
  }

  function gameOverTetris() {
    clearInterval(tetrisInterval);
    tetrisInterval = null;
    tetrisMessageText.textContent = "Game Over!";
    tetrisMessage.classList.add('game-over');
  }

  function createFood() {
    food = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize)
    };
    // Make sure food doesn't spawn on snake
    if (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
      createFood();
    }
  }

  function startSnakeLoop() {
    if (snakeInterval) clearInterval(snakeInterval);
    snakeInterval = setInterval(moveSnake, snakeSpeed);
  }

  function moveSnake() {
    direction = nextDirection;
    const head = { ...snake[0] };

    if (direction === 'up') head.y--;
    else if (direction === 'down') head.y++;
    else if (direction === 'left') head.x--;
    else if (direction === 'right') head.x++;

    // Check collision
    if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize || 
        snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      gameOverSnake();
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      snakeScore += 10;
      scoreEl.textContent = snakeScore;
      if (snakeScore > bestScore) {
        bestScore = snakeScore;
        bestScoreEl.textContent = bestScore;
        localStorage.setItem('snake-best-score', bestScore);
      }
      createFood();
    } else {
      snake.pop();
    }

    drawSnake();
  }

  function drawSnake() {
    const ctx = snakeCanvas.getContext('2d');
    const width = snakeCanvas.width = snakeCanvas.offsetWidth * window.devicePixelRatio;
    const height = snakeCanvas.height = snakeCanvas.offsetHeight * window.devicePixelRatio;
    const cellW = width / gridSize;
    const cellH = height / gridSize;

    ctx.clearRect(0, 0, width, height);

    // Draw food
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(food.x * cellW + 2, food.y * cellH + 2, cellW - 4, cellH - 4, 4);
    ctx.fill();

    // Draw snake
    snake.forEach((segment, i) => {
      ctx.fillStyle = i === 0 ? '#3b82f6' : '#60a5fa';
      ctx.beginPath();
      ctx.roundRect(segment.x * cellW + 1, segment.y * cellH + 1, cellW - 2, cellH - 2, 4);
      ctx.fill();
    });
  }

  function gameOverSnake() {
    clearInterval(snakeInterval);
    snakeInterval = null;
    snakeMessageText.textContent = "Game Over!";
    snakeMessage.classList.add('game-over');
  }

  gameSelect.addEventListener('change', (e) => {
    initGame();
  });

  function addRandomTile() {
    const emptyCells = [];
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        if (!board[r][c]) {
          emptyCells.push({ r, c });
        }
      }
    }
    if (emptyCells.length === 0) return;
    
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    board[randomCell.r][randomCell.c] = {
      id: Math.random().toString(36).substring(2, 9),
      value: value,
      isNew: true,
      isMerged: false,
      r: randomCell.r,
      c: randomCell.c
    };
  }

  function renderBoard() {
    tileContainer.innerHTML = '';
    
    const boardEl = document.querySelector('.game-board');
    const gap = parseFloat(getComputedStyle(boardEl).gap) || 10;
    
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        const tile = board[r][c];
        if (tile) {
          const tileEl = document.createElement('div');
          
          let classes = ['tile', `tile-${tile.value > 2048 ? 'super' : tile.value}`];
          if (tile.isNew) {
            classes.push('tile-new');
            tile.isNew = false;
          }
          if (tile.isMerged) {
            classes.push('tile-merged');
            tile.isMerged = false;
          }
          
          tileEl.className = classes.join(' ');
          
          const tileWidth = `calc(25% - ${gap * 0.75}px)`;
          tileEl.style.width = tileWidth;
          tileEl.style.height = tileWidth;
          
          tileEl.style.left = `calc(${c * 25}% + ${c * gap * 0.25}px)`;
          tileEl.style.top = `calc(${r * 25}% + ${r * gap * 0.25}px)`;
          
          const innerEl = document.createElement('div');
          innerEl.className = 'tile-inner';
          innerEl.textContent = tile.value;
          
          tileEl.appendChild(innerEl);
          tileContainer.appendChild(tileEl);
        }
      }
    }
    
    scoreEl.textContent = score;
    if (score > bestScore) {
      bestScore = score;
      bestScoreEl.textContent = bestScore;
      localStorage.setItem('2048-best-score', bestScore);
    }
    
    if (!hasWon && checkWin()) {
      hasWon = true;
      gameMessageText.textContent = "You Win!";
      gameMessage.classList.add('game-won');
    } else if (checkGameOver()) {
      isGameOver = true;
      gameMessageText.textContent = "Game Over!";
      gameMessage.classList.add('game-over');
    }
  }

  function move(direction) {
    if (isGameOver) return;
    
    let hasMoved = false;
    let scoreAddition = 0;

    const vector = {
      0: { r: -1, c: 0 }, // Up
      1: { r: 0, c: 1 },  // Right
      2: { r: 1, c: 0 },  // Down
      3: { r: 0, c: -1 }  // Left
    }[direction];

    const traversals = buildTraversals(vector);
    
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            if(board[r][c]) board[r][c].mergedThisTurn = false;
        }
    }

    traversals.r.forEach(r => {
      traversals.c.forEach(c => {
        const tile = board[r][c];
        if (tile) {
          const positions = findFarthestPosition({ r, c }, vector);
          const next = board[positions.next.r]?.[positions.next.c];

          if (next && next.value === tile.value && !next.mergedThisTurn) {
            const mergedTile = {
              id: Math.random().toString(36).substring(2, 9),
              value: tile.value * 2,
              isMerged: true,
              mergedThisTurn: true,
              r: positions.next.r,
              c: positions.next.c
            };
            board[r][c] = null;
            board[positions.next.r][positions.next.c] = mergedTile;
            score += mergedTile.value;
            scoreAddition += mergedTile.value;
            hasMoved = true;
          } else {
            if (positions.farthest.r !== r || positions.farthest.c !== c) {
              board[positions.farthest.r][positions.farthest.c] = tile;
              board[r][c] = null;
              tile.r = positions.farthest.r;
              tile.c = positions.farthest.c;
              hasMoved = true;
            }
          }
        }
      });
    });

    if (hasMoved) {
      addRandomTile();
      renderBoard();
      
      if (scoreAddition > 0) {
        showScoreAddition(scoreAddition);
      }
    }
  }
  
  function showScoreAddition(amount) {
    const addition = document.createElement('div');
    addition.classList.add('score-addition');
    addition.textContent = `+${amount}`;
    document.querySelector('.score-container').appendChild(addition);
    setTimeout(() => {
        addition.remove();
    }, 600);
  }

  function buildTraversals(vector) {
    const traversals = { r: [], c: [] };
    for (let pos = 0; pos < boardSize; pos++) {
      traversals.r.push(pos);
      traversals.c.push(pos);
    }
    if (vector.r === 1) traversals.r.reverse();
    if (vector.c === 1) traversals.c.reverse();
    return traversals;
  }

  function findFarthestPosition(cell, vector) {
    let previous;
    do {
      previous = cell;
      cell = { r: previous.r + vector.r, c: previous.c + vector.c };
    } while (withinBounds(cell) && !board[cell.r][cell.c]);

    return {
      farthest: previous,
      next: cell
    };
  }

  function withinBounds(position) {
    return position.r >= 0 && position.r < boardSize &&
           position.c >= 0 && position.c < boardSize;
  }

  function checkWin() {
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        if (board[r][c] && board[r][c].value === 2048) {
          return true;
        }
      }
    }
    return false;
  }

  function checkGameOver() {
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        if (!board[r][c]) return false;
      }
    }
    
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        const current = board[r][c].value;
        if ((r < boardSize - 1 && board[r + 1][c].value === current) ||
            (c < boardSize - 1 && board[r][c + 1].value === current)) {
          return false;
        }
      }
    }
    return true;
  }

  document.addEventListener('keydown', (e) => {
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.key) > -1) {
        e.preventDefault();
    }
    
    if (currentGame === '2048') {
      switch (e.key) {
        case 'ArrowUp':
        case 'w': move(0); break;
        case 'ArrowRight':
        case 'd': move(1); break;
        case 'ArrowDown':
        case 's': move(2); break;
        case 'ArrowLeft':
        case 'a': move(3); break;
      }
    } else if (currentGame === 'snake') {
      switch (e.key) {
        case 'ArrowUp':
        case 'w': if (direction !== 'down') nextDirection = 'up'; break;
        case 'ArrowRight':
        case 'd': if (direction !== 'left') nextDirection = 'right'; break;
        case 'ArrowDown':
        case 's': if (direction !== 'up') nextDirection = 'down'; break;
        case 'ArrowLeft':
        case 'a': if (direction !== 'right') nextDirection = 'left'; break;
      }
    } else if (currentGame === 'tetris') {
      switch (e.key) {
        case 'ArrowUp':
        case 'w': rotateTetrisPiece(); break;
        case 'ArrowRight':
        case 'd': moveTetrisPiece(1, 0); break;
        case 'ArrowDown':
        case 's': moveTetrisPiece(0, 1); break;
        case 'ArrowLeft':
        case 'a': moveTetrisPiece(-1, 0); break;
        case ' ': // Hard drop
          while(moveTetrisPiece(0, 1));
          break;
      }
    }
  }, {passive: false});

  let pointerStartX = 0;
  let pointerStartY = 0;
  let isDragging = false;
  let dragDirection = -1;
  let dragRatio = 0;

  const boardEl = document.querySelector('.game-board-container');

  function applyDragEffect(direction, ratio) {
    const maxOffset = 25;
    let tx = 0, ty = 0;

    switch (direction) {
      case 0: ty = -maxOffset * ratio; break;
      case 1: tx = maxOffset * ratio; break;
      case 2: ty = maxOffset * ratio; break;
      case 3: tx = -maxOffset * ratio; break;
    }

    tileContainer.style.transform = `translate(${tx}%, ${ty}%)`;
    boardEl.dataset.direction = direction;

    if (ratio >= 1) {
      boardEl.classList.add('drag-ready');
    } else {
      boardEl.classList.remove('drag-ready');
    }
  }

  function clearDragEffect(animate = false) {
    if (animate) {
      tileContainer.style.transition = 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)';
    }
    tileContainer.style.transform = '';
    delete boardEl.dataset.direction;
    boardEl.classList.remove('drag-ready');
    if (animate) {
      setTimeout(() => {
        tileContainer.style.transition = '';
      }, 200);
    }
  }

  function handlePointerStart(clientX, clientY) {
    pointerStartX = clientX;
    pointerStartY = clientY;
    isDragging = false;
    dragDirection = -1;
    dragRatio = 0;
  }

  function handlePointerMove(clientX, clientY) {
    if (currentGame === '2048' && isGameOver) return;
    if (currentGame === 'snake' && !snakeInterval) return;
    if (currentGame === 'tetris' && !tetrisInterval) return;

    const dx = clientX - pointerStartX;
    const dy = clientY - pointerStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 5) {
      if (isDragging && currentGame === '2048') {
        isDragging = false;
        dragDirection = -1;
        dragRatio = 0;
        clearDragEffect();
      }
      return;
    }

    if (currentGame === '2048') {
      const threshold = 30;
      let direction = -1;
      let ratio = 0;

      if (absDx > absDy) {
        direction = dx > 0 ? 1 : 3;
        ratio = Math.min(absDx / threshold, 1);
      } else {
        direction = dy > 0 ? 2 : 0;
        ratio = Math.min(absDy / threshold, 1);
      }

      if (!isDragging) {
        isDragging = true;
        tileContainer.style.transition = 'none';
      }

      if (direction !== dragDirection || Math.abs(ratio - dragRatio) > 0.02) {
        dragDirection = direction;
        dragRatio = ratio;
        applyDragEffect(direction, ratio);
      }
    } else if (currentGame === 'tetris') {
      const moveThreshold = 25;
      if (Math.max(absDx, absDy) > moveThreshold) {
        isDragging = true;
        if (absDx > absDy) {
          if (dx > moveThreshold) { moveTetrisPiece(1, 0); pointerStartX = clientX; }
          else if (dx < -moveThreshold) { moveTetrisPiece(-1, 0); pointerStartX = clientX; }
        } else {
          if (dy > moveThreshold) { moveTetrisPiece(0, 1); pointerStartY = clientY; }
        }
      }
    } else {
      isDragging = true;
    }
  }

  function handlePointerEnd(clientX, clientY) {
    if (currentGame === '2048' && isGameOver) {
      if (isDragging) {
        clearDragEffect();
        isDragging = false;
      }
      return;
    }

    const dx = clientX - pointerStartX;
    const dy = clientY - pointerStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (currentGame === 'tetris') {
      // If it wasn't a significant drag, treat as a tap to rotate
      if (!isDragging || Math.max(absDx, absDy) < 10) {
        rotateTetrisPiece();
      }
      isDragging = false;
    } else if (isDragging) {
      if (currentGame === '2048') {
        if (Math.max(absDx, absDy) > 30) {
          clearDragEffect();
          isDragging = false;
          if (absDx > absDy) {
            if (dx > 0) move(1);
            else move(3);
          } else {
            if (dy > 0) move(2);
            else move(0);
          }
        } else {
          clearDragEffect(true);
          isDragging = false;
        }
      } else if (currentGame === 'snake') {
        isDragging = false;
        if (Math.max(absDx, absDy) > 20) {
          if (absDx > absDy) {
            if (dx > 0 && direction !== 'left') nextDirection = 'right';
            else if (dx < 0 && direction !== 'right') nextDirection = 'left';
          } else {
            if (dy > 0 && direction !== 'up') nextDirection = 'down';
            else if (dy < 0 && direction !== 'down') nextDirection = 'up';
          }
        }
      }
    }

    pointerStartX = 0;
    pointerStartY = 0;
    dragDirection = -1;
    dragRatio = 0;
  }

  boardEl.addEventListener('touchstart', (e) => {
    handlePointerStart(e.touches[0].clientX, e.touches[0].clientY);
  }, {passive: false});

  boardEl.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
  }, {passive: false});

  boardEl.addEventListener('touchend', (e) => {
    handlePointerEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  }, {passive: false});

  boardEl.addEventListener('mousedown', (e) => {
    e.preventDefault();
    handlePointerStart(e.clientX, e.clientY);
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging || (e.buttons === 1 && pointerStartX !== 0)) {
      handlePointerMove(e.clientX, e.clientY);
    }
  });

  document.addEventListener('mouseup', (e) => {
    handlePointerEnd(e.clientX, e.clientY);
  });

  restartBtn.addEventListener('click', initGame);
  retryBtn.addEventListener('click', initGame);
  snakeRetryBtn.addEventListener('click', initGame);
  tetrisRetryBtn.addEventListener('click', initGame);

  initGame();
});
