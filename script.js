const SIZE = 9;
const BOX = 3;

const boardEl = document.getElementById("board");
const difficultyEl = document.getElementById("difficulty");
const gameModeEl = document.getElementById("game-mode");
const trainingTechniqueEl = document.getElementById("training-technique");
const themeSelectEl = document.getElementById("theme-select");
const boardSizeEl = document.getElementById("board-size");
const fontSizeEl = document.getElementById("font-size");
const highContrastEl = document.getElementById("high-contrast");
const challengeModeEl = document.getElementById("challenge-mode");
const muteSoundEl = document.getElementById("mute-sound");
const explainHintEl = document.getElementById("explain-hint");
const timerEl = document.getElementById("timer");
const filledEl = document.getElementById("filled");
const challengeInfoEl = document.getElementById("challenge-info");
const modeInfoEl = document.getElementById("mode-info");
const messageEl = document.getElementById("message");
const dailyMissionTextEl = document.getElementById("daily-mission-text");
const dailyMissionProgressEl = document.getElementById("daily-mission-progress");
const campaignStatusEl = document.getElementById("campaign-status");
const streakTextEl = document.getElementById("streak-text");
const rankingListEl = document.getElementById("ranking-list");
const newGameBtn = document.getElementById("new-game");
const checkBtn = document.getElementById("check");
const hintBtn = document.getElementById("hint");
const solveBtn = document.getElementById("solve");
const shareResultBtn = document.getElementById("share-result");
const historyListEl = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history");
const statsListEl = document.getElementById("stats-list");
const achievementsListEl = document.getElementById("achievements-list");
const appEl = document.querySelector(".app");
const panelEl = document.getElementById("sidebar-panel");
const menuToggleEl = document.getElementById("menu-toggle");
const sidebarOverlayEl = document.getElementById("sidebar-overlay");

const SAVE_KEY = "sudoku-save-v3";
const HISTORY_KEY = "sudoku-history-v2";
const STATS_KEY = "sudoku-stats-v1";
const ACHIEVEMENTS_KEY = "sudoku-achievements-v2";
const THEME_KEY = "sudoku-theme-v1";
const SETTINGS_KEY = "sudoku-settings-v1";
const DAILY_MISSION_KEY = "sudoku-daily-mission-v1";
const CAMPAIGN_KEY = "sudoku-campaign-v1";
const RANKING_KEY = "sudoku-ranking-v1";
const STREAK_KEY = "sudoku-streak-v1";

const difficultyBlanks = {
  easy: 36,
  medium: 45,
  hard: 54,
};

const difficultyLimits = {
  easy: 8 * 60,
  medium: 12 * 60,
  hard: 18 * 60,
};

const campaignPhases = [
  { id: 1, difficulty: "easy", challenge: false, bronze: 900, silver: 600, gold: 390 },
  { id: 2, difficulty: "easy", challenge: true, bronze: 640, silver: 520, gold: 420 },
  { id: 3, difficulty: "medium", challenge: false, bronze: 900, silver: 660, gold: 480 },
  { id: 4, difficulty: "medium", challenge: true, bronze: 780, silver: 630, gold: 510 },
  { id: 5, difficulty: "hard", challenge: false, bronze: 1140, silver: 900, gold: 690 },
  { id: 6, difficulty: "hard", challenge: true, bronze: 1080, silver: 900, gold: 720 },
];

const achievementDefs = [
  { id: "first_win", label: "Primeira vitoria", desc: "Conclua 1 partida." },
  { id: "no_hint_win", label: "Mente afiada", desc: "Venca sem usar nenhuma dica." },
  { id: "challenge_win", label: "Mestre do desafio", desc: "Venca no modo desafio." },
  { id: "fast_hard", label: "Hard relampago", desc: "Conclua no dificil em ate 8 minutos." },
  { id: "no_error_win", label: "Cirurgico", desc: "Venca sem nenhum erro." },
  { id: "no_erase_win", label: "Sem apagar", desc: "Venca sem apagar celulas." },
  { id: "speed_medium", label: "Sprint medio", desc: "Conclua no medio em ate 6 minutos." },
  { id: "streak_3", label: "Rotina firme", desc: "Mantenha streak de 3 dias." },
  { id: "streak_7", label: "Invencivel", desc: "Mantenha streak de 7 dias." },
  { id: "campaign_gold", label: "Ouro da campanha", desc: "Ganhe medalha de ouro em uma fase." },
];

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
  challengeMode: false,
  timeLimit: 0,
  hintsUsed: 0,
  mistakes: 0,
  eraseCount: 0,
  lastResult: "in-progress",
  mode: "classic",
  trainingTechnique: "singles",
};

const audioState = {
  ctx: null,
  enabled: true,
};

bindEvents();
restoreSettings();
applyThemeVariant(loadThemePreference());
initDailyMission();
initCampaign();
markDailyActivity();
window.addEventListener("resize", syncSidebarWithViewport);

if (!restoreGame()) {
  startNewGame();
}

renderHistory();
renderStats();
renderAchievements();
renderRanking();
renderDailyMission();
renderCampaignStatus();
renderStreak();
renderModeInfo();
syncSidebarWithViewport();

function bindEvents() {
  newGameBtn.addEventListener("click", () => {
    maybeCloseSidebarOnMobile();
    startNewGame();
  });
  checkBtn.addEventListener("click", () => {
    maybeCloseSidebarOnMobile();
    checkBoard();
  });
  hintBtn.addEventListener("click", () => {
    maybeCloseSidebarOnMobile();
    giveHint();
  });
  solveBtn.addEventListener("click", () => {
    maybeCloseSidebarOnMobile();
    revealSolution();
  });
  shareResultBtn.addEventListener("click", () => {
    maybeCloseSidebarOnMobile();
    shareResult();
  });
  clearHistoryBtn.addEventListener("click", () => {
    maybeCloseSidebarOnMobile();
    clearHistory();
  });

  menuToggleEl.addEventListener("click", () => {
    setSidebarOpen(!appEl.classList.contains("sidebar-open"));
  });
  sidebarOverlayEl.addEventListener("click", () => {
    setSidebarOpen(false);
  });

  difficultyEl.addEventListener("change", () => {
    saveGame();
    updateStatus();
  });
  gameModeEl.addEventListener("change", () => {
    state.mode = gameModeEl.value;
    applyModeConstraints();
    renderModeInfo();
    saveSettings();
    saveGame();
  });
  trainingTechniqueEl.addEventListener("change", () => {
    state.trainingTechnique = trainingTechniqueEl.value;
    renderModeInfo();
    saveSettings();
    saveGame();
  });
  themeSelectEl.addEventListener("change", () => {
    applyThemeVariant(themeSelectEl.value);
    saveGame();
  });
  challengeModeEl.addEventListener("change", () => {
    updateStatus();
    saveGame();
  });

  muteSoundEl.addEventListener("change", () => {
    audioState.enabled = !muteSoundEl.checked;
    saveSettings();
  });

  explainHintEl.addEventListener("change", () => {
    saveSettings();
  });

  boardSizeEl.addEventListener("change", () => {
    applyVisualSettings();
    saveSettings();
  });

  fontSizeEl.addEventListener("change", () => {
    applyVisualSettings();
    saveSettings();
  });

  highContrastEl.addEventListener("change", () => {
    applyVisualSettings();
    saveSettings();
  });
}

async function startNewGame() {
  if (state.generating) {
    return;
  }

  archiveCurrentGame("interrupted");
  state.generating = true;
  toggleControls(true);
  newGameBtn.textContent = "Gerando...";
  setMessage("Gerando tabuleiro...", "warn");

  try {
    await pauseForPaint();
    markDailyActivity();

    const setup = resolveGameSetup();
    difficultyEl.value = setup.difficulty;
    challengeModeEl.checked = setup.challenge;

    const seed = makeSeed();
    const solved = generateSolvedBoardProcedural(seed);
    const puzzle =
      setup.mode === "training"
        ? createTrainingPuzzle(solved, setup.technique, seed + 29)
        : createPuzzleProcedural(
            solved,
            difficultyBlanks[setup.difficulty] ?? difficultyBlanks.medium,
            seed + 19,
          );

    state.solution = solved;
    state.puzzle = puzzle;
    state.user = cloneBoard(puzzle);
    state.selected = null;
    state.elapsed = 0;
    state.finished = false;
    state.gameId = buildGameId();
    state.seed = seed;
    state.createdAt = new Date().toISOString();
    state.hintsUsed = 0;
    state.mistakes = 0;
    state.eraseCount = 0;
    state.mode = setup.mode;
    state.trainingTechnique = setup.technique;
    state.challengeMode = setup.challenge;
    state.timeLimit = setup.challenge ? difficultyLimits[setup.difficulty] : 0;
    state.lastResult = "in-progress";

    clearHintMarks();
    applyModeConstraints();
    startTimer();
    renderBoard();
    updateStatus();
    renderModeInfo();
    setMessage("Novo jogo criado. Boa sorte!", "success");

    registerStartedGame();
    saveGame();
    upsertHistoryEntry("in-progress");
    renderHistory();
    updateDailyMissionProgress("new-game");
    renderDailyMission();
  } finally {
    state.generating = false;
    toggleControls(false);
    newGameBtn.textContent = "Novo jogo";
  }
}

function resolveGameSetup() {
  const mode = gameModeEl.value;
  if (mode === "campaign") {
    const progress = getCampaignProgress();
    const phaseIndex = Math.max(0, Math.min(campaignPhases.length - 1, progress.currentPhase - 1));
    const phase = campaignPhases[phaseIndex];
    return {
      mode,
      technique: "singles",
      difficulty: phase.difficulty,
      challenge: phase.challenge,
    };
  }

  if (mode === "training") {
    const technique = trainingTechniqueEl.value;
    const mappedDifficulty = technique === "singles" ? "easy" : technique === "pairs" ? "medium" : "hard";
    return {
      mode,
      technique,
      difficulty: mappedDifficulty,
      challenge: false,
    };
  }

  return {
    mode: "classic",
    technique: "singles",
    difficulty: difficultyEl.value,
    challenge: Boolean(challengeModeEl.checked),
  };
}

function createTrainingPuzzle(solution, technique, seed) {
  if (technique === "pairs") {
    return createSymmetricPuzzle(solution, 50, seed);
  }

  if (technique === "box-focus") {
    const puzzle = createPuzzleProcedural(solution, 52, seed);
    const boxToOpen = Math.floor(mulberry32(seed + 3)() * 9);
    const startRow = Math.floor(boxToOpen / 3) * 3;
    const startCol = (boxToOpen % 3) * 3;
    let kept = 0;
    for (let r = startRow; r < startRow + 3; r += 1) {
      for (let c = startCol; c < startCol + 3; c += 1) {
        if (puzzle[r][c] !== 0) {
          kept += 1;
        }
      }
    }
    for (let r = startRow; r < startRow + 3 && kept > 2; r += 1) {
      for (let c = startCol; c < startCol + 3 && kept > 2; c += 1) {
        if (puzzle[r][c] !== 0) {
          puzzle[r][c] = 0;
          kept -= 1;
        }
      }
    }
    return puzzle;
  }

  return createPuzzleProcedural(solution, 40, seed);
}

function createSymmetricPuzzle(solution, targetBlanks, seed) {
  const puzzle = cloneBoard(solution);
  const rng = mulberry32(seed);
  const positions = [];
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (row > 4 || (row === 4 && col > 4)) {
        continue;
      }
      positions.push([row, col]);
    }
  }

  const ordered = shuffleWithRng(positions, rng);
  let removed = 0;
  for (const [row, col] of ordered) {
    if (removed >= targetBlanks) {
      break;
    }
    const mirrorRow = SIZE - 1 - row;
    const mirrorCol = SIZE - 1 - col;

    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      removed += 1;
    }

    if (removed < targetBlanks && puzzle[mirrorRow][mirrorCol] !== 0) {
      puzzle[mirrorRow][mirrorCol] = 0;
      removed += 1;
    }
  }

  return puzzle;
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
        input.value = state.user[row][col] === 0 ? "" : String(state.user[row][col]);
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
        handleCellInput(event, row, col);
      });

      boardEl.appendChild(input);
    }
  }

  updateHighlights();
}

function handleCellInput(event, row, col) {
  if (state.finished) {
    event.target.value = state.user[row][col] === 0 ? "" : String(state.user[row][col]);
    return;
  }

  clearHintMarks();
  maybeCloseSidebarOnMobile();

  const previous = state.user[row][col];
  const cleaned = event.target.value.replace(/[^1-9]/g, "").slice(0, 1);
  event.target.value = cleaned;
  state.user[row][col] = cleaned ? Number(cleaned) : 0;

  if (!cleaned && previous !== 0) {
    state.eraseCount += 1;
  }

  if (cleaned) {
    const typedValue = Number(cleaned);
    if (typedValue === state.solution[row][col]) {
      playTone("correct");
      pulseCell(event.target, "good");
    } else {
      state.mistakes += 1;
      playTone("error");
      pulseCell(event.target, "bad");
    }
  }

  updateStatus();
  updateHighlights();
  saveGame();
  upsertHistoryEntry("in-progress");
  renderHistory();
  autoCheckWin();
}

function updateHighlights() {
  const cells = boardEl.querySelectorAll(".cell");
  const selectedValue = state.selected ? state.user[state.selected.row][state.selected.col] : 0;

  cells.forEach((cell) => {
    cell.classList.remove("selected", "same", "conflict");

    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const value = state.user[row][col];

    if (state.selected && row === state.selected.row && col === state.selected.col) {
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
    setMessage("Partida ja finalizada.", "warn");
    return;
  }

  const filled = countFilledCells(state.user);
  if (filled < SIZE * SIZE) {
    setMessage("O tabuleiro ainda esta incompleto.", "warn");
    return;
  }

  if (boardsEqual(state.user, state.solution)) {
    finishGame("Parabens! Voce resolveu o Sudoku.");
    return;
  }

  const wrong = countWrongCells();
  state.mistakes += wrong;
  setMessage(`Existem ${wrong} celula(s) incorreta(s).`, "error");
  playTone("error");
}

function giveHint() {
  if (state.finished) {
    setMessage("A partida ja acabou. Inicie um novo jogo para receber dicas.", "warn");
    return;
  }

  clearHintMarks();

  const smart = explainHintEl.checked ? findSmartHint() : null;
  if (smart) {
    const targetEl = getCellEl(smart.row, smart.col);
    if (targetEl) {
      targetEl.classList.add("hint-target");
      targetEl.focus();
    }
    setMessage(smart.text, "warn");
    state.hintsUsed += 1;
    playTone("hint");
    saveGame();
    upsertHistoryEntry("in-progress");
    renderHistory();
    return;
  }

  const wrongCells = [];
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (state.puzzle[row][col] !== 0) {
        continue;
      }
      const value = state.user[row][col];
      if (value !== 0 && value !== state.solution[row][col]) {
        wrongCells.push({ row, col, value });
      }
    }
  }

  if (wrongCells.length === 0) {
    setMessage("Nao achei erro claro agora. Tente preencher mais algumas celulas.", "warn");
    return;
  }

  const hint = wrongCells[0];
  const wrongCellEl = getCellEl(hint.row, hint.col);
  if (wrongCellEl) {
    wrongCellEl.classList.add("hint-wrong");
    wrongCellEl.focus();
  }

  const target = findTargetForValue(hint.value, hint.row, hint.col);
  if (target) {
    const targetEl = getCellEl(target.row, target.col);
    if (targetEl) {
      targetEl.classList.add("hint-target");
    }
    setMessage(
      `Dica: o ${hint.value} em L${hint.row + 1} C${hint.col + 1} deveria ir para L${target.row + 1} C${target.col + 1}.`,
      "warn",
    );
  } else {
    setMessage(`Dica: o ${hint.value} em L${hint.row + 1} C${hint.col + 1} esta fora do lugar.`, "warn");
  }

  state.hintsUsed += 1;
  playTone("hint");
  saveGame();
  upsertHistoryEntry("in-progress");
  renderHistory();
}

function findSmartHint() {
  const wrongCandidate = findWrongEditableCell();
  if (wrongCandidate) {
    return {
      row: wrongCandidate.row,
      col: wrongCandidate.col,
      text: `Dica: em L${wrongCandidate.row + 1} C${wrongCandidate.col + 1}, o valor ${wrongCandidate.current} nao respeita as regras. O correto nessa celula e ${wrongCandidate.expected}.`,
    };
  }

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (state.puzzle[row][col] !== 0 || state.user[row][col] !== 0) {
        continue;
      }
      const candidates = getCandidates(state.user, row, col);
      if (candidates.length === 1) {
        const only = candidates[0];
        const boxRowStart = Math.floor(row / 3) * 3 + 1;
        const boxColStart = Math.floor(col / 3) * 3 + 1;
        return {
          row,
          col,
          text: `Dica humana: no bloco (L${boxRowStart}-L${boxRowStart + 2}, C${boxColStart}-C${boxColStart + 2}) apenas o numero ${only} cabe em L${row + 1} C${col + 1}.`,
        };
      }
    }
  }

  return null;
}

function findWrongEditableCell() {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (state.puzzle[row][col] !== 0) {
        continue;
      }
      const current = state.user[row][col];
      if (current !== 0 && current !== state.solution[row][col]) {
        return {
          row,
          col,
          current,
          expected: state.solution[row][col],
        };
      }
    }
  }
  return null;
}

function getCandidates(board, row, col) {
  const options = [];
  for (let value = 1; value <= 9; value += 1) {
    if (canPlace(board, row, col, value)) {
      options.push(value);
    }
  }
  return options;
}

function canPlace(board, row, col, value) {
  for (let i = 0; i < SIZE; i += 1) {
    if (board[row][i] === value || board[i][col] === value) {
      return false;
    }
  }

  const boxRow = Math.floor(row / BOX) * BOX;
  const boxCol = Math.floor(col / BOX) * BOX;
  for (let r = boxRow; r < boxRow + BOX; r += 1) {
    for (let c = boxCol; c < boxCol + BOX; c += 1) {
      if (board[r][c] === value) {
        return false;
      }
    }
  }

  return true;
}

function findTargetForValue(value, wrongRow, wrongCol) {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (row === wrongRow && col === wrongCol) {
        continue;
      }
      if (state.solution[row][col] !== value) {
        continue;
      }
      if (state.user[row][col] !== value && state.puzzle[row][col] === 0) {
        return { row, col };
      }
    }
  }
  return null;
}

function revealSolution() {
  state.user = cloneBoard(state.solution);
  state.finished = true;
  state.lastResult = "revealed";
  stopTimer();
  renderBoard();
  updateStatus();
  setMessage("Solucao exibida.", "warn");
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
    finishGame("Parabens! Voce resolveu o Sudoku.");
  }
}

function finishGame(text) {
  if (state.finished) {
    return;
  }

  state.finished = true;
  state.lastResult = "completed";
  stopTimer();
  setMessage(text, "success");
  celebrateBoard();
  playTone("completeEpic");
  registerWinStats();
  updateRanking();
  evaluateAchievementsAfterWin();
  evaluateCampaignAfterWin();
  updateDailyMissionProgress("win");
  saveGame();
  upsertHistoryEntry("completed");
  renderHistory();
  renderStats();
  renderAchievements();
  renderRanking();
  renderCampaignStatus();
  renderDailyMission();
}

function evaluateCampaignAfterWin() {
  if (state.mode !== "campaign") {
    return;
  }

  const progress = getCampaignProgress();
  const phaseIndex = Math.max(0, Math.min(campaignPhases.length - 1, progress.currentPhase - 1));
  const phase = campaignPhases[phaseIndex];
  const medal = calcMedal(state.elapsed, phase);

  const prev = progress.bestMedals[String(phase.id)] || "none";
  if (medalValue(medal) > medalValue(prev)) {
    progress.bestMedals[String(phase.id)] = medal;
  }

  if (medal === "gold") {
    unlockAchievement("campaign_gold");
  }

  if (progress.currentPhase <= campaignPhases.length) {
    progress.currentPhase = Math.min(campaignPhases.length, progress.currentPhase + 1);
  }

  setCampaignProgress(progress);
  setMessage(`Fase ${phase.id} concluida com medalha ${translateMedal(medal)}.`, "success");
}

function calcMedal(elapsed, phase) {
  if (elapsed <= phase.gold) {
    return "gold";
  }
  if (elapsed <= phase.silver) {
    return "silver";
  }
  if (elapsed <= phase.bronze) {
    return "bronze";
  }
  return "none";
}

function medalValue(medal) {
  if (medal === "gold") {
    return 3;
  }
  if (medal === "silver") {
    return 2;
  }
  if (medal === "bronze") {
    return 1;
  }
  return 0;
}

function translateMedal(medal) {
  if (medal === "gold") {
    return "ouro";
  }
  if (medal === "silver") {
    return "prata";
  }
  if (medal === "bronze") {
    return "bronze";
  }
  return "sem medalha";
}

function celebrateBoard() {
  boardEl.classList.remove("board-complete", "board-glow");
  void boardEl.offsetWidth;
  boardEl.classList.add("board-complete", "board-glow");
  launchConfetti();
  window.setTimeout(() => {
    boardEl.classList.remove("board-glow");
  }, 2200);
}

function launchConfetti() {
  const layer = document.createElement("div");
  layer.className = "confetti-layer";
  const colors = ["#ffd166", "#06d6a0", "#ef476f", "#118ab2", "#f78c6b"];

  for (let i = 0; i < 110; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty("--dx", `${Math.floor(Math.random() * 160 - 80)}px`);
    piece.style.animationDelay = `${Math.random() * 0.25}s`;
    layer.appendChild(piece);
  }

  boardEl.appendChild(layer);
  window.setTimeout(() => {
    layer.remove();
  }, 2400);
}

function handleTimeExpired() {
  if (state.finished) {
    return;
  }

  state.finished = true;
  state.lastResult = "timeout";
  stopTimer();
  setMessage("Tempo esgotado no modo desafio.", "error");
  playTone("timeout");
  saveGame();
  upsertHistoryEntry("timeout");
  renderHistory();

  const retry = window.confirm("Seu tempo acabou. Quer tentar de novo agora?");
  if (retry) {
    startNewGame();
  }
}

function updateStatus() {
  const filled = countFilledCells(state.user);
  filledEl.textContent = `Preenchido: ${filled}/81`;
  timerEl.textContent = `Tempo: ${formatTime(state.elapsed)}`;
  updateChallengeInfo();
}

function updateChallengeInfo() {
  const modeEnabled = state.challengeMode || challengeModeEl.checked;
  if (!modeEnabled) {
    challengeInfoEl.textContent = "Modo livre: sem limite de tempo.";
    return;
  }

  const limit = state.timeLimit || difficultyLimits[difficultyEl.value];
  const remain = Math.max(0, limit - state.elapsed);
  challengeInfoEl.textContent = `Modo desafio: restante ${formatTime(remain)}.`;
}

function renderModeInfo() {
  if (state.mode === "campaign") {
    const progress = getCampaignProgress();
    const phase = campaignPhases[Math.max(0, Math.min(campaignPhases.length - 1, progress.currentPhase - 1))];
    modeInfoEl.textContent = `Modo campanha ativo: Fase ${phase.id} (${capitalize(phase.difficulty)}).`;
    return;
  }

  if (state.mode === "training") {
    modeInfoEl.textContent = `Modo treino ativo: ${translateTechnique(state.trainingTechnique)}.`;
    return;
  }

  modeInfoEl.textContent = "Modo classico ativo.";
}

function translateTechnique(technique) {
  if (technique === "pairs") {
    return "Pares";
  }
  if (technique === "box-focus") {
    return "Foco em blocos";
  }
  return "Singles (basico)";
}

function setMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
}

function startTimer() {
  stopTimer();
  updateStatus();
  state.timerId = window.setInterval(() => {
    state.elapsed += 1;
    updateStatus();

    if (state.challengeMode && state.elapsed >= state.timeLimit) {
      handleTimeExpired();
      return;
    }

    saveGame();
  }, 1000);
}

function startTimerFromSavedTime() {
  stopTimer();
  updateStatus();
  state.timerId = window.setInterval(() => {
    state.elapsed += 1;
    updateStatus();

    if (state.challengeMode && state.elapsed >= state.timeLimit) {
      handleTimeExpired();
      return;
    }

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

async function shareResult() {
  const difficultyText = capitalize(difficultyEl.value);
  const challengeText = state.challengeMode ? "Desafio" : "Livre";
  const status = translateStatus(state.lastResult);
  const streak = getStreak();
  const mission = getDailyMission();
  const missionTag = mission.completed ? "Missao diaria concluida" : "Missao diaria pendente";

  const shareText = `Sudoku | ${difficultyText} | ${challengeText} | ${capitalize(state.mode)} | Tempo ${formatTime(state.elapsed)} | Dicas ${state.hintsUsed} | Streak ${streak.count} dia(s) | ${missionTag} | Status: ${status}`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: "Resultado Sudoku",
        text: shareText,
      });
      setMessage("Resultado compartilhado.", "success");
      return;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      setMessage("Resultado copiado para a area de transferencia.", "success");
      return;
    }

    window.prompt("Copie seu resultado:", shareText);
    setMessage("Resultado pronto para compartilhar.", "success");
  } catch (error) {
    setMessage("Nao foi possivel compartilhar agora.", "error");
  }
}

function clearHintMarks() {
  boardEl.querySelectorAll(".hint-wrong, .hint-target").forEach((cell) => {
    cell.classList.remove("hint-wrong", "hint-target");
  });
}

function setSidebarOpen(open) {
  const shouldOpen = Boolean(open) && window.innerWidth <= 950;
  appEl.classList.toggle("sidebar-open", shouldOpen);
  menuToggleEl.setAttribute("aria-expanded", String(shouldOpen));
  sidebarOverlayEl.hidden = !shouldOpen;
}

function syncSidebarWithViewport() {
  if (window.innerWidth > 950) {
    appEl.classList.remove("sidebar-open");
    menuToggleEl.setAttribute("aria-expanded", "false");
    sidebarOverlayEl.hidden = true;
    panelEl.removeAttribute("aria-hidden");
    return;
  }

  panelEl.setAttribute("aria-hidden", String(!appEl.classList.contains("sidebar-open")));
}

function maybeCloseSidebarOnMobile() {
  if (window.innerWidth <= 950 && appEl.classList.contains("sidebar-open")) {
    setSidebarOpen(false);
  }
}

function getCellEl(row, col) {
  return boardEl.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
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
    challengeMode: state.challengeMode,
    timeLimit: state.timeLimit,
    hintsUsed: state.hintsUsed,
    mistakes: state.mistakes,
    eraseCount: state.eraseCount,
    lastResult: state.lastResult,
    mode: state.mode,
    trainingTechnique: state.trainingTechnique,
    theme: themeSelectEl.value,
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
    gameModeEl.value = data.mode || "classic";
    trainingTechniqueEl.value = data.trainingTechnique || "singles";
    state.mode = gameModeEl.value;
    state.trainingTechnique = trainingTechniqueEl.value;
    applyThemeVariant(data.theme || loadThemePreference());
    challengeModeEl.checked = Boolean(data.challengeMode);
    state.gameId = data.id || buildGameId();
    state.createdAt = data.createdAt || new Date().toISOString();
    state.seed = Number.isInteger(data.seed) ? data.seed : makeSeed();
    state.puzzle = cloneBoard(data.puzzle);
    state.solution = cloneBoard(data.solution);
    state.user = cloneBoard(data.user);
    state.selected = null;
    state.elapsed = data.elapsed;
    state.finished = Boolean(data.finished);
    state.challengeMode = Boolean(data.challengeMode);
    state.timeLimit = Number.isInteger(data.timeLimit) && data.timeLimit > 0
      ? data.timeLimit
      : state.challengeMode
        ? difficultyLimits[data.difficulty]
        : 0;
    state.hintsUsed = Number.isInteger(data.hintsUsed) ? data.hintsUsed : 0;
    state.mistakes = Number.isInteger(data.mistakes) ? data.mistakes : 0;
    state.eraseCount = Number.isInteger(data.eraseCount) ? data.eraseCount : 0;
    state.lastResult = data.lastResult || "in-progress";

    applyModeConstraints();
    renderBoard();
    updateStatus();
    renderModeInfo();

    if (!state.finished) {
      startTimerFromSavedTime();
    } else {
      stopTimer();
    }

    upsertHistoryEntry(state.lastResult === "completed" ? "completed" : "in-progress");
    renderHistory();
    setMessage("Partida restaurada automaticamente.", "success");
    return true;
  } catch (error) {
    return false;
  }
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
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 80)));
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
    challengeMode: state.challengeMode,
    timeLimit: state.timeLimit,
    hintsUsed: state.hintsUsed,
    mode: state.mode,
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
    const challengeTag = entry.challengeMode ? " | desafio" : "";
    meta.innerHTML = `<strong>${capitalize(entry.difficulty)} | ${formatTime(entry.elapsed)}</strong><span>${statusText}${challengeTag} | ${entry.filled}/81 | ${capitalize(entry.mode || "classic")}</span><span>${dt.toLocaleString("pt-BR")}</span>`;

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
  challengeModeEl.checked = Boolean(entry.challengeMode);
  state.gameId = entry.id;
  state.createdAt = entry.createdAt;
  state.seed = entry.seed;
  state.puzzle = cloneBoard(entry.puzzle);
  state.solution = cloneBoard(entry.solution);
  state.user = cloneBoard(entry.user);
  state.selected = null;
  state.elapsed = entry.elapsed;
  state.finished = Boolean(entry.finished);
  state.challengeMode = Boolean(entry.challengeMode);
  state.timeLimit = entry.timeLimit || 0;
  state.hintsUsed = entry.hintsUsed || 0;
  state.mode = entry.mode || "classic";
  gameModeEl.value = state.mode;
  state.lastResult = entry.status || "in-progress";

  applyModeConstraints();
  clearHintMarks();
  renderBoard();
  updateStatus();
  renderModeInfo();

  if (state.finished) {
    stopTimer();
  } else {
    startTimerFromSavedTime();
  }

  saveGame();
  upsertHistoryEntry(state.lastResult);
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

function getStats() {
  const fallback = {
    totalGames: 0,
    totalWins: 0,
    byDifficulty: {
      easy: { wins: 0, totalTime: 0 },
      medium: { wins: 0, totalTime: 0 },
      hard: { wins: 0, totalTime: 0 },
    },
  };

  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    if (!parsed?.byDifficulty) {
      return fallback;
    }

    return {
      totalGames: Number(parsed.totalGames) || 0,
      totalWins: Number(parsed.totalWins) || 0,
      byDifficulty: {
        easy: parsed.byDifficulty.easy || { wins: 0, totalTime: 0 },
        medium: parsed.byDifficulty.medium || { wins: 0, totalTime: 0 },
        hard: parsed.byDifficulty.hard || { wins: 0, totalTime: 0 },
      },
    };
  } catch (error) {
    return fallback;
  }
}

function setStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function registerStartedGame() {
  const stats = getStats();
  stats.totalGames += 1;
  setStats(stats);
  renderStats();
}

function registerWinStats() {
  const stats = getStats();
  stats.totalWins += 1;
  const current = stats.byDifficulty[difficultyEl.value];
  current.wins += 1;
  current.totalTime += state.elapsed;
  setStats(stats);
}

function renderStats() {
  const stats = getStats();
  statsListEl.innerHTML = "";

  const total = document.createElement("li");
  total.textContent = `Total de partidas: ${stats.totalGames}`;
  statsListEl.appendChild(total);

  const wins = document.createElement("li");
  wins.textContent = `Total de vitorias: ${stats.totalWins}`;
  statsListEl.appendChild(wins);

  const mistakes = document.createElement("li");
  mistakes.textContent = `Erros na partida atual: ${state.mistakes}`;
  statsListEl.appendChild(mistakes);

  ["easy", "medium", "hard"].forEach((difficulty) => {
    const item = document.createElement("li");
    const data = stats.byDifficulty[difficulty];
    const avg = data.wins > 0 ? formatTime(Math.floor(data.totalTime / data.wins)) : "--:--";
    item.textContent = `${capitalize(difficulty)} | media de tempo: ${avg}`;
    statsListEl.appendChild(item);
  });
}

function getAchievements() {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
}

function setAchievements(value) {
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(value));
}

function unlockAchievement(id) {
  const ach = getAchievements();
  if (ach[id]) {
    return;
  }
  ach[id] = true;
  setAchievements(ach);
  const definition = achievementDefs.find((item) => item.id === id);
  if (definition) {
    setMessage(`Conquista desbloqueada: ${definition.label}`, "success");
  }
}

function evaluateAchievementsAfterWin() {
  const stats = getStats();
  if (stats.totalWins >= 1) {
    unlockAchievement("first_win");
  }
  if (state.hintsUsed === 0) {
    unlockAchievement("no_hint_win");
  }
  if (state.challengeMode) {
    unlockAchievement("challenge_win");
  }
  if (difficultyEl.value === "hard" && state.elapsed <= 8 * 60) {
    unlockAchievement("fast_hard");
  }
  if (state.mistakes === 0) {
    unlockAchievement("no_error_win");
  }
  if (state.eraseCount === 0) {
    unlockAchievement("no_erase_win");
  }
  if (difficultyEl.value === "medium" && state.elapsed <= 6 * 60) {
    unlockAchievement("speed_medium");
  }

  const streak = getStreak();
  if (streak.count >= 3) {
    unlockAchievement("streak_3");
  }
  if (streak.count >= 7) {
    unlockAchievement("streak_7");
  }
}

function renderAchievements() {
  achievementsListEl.innerHTML = "";
  const unlocked = getAchievements();

  achievementDefs.forEach((definition) => {
    const li = document.createElement("li");
    li.textContent = `${definition.label}: ${definition.desc}`;
    if (unlocked[definition.id]) {
      li.classList.add("unlocked");
    }
    achievementsListEl.appendChild(li);
  });
}

function getRanking() {
  const fallback = { easy: [], medium: [], hard: [] };
  try {
    const raw = localStorage.getItem(RANKING_KEY);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return {
      easy: Array.isArray(parsed.easy) ? parsed.easy : [],
      medium: Array.isArray(parsed.medium) ? parsed.medium : [],
      hard: Array.isArray(parsed.hard) ? parsed.hard : [],
    };
  } catch (error) {
    return fallback;
  }
}

function setRanking(ranking) {
  localStorage.setItem(RANKING_KEY, JSON.stringify(ranking));
}

function updateRanking() {
  const ranking = getRanking();
  const key = difficultyEl.value;
  ranking[key].push({
    elapsed: state.elapsed,
    hints: state.hintsUsed,
    mistakes: state.mistakes,
    date: new Date().toISOString(),
    mode: state.mode,
  });

  ranking[key].sort((a, b) => {
    if (a.elapsed !== b.elapsed) {
      return a.elapsed - b.elapsed;
    }
    if (a.hints !== b.hints) {
      return a.hints - b.hints;
    }
    return a.mistakes - b.mistakes;
  });

  ranking[key] = ranking[key].slice(0, 10);
  setRanking(ranking);
}

function renderRanking() {
  const ranking = getRanking();
  rankingListEl.innerHTML = "";

  ["easy", "medium", "hard"].forEach((difficulty) => {
    const top = ranking[difficulty].slice(0, 3);
    if (top.length === 0) {
      const li = document.createElement("li");
      li.textContent = `${capitalize(difficulty)}: sem tempos registrados ainda.`;
      rankingListEl.appendChild(li);
      return;
    }

    top.forEach((entry, index) => {
      const li = document.createElement("li");
      const stamp = new Date(entry.date).toLocaleDateString("pt-BR");
      li.textContent = `${capitalize(difficulty)} #${index + 1} | ${formatTime(entry.elapsed)} | dicas ${entry.hints} | erros ${entry.mistakes} | ${stamp}`;
      rankingListEl.appendChild(li);
    });
  });
}

function initDailyMission() {
  const mission = getDailyMission();
  const today = getTodayKey();
  if (mission.date !== today) {
    const next = createDailyMission(today);
    setDailyMission(next);
  }
}

function createDailyMission(dateKey) {
  const dayNumber = Number(dateKey.replace(/-/g, ""));
  const types = [
    {
      id: "medium-no-hint",
      title: "Objetivo do dia: termine um Sudoku medio sem dica.",
      check: (payload) => payload.win && payload.difficulty === "medium" && payload.hintsUsed === 0,
    },
    {
      id: "challenge-win",
      title: "Objetivo do dia: vença uma partida no modo desafio.",
      check: (payload) => payload.win && payload.challenge,
    },
    {
      id: "no-error",
      title: "Objetivo do dia: vença sem cometer erros.",
      check: (payload) => payload.win && payload.mistakes === 0,
    },
    {
      id: "training-win",
      title: "Objetivo do dia: complete uma partida no modo treino.",
      check: (payload) => payload.win && payload.mode === "training",
    },
  ];

  const choice = types[dayNumber % types.length];
  return {
    date: dateKey,
    missionId: choice.id,
    title: choice.title,
    completed: false,
    progress: 0,
    target: 1,
  };
}

function getDailyMission() {
  try {
    const raw = localStorage.getItem(DAILY_MISSION_KEY);
    if (!raw) {
      return createDailyMission(getTodayKey());
    }
    const parsed = JSON.parse(raw);
    if (!parsed?.date || !parsed?.missionId) {
      return createDailyMission(getTodayKey());
    }
    return parsed;
  } catch (error) {
    return createDailyMission(getTodayKey());
  }
}

function setDailyMission(mission) {
  localStorage.setItem(DAILY_MISSION_KEY, JSON.stringify(mission));
}

function updateDailyMissionProgress(eventName) {
  const mission = getDailyMission();
  if (mission.completed || eventName !== "win") {
    renderDailyMission();
    return;
  }

  const validators = {
    "medium-no-hint": () => difficultyEl.value === "medium" && state.hintsUsed === 0,
    "challenge-win": () => state.challengeMode,
    "no-error": () => state.mistakes === 0,
    "training-win": () => state.mode === "training",
  };

  const valid = validators[mission.missionId] ? validators[mission.missionId]() : false;
  if (valid) {
    mission.progress = 1;
    mission.completed = true;
    setDailyMission(mission);
    setMessage("Missao diaria concluida!", "success");
  }

  renderDailyMission();
}

function renderDailyMission() {
  const mission = getDailyMission();
  dailyMissionTextEl.textContent = mission.title;
  dailyMissionProgressEl.innerHTML = mission.completed
    ? "<strong>Status:</strong> concluida hoje."
    : `<strong>Status:</strong> ${mission.progress}/${mission.target} concluido.`;
}

function getCampaignProgress() {
  try {
    const raw = localStorage.getItem(CAMPAIGN_KEY);
    if (!raw) {
      return { currentPhase: 1, bestMedals: {} };
    }
    const parsed = JSON.parse(raw);
    return {
      currentPhase:
        Number.isInteger(parsed.currentPhase) && parsed.currentPhase >= 1
          ? Math.min(parsed.currentPhase, campaignPhases.length)
          : 1,
      bestMedals: parsed.bestMedals && typeof parsed.bestMedals === "object" ? parsed.bestMedals : {},
    };
  } catch (error) {
    return { currentPhase: 1, bestMedals: {} };
  }
}

function setCampaignProgress(progress) {
  localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(progress));
}

function initCampaign() {
  const progress = getCampaignProgress();
  if (!progress.currentPhase) {
    setCampaignProgress({ currentPhase: 1, bestMedals: {} });
  }
}

function renderCampaignStatus() {
  const progress = getCampaignProgress();
  const phase = campaignPhases[Math.max(0, Math.min(campaignPhases.length - 1, progress.currentPhase - 1))];
  const medal = progress.bestMedals[String(phase.id)] || "none";
  campaignStatusEl.textContent = `Fase atual: ${phase.id}/${campaignPhases.length} (${capitalize(phase.difficulty)}). Melhor medalha nesta fase: ${translateMedal(medal)}.`;
}

function getStreak() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) {
      return { count: 0, best: 0, lastPlayed: null };
    }
    const parsed = JSON.parse(raw);
    return {
      count: Number.isInteger(parsed.count) ? parsed.count : 0,
      best: Number.isInteger(parsed.best) ? parsed.best : 0,
      lastPlayed: typeof parsed.lastPlayed === "string" ? parsed.lastPlayed : null,
    };
  } catch (error) {
    return { count: 0, best: 0, lastPlayed: null };
  }
}

function setStreak(data) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

function markDailyActivity() {
  const streak = getStreak();
  const today = getTodayKey();
  const previous = streak.lastPlayed;

  if (!previous) {
    streak.count = 1;
  } else {
    const diff = dayDiff(previous, today);
    if (diff === 0) {
      renderStreak();
      return;
    }
    if (diff === 1) {
      streak.count += 1;
    } else if (diff > 1) {
      streak.count = 1;
    }
  }

  streak.best = Math.max(streak.best, streak.count);
  streak.lastPlayed = today;
  setStreak(streak);
  renderStreak();
}

function renderStreak() {
  const streak = getStreak();
  streakTextEl.textContent = `Sequencia atual: ${streak.count} dia(s) | Melhor: ${streak.best} dia(s).`;
  document.body.classList.toggle("streak-bonus", streak.count >= 3);
}

function dayDiff(fromDate, toDate) {
  const a = new Date(`${fromDate}T00:00:00`);
  const b = new Date(`${toDate}T00:00:00`);
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / 86400000);
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function restoreSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const settings = JSON.parse(raw);
      gameModeEl.value = settings.mode || "classic";
      trainingTechniqueEl.value = settings.trainingTechnique || "singles";
      boardSizeEl.value = settings.boardSize || "normal";
      fontSizeEl.value = settings.fontSize || "normal";
      highContrastEl.checked = Boolean(settings.highContrast);
      muteSoundEl.checked = Boolean(settings.mute);
      explainHintEl.checked = settings.explainHint !== false;
      state.mode = gameModeEl.value;
      state.trainingTechnique = trainingTechniqueEl.value;
    }
  } catch (error) {
    // usa defaults
  }

  audioState.enabled = !muteSoundEl.checked;
  applyVisualSettings();
  applyModeConstraints();
}

function saveSettings() {
  const payload = {
    mode: gameModeEl.value,
    trainingTechnique: trainingTechniqueEl.value,
    boardSize: boardSizeEl.value,
    fontSize: fontSizeEl.value,
    highContrast: highContrastEl.checked,
    mute: muteSoundEl.checked,
    explainHint: explainHintEl.checked,
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
}

function applyVisualSettings() {
  document.body.classList.remove("grid-compact", "grid-large", "font-small", "font-large", "high-contrast");

  if (boardSizeEl.value === "compact") {
    document.body.classList.add("grid-compact");
  } else if (boardSizeEl.value === "large") {
    document.body.classList.add("grid-large");
  }

  if (fontSizeEl.value === "small") {
    document.body.classList.add("font-small");
  } else if (fontSizeEl.value === "large") {
    document.body.classList.add("font-large");
  }

  if (highContrastEl.checked) {
    document.body.classList.add("high-contrast");
  }
}

function applyModeConstraints() {
  const mode = gameModeEl.value;
  state.mode = mode;
  state.trainingTechnique = trainingTechniqueEl.value;

  const isCampaign = mode === "campaign";
  const isTraining = mode === "training";

  trainingTechniqueEl.disabled = !isTraining;
  challengeModeEl.disabled = isCampaign || isTraining;
  difficultyEl.disabled = isCampaign;

  if (isCampaign) {
    const progress = getCampaignProgress();
    const phase = campaignPhases[Math.max(0, Math.min(campaignPhases.length - 1, progress.currentPhase - 1))];
    difficultyEl.value = phase.difficulty;
    challengeModeEl.checked = phase.challenge;
  }

  if (isTraining) {
    challengeModeEl.checked = false;
  }

  updateStatus();
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
    playOsc(ctx, 660, now, 0.06, "triangle", 0.05);
    playOsc(ctx, 880, now + 0.06, 0.07, "triangle", 0.045);
    return;
  }

  if (type === "error") {
    playOsc(ctx, 220, now, 0.12, "sawtooth", 0.07);
    return;
  }

  if (type === "hint") {
    playOsc(ctx, 740, now, 0.08, "triangle", 0.05);
    playOsc(ctx, 880, now + 0.08, 0.08, "triangle", 0.045);
    return;
  }

  if (type === "timeout") {
    playOsc(ctx, 260, now, 0.18, "square", 0.07);
    playOsc(ctx, 180, now + 0.14, 0.22, "square", 0.07);
    return;
  }

  if (type === "completeEpic") {
    playOsc(ctx, 523, now, 0.13, "triangle", 0.06);
    playOsc(ctx, 659, now + 0.12, 0.13, "triangle", 0.06);
    playOsc(ctx, 784, now + 0.24, 0.13, "triangle", 0.06);
    playOsc(ctx, 1046, now + 0.38, 0.28, "triangle", 0.07);
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
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.012);
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
      if (state.user[row][col] !== 0 && state.user[row][col] !== state.solution[row][col]) {
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

function translateStatus(status) {
  if (status === "completed") {
    return "Concluido";
  }
  if (status === "revealed") {
    return "Resolvido pelo botao";
  }
  if (status === "timeout") {
    return "Tempo esgotado";
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
  difficultyEl.disabled = disabled || gameModeEl.value === "campaign";
  gameModeEl.disabled = disabled;
  trainingTechniqueEl.disabled = disabled || gameModeEl.value !== "training";
  challengeModeEl.disabled = disabled || gameModeEl.value !== "classic";
  checkBtn.disabled = disabled;
  hintBtn.disabled = disabled;
  solveBtn.disabled = disabled;
}

function applyThemeVariant(themeName) {
  const allowed = ["glass", "slate", "old", "dark", "sunrise", "forest"];
  const nextTheme = allowed.includes(themeName) ? themeName : "glass";
  document.body.classList.remove("theme-glass", "theme-slate", "theme-old", "theme-dark", "theme-sunrise", "theme-forest");
  document.body.classList.add(`theme-${nextTheme}`);
  themeSelectEl.value = nextTheme;
  localStorage.setItem(THEME_KEY, nextTheme);
}

function loadThemePreference() {
  const raw = localStorage.getItem(THEME_KEY);
  if (["glass", "slate", "old", "dark", "sunrise", "forest"].includes(raw)) {
    return raw;
  }
  return "glass";
}

function cloneBoard(board) {
  return board.map((row) => row.slice());
}

function createEmptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}
