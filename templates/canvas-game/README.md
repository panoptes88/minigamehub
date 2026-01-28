# Canvas 游戏模板

基于 Canvas API 的游戏模板，提供完整的游戏循环和渲染系统。

## 特性

- 基于 requestAnimationFrame 的游戏循环
- 完整的 Canvas 渲染系统
- 键盘输入处理
- 暂停/继续功能
- 游戏状态管理

## 文件结构

```
canvas-game/
├── index.html   # 游戏主页面
├── game.js      # 游戏逻辑
├── style.css    # 样式文件
└── README.md    # 本文件
```

## 快速开始

1. 复制模板到 games 目录
2. 修改 `index.html` 中的游戏标题
3. 在 `game.js` 中实现游戏逻辑

## 游戏控制

- 方向键 / WASD：移动
- P / Esc：暂停/继续
- 重新开始按钮：重置游戏

## 核心函数

| 函数 | 说明 |
|------|------|
| `init()` | 初始化游戏 |
| `start()` | 开始游戏 |
| `stop()` | 停止游戏 |
| `restart()` | 重新开始 |
| `update(deltaTime)` | 更新游戏状态 |
| `render()` | 渲染画面 |
