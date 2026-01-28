/**
 * 🧩 俄罗斯方块游戏 - 特殊能力+技能版
 */

(function() {
    'use strict';

    // ==================== 常量定义 ====================
    const COLS = 12;
    const ROWS = 20;
    const BLOCK_SIZE = 20;

    // 7种方块形状定义 (每种4个旋转状态)
    const SHAPES = {
        I: {
            color: '#00f5ff',
            rotations: [
                [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
                [[0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0]],
                [[0,0,0,0], [0,0,0,0], [1,1,1,1], [0,0,0,0]],
                [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]]
            ]
        },
        O: {
            color: '#ffd700',
            rotations: [
                [[1,1], [1,1]],
                [[1,1], [1,1]],
                [[1,1], [1,1]],
                [[1,1], [1,1]]
            ]
        },
        T: {
            color: '#da70d6',
            rotations: [
                [[0,1,0], [1,1,1], [0,0,0]],
                [[0,1,0], [0,1,1], [0,1,0]],
                [[0,0,0], [1,1,1], [0,1,0]],
                [[0,1,0], [1,1,0], [0,1,0]]
            ]
        },
        S: {
            color: '#32cd32',
            rotations: [
                [[0,1,1], [1,1,0], [0,0,0]],
                [[0,1,0], [0,1,1], [0,0,1]],
                [[0,0,0], [0,1,1], [1,1,0]],
                [[1,0,0], [1,1,0], [0,1,0]]
            ]
        },
        Z: {
            color: '#ff6347',
            rotations: [
                [[1,1,0], [0,1,1], [0,0,0]],
                [[0,0,1], [0,1,1], [0,1,0]],
                [[0,0,0], [1,1,0], [0,1,1]],
                [[0,1,0], [1,1,0], [1,0,0]]
            ]
        },
        J: {
            color: '#4169e1',
            rotations: [
                [[1,0,0], [1,1,1], [0,0,0]],
                [[0,1,1], [0,1,0], [0,1,0]],
                [[0,0,0], [1,1,1], [0,0,1]],
                [[0,1,0], [0,1,0], [1,1,0]]
            ]
        },
        L: {
            color: '#ffa500',
            rotations: [
                [[0,0,1], [1,1,1], [0,0,0]],
                [[0,1,0], [0,1,0], [0,1,1]],
                [[0,0,0], [1,1,1], [1,0,0]],
                [[1,1,0], [0,1,0], [0,1,0]]
            ]
        }
    };

    const PIECE_NAMES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

    // 特殊能力定义
    const SPECIAL_TYPES = {
        NORMAL: { name: '普通', color: null, probability: 0.7 },
        EXPLOSIVE: { name: '爆炸', color: '#ff0000', probability: 0.06, icon: '💥' },
        PENETRATE: { name: '穿透', color: 'rgba(200,200,255,0.6)', probability: 0.06, icon: '👻' },
        COLORFUL: { name: '变色', color: '#ff69b4', probability: 0.06, icon: '🎨' },
        MAGNETIC: { name: '磁力', color: '#8b4513', probability: 0.06, icon: '🧲' },
        SPLIT: { name: '分裂', color: '#00ff7f', probability: 0.06, icon: '🔀' }
    };

    // 特殊能力颜色池（用于变色方块）
    const COLOR_POOL = [
        '#00f5ff', '#ffd700', '#da70d6', '#32cd32', '#ff6347',
        '#4169e1', '#ffa500', '#ff0000', '#00ff7f', '#ff69b4'
    ];

    // 技能定义
    const SKILLS = {
        SLOW: { name: '时间减缓', cost: 30, duration: 5000, icon: '⏱️' },
        CLEAR: { name: '行消除', cost: 25, icon: '🗑️' },
        PREVIEW: { name: '方块预览', cost: 20, duration: 10000, icon: '🔮' },
        ROTATE: { name: '场地旋转', cost: 50, icon: '🔄' }
    };

    // 等级对应的下落速度 (ms)
    const LEVEL_SPEED = [
        800, 720, 650, 580, 500,
        430, 370, 320, 280, 240,
        210, 180, 160, 140, 120,
        110, 100, 90, 80, 70,
        60, 50, 45, 40, 35,
        30, 27, 25, 23, 20
    ];

    // ==================== 游戏状态 ====================
    const state = {
        board: [],
        score: 0,
        highScore: 0,
        level: 1,
        lines: 0,
        running: false,
        paused: false,
        gameOver: false,
        currentPiece: null,
        nextPiece: null,
        futurePieces: [],
        dropInterval: null,
        lastDropTime: 0,
        effects: [],
        // 技能系统
        energy: 0,
        energyMax: 100,
        skills: {
            slow: { active: false, endTime: 0 },
            preview: { active: false, endTime: 0 },
            clear: { available: true },
            rotate: { available: true, rotating: false }
        }
    };

    // ==================== Canvas 设置 ====================
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;

    const nextCanvas = document.getElementById('next-canvas');
    const nextCtx = nextCanvas.getContext('2d');

    const futureCanvas = document.getElementById('future-canvas');
    const futureCtx = futureCanvas.getContext('2d');

    // ==================== 本地存储 ====================
    function loadHighScore() {
        const saved = localStorage.getItem('tetris-high-score');
        if (saved) {
            state.highScore = parseInt(saved, 10);
            document.getElementById('high-score').textContent = state.highScore;
        }
    }

    function saveHighScore() {
        localStorage.setItem('tetris-high-score', state.highScore.toString());
    }

    // ==================== 游戏板初始化 ====================
    function initBoard() {
        state.board = [];
        for (let row = 0; row < ROWS; row++) {
            state.board[row] = [];
            for (let col = 0; col < COLS; col++) {
                state.board[row][col] = null;
            }
        }
    }

    // ==================== 方块操作 ====================
    function createPiece(type, specialType = 'NORMAL') {
        const shape = SHAPES[type];
        const special = SPECIAL_TYPES[specialType];

        return {
            type: type,
            color: special.color || shape.color,
            baseColor: shape.color,
            special: specialType,
            rotation: 0,
            shape: shape.rotations[0],
            x: Math.floor((COLS - shape.rotations[0][0].length) / 2),
            y: 0
        };
    }

    function rotatePiece() {
        const piece = state.currentPiece;
        const oldRotation = piece.rotation;
        const oldShape = piece.shape;

        piece.rotation = (piece.rotation + 1) % 4;
        piece.shape = SHAPES[piece.type].rotations[piece.rotation];

        if (!isValidPosition(piece)) {
            piece.rotation = oldRotation;
            piece.shape = oldShape;
            return false;
        }
        return true;
    }

    function isValidPosition(piece, offsetX = 0, offsetY = 0) {
        const shape = piece.shape;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = piece.x + col + offsetX;
                    const newY = piece.y + row + offsetY;

                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return false;
                    }

                    if (piece.special === 'PENETRATE') {
                        if (newY >= 0 && newY < ROWS && newX >= 0 && newX < COLS) {
                            continue;
                        }
                    }

                    if (newY >= 0 && state.board[newY][newX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    function getDropDistance(piece) {
        let distance = 0;
        while (isValidPosition(piece, 0, distance + 1)) {
            distance++;
        }
        return distance;
    }

    function movePiece(dx, dy) {
        const piece = state.currentPiece;
        if (isValidPosition(piece, dx, dy)) {
            piece.x += dx;
            piece.y += dy;
            return true;
        }
        return false;
    }

    // ==================== 特殊能力效果 ====================
    function triggerExplosive(row, col) {
        const radius = 1;
        for (let r = row - radius; r <= row + radius; r++) {
            for (let c = col - radius; c <= col + radius; c++) {
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS && state.board[r][c]) {
                    state.board[r][c] = null;
                    addEffect(r, c, 'explosion');
                }
            }
        }
        applyGravity();
        state.score += 50;
    }

    function triggerColorful(row, col) {
        const radius = 2;
        for (let r = row - radius; r <= row + radius; r++) {
            for (let c = col - radius; c <= col + radius; c++) {
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS && state.board[r][c]) {
                    const randomColor = COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)];
                    if (state.board[r][c]) {
                        state.board[r][c].color = randomColor;
                        addEffect(r, c, 'sparkle');
                    }
                }
            }
        }
        state.score += 30;
    }

    function triggerMagnetic(row, col) {
        const radius = 3;
        let attracted = 0;
        for (let r = row - radius; r <= row + radius; r++) {
            if (r < 0 || r >= ROWS) continue;
            for (let c = 0; c < COLS; c++) {
                if (!state.board[r][c] || (r === row && c === col)) continue;
                const distance = Math.abs(c - col);
                if (distance > 0 && distance <= radius) {
                    const newC = c < col ? c + 1 : c - 1;
                    if (!state.board[r][newC]) {
                        state.board[r][newC] = state.board[r][c];
                        state.board[r][c] = null;
                        attracted++;
                    }
                }
            }
        }
        if (attracted > 0) {
            state.score += attracted * 20;
            addEffect(row, col, 'magnetic');
        }
    }

    function triggerSplit(row, col) {
        const offsets = [-1, 1];
        offsets.forEach(offset => {
            const newCol = col + offset;
            if (newCol >= 0 && newCol < COLS && !state.board[row][newCol]) {
                state.board[row][newCol] = {
                    color: '#00ff7f',
                    special: 'NORMAL',
                    isTemp: true
                };
                addEffect(row, newCol, 'split');
            }
        });
        state.score += 25;
    }

    function applyGravity() {
        for (let col = 0; col < COLS; col++) {
            let writeRow = ROWS - 1;
            for (let row = ROWS - 1; row >= 0; row--) {
                if (state.board[row][col]) {
                    if (row !== writeRow) {
                        state.board[writeRow][col] = state.board[row][col];
                        state.board[row][col] = null;
                    }
                    writeRow--;
                }
            }
        }
    }

    function addEffect(row, col, type) {
        state.effects.push({
            row, col,
            type,
            life: 20,
            maxLife: 20
        });
    }

    function removeTempBlocks() {
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (state.board[row][col] && state.board[row][col].isTemp) {
                    state.board[row][col] = null;
                }
            }
        }
    }

    // ==================== 技能系统 ====================
    function updateSkillsUI() {
        const skills = state.skills;
        const energy = state.energy;

        // 更新能量条
        document.getElementById('energy-bar').style.width = (energy / state.energyMax * 100) + '%';
        document.getElementById('energy-text').textContent = Math.floor(energy) + ' / ' + state.energyMax;

        // 更新技能按钮状态
        Object.keys(SKILLS).forEach((key, index) => {
            const btn = document.getElementById('skill-' + key.toLowerCase());
            const skill = skills[key.toLowerCase()];
            const cost = SKILLS[key].cost;

            if (energy >= cost) {
                btn.classList.remove('disabled');
                if (key === 'CLEAR' || key === 'ROTATE') {
                    if (skill.available) {
                        btn.classList.remove('disabled');
                    } else {
                        btn.classList.add('disabled');
                    }
                }
                if (skill.active) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            } else {
                btn.classList.add('disabled');
                btn.classList.remove('active');
            }
        });
    }

    function addEnergy(amount) {
        state.energy = Math.min(state.energyMax, state.energy + amount);
        updateSkillsUI();
    }

    // 技能1: 时间减缓
    function useSkillSlow() {
        if (state.energy < SKILLS.SLOW.cost) return false;
        if (state.skills.slow.active) return false;

        state.energy -= SKILLS.SLOW.cost;
        state.skills.slow.active = true;
        state.skills.slow.endTime = Date.now() + SKILLS.SLOW.duration;

        updateSkillsUI();
        resetDropInterval();

        // 5秒后恢复正常速度
        setTimeout(() => {
            state.skills.slow.active = false;
            updateSkillsUI();
            resetDropInterval();
        }, SKILLS.SLOW.duration);

        return true;
    }

    // 技能2: 行消除
    function useSkillClear() {
        if (state.energy < SKILLS.CLEAR.cost) return false;
        if (!state.skills.clear.available) return false;

        state.energy -= SKILLS.CLEAR.cost;

        // 找到最底部有方块的行
        let targetRow = -1;
        for (let row = ROWS - 1; row >= 0; row--) {
            let hasBlock = false;
            for (let col = 0; col < COLS; col++) {
                if (state.board[row][col]) {
                    hasBlock = true;
                    break;
                }
            }
            if (hasBlock) {
                targetRow = row;
                break;
            }
        }

        if (targetRow >= 0) {
            // 清除该行
            for (let col = 0; col < COLS; col++) {
                addEffect(targetRow, col, 'explosion');
                state.board[targetRow][col] = null;
            }
            // 上方方块下落
            applyGravity();
            state.score += 50;
            state.lines++;
        }

        updateSkillsUI();
        render();

        return true;
    }

    // 技能3: 方块预览
    function useSkillPreview() {
        if (state.energy < SKILLS.PREVIEW.cost) return false;
        if (state.skills.preview.active) return false;

        state.energy -= SKILLS.PREVIEW.cost;
        state.skills.preview.active = true;
        state.skills.preview.endTime = Date.now() + SKILLS.PREVIEW.duration;

        // 显示未来方块
        document.getElementById('future-box').style.display = 'block';
        renderFuturePieces();

        updateSkillsUI();

        setTimeout(() => {
            state.skills.preview.active = false;
            document.getElementById('future-box').style.display = 'none';
            updateSkillsUI();
        }, SKILLS.PREVIEW.duration);

        return true;
    }

    // 技能4: 场地旋转
    function useSkillRotate() {
        if (state.energy < SKILLS.ROTATE.cost) return false;
        if (!state.skills.rotate.available || state.skills.rotate.rotating) return false;

        state.energy -= SKILLS.ROTATE.cost;
        state.skills.rotate.rotating = true;
        updateSkillsUI();

        // 旋转游戏区域
        const wrapper = document.querySelector('.game-board-wrapper');
        wrapper.classList.add('rotated');

        // 旋转方块数组
        const newBoard = [];
        for (let col = 0; col < ROWS; col++) {
            newBoard[col] = [];
            for (let row = COLS - 1; row >= 0; row--) {
                newBoard[col].push(state.board[row][col]);
            }
        }
        state.board = newBoard;

        // 交换行列数
        const temp = COLS;
        // COLS 和 ROWS 保持不变，但游戏板数据结构已改变

        setTimeout(() => {
            wrapper.classList.remove('rotated');
            state.skills.rotate.rotating = false;
            state.skills.rotate.available = false;
            updateSkillsUI();
            render();
        }, 500);

        return true;
    }

    // 全局技能使用函数
    window.useSkill = function(skillName) {
        if (!state.running || state.paused || state.gameOver) return;

        switch (skillName) {
            case 'slow':
                useSkillSlow();
                break;
            case 'clear':
                useSkillClear();
                break;
            case 'preview':
                useSkillPreview();
                break;
            case 'rotate':
                useSkillRotate();
                break;
        }
        render();
    };

    // ==================== 方块放置与消除 ====================
    function lockPiece() {
        const piece = state.currentPiece;
        const shape = piece.shape;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardY = piece.y + row;
                    const boardX = piece.x + col;

                    if (boardY < 0) {
                        gameOver();
                        return;
                    }
                    state.board[boardY][boardX] = {
                        color: piece.baseColor || piece.color,
                        special: piece.special
                    };
                }
            }
        }

        // 触发放置时的特殊效果
        if (piece.special === 'COLORFUL' || piece.special === 'MAGNETIC' || piece.special === 'SPLIT') {
            processSpecialEffects();
        }

        // 检查消除行
        clearLines();

        // 生成新方块
        spawnNextPiece();
    }

    function clearLines() {
        let linesCleared = 0;
        const linesToRemove = [];
        let hasSpecialInCleared = false;
        let energyGained = 0;

        for (let row = ROWS - 1; row >= 0; row--) {
            let isFull = true;
            for (let col = 0; col < COLS; col++) {
                if (!state.board[row][col]) {
                    isFull = false;
                    break;
                }
            }
            if (isFull) {
                linesToRemove.push(row);
                linesCleared++;
                energyGained += 5; // 每消除一行获得5点能量

                for (let col = 0; col < COLS; col++) {
                    if (state.board[row][col]) {
                        if (state.board[row][col].special === 'EXPLOSIVE') {
                            triggerExplosive(row, col);
                            hasSpecialInCleared = true;
                            linesCleared = 0;
                            energyGained += 10;
                        }
                    }
                }
            }
        }

        if (linesCleared > 0 && !hasSpecialInCleared) {
            linesToRemove.forEach(row => {
                state.board.splice(row, 1);
                state.board.unshift(new Array(COLS).fill(null));
            });

            state.lines += linesCleared;
            const newLevel = Math.floor(state.lines / 10) + 1;

            if (newLevel > state.level) {
                state.level = newLevel;
                resetDropInterval();
            }

            const points = [0, 100, 300, 500, 800];
            state.score += points[linesCleared] * state.level;

            if (state.score > state.highScore) {
                state.highScore = state.score;
                saveHighScore();
            }

            updateUI();
        }

        // 获得能量
        if (energyGained > 0) {
            addEnergy(energyGained);
        }

        removeTempBlocks();
    }

    function processSpecialEffects() {
        const specialPositions = [];
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (state.board[row][col] && state.board[row][col].special) {
                    specialPositions.push({
                        row,
                        col,
                        special: state.board[row][col].special
                    });
                }
            }
        }

        specialPositions.forEach(pos => {
            switch (pos.special) {
                case 'COLORFUL':
                    triggerColorful(pos.row, pos.col);
                    state.board[pos.row][pos.col].special = 'NORMAL';
                    break;
                case 'MAGNETIC':
                    triggerMagnetic(pos.row, pos.col);
                    state.board[pos.row][pos.col].special = 'NORMAL';
                    break;
                case 'SPLIT':
                    triggerSplit(pos.row, pos.col);
                    state.board[pos.row][pos.col].special = 'NORMAL';
                    break;
            }
        });
    }

    // ==================== 游戏流程 ====================
    function spawnNextPiece() {
        state.currentPiece = state.nextPiece || createRandomPiece();
        state.nextPiece = createRandomPiece();

        // 维护未来方块队列
        state.futurePieces.push(createRandomPiece());
        if (state.futurePieces.length > 3) {
            state.futurePieces.shift();
        }

        if (!isValidPosition(state.currentPiece)) {
            gameOver();
            return;
        }

        renderNextPiece();
        if (state.skills.preview.active) {
            renderFuturePieces();
        }
    }

    function createRandomPiece() {
        const type = PIECE_NAMES[Math.floor(Math.random() * PIECE_NAMES.length)];
        const rand = Math.random();
        let specialType = 'NORMAL';
        let cumulative = 0;

        for (const [key, special] of Object.entries(SPECIAL_TYPES)) {
            if (key === 'NORMAL') continue;
            cumulative += special.probability;
            if (rand < cumulative) {
                specialType = key;
                break;
            }
        }

        return createPiece(type, specialType);
    }

    function startGame() {
        if (state.running) return;

        initBoard();
        state.score = 0;
        state.level = 1;
        state.lines = 0;
        state.gameOver = false;
        state.paused = false;
        state.nextPiece = null;
        state.futurePieces = [];
        state.effects = [];
        state.energy = 0;
        state.skills = {
            slow: { active: false, endTime: 0 },
            preview: { active: false, endTime: 0 },
            clear: { available: true },
            rotate: { available: true, rotating: false }
        };

        document.getElementById('future-box').style.display = 'none';
        document.querySelector('.game-board-wrapper').classList.remove('rotated');

        updateUI();
        updateSkillsUI();
        spawnNextPiece();

        state.running = true;
        state.lastDropTime = performance.now();
        resetDropInterval();
    }

    function stopGame() {
        state.running = false;
        if (state.dropInterval) {
            clearTimeout(state.dropInterval);
            state.dropInterval = null;
        }
    }

    function resetDropInterval() {
        if (state.dropInterval) {
            clearTimeout(state.dropInterval);
        }

        if (state.running && !state.paused) {
            let speed = LEVEL_SPEED[Math.min(state.level - 1, LEVEL_SPEED.length - 1)];

            // 时间减缓技能效果
            if (state.skills.slow.active) {
                speed = speed * 2; // 速度减半
            }

            state.dropInterval = setTimeout(() => dropPiece(), speed);
        }
    }

    function dropPiece() {
        if (!state.running || state.paused || state.gameOver) return;

        if (state.currentPiece.special === 'PENETRATE') {
            const distance = getDropDistance(state.currentPiece);
            if (distance > 0) {
                state.currentPiece.y += distance;
                state.score += distance * 2;
                updateUI();
            }
        }

        if (!movePiece(0, 1)) {
            lockPiece();
        }

        state.lastDropTime = performance.now();

        if (state.running && !state.gameOver) {
            resetDropInterval();
        }
    }

    function hardDrop() {
        if (!state.running || state.paused || state.gameOver) return;

        if (state.currentPiece.special === 'PENETRATE') {
            const distance = getDropDistance(state.currentPiece);
            state.currentPiece.y += distance;
            state.score += distance * 3;
        } else {
            while (movePiece(0, 1)) {
                state.score += 2;
            }
        }

        lockPiece();
        updateUI();

        if (state.running) {
            resetDropInterval();
            render();
        }
    }

    function gameOver() {
        state.gameOver = true;
        state.running = false;
        stopGame();
        render();
    }

    function togglePause() {
        if (state.gameOver) return;

        state.paused = !state.paused;

        if (state.paused) {
            stopGame();
        } else {
            state.running = true;
            state.lastDropTime = performance.now();
            resetDropInterval();
        }

        render();
    }

    // ==================== 渲染 ====================
    function render() {
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 1;
        for (let row = 0; row <= ROWS; row++) {
            ctx.beginPath();
            ctx.moveTo(0, row * BLOCK_SIZE);
            ctx.lineTo(canvas.width, row * BLOCK_SIZE);
            ctx.stroke();
        }
        for (let col = 0; col <= COLS; col++) {
            ctx.beginPath();
            ctx.moveTo(col * BLOCK_SIZE, 0);
            ctx.lineTo(col * BLOCK_SIZE, canvas.height);
            ctx.stroke();
        }

        // 绘制已锁定的方块
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (state.board[row][col]) {
                    drawBlock(ctx, col, row, state.board[row][col].color, state.board[row][col].special);
                }
            }
        }

        // 绘制当前方块
        if (state.currentPiece && !state.gameOver) {
            const piece = state.currentPiece;
            const shape = piece.shape;

            if (piece.special !== 'PENETRATE') {
                let shadowY = piece.y;
                while (isValidPosition(piece, 0, shadowY - piece.y + 1)) {
                    shadowY++;
                }
                if (shadowY > piece.y) {
                    drawGhostPiece(piece, shadowY);
                }
            }

            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        drawBlock(ctx, piece.x + col, piece.y + row, piece.color, piece.special);
                    }
                }
            }
        }

        // 时间减缓效果
        if (state.skills.slow.active) {
            ctx.fillStyle = 'rgba(102, 126, 234, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = 'rgba(102, 126, 234, 0.5)';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('⏱️ 时间减缓中', 10, 20);
        }

        renderEffects();
        drawOverlay();
    }

    function drawBlock(context, x, y, color, special = null) {
        const padding = 1;
        const xPos = x * BLOCK_SIZE + padding;
        const yPos = y * BLOCK_SIZE + padding;
        const size = BLOCK_SIZE - padding * 2;

        context.fillStyle = color;
        context.fillRect(xPos, yPos, size, size);

        context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        context.fillRect(xPos, yPos, size, 3);
        context.fillRect(xPos, yPos, 3, size);

        context.fillStyle = 'rgba(0, 0, 0, 0.3)';
        context.fillRect(xPos, yPos + size - 3, size, 3);
        context.fillRect(xPos + size - 3, yPos, 3, size);

        if (special && special !== 'NORMAL') {
            const specialInfo = SPECIAL_TYPES[special];
            if (Math.random() > 0.7) {
                context.strokeStyle = '#fff';
                context.lineWidth = 2;
                context.strokeRect(xPos + 2, yPos + 2, size - 4, size - 4);
            }
            context.fillStyle = '#fff';
            context.font = '10px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(specialInfo.icon || '', xPos + size / 2, yPos + size / 2);
        }
    }

    function drawGhostPiece(piece, ghostY) {
        const shape = piece.shape;
        ctx.globalAlpha = 0.2;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const padding = 2;
                    ctx.fillStyle = piece.color;
                    ctx.fillRect(
                        (piece.x + col) * BLOCK_SIZE + padding,
                        (ghostY + row) * BLOCK_SIZE + padding,
                        BLOCK_SIZE - padding * 2,
                        BLOCK_SIZE - padding * 2
                    );
                }
            }
        }
        ctx.globalAlpha = 1;
    }

    function renderEffects() {
        state.effects = state.effects.filter(effect => {
            effect.life--;
            if (effect.life <= 0) return false;

            const alpha = effect.life / effect.maxLife;
            const x = effect.col * BLOCK_SIZE + BLOCK_SIZE / 2;
            const y = effect.row * BLOCK_SIZE + BLOCK_SIZE / 2;

            ctx.save();
            ctx.globalAlpha = alpha;

            switch (effect.type) {
                case 'explosion':
                    const gradient = ctx.createRadialGradient(x, y, 0, x, y, BLOCK_SIZE);
                    gradient.addColorStop(0, '#ff0000');
                    gradient.addColorStop(1, 'transparent');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(x, y, BLOCK_SIZE * (1 - alpha) + 5, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'sparkle':
                    ctx.fillStyle = '#fff';
                    for (let i = 0; i < 4; i++) {
                        const angle = (Math.PI / 2) * i + performance.now() / 200;
                        const dist = 5 + (1 - alpha) * 10;
                        ctx.beginPath();
                        ctx.arc(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
                case 'magnetic':
                    ctx.strokeStyle = '#8b4513';
                    ctx.lineWidth = 2;
                    for (let i = 0; i < 8; i++) {
                        const angle = (Math.PI / 4) * i + performance.now() / 300;
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x + Math.cos(angle) * BLOCK_SIZE * 1.5 * (1 - alpha),
                                   y + Math.sin(angle) * BLOCK_SIZE * 1.5 * (1 - alpha));
                        ctx.stroke();
                    }
                    break;
                case 'split':
                    ctx.fillStyle = '#00ff7f';
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.arc(x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 10, 3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
            }

            ctx.restore();
            return true;
        });
    }

    function renderNextPiece() {
        nextCtx.fillStyle = '#0a0a1a';
        nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

        if (!state.nextPiece) return;

        const piece = state.nextPiece;
        const shape = piece.shape;
        const blockSize = 16;
        const offsetX = (nextCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (nextCanvas.height - shape.length * blockSize) / 2;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = offsetX + col * blockSize;
                    const y = offsetY + row * blockSize;

                    nextCtx.fillStyle = piece.color;
                    nextCtx.fillRect(x + 1, y + 1, blockSize - 2, blockSize - 2);

                    if (piece.special !== 'NORMAL') {
                        const specialInfo = SPECIAL_TYPES[piece.special];
                        nextCtx.fillStyle = '#fff';
                        nextCtx.font = '8px Arial';
                        nextCtx.textAlign = 'center';
                        nextCtx.textBaseline = 'middle';
                        nextCtx.fillText(specialInfo.icon || '', x + blockSize / 2, y + blockSize / 2);
                    }
                }
            }
        }
    }

    function renderFuturePieces() {
        futureCtx.fillStyle = '#0a0a1a';
        futureCtx.fillRect(0, 0, futureCanvas.width, futureCanvas.height);

        if (state.futurePieces.length === 0) return;

        const blockSize = 14;
        const startY = 5;

        state.futurePieces.forEach((piece, index) => {
            const shape = piece.shape;
            const offsetX = (futureCanvas.width - shape[0].length * blockSize) / 2;
            const offsetY = startY + index * 35;

            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        const x = offsetX + col * blockSize;
                        const y = offsetY + row * blockSize;

                        futureCtx.fillStyle = piece.color;
                        futureCtx.fillRect(x + 1, y + 1, blockSize - 2, blockSize - 2);
                    }
                }
            }
        });
    }

    function drawOverlay() {
        if (state.paused && !state.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('已暂停', canvas.width / 2, canvas.height / 2 - 20);
            ctx.font = '14px Arial';
            ctx.fillText('按 P 继续', canvas.width / 2, canvas.height / 2 + 20);
        }

        if (state.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#e94560';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - 40);

            ctx.fillStyle = '#fff';
            ctx.font = '18px Arial';
            ctx.fillText('最终分数: ' + state.score, canvas.width / 2, canvas.height / 2);

            if (state.score >= state.highScore && state.score > 0) {
                ctx.fillStyle = '#ffd700';
                ctx.font = 'bold 16px Arial';
                ctx.fillText('🎉 新纪录!', canvas.width / 2, canvas.height / 2 + 30);
            }

            ctx.font = '12px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('点击"重新开始"按钮再玩一次', canvas.width / 2, canvas.height / 2 + 60);
        }

        if (!state.running && !state.gameOver && !state.paused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#4ecca3';
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('按任意方向键', canvas.width / 2, canvas.height / 2 - 15);
            ctx.fillText('开始游戏', canvas.width / 2, canvas.height / 2 + 15);
        }
    }

    // ==================== UI 更新 ====================
    function updateUI() {
        document.getElementById('score').textContent = state.score;
        document.getElementById('high-score').textContent = state.highScore;
        document.getElementById('level').textContent = state.level;
        document.getElementById('lines').textContent = state.lines;
    }

    // ==================== 输入处理 ====================
    function bindInput() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                if (state.running || state.paused) {
                    togglePause();
                }
                return;
            }

            // 技能快捷键
            if (e.key >= '1' && e.key <= '4' && state.running && !state.paused && !state.gameOver) {
                const skillKeys = ['slow', 'clear', 'preview', 'rotate'];
                const skillIndex = parseInt(e.key) - 1;
                window.useSkill(skillKeys[skillIndex]);
                render();
                return;
            }

            if (!state.running && !state.gameOver) {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                    startGame();
                }
            }

            if (!state.running || state.paused || state.gameOver) return;

            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    movePiece(1, 0);
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (movePiece(0, 1)) {
                        state.score += 1;
                        updateUI();
                    }
                    break;
                case 'ArrowUp':
                case 'w':
                case 'W':
                    rotatePiece();
                    break;
                case ' ':
                    hardDrop();
                    break;
            }

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }

            render();
        });
    }

    // 移动端控制
    window.changeDirection = function(dir) {
        if (!state.running || state.paused || state.gameOver) {
            if (!state.running && !state.gameOver) startGame();
            return;
        }

        switch (dir) {
            case 'left':
                movePiece(-1, 0);
                break;
            case 'right':
                movePiece(1, 0);
                break;
            case 'down':
                if (movePiece(0, 1)) {
                    state.score += 1;
                    updateUI();
                }
                break;
        }
        render();
    };

    window.rotate = function() {
        if (!state.running || state.paused || state.gameOver) {
            if (!state.running && !state.gameOver) startGame();
            return;
        }
        rotatePiece();
        render();
    };

    window.hardDrop = function() {
        if (!state.running || state.paused || state.gameOver) {
            if (!state.running && !state.gameOver) startGame();
            return;
        }
        hardDrop();
    };

    window.restartGame = function() {
        stopGame();
        state.gameOver = false;
        state.paused = false;
        startGame();
        render();
    };

    // ==================== 初始化 ====================
    function init() {
        loadHighScore();
        initBoard();
        render();
        renderNextPiece();
        bindInput();
    }

    document.addEventListener('DOMContentLoaded', init);

})();
