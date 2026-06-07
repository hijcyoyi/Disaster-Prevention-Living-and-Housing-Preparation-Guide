import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function getAi(clientApiKey?: string): GoogleGenAI {
  const apiKey = clientApiKey && clientApiKey.trim();
  if (!apiKey) {
    throw new Error("請先在左下方「AI 核心智慧引擎設定」中輸入並儲存您的個人 Gemini API 金鑰。本系統並未提供預設系統金鑰，您必須配置屬於您自己的金鑰才能享有精準的 AI 分析。");
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

      if (!clientApiKey || !clientApiKey.trim()) {
        // Return static Taiwanese disaster expert guidance
        const familyCare: string[] = [
          "家庭基本安全：無論風雨大小，請一律將貴重物品、防災避難包放置於一樓玄關附近或高位便於攜帶處。",
          "緊急通路查核：確認家中主要逃生出入口及陽台通道無雜物堆積，保障能在黃金秒數內撤離無阻礙。"
        ];
        if (familyProfile?.hasToddler) {
          familyCare.push("👶 嬰幼兒照護：請優先將嬰幼兒奶粉、備好乾淨保久水、尿布與安撫玩具置於防災隨身包中，防止斷電期間嬰兒哭鬧慌亂。");
        }
        if (familyProfile?.hasElderly) {
          familyCare.push("👴 長輩安全守護：高齡長者在強風巨震時易血壓升高或受驚，請預置好 7 天以上之慢性病常用處方箋藥物，並確保房門與常經走道貼有自亮感應燈。");
        }
        if (familyProfile?.hasChronicIllness) {
          familyCare.push("💊 慢性病管理：重症與慢性病患不可漏藥。請以雙層密封袋緊鎖儲水與 14 天份常用病理藥物隨身抱包。");
        }
        if (familyProfile?.hasMobilityIssues) {
          familyCare.push("♿ 行動不便者疏散：請事先與左鄰右舍或社區主委約定好若遇強震與嚴重淹水時的協助撤離任務分工，並在床頭備好步行輔助器。");
        }
        if (familyProfile?.hasDeliveryRider) {
          familyCare.push("🛵 臨災停售守則：外送工作者請特別注意！10級陣風以上或發布暴雨警特報時，請立即暫停派單外勤，生命安全第一。");
        }

        const bagRecommendations: string[] = [
          "請持續核對自主備災清單。專家提醒：定期檢查電池、藥品及罐頭的效期，至少每半年更新或更換一次。",
          "確保您與每位家人皆有一套完備的防護用品與保暖外套。"
        ];
        if (missingItems && missingItems.length > 0) {
          bagRecommendations.unshift(
            `🚨 缺少物資預警：您勾選缺少的項目包括 [${missingItems.slice(0, 3).join('、')}${missingItems.length > 3 ? '...' : ''}]。在面臨強烈風降雨或地震停電時，這可能帶來嚴重的應急安全隱憂，強烈建議提早補齊！`
          );
        } else {
          bagRecommendations.unshift("🎉 恭喜！您目前的基礎防災儲備物資非常齊全，請繼續保持並確保所有電池、行動電源皆已充飽。");
        }

        const immediateAction = [
          "【檢查逃生路徑】立刻清理大門、走廊、玄關堆積之鞋盒跟傘架，確保通道暢通。",
          "【電源應急】將自備行動電源、手電筒等應急照明工具充飽，並置於床頭等手腳易觸及之處。"
        ];
        if (familyProfile?.hasElderly || familyProfile?.hasMobilityIssues) {
          immediateAction.push("【長輩疏散通報】將行動不便與長輩的必備就醫清單、健保卡及常用藥整齊裝入透明夾鏈袋。");
        }

        return res.json({
          disasterRisk: {
            level: "Medium",
            summary: `針對 ${location || '目標地點'}，已加載「專家推薦本地防災指引」。當前處於基礎整備防禦狀態。填入 API Key 可獲得 AI 個人化即時天氣與地質潛勢分析建議！`,
            factors: [
              { name: "強風暴雨威脅", riskLevel: "🟡 注意防範 (請留意中央氣象署特報)" },
              { name: "地質與淹水潛勢", riskLevel: "🟡 注意防範 (山區土石、低窪防積水)" },
              { name: "交通工作安防", riskLevel: "🟢 正常/溼滑 (風雨加大時請自主暫停外務)" }
            ]
          },
          suspensionIndicator: {
            level: "中",
            reasons: [
              "請持續關注行政院人事行政總處或地方縣市政府發布的最新班課異動公告",
              "若氣象預測降雨量達停班停課標準，自主防護與線上辦公為首選"
            ]
          },
          familyCare,
          bagRecommendations,
          deficiencyAnalysis: {
            weaknesses: [
              "部分非標準物資尚未備足，一旦遭遇突發天災短時斷電，將面臨暫時通訊或照明不便。",
              "缺乏進階 AI 地理探地分析可能遮蔽特定局部位置的隱匿災害（如斷層、過往淹水紀錄）。"
            ],
            improvements: [
              "建議立刻抽空採購並補足所缺少的防災物品，並傳送避難卡文字給所有同住家人備用。",
              "「填入 API Key 可獲得 AI 個人化建議」以對該位置進行即時的 Google Search 地脈災害深度診斷。"
            ]
          },
          actionableTimeline: {
            immediate: immediateAction,
            next24h: [
              "【氣象監控】每隔2至4小時透過收音機、電視或網路追蹤最新氣象警特報與颱風路徑。",
              "【垂直避難防護】若外部開始積水且水深過腳踝，一律停止外出，迅速移往房屋二樓以上高地。"
            ]
          },
          shelterGuidance: {
            nearestOptions: [
              `靠近 ${location || '設定地點'} 最近鄰之公立學校避難收容處所`,
              "所在鄰里活動中心或防災避難公園"
            ],
            safetyCriteria: [
              "避難撤離行進時，絕對不強行跨越積水路段，務必繞開懸掛招牌下的強切路口。",
              "長者、多病者撤離需由親友或鄰居陪同，利用高地水泥建築體掩體前進。"
            ]
          }
        });
      }

      const prompt = `
      請以一位擁有40年實務經驗的台灣資深防災專家身份進行分析。目標地點：${location}。
      
      請使用 Google Search 搜尋目前（最新真實時間）台灣地區的「${location} 即時天氣與災害警報」或近期的「颱風特報」、「豪雨特報」、「地震警報」與「停班停課」真實天氣與災害預警資訊。
      根據最新的真實數據與災害預報，進行極其精準、真實情境的居住地安全防護分析。

      家庭成員與人員特徵：
      ${familyProfile?.hasToddler ? '- 嬰幼兒成員：需要專屬防災副食品、尿布奶粉、溫濕度控制、安心安撫與特殊嬰幼兒應急避難包補給整備。\n' : ''}
      ${familyProfile?.hasElderly ? '- 高齡長者成員（長輩）：常備慢性病藥物、居家防跌防滑、不斷電照明、禦寒避寒、隨身急救藥盒與照護安全提醒。\n' : ''}
      ${familyProfile?.hasChronicIllness ? '- 慢性病患成員：常備專用藥物（7-14天備量）、急救聯繫管道與固定服藥提醒。\n' : ''}
      ${familyProfile?.hasMobilityIssues ? '- 行動不便成員：逃生動線暢通、緊急疏散協助、預備輪椅/輪杖等逃生移動支撐裝置。\n' : ''}
      ${familyProfile?.hasDeliveryRider ? '- 外送外勤人員：極端天氣安全行車規範（防側風打滑、停單限制、避免積水道路及高地風切）。\n' : ''}

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
          "nearestOptions": ["地點A (例如 ${location} 某某國小，適用淹水或空曠避難)", "地點B..."],
          "safetyCriteria": ["避難注意事項1", "避難注意事項2"]
        }
      }
      `;

      let response;
      try {
        response = await getAi(clientApiKey).models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }]
          },
        });
      } catch (searchError: any) {
        console.warn("Analysis with Google Search tool failed, retrying without active Google Search:", searchError);
        response = await getAi(clientApiKey).models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
      }

      let responseText = response.text || "{}";
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

      res.json(JSON.parse(responseText));
    } catch (error: any) {
      console.error("AI Analysis failed:", error);
      res.status(500).json({ error: "Failed to analyze risk: " + (error.message || String(error)) });
    }
  });

  // API Route: Environment Overview Analysis
  app.post("/api/gemini/analyze-environment", async (req, res) => {
    try {
      const { location } = req.body;
      const clientApiKey = req.headers['x-api-key'] as string;

      if (!clientApiKey || !clientApiKey.trim()) {
        return res.json({
          environmentDesc: `針對「${location}」：該處多為都市既有街道，基礎抗震能力通常符合內政部建管規範。然而一旦遭遇強烈暴雨、鋒面洪泛，或突發有感地震，仍需防範短時積淹水以及老舊天花板、盆栽傾倒等風險。「填入 API Key 可獲得 AI 個人化建議」以解析更完整的即時地脈數據。`
        });
      }

      const prompt = `
      你是台灣在地的資深都市防災技師與地質專家。
      
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

      let response;
      try {
        response = await getAi(clientApiKey).models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }]
          },
        });
      } catch (searchError: any) {
        console.warn("Environment analysis with Google Search tool failed, retrying without active Google Search:", searchError);
        response = await getAi(clientApiKey).models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
      }

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

      if (!clientApiKey || !clientApiKey.trim()) {
        return res.json({
          reply: `您好！我是您的 AI 客製化防災顧問。您詢問了關於「${message}」的問題。

目前系統正處於**全功能離線防範模式**下運作中。

**專家防災應急建議：**
1. **就地取材自救：** 遭遇地震或瞬間強雨時請勿過度驚慌。優先鑽入堅固家具下方抱頭保護頭頸，或垂直轉移至二樓以上高位避難。
2. **位置核實：** 您設定的防災位址為 「${location || '未填寫'}」，請確認目前家庭防災常備包（包含 2 萬行動電源、手電筒）隨時可拿。
3. **安全意識：** 定期檢查逃生通道無雜物、並熟悉最近鄰里防災備用收容所。

💡 **若要啟用功能更強大的 AI 互動對話與即時海陸特報分析，請在左欄貼上您的個人金鑰。填入 API Key 可獲得 AI 個人化諮詢建議！**

---
（本分析與建議由 AI 防災助手整合生成，僅供避難整備參考）`
        });
      }
      
      const prompt = `
      你是一位擁有40年經驗的「AI資深防災專家」。
      使用者位於：${location || '未提供'}
      目前系統評估風險總體等級：${currentRisk || '未知'}
      
      家庭狀況包含：幼兒(${familyProfile?.hasToddler})、老人(${familyProfile?.hasElderly})、慢性病患(${familyProfile?.hasChronicIllness})、行動不便者(${familyProfile?.hasMobilityIssues})、外送員(${familyProfile?.hasDeliveryRider})
      居住環境描述 (請考慮其潛在風險)：${environmentDesc || '未提供'}

      請以專業、務實、嚴謹的語氣，回答使用者的問題。給出實踐性高的專家防護動作，避免空泛呼籲。
      
      特別注意（分析缺點與註明 AI）：
      你在對話中，必須主動且嚴厲地分析使用者在住宅環境、物資備置上的「安全缺點與潛在漏洞」（例如缺少關鍵物資時的危險、長者照護的安全盲點、逃生動線堆積等弊端），並給予明確的改善建議以彌補缺漏。
      同時，你務必在回答的最底部，另起一行明確註明：「（本分析與建議由 AI 防災助手整合生成，僅供避難整備參考）」以符合 AI 提示標記政策。

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

  // Helper function to fetch and parse CWA RSS feeds safely without external libraries
  async function fetchCwaRss(url: string) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });
      if (!res.ok) return [];
      const text = await res.text();
      const items: { title: string; link: string; description: string; pubDate: string }[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      while ((match = itemRegex.exec(text)) !== null) {
        const itemContent = match[1];
        const title = itemContent.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "";
        const link = itemContent.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
        const description = itemContent.match(/<description>([\s\S]*?)<\/description>/)?.[1] || "";
        const pubDate = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";
        
        items.push({
          title: cleanXml(title),
          link: cleanXml(link),
          description: cleanXml(description),
          pubDate: cleanXml(pubDate)
        });
      }
      return items;
    } catch (e) {
      console.error(`Failed to fetch CWA RSS from ${url}:`, e);
      return [];
    }
  }

  function cleanXml(str: string): string {
    return str
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .trim();
  }

  // API Route: Real-time CWA Severe Weather & Earthquake RSS Proxy
  app.get("/api/cwa-alerts", async (req, res) => {
    try {
      const severeRss = "https://www.cwa.gov.tw/rss/warning/severe.xml";
      const earthquakeRss = "https://www.cwa.gov.tw/rss/earthquake.xml";

      const [severeList, eqList] = await Promise.all([
        fetchCwaRss(severeRss),
        fetchCwaRss(earthquakeRss)
      ]);

      res.json({
        warnings: severeList.slice(0, 5),
        earthquakes: eqList.slice(0, 5)
      });
    } catch (error: any) {
      console.error("Failed to load CWA alerts in router:", error);
      res.json({ warnings: [], earthquakes: [] });
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
