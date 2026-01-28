/**
 * 🐍 贪吃蛇游戏
 */

(function() {
    'use strict';

    // ==================== 配置 ====================
    const CONFIG = {
        gridSize: 20,          // 格子大小
        gridCount: 20,         // 格子数量 (20x20 = 400)
        baseSpeed: 150,        // 基础速度 (ms/帧)
        speedIncrease: 2,      // 每次吃完食物速度增加
        maxSpeed: 50           // 最大速度 (最小间隔)
    };

    // ==================== 游戏状态 ====================
    const state = {
        score: 0,
        highScore: 0,
        speed: 1,
        running: false,
        paused: false,
        gameOver: false
    };

    // ==================== 游戏实体 ====================
    let snake = [];
    let food = { x: 0, y: 0 };
    let direction = 'right';
    let nextDirection = 'right';
    let gameInterval = null;

    // ==================== Canvas 设置 ====================
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const gridSize = CONFIG.gridSize;
    const gridCount = CONFIG.gridCount;

    // ==================== 本地存储 ====================
    function loadHighScore() {
        const saved = localStorage.getItem('snake-high-score');
        if (saved) {
            state.highScore = parseInt(saved, 10);
            document.getElementById('high-score').textContent = state.highScore;
        }
    }

    function saveHighScore() {
        localStorage.setItem('snake-high-score', state.highScore.toString());
    }

    // ==================== 初始化 ====================
    function init() {
        loadHighScore();
        resetGame();
        render();

        // 绑定输入事件
        bindInput();
    }

    function resetGame() {
        // 初始化蛇 - 从中间开始
        const startX = Math.floor(gridCount / 2);
        const startY = Math.floor(gridCount / 2);
        snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];

        direction = 'right';
        nextDirection = 'right';
        state.score = 0;
        state.speed = 1;
        state.gameOver = false;
        state.paused = false;

        spawnFood();
        updateUI();
    }

    // ==================== 食物生成 ====================
    function spawnFood() {
        let valid = false;
        while (!valid) {
            food.x = Math.floor(Math.random() * gridCount);
            food.y = Math.floor(Math.random() * gridCount);

            // 确保食物不在蛇身上
            valid = !snake.some(segment => segment.x === food.x && segment.y === food.y);
        }
    }

    // ==================== 输入处理 ====================
    const keys = {};

    function bindInput() {
        document.addEventListener('keydown', (e) => {
            keys[e.key] = true;

            // 暂停/继续
            if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && !state.gameOver) {
                togglePause();
            }

            // 方向控制
            if (!state.paused && !state.gameOver) {
                switch (e.key) {
                    case 'ArrowUp':
                    case 'w':
                    case 'W':
                        if (direction !== 'down') nextDirection = 'up';
                        e.preventDefault();
                        break;
                    case 'ArrowDown':
                    case 's':
                    case 'S':
                        if (direction !== 'up') nextDirection = 'down';
                        e.preventDefault();
                        break;
                    case 'ArrowLeft':
                    case 'a':
                    case 'A':
                        if (direction !== 'right') nextDirection = 'left';
                        e.preventDefault();
                        break;
                    case 'ArrowRight':
                    case 'd':
                    case 'D':
                        if (direction !== 'left') nextDirection = 'right';
                        e.preventDefault();
                        break;
                }
            }

            // 防止方向键滚动页面
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });
    }

    // 移动端方向控制
    window.changeDirection = function(dir) {
        if (state.paused || state.gameOver || !state.running) return;

        switch (dir) {
            case 'up':
                if (direction !== 'down') nextDirection = 'up';
                break;
            case 'down':
                if (direction !== 'up') nextDirection = 'down';
                break;
            case 'left':
                if (direction !== 'right') nextDirection = 'left';
                break;
            case 'right':
                if (direction !== 'left') nextDirection = 'right';
                break;
        }
    };

    // ==================== 游戏循环 ====================
    function start() {
        if (state.running) return;
        state.running = true;
        state.paused = false;

        const speed = Math.max(CONFIG.maxSpeed, CONFIG.baseSpeed - (state.speed - 1) * CONFIG.speedIncrease);
        gameInterval = setInterval(gameLoop, speed);
    }

    function stop() {
        state.running = false;
        if (gameInterval) {
            clearInterval(gameInterval);
            gameInterval = null;
        }
    }

    function togglePause() {
        if (state.gameOver) return;

        state.paused = !state.paused;

        if (state.paused) {
            stop();
        } else {
            const speed = Math.max(CONFIG.maxSpeed, CONFIG.baseSpeed - (state.speed - 1) * CONFIG.speedIncrease);
            gameInterval = setInterval(gameLoop, speed);
        }

        render();
    }

    function gameLoop() {
        update();
        render();
    }

    // ==================== 更新 ====================
    function update() {
        if (state.paused || state.gameOver) return;

        // 更新方向
        direction = nextDirection;

        // 计算新头部位置
        const head = snake[0];
        let newHead = { x: head.x, y: head.y };

        switch (direction) {
            case 'up': newHead.y--; break;
            case 'down': newHead.y++; break;
            case 'left': newHead.x--; break;
            case 'right': newHead.x++; break;
        }

        // 检测碰撞 - 墙壁
        if (newHead.x < 0 || newHead.x >= gridCount || newHead.y < 0 || newHead.y >= gridCount) {
            gameOver();
            return;
        }

        // 检测碰撞 - 自身
        if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
            gameOver();
            return;
        }

        // 移动蛇
        snake.unshift(newHead);

        // 检测是否吃到食物
        if (newHead.x === food.x && newHead.y === food.y) {
            // 吃到食物
            state.score += 10 * state.speed;
            state.speed = Math.min(10, Math.floor(state.score / 50) + 1);

            // 更新最高分
            if (state.score > state.highScore) {
                state.highScore = state.score;
                saveHighScore();
            }

            spawnFood();
            updateUI();

            // 重新设置速度
            stop();
            const speed = Math.max(CONFIG.maxSpeed, CONFIG.baseSpeed - (state.speed - 1) * CONFIG.speedIncrease);
            gameInterval = setInterval(gameLoop, speed);
        } else {
            // 没吃到食物，移除尾部
            snake.pop();
        }
    }

    // ==================== 游戏结束 ====================
    function gameOver() {
        state.gameOver = true;
        state.running = false;
        stop();
        render();
    }

    // ==================== 渲染 ====================
    function render() {
        // 清空画布
        ctx.fillStyle = '#0f0f23';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制网格 (可选，淡淡的)
        ctx.strokeStyle = '#1a1a3e';
        ctx.lineWidth = 1;
        for (let i = 0; i <= gridCount; i++) {
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(canvas.width, i * gridSize);
            ctx.stroke();
        }

        // 绘制食物
        drawFood();

        // 绘制蛇
        drawSnake();

        // 绘制 UI 覆盖层
        drawOverlay();
    }

    function drawFood() {
        const x = food.x * gridSize;
        const y = food.y * gridSize;
        const padding = 2;

        // 食物光晕
        ctx.shadowColor = '#ff6b6b';
        ctx.shadowBlur = 10;

        // 食物主体
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(x + gridSize / 2, y + gridSize / 2, gridSize / 2 - padding, 0, Math.PI * 2);
        ctx.fill();

        // 食物高光
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(x + gridSize / 2 - 3, y + gridSize / 2 - 3, gridSize / 4, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawSnake() {
        snake.forEach((segment, index) => {
            const x = segment.x * gridSize;
            const y = segment.y * gridSize;
            const padding = 1;

            // 头部颜色不同
            if (index === 0) {
                ctx.fillStyle = '#4ecca3';
                ctx.shadowColor = '#4ecca3';
                ctx.shadowBlur = 10;
            } else {
                // 渐变效果
                const alpha = 1 - (index / snake.length) * 0.5;
                ctx.fillStyle = `rgba(78, 204, 163, ${alpha})`;
                ctx.shadowBlur = 0;
            }

            // 圆角矩形
            const radius = 4;
            ctx.beginPath();
            ctx.roundRect(x + padding, y + padding, gridSize - padding * 2, gridSize - padding * 2, radius);
            ctx.fill();

            // 眼睛 (头部)
            if (index === 0) {
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#1a1a2e';
                const eyeSize = 3;
                const eyeOffset = 5;

                let eye1X, eye1Y, eye2X, eye2Y;
                const centerX = x + gridSize / 2;
                const centerY = y + gridSize / 2;

                switch (direction) {
                    case 'up':
                        eye1X = centerX - eyeOffset;
                        eye1Y = centerY - eyeOffset;
                        eye2X = centerX + eyeOffset;
                        eye2Y = centerY - eyeOffset;
                        break;
                    case 'down':
                        eye1X = centerX - eyeOffset;
                        eye1Y = centerY + eyeOffset;
                        eye2X = centerX + eyeOffset;
                        eye2Y = centerY + eyeOffset;
                        break;
                    case 'left':
                        eye1X = centerX - eyeOffset;
                        eye1Y = centerY - eyeOffset;
                        eye2X = centerX - eyeOffset;
                        eye2Y = centerY + eyeOffset;
                        break;
                    case 'right':
                        eye1X = centerX + eyeOffset;
                        eye1Y = centerY - eyeOffset;
                        eye2X = centerX + eyeOffset;
                        eye2Y = centerY + eyeOffset;
                        break;
                }

                ctx.beginPath();
                ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    function drawOverlay() {
        // 暂停覆盖层
        if (state.paused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('已暂停', canvas.width / 2, canvas.height / 2 - 20);

            ctx.font = '16px Arial';
            ctx.fillText('按 P 继续', canvas.width / 2, canvas.height / 2 + 25);
        }

        // 游戏结束覆盖层
        if (state.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#ff6b6b';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - 40);

            ctx.fillStyle = '#fff';
            ctx.font = '22px Arial';
            ctx.fillText('最终分数: ' + state.score, canvas.width / 2, canvas.height / 2 + 5);

            if (state.score >= state.highScore && state.score > 0) {
                ctx.fillStyle = '#ffd700';
                ctx.font = 'bold 18px Arial';
                ctx.fillText('🎉 新纪录!', canvas.width / 2, canvas.height / 2 + 35);
            }

            ctx.fillStyle = '#aaa';
            ctx.font = '14px Arial';
            ctx.fillText('点击"重新开始"按钮再玩一次', canvas.width / 2, canvas.height / 2 + 70);
        }

        // 开始提示
        if (!state.running && !state.gameOver && !state.paused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#4ecca3';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('按任意方向键', canvas.width / 2, canvas.height / 2 - 15);
            ctx.fillText('开始游戏', canvas.width / 2, canvas.height / 2 + 20);
        }
    }

    // ==================== UI 更新 ====================
    function updateUI() {
        document.getElementById('score').textContent = state.score;
        document.getElementById('high-score').textContent = state.highScore;
        document.getElementById('speed').textContent = state.speed + 'x';
    }

    // ==================== 游戏控制 ====================
    window.restartGame = function() {
        resetGame();
        render();
        start();
    };

    // ==================== 启动 ====================
    document.addEventListener('DOMContentLoaded', init);

})();
