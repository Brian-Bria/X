require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const openai = new OpenAI({
  apiKey: process.env.API_KEY || 'sk-c1va0c7qc2n6k5bgbqh0u0q0h4vc9huk5c2xcq205hxn4cze',
  baseURL: process.env.BASE_URL || 'https://api.xiaomimimo.com/v1',
});
const MODEL = process.env.MODEL || 'mimo-v2.5-pro';

// ============ System Prompt ============
const SYSTEM_PROMPT = `你是一位阅尽千帆的人生叙述者。你见过无数普通人的人生轨迹——有人裸辞后一蹶不振，有人绝处逢生；有人早早结婚后悔不已，有人三十岁才遇到对的人；有人跟风创业血本无归，有人误打误撞走上正轨。

你的任务是：根据用户给出的一个"假如"式选择，用**讲故事的方式**，把这个选择未来会如何展开，一年一年地叙述出来。

## 核心原则

1. **像小说一样叙述，不是做报告**
   - 用"你"来称呼用户，像一个过来人在跟你聊天
   - 有场景、有画面、有情绪、有细节
   - 不要用"分析如下"、"从概率角度看"这类学术腔
   - 不要分"优势劣势"、不要评分打分、不要画表格

2. **一切叙述必须有现实逻辑根基**
   - 参考当前大环境：经济形势、就业市场、房价物价、行业趋势、政策方向
   - 参考社会规律：普通人的人生节奏、社会期望、家庭压力、年龄焦虑
   - 参考真实案例：类似选择的人通常会经历什么
   - 每一个转折都要有因果关系，不能凭空编造

3. **写的是普通人的生活，不是成功学**
   - 不要写成"只要你努力就能成功"的鸡汤
   - 也不要写成"选了就完蛋"的悲观论
   - 要写真实的、有起伏的、大多数人都会经历的那种生活
   - 该有的焦虑、纠结、妥协、平淡、小确幸、小崩溃都要有

4. **要详细，要有画面感**
   - 不是"第一年你会很辛苦"一句话带过
   - 而是具体到：你会在某个深夜加班到几点、看到朋友圈谁又晒了什么、银行卡余额变成多少、跟父母打电话时他们怎么说
   - 要让读者读完觉得"对，这就是我未来会过的生活"

## 叙述结构

按时间线展开，每一年或每个阶段都要写得具体：

- **近期（第1-2年）**：选择刚做出后的直接变化、适应期的挣扎、最初的甜头或苦头
- **中期（第3-5年）**：选择的深层影响开始显现、生活走向分化、关键的十字路口
- **远期（第6年以后）**：人生的沉淀、当初选择的最终答卷、回头看时的感悟

## 格式要求

- 用纯文本叙述，可以适当分段，但不要用编号列表
- 每个阶段之间可以用空行隔开
- 总字数不少于800字，越详细越好
- 结尾可以给一句过来人的忠告，但不要太鸡汤
- 不要输出JSON，不要输出任何结构化数据`;

// ============ Prediction Endpoint ============
app.post('/api/predict', async (req, res) => {
  try {
    const { choice, years, currentAge, gender, personality } = req.body;
    if (!choice || !years) {
      return res.status(400).json({ error: '请填写选择内容和推测年数' });
    }

    const userContext = [
      currentAge ? `我今年${currentAge}岁` : '',
      gender ? `性别：${gender}` : '',
      personality ? `性格特征：${personality}` : '',
    ].filter(Boolean).join('；');

    const userMessage = `假设我做了以下选择：

「${choice}」

${userContext ? `背景信息：${userContext}` : ''}

请从现在开始，推演我未来${years}年的人生轨迹。用讲故事的方式，一年一年地叙述出来，要详细、有画面感、贴合真实生活。`;

    console.log(`[Predict] "${choice}" - ${years}年`);

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.8,
      max_tokens: 5000,
    });

    const narrative = completion.choices[0].message.content;
    console.log('[Predict] Success, length:', narrative.length);
    res.json({ narrative, choice, years });
  } catch (err) {
    console.error('[Predict] Error:', err.message);
    res.status(500).json({ error: `推测失败: ${err.message}` });
  }
});

// ============ Follow-up Chat Endpoint ============
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, context } = req.body;
    if (!messages || !messages.length) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    console.log('[Chat] Messages:', messages.length);

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT + `\n\n## 上下文\n用户之前做了一个选择：「${context}」\n你已经为他叙述了一段人生推演。现在他有追问，请继续用同样的叙事风格回答，保持真实、详细、有画面感。`
        },
        ...messages
      ],
      temperature: 0.8,
      max_tokens: 3000,
    });

    console.log('[Chat] Success');
    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error('[Chat] Error:', err.message);
    res.status(500).json({ error: `对话失败: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`\n🔮 人生推测器已启动: http://localhost:${PORT}`);
  console.log(`📡 模型: ${MODEL}`);
  console.log(`🔗 API: ${process.env.BASE_URL || 'https://api.xiaomimimo.com/v1'}`);
  console.log('');
});
