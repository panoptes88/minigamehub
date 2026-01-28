/**
 * 🧩 俄罗斯方块游戏 - 特殊能力+技能+道具版
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

    // 特殊能力颜色池
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

    // 道具定义
    const POWERUPS = {
        EXTEND: { name: '加长', color: '#00ff00', icon: '📏', probability: 0.2 },
        SPEED: { name: '加速', color: '#ff00ff', icon: '⚡', probability: 0.2, duration: 5000 },
        CLEAR: { name: '清行', color: '#ff6600', icon: '🧹', probability: 0.2 },
        COPY: { name: '复制', color: '#00ffff', icon: '📋', probability: 0.2 },
        SHIELD: { name: '护盾', color: '#ffd700', icon: '🛡️', probability: 0.2 }
    };

    const POWERUP_NAMES = Object.keys(POWERUPS);

    // ==================== 物理系统常量 ====================
    const PHYSICS = {
        INERTIA: {
            MOVE_FRICTION: 0.88,      // 移动摩擦系数 (1 = 无摩擦)
            SLIDE_DURATION: 120,      // 滑行持续时间 (ms)
            BOUNCE_DAMPING: 0.3,      // 反弹衰减系数
            BOUNCE_DURATION: 80       // 反弹持续时间 (ms)
        },
        GRAVITY: {
            TOP_ZONE: 0.6,            // 上方区域重力倍率 (下落慢)
            BOTTOM_ZONE: 1.2,         // 下方区域重力倍率 (下落快)
            NORMAL_ZONE: 0.9          // 中间区域重力倍率
        },
        FRICTION: {
            'I': 0.92,                // 青色方块摩擦力
            'O': 0.96,                // 黄色方块摩擦力
            'T': 0.88,                // 紫色方块摩擦力
            'S': 0.90,                // 绿色方块摩擦力
            'Z': 0.90,                // 红色方块摩擦力
            'J': 0.88,                // 蓝色方块摩擦力
            'L': 0.88                 // 橙色方块摩擦力
        }
    };

    // 游戏重力区域划分
    const GRAVITY_ZONES = {
        TOP: { rows: 0, endRow: 5, multiplier: 0.6 },
        MIDDLE: { rows: 6, endRow: 14, multiplier: 0.9 },
        BOTTOM: { rows: 15, endRow: 20, multiplier: 1.2 }
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
        },
        // 道具系统
        powerups: [],           // 下落的道具 [{type, x, y}]
        activeEffects: {        // 激活的道具效果
            speedBoost: { active: false, endTime: 0 },
            shield: false
        },
        powerupInterval: null,  // 道具生成计时器
        baseSpeedMultiplier: 1, // 基础速度倍率
        // 物理系统
        physics: {
            active: true,        // 是否启用物理效果
            keys: {              // 按键状态
                left: false,
                right: false,
                down: false
            },
            lastMoveTime: 0,     // 上次移动时间
            moveDelay: 80        // 移动间隔 (用于惯性)
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
            y: 0,
            blocks: shape.rotations[0].flat().filter(x => x).length,  // 方块数量
            // 物理属性
            vx: 0,                    // 水平速度
            vy: 0,                    // 垂直速度
            friction: PHYSICS.FRICTION[type] || 0.88,  // 摩擦系数
            bouncing: false,          // 是否正在反弹
            bounceDir: 0,             // 反弹方向
            slideEndTime: 0,          // 滑行结束时间
            gravityMultiplier: 1.0    // 当前区域重力倍率
        };
    }

    function extendPiece() {
        // 增加当前方块的方块数量
        if (state.currentPiece && state.currentPiece.blocks < 4) {
            state.currentPiece.blocks++;
            state.score += 25;
            addEffect(state.currentPiece.y, state.currentPiece.x, 'extend');
        }
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

    // ==================== 物理系统 ====================
    function getGravityMultiplier(y) {
        // 根据行数确定区域
        if (y < 6) {
            return PHYSICS.GRAVITY.TOP_ZONE;
        } else if (y < 15) {
            return PHYSICS.GRAVITY.NORMAL_ZONE;
        } else {
            return PHYSICS.GRAVITY.BOTTOM_ZONE;
        }
    }

    function applyMovementForce(direction) {
        const piece = state.currentPiece;
        if (!piece || state.paused || state.gameOver) return;

        // 施加初始速度
        piece.vx = direction * 1.5;
        piece.slideEndTime = performance.now() + PHYSICS.INERTIA.SLIDE_DURATION;
    }

    function startInertiaSlide() {
        const piece = state.currentPiece;
        if (!piece) return;

        // 延长滑行时间
        piece.slideEndTime = performance.now() + PHYSICS.INERTIA.SLIDE_DURATION;
    }

    function updateInertia() {
        const piece = state.currentPiece;
        if (!piece || state.paused || state.gameOver) return;

        const now = performance.now();

        // 检查按键状态，持续移动
        if (state.physics.keys.left) {
            piece.vx = -1.5;
            piece.slideEndTime = now + PHYSICS.INERTIA.SLIDE_DURATION;
        } else if (state.physics.keys.right) {
            piece.vx = 1.5;
            piece.slideEndTime = now + PHYSICS.INERTIA.SLIDE_DURATION;
        } else if (now > piece.slideEndTime) {
            // 滑行结束，应用摩擦力减速
            piece.vx *= PHYSICS.INERTIA.MOVE_FRICTION;
            if (Math.abs(piece.vx) < 0.1) {
                piece.vx = 0;
            }
        }

        // 根据速度移动方块
        if (Math.abs(piece.vx) > 0.1) {
            const dx = Math.round(piece.vx);
            if (isValidPosition(piece, dx, 0)) {
                piece.x += dx;
            } else {
                // 碰撞检测触发弹性反弹
                handleElasticCollision(dx);
            }
        }

        // 更新重力倍率
        piece.gravityMultiplier = getGravityMultiplier(piece.y);
    }

    function handleElasticCollision(dx) {
        const piece = state.currentPiece;
        if (!piece) return;

        // 轻微反弹效果
        piece.bouncing = true;
        piece.bounceDir = dx > 0 ? -1 : 1;

        // 回弹一小步
        const bounceDist = Math.min(Math.abs(dx), 2);
        piece.x += piece.bounceDir * bounceDist;

        // 应用摩擦力减少反弹
        piece.vx *= piece.friction * PHYSICS.INERTIA.BOUNCE_DAMPING;

        // 反弹衰减
        setTimeout(() => {
            if (piece) {
                piece.bouncing = false;
                piece.bounceDir = 0;
            }
        }, PHYSICS.INERTIA.BOUNCE_DURATION);
    }

    function getDropSpeed() {
        if (!state.currentPiece) return LEVEL_SPEED[0];

        let baseSpeed = LEVEL_SPEED[Math.min(state.level - 1, LEVEL_SPEED.length - 1)];

        // 应用重力倍率 (重力越大，下落越快)
        const gravityMult = state.currentPiece.gravityMultiplier || 1;
        baseSpeed = baseSpeed / gravityMult;

        // 技能效果
        if (state.skills.slow.active) {
            baseSpeed *= 2;
        }

        // 道具效果
        if (state.baseSpeedMultiplier < 1) {
            baseSpeed *= state.baseSpeedMultiplier;
        }

        return Math.max(baseSpeed, 30);
    }

    // ==================== 道具系统 ====================
    function spawnPowerup() {
        if (!state.running || state.paused) return;

        const type = POWERUP_NAMES[Math.floor(Math.random() * POWERUP_NAMES.length)];
        const powerup = POWERUPS[type];

        state.powerups.push({
            type: type,
            name: powerup.name,
            color: powerup.color,
            icon: powerup.icon,
            x: Math.floor(Math.random() * (COLS - 2)) + 1,
            y: 0
        });
    }

    function updatePowerups() {
        const toRemove = [];
        const toAdd = [];

        state.powerups.forEach((powerup, index) => {
            powerup.y++;

            // 检测是否到达底部或碰撞方块
            let shouldRemove = false;
            if (powerup.y >= ROWS) {
                shouldRemove = true;
            } else if (state.board[powerup.y][powerup.x]) {
                shouldRemove = true;
                // 触发道具效果
                activatePowerup(powerup);
            }

            if (shouldRemove) {
                toRemove.push(index);
            }
        });

        // 移除已触发的道具
        toRemove.reverse().forEach(index => {
            state.powerups.splice(index, 1);
        });
    }

    function activatePowerup(powerup) {
        const type = powerup.type;
        const powerupData = POWERUPS[type];

        addEffect(powerup.y, powerup.x, 'powerup');

        switch (type) {
            case 'EXTEND':
                // 加长道具: 当前方块长度+1
                extendPiece();
                showPowerupMessage('📏 方块变长!');
                break;

            case 'SPEED':
                // 加速道具: 下落速度临时增加
                state.baseSpeedMultiplier = 0.4;
                state.activeEffects.speedBoost.active = true;
                state.activeEffects.speedBoost.endTime = Date.now() + powerupData.duration;
                showPowerupMessage('⚡ 加速中!');
                resetDropInterval();

                setTimeout(() => {
                    state.baseSpeedMultiplier = 1;
                    state.activeEffects.speedBoost.active = false;
                    resetDropInterval();
                }, powerupData.duration);
                break;

            case 'CLEAR':
                // 清行道具: 随机消除一行
                const rowsWithBlocks = [];
                for (let row = 0; row < ROWS; row++) {
                    let hasBlock = false;
                    for (let col = 0; col < COLS; col++) {
                        if (state.board[row][col]) {
                            hasBlock = true;
                            break;
                        }
                    }
                    if (hasBlock) rowsWithBlocks.push(row);
                }

                if (rowsWithBlocks.length > 0) {
                    const targetRow = rowsWithBlocks[Math.floor(Math.random() * rowsWithBlocks.length)];
                    for (let col = 0; col < COLS; col++) {
                        addEffect(targetRow, col, 'explosion');
                        state.board[targetRow][col] = null;
                    }
                    applyGravity();
                    state.score += 30;
                    state.lines++;
                    showPowerupMessage('🧹 清除一行!');
                }
                break;

            case 'COPY':
                // 复制道具: 复制当前方块（额外加一个方块）
                if (state.currentPiece) {
                    state.currentPiece.blocks++;
                    state.score += 50;
                    showPowerupMessage('📋 方块复制!');
                }
                break;

            case 'SHIELD':
                // 护盾道具: 防止一次游戏结束
                state.activeEffects.shield = true;
                showPowerupMessage('🛡️ 护盾激活!');
                break;
        }

        updatePowerupUI();
    }

    function showPowerupMessage(text) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: #4ecca3;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 1000;
            animation: messagePopup 1s ease-out forwards;
        `;
        overlay.textContent = text;
        document.body.appendChild(overlay);

        setTimeout(() => overlay.remove(), 1000);
    }

    function startPowerupSpawner() {
        // 每8-15秒生成一个道具
        const randomTime = 8000 + Math.random() * 7000;
        state.powerupInterval = setTimeout(() => {
            spawnPowerup();
            startPowerupSpawner();
        }, randomTime);
    }

    function stopPowerupSpawner() {
        if (state.powerupInterval) {
            clearTimeout(state.powerupInterval);
            state.powerupInterval = null;
        }
    }

    function updatePowerupUI() {
        const effects = state.activeEffects;
        const icons = [];

        if (effects.speedBoost.active) {
            icons.push('⚡ 加速');
        }
        if (effects.shield) {
            icons.push('🛡️ 护盾');
        }

        // 可以添加一个UI元素来显示当前激活的道具效果
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

        document.getElementById('energy-bar').style.width = (energy / state.energyMax * 100) + '%';
        document.getElementById('energy-text').textContent = Math.floor(energy) + ' / ' + state.energyMax;

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

    function useSkillSlow() {
        if (state.energy < SKILLS.SLOW.cost) return false;
        if (state.skills.slow.active) return false;

        state.energy -= SKILLS.SLOW.cost;
        state.skills.slow.active = true;
        state.skills.slow.endTime = Date.now() + SKILLS.SLOW.duration;

        updateSkillsUI();
        resetDropInterval();

        setTimeout(() => {
            state.skills.slow.active = false;
            updateSkillsUI();
            resetDropInterval();
        }, SKILLS.SLOW.duration);

        return true;
    }

    function useSkillClear() {
        if (state.energy < SKILLS.CLEAR.cost) return false;
        if (!state.skills.clear.available) return false;

        state.energy -= SKILLS.CLEAR.cost;

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
            for (let col = 0; col < COLS; col++) {
                addEffect(targetRow, col, 'explosion');
                state.board[targetRow][col] = null;
            }
            applyGravity();
            state.score += 50;
            state.lines++;
        }

        updateSkillsUI();
        render();

        return true;
    }

    function useSkillPreview() {
        if (state.energy < SKILLS.PREVIEW.cost) return false;
        if (state.skills.preview.active) return false;

        state.energy -= SKILLS.PREVIEW.cost;
        state.skills.preview.active = true;
        state.skills.preview.endTime = Date.now() + SKILLS.PREVIEW.duration;

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

    function useSkillRotate() {
        if (state.energy < SKILLS.ROTATE.cost) return false;
        if (!state.skills.rotate.available || state.skills.rotate.rotating) return false;

        state.energy -= SKILLS.ROTATE.cost;
        state.skills.rotate.rotating = true;
        updateSkillsUI();

        const wrapper = document.querySelector('.game-board-wrapper');
        wrapper.classList.add('rotated');

        const newBoard = [];
        for (let col = 0; col < ROWS; col++) {
            newBoard[col] = [];
            for (let row = COLS - 1; row >= 0; row--) {
                newBoard[col].push(state.board[row][col]);
            }
        }
        state.board = newBoard;

        setTimeout(() => {
            wrapper.classList.remove('rotated');
            state.skills.rotate.rotating = false;
            state.skills.rotate.available = false;
            updateSkillsUI();
            render();
        }, 500);

        return true;
    }

    window.useSkill = function(skillName) {
        if (!state.running || state.paused || state.gameOver) return;

        switch (skillName) {
            case 'slow': useSkillSlow(); break;
            case 'clear': useSkillClear(); break;
            case 'preview': useSkillPreview(); break;
            case 'rotate': useSkillRotate(); break;
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
                        // 检查护盾
                        if (state.activeEffects.shield) {
                            state.activeEffects.shield = false;
                            // 将方块移到顶部
                            piece.y = -shape.length + 1;
                            // 重新放置
                            for (let r = 0; r < shape.length; r++) {
                                for (let c = 0; c < shape[r].length; c++) {
                                    if (shape[r][c]) {
                                        state.board[piece.y + r][piece.x + c] = {
                                            color: piece.baseColor || piece.color,
                                            special: piece.special
                                        };
                                    }
                                }
                            }
                            showPowerupMessage('🛡️ 护盾生效!');
                            updatePowerupUI();
                            spawnNextPiece();
                            return;
                        }
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

        if (piece.special === 'COLORFUL' || piece.special === 'MAGNETIC' || piece.special === 'SPLIT') {
            processSpecialEffects();
        }

        clearLines();
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
                energyGained += 5;

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

        // 初始化新方块的物理属性
        if (state.currentPiece) {
            state.currentPiece.vx = 0;
            state.currentPiece.vy = 0;
            state.currentPiece.friction = PHYSICS.FRICTION[state.currentPiece.type] || 0.88;
            state.currentPiece.bouncing = false;
            state.currentPiece.bounceDir = 0;
            state.currentPiece.slideEndTime = 0;
            state.currentPiece.gravityMultiplier = getGravityMultiplier(state.currentPiece.y);
        }

        state.futurePieces.push(createRandomPiece());
        if (state.futurePieces.length > 3) {
            state.futurePieces.shift();
        }

        if (!isValidPosition(state.currentPiece)) {
            // 检查护盾
            if (state.activeEffects.shield) {
                state.activeEffects.shield = false;
                state.board = [];
                initBoard();
                showPowerupMessage('🛡️ 护盾生效!');
                updatePowerupUI();
                spawnNextPiece();
                return;
            }
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
        state.powerups = [];
        state.baseSpeedMultiplier = 1;
        state.activeEffects = {
            speedBoost: { active: false, endTime: 0 },
            shield: false
        };
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
        updatePowerupUI();
        spawnNextPiece();

        state.running = true;
        state.lastDropTime = performance.now();
        resetDropInterval();
        startPowerupSpawner();
    }

    function stopGame() {
        state.running = false;
        stopPowerupSpawner();
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
            // 使用物理重力系统计算速度
            const speed = getDropSpeed();
            state.dropInterval = setTimeout(() => dropPiece(), speed);
        }
    }

    function dropPiece() {
        if (!state.running || state.paused || state.gameOver) return;

        // 更新物理效果 (惯性滑行和重力)
        updateInertia();

        // 更新道具位置
        updatePowerups();

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
            startPowerupSpawner();
        }

        render();
    }

    // ==================== 渲染 ====================
    function render() {
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制重力区域指示
        drawGravityZones();

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

        // 绘制道具
        state.powerups.forEach(powerup => {
            drawPowerup(powerup);
        });

        // 绘制当前方块
        if (state.currentPiece && !state.gameOver) {
            const piece = state.currentPiece;
            const shape = piece.shape;

            // 绘制运动轨迹残影 (惯性滑行效果)
            if (piece.sliding && Math.abs(piece.vx) > 0.5) {
                drawMotionTrail(piece);
            }

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

            // 绘制反弹效果
            if (piece.bouncing) {
                drawBounceEffect(piece);
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

        // 加速效果
        if (state.activeEffects.speedBoost.active) {
            ctx.fillStyle = 'rgba(255, 0, 255, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(255, 0, 255, 0.5)';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'right';
            ctx.fillText('⚡ 加速中!', canvas.width - 10, 20);
        }

        // 护盾效果
        if (state.activeEffects.shield) {
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.lineWidth = 3;
            ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
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

    function drawPowerup(powerup) {
        const x = powerup.x * BLOCK_SIZE;
        const y = powerup.y * BLOCK_SIZE;
        const size = BLOCK_SIZE;

        // 发光效果
        ctx.shadowColor = powerup.color;
        ctx.shadowBlur = 15;

        ctx.fillStyle = powerup.color;
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // 道具图标
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(powerup.icon, x + size / 2, y + size / 2);
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

    // ==================== 物理效果绘制 ====================
    function drawGravityZones() {
        // 上方区域 - 浅蓝色 (下落慢)
        ctx.fillStyle = 'rgba(100, 200, 255, 0.08)';
        ctx.fillRect(0, 0, canvas.width, 6 * BLOCK_SIZE);

        // 中间区域 - 浅绿色 (正常)
        ctx.fillStyle = 'rgba(100, 255, 100, 0.05)';
        ctx.fillRect(0, 6 * BLOCK_SIZE, canvas.width, 9 * BLOCK_SIZE);

        // 下方区域 - 橙色 (下落快)
        ctx.fillStyle = 'rgba(255, 150, 0, 0.08)';
        ctx.fillRect(0, 15 * BLOCK_SIZE, canvas.width, 5 * BLOCK_SIZE);
    }

    function drawMotionTrail(piece) {
        // 绘制运动轨迹残影
        ctx.globalAlpha = 0.25;
        const shape = piece.shape;
        const direction = Math.sign(piece.vx);

        for (let i = 1; i <= 3; i++) {
            const trailOffset = direction * i * 2;
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        const x = piece.x + col + trailOffset;
                        const y = piece.y + row;
                        if (x >= 0 && x < COLS) {
                            ctx.fillStyle = piece.color;
                            ctx.fillRect(
                                x * BLOCK_SIZE + 2,
                                y * BLOCK_SIZE + 2,
                                BLOCK_SIZE - 4,
                                BLOCK_SIZE - 4
                            );
                        }
                    }
                }
            }
        }
        ctx.globalAlpha = 1;
    }

    function drawBounceEffect(piece) {
        // 绘制反弹时的震动效果
        const bounceOffset = piece.bounceDir * 2;
        ctx.save();
        ctx.translate(bounceOffset, 0);

        // 绘制反弹边框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        const shape = piece.shape;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    ctx.strokeRect(
                        (piece.x + col) * BLOCK_SIZE + 1,
                        (piece.y + row) * BLOCK_SIZE + 1,
                        BLOCK_SIZE - 2,
                        BLOCK_SIZE - 2
                    );
                }
            }
        }
        ctx.restore();
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
                case 'powerup':
                    ctx.fillStyle = '#ffd700';
                    ctx.beginPath();
                    ctx.arc(x, y, BLOCK_SIZE * (1 - alpha), 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'extend':
                    ctx.strokeStyle = '#00ff00';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(x, y, BLOCK_SIZE * (1 - alpha + 0.3), 0, Math.PI * 2);
                    ctx.stroke();
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

            // 物理输入系统 - 按下时施加力
            switch (e.key) {
                case 'ArrowLeft': case 'a': case 'A':
                    state.physics.keys.left = true;
                    applyMovementForce(-1);
                    break;
                case 'ArrowRight': case 'd': case 'D':
                    state.physics.keys.right = true;
                    applyMovementForce(1);
                    break;
                case 'ArrowDown': case 's': case 'S':
                    state.physics.keys.down = true;
                    if (movePiece(0, 1)) {
                        state.score += 1;
                        updateUI();
                    }
                    break;
                case 'ArrowUp': case 'w': case 'W': rotatePiece(); break;
                case ' ': hardDrop(); break;
            }

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }

            render();
        });

        // 按键释放 - 结束持续移动，开始惯性滑行
        document.addEventListener('keyup', (e) => {
            switch (e.key) {
                case 'ArrowLeft': case 'a': case 'A':
                    state.physics.keys.left = false;
                    startInertiaSlide();
                    break;
                case 'ArrowRight': case 'd': case 'D':
                    state.physics.keys.right = false;
                    startInertiaSlide();
                    break;
                case 'ArrowDown': case 's': case 'S':
                    state.physics.keys.down = false;
                    break;
            }
        });
    }

    window.changeDirection = function(dir) {
        if (!state.running || state.paused || state.gameOver) {
            if (!state.running && !state.gameOver) startGame();
            return;
        }
        switch (dir) {
            case 'left': movePiece(-1, 0); break;
            case 'right': movePiece(1, 0); break;
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

    function init() {
        loadHighScore();
        initBoard();
        render();
        renderNextPiece();
        bindInput();
    }

    document.addEventListener('DOMContentLoaded', init);

})();
