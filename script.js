// --- DOM Elements ---
const screens = {
    loading: document.getElementById('loading-screen'),
    menu: document.getElementById('main-menu'),
    game: document.getElementById('game-screen')
};

// Menu Buttons
const btnPvP = document.getElementById('btn-pvp');
const btnPvA = document.getElementById('btn-pva');
const difficultySelector = document.getElementById('ai-difficulty-selector');
const btnAiEasy = document.getElementById('btn-ai-easy');
const btnAiHard = document.getElementById('btn-ai-hard');
const btnStats = document.getElementById('btn-stats');
const btnSettings = document.getElementById('btn-settings');
const mainTitle = document.getElementById('main-title');

// Game UI Elements
const boardElement = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const turnIndicatorText = document.querySelector('.indicator-text');
const scoreXElement = document.getElementById('score-x');
const scoreOElement = document.getElementById('score-o');
const scoreDrawElement = document.getElementById('score-draw');
const btnUndo = document.getElementById('btn-undo');
const btnRestart = document.getElementById('btn-restart');
const btnBack = document.getElementById('btn-back');
const winningLine = document.getElementById('winning-line');
const labelO = document.getElementById('label-o');

// Modals
const modalOverlay = document.getElementById('modal-overlay');
const modalGameOver = document.getElementById('modal-gameover');
const modalSettings = document.getElementById('modal-settings');
const modalStats = document.getElementById('modal-stats');
const modalNames = document.getElementById('modal-names');
const inputPlayerX = document.getElementById('input-player-x');
const inputPlayerO = document.getElementById('input-player-o');
const groupPlayerO = document.getElementById('group-player-o');
const btnStartGame = document.getElementById('btn-start-game');
const btnCancelNames = document.getElementById('btn-cancel-names');
const winnerText = document.getElementById('winner-text');
const btnPlayAgain = document.getElementById('btn-play-again');
const btnMenuFromGameOver = document.getElementById('btn-menu-from-gameover');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnCloseStats = document.getElementById('btn-close-stats');
const btnResetStats = document.getElementById('btn-reset-stats');

// Settings Elements
const themeBtns = document.querySelectorAll('.theme-btn');
const toggleSfx = document.getElementById('toggle-sfx');

// Audio
const sfxClick = document.getElementById('sfx-click');
const sfxWin = document.getElementById('sfx-win');
const sfxDraw = document.getElementById('sfx-draw');
const sfxHover = document.getElementById('sfx-hover');

// Stats Elements
const statEls = {
    total: document.getElementById('stat-total'),
    wins: document.getElementById('stat-wins'),
    losses: document.getElementById('stat-losses'),
    draws: document.getElementById('stat-draws'),
    winrate: document.getElementById('stat-winrate'),
    streak: document.getElementById('stat-streak')
};

// --- Game State ---
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let isGameActive = false;
let gameMode = 'pvp'; // 'pvp' or 'pva'
let difficulty = 'easy'; // 'easy' or 'hard'
let matchScores = { X: 0, O: 0, Draw: 0 };
let moveHistory = [];
let soundEnabled = true;
let playerXName = 'Player X';
let playerOName = 'Player O';
let pendingMode = '';
let pendingDiff = '';

// --- Statistics ---
let stats = JSON.parse(localStorage.getItem('neonTicTacStats')) || {
    total: 0, wins: 0, losses: 0, draws: 0, streak: 0
};

// Winning conditions
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

// --- Initialization & Setup ---
function init() {
    // Setup Theme
    const savedTheme = localStorage.getItem('neonTheme') || 'theme-blue';
    setTheme(savedTheme);

    // Setup Sound Setting
    soundEnabled = localStorage.getItem('neonSound') !== 'false';
    toggleSfx.checked = soundEnabled;

    // Start background animation immediately
    initParticles();

    // Setup Event Listeners
    setupEventListeners();
    updateStatsUI();

    // Simulate Tic Tac Toe Loading Sequence
    const loaderSequence = [
        { id: 'lc-0', mark: 'X' },
        { id: 'lc-4', mark: 'O' },
        { id: 'lc-1', mark: 'X' },
        { id: 'lc-5', mark: 'O' },
        { id: 'lc-2', mark: 'X' } // X wins
    ];
    
    let step = 0;
    const loaderInterval = setInterval(() => {
        if (step < loaderSequence.length) {
            const cell = document.getElementById(loaderSequence[step].id);
            if(cell) {
                cell.innerText = loaderSequence[step].mark;
                cell.classList.add(loaderSequence[step].mark === 'X' ? 'x-mark' : 'o-mark');
            }
            step++;
        } else {
            clearInterval(loaderInterval);
            // Highlight winning row
            document.getElementById('lc-0').classList.add('win-mark');
            document.getElementById('lc-1').classList.add('win-mark');
            document.getElementById('lc-2').classList.add('win-mark');
            
            setTimeout(() => {
                document.getElementById('loading-text').classList.add('hidden');
                const startPrompt = document.getElementById('start-prompt');
                startPrompt.classList.remove('hidden');
                
                const startHandler = (e) => {
                    if (e.type === 'click' || (e.type === 'keydown' && e.key === 'Enter')) {
                        playClick();
                        document.removeEventListener('keydown', startHandler);
                        screens.loading.removeEventListener('click', startHandler);
                        
                        screens.loading.classList.remove('active');
                        screens.menu.classList.add('active');
                    }
                };
                
                document.addEventListener('keydown', startHandler);
                screens.loading.addEventListener('click', startHandler);
            }, 500);
        }
    }, 250);
}

function setupEventListeners() {
    // Menu
    btnPvP.addEventListener('click', () => { playClick(); showNameModal('pvp'); });
    btnPvA.addEventListener('click', () => { 
        playClick();
        difficultySelector.classList.remove('hidden');
        btnPvA.style.display = 'none';
        btnPvP.style.display = 'none';
    });
    btnAiEasy.addEventListener('click', () => { playClick(); showNameModal('pva', 'easy'); });
    btnAiHard.addEventListener('click', () => { playClick(); showNameModal('pva', 'hard'); });

    // Title Interaction
    if (mainTitle) {
        mainTitle.addEventListener('mouseenter', () => playHover());
        mainTitle.addEventListener('click', () => playClick());
    }
    
    // Board
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
        cell.addEventListener('mouseenter', () => {
            if (isGameActive && !cell.classList.contains('occupied')) playHover();
        });
    });

    // Game Controls
    btnUndo.addEventListener('click', () => { playClick(); undoMove(); });
    btnRestart.addEventListener('click', () => { playClick(); resetBoard(); });
    btnBack.addEventListener('click', () => { playClick(); showMenu(); });

    // Modals
    btnPlayAgain.addEventListener('click', () => { playClick(); closeModals(); resetBoard(); });
    btnMenuFromGameOver.addEventListener('click', () => { playClick(); closeModals(); showMenu(); });
    
    btnSettings.addEventListener('click', () => { playClick(); openModal('settings'); });
    btnCloseSettings.addEventListener('click', () => { playClick(); closeModals(); });
    
    btnStats.addEventListener('click', () => { playClick(); updateStatsUI(); openModal('stats'); });
    btnCloseStats.addEventListener('click', () => { playClick(); closeModals(); });
    btnResetStats.addEventListener('click', () => { playClick(); resetStats(); });

    // Name Modal
    btnStartGame.addEventListener('click', () => {
        playClick();
        playerXName = inputPlayerX.value.trim() || 'Player X';
        if (pendingMode === 'pva') {
            playerOName = 'AI';
        } else {
            playerOName = inputPlayerO.value.trim() || 'Player O';
        }
        closeModals();
        startGame(pendingMode, pendingDiff);
    });
    btnCancelNames.addEventListener('click', () => {
        playClick();
        closeModals();
    });

    // Settings
    themeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            playClick();
            setTheme(e.target.dataset.theme);
        });
    });
    
    toggleSfx.addEventListener('change', (e) => {
        soundEnabled = e.target.checked;
        localStorage.setItem('neonSound', soundEnabled);
        if(soundEnabled) playClick();
    });
    
    // Ripple Effect Logic
    document.querySelectorAll('.ripple').forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const circle = document.createElement('span');
            circle.classList.add('ripple-element');
            circle.style.left = `${x}px`;
            circle.style.top = `${y}px`;
            
            const diameter = Math.max(rect.width, rect.height);
            circle.style.width = circle.style.height = `${diameter}px`;
            circle.style.marginLeft = circle.style.marginTop = `-${diameter/2}px`;
            
            this.appendChild(circle);
            
            setTimeout(() => circle.remove(), 600);
        });
    });

    // Reset difficulty menu if clicking outside when it's open
    document.addEventListener('click', (e) => {
        if(!difficultySelector.classList.contains('hidden') && 
           !difficultySelector.contains(e.target) && 
           e.target !== btnPvA) {
            difficultySelector.classList.add('hidden');
            btnPvA.style.display = 'inline-flex';
            btnPvP.style.display = 'inline-flex';
        }
    });
}

// --- Screen Management ---
function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function showMenu() {
    isGameActive = false;
    matchScores = { X: 0, O: 0, Draw: 0 };
    updateScoreUI();
    difficultySelector.classList.add('hidden');
    btnPvA.style.display = 'inline-flex';
    btnPvP.style.display = 'inline-flex';
    switchScreen('menu');
}

function openModal(type) {
    modalOverlay.classList.remove('hidden');
    modalGameOver.classList.add('hidden');
    modalSettings.classList.add('hidden');
    modalStats.classList.add('hidden');
    modalNames.classList.add('hidden');

    if(type === 'gameover') modalGameOver.classList.remove('hidden');
    if(type === 'settings') modalSettings.classList.remove('hidden');
    if(type === 'stats') modalStats.classList.remove('hidden');
    if(type === 'names') modalNames.classList.remove('hidden');
}

function showNameModal(mode, diff = '') {
    pendingMode = mode;
    pendingDiff = diff;
    
    inputPlayerX.value = playerXName === 'Player X' ? '' : playerXName;
    if (mode === 'pva') {
        groupPlayerO.classList.add('hidden');
    } else {
        groupPlayerO.classList.remove('hidden');
        inputPlayerO.value = playerOName === 'Player O' ? '' : playerOName;
    }
    
    openModal('names');
    inputPlayerX.focus();
}

function closeModals() {
    modalOverlay.classList.add('hidden');
}

// --- Game Logic ---
function startGame(mode, diff = 'easy') {
    gameMode = mode;
    difficulty = diff;
    
    // Update Scoreboard Labels
    document.querySelector('#score-x-box .player-label').innerText = playerXName;
    document.querySelector('#score-o-box .player-label').innerText = playerOName;
    
    switchScreen('game');
    resetBoard();
}

function resetBoard() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    isGameActive = true;
    moveHistory = [];
    winningLine.style.opacity = '0';
    boardElement.classList.remove('shake');
    
    cells.forEach(cell => {
        cell.innerText = '';
        cell.className = 'cell';
    });
    
    updateTurnIndicator();
    
    // Clear confetti
    const ctx = document.getElementById('confetti-canvas').getContext('2d');
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

function handleCellClick(e) {
    const cell = e.target;
    const index = parseInt(cell.getAttribute('data-index'));

    if (board[index] !== '' || !isGameActive) return;

    makeMove(index, currentPlayer);

    if (gameMode === 'pva' && isGameActive && currentPlayer === 'O') {
        // AI Turn
        setTimeout(makeAIMove, 500); // Add a small delay for realism
    }
}

function makeMove(index, player) {
    playClick();
    board[index] = player;
    moveHistory.push(index);
    
    const cell = cells[index];
    cell.innerText = player;
    cell.classList.add('occupied', player.toLowerCase());
    
    createSparkles(cell);
    checkResult();
}

function checkResult() {
    let roundWon = false;
    let winningRow = null;

    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            roundWon = true;
            winningRow = winningConditions[i];
            break;
        }
    }

    if (roundWon) {
        isGameActive = false;
        handleWin(currentPlayer, winningRow);
        return;
    }

    if (!board.includes('')) {
        isGameActive = false;
        handleDraw();
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurnIndicator();
}

function handleWin(player, winningRow) {
    playWin();
    matchScores[player]++;
    updateScoreUI();
    
    // Animate winning cells
    winningRow.forEach(index => {
        cells[index].classList.add('win-pulse');
    });

    drawWinningLine(winningRow);
    triggerConfetti();

    winnerText.innerText = `${player === 'X' ? playerXName : playerOName} Wins!`;
    winnerText.style.color = player === 'X' ? 'var(--x-color)' : 'var(--o-color)';
    winnerText.style.textShadow = `0 0 10px var(--${player.toLowerCase()}-glow)`;

    updateStats(player);

    setTimeout(() => { openModal('gameover'); }, 1500);
}

function handleDraw() {
    playDraw();
    matchScores.Draw++;
    updateScoreUI();
    
    boardElement.classList.add('shake');
    winnerText.innerText = "It's a Draw!";
    winnerText.style.color = 'var(--text-main)';
    winnerText.style.textShadow = '0 0 10px rgba(255,255,255,0.5)';

    updateStats('Draw');

    setTimeout(() => { openModal('gameover'); }, 1000);
}

function undoMove() {
    if (moveHistory.length === 0 || !isGameActive) return;

    const lastMove = moveHistory.pop();
    board[lastMove] = '';
    const cell = cells[lastMove];
    cell.innerText = '';
    cell.className = 'cell';

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';

    // If playing vs AI and undoing player's move, we must also undo AI's previous move
    if (gameMode === 'pva' && currentPlayer === 'O' && moveHistory.length > 0) {
        const aiLastMove = moveHistory.pop();
        board[aiLastMove] = '';
        const aiCell = cells[aiLastMove];
        aiCell.innerText = '';
        aiCell.className = 'cell';
        currentPlayer = 'X';
    }

    updateTurnIndicator();
}

// --- AI Logic (Minimax) ---
function makeAIMove() {
    if (!isGameActive) return;
    
    let bestMove;
    if (difficulty === 'easy') {
        const availableMoves = board.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
        bestMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    } else {
        // Hard Mode - Minimax
        bestMove = getBestMove(board, 'O').index;
    }

    makeMove(bestMove, 'O');
}

function getBestMove(newBoard, player) {
    const availSpots = newBoard.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);

    if (checkWin(newBoard, 'X')) return { score: -10 };
    else if (checkWin(newBoard, 'O')) return { score: 10 };
    else if (availSpots.length === 0) return { score: 0 };

    const moves = [];
    for (let i = 0; i < availSpots.length; i++) {
        const move = {};
        move.index = availSpots[i];
        newBoard[availSpots[i]] = player;

        if (player === 'O') {
            const result = getBestMove(newBoard, 'X');
            move.score = result.score;
        } else {
            const result = getBestMove(newBoard, 'O');
            move.score = result.score;
        }

        newBoard[availSpots[i]] = '';
        moves.push(move);
    }

    let bestMove;
    if (player === 'O') {
        let bestScore = -10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else {
        let bestScore = 10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }

    return moves[bestMove];
}

function checkWin(boardState, player) {
    return winningConditions.some(condition => {
        return condition.every(index => boardState[index] === player);
    });
}

// --- UI Updates ---
function updateTurnIndicator() {
    const text = currentPlayer === 'X' ? `${playerXName}'s Turn` : `${playerOName}'s Turn`;
    turnIndicatorText.innerText = text;
    turnIndicatorText.style.color = currentPlayer === 'X' ? 'var(--x-color)' : 'var(--o-color)';
    
    // Sliding bar effect
    const bar = document.querySelector('.indicator-bar');
    if (currentPlayer === 'X') {
        bar.style.transform = 'translateX(-20%)';
        bar.style.background = 'var(--x-color)';
        bar.style.boxShadow = '0 0 10px var(--x-glow)';
    } else {
        bar.style.transform = 'translateX(20%)';
        bar.style.background = 'var(--o-color)';
        bar.style.boxShadow = '0 0 10px var(--o-glow)';
    }
}

function updateScoreUI() {
    animateScoreChange(scoreXElement, matchScores.X);
    animateScoreChange(scoreOElement, matchScores.O);
    animateScoreChange(scoreDrawElement, matchScores.Draw);
}

function animateScoreChange(element, newValue) {
    if (element.innerText != newValue) {
        element.classList.remove('score-update');
        void element.offsetWidth; // trigger reflow
        element.innerText = newValue;
        element.classList.add('score-update');
    }
}

function drawWinningLine(winningRow) {
    // 012, 345, 678
    // 036, 147, 258
    // 048, 246
    
    // This is a simplified positioning logic, assuming a perfect square grid
    // For a fully responsive perfect line, it requires calculating cell positions
    
    const startCell = cells[winningRow[0]];
    const endCell = cells[winningRow[2]];
    
    const startRect = startCell.getBoundingClientRect();
    const endRect = endCell.getBoundingClientRect();
    const boardRect = boardElement.getBoundingClientRect();
    
    const x1 = startRect.left + startRect.width / 2 - boardRect.left;
    const y1 = startRect.top + startRect.height / 2 - boardRect.top;
    const x2 = endRect.left + endRect.width / 2 - boardRect.left;
    const y2 = endRect.top + endRect.height / 2 - boardRect.top;
    
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    
    winningLine.style.width = `${length}px`;
    winningLine.style.height = '8px';
    winningLine.style.left = `${x1}px`;
    winningLine.style.top = `${y1 - 4}px`;
    winningLine.style.transform = `rotate(${angle}deg)`;
    winningLine.style.opacity = '1';
    
    // Color matches winner
    winningLine.style.background = currentPlayer === 'X' ? 'var(--x-color)' : 'var(--o-color)';
    winningLine.style.boxShadow = `0 0 15px ${currentPlayer === 'X' ? 'var(--x-glow)' : 'var(--o-glow)'}`;
}

// --- Theme Management ---
function setTheme(themeName) {
    document.body.className = themeName;
    localStorage.setItem('neonTheme', themeName);
    
    // Update CSS variables based on theme
    const root = document.documentElement;
    if (themeName === 'theme-blue') {
        root.style.setProperty('--primary', 'var(--theme-blue)');
        root.style.setProperty('--primary-glow', 'var(--theme-blue-glow)');
    } else if (themeName === 'theme-purple') {
        root.style.setProperty('--primary', 'var(--theme-purple)');
        root.style.setProperty('--primary-glow', 'var(--theme-purple-glow)');
    } else if (themeName === 'theme-green') {
        root.style.setProperty('--primary', 'var(--theme-green)');
        root.style.setProperty('--primary-glow', 'var(--theme-green-glow)');
    }
    
    themeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === themeName);
    });
}

// --- Statistics Management ---
function updateStats(result) {
    stats.total++;
    
    if (result === 'X') {
        stats.wins++;
        stats.streak++;
    } else if (result === 'O') {
        stats.losses++;
        stats.streak = 0; // Reset streak on loss
    } else {
        stats.draws++;
        // Streak remains same on draw, or can be reset. Let's keep it.
    }
    
    localStorage.setItem('neonTicTacStats', JSON.stringify(stats));
}

function updateStatsUI() {
    statEls.total.innerText = stats.total;
    statEls.wins.innerText = stats.wins;
    statEls.losses.innerText = stats.losses;
    statEls.draws.innerText = stats.draws;
    
    const winrate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;
    statEls.winrate.innerText = `${winrate}%`;
    statEls.streak.innerText = stats.streak;
}

function resetStats() {
    stats = { total: 0, wins: 0, losses: 0, draws: 0, streak: 0 };
    localStorage.setItem('neonTicTacStats', JSON.stringify(stats));
    updateStatsUI();
}

// --- Audio ---
function playClick() { if(soundEnabled && sfxClick) { sfxClick.currentTime = 0; sfxClick.play().catch(e=>{}); } }
function playHover() { if(soundEnabled && sfxHover) { sfxHover.currentTime = 0; sfxHover.play().catch(e=>{}); } }
function playWin() { if(soundEnabled && sfxWin) { sfxWin.currentTime = 0; sfxWin.play().catch(e=>{}); } }
function playDraw() { if(soundEnabled && sfxDraw) { sfxDraw.currentTime = 0; sfxDraw.play().catch(e=>{}); } }

// --- Visual Effects ---
function initParticles() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height, particles;
    
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        particles = [];
        const numParticles = Math.floor(window.innerWidth / 15);
        for (let i = 0; i < Math.min(numParticles, 120); i++) {
            particles.push(new Particle());
        }
    }

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 1.2;
            this.vy = (Math.random() - 0.5) * 1.2;
            this.radius = Math.random() * 2 + 0.5;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fill();
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
            
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * (1 - distance/120)})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    
    window.addEventListener('resize', resize);
    resize();
    animate();
}

function createSparkles(element) {
    const rect = element.getBoundingClientRect();
    const boardRect = boardElement.getBoundingClientRect();
    
    for (let i = 0; i < 10; i++) {
        const spark = document.createElement('div');
        spark.style.position = 'absolute';
        spark.style.width = '4px';
        spark.style.height = '4px';
        spark.style.borderRadius = '50%';
        spark.style.background = currentPlayer === 'X' ? 'var(--x-color)' : 'var(--o-color)';
        spark.style.boxShadow = `0 0 5px ${currentPlayer === 'X' ? 'var(--x-glow)' : 'var(--o-glow)'}`;
        
        const centerX = rect.left - boardRect.left + rect.width / 2;
        const centerY = rect.top - boardRect.top + rect.height / 2;
        
        spark.style.left = `${centerX}px`;
        spark.style.top = `${centerY}px`;
        spark.style.pointerEvents = 'none';
        
        boardElement.appendChild(spark);
        
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 50 + 20;
        const destX = centerX + Math.cos(angle) * distance;
        const destY = centerY + Math.sin(angle) * distance;
        
        spark.animate([
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            { transform: `translate(${destX - centerX}px, ${destY - centerY}px) scale(0)`, opacity: 0 }
        ], {
            duration: 600,
            easing: 'cubic-bezier(0, .9, .57, 1)'
        });
        
        setTimeout(() => spark.remove(), 600);
    }
}

// Confetti Effect
function triggerConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const pieces = [];
    const colors = ['#00f3ff', '#ff2a6d', '#b829ff', '#00ff66', '#ffffff'];
    
    for (let i = 0; i < 100; i++) {
        pieces.push({
            x: canvas.width / 2,
            y: canvas.height / 2 + 100,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 1) * 20 - 5,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10
        });
    }
    
    function animate() {
        if (!isGameActive && !document.getElementById('modal-gameover').classList.contains('hidden')) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let active = false;
            
            pieces.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.5; // gravity
                p.rotation += p.rotationSpeed;
                
                if (p.y < canvas.height) active = true;
                
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                ctx.restore();
            });
            
            if (active) requestAnimationFrame(animate);
        }
    }
    animate();
}

// Boot the game
init();
