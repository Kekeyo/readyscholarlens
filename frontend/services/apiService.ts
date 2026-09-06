import { GoogleGenAI } from '@google/genai';
import { AnalysisMode, PaperFile, ProviderSettings, AIProvider } from '../types.ts';

const getSystemInstruction = (mode: AnalysisMode): string => {
  const baseInstruction = `
请严格按照以下结构和标题进行输出，内容必须详实、有深度、字数充足，绝对不能马虎或泛泛而谈。
【格式与语言要求】：
1. 请使用标准的 Markdown 表格语法来呈现对比数据。
2. 【极其重要】：所有变量名、参数、数学公式、物理量（如 θ, λ, β_k 等）**必须**使用 LaTeX 语法并用 \`$\` 包裹（例如 \`$\\theta_{rot,k}$\`，\`$\\beta_k$\`）。绝对不要直接输入 Unicode 字符或使用普通括号代替公式环境！独立公式块请使用 \`$$\` 包裹。
3. 【语言风格】：请使用自然、客观、严谨的专业学术语言。**绝对禁止**使用类似 "课题组基因"、"误差即敌人"、"从物理本质出发" 这种带有强烈主观色彩、比喻性、夸张或明显 AI 生成痕迹的词汇和引号。保持中立的第三方学术观察者口吻。不要生造词汇，不要使用双引号来强调你自己发明的概念。
`;

  if (mode === AnalysisMode.AUTHOR) {
    return `你是一位资深的学术论文评审专家和导师分析师。
用户将提供多篇学术论文（可能包含PDF或Markdown格式）。
你的任务是进行“同老师类型/同课题组”深度分析。请务必极其详细、严谨地综合剖析这些论文，提取出作者（或指导老师）的学术特征、指导风格和研究品味。
${baseInstruction}
### 一、总体概况
详细总结该作者/课题组的核心研究理念、长期关注的宏观领域、整体学术品味（例如：偏向底层理论推导、注重工程落地应用、或是交叉学科创新等）。

### 二、研究方向地图
梳理该作者/课题组涉及的细分研究方向、技术分支，构建其团队的科研版图，说明各个分支之间的协同与支撑关系。

### 三、时间演化与论文继承关系
分析该课题组研究工作在时间维度上的演进脉络。指出其内部论文之间的继承、迭代、改进或自我突破关系，揭示其科研主线是如何发展的。

### 四、代表论文深读
挑选提供的文献中最具代表性或突破性的几篇论文，逐一进行深度剖析，提炼该导师最引以为傲的核心创新点、标志性技术路线和重要结论。

### 五、实验与计算方法比较
横向对比该课题组常用的实验范式、偏好的数据集、评估指标或计算/推导工具。分析其在方法论上的独特偏好以及严谨程度。

### 六、方向的共同点与差异
总结该课题组不同论文在研究思路上的底层共性，同时指出其在不同细分方向或不同应用场景下的差异化探索。

### 七、一句话总结
用高度凝练、专业的一句话概括这位导师/课题组的整体学术画像与核心竞争力。`;
  } else {
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
  }
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
