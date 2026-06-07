import { readFileSync, writeFileSync } from "fs";

const file = readFileSync("src/App.tsx", "utf-8");
const brokenStart = file.indexOf('          next24h: [');
const layoutStart = file.indexOf('          <div className={`\\n             fixed inset-x-0 bottom-0');

const replacement = `          next24h: [
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

  const handleAnalyzeEnvironment = () => {
    setIsAnalyzingEnv(true);
    setTimeout(() => {
      setEnvironmentDesc(
        "探測結果：該位址周邊有輕微積水風險，主要聯外道路地勢平坦，但部分街區可能受豪雨影響。建議大雨時注意低窪處。"
      );
      setIsAnalyzingEnv(false);
    }, 1500);
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-start">

          {/* Left Sidebar: Controls & Settings */}
`; // we replaced and added up to the point just before <div className={\` fixed inset-x-0 ...

const newContent = file.substring(0, brokenStart) + replacement + file.substring(layoutStart);
writeFileSync("src/App.tsx", newContent);
console.log("Fixed!");
