# 🔮 人生推测器 | AI Life Path Predictor

一个基于 AI 的人生选择推演工具。输入一个「假如」，AI 将为你推演出未来数十年的人生轨迹。

## ✨ 功能特点

- **AI 智能推测**: 基于 OpenAI GPT-4o 进行专业的人生轨迹推演
- **五维人生指标**: 幸福、财富、健康、人际、事业五个维度的变化曲线
- **时间线事件**: 每年具体的人生事件推演
- **蝴蝶效应分析**: 一个小选择如何引发连锁反应
- **人生三幕**: 早期、中期、后期三个阶段的特征描述
- **挑战与机会**: 潜在的挑战和机会分析
- **精美可视化**: Chart.js 图表 + 粒子动画背景
- **响应式设计**: 完美适配手机和桌面端

## 🚀 快速开始

### 1. 安装依赖
```bash
cd life-predictor
npm install
```

### 2. 配置 API Key（可选）
编辑 `.env` 文件，填入你的 OpenAI API Key：
```
OPENAI_API_KEY=sk-your-api-key-here
```
> 不填写 API Key 也可以运行，将使用演示模式（Demo Mode）生成示例推测

### 3. 启动服务
```bash
npm start
```

### 4. 打开浏览器
访问 http://localhost:3000

## 📸 使用流程

1. 点击「开始推测」进入输入页面
2. 填写你的「假如」选择（例如：假如我辞掉工作去创业...）
3. 拖动滑块选择推测年数（1-30年）
4. 可选：完善年龄、性别、性格等信息以获得更精准的推测
5. 点击「开始推测」等待 AI 分析
6. 查看完整的人生轨迹推演报告

## 🛠 技术栈

- **前端**: HTML5 + CSS3 + Vanilla JavaScript
- **后端**: Node.js + Express
- **AI**: OpenAI GPT-4o API
- **图表**: Chart.js
- **动画**: Canvas 粒子系统

## 📁 项目结构

```
life-predictor/
├── public/
│   ├── index.html      # 主页面
│   ├── style.css       # 样式文件
│   └── app.js          # 前端逻辑
├── server.js           # 后端服务
├── package.json        # 项目配置
├── .env                # 环境变量
└── README.md           # 说明文档
```
