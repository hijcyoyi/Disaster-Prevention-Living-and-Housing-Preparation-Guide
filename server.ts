import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
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
  const PORT = 3000;

  app.use(express.json());

  // API Route: AI Risk Analysis
  app.post("/api/gemini/analyze-risk", async (req, res) => {
    try {
      const { location, familyProfile, environmentDesc, missingItems } = req.body;
      const clientApiKey = req.headers['x-api-key'] as string;
      
      const prompt = `
      請以一位擁有40年實務經驗的台灣資深防災專家身份進行分析。目標地點：${location}。
      
      請使用 Google Search 搜尋目前（最新真實時間）台灣地區的「${location} 天氣預報」或近期的「颱風特報」、「豪雨特報」等真實天氣與災害預警資訊。
      根據最新的氣象數據與災害預報，進行真實情境的防災分析。

      家庭成員：
      ${familyProfile.hasToddler ? '- 幼兒\n' : ''}
      ${familyProfile.hasElderly ? '- 老人\n' : ''}
      ${familyProfile.hasChronicIllness ? '- 慢性病患者\n' : ''}
      ${familyProfile.hasMobilityIssues ? '- 行動不便者\n' : ''}
      
      居住環境描述 (請AI自動判讀潛在風險如低窪、山區、老屋等)：
      ${environmentDesc ? environmentDesc : '未提供，請依據所在地點進行一般性評估。'}

      目前使用者正在盤點物資，**已盤點確認缺少以下物資**：
      ${missingItems && missingItems.length > 0 ? missingItems.join('、') : '目前無明顯缺少物資'}

      請根據您搜尋到的「最新真實天氣預報與災害狀態」，結合上述家庭、環境與物資狀況，給出最務實的專家建議：
      1. 災害風險分析：基於真實預報說明具體威脅重點，總體風險等級 (High, Medium, 或 Low)。
      2. 停班停課風險指標。
      3. 專屬家庭關懷：針對成員特徵在這次特定災害中會面臨的困難提出建議。
      4. 避難包客製化建議：必須針對使用者**目前缺少的物資**提出強烈提醒，說明在這次真實災害中缺少這項物資的致命性，並給出補齊建議。
      5. 即時行動指引 (Actionable Timeline)：針對這次真實預報，務實分為「現在立刻做」和「未來24小時持續注意」。
      6. 附近避難撤離與收容處所規劃：請搜尋「${location} 附近的緊急避難收容處所、學校（例如鄰近的國小、國中、高中）、防災公園或活動中心」，給出 2-3 個真實存在的建議場所，並說明因應哪些災害類型前往（如淹水、地震、土石流），並給出避難方向判斷與安全行進指引原則。

      請務必直接回傳一個合法、無瑕疵的 JSON 物件，絕對不要加上任何 Markdown 語法或其他的文字，格式說明如下：
      {
        "disasterRisk": { "level": "Low/Medium/High", "summary": "字串", "factors": [{ "name": "名稱", "riskLevel": "🟢低風險/🟡注意/🔴高風險" }] },
        "suspensionIndicator": { "level": "低/中/高", "reasons": ["原因1", "原因2"] },
        "familyCare": ["提醒1", "提醒2"],
        "bagRecommendations": ["建議1", "建議2"],
        "actionableTimeline": { "immediate": ["動作1"], "next24h": ["動作1"] },
        "shelterGuidance": {
          "nearestOptions": ["附近避難點建議：地點A (適用何種災害與說明)", "附近避難點建議：地點B (適用何種災害與說明)"],
          "safetyCriteria": ["安全撤離指引：原則1 (例如強震時就地避難與空地選擇)", "安全撤離指引：原則2 (例如豪雨淹水時避免涉水、往垂直崩塌流向高處撤離)"]
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
      // 清除 markdown backticks
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
      
      請依據使用者輸入的位置/地址進行深度分析：${location}。
      
      請首先配合 Google Search 工具，查詢關於「台灣 ${location} 淹水 斷層 地質 土石流 災害歷史」等相關真實的地理特點與災害潛勢。
      
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
      使用者位於：${location || '未提供'}
      目前系統評估風險總體等級：${currentRisk || '未知'}
      
      家庭狀況包含：幼兒(${familyProfile?.hasToddler})、老人(${familyProfile?.hasElderly})、慢性病患(${familyProfile?.hasChronicIllness})、行動不便者(${familyProfile?.hasMobilityIssues})
      居住環境描述 (請考慮其潛在風險)：${environmentDesc || '未提供'}

      請以專業、務實、嚴謹的語氣，回答使用者的問題。給出實踐性高的專家防護動作，避免空泛呼籲。
      問題：${message}
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
