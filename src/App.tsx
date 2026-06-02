import React, { useState } from 'react';
import { 
  ShieldAlert, AlertCircle, CloudLightning, HeartPulse, UserCircle2, 
  MapPin, Loader2, Send, CloudRainWind, Activity, ArrowRight, FileText,
  Home, Clock, Phone, Sparkles, Check, Key, Eye, EyeOff
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
  });
  const [environmentDesc, setEnvironmentDesc] = useState('');
  const [supplies, setSupplies] = useState<SupplyItem[]>(defaultSupplies);
  const [memberCount, setMemberCount] = useState<number>(2); // Default to two-person household

  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem("custom_gemini_key") || "");
  const [showApiKey, setShowApiKey] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingEnv, setIsAnalyzingEnv] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [copied, setCopied] = useState(false);

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

【指定緊急撤離避難處所】
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

  const isHighRisk = analysisResult?.disasterRisk?.level === '🔴高風險' || analysisResult?.disasterRisk?.level === 'High';
  const headerBgClass = isHighRisk ? 'bg-[#7f1d1d] border-stone-200 text-white' : 'bg-white/95 backdrop-blur-sm border-stone-200 text-stone-900';
  const headerIconClass = isHighRisk ? 'text-white' : 'text-[#7f1d1d]';

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-800 font-sans selection:bg-stone-100 selection:text-stone-900">
      <header className={`border-b sticky top-0 z-20 transition-all duration-300 shadow-none ${headerBgClass}`}>
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${isHighRisk ? 'bg-white/20' : 'bg-[#FAF9F6] border border-stone-200'}`}>
              <ShieldAlert className={`w-4 h-4 ${headerIconClass}`} />
            </div>
            <h1 className={`text-base font-bold tracking-widest ${isHighRisk ? 'text-white' : 'text-stone-900'}`}>
              防災生活與居住整備指南
            </h1>
          </div>
          {isHighRisk && (
            <div className="flex items-center gap-2 bg-[#6b1812] px-3.5 py-1 rounded border border-white/20">
               <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
               <span className="font-bold text-white tracking-widest text-xs">高風險警戒</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Sidebar: Controls & Settings */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-stone-900 tracking-wider mb-1 flex items-center gap-2">
                  <span className="w-1.5 h-4.5 bg-[#7f1d1d] block rounded-sm shrink-0"></span>
                  空間環境配置
                </h2>
                <p className="text-sm text-stone-500 leading-relaxed">請提供正確地址，系統將結合地理潛勢分析居住環境挑戰，協助制定合適的避難規劃。</p>
              </div>

              {/* API Key settings card */}
              <div className="bg-[#FAF9F6] rounded-xl border border-stone-200 p-5 shadow-none">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-sm font-bold text-stone-700 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-stone-500" />
                    防災核心 API 設定
                  </h3>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-stone-600 leading-relaxed">
                    本系統預設會使用內置的金鑰。您也可以在此輸入您個人的 <strong className="text-stone-705 font-bold">Gemini API Key</strong> 進行處理。
                  </p>
                  
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={customApiKey}
                      onChange={(e) => handleSaveApiKey(e.target.value)}
                      placeholder="請貼上您的 API 金鑰 (AI_...)"
                      className="w-full bg-white border border-stone-200 rounded-lg pl-3 pr-10 py-2 text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-all font-mono placeholder:text-stone-400"
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
                      <div className={`w-1.5 h-1.5 rounded-full ${customApiKey ? "bg-[#7f1d1d]" : "bg-stone-400"}`} />
                      <span className="text-xs font-bold text-stone-500 tracking-wider">
                        {customApiKey ? "自訂金鑰已套用" : "預設金鑰"}
                      </span>
                    </div>
                    {customApiKey && (
                      <button
                        type="button"
                        onClick={() => handleSaveApiKey("")}
                        className="text-xs font-bold text-[#7f1d1d] hover:underline"
                      >
                        重設/清除
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm transition-all hover:border-stone-300">
                <h3 className="text-sm font-bold text-stone-700 flex items-center gap-1.5 mb-3 tracking-wide">
                  <MapPin className="w-4 h-4 text-stone-500" />
                  確認居住位置
                </h3>
                <div className="flex flex-col gap-2.5">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="請輸入地址或地標名稱..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAnalyzeEnvironment}
                    disabled={isAnalyzingEnv || !location.trim()}
                    className="w-full relative overflow-hidden group select-none border border-stone-200 bg-[#f4f1eb]/60 hover:bg-[#f4f1eb] text-stone-750 rounded-lg py-2 px-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-none"
                  >
                    {isAnalyzingEnv ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-[#7f1d1d]" />
                        <span>正在分析環境...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-[#7f1d1d] group-hover:scale-110 transition-transform" />
                        <span>由地址分析居住環境 (免手打)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Environment */}
              <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm transition-all hover:border-stone-300">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-stone-700 flex items-center gap-1.5 tracking-wide">
                    <Home className="w-4 h-4 text-stone-500" />
                    居住環境狀態描述
                  </h3>
                  {isAnalyzingEnv && <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-500" />}
                </div>
                <div className="flex flex-col gap-2.5">
                  <textarea
                    value={environmentDesc}
                    onChange={(e) => setEnvironmentDesc(e.target.value)}
                    placeholder="點擊上方「由地址分析居住環境」按鈕即可自動生成描述。您也可以隨時在這裡進行手動修改或補充..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-950 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-all placeholder:text-stone-400 font-medium resize-none h-28"
                  />
                  {!environmentDesc && (
                    <div className="text-xs font-medium text-stone-400 flex items-center gap-1 pb-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#7f1d1d] shrink-0" />
                      <span>提示：若未填寫，開始評估時將自動解析</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Family */}
              <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm transition-all hover:border-stone-300">
                <h3 className="text-sm font-bold text-stone-700 flex items-center gap-1.5 mb-3 tracking-wide">
                  <HeartPulse className="w-4 h-4 text-[#7f1d1d]" />
                  家庭特殊需求對象
                </h3>
                <div className="flex flex-col gap-2.5">
                  {[
                    { key: 'hasToddler', label: '嬰幼兒', desc: '需要特殊副食品與獨立物資照料' },
                    { key: 'hasElderly', label: '高齡長者', desc: '行動慢、備妥血壓藥與處方藥' },
                    { key: 'hasChronicIllness', label: '慢性病患', desc: '依賴不斷電與特定定期藥品' },
                    { key: 'hasMobilityIssues', label: '行動不便', desc: '需提前撤離與專人引導協助' },
                  ].map((item) => {
                    const checked = familyProfile[item.key as keyof FamilyProfile];
                    return (
                      <label key={item.key} className={`cursor-pointer flex items-center gap-3 p-2 rounded border transition-all ${
                        checked ? 'bg-[#f4f1eb] border-stone-300 shadow-none' : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                      }`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleProfileChange(item.key as keyof FamilyProfile)}
                          className="hidden"
                        />
                        <div className={`w-4 h-4 rounded-sm flex items-center justify-center shrink-0 border transition-all ${
                          checked ? 'bg-[#7f1d1d] border-[#7f1d1d]' : 'bg-white border-stone-300'
                        }`}>
                          {checked && <Check className="w-3 h-3 text-white" strokeWidth={3.5} />}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${checked ? 'text-[#7f1d1d]' : 'text-stone-755'}`}>{item.label}</span>
                          <span className="text-xs text-stone-500 mt-0.5 leading-snug">{item.desc}</span>
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
              className="w-full bg-[#7f1d1d] text-white rounded-lg py-3.5 px-6 font-bold text-sm transition-all hover:bg-[#6b1812] active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>正在獲取環境參數與潛勢...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>啟動生活防災評估</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 opacity-80" />
                </>
              )}
            </button>

            {/* 防災緊急聯絡與平安機制 */}
            <div className="bg-[#FAF9F6] border border-stone-200 rounded-xl p-5 shadow-none space-y-4">
              <h3 className="text-sm font-bold text-stone-700 flex items-center gap-1.5 tracking-wide">
                <Phone className="w-4 h-4 text-stone-500" />
                <span>防災緊急通報聯絡</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white border border-stone-200 p-2.5 rounded flex flex-col justify-between">
                  <span className="font-bold text-stone-500">災情火警、急救</span>
                  <span className="text-sm font-bold text-[#7f1d1d] mt-1">119</span>
                </div>
                <div className="bg-white border border-stone-200 p-2.5 rounded flex flex-col justify-between">
                  <span className="font-bold text-stone-500">警政報案專線</span>
                  <span className="text-sm font-bold text-[#7f1d1d] mt-1">110</span>
                </div>
                <div className="bg-white border border-stone-200 p-2.5 rounded flex flex-col justify-between">
                  <span className="font-bold text-stone-500">斷網行動求救</span>
                  <span className="text-sm font-bold text-stone-600 mt-1">112</span>
                </div>
                <div className="bg-white border border-stone-200 p-2.5 rounded flex flex-col justify-between">
                  <span className="font-bold text-stone-500">市府生活災情</span>
                  <span className="text-sm font-bold text-stone-600 mt-1">1999</span>
                </div>
              </div>
              <div className="bg-stone-900 text-white rounded p-3.5 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#fdfcfb]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7f1d1d]" />
                  <span className="font-bold">1991 防災報平安留言板</span>
                </div>
                <p className="text-stone-300 leading-relaxed font-medium">
                  電話不通或網路癱瘓時，撥打專線，與家人利用預約電話留言互報平安。
                </p>
              </div>
            </div>

          </div>

          {/* Right Main Area */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
            
            {/* Top: Supplies Inventory */}
            <SuppliesInventory 
              supplies={supplies} 
              setSupplies={setSupplies} 
              memberCount={memberCount} 
              setMemberCount={setMemberCount} 
            />
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Dashboard Content */}
              <div className="xl:col-span-2 flex flex-col gap-6">
                {!analysisResult && !isAnalyzing && (
              <div className="bg-white rounded-xl border border-stone-200 min-h-[500px] flex flex-col items-center justify-center p-10 text-center shadow-none">
                <div className="w-16 h-16 bg-[#FAF9F6] flex items-center justify-center rounded-full mb-5 border border-stone-200">
                  <CloudRainWind className="w-6 h-6 text-stone-400" />
                </div>
                <h3 className="text-base font-bold text-stone-800 mb-2 tracking-widest">生活防災整備待機中</h3>
                <p className="text-stone-500 max-w-sm text-xs font-medium leading-relaxed">
                  請提供您的目標區域位置。系統將自動分析當地的地形和排水特點，並整合家庭成員需求，為您客製出具備生活感、條理分明的防災避難指引。
                </p>
              </div>
            )}

            {isAnalyzing && (
              <div className="bg-white rounded-xl border border-stone-200 min-h-[500px] flex flex-col items-center justify-center p-10 text-center shadow-none">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-[#FAF9F6] flex items-center justify-center rounded-full border border-stone-200">
                    <Sparkles className="w-6 h-6 text-[#7f1d1d] animate-pulse" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-stone-800 mb-2 tracking-widest">正在探測空間特性</h3>
                <p className="text-stone-500 max-w-sm text-xs font-medium animate-pulse">
                  梳理水文分佈、坡形高度與歷史災害大數據中...
                </p>
              </div>
            )}

            {analysisResult && !isAnalyzing && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-500 ease-out">
                
                {/* 狀態總覽 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 停班課風險 */}
                  <div className="bg-white rounded-xl border border-stone-200 p-6 flex items-center gap-5 shadow-sm">
                    <div className={`w-16 h-16 rounded flex items-center justify-center text-xl font-bold shrink-0 border
                      ${analysisResult.suspensionIndicator?.level === '高' ? 'bg-[#7f1d1d] text-white border-[#7f1d1d]' : 
                      analysisResult.suspensionIndicator?.level === '中' ? 'bg-[#f4f1eb] text-stone-700 border-stone-300' : 
                      'bg-stone-50 text-stone-500 border-stone-200'}`}>
                      {analysisResult.suspensionIndicator?.level || '低'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold tracking-wider text-stone-400 mb-1">停班課預估指標</span>
                      <span className="text-base font-bold text-stone-900 tracking-tight">
                        {analysisResult.suspensionIndicator?.level || '低'}度挑戰
                      </span>
                      <p className="text-sm text-stone-605 mt-1 line-clamp-2">
                        {analysisResult.suspensionIndicator?.reasons?.[0] || "目前條件尚算穩定，無明顯停班課預兆。"}
                      </p>
                    </div>
                  </div>

                  {/* 總體風險摘要 */}
                  <div className="bg-stone-900 text-white rounded-xl p-6 flex flex-col justify-center relative overflow-hidden">
                    <h4 className="text-xs font-bold text-stone-400 tracking-wider uppercase mb-2 flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-[#7f1d1d]" /> 當前居住風險描述
                    </h4>
                    <p className="text-stone-100 text-sm leading-relaxed font-semibold">
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
                      <div key={idx} className={`bg-white rounded-xl p-4 border flex flex-col justify-between gap-3 transition-all ${
                         isHigh ? 'border-[#7f1d1d] bg-[#fdfcfb]' : isMed ? 'border-stone-350 bg-[#faf9f6]' : 'border-stone-250 bg-white'
                      }`}>
                        <div className="flex justify-between items-start">
                           <span className="text-sm font-bold text-stone-850">{factor.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${isHigh ? 'bg-[#7f1d1d]' : 'bg-stone-400'}`} />
                          <span className={`text-xs font-bold ${isHigh ? 'text-[#7f1d1d]' : 'text-stone-600'}`}>
                            {factor.riskLevel.replace(/🟢|🟡|🔴/g, '')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 專家即時行動指引 */}
                {analysisResult.actionableTimeline && (
                  <div className="bg-white rounded-xl border border-stone-200 flex flex-col overflow-hidden shadow-sm">
                    <div className="bg-[#FAF9F6] px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-stone-850 flex items-center gap-2">
                        <Clock className="w-4.5 h-4.5 text-stone-600" />
                        條理化的防災行動建議 (時間軸)
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-200">
                      <div className="p-5">
                        <h4 className="text-[#7f1d1d] text-sm font-bold tracking-wider mb-4 flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7f1d1d] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7f1d1d]"></span>
                          </span>
                          優先整備行動 (此時此刻)
                        </h4>
                        <ul className="space-y-3">
                          {analysisResult.actionableTimeline.immediate?.map((action, i) => (
                             <li key={i} className="flex gap-2.5 items-start text-sm text-stone-750">
                               <div className="w-4 h-4 rounded-full bg-[#7f1d1d]/10 text-[#7f1d1d] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                 {i+1}
                               </div>
                               <span className="leading-relaxed font-semibold text-stone-850">{action}</span>
                             </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="p-5">
                         <h4 className="text-stone-700 text-sm font-bold tracking-wider mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-stone-500" />
                          持續跟進整備 (未來 24 小時)
                        </h4>
                        <ul className="space-y-3">
                          {analysisResult.actionableTimeline.next24h?.map((action, i) => (
                             <li key={i} className="flex gap-2.5 items-start text-sm text-stone-600">
                               <div className="w-4 h-4 rounded-full bg-stone-100 text-stone-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                 {i+1}
                               </div>
                               <span className="leading-relaxed font-medium text-stone-700">{action}</span>
                             </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 避難收容與安全方向規劃 */}
                {analysisResult.shelterGuidance && (
                  <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-5 animate-in fade-in duration-300">
                    <div className="border-b border-stone-150 pb-3.5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#7f1d1d]/10 flex items-center justify-center text-[#7f1d1d]">
                        <MapPin className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-stone-850 uppercase tracking-widest leading-none">
                          推薦緊急避難收容處所與撤離指南
                        </h3>
                        <p className="text-xs text-stone-450 font-semibold mt-1">基於輸入住址之鄰近行政區域避難規劃</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 建議前往處所 */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7f1d1d]" />
                          建議避難撤離地點 (適配特設)
                        </h4>
                        <div className="space-y-2.5">
                          {analysisResult.shelterGuidance.nearestOptions?.map((shelter, idx) => (
                            <div key={idx} className="bg-[#FAF9F6] border border-stone-200/60 rounded-lg p-3 flex gap-3 text-sm text-stone-700 font-semibold">
                              <span className="w-5 h-5 rounded-full bg-white border border-stone-200 flex items-center justify-center text-xs font-bold text-[#7f1d1d] shrink-0 select-none">
                                {idx + 1}
                              </span>
                              <span className="leading-relaxed">{shelter}</span>
                            </div>
                          ))}
                          {(!analysisResult.shelterGuidance.nearestOptions || analysisResult.shelterGuidance.nearestOptions.length === 0) && (
                            <p className="text-xs text-stone-400 font-semibold italic">正根據所在地址在網路上篩選合適學校與里民活動中心...</p>
                          )}
                        </div>
                      </div>

                      {/* 安全行進原則 */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
                          安全疏散方向與避難判斷原則
                        </h4>
                        <ul className="space-y-2.5">
                          {analysisResult.shelterGuidance.safetyCriteria?.map((criteria, idx) => (
                            <li key={idx} className="flex gap-2.5 items-start text-sm text-stone-650 font-normal">
                              <div className="w-4 h-4 rounded-full bg-stone-100 flex items-center justify-center shrink-0 mt-0.5">
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

                {/* 專屬提醒 & 避難包 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 家庭關懷提醒 */}
                  <div className="bg-[#FAF9F6] rounded-xl border border-stone-205 p-5 flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-[#7f1d1d] flex items-center gap-1.5 uppercase tracking-wider">
                       <HeartPulse className="w-4 h-4" /> 專屬家庭安全提醒
                    </h3>
                    <div className="flex flex-col gap-3">
                      {analysisResult.familyCare?.map((reminder, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-sm text-stone-700 font-medium">
                          <AlertCircle className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                          <p className="leading-relaxed">{reminder}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 避難包建議 */}
                  <div className="bg-[#FAF9F6] rounded-xl border border-stone-205 p-5 flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-stone-800 flex items-center gap-1.5 uppercase tracking-wider">
                      <CloudLightning className="w-4 h-4 text-stone-600" /> 與日常生活的整備建議
                    </h3>
                    <div className="flex flex-col gap-3">
                      {analysisResult.bagRecommendations?.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-sm text-stone-700 font-semibold">
                           <div className="w-4 h-4 rounded-full bg-[#f4f1eb] border border-stone-300 flex items-center justify-center shrink-0 mt-0.5">
                             <Check className="w-2.5 h-2.5 text-stone-700" strokeWidth={3.5} />
                           </div>
                           <p className="leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

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
              
              {/* AI Chat Sidebar */}
              <div className="xl:col-span-1 flex flex-col gap-6">
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden flex flex-col h-[500px] xl:max-h-[850px] sticky top-24">
                  <div className="bg-[#FAF9F6] border-b border-stone-200 p-4 shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded bg-[#f4f1eb] text-stone-700 flex items-center justify-center">
                        <UserCircle2 className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold tracking-wider text-stone-800 font-sans">防災諮詢顧問</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-stone-500 animate-pulse" />
                       <span className="text-xs font-bold text-stone-500">待命諮詢中</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-stone-50/20 custom-scrollbar">
                    {chatHistory.length === 0 && (
                      <div className="text-center text-stone-600 text-sm my-auto bg-white p-5 rounded-lg border border-stone-200 max-w-xs mx-auto shadow-none">
                        <UserCircle2 className="w-8 h-8 text-stone-400 mx-auto mb-2" strokeWidth={1.5} />
                        <p className="font-bold text-sm text-stone-700 mb-1">對話諮詢</p>
                        <p className="text-stone-500 leading-relaxed text-xs">有任何防災與特定物資問題？隨時輸入向我確認與諮詢。</p>
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
                      className="flex-1 bg-stone-50 border border-stone-200 py-2.5 px-3 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-colors font-medium animate-none"
                    />
                    <button
                      type="submit"
                      disabled={isChatting || !chatMessage.trim()}
                      className="bg-stone-900 hover:bg-stone-800 text-white w-9 h-9 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center shrink-0 active:scale-95 shadow-none"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
              
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

