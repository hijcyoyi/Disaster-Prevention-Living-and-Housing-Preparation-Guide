import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function getAi(clientApiKey?: string): GoogleGenAI {
  const apiKey = (clientApiKey && clientApiKey.trim()) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("找不到有效的 Gemini API 金鑰。請在左側設定面板中輸入您的個人 Gemini API 金鑰，或請管理員在系統中配置預設金鑰。");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API Route: AI Risk Analysis
  app.post("/api/gemini/analyze-risk", async (req, res) => {
    try {
      const { location, familyProfile, environmentDesc, missingItems } = req.body;
      const clientApiKey = req.headers['x-api-key'] as string;
      const prompt = `
      請以一位擁有40年實務經驗的台灣資深防災專家身份進行分析。目標地點：${location}。
      
      請使用 Google Search 搜尋目前（最新真實時間）台灣地區的「${location} 即時天氣與災害警報」或近期的「颱風特報」、「豪雨特報」、「地震警報」與「停班停課」真實天氣與災害預警資訊。
      根據最新的真實數據與災害預報，進行極其精準、真實情境的居住地安全防護分析。

      家庭成員與人員特徵：
      ${familyProfile?.hasToddler ? '- 嬰幼兒成員：需要專屬防災副食品、尿布奶粉、溫濕度控制、安心安撫與特殊嬰幼兒應急避難包補給整備。\\n' : ''}
      ${familyProfile?.hasElderly ? '- 高齡長者成員（長輩）：常備慢性病藥物、居家防跌防滑、不斷電照明、禦寒避寒、隨身急救藥盒與照護安全提醒。\\n' : ''}
      ${familyProfile?.hasChronicIllness ? '- 慢性病患成員：常備專用藥物（7-14天備量）、急救聯繫管道與固定服藥提醒。\\n' : ''}
      ${familyProfile?.hasMobilityIssues ? '- 行動不便成員：逃生動線暢通、緊急疏散協助、預備輪椅/輪杖等逃生移動支撐裝置。\\n' : ''}
      ${familyProfile?.hasDeliveryRider ? '- 外送外勤人員：極端天氣安全行車規範（防側風打滑、停單限制、避免積水道路及高地風切）。\\n' : ''}

      請根據您搜尋到的「最新真實天氣預報與災害狀態」，結合上述家庭成員、外送外勤特徵、環境與物資缺口，給出最務實的專家建議：
      1. 災害風險分析：基於真實氣象特報（特別針對颱風警報、暴雨豪雨預警、強震預兆、土石流等實時警特報）說明具體威脅重點，判定總體居住安全風險等級 (High, Medium, 或 Low)。
      2. 停班停課風險指標：查詢該區域日前最新停班停課發布狀態，或分析若遭遇強風豪雨（如本島暴風圈侵襲、暴雨達停班課標準）時的停班課機率與決策判斷依據。
      3. 專屬家庭關懷與人員提醒：針對所勾選的人員特徵（特別是家中長輩照護、或外送工作者面臨的惡劣風雨環境）提出具體的守護與禁忌忠告。
      4. 避難包與抗災物資建議：必須針對使用者**目前缺少的物資**提出強烈預警，並解釋在突發颱風豪雨或地震斷水斷電時缺失該物資的危險性。
      5. 即時行動指引 (Actionable Timeline)：針對即時預報，細化至「現在立刻做」和「未來24小時內持續跟進與整備」。
      6. 附近避難撤離與收容處所規劃：搜尋並列出該「${location} 附近真實存在的緊急避難收容處所、學校、防災公園、里活動中心」，並給出避難原則。
      7. 整備缺點與安全漏洞診斷（deficiencyAnalysis）：**針對該地區特點、家庭成員弱勢面（如長輩病患、急需外勤）、以及目前確認缺少的關鍵物資，嚴厲且明確地指出目前家庭防災整備的致命缺點與潛在漏洞，並給予具體改良弱點之策略方案。**

      請務必直接回傳一個合法、無瑕疵的 JSON 物件，絕對不要加上任何 Markdown 語法或其他的文字，格式說明如下：
      {
        "disasterRisk": { 
          "level": "Low/Medium/High", 
          "summary": "一句涵蓋最新即時災害（如颱風/豪雨/地震）威脅與本地氣象快報的專業總體摘要", 
          "factors": [
            { "name": "強風暴雨威脅", "riskLevel": "🟢低風險/🟡注意防範/🔴極高風險" },
            { "name": "地質與淹水潛勢", "riskLevel": "🟢安全/🟡低窪警戒/🔴高淹水風險" },
            { "name": "交通工作安防", "riskLevel": "🟢暢通/🟡路面溼滑/🔴高危險外送暫停" }
          ] 
        },
        "suspensionIndicator": { 
          "level": "低/中/高", 
          "reasons": ["區域即時停班課公告狀態或風雨級數評估理由1", "防範通勤災害或平台斷單依據2"] 
        },
        "familyCare": ["提醒點1 (如長輩用藥、保暖與行動守護)", "提醒點2 (如外送人員強烈陣風禁忌、不可涉水高危道路)", "提醒點3..."],
        "bagRecommendations": ["強烈補齊缺少物資提醒1", "避難與日常物資整備提醒2"],
        "deficiencyAnalysis": {
          "weaknesses": ["致命脆弱點或防災意識漏洞1 (例如: 缺少急用照明且家有長者，若因斷電致暗光，極易發生跌倒骨折致命威脅)", "致命脆弱點或防災意識漏洞2..."],
          "improvements": ["優化方案與具體改良策略1 (例如: 應立刻於床頭及浴室配置免插電感應小夜燈)", "優化方案與具體改良策略2..."]
        },
        "actionableTimeline": { 
          "immediate": ["現在立刻把長輩日常藥品置於隨身小袋中", "現在立刻檢查居家排水口並確認外送/出門安全帽與外勤鞋底摩擦力"], 
          "next24h": ["持續關注最新颱風/豪雨陸上警報與停班停課公告", "備妥臨時停電/停水措施"] 
        },
        "shelterGuidance": {
          "nearestOptions": ["地點A (例如 \${location} 某某國小，適用淹水或強震避難)", "地點B (例如 某某活動中心，適用收容)"],
          "safetyCriteria": ["行進原則1 (如避開下水道溢水、高牆)", "行進原則2 (如長輩行進注意夜間探照，外勤強風時就近水泥建物內避風)"]
        }
      }
      `;

      const response = await getAi(clientApiKey).models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        },
      });

      let responseText = response.text || "{}";
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

      res.json(JSON.parse(responseText));
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate risk analysis: " + (error.message || String(error)) });
    }
  });

  // API Route: AI Environment Extraction from Address
  app.post("/api/gemini/analyze-environment", async (req, res) => {
    try {
      const { location } = req.body;
      const clientApiKey = req.headers['x-api-key'] as string;
      if (!location || !location.trim()) {
        return res.status(400).json({ error: "Location is required" });
      }

      const prompt = `
      你是一位頂尖的地理與地質防災專家，對台灣的行政區劃、地勢起伏、歷史災害熱點、水文分佈與斷層帶分佈具有極其詳盡的知識。
      
      請依據使用者輸入的位置/地址進行深度分析：\${location}。
      
      請首先配合 Google Search 工具，查詢關於「台灣 \${location} 淹水 斷層 地質 土石流 災害歷史」等相關真實的地理特點與災害潛勢。
      
      接著，進行全面地理與環境判讀，包含以下幾大要點：
      1. 地形起伏與水體關係（是否靠山、位在山腳/坡度大、近順向坡山區、低窪盆地、或河流排水通道附近）。
      2. 連續暴雨或颱風時的典型環境挑戰（淹水、積水、連外道路中斷、土石崩坍風險）。
      3. 居住房屋特徵提醒（如為該區常見老舊公寓、傳統透天、抑或是近年新興高樓層住宅等可能遇到的結構或強風共振風險、高樓停電受困等）。
      
      請根據上述判讀，提煉成一段約 150 - 250 字左右、語氣溫和且高度專業、實用的「居住環境描述與特徵分析」。
      注意：不需要用條列式或過多技術術語，要像顧問站在專業角度提供一段自然、流暢、清晰的環境特性寫真。可以直接被置入「居住環境描述」欄位。
      
      範例風格：
      「該位置位於台北市南港區靠近山腳一帶，鄰近部分順向坡與大坑溪一隅。在颱風豪雨或極端降雨事件發生時，坡地水流可能迅速匯集，低窪巷弄需留意短時積水。此外，該區多有屋齡逾30年的老舊透天的結構避難風險，強震或豪雨時需注意山坡崩塌與連外道路管制，建議多加留意防災防淹整備。」

      請務必回傳一個合法、無瑕疵的 JSON 物件，絕對不要加上任何 Markdown 語法或其他的文字，格式說明如下：
      {
        "environmentDesc": "此處環境特點分析內容..."
      }
      `;

      const response = await getAi(clientApiKey).models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        },
      });

      let responseText = response.text || "{}";
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

      res.json(JSON.parse(responseText));
    } catch (error: any) {
      console.error("Environment analysis failed:", error);
      res.status(500).json({ error: "Failed to analyze environment: " + (error.message || String(error)) });
    }
  });

  // API Route: AI Chat Consultant
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, familyProfile, location, environmentDesc, currentRisk } = req.body;
      const clientApiKey = req.headers['x-api-key'] as string;
      
      const prompt = `
      你是一位擁有40年經驗的「AI資深防災專家」。
      使用者位於：\${location || '未提供'}
      目前系統評估風險總體等級：\${currentRisk || '未知'}
      
      家庭狀況包含：幼兒(\${familyProfile?.hasToddler})、老人(\${familyProfile?.hasElderly})、慢性病患(\${familyProfile?.hasChronicIllness})、行動不便者(\${familyProfile?.hasMobilityIssues})、外送員(\${familyProfile?.hasDeliveryRider})
      居住環境描述 (請考慮其潛在風險)：\${environmentDesc || '未提供'}

      請以專業、務實、嚴謹的語氣，回答使用者的問題。給出實踐性高的專家防護動作，避免空泛呼籲。
      問題：\${message}
      `;

      const response = await getAi(clientApiKey).models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({ reply: response.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate chat response" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:\${PORT}`);
  });
}

startServer();
