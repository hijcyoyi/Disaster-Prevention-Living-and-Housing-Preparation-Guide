import React, { useState } from 'react';
import { 
  ShieldAlert, AlertCircle, CloudLightning, HeartPulse, UserCircle2, 
  MapPin, Loader2, Send, CloudRainWind, Activity, ArrowRight, FileText,
  Home, Clock, Phone, Sparkles, Check, Key, Eye, EyeOff,
  Bike, AlertTriangle, Zap, Sun, Calendar, Compass, Settings, X
} from 'lucide-react';
import { SuppliesInventory } from './components/SuppliesInventory';
import { defaultSupplies } from './data';
import type { FamilyProfile, AIAnalysisResult, SupplyItem } from './types';
import { analyzeRisk, sendChatMessage, analyzeEnvironment } from './services/api';

const CWA_API_KEY = ""; // 免費申請：https://opendata.cwa.gov.tw/
const SUSPENSION_RESOURCE_ID = "3160-54"; // 請填入停班停課 API Resource ID

const EMERGENCY_GUIDES = {
  earthquake: {
    title: '🌋 強烈有感地震：趴下、掩護、穩住！',
    subtitle: '就地避難與極限求生命令（適用５級強以上震度及頻繁餘震）',
    color: 'from-red-950 to-red-900 text-white border-red-700 hover:from-red-900 hover:to-red-850',
    badge: '強震、餘震、結構崩移警戒',
    steps: [
      { id: 'eq_drop', text: '【趴下、掩護、穩住】立刻雙手抱頭鑽入堅固桌底，緊抓桌腳，保護好最脆弱的頭頸，此時絕對不要起步亂跑！' },
      { id: 'eq_safe', text: '【避開傾倒墜物】遠離可能位移的大木櫃、衣櫃、冰箱，防範玻璃門、吊置冷氣或裝飾天花板脫落砸傷。' },
      { id: 'eq_extinguish', text: '【一停即關火源】搖晃稍微停歇的黃金間隔，迅速關閉瓦斯總閥及加熱電器，截斷一切二次火災的潛在因素。' },
      { id: 'eq_open', text: '【推開玄關大門】立即手動推開家中大門並放置鞋盒阻擋，防止房屋結構變形導緻木門卡死，封閉黃金逃生路徑。' },
      { id: 'eq_boots', text: '【厚便鞋避難】穿上床頭常備之厚鞋底工作鞋防範室內滿地碎玻璃，沿走廊向開闊的安全大操場或防災公園挺進，嚴禁搭電梯。' }
    ]
  },
  flooding: {
    title: '🌊 住宅積水、家裡開始淹水倒灌怎麼辦？',
    subtitle: '適用暴雨鋒面全島特報、突發性淹溢與水流阻斷處置',
    color: 'from-blue-950 to-blue-900 text-white border-blue-700 hover:from-blue-900 hover:to-blue-850',
    badge: '暴雨溢流、水流倒灌、阻斷警戒',
    steps: [
      { id: 'f_breaker', text: '【一有溢流即切總電】水進玄關前，迅速拉下一樓全戶總配線盤大斷路器、關閉總瓦斯閥，杜絕水中藏電導電，形成致命電網！' },
      { id: 'f_vertical', text: '【執行垂直高避難】抓起處方用藥、防災包、貴重物資，往公寓二樓以上或鋼筋混凝土高位移轉，切忌留守一樓。' },
      { id: 'f_walk', text: '【切勿涉水行進】水深若超過 15 公分（過腳踝），絕對不要試圖徒步跨越路面、溪谷！混濁泥流下排水蓋极易被吸開，極度危險。' },
      { id: 'f_sandbags', text: '【封堵與沙包阻絕】用防水沙包或檔水門進行密封。一旦水淹到大腿以上或被圍困，立即往頂樓尋找避雷核心，搖晃光源待援。' }
    ]
  },
  typhoon: {
    title: '🌀 強風暴風突發、迎風玻璃吹裂怎麼辦？',
    subtitle: '迎風面超強風切（11級風以上）安全避護與水泥掩體應對',
    color: 'from-emerald-950 to-emerald-900 text-white border-emerald-700 hover:from-emerald-900 hover:to-emerald-850',
    badge: '超強十一級陣風、風切、招牌掉落警告',
    steps: [
      { id: 't_core', text: '【退入建築核心】大風肆虐時，一律遠離迎風大片落地窗體（防強風灌破玻璃飛石擊傷），進入無窗衛浴或混凝土走廊結構避風。' },
      { id: 't_latch', text: '【緊固防堂內風】緊鎖背風迎風每一扇房門窗，防止強風吹開形成穿堂大風，產生強烈內氣壓將鐵皮棚、輕鋼瓦瞬間掀掉。' },
      { id: 't_objects', text: '【收置室外墜物】颱風登陸前，徹底查清陽台懸空盆栽、曝曬架，嚴格鎖緊排水。在颱風宣布停班時，切勿再外出。' },
      { id: 't_outage', text: '【防災不斷電應對】颱風極易拍斷電路造成全區停電，睡覺前保證床頭及重要玄關插置好有自亮功能的應急免持照明手電。' }
    ]
  },
  landslide: {
    title: '🏔️ 收到土石流土砂預警撤離通知怎麼辦？',
    subtitle: '適用高山丘陵、阿里山/蘇花沿線、黃色/紅色警戒主動避防',
    color: 'from-amber-950 to-amber-900 text-white border-amber-700 hover:from-amber-900 hover:to-amber-850',
    badge: '白天預警、土砂崩山、黃紅特報警戒',
    steps: [
      { id: 'l_evac', text: '【白天預警果斷撤】接獲村里黃/紅色警戒通知，應乘白天視線清朗時果斷撤離！千万不要拖沓到深夜暴雨封路、停電時。' },
      { id: 'l_angle', text: '【垂直泥流流向跑】若突遇土崩泥流阻路，應朝向土石流侵瀉方向的「垂直兩側高地高坡」快速逃生，絕不顺流往下游河谷跑！' },
      { id: 'l_isolation', text: '【備戰孤島物資】高地極易成為救援空難斷路區。清點避難包：14天份重症藥、身分證明影本、備用大容量電、小額硬幣防斷網。' }
    ]
  },
  fire: {
    title: '🔥 室內火災防範：別慌、壓低身姿避難！',
    subtitle: '適用室內火災、濃煙逃生與自救應對（秉持火場求生黃金法則）',
    color: 'from-rose-950 to-rose-900 text-white border-rose-700 hover:from-rose-900 hover:to-rose-850',
    badge: '濃煙、火災、火場逃生避護',
    steps: [
      { id: 'fr_smoke', text: '【壓低身姿避濃煙】遇濃煙應採取低姿勢爬行，因空氣在地面附近（離地 30 公分以下）最乾淨，利用手肘與膝蓋前進。' },
      { id: 'fr_door', text: '【觸摸把手探火情】開門前先用手背觸摸金屬門把。若把手燙手，代表門外已有大火，此時絕對不要開門！' },
      { id: 'fr_seal', text: '【濕毛巾塞住門縫】若無法開門逃生，應將門鎖好，並用濕毛巾、衣物或膠帶塞住門縫與空隙，防止致命濃煙與毒氣滲入。' },
      { id: 'fr_window', text: '【退向窗邊揮舞呼救】關好門後，退向臨街或臨外之窗邊，撥打 119 通報自己受困位置，並揮舞手電筒或亮色衣物呼救。' }
    ]
  }
};

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

  React.useEffect(() => {
    localStorage.setItem('disaster_location_v1', location);
  }, [location]);

  React.useEffect(() => {
    localStorage.setItem('disaster_family_v1', JSON.stringify(familyProfile));
  }, [familyProfile]);

  React.useEffect(() => {
    localStorage.setItem('disaster_member_count_v1', memberCount.toString());
  }, [memberCount]);

  React.useEffect(() => {
    localStorage.setItem('disaster_env_desc_v1', environmentDesc);
  }, [environmentDesc]);

  React.useEffect(() => {
    localStorage.setItem('disaster_supplies_v1', JSON.stringify(supplies));
  }, [supplies]);

  React.useEffect(() => {
    localStorage.setItem('disaster_emergency_checks_v1', JSON.stringify(emergencyChecks));
  }, [emergencyChecks]);

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync profile-specific items to the supplies list automatically when category toggled
  React.useEffect(() => {
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

  // --- Live Weather and CWA Warning Alert States & Logic ---
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
          ? { class: 'bg-red-50 border-red-200 text-red-700', status: '達停止上班上課標準！', counties: ['基隆市 今天停止上班、今天停止上課。', '臺北市 今天停止上班、今天停止上課。', '新北市 今天停止上班、今天停止上課。'] }
          : { class: 'bg-stone-50 border-stone-200 text-stone-700', status: '照常上班及上課。', counties: ['基隆市 今天照常上班、今天照常上課。', '臺北市 今天照常上班、今天照常上課。', '新北市 今天照常上班、今天照常上課。'] };
      case 'central':
        return { class: 'bg-stone-50 border-stone-200 text-stone-700', status: '照常上班及上課。', counties: ['臺中市 今天照常上班、今天照常上課。', '彰化縣 今天照常上班、今天照常上課。', '南投縣 今天照常上班、今天照常上課。'] };
      case 'south':
        return { class: 'bg-stone-50 border-stone-200 text-stone-700', status: '照常上班及上課。', counties: ['臺南市 今天照常上班、今天照常上課。', '高雄市 今天照常上班、今天照常上課。', '屏東縣 今天照常上班、今天照常上課。'] };
      case 'east':
        return activeScenario === 'typhoon' || activeScenario === 'earthquake'
          ? { class: 'bg-red-50 border-red-200 text-red-700', status: '部分鄉鎮停班停課', counties: ['花蓮縣 秀林鄉: 今天停止上班、今天停止上課。\n其他鄉鎮照常', '臺東縣 今天照常上班、今天照常上課。'] }
          : { class: 'bg-stone-50 border-stone-200 text-stone-700', status: '照常上班及上課。', counties: ['宜蘭縣 今天照常上班、今天照常上課。', '花蓮縣 今天照常上班、今天照常上課。', '臺東縣 今天照常上班、今天照常上課。'] };
      default:
        return { class: 'bg-stone-50 border-stone-200 text-stone-700', status: '照常上班及上課。', counties: [] };
    }
  };

  const getWeatherCondition = (code: number) => {
    switch (code) {
      case 0: return "晴朗無雲";
      case 1:
      case 2:
      case 3: return "多雲時晴";
      case 45:
      case 48: return "局部濃霧";
      case 51:
      case 53:
      case 55: return "局部毛毛雨";
      case 56:
      case 57: return "局部凍雨";
      case 61: return "小雨";
      case 63: return "中對流降雨";
      case 65: return "大雨/暴雨";
      case 66:
      case 67: return "凍雨/豪降水";
      case 71:
      case 73:
      case 75: return "降雪量累積";
      case 77: return "冰雹或細雪";
      case 80:
      case 81:
      case 82: return "短暫強陣雨";
      case 85:
      case 86: return "局部雨夾雪";
      case 95: return "雷陣雨氣候";
      case 96:
      case 99: return "雷暴雨加強風";
      default: return "正常大氣對流";
    }
  };

  const getBeautifiedWind = (speed: number) => {
    const ms = speed / 3.6;
    if (ms < 0.3) return "0 級 (無風)";
    if (ms < 1.5) return "1 級 (軟風)";
    if (ms < 3.3) return "2 級 (輕風)";
    if (ms < 5.4) return "3 級 (微風)";
    if (ms < 7.9) return "4 級 (和風)";
    if (ms < 10.7) return "5 級 (清風)";
    if (ms < 13.8) return "6 級 (強風)";
    if (ms < 17.1) return "7 級 (疾風)";
    if (ms < 20.7) return "8 級 (大風)";
    if (ms < 24.4) return "9 級 (烈風)";
    if (ms < 28.4) return "10 級 (狂風)";
    return "11 級以上強烈暴風";
  };

  const loadRealtimeWeather = async (targetLoc: string) => {
    if (!targetLoc.trim()) return;
    setIsFetchingWeather(true);
    setWeatherError(false);
    
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');

    if (!CWA_API_KEY) {
      // 模擬示範資料
      setLiveWeather({
        temp: 28.5,
        precipitation: 15.5,
        windSpeed: 25,
        weatherCode: 65,
        condition: "大雨/暴雨",
        locationName: targetLoc.split(',')[0],
        beautifiedWind: "6 級 (強風)",
        isDemo: true,
        updatedAt: timeStr
      });
      setIsFetchingWeather(false);
      return;
    }

    try {
      const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=${CWA_API_KEY}&format=JSON`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error("CWA API 錯誤");
      const data = await res.json();
      
      const stations = data?.records?.Station || [];
      if (stations.length === 0) throw new Error("查無氣象站");
      
      const st = stations[0]; // 簡化：取第一筆測站
      const temp = st.WeatherElement?.AirTemperature || 25;
      const precip = st.WeatherElement?.Now?.Precipitation || 0;
      const wind = st.WeatherElement?.WindSpeed || 0;
      const code = 0; // fallback code since O-A0001-001 doesn't map perfectly to open-meteo numeric codes
      
      setLiveWeather({
        temp,
        precipitation: precip,
        windSpeed: wind,
        weatherCode: code,
        condition: st.WeatherElement?.Weather || "多雲",
        locationName: st.StationName || targetLoc.split(',')[0],
        beautifiedWind: getBeautifiedWind(wind),
        isDemo: false,
        updatedAt: timeStr
      });
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

  const handleSaveApiKey = (newKey: string) => {
    setCustomApiKey(newKey);
    const trimmed = newKey.trim();
    if (trimmed) {
      localStorage.setItem("custom_gemini_key", trimmed);
    } else {
      localStorage.removeItem("custom_gemini_key");
    }
  };

  const handleAnalyze = async (overrideProfile?: FamilyProfile, overrideEnv?: string) => {
    if (!location.trim()) return;
    setIsAnalyzing(true);
    try {
      // Refresh current live weather
      await loadRealtimeWeather(location);
      
      let currentEnv = overrideEnv !== undefined ? overrideEnv : environmentDesc;
      
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

  const analysisAutoTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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

  const loadSuspensionData = async () => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`https://data.gov.tw/api/v2/rest/datastore/${SUSPENSION_RESOURCE_ID}`, {
        signal: controller.signal
      });
      clearTimeout(id);
      if (!res.ok) throw new Error("API failed");
      // Simulate real data process if needed
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

  React.useEffect(() => {
    loadRealtimeWeather(location);
    loadCwaAlerts();
    loadSuspensionData();
    const inv = setInterval(loadSuspensionData, 10 * 60 * 1000);
    return () => clearInterval(inv);
  }, []);

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
            "花蓮縣立體育中學（物資救援空投點）"
          ],
          safetyCriteria: [
            "避難路線應避開高樓、工地及圍牆，注意懸掛物掉落。",
            "若路面有嚴重龜裂或下陷，請繞道而行。"
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
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 font-sans selection:bg-[#7f1d1d]/20 sm:p-4 md:p-6 lg:p-8">
      
      {/* Mobile Settings floating button */}
      <button
        onClick={() => setIsMobileDrawerOpen(true)}
        className="md:hidden fixed bottom-6 right-6 z-40 bg-[#7f1d1d] text-white p-4 justify-center items-center rounded-full shadow-[0_4px_16px_rgba(127,29,29,0.4)] flex gap-2 font-bold cursor-pointer transition-transform hover:scale-105 active:scale-95"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}
      
      {/* Dynamic Background Image based on weather / mood */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1502481851512-e9e2529bfbf9?q=80&w=2069&auto=format&fit=crop")' }}
      />
      
      <div className="max-w-7xl mx-auto w-full relative z-10">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 lg:mb-10 bg-white/60 backdrop-blur pb-4 sm:pb-0 border-b border-stone-200/50 sm:border-none p-4 sm:p-0 rounded-2xl sm:rounded-none">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-stone-900 text-white shadow-md shadow-stone-900/20">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="font-extrabold tracking-widest text-[#7f1d1d] text-[11px] bg-[#7f1d1d]/10 px-2 py-1 rounded-md border border-[#7f1d1d]/20 uppercase">A.I. R-DEFENSE</span>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-widest text-stone-900 font-display">
                災防整合與家戶整備守護系統
              </h1>
              <p className="text-[10px] hidden sm:block text-stone-500 font-medium tracking-wider mt-0.5">
                AI 地理氣象交叉分析｜個人化避難時程表｜物資盤點
              </p>
            </div>
          </div>

          {/* Desktop/Tablet Action Bar */}
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto hide-scrollbar pb-1 sm:pb-0">
             <button className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs sm:text-sm font-bold transition-all active:scale-95 shrink-0 shadow-sm cursor-pointer min-h-[52px]">
               <Activity className="w-4 h-4 text-rose-400" />
               <span className="tracking-wide">防災包掃描 (0/12)</span>
             </button>
             <button className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-750 rounded-lg text-xs sm:text-sm font-bold transition-all active:scale-95 shrink-0 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] cursor-pointer min-h-[52px]">
               <FileText className="w-4 h-4 text-stone-500" />
               <span className="tracking-wide">列印避難指引</span>
             </button>
          </div>
        </header>

        <div id="app-main-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-start">

          {/* Left Sidebar: Controls & Settings */}
          {/* Left Sidebar: Controls & Settings */}
          <div id="app-left-sidebar" className={`
             fixed inset-x-0 bottom-0 bg-stone-100 z-50 flex flex-col max-h-[85vh] rounded-t-3xl transition-transform duration-400 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]
             ${isMobileDrawerOpen ? 'translate-y-0' : 'translate-y-full'}
             md:static md:translate-y-0 md:bg-transparent md:max-h-[calc(100vh-3rem)] md:rounded-none md:shadow-none md:z-auto md:w-full md:sticky md:top-6
             lg:col-span-4 xl:col-span-3
          `}>
             <div className="flex items-center justify-between md:hidden p-5 pb-4 border-b border-stone-200 shrink-0 bg-stone-100 rounded-t-3xl z-10 relative">
               <h2 className="text-lg font-bold text-stone-900 tracking-wider flex items-center gap-2">
                 <Settings className="w-5 h-5 text-[#7f1d1d]" />
                 防災與位置設定
               </h2>
               <button onClick={() => setIsMobileDrawerOpen(false)} className="bg-stone-200/50 rounded-full text-stone-600 min-h-[52px] min-w-[52px] flex items-center justify-center hover:bg-stone-300/50 cursor-pointer">
                 <X className="w-6 h-6" />
               </button>
             </div>

            <div className="flex-1 overflow-y-auto p-5 md:p-0 space-y-4 md:space-y-0 md:flex md:flex-row md:gap-4 md:overflow-x-auto md:snap-x hide-scrollbar lg:flex-col lg:space-y-6 lg:overflow-visible">
              
              {/* Location */}
              <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.02)] md:min-w-[320px] md:w-[320px] md:shrink-0 md:snap-center lg:min-w-0 lg:w-auto lg:shrink lg:snap-align-none overflow-hidden">
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
                      className="w-full bg-stone-50/50 hover:bg-stone-50 focus:bg-white border border-stone-200 rounded-lg pl-3 pr-10 py-2.5 text-stone-900 text-base focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-all font-semibold max-w-full min-h-[52px]"
                    />
                    <button
                      type="button"
                      onClick={handleGeolocate}
                      disabled={isLocating}
                      title="使用 GPS 自動定位"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-stone-200/60 text-[#7f1d1d] hover:text-stone-950 transition-all cursor-pointer disabled:opacity-50 min-h-[44px]"
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
                      className="select-none border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 rounded-lg py-2 px-3 text-sm font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-none cursor-pointer min-h-[52px]"
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
                      className="relative overflow-hidden group select-none border border-stone-200 bg-[#f4f1eb]/60 hover:bg-[#f4f1eb] text-stone-750 rounded-lg py-2 px-3 text-sm font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-none cursor-pointer min-h-[52px]"
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

              {/* API Key settings card */}
              <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.02)] transition-all hover:border-stone-300 hover:shadow-[0_4px_12px_-3px_rgba(0,0,0,0.04)] md:min-w-[320px] md:w-[320px] md:shrink-0 md:snap-center lg:min-w-0 lg:w-auto lg:shrink lg:snap-align-none overflow-hidden">
                <div 
                  className="flex items-center justify-between cursor-pointer select-none group min-h-[44px]"
                  onClick={() => setIsAiOpen(!isAiOpen)}
                >
                  <h3 className="text-xs font-extrabold text-stone-700 flex items-center gap-2 uppercase tracking-wide">
                     <Key className="w-4 h-4 text-[#7f1d1d]" />
                     進階 AI 設定（選填）
                  </h3>
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-stone-100 transition-transform duration-250 ${isAiOpen ? 'rotate-180' : 'rotate-0'}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-stone-500"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
                <div 
                  className="transition-[max-height] duration-250 ease-in-out overflow-hidden"
                  style={{ maxHeight: isAiOpen ? '500px' : '0px' }}
                >
                  <div className="flex flex-col gap-3 pt-4 border-t border-stone-100 mt-3">
                    <p className="text-[12px] text-stone-600 leading-relaxed font-semibold">
                      貼上您的個人 <strong className="text-stone-750 font-extrabold">Gemini API Key</strong> 即可解鎖基於 Google Gemini 2.5 Flash 設計的客製化災害與地脈潛勢分析：
                    </p>
                    
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={customApiKey}
                        onChange={(e) => handleSaveApiKey(e.target.value)}
                        placeholder="請在此貼上您的 Gemini API Key (AI_...)"
                        className="w-full bg-stone-50/50 hover:bg-stone-50 focus:bg-white border border-stone-200 rounded-lg pl-3 pr-10 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-all font-mono placeholder:text-stone-400 max-w-full min-h-[52px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 select-none cursor-pointer p-1 min-h-[44px]"
                      >
                        {showApiKey ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-stone-500 font-bold leading-normal">
                      💡 不填寫也可使用全部防災資訊，填寫後可啟用 AI 個人化分析
                    </p>
                    
                    <div className="flex items-center justify-between mt-1 px-1">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${customApiKey ? "bg-emerald-500 animate-pulse" : "bg-stone-400"}`} />
                        <span className="text-[10px] font-extrabold text-stone-500 tracking-wider">
                          {customApiKey ? "個人金鑰運作中" : "尚未填寫 API 金鑰（AI 功能暫停）"}
                        </span>
                      </div>
                      {customApiKey && (
                        <button
                          type="button"
                          onClick={() => handleSaveApiKey("")}
                          className="text-[11px] font-extrabold text-[#7f1d1d] hover:underline cursor-pointer min-h-[44px]"
                        >
                          清空金鑰
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Environment */}
              <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.02)] transition-all hover:border-stone-300 hover:shadow-[0_4px_12px_-3px_rgba(0,0,0,0.04)] md:min-w-[320px] md:w-[320px] md:shrink-0 md:snap-center lg:min-w-0 lg:w-auto lg:shrink lg:snap-align-none overflow-hidden">
                <div 
                  className="flex items-center justify-between cursor-pointer select-none group min-h-[44px]"
                  onClick={() => setIsEnvOpen(!isEnvOpen)}
                >
                  <h3 className="text-xs font-extrabold text-stone-700 flex items-center gap-2 tracking-wide uppercase">
                    <Home className="w-4 h-4 text-[#7f1d1d]" />
                    居住環境特點描述
                  </h3>
                  <div className="flex items-center gap-2">
                    {isAnalyzingEnv && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7f1d1d] shrink-0" />}
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-stone-100 transition-transform duration-250 ${isEnvOpen ? 'rotate-180' : 'rotate-0'}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-stone-500"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
                
                <div 
                  className="transition-[max-height] duration-250 ease-in-out overflow-hidden"
                  style={{ maxHeight: isEnvOpen ? '500px' : '0px' }}
                >
                  <div className="flex flex-col gap-2.5 pt-4 border-t border-stone-100 mt-3">
                    <textarea
                      value={environmentDesc}
                      onChange={(e) => setEnvironmentDesc(e.target.value)}
                      placeholder="點擊「地理分析」自主取得環境。此描述是 AI 計算排水、坡度落石風險的重要參考依據..."
                      className="w-full bg-stone-50/50 hover:bg-stone-50 focus:bg-white border border-stone-200 rounded-lg px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-all placeholder:text-stone-400 font-semibold resize-none h-28 max-w-full"
                    />
                    {!environmentDesc && (
                      <div className="text-[11px] font-bold text-[#7f1d1d] flex items-center gap-1.5 bg-[#7f1d1d]/5 p-2 rounded border border-[#7f1d1d]/10">
                        <Sparkles className="w-3.5 h-3.5 text-[#7f1d1d] shrink-0 animate-pulse" />
                        <span>提示：若空置，分析時將依選址自動探測補齊</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Family */}
              <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.02)] transition-all hover:border-stone-300 hover:shadow-[0_4px_12px_-3px_rgba(0,0,0,0.04)] md:min-w-[320px] md:w-[320px] md:shrink-0 md:snap-center lg:min-w-0 lg:w-auto lg:shrink lg:snap-align-none overflow-hidden">
                <div 
                  className="flex items-center justify-between cursor-pointer select-none group min-h-[44px]"
                  onClick={() => setIsFamilyOpen(!isFamilyOpen)}
                >
                  <h3 className="text-xs font-extrabold text-stone-700 flex items-center gap-2 tracking-wide uppercase">
                    <HeartPulse className="w-4 h-4 text-[#7f1d1d]" />
                    特殊關懷照顧對象 
                    <span className="ml-1 text-[#7f1d1d] bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">
                      ({Object.values(familyProfile).filter(Boolean).length} 項)
                    </span>
                  </h3>
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-stone-100 transition-transform duration-250 ${isFamilyOpen ? 'rotate-180' : 'rotate-0'}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-stone-500"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>

                <div 
                  className="transition-[max-height] duration-250 ease-in-out overflow-hidden"
                  style={{ maxHeight: isFamilyOpen ? '1000px' : '0px' }}
                >
                  <div className="flex flex-col gap-2 pt-4 border-t border-stone-100 mt-3">
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

              {/* 防災緊急聯絡與平安機制 */}
              <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.025)] space-y-4 shrink-0 md:min-w-[320px] md:w-[320px] md:snap-center lg:min-w-0 lg:w-auto lg:snap-align-none overflow-hidden">
                <h3 className="text-xs font-extrabold text-stone-700 flex items-center gap-2 tracking-wide uppercase border-b border-stone-100 pb-2.5">
                  <Phone className="w-4 h-4 text-[#7f1d1d]" />
                  <span>全台緊急通報專線</span>
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <a href="tel:119" className="bg-[#7f1d1d]/5 hover:bg-[#7f1d1d]/10 border border-[#7f1d1d]/20 hover:border-[#7f1d1d]/30 p-2.5 rounded-xl flex flex-col justify-between transition-colors cursor-pointer group min-h-[52px]">
                    <span className="font-bold text-stone-500 text-[10px] tracking-wide">災情火警、急救</span>
                    <span className="text-base font-extrabold text-[#7f1d1d] mt-1 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">119 <span className="text-[10px] font-normal">📞</span></span>
                  </a>
                  <a href="tel:110" className="bg-[#7f1d1d]/5 hover:bg-[#7f1d1d]/10 border border-[#7f1d1d]/20 hover:border-[#7f1d1d]/30 p-2.5 rounded-xl flex flex-col justify-between transition-colors cursor-pointer group min-h-[52px]">
                    <span className="font-bold text-stone-500 text-[10px] tracking-wide">警政治安報案</span>
                    <span className="text-base font-extrabold text-[#7f1d1d] mt-1 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">110 <span className="text-[10px] font-normal">📞</span></span>
                  </a>
                  <a href="tel:112" className="bg-stone-50 hover:bg-stone-100/80 border border-stone-200 p-2.5 rounded-xl flex flex-col justify-between transition-colors cursor-pointer group min-h-[52px]">
                    <span className="font-bold text-stone-500 text-[10px] tracking-wide">無基地台卡求救</span>
                    <span className="text-sm font-extrabold text-stone-800 mt-1 flex items-center gap-1">112 <span className="text-[10px] font-medium text-stone-400">緊急</span></span>
                  </a>
                  <a href="tel:1999" className="bg-stone-50 hover:bg-stone-100/80 border border-stone-200 p-2.5 rounded-xl flex flex-col justify-between transition-colors cursor-pointer group min-h-[52px]">
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
                    斷網時聽取留言互報平安。
                  </p>
                </div>
              </div>
            </div>

            {/* Pinned bottom action button */}
            <div className="mt-auto px-5 pb-6 pt-4 bg-gradient-to-t from-stone-100 via-stone-100/90 to-transparent sticky bottom-0 z-20 md:p-0 md:bg-none md:static md:mt-4 shrink-0">
              <button
                onClick={(e) => {
                  handleAnalyze();
                  if (window.innerWidth < 768) {
                    setIsMobileDrawerOpen(false);
                  }
                }}
                disabled={isAnalyzing || !location}
                className="w-full relative overflow-hidden group bg-[#7f1d1d] hover:bg-[#631414] text-white rounded-xl py-4 px-6 font-bold text-base transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(127,29,29,0.15)] hover:shadow-[0_6px_16px_rgba(127,29,29,0.25)] cursor-pointer min-h-[52px]"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                    <span className="tracking-widest">分析中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform shrink-0" />
                    <span className="tracking-widest">啟動生活防災與居住安全評估</span>
                  </>
                )}
              </button>
            </div>
          </div>

{/* Right Main Area */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6 min-w-0 w-full">

            {/* 🚨 臨災避險極速引導入口 */}
            <div className="bg-stone-900 rounded-3xl border border-stone-950 shadow-md p-5 sm:p-6 flex flex-col gap-5 text-white">
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0 animate-pulse">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold tracking-wider text-white">
                    臨災黃金秒數極速避避入口（點擊開啟逐步自救求生指引）
                  </h3>
                  <p className="text-[11px] text-stone-300 font-semibold mt-0.5">
                    遭遇突發暴雨、強震時請勿驚慌，點選下方卡片，立刻加載極簡、直覺、全離線支持的應急步驟
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveEmergencyGuide('earthquake')}
                  className="bg-gradient-to-br from-red-950/90 to-red-900 border border-red-800/40 hover:border-red-500 rounded-xl p-3.5 text-left transition-all duration-300 hover:scale-[1.01] active:scale-95 group cursor-pointer"
                >
                  <div className="text-xs sm:text-sm font-extrabold text-red-200 group-hover:text-white flex items-center justify-between">
                    <span>🌋 有感強烈地震</span>
                    <span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded shrink-0">極速求生</span>
                  </div>
                  <p className="text-[10px] text-stone-300 font-semibold mt-1.5 leading-relaxed">
                    趴下護頭、防範位移置物櫃、開門防變形、著鞋撤離
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveEmergencyGuide('flooding')}
                  className="bg-gradient-to-br from-blue-950/90 to-blue-900 border border-blue-800/40 hover:border-blue-500 rounded-xl p-3.5 text-left transition-all duration-300 hover:scale-[1.01] active:scale-95 group cursor-pointer"
                >
                  <div className="text-xs sm:text-sm font-extrabold text-blue-200 group-hover:text-white flex items-center justify-between">
                    <span>🌊 房屋積水淹水</span>
                    <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded shrink-0">切源垂直</span>
                  </div>
                  <p className="text-[10px] text-stone-300 font-semibold mt-1.5 leading-relaxed">
                    切斷一樓總配電箱、藥物包垂直逃生、絕不涉足泥流
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveEmergencyGuide('typhoon')}
                  className="bg-gradient-to-br from-emerald-950/90 to-emerald-900 border border-emerald-800/40 hover:border-emerald-500 rounded-xl p-3.5 text-left transition-all duration-300 hover:scale-[1.01] active:scale-95 group cursor-pointer"
                >
                  <div className="text-xs sm:text-sm font-extrabold text-emerald-200 group-hover:text-white flex items-center justify-between">
                    <span>🌀 強風吹碎玻璃</span>
                    <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded shrink-0">掩體避風</span>
                  </div>
                  <p className="text-[10px] text-stone-300 font-semibold mt-1.5 leading-relaxed">
                    避開迎風落地窗、反鎖各扇房門、宣佈停課暫停外勤
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveEmergencyGuide('landslide')}
                  className="bg-gradient-to-br from-amber-950/90 to-amber-900 border border-amber-800/40 hover:border-amber-500 rounded-xl p-3.5 text-left transition-all duration-300 hover:scale-[1.01] active:scale-95 group cursor-pointer"
                >
                  <div className="text-xs sm:text-sm font-extrabold text-[#fef3c7] group-hover:text-white flex items-center justify-between">
                    <span>🏔️ 土石流撤離警報</span>
                    <span className="text-[9px] bg-amber-600 text-white font-bold px-1.5 py-0.2 rounded shrink-0">直角高逃</span>
                  </div>
                  <p className="text-[10px] text-stone-300 font-semibold mt-1.5 leading-relaxed">
                    白天預警隨車提早撤離、垂直泥流方向跑、常備重藥
                  </p>
                </button>
              </div>
            </div>
            
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
                  <h3 className="text-xs font-bold text-stone-700 flex flex-col sm:flex-row sm:items-center justify-between tracking-wider gap-2">
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <Calendar className="w-3.5 h-3.5 text-[#7f1d1d]" />
                      分區即時停班停課查詢看板
                      {suspensionDataLocal?.isDemo && <span className="text-[10px] text-[#7f1d1d] font-bold">⚠ 示範資料，請以官方公告為準</span>}
                    </span>
                    <span className="text-[9px] font-bold text-stone-400 font-mono">
                      資料來源：人事行政總處 ｜ 更新：{suspensionDataLocal?.updatedAt || '--:--'}
                    </span>
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

                  {suspensionDataLocal?.error ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-[120px] text-xs font-bold text-stone-500 bg-stone-50/50 rounded-lg border border-dashed border-stone-200 p-4">
                      <span>資料暫時無法取得，請參考官方公告</span>
                      <a
                        href="https://www.dgpa.gov.tw/typh/daily/nds.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-stone-300 rounded-lg text-[13px] text-stone-600 hover:text-stone-850 hover:bg-stone-50 transition-colors font-semibold shadow-2xs"
                      >
                        前往人事行政總處官網
                      </a>
                    </div>
                  ) : (
                    /* regional dynamic layout */
                    <React.Fragment>
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
                    </React.Fragment>
                  )}
                </div>

                {/* Right Column: Visual map simulation / key metrics panels */}
                <div className="border border-stone-200 rounded-xl p-4 flex flex-col justify-between gap-3 bg-white relative">
                  <div className="space-y-3">
                  <h3 className="text-xs font-bold text-stone-700 flex flex-col sm:flex-row sm:items-center justify-between tracking-wider gap-2">
                    <span className="flex items-center gap-1.5 flex-wrap uppercase">
                      <Activity className="w-3.5 h-3.5 text-[#7f1d1d]" />
                      災防數據與即時監控面板
                      {liveWeather?.isDemo && <span className="text-[10px] text-[#7f1d1d] font-bold normal-case">⚠ 示範資料，請以官方公告為準</span>}
                    </span>
                    <span className="text-[9px] font-bold text-stone-400 font-mono normal-case">
                      資料來源：中央氣象署 ｜ 更新：{liveWeather?.updatedAt || '--:--'}
                    </span>
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

            <div className="flex flex-col md:grid md:grid-cols-5 xl:grid-cols-3 gap-6">
              
              {/* Dashboard Content */}
              <div className="md:col-span-3 xl:col-span-2 flex flex-col gap-6 order-1 md:order-none">
                {!analysisResult && !isAnalyzing && (
                  <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl border border-stone-200/80 p-6 md:p-8 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.02)] relative overflow-hidden transition-all">
                      <div className="absolute -right-12 -top-12 w-48 h-48 bg-stone-50 rounded-full blur-3xl pointer-events-none" />
                      <div className="relative">
                        <h2 className="text-xl md:text-2xl font-extrabold text-stone-900 tracking-tight leading-snug mb-1.5 text-balance">
                          台灣家庭必備備災三原則
                        </h2>
                        <p className="text-[13px] text-stone-500 font-medium mb-4 leading-normal">
                          目前顯示通用資訊，填入地址後可取得個人化建議
                        </p>
                        <p className="text-stone-600 text-sm font-semibold leading-relaxed max-w-2xl text-balance space-y-2">
                          在災害發生前，做好準備是保護家人安全的最有效方法。請落實以下三大原則：<br/>
                          <span className="block mt-2"><strong className="text-stone-800">1. 防災隨身包：</strong> 準備至少 72 小時的維生物資與必要慢性病藥物。</span>
                          <span className="block"><strong className="text-stone-800">2. 逃生動線暢通：</strong> 定期清理家中玄關與陽台，避免堆放雜物，確保緊急撤離不被阻礙。</span>
                          <span className="block"><strong className="text-stone-800">3. 約定避難點：</strong> 與家人約定好斷網時的屋外集合地點與聯絡人。</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Earthquake Card */}
                      <div 
                        onClick={() => setActiveEmergencyGuide('earthquake')}
                        className="bg-gradient-to-br from-stone-50 to-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col gap-3 transition-all hover:border-stone-300 hover:shadow-md cursor-pointer group select-none"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[rgba(234,88,12,0.08)] flex items-center justify-center mb-1 border border-[rgba(234,88,12,0.15)] shrink-0">
                          <Activity className="w-5 h-5 text-[rgb(234,88,12)]" />
                        </div>
                        <h3 className="text-sm font-extrabold text-stone-900">強烈有感地震</h3>
                        <p className="text-xs text-stone-500 font-bold leading-relaxed flex-1">
                          確保【趴下、掩護、穩住】保護頭頸部，切勿在強烈搖晃時隨意奔跑，等待搖晃停歇後再關爐火與移動。
                        </p>
                        <span className="text-[13px] text-stone-400 font-medium group-hover:text-stone-600 transition-colors self-end mt-1">查看詳情 →</span>
                      </div>
                      
                      {/* Typhoon Card */}
                      <div 
                        onClick={() => setActiveEmergencyGuide('typhoon')}
                        className="bg-gradient-to-br from-stone-50 to-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col gap-3 transition-all hover:border-stone-300 hover:shadow-md cursor-pointer group select-none"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[rgba(37,99,235,0.08)] flex items-center justify-center mb-1 border border-[rgba(37,99,235,0.15)] shrink-0">
                          <CloudRainWind className="w-5 h-5 text-[rgb(37,99,235)]" />
                        </div>
                        <h3 className="text-sm font-extrabold text-stone-900">颱風與強陣風</h3>
                        <p className="text-xs text-stone-500 font-bold leading-relaxed flex-1">
                          將陽台盆栽移至室內，大面積玻璃貼上防爆膠帶，備妥手電筒與行動電源以防突發斷路與斷電。
                        </p>
                        <span className="text-[13px] text-stone-400 font-medium group-hover:text-stone-600 transition-colors self-end mt-1">查看詳情 →</span>
                      </div>

                      {/* Flooding Card */}
                      <div 
                        onClick={() => setActiveEmergencyGuide('flooding')}
                        className="bg-gradient-to-br from-stone-50 to-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col gap-3 transition-all hover:border-stone-300 hover:shadow-md cursor-pointer group select-none"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[rgba(109,40,217,0.08)] flex items-center justify-center mb-1 border border-[rgba(109,40,217,0.15)] shrink-0">
                          <CloudLightning className="w-5 h-5 text-[rgb(109,40,217)]" />
                        </div>
                        <h3 className="text-sm font-extrabold text-stone-900">暴雨與積淹水</h3>
                        <p className="text-xs text-stone-500 font-bold leading-relaxed flex-1">
                          若遭遇水淹進屋內，一律切斷一樓總電源後迅速向二樓以上進行垂直避難，絕對不要涉水行走。
                        </p>
                        <span className="text-[13px] text-stone-400 font-medium group-hover:text-stone-600 transition-colors self-end mt-1">查看詳情 →</span>
                      </div>

                      {/* Fire Card */}
                      <div 
                        onClick={() => setActiveEmergencyGuide('fire')}
                        className="bg-gradient-to-br from-stone-50 to-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col gap-3 transition-all hover:border-stone-300 hover:shadow-md cursor-pointer group select-none"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[rgba(220,38,38,0.08)] flex items-center justify-center mb-1 border border-[rgba(220,38,38,0.15)] shrink-0">
                          <Zap className="w-5 h-5 text-[rgb(220,38,38)]" />
                        </div>
                        <h3 className="text-sm font-extrabold text-stone-900">室內火災防範</h3>
                        <p className="text-xs text-stone-500 font-bold leading-relaxed flex-1">
                          遇濃煙應壓低身姿，若門把燙手勿開門，用濕毛巾塞住門縫並在窗邊呼救，等待 119 救援。
                        </p>
                        <span className="text-[13px] text-stone-400 font-medium group-hover:text-stone-600 transition-colors self-end mt-1">查看詳情 →</span>
                      </div>
                    </div>

                    <div className="bg-[#1c1917] rounded-3xl p-6 md:p-8 border border-stone-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl mt-2 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/20 blur-3xl rounded-full pointer-events-none" />
                       <div className="relative z-10 w-full md:w-auto text-center md:text-left">
                         <h3 className="text-sm md:text-base font-extrabold text-stone-100 flex items-center justify-center md:justify-start gap-2 mb-2">
                           <Phone className="w-4 h-4 text-stone-400" /> 緊急聯絡電話快速卡
                         </h3>
                         <p className="text-xs font-bold leading-relaxed text-stone-400">
                           災難發生時保持冷靜，簡潔報出發生人、事、時、地、物。
                         </p>
                       </div>
                       <div className="relative z-10 flex w-full md:w-auto items-center gap-3">
                         <div className="bg-stone-800/80 rounded-xl px-4 py-3 text-center flex-1 border border-stone-700/50">
                           <span className="block text-[10px] text-stone-400 font-extrabold tracking-widest mb-1">救災救護</span>
                           <span className="block text-2xl font-mono font-bold text-red-400">119</span>
                         </div>
                         <div className="bg-stone-800/80 rounded-xl px-4 py-3 text-center flex-1 border border-stone-700/50">
                           <span className="block text-[10px] text-stone-400 font-extrabold tracking-widest mb-1">治安報案</span>
                           <span className="block text-2xl font-mono font-bold text-blue-400">110</span>
                         </div>
                         <div className="bg-stone-800/80 rounded-xl px-4 py-3 text-center flex-1 border border-stone-700/50">
                           <span className="block text-[10px] text-stone-400 font-extrabold tracking-widest mb-1">無訊號求救</span>
                           <span className="block text-2xl font-mono font-bold text-emerald-400">112</span>
                         </div>
                       </div>
                    </div>
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

                <p className="text-center text-xs text-stone-400 font-medium">
                  以上為 AI 分析建議，防災行動請以政府官方指引為主
                </p>

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
              <div id="app-right-sidebar" className="md:col-span-2 xl:col-span-1 flex flex-col gap-6 order-2 md:order-none">
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden flex flex-col h-[650px] xl:max-h-[850px] md:sticky md:top-6 lg:sticky xl:top-24">
                  
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

          <footer className="mt-8 mb-4 text-center text-[11px] text-stone-400 font-medium border-t border-stone-200/50 pt-4 max-w-2xl mx-auto">
            本網站防災資訊參考自中央氣象署及內政部消防署公開資料，AI 功能由 Google Gemini 提供。
          </footer>
        </div>
      </div>

      {/* 🚨 Emergency Self-Rescue Guide Interactive Modal */}
      {activeEmergencyGuide && (() => {
        const guide = EMERGENCY_GUIDES[activeEmergencyGuide];
        const isGuideCompleted = guide.steps.every(step => emergencyChecks[step.id]);
        return (
          <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-stone-150">
              
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-stone-800 bg-stone-950 relative">
                <span className="text-[10px] bg-red-650 bg-red-900/40 text-red-300 font-extrabold border border-red-700/40 px-2.5 py-1 rounded-full uppercase tracking-widest leading-none">
                  {guide.badge}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white mt-3 flex items-center gap-2">
                  {guide.title}
                </h3>
                <p className="text-xs text-stone-400 font-bold leading-relaxed mt-1">
                  {guide.subtitle}
                </p>
                
                <button
                  type="button"
                  onClick={() => setActiveEmergencyGuide(null)}
                  className="absolute right-5 top-5 text-stone-500 hover:text-stone-200 hover:bg-stone-800/50 p-2 rounded-full transition-all text-sm font-extrabold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Progress Bar */}
              <div className="bg-stone-950 px-6 py-3 border-b border-stone-800 flex items-center justify-between text-xs font-bold text-stone-400">
                <span className="flex items-center gap-1.5">
                  <span>防護進度：</span>
                  <span className="text-emerald-400 font-extrabold text-sm ml-0.5">
                    {guide.steps.filter(s => emergencyChecks[s.id]).length} / {guide.steps.length} 步驟已確認
                  </span>
                </span>
                {isGuideCompleted ? (
                   <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-black animate-pulse">
                     🔥 求生防護完畢！
                   </span>
                ) : (
                   <span className="text-amber-400 font-extrabold">🚨 有部分常規撤離尚未到位</span>
                )}
              </div>

              {/* Scrollable List of Interactive Steps */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 custom-scrollbar">
                <div className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 p-4 rounded-xl flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
                  <p className="leading-relaxed font-semibold">
                    <strong>強烈防禦心法：</strong>本指引專供緊臨臨災時 10 秒極速檢視。點選下方條目可直接核實並儲存至本地，即使完全斷網（ offline 狀態下）也支持在手機上交互使用、守護安全。
                  </p>
                </div>

                <div className="space-y-2.5">
                  {guide.steps.map((step, idx) => {
                    const isChecked = !!emergencyChecks[step.id];
                    return (
                      <div
                        key={step.id}
                        onClick={() => setEmergencyChecks(prev => ({ ...prev, [step.id]: !prev[step.id] }))}
                        className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isChecked 
                            ? 'bg-emerald-950/20 border-emerald-800/40 opacity-70 hover:opacity-100' 
                            : 'bg-stone-950/50 border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        <div className="mt-0.5">
                          <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isChecked 
                              ? 'bg-emerald-600 border-emerald-600 text-white' 
                              : 'border-stone-600 bg-stone-900 text-transparent'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3.5} />}
                          </div>
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mr-2">
                            自救機制 {idx + 1}
                          </span>
                          <p className={`text-xs sm:text-sm leading-relaxed mt-0.5 font-semibold ${
                            isChecked ? 'text-stone-400 line-through' : 'text-stone-200'
                          }`}>
                            {step.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dialog Footer */}
              <div className="p-5 sm:p-6 border-t border-stone-850 bg-stone-950 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-stone-400 font-semibold self-start sm:self-center">
                   <Phone className="w-4 h-4 text-red-405 text-red-500 animate-pulse" />
                   <span>通訊崩潰時點此直撥求救：</span>
                   <a href="tel:119" className="text-red-400 hover:underline font-extrabold text-sm ml-1">119</a> | 
                   <a href="tel:112" className="text-amber-400 hover:underline font-extrabold text-sm ml-1">112</a>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setEmergencyChecks(prev => {
                      const cleared = { ...prev };
                      guide.steps.forEach(s => cleared[s.id] = false);
                      return cleared;
                    })}
                    className="flex-1 sm:flex-none border border-stone-800 hover:bg-stone-800 text-stone-450 hover:text-stone-300 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    重置進度
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveEmergencyGuide(null)}
                    className="flex-1 sm:flex-none bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    關閉自救指引
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}

