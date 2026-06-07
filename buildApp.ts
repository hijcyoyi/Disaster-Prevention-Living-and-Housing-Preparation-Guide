import { readFileSync, writeFileSync } from "fs";

const content = readFileSync("src/App.tsx", "utf-8");

const topLines = content.split('\n').slice(0, 774);
const topPart = topLines.join('\n');

const mainAreaIdx = content.lastIndexOf('{/* Right Main Area */}');
const rightMainTextRaw = content.substring(mainAreaIdx);

// We must strip any duplicated `export default function App` inside rightMainTextRaw if any, but since it's the LAST occurrence, it shouldn't have any duplications inside.
// However, rightMainTextRaw goes until the EOF. The EOF should legitimately close the component.
// Let's ensure it has `export default App;` or just ends properly.
// The file should end with `  return (\n... ) \n}`.
const rightMainText = rightMainTextRaw.replace(/export default function App\(\) \{[\s\S]*$/, ''); // just in case there's garbage after

const leftSidebarCode = `          {/* Left Sidebar: Controls & Settings */}
          <div className={\`
             fixed inset-x-0 bottom-0 bg-stone-100 z-50 flex flex-col max-h-[85vh] rounded-t-3xl transition-transform duration-400 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]
             \${isMobileDrawerOpen ? 'translate-y-0' : 'translate-y-full'}
             md:static md:translate-y-0 md:bg-transparent md:max-h-[calc(100vh-3rem)] md:rounded-none md:shadow-none md:z-auto md:w-full md:sticky md:top-6
             lg:col-span-4 xl:col-span-3
          \`}>
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
                  <div className={\`w-6 h-6 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-stone-100 transition-transform duration-250 \${isAiOpen ? 'rotate-180' : 'rotate-0'}\`}>
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
                        <div className={\`w-1.5 h-1.5 rounded-full \${customApiKey ? "bg-emerald-500 animate-pulse" : "bg-stone-400"}\`} />
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
                    <div className={\`w-6 h-6 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-stone-100 transition-transform duration-250 \${isEnvOpen ? 'rotate-180' : 'rotate-0'}\`}>
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
                  <div className={\`w-6 h-6 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-stone-100 transition-transform duration-250 \${isFamilyOpen ? 'rotate-180' : 'rotate-0'}\`}>
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
                        <label key={item.key} className={\`cursor-pointer flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 \${
                          checked 
                            ? 'bg-rose-50/40 border-[#7f1d1d]/40 shadow-[0_2px_8px_-3px_rgba(127,29,29,0.1)] translate-x-1' 
                            : 'bg-white border-stone-200/80 hover:border-stone-300 hover:bg-stone-50/50'
                        }\`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleProfileChange(item.key as keyof FamilyProfile)}
                            className="hidden"
                          />
                          <div className={\`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition-all duration-200 \${
                            checked ? 'bg-[#7f1d1d] border-[#7f1d1d] text-white scale-105 shadow-xs' : 'bg-white border-stone-300'
                          }\`}>
                            {checked && <Check className="w-3 h-3 text-white" strokeWidth={3.5} />}
                          </div>
                          <div className="flex flex-col select-none">
                            <span className={\`text-[15px] font-bold transition-colors \${checked ? 'text-[#7f1d1d]' : 'text-stone-750'}\`}>{item.label}</span>
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
`;

const finalFileContent = topPart + "\n" + leftSidebarCode + "\n" + rightMainText;
writeFileSync("src/App.tsx", finalFileContent);
console.log("App.tsx has been rebuilt cleanly!");
