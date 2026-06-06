import React, { useState } from 'react';
import { Check, Droplet, Flame, Heart, FileText, Compass, MoreHorizontal, Plus, Trash, Users } from 'lucide-react';
import { SupplyItem } from '../types';
import { defaultSupplies } from '../data';

interface SuppliesInventoryProps {
  supplies: SupplyItem[];
  setSupplies: React.Dispatch<React.SetStateAction<SupplyItem[]>>;
  memberCount: number;
  setMemberCount: React.Dispatch<React.SetStateAction<number>>;
  isSidebar?: boolean;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case '糧食飲水':
      return <Droplet className="w-4 h-4 text-[#7f1d1d]" />;
    case '保暖禦寒':
      return <Flame className="w-4 h-4 text-stone-600" />;
    case '醫療急救':
      return <Heart className="w-4 h-4 text-stone-600" />;
    case '重要物品':
      return <FileText className="w-4 h-4 text-stone-600" />;
    case '求生工具':
      return <Compass className="w-4 h-4 text-stone-600" />;
    default:
      return <MoreHorizontal className="w-4 h-4 text-stone-600" />;
  }
};

const getCategoryBg = (category: string) => {
  if (category === '糧食飲水') return 'bg-[#7f1d1d]/10 border-[#7f1d1d]/20 text-[#7f1d1d]';
  return 'bg-[#f4f1eb] border-stone-200 text-stone-700';
};

const getDynamicScaleInfo = (name: string, memberCount: number): string => {
  const clean = name.trim();
  if (clean.includes('水') || clean.includes('飲水') || clean.includes('瓶裝水')) {
    return `每人 3L / 天，3天份（需備置 ${memberCount * 9} 公升）`;
  }
  if (clean.includes('食品') || clean.includes('口糧') || clean.includes('能量棒') || clean.includes('儲置主食') || clean.includes('罐頭')) {
    return `每人 3天 9餐份（全家需備置 ${memberCount * 9} 餐）`;
  }
  if (clean.includes('雨衣')) {
    return `攜帶防雨：全家每人各 1 件（共需 ${memberCount} 件）`;
  }
  if (clean.includes('外套')) {
    return `防失溫：防風防寒外套每人 1 件（共需 ${memberCount} 件）`;
  }
  if (clean.includes('毛毯') || clean.includes('睡袋')) {
    return `防寒睡眠：建議全家防潮阻寒各 1 組（共置 ${memberCount} 組）`;
  }
  if (clean.includes('暖暖包')) {
    return `手足禦寒：備置 2 個應急（全家共需 ${memberCount * 2} 個）`;
  }
  if (clean.includes('襪子')) {
    return `換穿防潮：建議每人各 1 雙（全家共置 ${memberCount} 雙）`;
  }
  if (clean.includes('常備藥') || clean.includes('處方藥')) {
    return `慢性與常備藥量：準備 3 至 7 天的專屬完整藥量`;
  }
  if (clean.includes('OK繃') || clean.includes('急救') || clean.includes('繃帶') || clean.includes('紗布')) {
    return `醫療防護：儲備基本消毒敷料（全家份）`;
  }
  if (clean.includes('身分證') || clean.includes('健保卡') || clean.includes('證件影本')) {
    return `備份影本：全家密封防水袋各 1 份影本`;
  }
  if (clean.includes('現金') || clean.includes('零錢')) {
    return `備用錢幣，避免大斷網：建議準備約 ${memberCount * 500} 元零錢與百元鈔`;
  }
  if (clean.includes('手電筒') || clean.includes('頭燈')) {
    return `安全照明：每人至少備 1 組（全家共備置 ${memberCount} 組）`;
  }
  if (clean.includes('電池')) {
    return `對應照明工具：各備好 2 組適配備用全新乾電池`;
  }
  if (clean.includes('哨子')) {
    return `受困呼救哨：每人各 1 只隨身挂脖（共備 ${memberCount} 只）`;
  }
  if (clean.includes('打火機') || clean.includes('火柴')) {
    return `生火禦寒：隨身基礎防水防風點火點 1-2 組`;
  }
  if (clean.includes('衛生紙')) {
    return `日常生活必需：全家儲備至少 ${memberCount} 大包`;
  }
  if (clean.includes('濕紙巾') || clean.includes('擦拭巾')) {
    return `斷水期清潔：預備約 ${Math.ceil(memberCount / 2)} 箱或大包`;
  }
  if (clean.includes('口罩')) {
    return `防塵防毒煙：每人備置 5 片（全家備 ${memberCount * 5} 片）`;
  }
  if (clean.includes('行動電源') || clean.includes('充電線')) {
    return `手機不斷電 lifeline：每人備置足電 1 組（備置 ${memberCount} 組）`;
  }
  return '';
};

export function SuppliesInventory({ supplies, setSupplies, memberCount, setMemberCount, isSidebar = false }: SuppliesInventoryProps) {
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [urgencyFilter, setUrgencyFilter] = useState<'immediate' | 'routine' | 'all'>('immediate');

  const toggleSupply = (id: string) => {
    setSupplies((prev) =>
      prev.map((item) => (item.id === id ? { ...item, hasIt: !item.hasIt } : item))
    );
  };

  const handleAddCustom = (category: string, e: React.FormEvent) => {
    e.preventDefault();
    const name = customInputs[category]?.trim();
    if (!name) return;

    const newItem: SupplyItem = {
      id: `custom-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      category,
      name,
      hasIt: false,
      urgency: urgencyFilter === 'all' ? 'immediate' : urgencyFilter,
    };

    setSupplies((prev) => [...prev, newItem]);
    setCustomInputs((prev) => ({ ...prev, [category]: '' }));
  };

  const handleDeleteSupply = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSupplies((prev) => prev.filter((item) => item.id !== id));
  };

  // Filter supplies based on senior double-track design
  const filteredSupplies = supplies.filter((s) => {
    if (urgencyFilter === 'immediate') return s.urgency === 'immediate';
    if (urgencyFilter === 'routine') return s.urgency === 'routine';
    return true;
  });

  const completedCount = supplies.filter((s) => s.hasIt).length;
  const progressPercent = Math.round((completedCount / supplies.length) * 100) || 0;

  // Active filter statistics
  const activeTotal = filteredSupplies.length;
  const activeCompleted = filteredSupplies.filter((s) => s.hasIt).length;
  const activePercent = Math.round((activeCompleted / activeTotal) * 100) || 0;

  // Group filtered supplies by category
  const groupedSupplies = filteredSupplies.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SupplyItem[]>);

  return (
    <div className={`bg-white rounded-xl ${isSidebar ? 'p-1.5 flex flex-col gap-5 border-none shadow-none' : 'border border-stone-200 shadow-sm p-6 xl:p-8 flex flex-col gap-6'} w-full font-sans`}>
      <div className={`flex flex-col ${isSidebar ? 'gap-4 pb-4' : 'xl:flex-row xl:items-center justify-between gap-6 pb-5'} border-b border-stone-150`}>
        <div className={`flex flex-col ${isSidebar ? 'gap-3.5' : 'sm:flex-row sm:items-center gap-5 justify-between xl:justify-start'} w-full xl:w-auto`}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#7f1d1d] flex items-center justify-center text-white shadow-sm shrink-0 font-sans text-lg font-bold">
               40
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight text-stone-900 flex items-center gap-1.5">
                <span>防災避難備品盤點</span>
                <span className="text-[10px] bg-red-50 text-[#7f1d1d] font-bold px-1.5 py-0.5 rounded border border-red-200/20">專業分流制</span>
              </h3>
              <p className="text-xs font-semibold text-stone-500 mt-0.5">資深防災專家 40 年避難規劃：避難隨身包、居家儲備物資嚴格分流</p>
            </div>
          </div>

          {/* 整備人數設定 */}
          <div className="flex items-center justify-between sm:justify-start gap-2 bg-[#f5f4f0] border border-stone-200 px-3 py-1.5 rounded-lg shrink-0">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-stone-600" />
              <span className="text-xs font-bold text-stone-700">避難人數：</span>
            </div>
            <div className="flex items-center bg-white border border-stone-200 rounded-md">
              <button
                type="button"
                onClick={() => setMemberCount(p => Math.max(1, p - 1))}
                className="w-5 h-5 flex items-center justify-center hover:bg-stone-100 text-stone-600 font-bold text-sm rounded-l transition-all cursor-pointer"
              >
                －
              </button>
              <span className="text-xs font-bold text-stone-900 px-1.5 min-w-[16px] text-center select-none">
                {memberCount}
              </span>
              <button
                type="button"
                onClick={() => setMemberCount(p => Math.min(10, p + 1))}
                className="w-5 h-5 flex items-center justify-center hover:bg-stone-100 text-stone-600 font-bold text-sm rounded-r transition-all cursor-pointer"
              >
                ＋
              </button>
            </div>
            <span className="text-[10px] font-bold text-stone-500">
              {memberCount === 1 ? '單人' : `${memberCount}人`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('確定要重置所有盤點狀態，恢復專家推薦的預設防災避難清單嗎？（自訂新增的備品也將被移除）')) {
                setSupplies(defaultSupplies);
              }
            }}
            className="text-[10px] bg-stone-50 hover:bg-stone-204 hover:bg-stone-100 text-stone-605 text-stone-600 border border-stone-200 px-2.5 py-1.5 rounded-lg font-bold select-none cursor-pointer tracking-wider shrink-0 transition-colors"
            title="重量恢復原始狀態"
          >
            🔄 恢復預設清單
          </button>
        </div>
        
        <div className={`flex flex-col ${isSidebar ? 'gap-3 w-full' : 'sm:flex-row sm:items-center gap-4 min-w-[320px]'}`}>
          <div className="flex items-center justify-between gap-3 bg-[#f5f4f0] border border-stone-200/60 px-4 py-2 rounded-lg shrink-0">
             <div className="flex flex-col text-left">
               <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">合計總計度</span>
               <span className="text-xs font-bold text-stone-600">已備妥 {completedCount} / {supplies.length} 件</span>
             </div>
             <span className="text-lg font-black text-[#7f1d1d]">{progressPercent}%</span>
          </div>
          <div className="flex-1 w-full min-w-[140px] bg-stone-50 p-2 rounded-lg border border-stone-200/30">
             <div className="flex justify-between items-end text-[11px] font-bold tracking-wide text-stone-600 mb-1">
              <span>現選別目錄進度</span>
              <span className="text-[#7f1d1d] font-extrabold">{activePercent}% ({activeCompleted}/{activeTotal})</span>
            </div>
            <div className="w-full bg-stone-200/60 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#7f1d1d] h-full rounded-full transition-all duration-700 ease-out" 
                style={{ width: `${activePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 40年專業防災設計核心心法看板 */}
      <div className={`bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200/80 rounded-xl text-stone-800 leading-relaxed ${isSidebar ? 'p-3 text-[11px]' : 'p-4.5 text-xs'}`}>
        <div className="flex gap-2.5">
          <div className="p-1 text-amber-700 shrink-0">
            <Compass className="w-4 h-4 text-[#7f1d1d] shrink-0" />
          </div>
          <div className="flex flex-col gap-1 text-left">
            <h4 className="font-extrabold text-[#7f1d1d] text-xs flex items-center gap-1">
              <span>🎖️ 資深防災專家 40 年・雙軌備災心法</span>
            </h4>
            <p className="text-stone-600 font-semibold leading-relaxed mt-0.5">
              「混淆隨身避難包與居家常備儲蓄，是災難時最致命的盲點。」
              <strong className="text-[#7f1d1d] font-bold">隨身避難包</strong>專為緊急撤離避難而建，應求輕便好攜帶、救命，能1秒背起（不超過個人體重的 10-15%），是目前在臨災警預時最先檢查、最需要的生存鎖；
              而<strong className="text-stone-900 font-bold font-black">居家儲備庫</strong>則是為就地避難與嚴重斷水斷電時的 long-term 存活支柱。雙軌厳格分流，保證抗災有條不紊。
            </p>
          </div>
        </div>
      </div>

      {/* Segmented Tab Selectors for Dual-Track System */}
      <div className="flex flex-col sm:flex-row gap-1.5 p-1 bg-stone-100 border border-stone-200/50 rounded-xl">
        <button
          type="button"
          onClick={() => setUrgencyFilter('immediate')}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-2.5 rounded-lg border transition-all text-center cursor-pointer ${
            urgencyFilter === 'immediate'
              ? 'bg-red-50 text-[#7f1d1d] font-extrabold border-red-200 shadow-xs'
              : 'bg-transparent text-stone-500 hover:text-stone-800 border-transparent font-bold hover:bg-stone-50/50'
          }`}
        >
          <span className="text-xs tracking-wider flex items-center gap-1 justify-center">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#7f1d1d] animate-pulse shrink-0" />
            🚨 隨身避難包 (臨災急需)
          </span>
          <span className="text-[10px] mt-0.5 opacity-80 font-medium scale-95 font-bold">點選查看隨攜撤離救命包</span>
        </button>
        
        <button
          type="button"
          onClick={() => setUrgencyFilter('routine')}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-2.5 rounded-lg border transition-all text-center cursor-pointer ${
            urgencyFilter === 'routine'
              ? 'bg-amber-50/70 text-amber-800 font-extrabold border-amber-200 shadow-xs'
              : 'bg-transparent text-stone-500 hover:text-stone-800 border-transparent font-bold hover:bg-stone-50/50'
          }`}
        >
          <span className="text-xs tracking-wider flex items-center gap-1 justify-center">
            🏠 居家儲置庫 (平常準備)
          </span>
          <span className="text-[10px] mt-0.5 opacity-80 font-medium scale-95 font-bold">點選查看平常儲存居家物資</span>
        </button>
        
        <button
          type="button"
          onClick={() => setUrgencyFilter('all')}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-2.5 rounded-lg border transition-all text-center cursor-pointer ${
            urgencyFilter === 'all'
              ? 'bg-stone-800 text-white font-extrabold border-stone-700 shadow-xs'
              : 'bg-transparent text-stone-500 hover:text-stone-800 border-transparent font-bold hover:bg-stone-50/50'
          }`}
        >
          <span className="text-xs tracking-wider flex items-center gap-1 justify-center">
            📦 完整防護網 (合併檢視)
          </span>
          <span className="text-[10px] mt-0.5 opacity-80 font-medium scale-95 font-bold">一次看清所有項目定期大檢查</span>
        </button>
      </div>
      
      <div className={`grid gap-4 overflow-y-auto custom-scrollbar ${isSidebar ? 'grid-cols-1 max-h-[550px]' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 max-h-[460px] lg:max-h-none'}`}>
        {Object.entries(groupedSupplies).map(([category, items]) => {
          if (items.length === 0) return null; // Hide empty categories in current filter
          return (
            <div key={category} className={`bg-[#FAF9F6]/85 border border-stone-200/80 rounded-xl flex flex-col gap-4 ${isSidebar ? 'p-3.5' : 'p-5'}`}>
              <div className="flex items-center justify-between border-b border-stone-200/40 pb-2">
                <h4 className="text-sm font-bold text-stone-800 flex items-center gap-1.5 font-sans">
                  <div className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 ${getCategoryBg(category)}`}>
                    {getCategoryIcon(category)}
                  </div>
                  <span className="tracking-wide text-stone-800 font-extrabold">{category}</span>
                </h4>
                <span className="text-[10px] font-bold text-stone-500 bg-stone-100/80 px-2 py-0.5 rounded-full border border-stone-200/40">
                  {items.filter(i => i.hasIt).length}/{items.length}
                </span>
              </div>
              
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 select-none custom-scrollbar">
                {items.map((item) => {
                  const checked = item.hasIt;
                  const dynamicDesc = getDynamicScaleInfo(item.name, memberCount);
                  return (
                    <div 
                      key={item.id}
                      onClick={() => toggleSupply(item.id)}
                      className={`group cursor-pointer flex flex-col p-2.5 rounded border transition-all ${
                        checked 
                          ? "bg-[#faf9f6]/40 border-stone-150/50 opacity-60 hover:opacity-100" 
                          : "bg-white border-stone-200 hover:border-stone-400 shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-1 text-left flex flex-col">
                          <span className={`text-sm font-bold transition-all leading-snug ${checked ? "text-stone-400 line-through font-medium" : "text-stone-900"}`}>
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 mt-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSupply(item.id, e);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-stone-100 hover:text-[#7f1d1d] text-stone-400 rounded transition-all duration-200"
                            title="移除備品"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSupply(item.id)}
                            className="hidden"
                          />
                          <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                            checked 
                              ? 'bg-[#7f1d1d] border-[#7f1d1d] shadow-sm' 
                              : 'border-stone-300 group-hover:border-stone-500 bg-[#FAF9F6]'
                          }`}>
                            {checked && <Check className="w-3 h-3 text-white" strokeWidth={3.5} />}
                          </div>
                        </div>
                      </div>

                      {/* Display scales description */}
                      {dynamicDesc && !checked && (
                        <div className="text-[11px] font-bold mt-1 text-[#7f1d1d]/90 flex items-center gap-1.5 font-sans">
                          <span>⚖️ {dynamicDesc}</span>
                        </div>
                      )}

                      {/* Merged View Label */}
                      {urgencyFilter === 'all' && (
                        <div className="mt-1.5 flex">
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-sm font-bold uppercase tracking-wider ${
                            item.urgency === 'immediate' 
                              ? 'bg-red-50 text-[#7f1d1d] border border-red-100' 
                              : 'bg-amber-50 text-[#854d0e] border border-amber-100'
                          }`}>
                            {item.urgency === 'immediate' ? '🚨 隨身避難包' : '🏠 居家日常儲備'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
  
              <form onSubmit={(e) => handleAddCustom(category, e)} className="flex items-center gap-1.5 mt-auto pt-2 border-t border-stone-200/40">
                <input
                  type="text"
                  value={customInputs[category] || ''}
                  onChange={(e) => setCustomInputs((prev) => ({ ...prev, [category]: e.target.value }))}
                  placeholder="➕ 新增自訂備品..."
                  className="flex-1 bg-white border border-stone-200/80 rounded px-2.5 py-1.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-all font-medium"
                />
                <button
                  type="submit"
                  disabled={!(customInputs[category] || '').trim()}
                  className="bg-[#7f1d1d] text-white p-1 rounded disabled:opacity-30 hover:bg-[#6b1812] active:scale-95 transition-all flex items-center justify-center shrink-0 animate-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
