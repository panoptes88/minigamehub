// 游戏数据配置
const games = [
    {
        id: 'snake',
        title: '贪吃蛇',
        description: '经典贪吃蛇游戏，控制蛇吃到食物并避免撞墙和自身',
        emoji: '🐍',
        tags: ['Canvas', '经典', '简单'],
        path: 'games/snake/',
        status: 'completed'
    },
    {
        id: 'tetris',
        title: '俄罗斯方块',
        description: '经典的俄罗斯方块游戏，旋转、移动方块，消除行数获得高分',
        emoji: '🧩',
        tags: ['Canvas', '益智', '中等'],
        path: 'games/tetris/',
        status: 'completed'
    },
    {
        id: 'breakout',
        title: '打砖块',
        description: '用球拍反弹小球打碎所有砖块，注意不要让球掉落',
        emoji: '🎯',
        tags: ['Canvas', '街机', '简单'],
        path: 'games/breakout/',
        status: 'completed'
    }
];

// 渲染游戏卡片
function renderGames() {
    const container = document.getElementById('games-container');

    games.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';

        const statusText = game.status === 'completed' ? '✅ 已完成' : '🚧 开发中';
        const statusClass = game.status === 'completed' ? 'status-completed' : 'status-developing';

        card.innerHTML = `
            <div class="game-preview">${game.emoji}</div>
            <div class="game-card-content">
                <h3>${game.title}</h3>
                <p>${game.description}</p>
                <div class="tags">
                    ${game.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    <span class="tag ${statusClass}">${statusText}</span>
                </div>
                <a href="${game.path}" class="play-btn">开始游戏 →</a>
            </div>
        `;

        container.appendChild(card);
    });
}

// 页面加载完成后渲染
document.addEventListener('DOMContentLoaded', renderGames);
