/**
 * Canvas 游戏模板 - 游戏逻辑
 */

(function() {
    'use strict';

    // ==================== 配置 ====================
    const CONFIG = {
        width: 480,
        height: 360,
        fps: 60
    };

    // ==================== 游戏状态 ====================
    const state = {
        score: 0,
        running: false,
        paused: false,
        gameOver: false
    };

    // ==================== Canvas 设置 ====================
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = CONFIG.width;
    canvas.height = CONFIG.height;

    // ==================== 游戏实体 ====================
    let entities = {};

    // ==================== 初始化 ====================
    function init() {
        console.log('游戏初始化');

        // 初始化游戏实体
        entities = {
            player: createPlayer(),
            // 添加其他实体
        };

        // 绑定输入事件
        bindInput();

        // 绘制初始画面
        render();
    }

    // 创建玩家
    function createPlayer() {
        return {
            x: CONFIG.width / 2,
            y: CONFIG.height / 2,
            width: 30,
            height: 30,
            speed: 5,
            color: '#667eea'
        };
    }

    // ==================== 输入处理 ====================
    const keys = {};

    function bindInput() {
        document.addEventListener('keydown', (e) => {
            keys[e.key] = true;

            // 暂停/继续
            if (e.key === 'Escape' || e.key === 'p') {
                togglePause();
            }

            // 防止方向键滚动页面
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            keys[e.key] = false;
        });
    }

    // ==================== 游戏循环 ====================
    let lastTime = 0;
    const frameInterval = 1000 / CONFIG.fps;

    function gameLoop(timestamp) {
        if (!state.running) return;

        const deltaTime = timestamp - lastTime;

        if (deltaTime >= frameInterval) {
            lastTime = timestamp - (deltaTime % frameInterval);
            update(deltaTime);
            render();
        }

        requestAnimationFrame(gameLoop);
    }

    // ==================== 更新 ====================
    function update(deltaTime) {
        if (state.paused || state.gameOver) return;

        // 更新玩家位置
        updatePlayer();

        // 检测碰撞
        checkCollisions();

        // 更新其他实体
        // updateEntities();
    }

    function updatePlayer() {
        const player = entities.player;

        if (keys['ArrowLeft'] || keys['a']) {
            player.x -= player.speed;
        }
        if (keys['ArrowRight'] || keys['d']) {
            player.x += player.speed;
        }
        if (keys['ArrowUp'] || keys['w']) {
            player.y -= player.speed;
        }
        if (keys['ArrowDown'] || keys['s']) {
            player.y += player.speed;
        }

        // 边界限制
        player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
        player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
    }

    // ==================== 碰撞检测 ====================
    function checkCollisions() {
        // 在这里实现碰撞检测
    }

    // ==================== 渲染 ====================
    function render() {
        // 清空画布
        ctx.fillStyle = '#0f0f23';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制玩家
        drawPlayer();

        // 绘制其他实体
        // drawEntities();

        // 绘制 UI
        drawUI();
    }

    function drawPlayer() {
        const player = entities.player;
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    function drawUI() {
        // 绘制分数
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('分数: ' + state.score, 15, 30);

        // 暂停状态
        if (state.paused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('暂停', canvas.width / 2, canvas.height / 2);
            ctx.font = '16px Arial';
            ctx.fillText('按 P 继续', canvas.width / 2, canvas.height / 2 + 30);
        }

        // 游戏结束
        if (state.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#ff6b6b';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - 20);

            ctx.fillStyle = '#fff';
            ctx.font = '20px Arial';
            ctx.fillText('最终分数: ' + state.score, canvas.width / 2, canvas.height / 2 + 20);

            ctx.font = '16px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('点击"重新开始"按钮再玩一次', canvas.width / 2, canvas.height / 2 + 60);
        }
    }

    // ==================== 游戏控制 ====================
    function start() {
        if (state.running) return;
        state.running = true;
        state.paused = false;
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }

    function stop() {
        state.running = false;
    }

    function togglePause() {
        if (state.gameOver) return;
        state.paused = !state.paused;
        if (!state.paused) {
            lastTime = performance.now();
        }
        render();
    }

    function restart() {
        state.score = 0;
        state.gameOver = false;
        state.paused = false;
        entities.player = createPlayer();
        updateScoreDisplay();
        render();
        start();
    }

    function updateScoreDisplay() {
        document.getElementById('score').textContent = state.score;
    }

    // 暴露给全局
    window.restartGame = restart;

    // ==================== 启动 ====================
    document.addEventListener('DOMContentLoaded', init);

})();
