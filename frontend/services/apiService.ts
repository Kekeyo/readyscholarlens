import { GoogleGenAI } from '@google/genai';
import { AnalysisMode, PaperFile, ProviderSettings, AIProvider } from '../types.ts';
import { AUTHOR_ANALYSIS_PROMPT } from '../prompts.ts';

const getSystemInstruction = (mode: AnalysisMode): string => {
  const baseInstruction = `
【格式与语言要求】：
1. 使用清晰的 Markdown 标题、表格和必要的结构图。
2. 【极其重要】：所有变量名、参数、数学公式、物理量（如 θ, λ, β_k 等）**必须**使用 LaTeX 语法并用 \`$\` 包裹（例如 \`$\\theta_{rot,k}$\`，\`$\\beta_k$\`）。绝对不要直接输入 Unicode 字符或使用普通括号代替公式环境！独立公式块请使用 \`$$\` 包裹。
3. 使用客观、克制、严谨的专业学术语言，避免宣传式、夸张式、比喻性和明显的 AI 套话。
4. 除非论文明确支持，不得使用“首次”“开创先河”“奠基性突破”“顶尖”“极深造诣”“独创”“彻底解决”等强评价词。
5. 严格区分论文明确事实、基于多篇论文的归纳和分析性推断。对推断使用“表明”“显示出”“可以观察到”“可能意味着”等谨慎措辞，不得把推测写成事实。
6. 不得虚构论文之间的引用或继承关系、作者关系、数据集规模、实验结果和技术细节。证据不足时明确说明“基于当前论文样本无法确认”。
7. 如果样本数量、论文编号、作者信息或年份存在不一致，应主动指出，不得自行补全。
8. 重要结论尽量注明对应论文编号，例如“Doc 12、Doc 16、Doc 30”。技术细节必须服务于整体分析，不影响研究画像判断的公式、模块和实验参数可以省略。
`;

  if (mode === AnalysisMode.AUTHOR) {
    return AUTHOR_ANALYSIS_PROMPT;
  }

  if (mode === AnalysisMode.SINGLE_PAPER) {
    return `你是一位严谨的学术论文评审专家。
用户将提供一篇当前论文（PDF 或 Markdown）及补充说明。你的任务是完成“单篇论文深度精读”：对论文进行深度技术拆解与批判性精读，重点解释为什么这样设计、解决了什么问题、模块之间的逻辑闭环、方法的边界与改进空间。不要复述引言客套话与无意义的元信息（如作者单位、期刊投递状态等），直奔技术硬核。
${baseInstruction}

【任务边界】
- 以论文明确内容为事实依据；对设计动机、效果原因和局限性的判断，必须标明为分析性判断。
- 若材料中包含多篇论文或关键内容缺失，说明证据边界，不要把不同论文的内容混为一谈或补充臆测。
- 重要公式使用 LaTeX，并逐项解释变量、物理或数学含义与超参数意图；不要从文字描述反推论文未给出的完整公式。
- 仅在论文材料明确给出或链接可确认时报告开源代码地址；缺失时写明“未提供”。不要报告作者单位、期刊/会议级别或投递状态。

输出标题后先写：
> **论文**：《论文完整英文题目》 | [开源代码](官方 GitHub 链接，若无则注明“未提供”)

### 0. 核心专业术语与缩写速查表
在正文前提取本文出现频次最高、最关键的 8–12 个核心专业术语或缩写，使用表格：英文缩写 | 英文全称 | 精准中文术语 | 本文中的具体指向/物理含义。覆盖核心领域缩写、模块缩写与评估指标缩写，帮助读者扫清阅读障碍。

### 1. 论文总体概况（极速脉络）
用极短篇幅（300 字内）概括：
- **核心矛盾**：本文面向什么具体场景、什么物理或算法痛点；前人方法为何在此失效；
- **核心方法**：哪些关键模块形成了解决方案闭环；
- **关键结果**：PSNR、BD-BR、准确率、mIoU 等客观指标及主观收益中最核心的定量数据。

### 2. 研究问题与动机
- **现有方法的缺陷与核心矛盾**：说明前人方案在机理上的根本缺陷；
- **问题数学化表达（完整公式）**：给出论文明确提出的优化目标或损失函数完整 LaTeX 公式，逐项解释各分量的物理含义与平衡超参数（如 $\\lambda$、$\\alpha$）的设计意图；
- **痛点、模块与机理映射表**：使用“现实/算法痛点 | 对应设计的核心模块 | 底层数学/物理解决机理”表格；
- 若论文未给出完整公式或模块对应关系，明确说明，不得反推臆测。

### 3. 方法与技术路线（算子级深度拆解）
- **端到端流程图**：使用标准 ASCII 或 Mermaid 绘制数据流转与模块拓扑；
- **核心模块深度拆解**：对每个核心组件逐一说明：
  - 输入/输出表征：特征维度、采样尺寸、通道数等论文明确给出的具体表征；
  - 核心算子与运作机制：讲透注意力权重计算、先验特征融合/调制、时序或隐状态更新传递、池化等算子级数学意图；
  - 算法与超参数细节：采样策略、搜索步长、图构建方式等关键设计；
  - 设计动机：解释“为什么这样设计”，而非简单罗列结构；
- 对重要公式使用 LaTeX 并解释变量含义；论文未公开的维度、算子或超参数必须标记为无法确认。

### 4. 核心创新点（批判性三元组评估）
提炼 2–4 个真正重要的创新点，杜绝把普通模块包装成创新。每项严格按以下三元组剖析：
- **【原方法瓶颈】**：前人方案在此处的根本缺陷；
- **【本文攻克手段】**：本质改进巧思，是架构改进、先验引入还是范式转换；
- **【证据链闭环】**：论文提供哪张图、哪个表或哪个实验来支撑其有效性；证据是否充分。

### 5. 实验设计与深度挖掘
- **实验基准**：数据集划分、测试配置与对比基线，并评估其是否具备公信力；
- **定量结果与边际效应分析**：说明增益最大、最小，甚至负增益或性能倒挂的场景及其深层机理；拆解消融实验中各组件的独立贡献率；
- **计算开销与复杂度拆解**：报告参数量（Params）、计算量（FLOPs）、推理时延（Latency）；指出运行时间的主要杀手模块及论文明确报告的耗时占比；
- **论文中的不严谨处与暗坑**：敏锐标出图表印刷笔误、测试条件不对齐、基准被削弱或口径模糊之处，但必须给出对应证据并使用审慎措辞。

### 6. 总结与科研启发（Follow-up Ideas 孵化）
- **最值得借鉴的研究套路与设计思路**：可迁移到其他任务的通用 Pattern；
- **致命假设与应用边界**：说明在什么实际工况下该算法可能彻底失效；
- **2–3 个具体可执行的 Follow-up 改进课题**：针对最严重的 1–2 个缺陷（如耗时过长、对几何有损敏感、离线不可导或假设过于苛刻等），提出具体技术升级方案，明确拟采用的新技术路线或网络骨干，以及预期解决的问题与效果。`;
  }

  return `你是一位资深的领域学术专家和前沿科技观察员。
用户将提供多篇学术论文（可能包含PDF或Markdown格式）。
你的任务是进行“同方向论文”深度分析。请务必极其详细、严谨地综合剖析这些论文，提取出该研究方向的核心脉络和发展趋势。
${baseInstruction}
### 一、总体概况
详细总结这些论文所属的宏观领域、核心研究动机、试图解决的共同痛点以及整体的学术价值和现实意义。

### 二、研究方向地图
梳理这些论文涉及的细分方向、技术分支，构建一个清晰的知识图谱或技术树描述，说明各个分支之间的关联与互补关系。

### 三、时间演化与论文继承关系
分析这些论文在时间维度上的发展脉络。指出它们之间的继承、改进、对比或竞争关系，理清谁是基础理论，谁是拓展应用。

### 四、代表论文深读
挑选提供的文献中最具代表性或突破性的几篇论文，逐一进行深度剖析，包括其核心创新点、关键技术路线、重要结论以及局限性。

### 五、实验与计算方法比较
横向对比这些论文中使用的实验设置、数据集、评估指标或计算/推导方法。深入分析各种方法的优劣、适用场景以及该领域的评价标准演变。

### 六、方向的共同点与差异
总结这些论文在研究思路、假设前提或技术路线上的共性，同时敏锐地指出它们之间的主要分歧、流派差异或差异化探索路径。

### 七、一句话总结
用高度凝练、专业的一句话概括该方向的核心现状与未来最核心的突破口。`;
};

// Helper to format content for Gemini
const formatForGemini = (files: PaperFile[], manualText: string) => {
  const parts: any[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.type === 'pdf') {
      parts.push({ inlineData: { mimeType: file.mimeType, data: file.content } });
      parts.push({ text: `\n(Above is Document ${i + 1}: PDF file named "${file.name}")\n` });
    } else {
      parts.push({ text: `\n--- Start of Document ${i + 1}: ${file.name} ---\n${file.content}\n--- End of Document ${i + 1} ---\n` });
    }
  }
  if (manualText.trim()) {
    parts.push({ text: `\n--- Additional User Notes/Context ---\n${manualText}\n` });
  }
  parts.push({ text: `请根据系统提示词的要求，对以上 ${files.length} 篇文献进行极其详尽的深度分析。务必保证每个章节都有充足的论述，不要简略。` });
  return parts;
};

// Helper to format content for OpenAI/DeepSeek (String format for maximum compatibility)
const formatForOpenAI = (files: PaperFile[], manualText: string): string => {
  let textContent = "";
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.type === 'pdf') {
      textContent += `\n[System Note: Document ${i + 1} is a PDF named "${file.name}". PDF base64 data is omitted for this provider to prevent API errors. Please use Markdown format for DeepSeek/OpenAI.]\n`;
    } else {
      textContent += `\n--- Start of Document ${i + 1}: ${file.name} ---\n${file.content}\n--- End of Document ${i + 1} ---\n`;
    }
  }
  if (manualText.trim()) {
    textContent += `\n--- Additional User Notes/Context ---\n${manualText}\n`;
  }
  textContent += `\n请根据系统提示词的要求，对以上 ${files.length} 篇文献进行极其详尽的深度分析。务必保证每个章节都有充足的论述，不要简略。`;
  return textContent;
};

export const analyzePaperStream = async (
  files: PaperFile[],
  manualText: string,
  mode: AnalysisMode,
  settings: ProviderSettings,
  onChunk: (text: string) => void,
  onError: (error: string) => void,
  onComplete: () => void
) => {
  try {
    const systemInstruction = getSystemInstruction(mode);

    // ---------------------------------------------------------
    // 1. GEMINI API (Direct Browser Call)
    // ---------------------------------------------------------
    if (settings.provider === AIProvider.GEMINI) {
      if (!settings.apiKey) throw new Error("API Key is required for Gemini.");
      const ai = new GoogleGenAI({ apiKey: settings.apiKey });
      const responseStream = await ai.models.generateContentStream({
        model: settings.model || 'gemini-3.8-flash',
        contents: { role: 'user', parts: formatForGemini(files, manualText) },
        config: { systemInstruction, temperature: 0.5 },
      });
      for await (const chunk of responseStream) {
        if (chunk.text) onChunk(chunk.text);
      }
      onComplete();
      return;
    }

    // ---------------------------------------------------------
    // 2. OPENAI / DEEPSEEK / OPENROUTER / CUSTOM (Direct Browser Call)
    // ---------------------------------------------------------
    if ([AIProvider.OPENAI, AIProvider.DEEPSEEK, AIProvider.OPENROUTER, AIProvider.CUSTOM].includes(settings.provider)) {
      if (!settings.apiKey) throw new Error(`API Key is required for ${settings.provider}.`);
      if (!settings.baseUrl) throw new Error(`Base URL is required for ${settings.provider}.`);

      const response = await fetch(`${settings.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
          'HTTP-Referer': window.location.href,
          'X-Title': 'ScholarLens'
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: formatForOpenAI(files, manualText) }
          ],
          stream: true,
          temperature: 0.5
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API Error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) throw new Error('ReadableStream not supported.');
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') continue;
            try {
              const data = JSON.parse(dataStr);
              const content = data.choices?.[0]?.delta?.content;
              if (content) onChunk(content);
            } catch (e) {}
          }
        }
      }
      onComplete();
      return;
    }

    // ---------------------------------------------------------
    // 3. ANTHROPIC (Direct Browser Call)
    // ---------------------------------------------------------
    if (settings.provider === AIProvider.ANTHROPIC) {
      if (!settings.apiKey) throw new Error("API Key is required for Anthropic.");
      
      const contentArray: any[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type === 'pdf') {
          contentArray.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.content } });
        } else {
          contentArray.push({ type: 'text', text: `\n--- Start of Document ${i + 1}: ${file.name} ---\n${file.content}\n--- End of Document ${i + 1} ---\n` });
        }
      }
      if (manualText.trim()) contentArray.push({ type: 'text', text: `\n--- Additional User Notes/Context ---\n${manualText}\n` });
      contentArray.push({ type: 'text', text: `请根据系统提示词的要求，对以上 ${files.length} 篇文献进行极其详尽的深度分析。` });

      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': settings.apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: settings.model || 'claude-3-5-sonnet-20241022',
            system: systemInstruction,
            messages: [{ role: 'user', content: contentArray }],
            max_tokens: 4096,
            temperature: 0.5,
            stream: true
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Anthropic API Error: ${response.status}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              try {
                const data = JSON.parse(dataStr);
                if (data.type === 'content_block_delta' && data.delta?.text) {
                  onChunk(data.delta.text);
                }
              } catch (e) {}
            }
          }
        }
        onComplete();
        return;
      } catch (err: any) {
        if (err.message.includes('Failed to fetch') || err.message.includes('CORS')) {
          throw new Error("Anthropic blocks direct browser requests (CORS). Please use OpenRouter instead, or run the local backend.");
        }
        throw err;
      }
    }

    // ---------------------------------------------------------
    // 4. VERTEX AI (Requires Local Backend due to ADC)
    // ---------------------------------------------------------
    if (settings.provider === AIProvider.VERTEX) {
      const payload = {
        provider: settings.provider,
        model: settings.model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: formatForOpenAI(files, manualText) } // Backend will reformat
        ],
        config: { temperature: 0.5 },
        credentials: {}
      };

      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Server Error: ${response.status}`);
      }

      if (!response.body) throw new Error('ReadableStream not supported.');
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              onComplete();
              return;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.error) throw new Error(data.error);
              if (data.content) onChunk(data.content);
            } catch (e) {}
          }
        }
      }
      onComplete();
      return;
    }

  } catch (error: any) {
    console.error("Error during analysis:", error);
    let errorMsg = error.message;
    
    if (errorMsg === 'Failed to fetch' || errorMsg.includes('NetworkError')) {
      if (settings.provider === AIProvider.VERTEX) {
        errorMsg = 'Failed to connect to the local backend (http://localhost:5000). Vertex AI requires the backend to be running for authentication. Please run "npm run dev".';
      } else {
        errorMsg = `Network error: Failed to connect to ${settings.provider}. Please check your internet connection or API Base URL.`;
      }
    }
    
    onError(errorMsg || "An unexpected error occurred during analysis.");
  }
};

export const testProviderConnection = async (settings: ProviderSettings): Promise<{success: boolean, message: string}> => {
  try {
    if (settings.provider === AIProvider.GEMINI) {
      if (!settings.apiKey) throw new Error("API Key is required.");
      const ai = new GoogleGenAI({ apiKey: settings.apiKey });
      await ai.models.generateContent({ model: settings.model || 'gemini-3.8-flash', contents: 'Hi', config: { maxOutputTokens: 5 } });
      return { success: true, message: 'Connected to Gemini API successfully.' };
    }

    if ([AIProvider.OPENAI, AIProvider.DEEPSEEK, AIProvider.OPENROUTER, AIProvider.CUSTOM].includes(settings.provider)) {
      if (!settings.apiKey) throw new Error("API Key is required.");
      const response = await fetch(`${settings.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.apiKey}` },
        body: JSON.stringify({ model: settings.model, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 5 })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${response.status}`);
      }
      return { success: true, message: `Connected to ${settings.provider} successfully.` };
    }

    if (settings.provider === AIProvider.ANTHROPIC) {
      if (!settings.apiKey) throw new Error("API Key is required.");
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': settings.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: settings.model || 'claude-3-5-sonnet-20241022', messages: [{ role: 'user', content: 'Hi' }], max_tokens: 5 })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${response.status}`);
      }
      return { success: true, message: 'Connected to Anthropic successfully.' };
    }

    // Vertex AI requires backend
    if (settings.provider === AIProvider.VERTEX) {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: settings.provider, model: settings.model, isTest: true })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
      return data;
    }

    throw new Error("Unsupported provider.");
  } catch (error: any) {
    let errorMsg = error.message;
    if (errorMsg === 'Failed to fetch' || errorMsg.includes('NetworkError')) {
      if (settings.provider === AIProvider.VERTEX) {
        errorMsg = 'Failed to connect to local backend (http://localhost:5000). Is it running?';
      } else {
        errorMsg = `Network error: Could not reach the API endpoint. Check your Base URL or network.`;
      }
    }
    throw new Error(errorMsg);
  }
};
