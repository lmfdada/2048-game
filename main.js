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

  bestScoreEl.textContent = bestScore;

  function initGame() {
    board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
    score = 0;
    hasWon = false;
    isGameOver = false;
    scoreEl.textContent = score;
    gameMessage.classList.remove('game-over', 'game-won');
    tileContainer.innerHTML = '';
    
    addRandomTile();
    addRandomTile();
    renderBoard();
  }

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
    
    const gap = 10;
    
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
    if (isGameOver) return;

    const dx = clientX - pointerStartX;
    const dy = clientY - pointerStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 5) {
      if (isDragging) {
        isDragging = false;
        dragDirection = -1;
        dragRatio = 0;
        clearDragEffect();
      }
      return;
    }

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
  }

  function handlePointerEnd(clientX, clientY) {
    if (isGameOver) {
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

    if (isDragging) {
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
    }
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

  initGame();
});
