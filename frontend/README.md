# ScholarLens

ScholarLens 是一款支持多 AI Provider 的本地学术研究与论文分析工作台。它允许用户上传多篇 Markdown 或 PDF 格式的文献，并利用大语言模型进行深度的“同导师类型”或“同方向论文”分析。

## 🌟 核心特性

- **多 Provider 支持 (BYOK)**：自由切换 Google Vertex AI, Gemini API, OpenAI, DeepSeek, OpenRouter, Anthropic Claude 以及自定义 OpenAI 兼容接口。
- **本地安全架构**：API Key 仅保存在浏览器 `localStorage` 中，通过本地后端代理请求，绝不上传至任何第三方服务器。
- **多模态支持**：原生支持 PDF 解析（依赖于 Vertex AI / Gemini / Anthropic 的视觉/文档能力）。
- **流式输出**：所有 Provider 均支持实时流式打字机效果输出。
- **一键导出**：支持将分析结果导出为 Markdown, TXT 或 PDF。

## 🚀 快速开始

### 1. 安装依赖

项目包含前端和后端两部分，使用 `concurrently` 统一管理。

```bash
# 在项目根目录执行，会自动安装前端和后端的依赖
npm run install:all
```

### 2. 启动项目

```bash
# 一键同时启动前端 (端口 5173) 和后端 (端口 5000)
npm run dev
```

启动后，浏览器访问 `http://localhost:5173` 即可使用。

## ⚙️ AI Provider 配置指南

点击页面右上角的 **⚙️ (Settings)** 图标，选择您想使用的 AI Provider。

### 选项 A: Google Vertex AI (推荐，无需 API Key)
1. 确保您已安装 [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)。
2. 在终端运行并登录您的 Google 账号：
   ```bash
   gcloud auth application-default login
   ```
3. 在 `backend/.env.local` 中配置您的项目信息（可参考 `backend/.env.example`）：
   ```env
   GOOGLE_CLOUD_PROJECT=your-gcp-project-id
   GOOGLE_CLOUD_LOCATION=global
   ```
4. 在前端设置中选择 `Google Vertex AI`，无需填写 API Key。

### 选项 B: 普通 API (Gemini / OpenAI / DeepSeek / Anthropic 等)
1. 在前端设置中选择对应的 Provider。
2. 填写您自己的 **API Key**。
3. （可选）修改 Model ID 或 Base URL。
4. 点击 **Test Connection** 测试连通性，然后保存。

## 🔒 安全与隐私声明 (非常重要)

本项目设计为**本地运行的 BYOK (Bring Your Own Key) 客户端**。为了保护您的资产安全，请严格遵守以下规范：

1. **绝对不要**将真实的 API Key 硬编码到源代码中。
2. **绝对不要**将 `backend/.env.local` 提交到 GitHub。
3. **绝对不要**将 `application_default_credentials.json` 或任何 Service Account JSON 文件放入项目目录并提交。
4. 本项目已配置严格的 `.gitignore`，请勿随意修改或删除忽略规则。

*如果您在之前的提交中不小心泄露了 API Key 或 GCP 凭据，请立即前往对应的云平台控制台吊销/轮换该密钥！*
