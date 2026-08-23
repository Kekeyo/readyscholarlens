# ScholarLens — AI 学术论文深度分析

ScholarLens 是一个面向论文阅读、导师研究方向分析与课题组研究脉络整理的 AI 学术分析工具。

用户可以上传多篇论文或 Markdown / TXT 文档，选择不同 AI Provider，对文献进行统一分析，并生成结构化的深度研究报告。

主要支持两种分析模式：

* **同老师类型 / 同课题组分析（Author Style）**
  从多篇论文中分析作者或课题组的研究方向、技术路线、论文继承关系、实验方法与整体学术特征。

* **同研究方向分析（Research Direction）**
  对同一研究领域的多篇论文进行横向比较，梳理研究脉络、主要技术分支、代表性工作与潜在发展方向。

---

## ✨ 功能特性

* **多 AI Provider 支持**

  * Google Gemini API
  * Google Vertex AI
  * OpenAI
  * DeepSeek
  * OpenRouter
  * Anthropic Claude
  * 自定义 OpenAI Compatible API

* **BYOK（Bring Your Own Key）**

  * 用户使用自己的 API Key
  * API Key 保存在当前浏览器本地
  * ScholarLens 不提供公共 AI Key
  * AI 调用产生的费用由用户自己的 Provider 账户承担

* **多文献联合分析**

  * 支持一次加入多篇论文
  * 支持 Markdown / TXT 文本
  * 部分 Provider 支持直接读取 PDF

* **流式输出**

  * AI 内容实时生成
  * 无需等待完整回答结束

* **Markdown 学术报告**

  * Markdown 渲染
  * LaTeX 数学公式显示
  * 表格与代码块显示
  * 长篇学术报告阅读优化

* **结果导出**

  * Markdown
  * TXT
  * PDF

---

## 🌐 在线使用

ScholarLens 已提供在线 Web 版本。

普通用户**不需要下载项目，也不需要自己部署网站**。

打开 ScholarLens 后：

1. 点击右上角 **API 设置**
2. 选择需要使用的 AI Provider
3. 填写自己的 API Key、模型名称及必要的 API 地址
4. 上传论文或 Markdown / TXT 文档
5. 选择分析模式
6. 开始分析

### Gemini API

填写自己的 Google Gemini API Key 后即可直接使用。

Gemini 模式支持浏览器直接连接 API，因此不需要运行 ScholarLens 后端。

### OpenAI / DeepSeek / OpenRouter / Custom API

填写：

* API Key
* Base URL
* Model

即可通过浏览器直接调用兼容的 API。

不同服务商支持的模型名称和 Base URL 不同，请以对应服务商的 API 文档为准。

### Anthropic Claude

可以使用自己的 Anthropic API Key。

需要注意，部分 API 服务可能对浏览器跨域请求（CORS）存在限制。如果浏览器阻止直接连接，可以考虑通过兼容代理或其他受支持方式调用。

---

# ⚠️ Vertex AI 使用说明

Vertex AI 与普通 API Key Provider 不同。

**Vertex AI 模式不能仅依靠 ScholarLens 在线网页直接完成认证。**

原因是 Vertex AI 默认使用 Google Cloud 的：

**Application Default Credentials（ADC）**

ADC 属于用户本地系统或服务器环境中的 Google Cloud 身份凭证。出于安全原因，普通网页不能直接读取用户电脑上的 ADC。

因此 Vertex AI 使用以下架构：

```text
ScholarLens 在线网页
        ↓
用户电脑上的 ScholarLens Local Backend
        ↓
Google Application Default Credentials
        ↓
用户自己的 Google Cloud Project
        ↓
Vertex AI
```

也就是说：

> 如果只使用 Gemini API、OpenAI、DeepSeek、OpenRouter 等 Provider，可以直接打开 ScholarLens 在线网页使用。

> **只有使用 Vertex AI 时，才需要在自己的电脑上运行 ScholarLens Local Backend。**

Vertex AI 消耗的是用户自己的：

* Google Cloud 账号
* Google Cloud Project
* Vertex AI 配额
* Google Cloud 账单

ScholarLens 不提供公共 Vertex AI 凭证。

---

## Vertex AI 本地配置

### 1. 准备环境

需要安装：

* Node.js
* npm
* Google Cloud CLI

并拥有可以使用 Vertex AI 的 Google Cloud Project。

---

### 2. 配置 Google Cloud

首先登录 Google Cloud：

```bash
gcloud init
```

然后建立 Application Default Credentials：

```bash
gcloud auth application-default login
```

浏览器会打开 Google 登录页面。

登录并授权完成后，ADC 会保存在用户自己的电脑上。

**不要把 ADC 凭证文件上传到 GitHub。**

---

### 3. 下载 ScholarLens

Clone 本项目后进入项目目录：

```bash
git clone <ScholarLens Repository>
cd readyscholarlens
```

安装依赖：

```bash
npm install
```

---

### 4. 配置 Vertex AI

项目提供：

```text
backend/.env.example
```

复制一份并命名为：

```text
backend/.env.local
```

配置：

```env
API_BACKEND_PORT=5000
API_PAYLOAD_MAX_SIZE=50mb

GOOGLE_CLOUD_PROJECT=你的_Google_Cloud_Project_ID
GOOGLE_CLOUD_LOCATION=global
```

其中：

```text
GOOGLE_CLOUD_PROJECT
```

填写的是 **Google Cloud Project ID**，不是项目显示名称。

例如：

```env
GOOGLE_CLOUD_PROJECT=my-project-123456
GOOGLE_CLOUD_LOCATION=global
```

---

### 5. 启动 Local Backend

在项目根目录运行：

```bash
npm run dev-backend
```

默认本地服务地址：

```text
http://localhost:5000
```

可以检查：

```text
http://localhost:5000/api/health
```

正常情况下应返回 ScholarLens Backend 正在运行的信息。

此时重新打开 ScholarLens 在线页面并选择：

```text
Vertex AI
```

网页就会通过：

```text
localhost:5000
```

访问用户自己电脑上的 Local Backend，再由本地后端通过 ADC 调用 Vertex AI。

---

## 🔐 API Key 与隐私

ScholarLens 采用 BYOK 模式。

对于浏览器直接调用的 Provider，API Key 保存在浏览器本地存储中，并用于连接用户所选择的 API Provider。

建议：

* 不要在公共电脑长期保存 API Key
* 不要把 API Key 写进项目源代码
* 不要把 `.env.local` 上传 GitHub
* 不要上传 Google ADC 凭证
* 不要把 Vertex AI Local Backend 的端口暴露到公网
* 使用完公共电脑后清除浏览器中的 ScholarLens 设置

---

## 📄 文件支持

不同 Provider 对文件输入能力存在差异。

| Provider      | Markdown / TXT | PDF                | 使用方式                 |
| ------------- | -------------- | ------------------ | -------------------- |
| Gemini API    | ✅              | ✅                  | 浏览器直接调用              |
| OpenAI        | ✅              | 视接口实现              | 浏览器直接调用              |
| DeepSeek      | ✅              | ❌ / 建议转换为 Markdown | 浏览器直接调用              |
| OpenRouter    | ✅              | 取决于模型              | 浏览器直接调用              |
| Anthropic     | ✅              | ✅                  | 浏览器直接调用，可能受到 CORS 限制 |
| Custom OpenAI | ✅              | 取决于接口              | 浏览器直接调用              |
| Vertex AI     | ✅              | 取决于当前模型与实现         | Local Backend + ADC  |

对于论文分析，推荐优先将论文转换为 Markdown。这样兼容性更高，同时可以减少 PDF 解析方式不同造成的问题。

---

## 📁 项目结构

```text
readyscholarlens/
│
├── frontend/
│   ├── components/          # React UI 组件
│   ├── services/
│   │   └── apiService.ts    # 多 Provider 调用入口
│   ├── App.tsx
│   ├── index.tsx
│   ├── index.html
│   ├── types.ts
│   └── vite.config.ts
│
├── backend/
│   ├── providers/
│   │   ├── vertex.js
│   │   ├── gemini.js
│   │   ├── anthropic.js
│   │   └── openaiCompatible.js
│   ├── routes/
│   │   └── chat.js
│   ├── .env.example
│   ├── server.js
│   └── package.json
│
├── package.json
├── package-lock.json
└── README.md
```

其中：

```text
frontend/
```

负责 ScholarLens Web 应用。

```text
backend/
```

主要用于需要本地身份认证或无法安全由浏览器直接完成的 Provider 请求。

当前 Vertex AI 使用该 Local Backend 完成 ADC 身份认证。

---

## ⚠️ 使用限制

ScholarLens 本身不提供 AI 模型服务。

实际模型能力、上下文长度、请求速度、文件支持、价格和使用限制均由用户选择的 AI Provider 决定。

浏览器直连还可能受到以下因素影响：

* CORS
* Provider 浏览器访问策略
* API 地区限制
* 网络环境
* 模型上下文长度
* 单次请求大小限制

如果某个 Provider 明确禁止浏览器直接访问，则需要通过本地后端或该 Provider 官方支持的方式调用。

---

## 🛠️ 技术栈

Frontend：

```text
React
TypeScript
Vite
Tailwind CSS
KaTeX
Marked
```

Backend：

```text
Node.js
Express
Google GenAI SDK
```

---

## 📌 项目定位

ScholarLens 的目标不是提供公共 AI API，而是提供一个统一的学术论文分析界面。

用户可以自由选择自己的 AI Provider、自己的模型以及自己的 API 配置，并将 ScholarLens 作为论文阅读与科研分析工作台使用。

**Your Key. Your Model. Your Research.**
