# ScholarLens

ScholarLens 是一个用于**多篇学术论文联合分析**的 AI 学术研究工具。

支持上传 Markdown、TXT、PDF 等文献，并调用不同 AI Provider，对论文进行课题组分析、研究方向分析和深度总结。

## 功能

* 多篇论文联合分析
* 同导师 / 同课题组研究分析
* 同研究方向论文分析
* Markdown 与 LaTeX 公式渲染
* 流式输出
* Markdown / TXT / PDF 导出
* BYOK：使用自己的 API Key
* 支持多个 AI Provider

目前支持：

* Google Gemini
* Google Vertex AI
* OpenAI
* DeepSeek
* OpenRouter
* Anthropic Claude
* 自定义 OpenAI Compatible API

---

## 在线使用

直接打开 ScholarLens：

https://kekeyo.github.io/readyscholarlens/

对于 Gemini、OpenAI、DeepSeek、OpenRouter 等 Provider，只需要在右上角设置中填写自己的：

* API Key
* Model
* Base URL（如需要）

即可使用。

API Key 由用户自己提供，ScholarLens 不提供公共 API Key。

---

## Vertex AI

Vertex AI 与普通 API Key 模式不同。

Vertex AI 使用 Google Cloud 的 **Application Default Credentials（ADC）** 进行身份认证，而浏览器无法直接读取用户电脑上的 ADC。

因此：

> 使用 Vertex AI 时，需要在本地运行 ScholarLens。

其他普通 API Provider 不需要执行这一步。

### 1. 配置 Google Cloud ADC

安装 Google Cloud CLI 后执行：

```bash
gcloud auth application-default login
```

然后准备自己的 Google Cloud Project。

---

### 2. 配置环境变量

复制：

```text
backend/.env.example
```

为：

```text
backend/.env.local
```

至少填写：

```env
GOOGLE_CLOUD_PROJECT=你的Project ID
GOOGLE_CLOUD_LOCATION=global
```

---

### 3. 安装依赖

在项目根目录执行：

```bash
npm install
```

---

### 4. 本地启动

执行：

```bash
npm run dev
```

然后打开：

```text
http://localhost:5173/
```

即可使用本地版 ScholarLens。

---

## 如果使用代理

部分网络环境下，Node.js 可能无法直接访问 Google OAuth / Vertex AI。

例如使用 Clash，且本地代理端口为：

```text
127.0.0.1:7890
```

可以在启动前设置：

```powershell
$env:HTTP_PROXY="http://127.0.0.1:7890"
$env:HTTPS_PROXY="http://127.0.0.1:7890"
$env:NO_PROXY="localhost,127.0.0.1"
$env:NODE_USE_ENV_PROXY="1"

npm run dev
```

代理端口请根据自己的代理软件设置修改。

---

## 文件支持

| Provider   | Markdown / TXT | PDF           |
| ---------- | -------------- | ------------- |
| Gemini     | ✅              | ✅             |
| Vertex AI  | ✅              | 取决于模型         |
| OpenAI     | ✅              | 取决于接口         |
| DeepSeek   | ✅              | 建议先转 Markdown |
| OpenRouter | ✅              | 取决于模型         |
| Anthropic  | ✅              | ✅             |
| Custom API | ✅              | 取决于接口         |

对于论文分析，推荐优先使用 Markdown，兼容性通常更好。

---

## 项目结构

```text
readyscholarlens/
├── frontend/       # React 前端
├── backend/        # 本地 AI Provider 后端
├── package.json
└── README.md
```

---

## 隐私与安全

ScholarLens 采用 BYOK 模式。

请注意：

* 不要把 API Key 提交到 GitHub
* 不要上传 `.env.local`
* 不要上传 Google ADC 凭证
* 不要在公共电脑保存长期有效的 API Key
* Vertex AI 使用的是用户自己的 Google Cloud 项目与额度

---

## 技术栈

* React
* TypeScript
* Vite
* Node.js
* Express
* Google GenAI SDK

---

ScholarLens 的目标是提供一个简单、统一的 AI 学术论文分析工作台。

**Your Key. Your Model. Your Research.**
