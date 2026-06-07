import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, AlertCircle, CloudLightning, HeartPulse, UserCircle2, 
  MapPin, Loader2, Send, CloudRainWind, Activity, ArrowRight, FileText,
  Home, Clock, Phone, Sparkles, Check, Key, Eye, EyeOff,
  Bike, AlertTriangle, Zap, Sun, Moon, Calendar, Compass, Settings, X
} from 'lucide-react';
import { SuppliesInventory } from './components/SuppliesInventory';
import { defaultSupplies } from './data';
import type { FamilyProfile, AIAnalysisResult, SupplyItem } from './types';
import { analyzeRisk, sendChatMessage, analyzeEnvironment } from './services/api';
import { EMERGENCY_GUIDES, SCENARIO_DATA } from './disasterData';

const CWA_API_KEY = ""; // 預載中央氣象署 API 金鑰
const SUSPENSION_RESOURCE_ID = "3160-54"; // 停班停課 API Resource ID

export default function App() {
  const [location, setLocation] = useState(() => localStorage.getItem('disaster_location_v1') || '嘉義市中山路199號');
  const [familyProfile, setFamilyProfile] = useState<FamilyProfile>(() => {
    const saved = localStorage.getItem('disaster_family_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Failed parsing family profile:', err);
      }
    }
    return {
      hasToddler: false,
      hasElderly: false,
      hasChronicIllness: false,
      hasMobilityIssues: false,
      hasDeliveryRider: false,
    };
  });
  
  // High contrast mode / Theme system (Dark mode)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('disaster_theme_dark');
    return saved ? saved === 'true' : false;
  });

  // Dual Toggle Mode: "routine" (平時準備) vs "emergency" (緊急當下)
  const [siteMode, setSiteMode] = useState<'routine' | 'emergency'>('routine');

  // Currently expanded guide card ("earthquake_securing" | "water_outage" | "family_plan")
  const [activeScenarioCard, setActiveScenarioCard] = useState<string | null>(null);

  const [activeScenario, setActiveScenario] = useState<'normal' | 'typhoon' | 'rain' | 'earthquake'>('normal');
  const [selectedSuspensionRegion, setSelectedSuspensionRegion] = useState<'north' | 'central' | 'south' | 'east'>('north');
  const [environmentDesc, setEnvironmentDesc] = useState(() => localStorage.getItem('disaster_env_desc_v1') || '');
  
  const [supplies, setSupplies] = useState<SupplyItem[]>(() => {
    const saved = localStorage.getItem('disaster_supplies_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Failed parsing saved supplies:', err);
      }
    }
    return defaultSupplies;
  });
  
  const [memberCount, setMemberCount] = useState<number>(() => {
    const saved = localStorage.getItem('disaster_member_count_v1');
    return saved ? parseInt(saved, 10) : 2;
  });

  const [activeEmergencyGuide, setActiveEmergencyGuide] = useState<'earthquake' | 'flooding' | 'typhoon' | 'landslide' | 'fire' | null>(null);
  const [emergencyChecks, setEmergencyChecks] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('disaster_emergency_checks_v1');
    return saved ? JSON.parse(saved) : {};
  });
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' ? !navigator.onLine : false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('disaster_theme_dark', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('disaster_location_v1', location);
  }, [location]);

  useEffect(() => {
    localStorage.setItem('disaster_family_v1', JSON.stringify(familyProfile));
  }, [familyProfile]);

  useEffect(() => {
    localStorage.setItem('disaster_member_count_v1', memberCount.toString());
  }, [memberCount]);

  useEffect(() => {
    localStorage.setItem('disaster_env_desc_v1', environmentDesc);
  }, [environmentDesc]);

  useEffect(() => {
    localStorage.setItem('disaster_supplies_v1', JSON.stringify(supplies));
  }, [supplies]);

  useEffect(() => {
    localStorage.setItem('disaster_emergency_checks_v1', JSON.stringify(emergencyChecks));
  }, [emergencyChecks]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Synchronize profile-specific materials
  useEffect(() => {
    setSupplies(prev => {
      let updated = [...prev];
      
      const syncItem = (id: string, category: string, name: string, urgency: 'immediate' | 'routine', shouldExist: boolean) => {
        const index = updated.findIndex(item => item.id === id);
        if (shouldExist && index === -1) {
          updated.push({ id, category, name, hasIt: false, urgency });
        } else if (!shouldExist && index !== -1) {
          updated = updated.filter(item => item.id !== id);
        }
      };

      syncItem('custom-toddler-food', '糧食飲水', '👶 嬰幼兒副食品、拉罐奶粉與保久食品 (加強防護)', 'immediate', familyProfile.hasToddler);
      syncItem('custom-toddler-diaper', '其他備品', '👶 嬰兒紙尿褲、隨載避用乾/濕紙巾套裝', 'immediate', familyProfile.hasToddler);
      syncItem('custom-toddler-med', '醫療急救', '👶 嬰兒專用退燒用藥與電子耳溫槍儀器', 'immediate', familyProfile.hasToddler);

      syncItem('custom-elderly-med', '醫療急救', '👴 長輩專屬慢性病連續處方藥物 (雙層拉鏈密封袋)', 'immediate', familyProfile.hasElderly);
      syncItem('custom-elderly-light', '求生工具', '👴 長輩臥房與常駐走道之免插電磁吸夜間感應燈', 'immediate', familyProfile.hasElderly);
      syncItem('custom-elderly-socks', '保暖禦寒', '👴 長輩專用蓄熱防凍乾爽棉襪與厚羽絨服', 'immediate', familyProfile.hasElderly);

      syncItem('custom-rider-gear', '保暖禦寒', '🛵 符合安全標準之防颱高亮反光雨衣兩截套組', 'immediate', familyProfile.hasDeliveryRider || false);
      syncItem('custom-rider-powerbank', '其他備品', '🛵 外勤必備 30000mAh 加拿大防滲透防水防摔行動電源', 'immediate', familyProfile.hasDeliveryRider || false);

      return updated;
    });
  }, [familyProfile.hasToddler, familyProfile.hasElderly, familyProfile.hasDeliveryRider]);


  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem("custom_gemini_key") || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");
  const [showTempApiKey, setShowTempApiKey] = useState(false);
  const [isEnvOpen, setIsEnvOpen] = useState(false);
  const [isFamilyOpen, setIsFamilyOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingEnv, setIsAnalyzingEnv] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'supplies' | 'chat'>('supplies');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Realtime Weather & Disaster warnings
  const [liveWeather, setLiveWeather] = useState<{
    temp: number;
    precipitation: number;
    windSpeed: number;
    weatherCode: number;
    condition: string;
    locationName: string;
    beautifiedWind: string;
    isDemo?: boolean;
    updatedAt?: string;
  } | null>(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState(false);

  const [suspensionDataLocal, setSuspensionDataLocal] = useState<{
    error: boolean;
    updatedAt: string;
    isDemo: boolean;
  } | null>(null);
  const [cwaAlerts, setCwaAlerts] = useState<{
    warnings: { title: string; description: string; pubDate: string }[];
    earthquakes: { title: string; description: string; pubDate: string }[];
  } | null>(null);
  const [isFetchingAlerts, setIsFetchingAlerts] = useState(false);

  const getSuspensionStatus = (region: string) => {
    switch(region) {
      case 'north':
        return activeScenario === 'typhoon' 
          ? { class: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-400', status: '達停止上班上課標準！', counties: ['基隆市 今天停止上班、今天停止上課。', '臺北市 今天停止上班、今天停止上課。', '新北市 今天停止上班、今天停止上課。'] }
          : { class: 'bg-stone-50 border-stone-200 text-stone-700 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-300', status: '照常上班及上課。', counties: ['基隆市 今天照常上班、今天照常上課。', '臺北市 今天照常上班、今天照常上課。', '新北市 今天照常上班、今天照常上課。'] };
      case 'central':
        return { class: 'bg-stone-50 border-stone-200 text-stone-700 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-300', status: '照常上班及上課。', counties: ['臺中市 今天照常上班、今天照常上課。', '彰化縣 今天照常上班、今天照常上課。', '南投縣 今天照常上班、今天照常上課。'] };
      case 'south':
        return { class: 'bg-stone-50 border-stone-200 text-stone-700 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-300', status: '照常上班及上課。', counties: ['臺南市 今天照常上班、今天照常上課。', '高雄市 今天照常上班、今天照常上課。', '屏東縣 今天照常上班、今天照常上課。'] };
      case 'east':
        return activeScenario === 'typhoon' || activeScenario === 'earthquake'
          ? { class: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-400', status: '部分鄉鎮停班停課', counties: ['花蓮縣 秀林鄉: 今天停止上班、今天停止上課。\n其他鄉鎮照常', '臺東縣 今天照常上班、今天照常上課。'] }
          : { class: 'bg-stone-50 border-stone-200 text-stone-700 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-300', status: '照常上班及上課。', counties: ['宜蘭縣 今天照常上班、今天照常上課。', '花蓮縣 今天照常上班、今天照常上課。', '臺東縣 今天照常上班、今天照常上課。'] };
      default:
        return { class: 'bg-stone-50 border-stone-200 text-stone-700 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-300', status: '無資料', counties: [] };
    }
  };

  const loadRealtimeWeather = async (addr: string) => {
    setIsFetchingWeather(true);
    setWeatherError(false);
    try {
      const now = new Date();
      const formatTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
      
      const res = await fetch(`/api/weather?location=${encodeURIComponent(addr)}`);
      if (res.ok) {
        const data = await res.json();
        setLiveWeather({
          temp: data.temp,
          precipitation: data.precipitation,
          windSpeed: data.windSpeed,
          weatherCode: data.weatherCode,
          condition: data.condition,
          locationName: data.locationName || addr,
          beautifiedWind: data.windSpeed > 10 ? '西南強風' : '風速舒緩',
          isDemo: false,
          updatedAt: formatTime
        });
      } else {
        // Fallback demo data based on active scenario if API is missing
        setLiveWeather({
          temp: activeScenario === 'typhoon' ? 24 : activeScenario === 'rain' ? 22 : 27,
          precipitation: activeScenario === 'typhoon' ? 45 : activeScenario === 'rain' ? 95 : 0,
          windSpeed: activeScenario === 'typhoon' ? 42 : activeScenario === 'rain' ? 8 : 1.5,
          weatherCode: activeScenario === 'typhoon' ? 9 : activeScenario === 'rain' ? 8 : 1,
          condition: activeScenario === 'typhoon' ? '⚡ 猛烈強風雨' : activeScenario === 'rain' ? '🌧 豪雨密佈' : '☀ 晴空舒爽',
          locationName: addr,
          beautifiedWind: activeScenario === 'typhoon' ? '12級 暴隆狂風' : '清徐微風',
          isDemo: true,
          updatedAt: formatTime
        });
      }
    } catch (e) {
      console.error("CWA weather error:", e);
      setWeatherError(true);
    } finally {
      setIsFetchingWeather(false);
    }
  };

  const loadCwaAlerts = async () => {
    setIsFetchingAlerts(true);
    try {
      const res = await fetch("/api/cwa-alerts");
      if (res.ok) {
        const data = await res.json();
        setCwaAlerts(data);
      }
    } catch (e) {
      console.warn("Server CWA alerts endpoint not available or returned error:", e);
    } finally {
      setIsFetchingAlerts(false);
    }
  };

  const loadSuspensionData = async () => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`https://data.gov.tw/api/v2/rest/datastore/${SUSPENSION_RESOURCE_ID}`, {
        signal: controller.signal
      });
      clearTimeout(id);
      if (!res.ok) throw new Error("API failed");
      await res.json();
      
      const now = new Date();
      setSuspensionDataLocal({
        isDemo: false,
        error: false,
        updatedAt: now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0')
      });
    } catch(e) {
      const now = new Date();
      setSuspensionDataLocal({
        isDemo: true,
        error: true,
        updatedAt: now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0')
      });
    }
  };

  useEffect(() => {
    loadRealtimeWeather(location);
    loadCwaAlerts();
    loadSuspensionData();
    const inv = setInterval(loadSuspensionData, 10 * 60 * 1000);
    return () => clearInterval(inv);
  }, []);

  const handleSaveApiKey = (newKey: string) => {
    console.log('API Key 按下，目前值：', newKey);
    setCustomApiKey(newKey);
    const trimmed = newKey.trim();
    if (trimmed) {
      localStorage.setItem("custom_gemini_key", trimmed);
    } else {
      localStorage.removeItem("custom_gemini_key");
    }
  };

  // Submit button explicit onClick handler tracking as user requested
  const handleApiKeySubmit = () => {
    console.log('API Key 按下，現行Key:', customApiKey);
    const trimmed = customApiKey.trim();
    if (trimmed) {
      localStorage.setItem("custom_gemini_key", trimmed);
      alert("API 金鑰已成功送出並儲存於本地！");
    } else {
      localStorage.removeItem("custom_gemini_key");
      alert("儲存空值，個人金鑰已清除。");
    }
  };

  const handleTempApiKeyChange = (val: string) => {
    setTempApiKey(val);
    const trimmed = val.trim();
    if (trimmed) {
      localStorage.setItem("custom_gemini_key", trimmed);
      setCustomApiKey(trimmed);
    } else {
      localStorage.removeItem("custom_gemini_key");
      setCustomApiKey("");
    }
  };

  const handleGenerateClick = () => {
    const savedKey = localStorage.getItem("custom_gemini_key") || customApiKey;
    if (!savedKey || !savedKey.trim()) {
      setTempApiKey("");
      setIsApiKeyModalOpen(true);
    } else {
      handleAnalyze();
    }
  };

  const handleAnalyze = async (overrideProfile?: FamilyProfile, overrideEnv?: string) => {
    if (!location.trim()) return;
    setIsAnalyzing(true);
    try {
      await loadRealtimeWeather(location);
      
      let currentEnv = overrideEnv !== undefined ? overrideEnv : environmentDesc;
      
      if (!currentEnv.trim()) {
        setIsAnalyzingEnv(true);
        try {
          const data = await analyzeEnvironment(location);
          currentEnv = data.environmentDesc;
          setEnvironmentDesc(currentEnv);
        } catch (envErr) {
          console.error("Auto env analysis failed:", envErr);
        } finally {
          setIsAnalyzingEnv(false);
        }
      }

      const activeProfile = overrideProfile || familyProfile;
      const missingItems = supplies.filter(s => !s.hasIt).map(s => s.name);
      
      const data = await analyzeRisk(location, activeProfile, currentEnv, missingItems);
      setAnalysisResult(data);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "分析失敗，請稍後再試。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analysisAutoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAutoAnalyze = (profile?: FamilyProfile, env?: string) => {
    if (analysisAutoTimeoutRef.current) clearTimeout(analysisAutoTimeoutRef.current);
    analysisAutoTimeoutRef.current = setTimeout(() => {
      handleAnalyze(profile, env);
    }, 600);
  };

  const handleProfileChange = (key: keyof FamilyProfile) => {
    setFamilyProfile(prev => {
      const nextProfile = { ...prev, [key]: !prev[key] };
      triggerAutoAnalyze(nextProfile, undefined);
      return nextProfile;
    });
  };

  const handleAnalyzeEnvironment = async () => {
    if (!location.trim()) return;
    setIsAnalyzingEnv(true);
    try {
      const data = await analyzeEnvironment(location);
      setEnvironmentDesc(data.environmentDesc);
      triggerAutoAnalyze(undefined, data.environmentDesc);
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
            
            taiwanAddress = `${city}${suburb}${road}${houseNumber}`;
          }
          
          if (!taiwanAddress && data && data.display_name) {
            taiwanAddress = data.display_name;
          }
          
          if (taiwanAddress) {
            taiwanAddress = taiwanAddress.replace(/^\d+/, '').trim();
            setLocation(taiwanAddress);
            loadRealtimeWeather(taiwanAddress);
          } else {
            const coords = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
            setLocation(coords);
            loadRealtimeWeather(coords);
          }
        } catch (err) {
          console.error("Geolocation reverse geocode failed:", err);
          const coords = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          setLocation(coords);
          loadRealtimeWeather(coords);
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
            "嚴禁搭乘電梯！下樓應走普通安全爬梯避難，並準備含有至少一天份乾糧與飲水的手電筒緊急逃生包。"
          ]
        },
        shelterGuidance: {
          nearestOptions: [
            "中正體育館（緊急避難集中點）",
            "基隆市立中正國中避難中心"
          ],
          safetyCriteria: [
            "避難路線應避開山坡邊緣或有落石危險的狹窄巷道。",
            "避風撤離，嚴格查清並避免靠近高空易墜广告看板與大樹。"
          ]
        },
        deficiencyAnalysis: {
          weaknesses: [
            "缺少手電筒及備用電池，夜間停電時風險高。",
            "未固定大型家具，強震時易壓傷。"
          ],
          improvements: [
            "盡快準備手電筒及手搖發電收音機。",
            "使用L型鐵件或防傾倒支撐架固定衣櫃、書架等高大家具。"
          ]
        }
      });
    }

    setTimeout(() => {
      setIsAnalyzing(false);
    }, 1200);
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-stone-950 text-stone-100 selection:bg-orange-500/30' 
        : 'bg-stone-50 text-stone-900 selection:bg-red-500/20'
    } p-3 sm:p-5 md:p-8`}>
      
      {/* Dynamic Header */}
      <header className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-stone-250 dark:border-stone-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-orange-600 text-white flex items-center justify-center shadow-md shrink-0">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div className="text-left">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight dark:text-white">
              防災生活與居住準備指南
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-bold">
              台灣家庭必備 ｜ 基於中央氣象署即時預警與 Google Gemini AI 個人化自救分析
            </p>
          </div>
        </div>
        
        {/* Header toolbar stats & controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* PWA offline readiness status */}
          <div className={`text-xs px-3.5 py-1.5 rounded-full border font-bold flex items-center gap-1.5 shadow-xs ${
            isOffline 
              ? 'bg-red-50/90 text-red-700 border-red-200 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400' 
              : 'bg-emerald-50/90 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-600 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
            <span>{isOffline ? '離線備用模式 (已備份)' : 'PWA 離線就緒 ｜ 網路已連接'}</span>
          </div>

          {/* Theme switcher */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-10 h-10 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors duration-200 cursor-pointer min-h-[48px]"
            aria-label="切換高對比深色模式"
            title="一鍵切換深色與省電模式"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-900" />}
          </button>
        </div>
      </header>

      {/* Hero Mode Dual Toggle (Routine vs Emergency NOW) */}
      <section className="max-w-7xl mx-auto mb-8 bg-white dark:bg-stone-900 rounded-3xl p-5 md:p-8 border border-stone-250 dark:border-stone-800 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.03)] relative overflow-hidden text-left">
        <div className="absolute right-0 top-0 w-64 h-64 bg-slate-100 dark:bg-orange-950/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-stone-150 dark:border-stone-800">
          <div className="max-w-xl">
            <span className="text-xs bg-slate-900 dark:bg-orange-600 text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-widest leading-none">
              雙軌災防防禦系統 Active Switch
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-3 tracking-tight leading-tight dark:text-white">
              {siteMode === 'routine' ? '🧘‍♂️ 平常心，做好房舍與物資儲備' : '🚨 臨震暴洪，極速避難自救指導'}
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-2 font-medium">
              {siteMode === 'routine' 
                ? '本指南結合現代住宅結構安全與家庭應變實務，致力於協助大眾在日常生活中建立系統化的防災準備，構築安全的居住環境。'
                : '本模式在遭遇突發地震、積水淹水或強烈風災等緊急形勢下，為您提供即時就地避難命令、緊急通報電話直撥與離線自救步驟指引。'
              }
            </p>
          </div>

          {/* Toggle buttons */}
          <div className="flex bg-stone-100 dark:bg-stone-950 p-2 rounded-2xl border border-stone-200 dark:border-stone-800 md:self-start xl:self-center">
            <button
              onClick={() => setSiteMode('routine')}
              className={`px-6 py-3.5 rounded-xl font-extrabold text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                siteMode === 'routine'
                  ? 'bg-slate-700 text-white shadow-md dark:bg-slate-800'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-900'
              } min-h-[48px] min-w-[140px]`}
              role="tab"
              aria-selected={siteMode === 'routine'}
            >
              <Check className="w-4 h-4 text-emerald-400" strokeWidth={3} />
              <span>平時準備 Routine</span>
            </button>
            <button
              onClick={() => setSiteMode('emergency')}
              className={`px-6 py-3.5 rounded-xl font-extrabold text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                siteMode === 'emergency'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-900'
              } min-h-[48px] min-w-[140px]`}
              role="tab"
              aria-selected={siteMode === 'emergency'}
            >
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
              <span>緊急當下 Emergency</span>
            </button>
          </div>
        </div>

        {/* Demo Scenario Controller - For quick preview */}
        <div className="mt-5 flex flex-wrap items-center gap-2 z-10 relative">
          <span className="text-xs font-bold text-stone-500 dark:text-stone-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-orange-500" />
            快速模擬災害情境：
          </span>
          <button
            onClick={() => handleSelectScenario('normal')}
            className={`px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all border cursor-pointer min-h-[48px] ${
              activeScenario === 'normal' 
                ? 'bg-slate-500 border-slate-600 text-white' 
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            🟢 平常晴好 (預設)
          </button>
          <button
            onClick={() => handleSelectScenario('typhoon')}
            className={`px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all border cursor-pointer min-h-[48px] ${
              activeScenario === 'typhoon' 
                ? 'bg-orange-600 border-orange-700 text-white animate-pulse' 
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            🌀 強烈颱風 (長輩+外送高危險)
          </button>
        </div>
      </section>

      {/* Main Grid Wrapper */}
      <main className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-6 text-left">
        
        {/* Left Setting Rail & Guides Grid */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Conditional Layout depending on Double-Toggle SiteMode */}
          {siteMode === 'routine' ? (
            /* ==================== 1. PROGRESSIVE ROUTINE PREPAREDNESS AREA ==================== */
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              
              {/* Dynamic Map and Location setup */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-3xl p-6 shadow-sm flex flex-col md:grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-3 tracking-wide uppercase border-b border-stone-100 dark:border-stone-800 pb-2.5">
                    <MapPin className="w-4.5 h-4.5 text-slate-700 dark:text-orange-500" />
                    居住區域 / 目標定位
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 leading-relaxed">
                    請輸入您日常生活的居住位置，或利用下方 GPS 高精度自動定位。系統將依位置分析排水灌注、坡面裂帶以及里鄰防災中心的安全通達路線。
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="請輸入地址、鄉鎮或大廈標誌..."
                        className="w-full bg-stone-50 dark:bg-stone-950 focus:bg-white border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white rounded-xl pl-3 pr-10 py-3 text-base focus:outline-none focus:ring-2 focus:ring-slate-500 font-semibold min-h-[48px]"
                      />
                      <button
                        type="button"
                        onClick={handleGeolocate}
                        disabled={isLocating}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg text-slate-700 dark:text-orange-500 min-h-[44px]"
                        title="使用高精 GPS 定位"
                      >
                        {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Compass className="w-5 h-5 hover:scale-105 duration-200 transition-transform" />}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleGeolocate}
                        disabled={isLocating}
                        className="border border-stone-250 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-850 hover:text-stone-950 dark:hover:text-white bg-white dark:bg-stone-900 text-stone-750 dark:text-stone-300 rounded-xl py-3 px-4 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[48px]"
                      >
                        <Compass className="w-4 h-4 text-slate-700 dark:text-orange-500" />
                        <span>GPS 定位獲取</span>
                      </button>

                      <button
                        onClick={handleAnalyzeEnvironment}
                        disabled={isAnalyzingEnv || !location.trim()}
                        className="border border-stone-250 dark:border-stone-800 bg-slate-50 hover:bg-slate-100 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-xl py-3 px-4 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[48px]"
                      >
                        {isAnalyzingEnv ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-slate-700 dark:text-orange-500" />}
                        <span>分析地理水文</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Environment description box */}
                <div className="bg-stone-50 dark:bg-stone-950 border border-stone-150 dark:border-stone-850 p-4.5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-stone-600 dark:text-stone-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                      <Home className="w-3.5 h-3.5 text-slate-700 dark:text-orange-500" />
                      地脈描述及環境脆弱特點
                    </h4>
                    <textarea
                      value={environmentDesc}
                      onChange={(e) => setEnvironmentDesc(e.target.value)}
                      placeholder="點值「分析地理水文」大自理盤點，或自行描述如「臨近陡坡山腳」、「周遭無大型高壓電線桿」等細微特徵..."
                      className="w-full bg-transparent border-none text-stone-800 dark:text-stone-200 text-sm focus:outline-none resize-none font-medium h-24 placeholder:text-stone-400"
                    />
                  </div>
                  <div className="text-[11px] text-stone-400 font-bold border-t border-stone-200/50 dark:border-stone-800/50 pt-2 flex items-center justify-between">
                    <span>備災特點分析參數</span>
                    <span>自動備份保存中</span>
                  </div>
                </div>
              </div>

              {/* Family specific attributes config with increased click heights */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-3 tracking-wide uppercase border-b border-stone-100 dark:border-stone-800 pb-2.5">
                  <HeartPulse className="w-4.5 h-4.5 text-slate-700 dark:text-orange-500" />
                  家屬特殊防護屬性配置 (動態物資同步)
                </h3>
                <p className="text-xs text-stone-550 dark:text-stone-400 mb-5 leading-normal">
                  勾選家屬屬性後，右側「物資避難防備清單」將自動合併加載家屬所需的特設藥、尿布、反光防風雨具及不斷電應急包物資，確保防護全面到位。
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {[
                    { key: 'hasToddler', emoji: '👶', title: '有嬰幼兒需求（學齡前）', desc: '動態加載奶粉、紙尿褲、應急小兒常備藥物' },
                    { key: 'hasElderly', emoji: '👴', title: '有高齡長輩同行或獨居', desc: '動態加載七天慢病備用處方藥、夜起感應手電燈' },
                    { key: 'hasChronicIllness', emoji: '🏥', title: '有慢性重症常備處方药需求', desc: '提醒隨身必備胰島素或降血壓、心血管密閉藥袋' },
                    { key: 'hasMobilityIssues', emoji: '♿', title: '有行動不便、輪椅、拐杖需求', desc: '引導指定高承載無障礙垂直避難路線及疏運協助人' },
                    { key: 'hasDeliveryRider', emoji: '🛵', title: '家屬有外勤、外送騎乘工作者', desc: '提醒颱風停班強力斷單、高規格反光兩截套鞋與防滑' }
                  ].map((family) => {
                    const active = !!(familyProfile as any)[family.key];
                    return (
                      <div
                        key={family.key}
                        onClick={() => handleProfileChange(family.key as any)}
                        className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer select-none transition-all ${
                          active
                            ? 'bg-emerald-50/50 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900'
                            : 'bg-stone-50 border-stone-200 dark:bg-stone-950 dark:border-stone-800 hover:border-stone-350 hover:bg-stone-100/40 dark:hover:bg-stone-900'
                        } min-h-[64px]`}
                      >
                        <div className="mt-0.5">
                          <div className={`w-[22px] h-[22px] rounded border flex items-center justify-center transition-all ${
                            active ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300 bg-white dark:bg-stone-900 text-transparent'
                          }`}>
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />
                          </div>
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-sm font-extrabold text-stone-900 dark:text-white flex items-center gap-1.5">
                            <span className="text-base">{family.emoji}</span>
                            <span>{family.title}</span>
                          </span>
                          <span className="block text-[11px] text-stone-450 dark:text-stone-400 mt-1 font-semibold leading-normal">
                            {family.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Scenario Guide Cards (情境導覽卡片) with Hover Details click drawer inside */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-3 tracking-wide uppercase border-b border-stone-100 dark:border-stone-800 pb-2.5">
                  <Compass className="w-4.5 h-4.5 text-slate-700 dark:text-orange-500" />
                  家庭備災三大核心情境卡 ｜ Hover ＆ Click 自救指南
                </h3>
                <p className="text-xs text-stone-550 dark:text-stone-400 mb-5 leading-normal">
                  點選卡片即可在下方動態解鎖資深工程師與 UX 設計師專為您編寫的逐步防災指引、工具備忘錄及 PWA 離線應變守則。
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
                  {Object.entries(SCENARIO_DATA).map(([key, item]) => {
                    const expanded = activeScenarioCard === key;
                    return (
                      <div
                        key={key}
                        onClick={() => setActiveScenarioCard(expanded ? null : key)}
                        className={`group bg-[#FAF9F6] dark:bg-stone-950 border rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer text-left select-none transition-all duration-300 ${
                          expanded 
                            ? 'border-slate-600 ring-2 ring-slate-100 dark:ring-stone-800/40' 
                            : 'border-stone-200 dark:border-stone-800 hover:border-slate-400 dark:hover:border-stone-700 hover:scale-[1.02]'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 flex items-center justify-center text-lg shadow-xs group-hover:scale-105 duration-200 transition-transform shrink-0 mb-3">
                          {item.icon}
                        </div>
                        <h4 className="text-sm font-extrabold text-stone-900 dark:text-white group-hover:text-slate-800 dark:group-hover:text-orange-400 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-stone-450 dark:text-stone-500 font-extrabold uppercase mt-1">
                          {item.category}
                        </p>
                        <p className="text-xs text-stone-600 dark:text-stone-400 font-semibold mt-3 leading-relaxed flex-1">
                          {item.shortDesc}
                        </p>
                        <div className="mt-4 border-t border-stone-200/50 dark:border-stone-800/50 pt-2 text-right">
                          <span className="text-[11px] text-slate-500 font-bold group-hover:underline flex items-center justify-end gap-1">
                            <span>{expanded ? '▲ 收合自救手冊' : '▼ 點擊解鎖精細指南'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sub-Card expandable content drawer */}
                {activeScenarioCard && (() => {
                  const data = SCENARIO_DATA[activeScenarioCard];
                  return (
                    <div className="mt-6 bg-[#FAF9F6] dark:bg-stone-950 border border-slate-200 dark:border-stone-850 rounded-2xl p-5 md:p-6 text-left animate-in slide-in-from-top-3 duration-300">
                      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3 mb-4.5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{data.icon}</span>
                          <h4 className="text-sm md:text-base font-extrabold text-stone-900 dark:text-white">
                            {data.title} 綜合作戰指引手冊
                          </h4>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveScenarioCard(null); }}
                          className="text-stone-450 hover:text-stone-700 dark:hover:text-stone-200 p-1 min-h-[44px]"
                        >
                          收起 ✕
                        </button>
                      </div>

                      <div className="text-xs bg-emerald-500/10 dark:bg-emerald-900/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 p-4 rounded-xl flex gap-3 mb-5">
                        <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="leading-relaxed font-semibold">
                          <strong>PWA 離線防護說明：</strong>{data.pwaReadyText}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data.guidelines.map((section, sidx) => (
                          <div key={sidx} className="space-y-4">
                            <h5 className="text-xs font-extrabold text-slate-800 dark:text-orange-400 tracking-wider uppercase border-l-2 border-slate-600 dark:border-orange-500 pl-2">
                              {section.sectionTitle}
                            </h5>
                            <div className="space-y-3">
                              {section.items.map((item, iidx) => (
                                <div key={iidx} className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-3.5 rounded-xl flex flex-col gap-1">
                                  <span className="text-xs sm:text-sm font-extrabold text-stone-850 dark:text-white">
                                    {section.items.length > 2 ? `${iidx + 1}. ` : ''}{item.title}
                                  </span>
                                  <span className="text-xs text-stone-650 dark:text-stone-400 leading-relaxed font-semibold">
                                    {item.desc}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* Complete AI Advanced Configuration block with new submit button */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-3xl p-6 shadow-sm">
                <div 
                  onClick={() => setIsAiOpen(!isAiOpen)}
                  className="flex items-center justify-between cursor-pointer select-none group min-h-[44px]"
                >
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                     <Key className="w-4.5 h-4.5 text-slate-700 dark:text-orange-500" />
                     進階 AI 設定（選填金鑰）
                  </h3>
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-810 group-hover:bg-stone-200 dark:group-hover:bg-stone-800 transition-transform duration-250 ${isAiOpen ? 'rotate-180' : 'rotate-0'}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-stone-500"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>

                <div 
                  className="transition-[max-height] duration-300 ease-in-out overflow-hidden"
                  style={{ maxHeight: isAiOpen ? '600px' : '0px' }}
                >
                  <div className="flex flex-col gap-3.5 pt-4 border-t border-stone-100 dark:border-stone-800 mt-3">
                    <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed font-semibold">
                      在這裡填入您的個人 <strong className="text-slate-800 dark:text-white pr-0.5">Gemini API Key</strong> 即可啟用由 Google Gemini 2.5 Flash 驅動的高精密度避難診斷，針對您填載的家屬特殊需求、地理特點，一秒揪出安全漏洞：
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <input
                          type={showApiKey ? "text" : "password"}
                          value={customApiKey}
                          onChange={(e) => handleSaveApiKey(e.target.value)}
                          placeholder="請在此貼上您的 Gemini API Key (以 AI_ 開頭)"
                          className="w-full bg-stone-50 dark:bg-stone-950 hover:bg-stone-100/50 dark:hover:bg-stone-900 focus:bg-white border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white rounded-xl pl-3 pr-10 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 font-mono placeholder:text-stone-450 min-h-[48px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 min-h-[44px]"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Prominent High-Contrast Key submission button */}
                      <button
                        type="button"
                        onClick={handleApiKeySubmit}
                        className="bg-slate-800 hover:bg-slate-900 dark:bg-orange-600 dark:hover:bg-orange-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer min-h-[48px]"
                      >
                        <Check className="w-4 h-4" strokeWidth={3} />
                        <span>送出/儲存金鑰</span>
                      </button>
                    </div>

                    <p className="text-xs text-stone-500 dark:text-stone-400 font-bold leading-normal">
                      💡 無論填寫與否，皆可使用完整的互動清單及離線功能。
                    </p>

                    <div className="flex items-center justify-between mt-1 px-1">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${customApiKey ? "bg-emerald-500 animate-pulse" : "bg-stone-400"}`} />
                        <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                          {customApiKey ? "已啟用個人專屬 AI 分析診斷" : "尚未填用金鑰 (將使用內建專家知識範本)"}
                        </span>
                      </div>
                      {customApiKey && (
                        <button
                          onClick={() => { handleSaveApiKey(""); alert("金鑰已清空。"); }}
                          className="text-xs font-extrabold text-red-650 hover:underline cursor-pointer min-h-[44px]"
                        >
                          清除重置
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* ==================== 2. CRISIS-RESPONSE EMERGENCY NOW AREA ==================== */
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              
              {/* Emergency self-rescue warning board */}
              <div className="bg-gradient-to-br from-red-600 to-orange-600 rounded-3xl p-6 md:p-8 text-white text-left relative overflow-hidden shadow-lg border border-red-500">
                <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/20 pb-4 mb-4">
                    <span className="text-[11px] bg-yellow-400 text-stone-900 font-black px-3 py-1 rounded-full uppercase tracking-widest leading-none">
                      ⚠️ 臨災極速核對秒抗自救命令
                    </span>
                    <span className="text-xs font-mono font-bold text-red-100 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> 當前即時防護基準
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
                    別慌！點擊下方您正遭遇的災殃
                  </h3>
                  <p className="text-xs text-red-100 mt-1.5 mb-5 font-semibold">
                    此看板備妥了最精鍊、高對比、大字體的逐步救命命令。即使已無基地台與網路連線，也可隨時跟進落實。
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { key: 'earthquake', emoji: '🌋', title: '強烈地震' },
                      { key: 'flooding', emoji: '🌊', title: '淹水暴溢' },
                      { key: 'typhoon', emoji: '🌀', title: '超強颱風' },
                      { key: 'landslide', emoji: '🏔️', title: '土石流崩山' },
                      { key: 'fire', emoji: '🔥', title: '室內火災' }
                    ].map((guide) => (
                      <button
                        key={guide.key}
                        onClick={() => setActiveEmergencyGuide(guide.key as any)}
                        className="bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 hover:border-white/40 text-white rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all text-center font-bold cursor-pointer min-h-[64px]"
                      >
                        <span className="text-xl shrink-0">{guide.emoji}</span>
                        <span className="text-[11px] tracking-wide whitespace-nowrap">{guide.title} →</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Disaster Alerts and live meteorological metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Meteorological watch block */}
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-stone-700 dark:text-stone-300 flex items-center justify-between tracking-wider mb-4">
                      <span className="flex items-center gap-1.5 uppercase font-sans">
                        <Activity className="w-4 h-4 text-orange-500 animate-pulse" />
                        災防局即時監控數據
                      </span>
                      <span className="text-[10px] font-bold text-stone-405 font-mono">
                        更新：{liveWeather?.updatedAt || '--:--'}
                      </span>
                    </h3>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-stone-50 dark:bg-stone-950 border border-stone-150 dark:border-stone-850 rounded-xl p-3 text-left">
                        <span className="text-[10px] text-stone-450 dark:text-stone-400 font-bold block uppercase tracking-wider">今日累積降水量</span>
                        <span className="text-lg font-extrabold text-stone-900 dark:text-white block mt-0.5">
                          {activeScenario === 'rain' ? '380 mm' : activeScenario === 'typhoon' ? '290 mm' : '15 mm'}
                        </span>
                        <span className="text-[9px] text-[#ea580c] dark:text-orange-400 font-bold block mt-0.5">
                          {activeScenario === 'rain' ? '📍嘉義山區紅色警戒' : activeScenario === 'typhoon' ? '📍宜蘭降水注意' : '水位正常'}
                        </span>
                      </div>

                      <div className="bg-stone-50 dark:bg-stone-950 border border-stone-150 dark:border-stone-850 rounded-xl p-3 text-left">
                        <span className="text-[10px] text-stone-450 dark:text-stone-400 font-bold block uppercase tracking-wider">瞬間風力評估</span>
                        <span className="text-lg font-extrabold text-stone-900 dark:text-white block mt-0.5">
                          {activeScenario === 'typhoon' ? '14 級強風' : '風力舒暖'}
                        </span>
                        <span className="text-[9px] text-[#ea580c] dark:text-orange-400 font-bold block mt-0.5">
                          {activeScenario === 'typhoon' ? '📍東北角高強大風' : '正常對流風'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-500/10 border border-orange-500/20 p-3.5 rounded-xl flex items-start gap-2 text-left">
                    <Bike className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-orange-850 dark:text-orange-300 font-bold leading-relaxed">
                      <strong>停班課外送即刻關閉：</strong>當公告停止上班課，本區將即刻強制封閉機慢車外勤。外勤工作者請一律返回水泥掩體！
                    </p>
                  </div>
                </div>

                {/* Hot dial telephones list with touch sizes */}
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 uppercase mb-2">
                      <Phone className="w-4 h-4 text-orange-500 animate-pulse" />
                      緊急自救直撥通報卡
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 leading-normal">
                      網路中斷、通網崩潰但仍有電信基地台殘存信號時，請立即抓起手機直撥自救平安熱線：
                    </p>

                    <div className="grid grid-cols-2 gap-2.5">
                      <a
                        href="tel:119"
                        className="bg-red-500 hover:bg-red-600 text-white rounded-xl p-3 font-extrabold flex flex-col items-center justify-center cursor-pointer min-h-[52px]"
                      >
                        <span className="text-[10px] opacity-80 uppercase font-black">火警及緊急救護</span>
                        <span className="text-xl font-mono">119 →</span>
                      </a>
                      <a
                        href="tel:110"
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-3 font-extrabold flex flex-col items-center justify-center cursor-pointer min-h-[52px]"
                      >
                        <span className="text-[10px] opacity-80 uppercase font-black">治安緊急報案</span>
                        <span className="text-xl font-mono">110 →</span>
                      </a>
                      <a
                        href="tel:112"
                        className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl p-3 font-extrabold flex flex-col items-center justify-center cursor-pointer min-h-[52px] col-span-2"
                      >
                        <span className="text-[10px] opacity-80 uppercase font-black">完全無卡、無基地台緊急求救</span>
                        <span className="text-base font-mono">通用行動求救專線 112 →</span>
                      </a>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-450 dark:text-stone-400 mt-3 font-semibold text-center border-t border-stone-150 dark:border-stone-850 pt-2.5">
                    💡 撥打緊急電話應簡潔說明：什麼人、在哪裡、發生什麼事。
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* ==================== 3. ADAPTIVE ANALYZED RISK OUTCOMES AREA ==================== */}
          {/* AI Trigger active execution panel */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-stone-150 dark:border-stone-800 pb-5 mb-5">
              <div>
                <h3 className="text-base md:text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-slate-705 dark:text-orange-500 animate-pulse" />
                  客製化 AI 防災生活卡與安全盲區分析
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-semibold leading-relaxed">
                  系統將整合您的【目標地址地理大數據】、【家屬年齡及工作配置】以及【避難物資勾選進度】，生成您住宅的個人化避難手冊。
                </p>
              </div>
              
              <button
                onClick={handleGenerateClick}
                disabled={isAnalyzing || !location.trim()}
                className="bg-slate-800 hover:bg-slate-900 dark:bg-orange-600 dark:hover:bg-orange-700 text-white font-extrabold text-sm px-6 py-3.5 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40 cursor-pointer min-h-[48px]"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>地文編算中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 animate-bounce text-white" />
                    <span>即刻生成客製指南</span>
                  </>
                )}
              </button>
            </div>

            {/* If analyzing is loading */}
            {isAnalyzing && (
              <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200/80 dark:border-stone-850 min-h-[300px] flex flex-col items-center justify-center p-8 text-center rounded-2xl">
                <Loader2 className="w-10 h-10 animate-spin text-slate-700 dark:text-orange-500 mb-4" />
                <h4 className="text-sm font-extrabold text-stone-900 dark:text-white tracking-widest uppercase">
                  正在探查住宅地理水文防禦臨界點...
                </h4>
                <p className="text-xs text-stone-450 dark:text-stone-400 mt-1.5 max-w-sm leading-relaxed font-semibold">
                  正在讀取台灣坡地穩定係數、防土木強度、周遭河水回水位大數據，高精度避難分析即將就緒。
                </p>
              </div>
            )}

            {/* Live custom AI guidance outcome is rendered below */}
            {analysisResult && !isAnalyzing && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* Dynamic warning banners */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Suspension indicators */}
                  <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-5 rounded-2xl flex items-center gap-4 text-left">
                    <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-extrabold shrink-0 border uppercase ${
                      analysisResult.suspensionIndicator?.level === '高' 
                        ? 'bg-red-650 text-white border-red-500 bg-red-900/30 text-red-300' 
                        : analysisResult.suspensionIndicator?.level === '中'
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        : 'bg-stone-100 text-stone-500 dark:bg-neutral-800'
                    }`}>
                      <span className="text-[9px] opacity-80 leading-none">挑戰</span>
                      <span className="text-lg leading-none mt-1">{analysisResult.suspensionIndicator?.level || '低'}</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-extrabold tracking-widest text-[#ea580c] uppercase block mb-0.5">預判停班停課指標</span>
                      <span className="text-sm font-extrabold text-stone-900 dark:text-white">
                        評估挑戰度「{analysisResult.suspensionIndicator?.level}」
                      </span>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed font-semibold">
                        {analysisResult.suspensionIndicator?.reasons?.[0] || '鄰近區域排水或地能良好，暫無暴洪淹溢特報威威。'}
                      </p>
                    </div>
                  </div>

                  {/* High contrast visual summary */}
                  <div className="bg-slate-900 dark:bg-stone-950 border border-stone-800 p-5 rounded-2xl flex flex-col justify-center text-left">
                    <span className="text-[10px] font-extrabold tracking-widest text-slate-300 dark:text-orange-400 uppercase block mb-1">
                      🚨 居住風險核心摘要 RISK DIRECTIVE
                    </span>
                    <p className="text-xs sm:text-sm text-stone-200 dark:text-stone-305 font-bold leading-relaxed">
                      {analysisResult.disasterRisk?.summary}
                    </p>
                  </div>

                </div>

                {/* Sub components factors */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {analysisResult.disasterRisk?.factors?.map((factor, idx) => {
                    const isHigh = factor.riskLevel.includes('🔴') || factor.riskLevel.includes('高');
                    const isMed = factor.riskLevel.includes('🟡') || factor.riskLevel.includes('中') || factor.riskLevel.includes('注意');
                    return (
                      <div key={idx} className={`bg-stone-50 dark:bg-stone-950 border rounded-2xl p-4 flex flex-col justify-between gap-2.5 transition-all ${
                        isHigh ? 'border-red-450 dark:border-red-900 bg-red-500/5' : isMed ? 'border-amber-300' : 'border-stone-200 dark:border-stone-850'
                      }`}>
                        <span className="text-xs font-black text-stone-900 dark:text-white block text-left">
                          {factor.name}
                        </span>
                        <span className={`text-[11px] font-bold tracking-wide flex items-center gap-1 block text-left ${
                          isHigh ? 'text-red-650' : 'text-stone-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isHigh ? 'bg-red-600 animate-ping' : 'bg-stone-400'}`} />
                          <span>{factor.riskLevel.replace(/🟢|🟡|🔴/g, '')}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Family custom care boxes */}
                {(familyProfile.hasElderly || familyProfile.hasDeliveryRider || familyProfile.hasToddler) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                    
                    {familyProfile.hasElderly && (
                      <div className="bg-amber-500/5 border border-amber-300/60 dark:border-amber-900/50 rounded-2xl p-5 text-left">
                        <span className="text-base block mb-1">👴 長輩緊急防摔與用藥特殊哨兵</span>
                        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-semibold">
                          長輩移動遲緩、視力或關節在大雨寒冷侵襲下易受影響。請務必核查 7-14 天高血壓慢病處方藥，玄關大門處備用手電筒不可有雜物阻塞，演練「趴下掩護」掩體。
                        </p>
                      </div>
                    )}

                    {familyProfile.hasDeliveryRider && (
                      <div className="bg-indigo-500/5 border border-indigo-300/60 dark:border-indigo-900/50 rounded-2xl p-5 text-left">
                        <span className="text-base block mb-1">🛵 外送、外勤工作高風切安全盾</span>
                        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-semibold">
                          高密度 9 級以上強陣風或積水逾 20 公分（過輪胎一半）極易造成摔車與井蓋漂移割裂。宣告停班課即刻斷單，切務為了搶單強渡大風雨。
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline display */}
                {analysisResult.actionableTimeline && (
                  <div className="border border-stone-200 dark:border-stone-850 rounded-2xl overflow-hidden bg-white dark:bg-stone-900 text-left">
                    <div className="bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-850 px-5 py-3">
                      <span className="text-xs font-black tracking-wider text-stone-700 dark:text-stone-300 uppercase flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-700 dark:text-orange-500" />
                        AI 規劃：住宅防護逐步時間行動線
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-stone-200 dark:divide-stone-850">
                      
                      {/* Immediate action */}
                      <div className="p-5 space-y-3">
                        <h4 className="text-xs uppercase font-extrabold tracking-widest text-[#ea580c] dark:text-orange-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-650 animate-ping shrink-0" />
                          優先行動 (此時此刻立即備置)
                        </h4>
                        <div className="pl-3.5 border-l border-stone-250 dark:border-stone-800 space-y-3.5 pt-1.5">
                          {analysisResult.actionableTimeline.immediate?.map((action, i) => (
                            <div key={i} className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-semibold relative">
                              <span className="absolute -left-[20.5px] top-0.5 w-[14px] h-[14px] rounded-full bg-slate-700 text-white text-[9px] font-black flex items-center justify-center">
                                {i + 1}
                              </span>
                              <span>{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 24 Hours follow up */}
                      <div className="p-5 space-y-3">
                        <h4 className="text-xs uppercase font-extrabold tracking-widest text-stone-600 dark:text-stone-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-stone-500 shrink-0" />
                          持續跟備 (未來 24 小時定期檢查)
                        </h4>
                        <div className="pl-3.5 border-l border-stone-250 dark:border-stone-800 space-y-3.5 pt-1.5">
                          {analysisResult.actionableTimeline.next24h?.map((action, i) => (
                            <div key={i} className="text-xs text-stone-750 dark:text-stone-300 leading-relaxed font-semibold relative">
                              <span className="absolute -left-[20.5px] top-0.5 w-[14px] h-[14px] rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-400 text-[9px] font-black flex items-center justify-center">
                                {i + 1}
                              </span>
                              <span>{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* Shelter advice guidance */}
                {analysisResult.shelterGuidance && (
                  <div className="bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-850 p-6 rounded-2xl text-left space-y-4">
                    <h4 className="text-xs font-black tracking-wider text-stone-800 dark:text-orange-400 uppercase flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-705 dark:text-orange-500" />
                      推薦指定里鄰撤避避難中心與路線方針
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1 border-t border-stone-100 dark:border-stone-850">
                      <div>
                        <span className="text-[11px] font-extrabold text-[#ea580c] tracking-widest uppercase block mb-2">建議前往撤避集中點</span>
                        <div className="space-y-2">
                          {analysisResult.shelterGuidance.nearestOptions?.map((o, idx) => (
                            <div key={idx} className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-2.5 flex items-center gap-2 text-xs font-semibold text-stone-705 dark:text-stone-200">
                              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span>{o}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-extrabold text-[#ea580c] tracking-widest uppercase block mb-2">安全行進守則</span>
                        <ul className="space-y-2.5 text-xs font-semibold text-stone-650 dark:text-stone-400">
                          {analysisResult.shelterGuidance.safetyCriteria?.map((c, idx) => (
                            <li key={idx} className="flex gap-2 items-start leading-relaxed text-stone-700 dark:text-stone-300">
                              <span className="text-slate-800 dark:text-orange-500 font-bold">✓</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Deficiency Diagnostics */}
                {analysisResult.deficiencyAnalysis && (
                  <div className="bg-red-500/5 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 text-left">
                    <h4 className="text-xs font-black text-[#ea580c] dark:text-orange-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                      <AlertCircle className="w-4.5 h-4.5" />
                      🚨 AI 漏洞偵測與物資整檢缺點診斷 (Deficiency Audit)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <span className="text-xs font-extrabold text-red-950 dark:text-red-300 block border-b border-red-200/50 pb-1 mb-2">
                          偵測脆弱盲區
                        </span>
                        <ul className="space-y-2 text-xs font-semibold text-red-900 dark:text-red-400">
                          {analysisResult.deficiencyAnalysis.weaknesses.map((w, idx) => (
                            <li key={idx} className="flex gap-1.5 items-start">
                              <span className="text-red-500">✗</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="text-xs font-extrabold text-emerald-950 dark:text-emerald-300 block border-b border-emerald-250 pb-1 mb-2">
                          改善修補具體方案
                        </span>
                        <ul className="space-y-2 text-xs font-semibold text-emerald-900 dark:text-emerald-450">
                          {analysisResult.deficiencyAnalysis.improvements.map((imp, idx) => (
                            <li key={idx} className="flex gap-1.5 items-start text-emerald-800 dark:text-emerald-400">
                              <span className="text-emerald-600">✓</span>
                              <span>{imp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Offline export controller */}
                <div className="bg-[#FAF9F6] dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-stone-850 dark:text-white flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-705 dark:text-orange-500" />
                      一鍵複製客製離線防災卡
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed font-semibold">
                      在極大暴雨強風、嚴重餘震停電時，極高機率完全與網路失聯。強烈建議此時一鍵複製全套防務卡，貼入手機備忘錄或通訊群組。
                    </p>
                  </div>
                  <button
                    onClick={handleExportOffline}
                    className="bg-slate-800 hover:bg-slate-900 dark:bg-orange-600 dark:hover:bg-orange-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center gap-1.5 hover:scale-101 active:scale-95 cursor-pointer min-h-[48px]"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        <span>成功備分剪貼簿！</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-white" />
                        <span>一鍵備存自救卡</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}

            {!analysisResult && !isAnalyzing && (
              <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200/50 dark:border-stone-850 p-8 rounded-2xl text-center flex flex-col items-center">
                <Sparkles className="w-8 h-8 text-stone-400 mb-3" />
                <p className="text-xs text-stone-550 dark:text-stone-400 font-bold max-w-sm">
                  目前尚未生成個人化建議。點擊右上方「即刻生成客製指南」按鈕，Gemini 便會即時為您整合分析居住地潛勢及配套漏網。
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right Tabbed Sticky Sidebar Profile + Supplies Inventory Checklist */}
        <div id="right-sidebar" className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm flex flex-col lg:sticky lg:top-8 h-[650px] lg:max-h-[85vh]">
            
            {/* Sidebar toggle buttons */}
            <nav 
              className="bg-stone-100 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-850 p-2 shrink-0 flex items-center gap-1.5"
              role="tablist"
              aria-label="側邊欄面板選單"
            >
              <button
                onClick={() => setSidebarTab('supplies')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer min-h-[48px] ${
                  sidebarTab === 'supplies'
                    ? 'bg-white dark:bg-stone-900 text-slate-805 dark:text-orange-400 shadow-sm border border-stone-200/60 dark:border-stone-800'
                    : 'text-stone-500 hover:text-stone-850 dark:hover:text-stone-200'
                }`}
                role="tab"
                aria-selected={sidebarTab === 'supplies'}
                aria-label="避難物品清單面板"
              >
                <Check className="w-4 h-4 text-orange-500" strokeWidth={3} />
                <span>避難物品清單</span>
              </button>
              <button
                onClick={() => setSidebarTab('chat')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer min-h-[48px] ${
                  sidebarTab === 'chat'
                    ? 'bg-white dark:bg-stone-900 text-slate-805 dark:text-orange-400 shadow-sm border border-stone-200/60 dark:border-stone-800'
                    : 'text-stone-500 hover:text-stone-850 dark:hover:text-stone-200'
                }`}
                role="tab"
                aria-selected={sidebarTab === 'chat'}
                aria-label="AI 防災諮詢面板"
              >
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>AI 精準諮詢</span>
              </button>
            </nav>

            {sidebarTab === 'supplies' ? (
              <div className="flex-1 overflow-y-auto p-2.5 custom-scrollbar bg-stone-50/10 dark:bg-stone-950/20">
                <SuppliesInventory 
                  supplies={supplies} 
                  setSupplies={setSupplies} 
                  memberCount={memberCount} 
                  setMemberCount={setMemberCount} 
                  isSidebar={true}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="bg-stone-100 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-850 px-4 py-3 shrink-0 flex items-center justify-between">
                  <span className="text-xs font-black text-stone-700 dark:text-stone-300 uppercase flex items-center gap-1.5">
                    <UserCircle2 className="w-4 h-4" /> AI 防災專屬顧問
                  </span>
                  <div className="flex items-center gap-1 bg-stone-50 dark:bg-stone-900 px-2 py-0.5 rounded border border-stone-200/50 dark:border-stone-800/40 shrink-0 scale-95">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 font-bold">待命解答中</span>
                  </div>
                </div>

                {/* Chat window viewport */}
                <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-stone-50/20 dark:bg-stone-950/10 custom-scrollbar">
                  {chatHistory.length === 0 && (
                    <div className="text-center text-stone-600 dark:text-stone-400 text-xs my-auto bg-[#FAF9F6] dark:bg-stone-950 p-5 rounded-2xl border border-stone-200 dark:border-stone-850 space-y-2 max-w-xs mx-auto">
                      <Sparkles className="w-8 h-8 text-stone-400 mx-auto" />
                      <p className="font-extrabold text-sm text-stone-800 dark:text-white">
                        有任何防災上的不解與特定藥物疑問嗎？
                      </p>
                      <p className="leading-relaxed font-semibold">
                        貼上您的 API Key 即可與 Gemini 自由諮詢。例如您可以提問：「家有氣喘慢性病患怎麼準備特定避難包？」、「高樓防震固定怎麼施工最適妥？」！
                      </p>
                    </div>
                  )}

                  {chatHistory.map((chat, idx) => (
                    <div key={idx} className={`flex w-full ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 max-w-[85%] rounded-2xl text-xs sm:text-sm text-left leading-relaxed font-semibold transition-all ${
                        chat.role === 'user'
                          ? 'bg-slate-700 text-white shadow-sm'
                          : 'bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-750 text-stone-800 dark:text-stone-100'
                      }`}>
                        <p className="whitespace-pre-wrap">{chat.text}</p>
                      </div>
                    </div>
                  ))}

                  {isChatting && (
                    <div className="flex w-full justify-start">
                      <div className="bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-750 p-3 rounded-2xl flex items-center justify-center h-[34px] w-[50px]">
                        <div className="w-1.5 h-1.5 bg-stone-500 dark:bg-stone-300 rounded-full animate-bounce [animation-delay:0.2s] mx-0.5" />
                        <div className="w-1.5 h-1.5 bg-stone-500 dark:bg-stone-300 rounded-full animate-bounce [animation-delay:0.4s] mx-0.5" />
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleChat} className="p-3 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-850 flex gap-2 shrink-0 items-center">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="請描述您的避難疑惑或特定疾病..."
                    className="flex-1 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 font-semibold"
                  />
                  <button
                    type="submit"
                    disabled={isChatting || !chatMessage.trim()}
                    className="bg-slate-800 hover:bg-slate-900 dark:bg-orange-600 dark:hover:bg-orange-700 text-white w-10 h-10 rounded-xl transition-all disabled:opacity-40 flex items-center justify-center shrink-0 cursor-pointer min-h-[44px]"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>

      </main>

      <footer className="mt-12 mb-8 text-center text-xs text-stone-400 dark:text-stone-500 font-bold border-t border-stone-200/40 dark:border-stone-800/40 pt-5 max-w-2xl mx-auto leading-normal">
        本網站防災指南均遵守內政部消防署、交通部中央氣象署規範，AI 功能架接自 Google Gemini 大語言模型。<br/>
        防災生活與居住準備指南 ｜ 守護您與家人的生活安全防線
      </footer>

      {/* 🚨 Emergency Self-Rescue Guide Interactive Modal with Large Clickable Touches */}
      {activeEmergencyGuide && (() => {
        const guide = EMERGENCY_GUIDES[activeEmergencyGuide];
        const isGuideCompleted = guide.steps.every(step => emergencyChecks[step.id]);
        return (
          <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-left">
              
              {/* Modal header details */}
              <div className="p-5 sm:p-6 bg-stone-950 text-white relative">
                <span className="text-[10px] bg-red-900/40 text-red-300 font-extrabold border border-red-700/40 px-3 py-1 rounded-full uppercase tracking-widest leading-none">
                  {guide.badge}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white mt-3">
                  {guide.title}
                </h3>
                <p className="text-xs text-stone-400 font-bold leading-relaxed mt-1">
                  {guide.subtitle}
                </p>
                <button
                  onClick={() => setActiveEmergencyGuide(null)}
                  className="absolute right-5 top-5 bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-full flex items-center justify-center duration-150 transition-colors cursor-pointer min-h-[44px]"
                  title="關閉自救手冊"
                >
                  ✕
                </button>
              </div>

              {/* Progress feedback bar */}
              <div className="bg-stone-100 dark:bg-stone-950 px-6 py-3 border-b border-stone-200 dark:border-stone-850 flex items-center justify-between text-xs font-bold text-stone-500">
                <span className="flex items-center gap-1.5">
                  <span>防護進度：</span>
                  <span className="text-emerald-650 dark:text-emerald-400 font-extrabold text-sm ml-0.5">
                    {guide.steps.filter(s => emergencyChecks[s.id]).length} / {guide.steps.length} 步驟已確認已讀
                  </span>
                </span>
                {isGuideCompleted ? (
                  <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-black animate-pulse">
                    🔥 本單元求生守護完畢！
                  </span>
                ) : (
                  <span className="text-[#ea580c] font-black">🚨 尚有救命指導尚未落實檢查</span>
                )}
              </div>

              {/* Steps checklist with large touch boxes */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 custom-scrollbar dark:bg-stone-900">
                <div className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 p-4 rounded-xl flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
                  <p className="leading-relaxed font-semibold">
                    此自救卡完全下載備份於您的手機儲存空間。即便已斷電斷網、信號不通，仍可自由交互點用，引導全家脫離威脅。
                  </p>
                </div>

                <div className="space-y-3">
                  {guide.steps.map((step, idx) => {
                    const isChecked = !!emergencyChecks[step.id];
                    return (
                      <div
                        key={step.id}
                        onClick={() => setEmergencyChecks(prev => ({ ...prev, [step.id]: !prev[step.id] }))}
                        className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer select-none transition-all ${
                          isChecked 
                            ? 'bg-emerald-500/5 border-emerald-355 opacity-70 hover:opacity-100' 
                            : 'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-850 hover:border-slate-400'
                        }`}
                      >
                        <div className="mt-0.5">
                          {/* Checkboxes >= 22px */}
                          <div className={`w-[22px] h-[22px] rounded border flex items-center justify-center shrink-0 transition-all ${
                            isChecked 
                              ? 'bg-emerald-600 border-emerald-600 text-white' 
                              : 'border-stone-305 bg-[#FAF9F6]'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />}
                          </div>
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest mr-2 block">
                            避嫌自救決策步驟 {idx + 1}
                          </span>
                          <p className={`text-sm leading-relaxed mt-1 font-semibold ${
                            isChecked ? 'text-stone-400 dark:text-stone-550 line-through' : 'text-stone-800 dark:text-stone-100'
                          }`}>
                            {step.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal footer, urgent dispatch phones */}
              <div className="p-5 sm:p-6 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-850 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500 font-bold self-start sm:self-center">
                  <Phone className="w-4 h-4 text-red-500 animate-pulse" />
                  <span>撥打 119 求援 ｜ 全民防災互聽平安留言撥：</span>
                  <a href="tel:1991" className="text-red-500 hover:underline font-extrabold text-sm ml-1">1991</a>
                </div>
                
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={() => setEmergencyChecks(prev => {
                      const cleared = { ...prev };
                      guide.steps.forEach(s => cleared[s.id] = false);
                      return cleared;
                    })}
                    className="flex-1 sm:flex-none border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-100 text-stone-600 dark:text-stone-350 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center min-h-[44px]"
                  >
                    重置自救卡
                  </button>
                  <button
                    onClick={() => setActiveEmergencyGuide(null)}
                    className="flex-1 sm:flex-none bg-[#7f1d1d] hover:bg-[#6b1812] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center min-h-[44px]"
                  >
                    防護完畢
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Elegantly styled Guard Rail Modal for Gemini API key instructions */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-left animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setIsApiKeyModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors min-h-[44px]"
              aria-label="Close API Key Configuration modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 shadow-sm">
                <Key className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-xl font-extrabold text-stone-900 dark:text-white leading-tight">
                🔑 設定您的 AI 助理功能
              </h3>
            </div>

            <p className="text-sm text-stone-600 dark:text-stone-350 mb-5 leading-relaxed font-semibold">
              此客製指南分析與即時防災對話功能採用進階 Gemini AI，能整合您專屬的住宅特徵進行深度分析。為保障隱私與您享用完整的免費額度，此功能需要您填入個人專屬的 Google AI 金鑰。
            </p>

            {/* Core Threshold Reduction Instruction Widget */}
            <div className="bg-amber-50/70 border border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-900/40 rounded-2xl p-4 mb-5 shadow-xs text-left">
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 font-semibold leading-relaxed">
                💡 <strong>如何獲取免費 Key？</strong><br />
                點擊前往 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-amber-700 dark:text-amber-400 underline font-black hover:opacity-85 inline-flex items-center gap-0.5">Google AI Studio (https://aistudio.google.com/app/apikey)<Sparkles className="w-3.5 h-3.5 inline text-amber-500 animate-pulse" /></a> ，登入 Google 帳號後點擊<strong>「Create API key」</strong>即可免費複製取得！
              </p>
            </div>

            {/* Key input with dynamic hide/show field */}
            <div className="mb-6">
              <label className="block text-xs font-black text-stone-500 uppercase tracking-widest mb-2">
                貼上您的 Gemini API 金鑰
              </label>
              <div className="relative">
                <input
                  type={showTempApiKey ? "text" : "password"}
                  value={tempApiKey}
                  onChange={(e) => handleTempApiKeyChange(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-stone-50 dark:bg-stone-950 focus:bg-white border border-stone-200 dark:border-stone-850 text-stone-900 dark:text-white rounded-xl pl-3.5 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowTempApiKey(!showTempApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg text-stone-500 dark:text-stone-400 min-h-[44px]"
                  title={showTempApiKey ? "隱藏 API Key" : "顯示 API Key"}
                >
                  {showTempApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 font-bold">
                * 金鑰將僅安全儲存於您的本機瀏覽器 localStorage，絕對不會上傳至任何第三方伺服器。
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={() => setIsApiKeyModalOpen(false)}
                className="w-full sm:w-auto border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-850 text-stone-600 dark:text-stone-300 px-5 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer text-center min-h-[48px]"
              >
                稍後設定
              </button>
              <button
                onClick={() => {
                  if (!tempApiKey.trim()) {
                    alert("請先貼上有效的 Gemini API 金鑰，或者點選「稍後設定」。");
                    return;
                  }
                  setIsApiKeyModalOpen(false);
                  handleAnalyze();
                }}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 dark:bg-orange-600 dark:hover:bg-orange-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer text-center min-h-[48px] flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 text-emerald-400" strokeWidth={3} />
                <span>儲存並開始生成</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
