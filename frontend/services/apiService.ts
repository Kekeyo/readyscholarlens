import { GoogleGenAI } from '@google/genai';
import { AnalysisMode, PaperFile, ProviderSettings, AIProvider } from '../types.ts';

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
    return `你是一位资深的学术论文评审专家和科研团队分析师。
用户将提供多篇学术论文（可能包含 PDF 或 Markdown 格式）及补充说明。
你的任务不是逐篇摘要论文，而是基于全部材料形成系统性的导师或课题组学术研究画像，识别长期研究主线、核心科学问题、技术演化关系、研究方法偏好与当前研究重心。
${baseInstruction}

【证据与归因原则】
- 必须区分：导师本人长期稳定参与的研究主线、课题组内部形成的共同方向、主要由合作作者或合作机构带来的拓展方向。
- 不得仅因论文出现在样本中，就把其中全部研究内容自动归因于目标导师。
- 跨论文结论必须由多篇论文支持，不得依据单篇论文推断团队长期偏好。

### 一、总体概况
概括论文集合反映的主要研究领域、核心科学问题和整体研究特征。分别说明导师长期主线、团队共同方向与合作拓展方向，并给出判断依据。

### 二、研究方向地图
建立具有层级关系的研究方向地图，识别核心主线、稳定支线、近年增强的新兴方向、合作型或探索型方向，以及它们之间的理论、方法和应用关系。
必须区分核心科学问题、方法论、技术实现、数据类型和应用场景，避免把不同抽象层级的概念并列为同一级方向。

### 三、时间演化与论文继承关系
按照年份分析研究重点变化，并将论文关系明确区分为：
1. **明确继承**：后续论文明确引用、扩展、替代或改进前期工作；
2. **方法延续**：核心模型、优化框架或技术思想明显延续，但无法确认属于直接扩展；
3. **主题关联**：研究对象或问题相近，但缺乏直接技术继承证据。
禁止仅凭题目、关键词或时间顺序构造确定的继承链。无法确认时使用“可能延续”“在研究思想上相关”“可视为同一研究脉络”等表达。

### 四、代表论文深读
选择能够奠定研究问题、形成方法转折、体现团队研究方法或代表近期重点的论文，而非单纯选择指标最高者。
每篇重点分析：核心问题、关键思想、与既有工作的主要差异、在研究谱系中的作用及核心实验结论。避免大段复述网络结构、训练细节和公式，只保留解释研究思想所必需的技术证据。

### 五、实验与计算方法比较
对比代表论文的数据集、评价指标、基线与参考标准、数学建模方式、网络或算法范式、消融实验，以及编解码时间、FLOPs、显存、参数量等复杂度指标，并说明是否依赖标准参考软件或实际编码框架。
进一步归纳团队是否重视真实工程验证、复杂度、数学建模，以及是否反复采用多尺度、解耦、稀疏计算、自适应分配等策略。

### 六、研究范式与方法论特征
跨论文提炼反复出现的核心优化思想、信息解耦与融合方式、多尺度与层次化建模、率失真或任务导向优化、人类感知与机器感知处理方式、传统信号处理与深度学习结合方式，以及理论建模与工程实现之间的关系。
每项方法论特征都必须给出多篇论文依据，不得把单篇论文特征泛化为团队长期偏好。

### 七、研究重心与方向成熟度
结合论文数量、年份连续性、作者参与程度和近年发表趋势，将方向谨慎划分为：长期核心主线、稳定研究方向、当前快速发展的方向、新兴探索方向、合作型方向、已较成熟或近期活跃度下降的方向。
每项判断必须说明依据，不使用数值评分，也不能仅根据论文数量机械判断重要性。

### 八、整体学术画像
综合回答：该导师或课题组主要解决什么类型的科学问题；最稳定的方法论是什么；研究重点近年来发生了什么变化；当前最值得关注的研究交汇点是什么。
最后给出一段高度凝练、证据边界清晰的整体总结。优先解释“为什么这一系列工作会这样演化”，而不是机械复述每篇论文做了什么。`;
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
