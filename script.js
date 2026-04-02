const SIZE = 9;
const BOX = 3;

const boardEl = document.getElementById("board");
const difficultyEl = document.getElementById("difficulty");
const timerEl = document.getElementById("timer");
const filledEl = document.getElementById("filled");
const messageEl = document.getElementById("message");
const newGameBtn = document.getElementById("new-game");
const checkBtn = document.getElementById("check");
const solveBtn = document.getElementById("solve");
const historyListEl = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history");
const SAVE_KEY = "sudoku-save-v1";
const HISTORY_KEY = "sudoku-history-v1";

const difficultyBlanks = {
  easy: 36,
  medium: 45,
  hard: 54,
};

const state = {
  puzzle: createEmptyBoard(),
  solution: createEmptyBoard(),
  user: createEmptyBoard(),
  selected: null,
  elapsed: 0,
  timerId: null,
  finished: false,
  generating: false,
  gameId: null,
  seed: 0,
  createdAt: null,
};

const audioState = {
  ctx: null,
  enabled: true,
};

newGameBtn.addEventListener("click", () => {
  startNewGame();
});
checkBtn.addEventListener("click", checkBoard);
solveBtn.addEventListener("click", revealSolution);
difficultyEl.addEventListener("change", saveGame);
clearHistoryBtn.addEventListener("click", clearHistory);

if (!restoreGame()) {
  startNewGame();
}
renderHistory();

async function startNewGame() {
  if (state.generating) {
    return;
  }

  archiveCurrentGame("interrupted");
  state.generating = true;
  toggleControls(true);
  newGameBtn.textContent = "Gerando...";
  setMessage("Gerando tabuleiro...", "warn");
  await pauseForPaint();

  const seed = makeSeed();
  const solved = generateSolvedBoardProcedural(seed);
  const blanks =
    difficultyBlanks[difficultyEl.value] ?? difficultyBlanks.medium;
  const puzzle = createPuzzleProcedural(solved, blanks, seed + 19);

  state.solution = solved;
  state.puzzle = puzzle;
  state.user = cloneBoard(puzzle);
  state.selected = null;
  state.elapsed = 0;
  state.finished = false;
  state.gameId = buildGameId();
  state.seed = seed;
  state.createdAt = new Date().toISOString();

  startTimer();
  renderBoard();
  updateStatus();
  setMessage("Novo jogo criado. Boa sorte!", "success");
  saveGame();
  upsertHistoryEntry("in-progress");
  renderHistory();

  state.generating = false;
  toggleControls(false);
  newGameBtn.textContent = "Novo jogo";
}

function renderBoard() {
  boardEl.innerHTML = "";

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "numeric";
      input.maxLength = 1;
      input.className = "cell";
      input.dataset.row = String(row);
      input.dataset.col = String(col);

      const clue = state.puzzle[row][col] !== 0;
      if (clue) {
        input.value = String(state.puzzle[row][col]);
        input.classList.add("clue");
        input.disabled = true;
      } else {
        input.value =
          state.user[row][col] === 0 ? "" : String(state.user[row][col]);
      }

      input.addEventListener("focus", () => {
        state.selected = { row, col };
        updateHighlights();
      });

      input.addEventListener("click", () => {
        state.selected = { row, col };
        updateHighlights();
      });

      input.addEventListener("input", (event) => {
        if (state.finished) {
          event.target.value =
            state.user[row][col] === 0 ? "" : String(state.user[row][col]);
          return;
        }

        const cleaned = event.target.value.replace(/[^1-9]/g, "").slice(0, 1);
        event.target.value = cleaned;
        state.user[row][col] = cleaned ? Number(cleaned) : 0;

        if (cleaned) {
          const typedValue = Number(cleaned);
          if (typedValue === state.solution[row][col]) {
            playTone("correct");
            pulseCell(event.target, "good");
          } else {
            playTone("error");
            pulseCell(event.target, "bad");
          }
        }

        updateStatus();
        updateHighlights();
        saveGame();
        upsertHistoryEntry(state.finished ? "completed" : "in-progress");
        renderHistory();
        autoCheckWin();
      });

      boardEl.appendChild(input);
    }
  }

  updateHighlights();
}

function updateHighlights() {
  const cells = boardEl.querySelectorAll(".cell");
  const selectedValue = state.selected
    ? state.user[state.selected.row][state.selected.col]
    : 0;

  cells.forEach((cell) => {
    cell.classList.remove("selected", "same", "conflict");

    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const value = state.user[row][col];

    if (
      state.selected &&
      row === state.selected.row &&
      col === state.selected.col
    ) {
      cell.classList.add("selected");
    }

    if (selectedValue !== 0 && value === selectedValue) {
      cell.classList.add("same");
    }

    if (value !== 0 && !isMoveValid(state.user, row, col, value)) {
      cell.classList.add("conflict");
    }
  });
}

function checkBoard() {
  if (state.finished) {
    setMessage("Partida já finalizada.", "warn");
    return;
  }

  const filled = countFilledCells(state.user);
  if (filled < SIZE * SIZE) {
    setMessage("O tabuleiro ainda está incompleto.", "warn");
    return;
  }

  if (boardsEqual(state.user, state.solution)) {
    finishGame("Parabéns! Você resolveu o Sudoku.");
    return;
  }

  const wrong = countWrongCells();
  setMessage(`Existem ${wrong} célula(s) incorreta(s).`, "error");
  playTone("error");
}

function revealSolution() {
  state.user = cloneBoard(state.solution);
  state.finished = true;
  stopTimer();
  renderBoard();
  updateStatus();
  setMessage("Solução exibida.", "warn");
  saveGame();
  upsertHistoryEntry("revealed");
  renderHistory();
}

function autoCheckWin() {
  if (state.finished) {
    return;
  }

  if (countFilledCells(state.user) !== SIZE * SIZE) {
    return;
  }

  if (boardsEqual(state.user, state.solution)) {
    finishGame("Parabéns! Você resolveu o Sudoku.");
  }
}

function finishGame(text) {
  state.finished = true;
  stopTimer();
  setMessage(text, "success");
  playTone("complete");
  boardEl.classList.remove("board-complete");
  void boardEl.offsetWidth;
  boardEl.classList.add("board-complete");
  saveGame();
  upsertHistoryEntry("completed");
  renderHistory();
}

function updateStatus() {
  const filled = countFilledCells(state.user);
  filledEl.textContent = `Preenchido: ${filled}/81`;
  timerEl.textContent = `Tempo: ${formatTime(state.elapsed)}`;
}

function setMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
}

function startTimer() {
  stopTimer();
  timerEl.textContent = `Tempo: ${formatTime(0)}`;

  state.timerId = window.setInterval(() => {
    state.elapsed += 1;
    timerEl.textContent = `Tempo: ${formatTime(state.elapsed)}`;
    saveGame();
  }, 1000);
}

function stopTimer() {
  if (state.timerId !== null) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function saveGame() {
  const payload = {
    id: state.gameId,
    createdAt: state.createdAt,
    seed: state.seed,
    puzzle: state.puzzle,
    solution: state.solution,
    user: state.user,
    elapsed: state.elapsed,
    finished: state.finished,
    difficulty: difficultyEl.value,
  };

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch (error) {
    setMessage("Falha ao salvar progresso no navegador.", "warn");
  }
}

function restoreGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return false;
    }

    const data = JSON.parse(raw);
    if (!isValidSave(data)) {
      return false;
    }

    difficultyEl.value = data.difficulty;
    state.gameId = data.id || buildGameId();
    state.createdAt = data.createdAt || new Date().toISOString();
    state.seed = Number.isInteger(data.seed) ? data.seed : makeSeed();
    state.puzzle = cloneBoard(data.puzzle);
    state.solution = cloneBoard(data.solution);
    state.user = cloneBoard(data.user);
    state.selected = null;
    state.elapsed = data.elapsed;
    state.finished = Boolean(data.finished);

    if (!state.finished) {
      startTimerFromSavedTime();
    } else {
      stopTimer();
    }

    renderBoard();
    updateStatus();
    upsertHistoryEntry(state.finished ? "completed" : "in-progress");
    renderHistory();
    setMessage("Partida restaurada automaticamente.", "success");
    return true;
  } catch (error) {
    return false;
  }
}

function startTimerFromSavedTime() {
  stopTimer();
  timerEl.textContent = `Tempo: ${formatTime(state.elapsed)}`;

  state.timerId = window.setInterval(() => {
    state.elapsed += 1;
    timerEl.textContent = `Tempo: ${formatTime(state.elapsed)}`;
    saveGame();
  }, 1000);
}

function isValidSave(data) {
  const validDifficulty = ["easy", "medium", "hard"].includes(data?.difficulty);
  return (
    validDifficulty &&
    isBoardShapeValid(data?.puzzle) &&
    isBoardShapeValid(data?.solution) &&
    isBoardShapeValid(data?.user) &&
    Number.isInteger(data?.elapsed) &&
    data.elapsed >= 0
  );
}

function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidHistoryEntry) : [];
  } catch (error) {
    return [];
  }
}

function setHistory(entries) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 60)));
  } catch (error) {
    setMessage("Falha ao salvar historico.", "warn");
  }
}

function upsertHistoryEntry(status) {
  if (!state.gameId) {
    return;
  }

  const entries = getHistory();
  const nowIso = new Date().toISOString();
  const snapshot = {
    id: state.gameId,
    createdAt: state.createdAt || nowIso,
    updatedAt: nowIso,
    status,
    difficulty: difficultyEl.value,
    elapsed: state.elapsed,
    seed: state.seed,
    filled: countFilledCells(state.user),
    puzzle: cloneBoard(state.puzzle),
    solution: cloneBoard(state.solution),
    user: cloneBoard(state.user),
    finished: state.finished,
  };

  const index = entries.findIndex((entry) => entry.id === state.gameId);
  if (index >= 0) {
    entries[index] = snapshot;
  } else {
    entries.unshift(snapshot);
  }

  setHistory(entries);
}

function archiveCurrentGame(status) {
  if (!state.gameId || countFilledCells(state.user) === 0) {
    return;
  }

  upsertHistoryEntry(status);
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  setMessage("Historico apagado.", "warn");
}

function renderHistory() {
  const entries = getHistory();
  historyListEl.innerHTML = "";

  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "history-empty";
    empty.textContent = "Nenhuma partida salva ainda.";
    historyListEl.appendChild(empty);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "history-item";

    const meta = document.createElement("div");
    meta.className = "history-meta";
    const dt = new Date(entry.updatedAt);
    const statusText = translateStatus(entry.status);
    meta.innerHTML = `<strong>${capitalize(entry.difficulty)} | ${formatTime(entry.elapsed)}</strong><span>${statusText} | ${entry.filled}/81</span><span>${dt.toLocaleString("pt-BR")}</span>`;

    const loadBtn = document.createElement("button");
    loadBtn.type = "button";
    loadBtn.className = "history-load";
    loadBtn.textContent = "Carregar";
    loadBtn.addEventListener("click", () => {
      loadFromHistory(entry.id);
    });

    item.appendChild(meta);
    item.appendChild(loadBtn);
    historyListEl.appendChild(item);
  });
}

function loadFromHistory(gameId) {
  const entry = getHistory().find((item) => item.id === gameId);
  if (!entry || !isValidHistoryEntry(entry)) {
    setMessage("Nao foi possivel carregar esta partida.", "error");
    return;
  }

  difficultyEl.value = entry.difficulty;
  state.gameId = entry.id;
  state.createdAt = entry.createdAt;
  state.seed = entry.seed;
  state.puzzle = cloneBoard(entry.puzzle);
  state.solution = cloneBoard(entry.solution);
  state.user = cloneBoard(entry.user);
  state.selected = null;
  state.elapsed = entry.elapsed;
  state.finished = Boolean(entry.finished);

  if (state.finished) {
    stopTimer();
  } else {
    startTimerFromSavedTime();
  }

  renderBoard();
  updateStatus();
  saveGame();
  upsertHistoryEntry(state.finished ? "completed" : "in-progress");
  renderHistory();
  setMessage("Partida carregada do historico.", "success");
}

function isValidHistoryEntry(entry) {
  return (
    typeof entry?.id === "string" &&
    ["easy", "medium", "hard"].includes(entry?.difficulty) &&
    Number.isInteger(entry?.elapsed) &&
    entry.elapsed >= 0 &&
    Number.isInteger(entry?.filled) &&
    entry.filled >= 0 &&
    entry.filled <= 81 &&
    isBoardShapeValid(entry?.puzzle) &&
    isBoardShapeValid(entry?.solution) &&
    isBoardShapeValid(entry?.user)
  );
}

function translateStatus(status) {
  if (status === "completed") {
    return "Concluido";
  }
  if (status === "revealed") {
    return "Resolvido pelo botao";
  }
  if (status === "interrupted") {
    return "Interrompido";
  }
  return "Em andamento";
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildGameId() {
  return `game-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function makeSeed() {
  return Math.floor(Math.random() * 2147483647);
}

function pauseForPaint() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 10);
  });
}

function toggleControls(disabled) {
  newGameBtn.disabled = disabled;
  difficultyEl.disabled = disabled;
  checkBtn.disabled = disabled;
  solveBtn.disabled = disabled;
}

function isBoardShapeValid(board) {
  if (!Array.isArray(board) || board.length !== SIZE) {
    return false;
  }

  return board.every(
    (row) =>
      Array.isArray(row) &&
      row.length === SIZE &&
      row.every((value) => Number.isInteger(value) && value >= 0 && value <= 9),
  );
}

function pulseCell(cell, mode) {
  const className = mode === "good" ? "flash-good" : "flash-bad";
  cell.classList.remove("flash-good", "flash-bad");
  void cell.offsetWidth;
  cell.classList.add(className);
}

function playTone(type) {
  if (!audioState.enabled) {
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {
      audioState.enabled = false;
    });
  }

  const now = ctx.currentTime;

  if (type === "correct") {
    playOsc(ctx, 660, now, 0.06, "triangle", 0.045);
    playOsc(ctx, 880, now + 0.06, 0.07, "triangle", 0.04);
    return;
  }

  if (type === "error") {
    playOsc(ctx, 220, now, 0.12, "sawtooth", 0.06);
    return;
  }

  if (type === "complete") {
    playOsc(ctx, 523, now, 0.12, "triangle", 0.05);
    playOsc(ctx, 659, now + 0.12, 0.12, "triangle", 0.05);
    playOsc(ctx, 784, now + 0.24, 0.18, "triangle", 0.055);
  }
}

function getAudioContext() {
  if (audioState.ctx) {
    return audioState.ctx;
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    audioState.enabled = false;
    return null;
  }

  audioState.ctx = new AudioCtx();
  return audioState.ctx;
}

function playOsc(ctx, frequency, startAt, duration, waveType, volume) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = waveType;
  oscillator.frequency.value = frequency;

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.01);
}

function createPuzzleProcedural(solution, targetBlanks, seed) {
  const puzzle = cloneBoard(solution);
  const positions = [];
  const rng = mulberry32(seed);

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      positions.push([row, col]);
    }
  }

  const shuffledPositions = shuffleWithRng(positions, rng);
  let removed = 0;

  for (const [row, col] of shuffledPositions) {
    if (removed >= targetBlanks) {
      break;
    }
    puzzle[row][col] = 0;
    removed += 1;
  }

  return puzzle;
}

function generateSolvedBoardProcedural(seed) {
  const rng = mulberry32(seed);
  const board = createBaseSolvedBoard();

  const digitMap = shuffleWithRng([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
  applyDigitPermutation(board, digitMap);
  shuffleRowBands(board, rng);
  shuffleRowsWithinBands(board, rng);
  transposeBoard(board);
  shuffleRowBands(board, rng);
  shuffleRowsWithinBands(board, rng);
  transposeBoard(board);

  return board;
}

function createBaseSolvedBoard() {
  const board = createEmptyBoard();
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      board[row][col] = ((row * BOX + Math.floor(row / BOX) + col) % SIZE) + 1;
    }
  }
  return board;
}

function applyDigitPermutation(board, mapping) {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      board[row][col] = mapping[board[row][col] - 1];
    }
  }
}

function shuffleRowBands(board, rng) {
  const order = shuffleWithRng([0, 1, 2], rng);
  const snapshot = cloneBoard(board);
  let target = 0;
  for (const band of order) {
    for (let offset = 0; offset < BOX; offset += 1) {
      board[target] = snapshot[band * BOX + offset].slice();
      target += 1;
    }
  }
}

function shuffleRowsWithinBands(board, rng) {
  const snapshot = cloneBoard(board);
  for (let band = 0; band < BOX; band += 1) {
    const base = band * BOX;
    const order = shuffleWithRng([0, 1, 2], rng);
    for (let i = 0; i < BOX; i += 1) {
      board[base + i] = snapshot[base + order[i]].slice();
    }
  }
}

function transposeBoard(board) {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = row + 1; col < SIZE; col += 1) {
      const temp = board[row][col];
      board[row][col] = board[col][row];
      board[col][row] = temp;
    }
  }
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng(items, rng) {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isMoveValid(board, row, col, value) {
  for (let i = 0; i < SIZE; i += 1) {
    if (i !== col && board[row][i] === value) {
      return false;
    }

    if (i !== row && board[i][col] === value) {
      return false;
    }
  }

  const boxRow = Math.floor(row / BOX) * BOX;
  const boxCol = Math.floor(col / BOX) * BOX;
  for (let r = boxRow; r < boxRow + BOX; r += 1) {
    for (let c = boxCol; c < boxCol + BOX; c += 1) {
      if ((r !== row || c !== col) && board[r][c] === value) {
        return false;
      }
    }
  }

  return true;
}

function countFilledCells(board) {
  let total = 0;
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (board[row][col] !== 0) {
        total += 1;
      }
    }
  }
  return total;
}

function countWrongCells() {
  let wrong = 0;
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (
        state.user[row][col] !== 0 &&
        state.user[row][col] !== state.solution[row][col]
      ) {
        wrong += 1;
      }
    }
  }
  return wrong;
}

function boardsEqual(a, b) {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (a[row][col] !== b[row][col]) {
        return false;
      }
    }
  }
  return true;
}

function cloneBoard(board) {
  return board.map((row) => row.slice());
}

function createEmptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function shuffle(items) {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
