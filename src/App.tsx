import React, { useState } from 'react';
import { 
  ShieldAlert, AlertCircle, CloudLightning, HeartPulse, UserCircle2, 
  MapPin, Loader2, Send, CloudRainWind, Activity, ArrowRight, FileText,
  Home, Clock, Phone, Sparkles, Check, Key, Eye, EyeOff,
  Bike, AlertTriangle, Zap, Sun, Calendar, Compass
} from 'lucide-react';
import { SuppliesInventory } from './components/SuppliesInventory';
import { defaultSupplies } from './data';
import type { FamilyProfile, AIAnalysisResult, SupplyItem } from './types';
import { analyzeRisk, sendChatMessage, analyzeEnvironment } from './services/api';

export default function App() {
  const [location, setLocation] = useState('嘉義市中山路199號');
  const [familyProfile, setFamilyProfile] = useState<FamilyProfile>({
    hasToddler: false,
    hasElderly: false,
    hasChronicIllness: false,
    hasMobilityIssues: false,
    hasDeliveryRider: false,
  });
  
  const [activeScenario, setActiveScenario] = useState<'normal' | 'typhoon' | 'rain' | 'earthquake'>('normal');
  const [selectedSuspensionRegion, setSelectedSuspensionRegion] = useState<'north' | 'central' | 'south' | 'east'>('north');
  const [environmentDesc, setEnvironmentDesc] = useState('');
  const [supplies, setSupplies] = useState<SupplyItem[]>(defaultSupplies);
  const [memberCount, setMemberCount] = useState<number>(2); // Default to two-person household

  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem("custom_gemini_key") || "");
  const [showApiKey, setShowApiKey] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingEnv, setIsAnalyzingEnv] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'supplies' | 'chat'>('supplies');

  const handleSaveApiKey = (newKey: string) => {
    setCustomApiKey(newKey);
    const trimmed = newKey.trim();
    if (trimmed) {
      localStorage.setItem("custom_gemini_key", trimmed);
    } else {
      localStorage.removeItem("custom_gemini_key");
    }
  };

  const handleProfileChange = (key: keyof FamilyProfile) => {
    setFamilyProfile(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAnalyzeEnvironment = async () => {
    if (!location.trim()) return;
    setIsAnalyzingEnv(true);
    try {
      const data = await analyzeEnvironment(location);
      setEnvironmentDesc(data.environmentDesc);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "地址分析失敗，請確認輸入有效並稍後再試。");
    } finally {
      setIsAnalyzingEnv(false);
    }
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert("您的瀏覽器不支援 GPS 定位服務。");
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Fetch from Nominatim reverse geocoding API to get a real-world address in Taiwan
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=zh-TW`
          );
          if (!response.ok) {
            throw new Error("網路連線異常，無法完成反向地理編碼");
          }
          const data = await response.json();
          let taiwanAddress = "";
          if (data && data.address) {
            const addr = data.address;
            const city = addr.city || addr.town || addr.county || "";
            const suburb = addr.suburb || addr.village || addr.neighbourhood || "";
            const road = addr.road || addr.pedestrian || "";
            const houseNumber = addr.house_number ? `${addr.house_number}號` : "";
            
            // Construct address manually for clean, readable output
            taiwanAddress = `${city}${suburb}${road}${houseNumber}`;
          }
          
          if (!taiwanAddress && data && data.display_name) {
            taiwanAddress = data.display_name;
          }
          
          if (taiwanAddress) {
            // Clean up lead zip code numbers if they exist
            taiwanAddress = taiwanAddress.replace(/^\d+/, '').trim();
            setLocation(taiwanAddress);
          } else {
            setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          }
        } catch (err) {
          console.error("Geolocation reverse geocode failed:", err);
          setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMsg = "無法獲取定位。";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "獲取定位失敗：使用者拒絕提供 GPS 定位權限。請在瀏覽器設定中允許此網站的定位權限。";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "獲取定位失敗：因訊號或網路問題無法辨識當前位置。";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "獲取定位失敗：定位超時。";
        }
        alert(errorMsg);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleAnalyze = async () => {
    if (!location.trim()) return;
    setIsAnalyzing(true);
    try {
      let currentEnv = environmentDesc;
      
      // Auto-extract environment if empty
      if (!currentEnv.trim()) {
        setIsAnalyzingEnv(true);
        try {
          const data = await analyzeEnvironment(location);
          currentEnv = data.environmentDesc;
          setEnvironmentDesc(currentEnv);
        } catch (envErr) {
          console.error("Auto env analysis failed, falling back to empty:", envErr);
        } finally {
          setIsAnalyzingEnv(false);
        }
      }

      const missingItems = supplies.filter(s => !s.hasIt).map(s => s.name);
      const data = await analyzeRisk(location, familyProfile, currentEnv, missingItems);
      setAnalysisResult(data);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "分析失敗，請稍後再試。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatMessage("");
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    
    setIsChatting(true);
    try {
      const data = await sendChatMessage({
        message: userMsg,
        familyProfile,
        location,
        environmentDesc,
        currentRisk: analysisResult?.disasterRisk?.level || '未知'
      });
      setChatHistory(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'ai', text: "很抱歉，處理您的問題時發生錯誤。" }]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleExportOffline = () => {
    if (!analysisResult) return;
    const missingList = supplies.filter(s => !s.hasIt).map(s => `[ ] ${s.name}`).join('\n');
    
    let shelterText = "無特定建議，建議前往所在里鄰之防災自救點";
    if (analysisResult.shelterGuidance) {
      const options = analysisResult.shelterGuidance.nearestOptions?.map((o, idx) => `${idx + 1}. ${o}`).join('\n') || '';
      const criteria = analysisResult.shelterGuidance.safetyCriteria?.map((c) => `- ${c}`).join('\n') || '';
      shelterText = `${options}\n\n安全避難指引方向：\n${criteria}`;
    }

    const text = `
【防災整備與居住生活卡】
=======================================
防災目標地點：${location}
家庭防護配置：${memberCount} 人份整備
環境特徵描述：${environmentDesc || '無'}
當前風險等級：${analysisResult.disasterRisk.level === 'High' ? '🔴高風險' : analysisResult.disasterRisk.level === 'Medium' ? '🟡中度風險' : '🟢低風險'}
停班停課預估：${analysisResult.suspensionIndicator.level}度挑戰
- 預判理由：${analysisResult.suspensionIndicator.reasons.join('；')}

${analysisResult.deficiencyAnalysis ? `【🚨 安全漏洞與整備缺點診斷】
脆弱點：
${analysisResult.deficiencyAnalysis.weaknesses.map((w, i) => `${i + 1}. ${w}`).join('\n')}
改善建議：
${analysisResult.deficiencyAnalysis.improvements.map((imp, i) => `${i + 1}. ${imp}`).join('\n')}

` : ''}【指定緊急撤離避難處所】
${shelterText}

【優先行動 (立即執行)】
${analysisResult.actionableTimeline.immediate.map((item, i) => `${i + 1}. ${item}`).join('\n')}

【未來 24 小時持續跟進】
${analysisResult.actionableTimeline.next24h.map((item, i) => `${i + 1}. ${item}`).join('\n')}

【家庭特殊關懷與通報】
${analysisResult.familyCare.map((item, i) => `* ${item}`).join('\n')}

【目前待補齊的避難物資】
${missingList || '所有物資皆已備妥！'}

【緊急連絡通報指南】
- 火警/救護急救：撥打 119
- 警政報案專線：撥打 110
- 無基地台卡求救：撥打 112
- 防災平安專線：撥打 1991 (與家人事先約定好此平台互聽留言)
=======================================
(提示：可複製本段落至手機離線備忘錄或傳送至家庭群組，以備風雨斷網期間能隨時參閱)
`;
    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSelectScenario = (scenario: 'normal' | 'typhoon' | 'rain' | 'earthquake') => {
    setActiveScenario(scenario);
    if (scenario === 'normal') {
      setLocation('台北市信義區信義路五段7號');
      setEnvironmentDesc('該位置位於台北盆地核心地帶，排水設施相對完善，平時無土石流或順向坡威脅。主要防範偶發性的短時強降雨積淹水，以及都市高樓大廈強烈地震時的物品掉落。');
      setFamilyProfile({
        hasToddler: false,
        hasElderly: false,
        hasChronicIllness: false,
        hasMobilityIssues: false,
        hasDeliveryRider: false
      });
      setAnalysisResult(null);
    } else if (scenario === 'typhoon') {
      setLocation('基隆市中正區壽山路');
      setEnvironmentDesc('該位置位於基隆丘陵地區與近海岸一帶，迎風面強烈陣風顯著。沿海有強浪、潮位升高威脅。周圍部分巷道狹窄且坡度起伏大，颱風侵襲時需嚴防山區強風共振、老舊公寓遮雨棚或招牌脫落、以及低窪處雨水下滲積淹水。');
      setFamilyProfile({
        hasToddler: false,
        hasElderly: true,
        hasChronicIllness: false,
        hasMobilityIssues: false,
        hasDeliveryRider: true
      });
      setAnalysisResult({
        disasterRisk: {
          level: "High",
          summary: "全台海上陸上強烈颱風警備中。基隆市列入陸上警戒範圍，外圍環流已造成大浪與持續巨風，傍晚起風雨急劇攀升，需強烈防範強烈風雨以及沿海倒灌。",
          factors: [
            { name: "強風暴風威脅", riskLevel: "🔴極高風險 (12-14 級暴風)" },
            { name: "地質與淹水潛勢", riskLevel: "🟡注意防範 (沿海低窪倒灌)" },
            { name: "交通工作安防", riskLevel: "🔴高危險 (外送平台即將強制斷單)" }
          ]
        },
        suspensionIndicator: {
          level: "高",
          reasons: [
            "基隆市與大台北暴風圈侵襲機率達 95%",
            "氣象署風雨預報已達全天停班課標準，工務應急小組啟動，平台停班起將強制關閉載點"
          ]
        },
        familyCare: [
          "長輩防護與生活守護：長輩在狂風暴雨中容易受到驚嚇或誘發血壓不穩，請預置好常用降血壓處方藥，並保證走道與床邊有充足的感應式手電筒、不斷電應急燈防範斷電跌倒。",
          "外送員與外勤哨兵防護：受颱風肆虐，機慢車極易因側風偏離或人車失控打滑，全台外送平台依法即將停止服務，在宣告停班前也請自主暫停派單，切忌在 10 級以上陣風中強行騎乘機車！"
        ],
        bagRecommendations: [
          "由於您目前確認缺少［行動電源］，強烈提醒：颱風天極易因斷樹、招牌傾倒壓入配電盤造成大規模停電，缺少行動電源將導致手機通訊、防災快報獲取中斷。急需在風雨轉強前預先備妥已充飽的 2 萬毫安培小時行動電源！",
          "確保家庭應急飲用水儲備、每人每天 3L，並補齊窗戶防風貼、膠帶，提前完成固定防颱。"
        ],
        actionableTimeline: {
          immediate: [
            "立刻巡視廚房、房間門窗，貼好防爆膠帶，並清理陽台盆栽排水孔。",
            "立刻將長輩日常藥品、熱水瓶、收音機移動至容易取得之避難安全角落，並預先將行動裝置充飽電。"
          ],
          next24h: [
            "持續跟進基隆市與北北基午後或明晨是否停班停課特報，嚴禁靠近基隆港、潮境公園觀浪。",
            "避難包置於門口處。若一樓或室外開始出現溢水，切勿外出涉水，應迅速向二樓以上進行垂直避難。"
          ]
        },
        shelterGuidance: {
          nearestOptions: [
            "基隆市中正國民小學（中正區義二路128號）- 適用強震防風收容避難",
            "中正區里民活動中心（應急防災自救中心）- 適用物資臨時自救與餐食調度"
          ],
          safetyCriteria: [
            "疏散避難時切勿撐傘（易受巨風折斷刺傷或拉扯跌倒），應穿著合身雨衣與硬底鞋。",
            "外勤或撤離行經騎樓時嚴防掉落的鐵皮招牌或空調外機，強風阻力大時請就近在水泥鋼筋建築內避風避雨。"
          ]
        },
        deficiencyAnalysis: {
          weaknesses: [
            "缺少關鍵［行動電源］：在颱風天極易遇到大範圍強風折斷電線桿導致停電狀況。若無儲備足夠之行動電源，手機通訊及最新災害預警公告獲取將立即陷入癱瘓。",
            "外送員車輛防磨與防滑低落：颱風停班宣告前，依舊有出勤想法，但未全面檢測輪胎紋深度。在10級強陣風中極易遭遇偏離打滑摔車致命威脅。"
          ],
          improvements: [
            "在強風雨登陸前，預備並充飽至少 2 組 25,000mAh 大容量行動電源，確保 72 小時不斷網不斷電訊號。",
            "應自主落實風力監測：一旦本市宣布停班停課或陣風判定超標，外送人員配合平臺管制強制關閉下單，杜絕涉水外派冒險。"
          ]
        }
      });
    } else if (scenario === 'rain') {
      setLocation('嘉義縣阿里山鄉樂野村71號');
      setEnvironmentDesc('該位置位處阿里山山區，地勢險峻坡度大，屬典型土石流高潛勢地帶。連日梅雨鋒面侵襲下，泥土含水量已趨近飽和，極易造成野溪水位暴漲、道路坍方落石或部分連外橋樑預警性管制中斷。');
      setFamilyProfile({
        hasToddler: false,
        hasElderly: true,
        hasChronicIllness: true,
        hasMobilityIssues: true,
        hasDeliveryRider: false
      });
      setAnalysisResult({
        disasterRisk: {
          level: "High",
          summary: "滯留鋒面導致大豪雨特報。阿里山鄉累積雨量已突破 350 毫米，達到紅色土石流警戒，需警惕山崩與低窪溪流溢堤。",
          factors: [
            { name: "土石流與山崩風險", riskLevel: "🔴極高風險 (紅色土石流警戒區)" },
            { name: "淹水與道路通阻", riskLevel: "🔴高淹水與土石阻斷 (蘇花/阿里山多處管制)" },
            { name: "全島大氣對流", riskLevel: "🟡注意防範 (西南部顯著雷擊與強強陣雨)" }
          ]
        },
        suspensionIndicator: {
          level: "高",
          reasons: [
            "嘉義縣山區（包含阿里山鄉）累積雨量已達停班停課法定基準（豪雨等級以上且山區道路坍方）",
            "為防範上學、通勤遭遇土石坍方，縣政府已宣布全鄉停班停課處置"
          ]
        },
        familyCare: [
          "長輩與行動特慢家人照護：因山區可能面臨連外道路中斷、停電與慢性藥品短缺。高齡長者與慢性病患需預先核對處方藥量，保證未來至少 7-10 天不斷藥，並在土石流紅警戒時跟隨鄉公所的撤離疏散專車進行預警性安全撤離，切勿拖延致夜間斷網斷路無法搜救。"
        ],
        bagRecommendations: [
          "由於缺乏［常備藥物］，這是山區面臨長時間受困孤島效應時的致命威脅。務必今天前往合約藥局或衛生所，憑慢性病處方簽預先備齊心血管或降血糖之必備藥，並用拉鍊袋密封儲放於防災包中！"
        ],
        actionableTimeline: {
          immediate: [
            "立刻配合村長與防災小組疏散，攜帶慢性處方藥、證件，前往樂野避難收容點。",
            "備齊備用照明設施（如手電筒）並維持全家通訊群組暢通，告知山下親友安全撤離進度。"
          ],
          next24h: [
            "禁止在土石坍方或急湍溪流沿線逗留，切勿在夜間或暴雨降水正烈時自行摸黑跨越危險崩塌路段。",
            "撤離到避難中心後，聽從民政人員物資供應、定時進食、注意室溫保暖以防山區低溫失溫。"
          ]
        },
        shelterGuidance: {
          nearestOptions: [
            "阿里山鄉樂野活動中心（預警收容特定安全避難所）- 適用土石流預警撤離",
            "達邦國小體育館（緊急避難集中點）- 適用物資救援空投及醫療人員駐點"
          ],
          safetyCriteria: [
            "避難路線應避開大溪流支流高水流點，注意頭部安全防範落石砸傷，一律往垂直於泥石流流動方向之高度撤避。",
            "若行經路面積水或土砂覆蓋，嚴格禁止徒步涉水跨越，泥流 15 公分以上即可捲走成年人。"
          ]
        },
        deficiencyAnalysis: {
          weaknesses: [
            "缺少重要［常備及慢性病藥物］：山區土石流高潛勢地帶，暴雨易造成「受困孤島效應」。若長者慢性病用藥不全，面臨斷藥及救護車因道路中斷無法抵達的嚴重生命威脅。",
            "避難行動垂直與水平判斷遲緩：家有重病、行動不便與高齡長輩，在土石流紅警戒時若仍留在一樓或試圖深夜摸黑隨直覺自行下山，極易因道路坍方、急流受困跌倒。"
          ],
          improvements: [
            "在大型鋒面或梅雨大豪雨登陸前，務必前往合約診所預備 14 天份的慢性病處方藥，多重夾鏈密封放置防災包。",
            "果斷執行「白天預警撤離」：一收到鄉公所或村長黃、紅土石流撤警通知，乘白晝安全時段跟隨民政安置專車撤往樂野中心，堅決反對深夜涉水。"
          ]
        }
      });
    } else if (scenario === 'earthquake') {
      setLocation('花蓮縣花蓮市中正路555號');
      setEnvironmentDesc('該位置位於花蓮市鬧區，靠近美崙斷層帶，地震潛勢極高。區內有部分屋齡較高之多層集合住宅或老舊住辦混合透天，強震時需防範結構共振、一樓軟弱層（軟腳蝦效應）變形、以及室內大型置物櫃傾倒或高壓變電箱墜落阻礙通道。');
      setFamilyProfile({
        hasToddler: true,
        hasElderly: false,
        hasChronicIllness: false,
        hasMobilityIssues: false,
        hasDeliveryRider: false
      });
      setAnalysisResult({
        disasterRisk: {
          level: "High",
          summary: "東部外海發生規模 6.2 強烈有感地震，花蓮最大震度達 5 強。地震餘震密集，可能伴隨路面結構開裂、高架橋梁安全檢測，72小時內嚴防強烈餘震。",
          factors: [
            { name: "主震與強餘震威脅", riskLevel: "🔴極高風險 (震度5強、餘震不斷)" },
            { name: "老舊房屋結構安全", riskLevel: "🔴極高風險 (結構受損與軟弱層崩解)" },
            { name: "水電與生命線中斷", riskLevel: "🟡注意防範 (局部停水停電搶修中)" }
          ]
        },
        suspensionIndicator: {
          level: "中",
          reasons: [
            "花蓮部分受損或有倒塌隱患學校已緊急宣布停課進行結構安全全面勘查",
            "上班通勤大致照常，但連外鐵道路段與蘇花公路有多處落石封閉，通勤應避開隧道與落石區"
          ]
        },
        familyCare: [
          "幼兒安全防護提醒：強震與餘震的不斷搖晃極易使幼兒陷入極度恐慌啼哭。請預備好嬰童應急避難毛毯、可保久奶粉及嬰兒安撫玩具，家長務必保持冷靜以防恐慌情緒傳染。地震時優先用身體或厚棉被遮蓋嬰兒頭部，避免墜落的吊燈、玻璃碎片造成外傷。"
        ],
        bagRecommendations: [
          "由於缺乏［手電筒］，在強烈地震斷電、夜間完全無照明時，室內倒塌家具、傾側櫃體、滿地玻璃碎片將成為嚴重割傷與絆倒傷害的致命殺手。請務必在房門口、床頭常備免打火的手電筒或緊急手搖照明燈！"
        ],
        actionableTimeline: {
          immediate: [
            "立刻檢查居家瓦斯、總電源開關，若有火源即刻關閉，並將大門稍微開啟定位避免因震動變形卡死無法逃生。",
            "將高地易碎置物卸下、大型電器落地防跌落，並檢查玄關逃生動線是否被鞋櫃、雜物擋住。"
          ],
          next24h: [
            "嚴禁搭乘電梯！下樓應走普通安全爬梯。隨時注意花蓮連外公路管制快報與台鐵列車慢行或停駛公告。",
            "睡覺時床頭邊放置厚膠底工作鞋。若再次遭遇強烈搖晃，依據『趴下、掩護、穩住』防震三要素進行就地避難。"
          ]
        },
        shelterGuidance: {
          nearestOptions: [
            "花蓮市防災公園小巨蛋（達明路體育場）- 適用大面積空曠安防地震避難與安全野營",
            "花蓮高級工業職業學校（中正路大操場）- 開放寬敞空地作為醫療直升機降想定點"
          ],
          safetyCriteria: [
            "離開建築物撤離時，請使用安全帽或隨身皮包、厚外套保護頭部，避開外牆剝落的大理石、冷氣室外機及電線杆。",
            "避難方向堅持一律往大面積空曠地、防災公園撤離，切勿在兩側多為高聳玻璃帷幕大樓的狹小巷弄內逗留。"
          ]
        },
        deficiencyAnalysis: {
          weaknesses: [
            "缺少核心配備［手電筒］：強烈地震極易引發大區域變電箱墜毀與跳電斷電。若全室漆黑、重型家具倒塌、地表布滿玻璃碎片，缺少照明將極大概率引發割傷、踩空或家具二次壓傷骨折。",
            "幼兒抱持逃生逃生路線遭鞋物堆積：玄關及主要走廊堆放非固定鞋櫃與空盒雜物，晃動摔倒將完全堵塞出口，延誤寶貴的黃金避震開門逃生時間。"
          ],
          improvements: [
            "房門內側、客廳及床頭一律配置插座式或感應式免握應急手電筒，確保一斷電即刻取得光明。",
            "立刻清理出門逃生寬度至少 90 公分之淨空通道，家庭重型電器或玻璃掛件予以 L 型鐵件防倒固定處理。"
          ]
        }
      });
    }
  };

  const regions = [
    { id: 'north', name: '北部地區' },
    { id: 'central', name: '中部地區' },
    { id: 'south', name: '南部地區' },
    { id: 'east', name: '東部與離島' }
  ] as const;

  const getSuspensionStatus = (region: 'north' | 'central' | 'south' | 'east') => {
    if (activeScenario === 'normal') {
      return {
        counties: region === 'north' ? ['基隆市', '台北市', '新北市', '桃園市', '宜蘭縣'] :
                  region === 'central' ? ['台中市', '苗栗縣', '彰化縣', '南投縣'] :
                  region === 'south' ? ['高雄市', '台南市', '嘉義縣', '屏東縣'] :
                  ['花蓮縣', '台東縣', '澎湖縣', '金門縣'],
        status: '🟢 照常上班上課',
        class: 'text-emerald-750 bg-emerald-50/70 border-emerald-200'
      };
    }
    if (activeScenario === 'typhoon') {
      if (region === 'north' || region === 'east') {
         return {
           counties: region === 'north' ? ['基隆市 🔴 停班停課', '台北市 🔴 停班停課', '新北市 🔴 停班停課', '桃園市 🔴 停班停課', '宜蘭縣 🔴 停班停課'] : ['花蓮縣 🔴 停班停課', '台東縣 🔴 停班停課'],
           status: '🔴 停止上班上課',
           class: 'text-red-700 bg-red-50 border-red-200'
         };
      }
      return {
        counties: region === 'central' ? ['台中市 🟡 照常 (防強風)', '彰化縣 🟡 照常', '南投縣 🟡 照常'] : ['高雄市 🟡 照常 (防豪雨)', '台南市 🟡 照常'],
        status: '🟡 照常上班上課 (防強風環流)',
        class: 'text-amber-700 bg-amber-50 border-amber-250'
      };
    }
    if (activeScenario === 'rain') {
      if (region === 'south') {
        return {
          counties: ['嘉義縣 🔴 阿里山停班課', '高雄市 🟡 山區預警停班課', '台南市 🟢 照常', '屏東縣 🟢 照常'],
          status: '🟡 部分停班停課 (山區土石警戒)',
          class: 'text-amber-700 bg-amber-50 border-amber-250'
        };
      }
      if (region === 'central') {
        return {
          counties: ['南投縣 🟡 部分山區停課', '台中市 🟢 照常', '苗栗縣 🟢 照常'],
          status: '🟡 部分停班停課',
          class: 'text-amber-700 bg-amber-50 border-amber-250'
        };
      }
      return {
        counties: region === 'north' ? ['台北市 🟢 照常', '新北市 🟢 照常', '宜蘭縣 🟢 照常'] : ['花蓮縣 🟢 照常', '台東縣 🟢 照常'],
        status: '🟢 照常上班上課',
        class: 'text-emerald-750 bg-emerald-50/70 border-emerald-250'
      };
    }
    if (activeScenario === 'earthquake') {
      if (region === 'east') {
        return {
          counties: ['花蓮縣 🔴 部分校舍傾斜停課', '台東縣 🟢 照常'],
          status: '🟡 局部停班停課 (強震安全校檢)',
          class: 'text-amber-705 bg-amber-50 border-amber-250'
        };
      }
      return {
        counties: region === 'north' ? ['台北市 🟢 正常', '新北市 🟢 正常', '桃園市 🟢 正常'] :
                  region === 'central' ? ['台中市 🟢 正常', '南投縣 🟢 正常'] : ['高雄市 🟢 正常', '台南市 🟢 正常'],
        status: '🟢 照常上班上課',
        class: 'text-emerald-750 bg-emerald-50/70 border-emerald-250'
      };
    }
    return { counties: [], status: '🟢 照常上班與上課', class: 'text-emerald-750 bg-emerald-50/50 border-emerald-200' };
  };

  const isHighRisk = analysisResult?.disasterRisk?.level === '🔴高風險' || analysisResult?.disasterRisk?.level === 'High';
  const headerBgClass = isHighRisk 
    ? 'bg-[#7f1d1d] border-b border-[#631414] text-white shadow-md' 
    : 'bg-white/80 backdrop-blur-md border-b border-stone-200/80 text-stone-900 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)]';
  const headerIconClass = isHighRisk ? 'text-white' : 'text-[#7f1d1d]';

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-stone-800 font-sans selection:bg-[#7f1d1d]/10 selection:text-[#7f1d1d]">
      <header className={`sticky top-0 z-30 transition-all duration-300 ${headerBgClass}`}>
        <div className="max-w-[1500px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg flex items-center justify-center transition-transform hover:scale-105 duration-300 ${isHighRisk ? 'bg-white/15' : 'bg-stone-100 border border-stone-200/50'}`}>
              <ShieldAlert className={`w-5 h-5 ${headerIconClass}`} />
            </div>
            <div>
              <h1 className={`text-base sm:text-lg font-bold tracking-widest ${isHighRisk ? 'text-white' : 'text-stone-900 font-display'}`}>
                災防整合與家戶整備守護系統
              </h1>
              <p className={`text-[10px] hidden sm:block ${isHighRisk ? 'text-stone-300/90' : 'text-stone-500'} font-medium tracking-wider mt-0.5`}>
                NATIONAL HOUSEHOLD SYSTEM FOR DISASTER PREPAREDNESS & INTEL 
              </p>
            </div>
          </div>
          {isHighRisk ? (
            <div className="flex items-center gap-2 bg-[#6b1812] px-4 py-1.5 rounded-full border border-white/20 animate-pulse">
               <div className="w-2 h-2 rounded-full bg-red-400" />
               <span className="font-extrabold text-white tracking-widest text-[11px]">全台高風險警戒連線</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200/60">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
               <span className="font-bold text-emerald-800 tracking-wider text-xs">即時守護中</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {/* Static Hosting Warning Banner */}
        {(() => {
          const isStaticHost = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');
          if (isStaticHost && !customApiKey) {
            return (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-none">
                <div className="w-9 h-9 rounded bg-amber-100/80 flex items-center justify-center shrink-0 border border-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-700 font-extrabold" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-extrabold text-[#7f1d1d] tracking-wide">⚠️ 檢測至目前運行於 GitHub Pages 等靜態託管環境</h4>
                  <p className="text-xs text-stone-600 font-semibold leading-relaxed mt-0.5">
                    由於靜態託管無運作後端伺服器 (Server)，若需使用完整的 <strong className="text-stone-850 font-bold">AI 災害評估、地質分析及對話諮詢</strong>，請於左下角「金鑰與位置設定」中貼上您的個人 <strong className="text-[#7f1d1d] font-extrabold">Gemini API 金鑰 (API Key)</strong>。系統將啟動安全的專屬前端直連通道，讓您直接向 Google API 獲得頂尖防災分析！
                  </p>
                </div>
              </div>
            );
          }
          return null;
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Sidebar: Controls & Settings */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
            <div className="space-y-6">
              <div className="bg-white/50 border border-stone-200/50 rounded-2xl p-4.5">
                <h2 className="text-lg font-bold text-stone-900 tracking-wider mb-1 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-[#7f1d1d] block rounded-full shrink-0"></span>
                  家戶特徵與空間設定
                </h2>
                <p className="text-sm text-stone-600 leading-relaxed font-semibold">配置您確實的居住位置與家人狀態，系統將透過地理潛勢模型為您客製專屬的安心生活指引。</p>
              </div>

              {/* API Key settings card */}
              <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.02)] transition-all hover:border-stone-300 hover:shadow-[0_4px_12px_-3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2.5">
                  <h3 className="text-xs font-extrabold text-stone-700 flex items-center gap-2 uppercase tracking-wide">
                     <Key className="w-4 h-4 text-[#7f1d1d]" />
                     AI 核心智慧引擎設定
                  </h3>
                  <span className="text-[9px] bg-red-50 text-[#7f1d1d] font-mono font-bold px-1.5 py-0.5 rounded border border-red-200/20">REQUIRED</span>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-stone-600 leading-relaxed font-semibold">
                    此應用程式需配置个人的 <strong className="text-stone-750 font-extrabold">Gemini API Key</strong> 才能執行高度精準的 AI 災害及地理分析：
                  </p>
                  
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={customApiKey}
                      onChange={(e) => handleSaveApiKey(e.target.value)}
                      placeholder="請在此貼上您的 Gemini API Key (AI_...)"
                      className="w-full bg-stone-50/50 hover:bg-stone-50 focus:bg-white border border-stone-200 rounded-lg pl-3 pr-10 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-all font-mono placeholder:text-stone-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 select-none cursor-pointer p-1"
                    >
                      {showApiKey ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1 px-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${customApiKey ? "bg-emerald-500 animate-pulse" : "bg-red-500 animate-pulse"}`} />
                      <span className="text-[10px] font-extrabold text-stone-500 tracking-wider">
                        {customApiKey ? "個人金鑰運作中" : "尚未填寫 API 金鑰（AI 停用中）"}
                      </span>
                    </div>
                    {customApiKey && (
                      <button
                        type="button"
                        onClick={() => handleSaveApiKey("")}
                        className="text-[11px] font-extrabold text-[#7f1d1d] hover:underline cursor-pointer"
                      >
                        清空金鑰
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.02)] transition-all hover:border-stone-300 hover:shadow-[0_4px_12px_-3px_rgba(0,0,0,0.04)]">
                <h3 className="text-xs font-extrabold text-stone-700 flex items-center gap-2 mb-3 tracking-wide uppercase border-b border-stone-100 pb-2.5">
                  <MapPin className="w-4 h-4 text-[#7f1d1d]" />
                  居住區域/目標位置
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="請輸入地址、鄉鎮或地標..."
                      className="w-full bg-stone-50/50 hover:bg-stone-50 focus:bg-white border border-stone-200 rounded-lg pl-3 pr-10 py-2.5 text-stone-900 text-base focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-all font-semibold"
                    />
                    <button
                      type="button"
                      onClick={handleGeolocate}
                      disabled={isLocating}
                      title="使用 GPS 自動定位"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-stone-200/60 text-[#7f1d1d] hover:text-stone-950 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isLocating ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#7f1d1d]" />
                      ) : (
                        <Compass className="w-4 h-4 hover:scale-105 duration-200 transition-transform" />
                      )}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleGeolocate}
                      disabled={isLocating || isAnalyzingEnv}
                      className="select-none border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 rounded-lg py-2 px-3 text-sm font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-none cursor-pointer"
                    >
                      {isLocating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7f1d1d]" />
                          <span>讀取 GPS...</span>
                        </>
                      ) : (
                        <>
                          <Compass className="w-3.5 h-3.5 text-[#7f1d1d] shrink-0" />
                          <span>GPS 定位</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleAnalyzeEnvironment}
                      disabled={isAnalyzingEnv || isLocating || !location.trim()}
                      className="relative overflow-hidden group select-none border border-stone-200 bg-[#f4f1eb]/60 hover:bg-[#f4f1eb] text-stone-750 rounded-lg py-2 px-3 text-sm font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-none cursor-pointer"
                    >
                      {isAnalyzingEnv ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7f1d1d]" />
                          <span>分析中...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-[#7f1d1d] group-hover:scale-110 transition-transform shrink-0" />
                          <span>地理分析</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Environment */}
              <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.02)] transition-all hover:border-stone-300 hover:shadow-[0_4px_12px_-3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2.5">
                  <h3 className="text-xs font-extrabold text-stone-700 flex items-center gap-2 tracking-wide uppercase">
                    <Home className="w-4 h-4 text-[#7f1d1d]" />
                    居住環境特點描述
                  </h3>
                  {isAnalyzingEnv && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7f1d1d] shrink-0" />}
                </div>
                <div className="flex flex-col gap-2.5">
                  <textarea
                    value={environmentDesc}
                    onChange={(e) => setEnvironmentDesc(e.target.value)}
                    placeholder="點擊「地理分析」自主取得環境。此描述是 AI 計算排水、坡度落石風險的重要參考依據..."
                    className="w-full bg-stone-50/50 hover:bg-stone-50 focus:bg-white border border-stone-200 rounded-lg px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-all placeholder:text-stone-400 font-semibold resize-none h-28"
                  />
                  {!environmentDesc && (
                    <div className="text-[11px] font-bold text-[#7f1d1d] flex items-center gap-1.5 bg-[#7f1d1d]/5 p-2 rounded border border-[#7f1d1d]/10">
                      <Sparkles className="w-3.5 h-3.5 text-[#7f1d1d] shrink-0 animate-pulse" />
                      <span>提示：若空置，分析時將依選址自動探測補齊</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Family */}
              <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.02)] transition-all hover:border-stone-300 hover:shadow-[0_4px_12px_-3px_rgba(0,0,0,0.04)]">
                <h3 className="text-xs font-extrabold text-stone-700 flex items-center gap-2 mb-3 tracking-wide uppercase border-b border-stone-100 pb-2.5">
                  <HeartPulse className="w-4 h-4 text-[#7f1d1d]" />
                  特殊關懷照顧對象 (複選)
                </h3>
                <div className="flex flex-col gap-2">
                  {[
                    { key: 'hasToddler', label: '👶 嬰幼兒成員', desc: '需要保久奶粉、尿布與專屬物資' },
                    { key: 'hasElderly', label: '👴 高齡長者家人', desc: '行動慢、須備足慢性處方藥與手電筒' },
                    { key: 'hasChronicIllness', label: '💊 慢性病友成員', desc: '藥品防潮密封、依賴保冷或不斷電設備' },
                    { key: 'hasMobilityIssues', label: '♿ 行動不便者', desc: '須提早進行垂直或水平避難撤離' },
                    { key: 'hasDeliveryRider', label: '🛵 外送/外勤人員', desc: '強風雨道路出勤安全、停班強制防護' },
                  ].map((item) => {
                    const checked = familyProfile[item.key as keyof FamilyProfile];
                    return (
                      <label key={item.key} className={`cursor-pointer flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                        checked 
                          ? 'bg-rose-50/40 border-[#7f1d1d]/40 shadow-[0_2px_8px_-3px_rgba(127,29,29,0.1)] translate-x-1' 
                          : 'bg-white border-stone-200/80 hover:border-stone-300 hover:bg-stone-50/50'
                      }`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleProfileChange(item.key as keyof FamilyProfile)}
                          className="hidden"
                        />
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition-all duration-200 ${
                          checked ? 'bg-[#7f1d1d] border-[#7f1d1d] text-white scale-105 shadow-xs' : 'bg-white border-stone-300'
                        }`}>
                          {checked && <Check className="w-3 h-3 text-white" strokeWidth={3.5} />}
                        </div>
                        <div className="flex flex-col select-none">
                          <span className={`text-[15px] font-bold transition-colors ${checked ? 'text-[#7f1d1d]' : 'text-stone-750'}`}>{item.label}</span>
                          <span className="text-[13px] text-stone-500 mt-0.5 leading-snug font-semibold">{item.desc}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !location}
              className="w-full relative overflow-hidden group bg-[#7f1d1d] hover:bg-[#631414] text-white rounded-xl py-4 px-6 font-bold text-base transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(127,29,29,0.15)] hover:shadow-[0_6px_16px_rgba(127,29,29,0.25)] cursor-pointer"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                  <span className="tracking-widest">探測水文與坡降潛勢中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  <span className="tracking-widest">啟動生活防災與居住安全評估</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 opacity-80 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* 防災緊急聯絡與平安機制 */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.025)] space-y-4">
              <h3 className="text-xs font-extrabold text-stone-700 flex items-center gap-2 tracking-wide uppercase border-b border-stone-100 pb-2.5">
                <Phone className="w-4 h-4 text-[#7f1d1d]" />
                <span>全台緊急通報專線</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <a href="tel:119" className="bg-[#7f1d1d]/5 hover:bg-[#7f1d1d]/10 border border-[#7f1d1d]/20 hover:border-[#7f1d1d]/30 p-2.5 rounded-xl flex flex-col justify-between transition-colors cursor-pointer group">
                  <span className="font-bold text-stone-500 text-[10px] tracking-wide">災情火警、急救</span>
                  <span className="text-base font-extrabold text-[#7f1d1d] mt-1 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">119 <span className="text-[10px] font-normal">📞</span></span>
                </a>
                <a href="tel:110" className="bg-[#7f1d1d]/5 hover:bg-[#7f1d1d]/10 border border-[#7f1d1d]/20 hover:border-[#7f1d1d]/30 p-2.5 rounded-xl flex flex-col justify-between transition-colors cursor-pointer group">
                  <span className="font-bold text-stone-500 text-[10px] tracking-wide">警政治安報案</span>
                  <span className="text-base font-extrabold text-[#7f1d1d] mt-1 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">110 <span className="text-[10px] font-normal">📞</span></span>
                </a>
                <a href="tel:112" className="bg-stone-50 hover:bg-stone-100/80 border border-stone-200 p-2.5 rounded-xl flex flex-col justify-between transition-colors cursor-pointer group">
                  <span className="font-bold text-stone-500 text-[10px] tracking-wide">無基地台卡求救</span>
                  <span className="text-sm font-extrabold text-stone-800 mt-1 flex items-center gap-1">112 <span className="text-[10px] font-medium text-stone-400">緊急</span></span>
                </a>
                <a href="tel:1999" className="bg-stone-50 hover:bg-stone-100/80 border border-stone-200 p-2.5 rounded-xl flex flex-col justify-between transition-colors cursor-pointer group">
                  <span className="font-bold text-stone-500 text-[10px] tracking-wide">地方政府專線</span>
                  <span className="text-sm font-extrabold text-stone-800 mt-1">1999</span>
                </a>
              </div>
              
              <div className="bg-stone-900 text-white rounded-xl p-4 text-xs space-y-2 border border-stone-950">
                <div className="flex items-center gap-1.5 text-rose-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-extrabold tracking-widest text-[#FFF]">1991 報平安專線</span>
                </div>
                <p className="text-stone-300 leading-relaxed font-semibold">
                  極端天候致全市斷網、固網通訊癱瘓時，撥打1991並留下事先協定好之電話號碼，即可與家人利用留言互報平安。
                </p>
              </div>
            </div>

          </div>

          {/* Right Main Area */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
            
            {/* Real-time National Disaster & Weather Warnings Dashboard */}
            <div id="disaster-intel-panel" className="bg-white rounded-3xl border border-stone-200/85 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-6 sm:p-7 flex flex-col gap-6 transition-all hover:shadow-[0_6px_24px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-stone-105 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="bg-red-50 p-2.5 rounded-xl border border-red-100 text-red-700">
                    <AlertTriangle className="w-5.5 h-5.5 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-stone-900 flex items-center gap-2 font-display">
                      <span>全台即時災害與停班停課特報中心</span>
                      <span className="text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-full tracking-widest uppercase animate-pulse">Live</span>
                    </h2>
                    <p className="text-xs font-semibold text-stone-500 mt-1">
                      整合大氣天候、地震防風、停班停課特報，及 AI 居家風險安全守護指引
                    </p>
                  </div>
                </div>
                
                {/* Active Weather Scenario Switcher */}
                <div id="scenario-switcher" className="flex flex-wrap items-center gap-1 bg-stone-100 p-1.5 rounded-xl border border-stone-200 self-start xl:self-center">
                  <button
                    type="button"
                    onClick={() => handleSelectScenario('normal')}
                    className={`px-3 py-2 rounded-lg text-xs font-extrabold transition-all duration-250 flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] ${
                      activeScenario === 'normal' 
                        ? 'bg-white text-stone-900 shadow-sm border border-stone-200' 
                        : 'text-stone-500 hover:text-stone-850 hover:bg-stone-50'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>晴朗平靜</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectScenario('typhoon')}
                    className={`px-3 py-2 rounded-lg text-xs font-extrabold transition-all duration-250 flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] ${
                      activeScenario === 'typhoon' 
                        ? 'bg-[#7f1d1d] text-white shadow-sm border border-[#7f1d1d]' 
                        : 'text-stone-500 hover:text-[#7f1d1d] hover:bg-[#7f1d1d]/5'
                    }`}
                  >
                    <CloudLightning className="w-3.5 h-3.5 text-blue-400" />
                    <span>強颱警報</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectScenario('rain')}
                    className={`px-3 py-2 rounded-lg text-xs font-extrabold transition-all duration-250 flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] ${
                      activeScenario === 'rain' 
                        ? 'bg-[#d97706] text-white shadow-sm border border-amber-600' 
                        : 'text-stone-500 hover:text-amber-600 hover:bg-amber-50'
                    }`}
                  >
                    <CloudRainWind className="w-3.5 h-3.5 text-blue-400" />
                    <span>大豪雨特報</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectScenario('earthquake')}
                    className={`px-3 py-2 rounded-lg text-xs font-extrabold transition-all duration-250 flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] ${
                      activeScenario === 'earthquake' 
                        ? 'bg-red-700 text-white shadow-sm border border-red-700' 
                        : 'text-stone-500 hover:text-red-700 hover:bg-red-50'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 text-red-400" />
                    <span>有感震報</span>
                  </button>
                </div>
              </div>

              {/* Active Scenario Banner */}
              <div id="active-scenario-banner" className={`p-4.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-300 ${
                activeScenario === 'normal' ? 'bg-emerald-50/50 border-emerald-200/70' :
                activeScenario === 'typhoon' ? 'bg-[#7f1d1d]/5 border-[#7f1d1d]/20' :
                activeScenario === 'rain' ? 'bg-amber-50/50 border-amber-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border tracking-wider uppercase ${
                      activeScenario === 'normal' ? 'bg-emerald-100 text-emerald-800 border-emerald-350/60' :
                      activeScenario === 'typhoon' ? 'bg-red-805 bg-red-800 text-white border-red-800' :
                      activeScenario === 'rain' ? 'bg-amber-600 text-white border-amber-600' :
                      'bg-red-700 text-white border-red-700'
                    }`}>
                      {activeScenario === 'normal' ? '安全等級：常規綠色穩定' :
                       activeScenario === 'typhoon' ? '發佈：海上陸上強颱特報 (強烈颱風・康芮)' :
                       activeScenario === 'rain' ? '發佈：大豪雨特報與土石流紅色警戒' :
                       '發佈：花蓮近海規模 6.2 地震＆極密餘震特報'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] font-semibold text-stone-900 leading-relaxed">
                    {activeScenario === 'normal' && "🟢 目前全台大氣穩定。此段期間為「無痛防災窗口期」——建議配合守護系統盤點家庭避難物資，事先整備（如慢性處方藥、備用電池及乾糧瓶裝水）。"}
                    {activeScenario === 'typhoon' && "🔴 暴風圈已鎖定並進入東部陸地，迎風面基隆、雙北、宜花東防超大暴雨與 13 級猛烈陣風。宣佈停班課自治區域，外送平台餐飲依法全面暫停配送以維護出勤安全。"}
                    {activeScenario === 'rain' && "🟡 強對流梅雨系統滯留，高位山區與公路土石飽和。阿里山山崩紅色警戒就緒，蘇花路廊已啟動預警性封閉，平地低窪水溝應防倒灌。"}
                    {activeScenario === 'earthquake' && "🔴 震央最大震度花蓮市 5 強，大台北 4 級！未來 72 小時為高頻餘震最活躍期，地層脆弱，嚴禁進入蘇花、中橫公路等高風險山區。"}
                  </p>
                </div>
              </div>

              {/* Real-time Work & Class Suspension Status Board */}
              <div id="suspension-status-board" className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                
                {/* Left Column: Suspension Query Map Panel */}
                <div className="border border-stone-200 rounded-xl p-4 flex flex-col gap-3 bg-[#faf9f6]/40">
                  <h3 className="text-xs font-bold text-stone-700 flex items-center justify-between tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#7f1d1d]" />
                      分區即時停班停課查詢看板
                    </span>
                    <span className="text-[9px] font-bold text-stone-500 font-mono">REGIONAL STATUS</span>
                  </h3>

                  {/* Tabs Selector */}
                  <div className="grid grid-cols-4 gap-1 p-0.5 bg-stone-100 rounded-lg border border-stone-200/50">
                    {(['north', 'central', 'south', 'east'] as const).map((regId) => {
                      const names = { north: '北部', central: '中部', south: '南部', east: '東部' };
                      return (
                        <button
                          key={regId}
                          type="button"
                          onClick={() => setSelectedSuspensionRegion(regId)}
                          className={`py-1 text-[10px] font-bold rounded-md transition-all duration-200 cursor-pointer ${
                            selectedSuspensionRegion === regId
                              ? 'bg-stone-900 text-white shadow-xs'
                              : 'text-stone-500 hover:text-stone-850 hover:bg-stone-50'
                          }`}
                        >
                          {names[regId]}
                        </button>
                      );
                    })}
                  </div>

                  {/* regional dynamic layout */}
                  {(() => {
                    const data = getSuspensionStatus(selectedSuspensionRegion);
                    return (
                      <div className="flex-1 flex flex-col gap-3.5">
                        <div className={`p-2.5 rounded-lg border text-center font-bold text-xs ${data.class}`}>
                           {selectedSuspensionRegion === 'north' ? '北部地區：' :
                            selectedSuspensionRegion === 'central' ? '中部地區：' :
                            selectedSuspensionRegion === 'south' ? '南部地區：' :
                            '東部及離島地區：'}{data.status}
                        </div>
                        
                        <div className="bg-white rounded-lg border border-stone-150 p-3 space-y-2">
                          <label className="text-[9px] tracking-widest font-extrabold text-stone-450 uppercase block">縣市通報明細</label>
                          <div className="grid grid-cols-1 divide-y divide-stone-100">
                            {data.counties.map((county, colIdx) => (
                              <div key={colIdx} className="py-2 flex items-center justify-between text-xs font-semibold text-stone-700">
                                <span className="tracking-wide">{county.split(' ')[0]}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                   county.includes('🔴') ? 'bg-red-50 text-[#7f1d1d] border border-red-100' :
                                   county.includes('🟡') ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                   'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                }`}>
                                   {county.includes('🔴') ? '🔴 停班停課' : county.includes('🟡') ? '🟡 防風雨警戒' : '🟢 照常上班課'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Right Column: Visual map simulation / key metrics panels */}
                <div className="border border-stone-200 rounded-xl p-4 flex flex-col justify-between gap-3 bg-white">
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-stone-750 flex items-center justify-between tracking-wide">
                      <span className="flex items-center gap-1.5 uppercase">
                        <Activity className="w-3.5 h-3.5 text-[#7f1d1d]" />
                        災防數據與即時監控面板
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </h3>
                    
                    {/* Visual metrics cards depending on scenarios */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="bg-stone-50 border border-stone-150 rounded-lg p-2.5">
                         <span className="text-[9px] text-stone-450 font-bold block uppercase tracking-wider">今日最高累積降水</span>
                         <span className="text-sm font-extrabold text-stone-900 block mt-1 tracking-tight">
                            {activeScenario === 'rain' ? '380mm' : activeScenario === 'typhoon' ? '290mm' : '15mm'}
                         </span>
                         <span className="text-[9px] text-stone-500 font-medium block mt-0.5">{activeScenario === 'rain' ? '📍嘉義山區' : activeScenario === 'typhoon' ? '📍宜蘭太平山' : '低平水穩'}</span>
                      </div>
                      
                      <div className="bg-stone-50 border border-stone-155 rounded-lg p-2.5">
                         <span className="text-[9px] text-stone-450 font-bold block uppercase tracking-wider">瞬間觀測陣風</span>
                         <span className="text-sm font-extrabold text-stone-900 block mt-1 tracking-tight">
                            {activeScenario === 'typhoon' ? '14 級強風' : activeScenario === 'rain' ? '6 級陣風' : '風速微弱'}
                         </span>
                         <span className="text-[9px] text-stone-500 font-medium block mt-0.5">{activeScenario === 'typhoon' ? '📍東北海岸' : '正常對流風'}</span>
                      </div>

                      <div className="bg-stone-50 border border-stone-155 rounded-lg p-2.5">
                         <span className="text-[9px] text-stone-450 font-bold block uppercase tracking-wider">避難收容整備度</span>
                         <span className="text-sm font-extrabold text-[#7f1d1d] block mt-1 tracking-tight">
                            {activeScenario === 'normal' ? '待命' : '342 處開放'}
                         </span>
                         <span className="text-[9px] text-stone-500 font-medium block mt-0.5">預儲糧藥就緒</span>
                      </div>

                      <div className="bg-stone-50 border border-stone-155 rounded-lg p-2.5">
                         <span className="text-[9px] text-stone-455 font-bold block uppercase tracking-wider">搶救應急編組</span>
                         <span className="text-sm font-extrabold text-stone-900 block mt-1 tracking-tight">
                            {activeScenario === 'normal' ? '例行防務' : '全天防汛一級'}
                         </span>
                         <span className="text-[9px] text-stone-500 font-medium block mt-0.5">工水消全面待命</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#FAF9F6] border border-stone-200 p-2 rounded-lg flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#7f1d1d] animate-pulse shrink-0" />
                     <p className="text-[10px] text-stone-600 font-semibold leading-relaxed font-sans">
                        停班起強制關閉機慢車外送，安全高於一切，外勤人員請落實防風安全。
                     </p>
                  </div>
                </div>

              </div>

            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Dashboard Content */}
              <div className="xl:col-span-2 flex flex-col gap-6">
                {!analysisResult && !isAnalyzing && (
                  <div className="bg-white rounded-[24px] border border-stone-200/80 min-h-[500px] flex flex-col items-center justify-center p-10 text-center shadow-[0_4px_24px_-6px_rgba(0,0,0,0.02)] transition-all hover:border-stone-300">
                    <div className="w-16 h-16 bg-stone-50 flex items-center justify-center rounded-2xl mb-5 border border-stone-200/50 hover:scale-105 duration-300 transition-transform shadow-xs">
                      <CloudRainWind className="w-6 h-6 text-[#7f1d1d]/80" />
                    </div>
                    <h3 className="text-base font-extrabold text-stone-900 mb-2 tracking-widest font-display">
                      安全防護待機中
                    </h3>
                    <p className="text-stone-500 max-w-sm text-xs font-semibold leading-relaxed">
                      請於左側提供您確實的位置與家人需求設定，並點擊「啟動生活防災評估」。系統將分析該點的地理潛勢，隨即為您客製專屬的安心守護報告。
                    </p>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="bg-white rounded-[24px] border border-stone-200/80 min-h-[500px] flex flex-col items-center justify-center p-10 text-center shadow-[0_4px_24px_-6px_rgba(0,0,0,0.025)]">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 bg-stone-50 flex items-center justify-center rounded-2xl border border-stone-200/85">
                        <Sparkles className="w-6 h-6 text-[#7f1d1d] animate-pulse" />
                      </div>
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-stone-900 mb-2 tracking-widest font-display">
                      正在探測該點空間特性...
                    </h3>
                    <p className="text-stone-450 max-w-sm text-xs font-semibold animate-pulse leading-relaxed">
                      正在梳理水文水力分佈、坡形坡降、斷層裂帶與歷史災害大數據，請稍後。
                    </p>
                  </div>
                )}

                {analysisResult && !isAnalyzing && (
                  <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-450 ease-out">
                    
                    {/* 狀態總覽 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 停班課風險 */}
                      <div className="bg-white rounded-2xl border border-stone-200 p-6 flex items-center gap-5 shadow-sm hover:border-stone-300 transition-all">
                        <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center font-extrabold shrink-0 border relative overflow-hidden transition-all duration-300 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)]
                          ${analysisResult.suspensionIndicator?.level === '高' ? 'bg-[#7f1d1d] text-white border-[#7f1d1d]' : 
                          analysisResult.suspensionIndicator?.level === '中' ? 'bg-[#f4f1eb] text-stone-800 border-stone-300' : 
                          'bg-stone-50 text-stone-500 border-stone-200'}`}>
                          <span className="text-[10px] tracking-widest uppercase opacity-75 font-mono mb-0.5">LV</span>
                          <span className="text-xl leading-none">{analysisResult.suspensionIndicator?.level || '低'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-extrabold tracking-widest text-[#7f1d1d] uppercase mb-1">停班課預估指標</span>
                          <span className="text-base font-extrabold text-[#7f1d1d] tracking-tight">
                            評估為「{analysisResult.suspensionIndicator?.level || '低'}」度挑戰
                          </span>
                          <p className="text-xs text-stone-600 mt-1 font-semibold leading-relaxed">
                            {analysisResult.suspensionIndicator?.reasons?.[0] || "目前所處地區條件尚算穩定，無明顯停班課預兆。"}
                          </p>
                        </div>
                      </div>

                      {/* 總體風險摘要 */}
                      <div className="bg-[#1c1917] text-white rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden border border-stone-900 shadow-md">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#7f1d1d]/15 rounded-full blur-2xl pointer-events-none" />
                        <h4 className="text-[10px] font-extrabold text-stone-450 tracking-widest uppercase mb-2 flex items-center gap-1.5 border-b border-stone-800 pb-1.5">
                           <div className="w-1.5 h-1.5 rounded-full bg-[#7f1d1d]" /> 當前居住風險描述 SUMMARY
                        </h4>
                        <p className="text-stone-100 text-xs sm:text-sm leading-relaxed font-bold">
                          {analysisResult.disasterRisk?.summary}
                        </p>
                      </div>
                    </div>

                    {/* 風險次級指標 */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {analysisResult.disasterRisk?.factors?.map((factor, idx) => {
                        const isHigh = factor.riskLevel.includes('🔴') || factor.riskLevel.includes('高');
                        const isMed = factor.riskLevel.includes('🟡') || factor.riskLevel.includes('中') || factor.riskLevel.includes('注意');
                        return (
                          <div key={idx} className={`bg-white rounded-2xl p-4 border flex flex-col justify-between gap-3 transition-all duration-350 hover:-translate-y-0.5 ${
                             isHigh ? 'border-[#7f1d1d] bg-[#fdfcfb] shadow-[0_2px_12px_-5px_rgba(127,29,29,0.06)]' : isMed ? 'border-amber-300 bg-[#faf9f6]/40' : 'border-stone-200/80 bg-white'
                          }`}>
                            <div className="flex justify-between items-start">
                               <span className="text-xs font-extrabold text-stone-800 tracking-wide">{factor.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="relative flex h-1.5 w-1.5 shrink-0">
                                {isHigh && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7f1d1d] opacity-75" />}
                                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isHigh ? 'bg-[#7f1d1d]' : isMed ? 'bg-amber-500' : 'bg-stone-400'}`} />
                              </span>
                              <span className={`text-[11px] font-extrabold uppercase ${isHigh ? 'text-[#7f1d1d]' : 'text-stone-600'}`}>
                                {factor.riskLevel.replace(/🟢|🟡|🔴/g, '')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 專家即時行動指引 */}
                    {analysisResult.actionableTimeline && (
                      <div className="bg-white rounded-3xl border border-stone-200/85 flex flex-col overflow-hidden shadow-sm transition-all hover:border-stone-300">
                        <div className="bg-stone-50/70 px-5 py-4 border-b border-stone-200/80 flex items-center justify-between">
                          <h3 className="text-xs font-extrabold text-stone-800 flex items-center gap-2 uppercase tracking-wide">
                            <Clock className="w-4.5 h-4.5 text-[#7f1d1d]" />
                            防災行動時間指南 (TIMELINE)
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-stone-200/80">
                          {/* 優先整備行動 */}
                          <div className="p-6 space-y-4">
                            <h4 className="text-[#7f1d1d] text-[13px] font-extrabold tracking-widest uppercase mb-4 flex items-center gap-2.5">
                              <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7f1d1d] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7f1d1d]"></span>
                              </span>
                              優先整備行動 (此時此刻)
                            </h4>
                            <div className="relative border-l border-stone-200 pl-4.5 space-y-5 py-1">
                              {analysisResult.actionableTimeline.immediate?.map((action, i) => (
                                 <div key={i} className="relative text-xs leading-relaxed text-stone-700">
                                   <div className="absolute -left-[27.5px] top-0.5 w-5 h-5 rounded-full bg-[#7f1d1d] text-white font-extrabold text-[10px] flex items-center justify-center shadow-xs">
                                     {i+1}
                                   </div>
                                   <span className="font-semibold text-stone-850 leading-relaxed block pl-1">{action}</span>
                                 </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* 持續跟進整備 */}
                          <div className="p-6 space-y-4 bg-stone-50/10">
                             <h4 className="text-stone-700 text-[13px] font-extrabold tracking-widest uppercase mb-4 flex items-center gap-2.5">
                              <span className="w-2 h-2 rounded-full bg-stone-500 shrink-0" />
                              持續跟進整備 (未來 24 小時)
                            </h4>
                            <div className="relative border-l border-stone-200 pl-4.5 space-y-5 py-1">
                              {analysisResult.actionableTimeline.next24h?.map((action, i) => (
                                 <div key={i} className="relative text-xs leading-relaxed text-stone-650">
                                   <div className="absolute -left-[27.5px] top-0.5 w-5 h-5 rounded-full bg-stone-200 text-stone-700 font-extrabold text-[10px] flex items-center justify-center">
                                     {i+1}
                                   </div>
                                   <span className="font-semibold text-stone-750 leading-relaxed block pl-1">{action}</span>
                                 </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 避難收容與安全方向規劃 */}
                    {analysisResult.shelterGuidance && (
                      <div className="bg-white rounded-3xl border border-stone-200/85 shadow-sm p-6 sm:p-7 space-y-5 transition-all hover:border-stone-300">
                        <div className="border-b border-stone-150 pb-4 flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#7f1d1d]/10 flex items-center justify-center text-[#7f1d1d] border border-[#7f1d1d]/15">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-xs font-extrabold text-stone-800 uppercase tracking-widest leading-none">
                              推薦避難收容處所與撤離指南
                            </h3>
                            <p className="text-[10px] text-stone-450 font-bold mt-1.5">基於鄰里特徵及防坡規章制定的安全方向</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* 建議前往處所 */}
                          <div className="space-y-4">
                            <h4 className="text-xs font-extrabold text-stone-900 flex items-center gap-2 tracking-wide uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#7f1d1d]" />
                              建議避難撤離地點
                            </h4>
                            <div className="space-y-3">
                              {analysisResult.shelterGuidance.nearestOptions?.map((shelter, idx) => (
                                <div key={idx} className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 flex gap-3.5 text-xs text-stone-700 font-semibold transition-colors hover:bg-stone-100/60">
                                  <span className="w-6 h-6 rounded-lg bg-white border border-stone-250 flex items-center justify-center text-xs font-extrabold text-[#7f1d1d] shrink-0 select-none shadow-xs">
                                    {idx + 1}
                                  </span>
                                  <span className="leading-relaxed text-stone-800">{shelter}</span>
                                </div>
                              ))}
                              {(!analysisResult.shelterGuidance.nearestOptions || analysisResult.shelterGuidance.nearestOptions.length === 0) && (
                                <p className="text-xs text-stone-400 font-semibold italic">正在加載適合您的里民活動中心或運動場地規劃...</p>
                              )}
                            </div>
                          </div>
                          
                          {/* 安全行進原則 */}
                          <div className="space-y-4">
                            <h4 className="text-xs font-extrabold text-stone-900 flex items-center gap-2 tracking-wide uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
                              安全行進與疏散原則
                            </h4>
                            <ul className="space-y-3">
                              {analysisResult.shelterGuidance.safetyCriteria?.map((criteria, idx) => (
                                <li key={idx} className="flex gap-2.5 items-start text-xs leading-relaxed font-semibold text-stone-650">
                                  <div className="w-4 h-4 rounded-full bg-stone-100 flex items-center justify-center shrink-0 mt-0.5 border border-stone-200/50">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#7f1d1d]/85" />
                                  </div>
                                  <span className="leading-relaxed font-semibold text-stone-700">{criteria}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Advanced Specific Persona Protection Features */}
                {(familyProfile.hasElderly || familyProfile.hasDeliveryRider) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                    {/* Elderly Care Column */}
                    {familyProfile.hasElderly && (
                      <div className="bg-amber-50/75 border border-amber-300 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
                        <div className="flex items-center gap-2.5 border-b border-amber-200 pb-3">
                          <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white text-sm font-bold shadow-xs">👴</div>
                          <div>
                            <h4 className="text-sm font-bold text-amber-900 tracking-wide">長輩避難防護特別護理指南</h4>
                            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Elderly High-Contrast Safety Shield</p>
                          </div>
                        </div>
                        <div className="space-y-3 text-xs leading-relaxed text-amber-955 font-medium">
                          <p className="font-bold border-l-2 border-amber-500 pl-2 text-amber-900 mb-1">
                            行動速度慢、或慢性常備藥中斷，是災汛或強震時期高齡者面臨的最大危險：
                          </p>
                          <ul className="space-y-2">
                            <li className="flex gap-2 items-start">
                              <span className="text-amber-705 font-bold">✓</span>
                              <span><strong>慢性病與處方藥儲備</strong>：檢查常用降血壓、血糖或心血管處方藥至少準備 7-14 天用量，置於透明防水袋隨身包中。</span>
                            </li>
                            <li className="flex gap-2 items-start">
                              <span className="text-amber-705 font-bold">✓</span>
                              <span><strong>低溫與氣溫劇變調節</strong>：颱風降溫、大雨潮濕極易誘發呼吸道或關節疼痛，請預備好厚外套、長輩乾棉襪置於手邊。</span>
                            </li>
                            <li className="flex gap-2 items-start">
                              <span className="text-amber-705 font-bold">✓</span>
                              <span><strong>居家防跌與不斷電照明</strong>：浴廁、床頭及客廳走道，加裝即插自亮應急燈或預備感應夜間磁吸手電筒以防斷電摔傷。</span>
                            </li>
                            <li className="flex gap-2 items-start">
                              <span className="text-amber-705 font-bold">✓</span>
                              <span><strong>無障礙逃生通道保通</strong>：提前移開玄關、客廳主動線的矮凳、雜物，風雨來臨前反覆跟長輩演練避震「趴下掩護」掩體。</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Delivery & Field Worker Column */}
                    {familyProfile.hasDeliveryRider && (
                      <div className="bg-blue-50/75 border border-blue-300 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
                        <div className="flex items-center gap-2.5 border-b border-blue-200 pb-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-xs">🛵</div>
                          <div>
                            <h4 className="text-sm font-bold text-blue-905 tracking-wide">外勤與外送夥伴騎行交通哨兵欄</h4>
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Delivery Rider Traffic Guardian</p>
                          </div>
                        </div>
                        <div className="space-y-3 text-xs leading-relaxed text-blue-955 font-semibold">
                          <p className="font-bold border-l-2 border-blue-500 pl-2 text-blue-900 mb-1">
                            機慢車在強風豪雨、積水或強震餘震後，其行車與失控摔車風險翻升數倍：
                          </p>
                          <ul className="space-y-2">
                            <li className="flex gap-2 items-start">
                              <span className="text-blue-705 font-bold">✓</span>
                              <span><strong>九級強風避風避行原則</strong>：瞬間陣風若接近 8-9 級以上，高空招牌、路樹枝椏極易折斷。切忌勉強騎上高架橋、跨海大橋。</span>
                            </li>
                            <li className="flex gap-2 items-start">
                              <span className="text-blue-705 font-bold">✓</span>
                              <span><strong>停班強制斷單機制</strong>：縣市若公告停班課，平台（基於防汛安規）將在當下全線強制關閉外送！外送員應立即依規返家。</span>
                            </li>
                            <li className="flex gap-2 items-start">
                              <span className="text-blue-705 font-bold">✓</span>
                              <span><strong>高胎紋與高抓地配備</strong>：出勤前確認安全帽雙扣環牢靠、防滑工作鞋墊、機車輪胎磨損度，雨天行車煞車安全距離應拉長 3 倍。</span>
                            </li>
                            <li className="flex gap-2 items-start">
                              <span className="text-blue-705 font-bold">✓</span>
                              <span><strong>低窪積水決不強行涉水</strong>：若積水高過 20 公分（約半個輪胎高），地下可能因排水孔反溢導致下水道孔蓋移位，強行通過極其危險！</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 專屬提醒 & 避難包 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 家庭關懷提醒 */}
                  <div className="bg-[#FAF9F6] rounded-xl border border-stone-205 p-5 flex flex-col gap-4">
                    <h3 className="text-base font-bold text-[#7f1d1d] flex items-center gap-1.5 uppercase tracking-wider">
                       <HeartPulse className="w-4 h-4" /> 專屬家庭安全提醒
                    </h3>
                    <div className="flex flex-col gap-3">
                      {analysisResult.familyCare?.map((reminder, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-sm md:text-base text-stone-700 font-medium">
                          <AlertCircle className="w-5 h-5 text-stone-500 shrink-0 mt-0.5" />
                          <p className="leading-relaxed">{reminder}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 避難包建議 */}
                  <div className="bg-[#FAF9F6] rounded-xl border border-stone-205 p-5 flex flex-col gap-4">
                    <h3 className="text-base font-bold text-stone-800 flex items-center gap-1.5 uppercase tracking-wider">
                      <CloudLightning className="w-4 h-4 text-stone-600" /> 與日常生活的整備建議
                    </h3>
                    <div className="flex flex-col gap-3">
                      {analysisResult.bagRecommendations?.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-sm md:text-base text-stone-700 font-semibold">
                           <div className="w-5 h-5 rounded-full bg-[#f4f1eb] border border-stone-300 flex items-center justify-center shrink-0 mt-0.5">
                             <Check className="w-3 h-3 text-stone-700" strokeWidth={3.5} />
                           </div>
                           <p className="leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 整備缺點診斷 */}
                {analysisResult.deficiencyAnalysis && (
                  <div className="bg-red-50/50 rounded-xl border border-red-200 p-6 flex flex-col gap-5 mt-2">
                    <h3 className="text-base font-bold text-[#7f1d1d] flex items-center gap-2 uppercase tracking-wider">
                      <AlertCircle className="w-5 h-5" /> 
                      🚨 安全漏洞與整備缺點診斷 (AI 弱點分析)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-red-900 border-b border-red-200 pb-2">當前脆弱點與盲區</h4>
                        <ul className="space-y-3">
                          {analysisResult.deficiencyAnalysis.weaknesses.map((w, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-sm md:text-base text-red-800 font-medium">
                              <span className="shrink-0 text-red-500 mt-1">✗</span>
                              <span className="leading-relaxed">{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-emerald-900 border-b border-emerald-200 pb-2">改善方案與策略</h4>
                        <ul className="space-y-3">
                          {analysisResult.deficiencyAnalysis.improvements.map((imp, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-sm md:text-base text-emerald-800 font-medium">
                              <span className="shrink-0 text-emerald-600 mt-1">✓</span>
                              <span className="leading-relaxed">{imp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 離線防災整備備忘卡 */}
                <div className="bg-white rounded-xl border border-stone-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-stone-800 flex items-center gap-1.5 uppercase tracking-wide">
                      <FileText className="w-4 h-4 text-[#7f1d1d]" />
                      <span>離線防災手冊（一鍵隨身攜帶）</span>
                    </h4>
                    <p className="text-xs text-stone-500 leading-relaxed font-medium">
                      在極端天氣導致電力或網路中斷時，網站資訊可能無法讀取。強烈建議現在複製整份客製指南，存入手機離線備忘錄或通訊群組備存。
                    </p>
                  </div>
                  <button
                    onClick={handleExportOffline}
                    className="shrink-0 bg-stone-900 border border-stone-800 font-bold text-white text-sm px-4 py-2.5 rounded-lg hover:bg-stone-800 transition-all active:scale-[0.98] select-none flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-stone-300 animate-pulse" strokeWidth={3} />
                        <span>已成功備份至剪貼簿！</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 opacity-80" />
                        <span>一鍵複製離線防災卡</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}
            </div>
              
              {/* Sidebar Interface (Adaptive Tabs) */}
              <div className="xl:col-span-1 flex flex-col gap-6">
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden flex flex-col h-[650px] xl:max-h-[850px] sticky top-24">
                  
                  {/* Tab Selector Buttons */}
                  <div className="bg-[#FAF9F6] border-b border-stone-200 p-2 shrink-0 flex items-center gap-1.5 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setSidebarTab('supplies')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        sidebarTab === 'supplies'
                          ? 'bg-white text-stone-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-stone-200/85'
                          : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100/60'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 text-[#7f1d1d]" strokeWidth={3} />
                      <span>避難物品清單</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSidebarTab('chat')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        sidebarTab === 'chat'
                          ? 'bg-white text-stone-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-stone-200/85'
                          : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100/60'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#7f1d1d]" />
                      <span>AI 精準諮詢</span>
                    </button>
                  </div>

                  {sidebarTab === 'supplies' ? (
                    <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-stone-50/10">
                      <SuppliesInventory 
                        supplies={supplies} 
                        setSupplies={setSupplies} 
                        memberCount={memberCount} 
                        setMemberCount={setMemberCount} 
                        isSidebar={true}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="bg-[#FAF9F6] border-b border-stone-150 p-3 shrink-0 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-[#f4f1eb] text-stone-700 flex items-center justify-center">
                            <UserCircle2 className="w-3.5 h-3.5" />
                          </div>
                          <h3 className="text-xs font-extrabold tracking-wider text-stone-700 font-sans flex items-center gap-1">
                            <span>AI 防災諮詢顧問</span>
                            <span className="text-[9px] bg-[#7f1d1d]/10 text-[#7f1d1d] font-extrabold px-1 py-0.2 rounded-sm shrink-0 scale-90 border border-[#7f1d1d]/10">AI</span>
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded border border-stone-200/30">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                           <span className="text-[10px] font-extrabold text-stone-500">待命諮詢中</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-stone-50/20 custom-scrollbar">
                        {chatHistory.length === 0 && (
                          <div className="text-center text-stone-600 text-sm my-auto bg-white p-5 rounded-lg border border-stone-200 max-w-xs mx-auto shadow-none">
                            <UserCircle2 className="w-8 h-8 text-stone-400 mx-auto mb-2" strokeWidth={1.5} />
                            <p className="font-bold text-sm text-stone-700 mb-1">AI 專屬對話諮詢與缺點分析</p>
                            <p className="text-stone-500 leading-relaxed text-sm">有任何防災與特定物資問題？隨時輸入，由 AI 防災專員為您深度解答、分析漏洞並提供全方位安全指引。</p>
                          </div>
                        )}
                        
                        {chatHistory.map((chat, idx) => (
                          <div key={idx} className={`flex w-full ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-3.5 max-w-[85%] ${chat.role === 'user' ? 'flex-row-reverse' : ''}`}>
                              {chat.role === 'ai' && (
                                <div className="w-6 h-6 rounded bg-stone-100 border border-stone-200 shadow-sm flex items-center justify-center shrink-0 mt-1">
                                  <Sparkles className="w-3.5 h-3.5 text-[#7f1d1d]" />
                                </div>
                              )}
                              <div className={`p-3 rounded-lg shadow-none text-sm ${
                                chat.role === 'user' 
                                  ? 'bg-stone-800 text-white font-medium' 
                                  : 'bg-[#f5f4f0] border border-stone-200 text-stone-800'
                              }`}>
                                 <p className="leading-relaxed whitespace-pre-wrap">{chat.text}</p>
                              </div>
                            </div>
                          </div>
                        ))}

                        {isChatting && (
                          <div className="flex w-full justify-start">
                            <div className="flex gap-2.5 max-w-[85%]">
                              <div className="w-6 h-6 rounded bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 mt-1">
                                <Sparkles className="w-3.5 h-3.5 text-[#7f1d1d]" />
                              </div>
                              <div className="bg-[#f5f4f0] border border-stone-200 p-3 rounded-lg flex items-center gap-1.5 h-[32px]">
                                <div className="w-1 h-1 bg-stone-400 rounded-full animate-bounce" />
                                <div className="w-1 h-1 bg-stone-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-1 h-1 bg-stone-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <form onSubmit={handleChat} className="p-3 bg-white border-t border-stone-200 flex gap-2 shrink-0 items-center">
                        <input
                          type="text"
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          placeholder="請輸入您的問題..."
                          className="flex-1 bg-stone-50 border border-stone-200 py-2.5 px-3 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-colors font-medium animate-none animate-none"
                        />
                        <button
                          type="submit"
                          disabled={isChatting || !chatMessage.trim()}
                          className="bg-stone-900 hover:bg-stone-800 text-white w-9 h-9 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center shrink-0 active:scale-95 shadow-none"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
              
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

