# AI-Nodes-agent

AI 笔记分析智能体 —— 基于 Next.js 的智能笔记管理与分析平台。

> 本项目基于 Apache License 2.0 开源，详见 [LICENSE](LICENSE)。Copyright 2026 WXL8000。

## 环境要求

| 工具 | 最低版本 | 说明 |
|------|---------|------|
| Node.js | >= 24.0.0 | 推荐使用 [nvm](https://github.com/nvm-sh/nvm) 管理版本 |
| npm | >= 10.0.0 | 随 Node.js 一起安装 |

> 项目根目录包含 `.nvmrc` 和 `.node-version` 文件，nvm / nodenv / fnm 等版本管理工具可自动识别。

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/WXL8000/AI-nodes-agent.git
cd AI-Nodes-agent
```

### 2. 安装 Node.js 版本

**方式 A：使用 nvm（推荐）**

```bash
# Windows (nvm-windows)
nvm install
nvm use

# macOS / Linux
nvm install
nvm use
```

**方式 B：使用 fnm**

```bash
fnm install
fnm use
```

**方式 C：手动安装**

前往 [Node.js 官网](https://nodejs.org/) 下载 v24.x 或更高版本安装。

### 3. 安装项目依赖

```bash
npm ci
```

> `npm ci` 会根据 `package-lock.json` 精确安装依赖，确保与团队其他成员环境一致。
> 如果 `npm ci` 失败，可先运行 `rm -rf node_modules package-lock.json` 后执行 `npm install`，但请记得提交更新后的 `package-lock.json`。

### 4. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.local
```

然后编辑 `.env.local`，填入所需的 API 密钥和数据库连接信息。

### 5. 启动开发服务器

```bash
npm run dev
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass;npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 常用命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

## 项目结构

```
src/
├── app/              # Next.js App Router 页面和 API 路由
│   ├── api/          # 后端 API 接口
│   ├── analysis/     # 分析页面
│   ├── notes/        # 笔记页面
│   ├── thinking/     # 思考页面
│   ├── recommend/    # 推荐页面
│   └── output/       # 输出页面
├── components/       # React 组件
│   ├── charts/       # 图表组件
│   ├── layout/       # 布局组件
│   └── ui/           # UI 基础组件
├── lib/              # 工具库
│   ├── ai/           # AI 客户端
│   ├── supabase/     # 数据库客户端
│   ├── mock/         # 模拟数据
│   └── utils/        # 通用工具
└── types/            # TypeScript 类型定义
```

## 技术栈

- **前端框架**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS 4, Framer Motion
- **数据库**: Supabase
- **AI**: OpenAI SDK
- **图表**: ECharts, @xyflow/react
- **语言**: TypeScript 5

## 部署

项目支持部署到 [Vercel](https://vercel.com)，详见 [Next.js 部署文档](https://nextjs.org/docs/app/building-your-application/deploying)。

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE).

Copyright 2026 WXL8000. This product includes third-party components listed in [NOTICE](NOTICE).
