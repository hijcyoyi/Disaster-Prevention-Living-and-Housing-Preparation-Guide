import React, { useState } from 'react';
import { Check, Droplet, Flame, Heart, FileText, Compass, MoreHorizontal, Plus, Trash, Users } from 'lucide-react';
import { SupplyItem } from '../types';

interface SuppliesInventoryProps {
  supplies: SupplyItem[];
  setSupplies: React.Dispatch<React.SetStateAction<SupplyItem[]>>;
  memberCount: number;
  setMemberCount: React.Dispatch<React.SetStateAction<number>>;
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
    return `日常每人 3L / 天，3天份（全家共需 ${memberCount * 9} 公升）`;
  }
  if (clean.includes('食品') || clean.includes('口糧') || clean.includes('能量棒') || clean.includes('防飢')) {
    return `高能乾糧/罐頭：每人 3天 9餐（全家共需 ${memberCount * 9} 餐份）`;
  }
  if (clean.includes('雨衣')) {
    return `攜帶防雨：家庭成員每人各 1 件（共需 ${memberCount} 件）`;
  }
  if (clean.includes('外套')) {
    return `防失溫：防風防寒外套每人各 1 件（共需 ${memberCount} 件）`;
  }
  if (clean.includes('毛毯')) {
    return `防寒睡眠：每人建議各備 1 條（共需 ${memberCount} 條）`;
  }
  if (clean.includes('暖暖包')) {
    return `手足禦寒：每人配置 2 個備用（共需 ${memberCount * 2} 個）`;
  }
  if (clean.includes('襪子')) {
    return `備用乾爽：每人備置至少 1 雙（共需 ${memberCount} 雙）`;
  }
  if (clean.includes('常備藥') || clean.includes('處方藥')) {
    return `常備及慢性處方簽：每人準備 3 至 7 天的完整藥量`;
  }
  if (clean.includes('OK繃') || clean.includes('創可貼')) {
    return `外傷刮商處理：建議準備至少 ${Math.ceil(memberCount * 5)} 貼應急`;
  }
  if (clean.includes('紗布')) {
    return `傷口處置：建議準備 1-2 組基礎無菌急救敷料`;
  }
  if (clean.includes('優碘')) {
    return `急救消毒乾淨必備：1 瓶置於隨身急救包內`;
  }
  if (clean.includes('身分證') || clean.includes('健保卡')) {
    return `搜救核對：每人密封防水備份 1 份影本（共 ${memberCount} 份）`;
  }
  if (clean.includes('少許現金')) {
    return `備用零錢與百元鈔，避開斷網投幣機：全家預備約 ${memberCount * 500} 元`;
  }
  if (clean.includes('手電筒')) {
    return `照明防暗：建議準備至少 ${Math.max(2, Math.ceil(memberCount / 2))} 支（附掛繩）`;
  }
  if (clean.includes('電池')) {
    return `供照明及收音機：每支照明配備 2 組備用乾電池`;
  }
  if (clean.includes('哨子')) {
    return `受困高頻求救哨：每人各 1 只隨身挂脖（共 ${memberCount} 只）`;
  }
  if (clean.includes('打火機')) {
    return `點火取暖或照明：基礎防雨引火點 1-2 個`;
  }
  if (clean.includes('衛生紙')) {
    return `日常生活必需：每人預備 1 大包（共 ${memberCount} 包）`;
  }
  if (clean.includes('濕紙巾')) {
    return `斷水期身體乾擦洗：全家預備約 ${Math.ceil(memberCount / 2)} 大包`;
  }
  if (clean.includes('口罩')) {
    return `防煙防塵防病菌：每人備置 5 片（共 ${memberCount * 5} 片）`;
  }
  if (clean.includes('行動電源')) {
    return `手機不斷電 lifeline：每人備 1 萬mAh（共 ${memberCount} 個充飽電源）`;
  }
  if (clean.includes('充電線')) {
    return `接口適配對應線：建議備置至少 ${Math.max(2, memberCount)} 條備用`;
  }
  return '';
};

export function SuppliesInventory({ supplies, setSupplies, memberCount, setMemberCount }: SuppliesInventoryProps) {
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});


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
    };

    setSupplies((prev) => [...prev, newItem]);
    setCustomInputs((prev) => ({ ...prev, [category]: '' }));
  };

  const handleDeleteSupply = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSupplies((prev) => prev.filter((item) => item.id !== id));
  };

  const completedCount = supplies.filter((s) => s.hasIt).length;
  const progressPercent = Math.round((completedCount / supplies.length) * 100) || 0;

  // Group supplies by category
  const groupedSupplies = supplies.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SupplyItem[]>);

  // Guarantee that the primary five categories exist even if empty
  const primaryCategories = ['糧食飲水', '保暖禦寒', '醫療急救', '重要物品', '求生工具', '其他備品'];
  primaryCategories.forEach((cat) => {
    if (!groupedSupplies[cat]) groupedSupplies[cat] = [];
  });

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 xl:p-8 flex flex-col gap-6 w-full font-sans">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-stone-150 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 justify-between xl:justify-start w-full xl:w-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#7f1d1d] flex items-center justify-center text-white shadow-sm">
               <Check className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-stone-900">
                防災避難備品盤點
              </h3>
              <p className="text-sm font-medium text-stone-500 mt-1">簡約、有條理地盤點日常及應急物資</p>
            </div>
          </div>

          {/* 整備人數設定 */}
          <div className="flex items-center gap-2 bg-[#f5f4f0] border border-stone-200 px-3 py-1.5 rounded-lg shrink-0">
            <Users className="w-3.5 h-3.5 text-stone-600" />
            <span className="text-sm font-bold text-stone-700">避難人數：</span>
            <div className="flex items-center bg-white border border-stone-200 rounded-md">
              <button
                type="button"
                onClick={() => setMemberCount(p => Math.max(1, p - 1))}
                className="w-5 h-5 flex items-center justify-center hover:bg-stone-100 text-stone-600 font-bold text-sm rounded-l transition-all"
              >
                －
              </button>
              <span className="text-sm font-bold text-stone-900 px-2 min-w-[16px] text-center select-none">
                {memberCount}
              </span>
              <button
                type="button"
                onClick={() => setMemberCount(p => Math.min(10, p + 1))}
                className="w-5 h-5 flex items-center justify-center hover:bg-stone-100 text-stone-600 font-bold text-sm rounded-r transition-all"
              >
                ＋
              </button>
            </div>
            <span className="text-xs font-bold text-stone-500">
              {memberCount === 1 ? '單人份' : `多人 (${memberCount} 人份)`}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-[280px]">
          <div className="flex items-center justify-between gap-3 bg-[#f5f4f0] border border-stone-200/60 px-4 py-2 rounded-lg shrink-0">
             <span className="text-sm font-semibold text-stone-600">已備妥</span>
             <span className="text-base font-bold text-[#7f1d1d]">
               {completedCount} <span className="text-stone-400 text-xs font-normal">/ {supplies.length} 件</span>
             </span>
          </div>
          <div className="flex-1 min-w-[160px]">
             <div className="flex justify-between items-end text-sm font-bold tracking-wide text-stone-500 mb-1.5">
              <span>準備進度</span>
              <span className="text-[#7f1d1d] font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#7f1d1d] h-full rounded-full transition-all duration-700 ease-out" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-h-[360px] lg:max-h-none overflow-y-auto custom-scrollbar">
        {Object.entries(groupedSupplies).map(([category, items]) => (
          <div key={category} className="bg-[#FAF9F6]/80 border border-stone-200/80 p-5 rounded-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-stone-800 flex items-center gap-2">
                <div className={`w-7 h-7 rounded border flex items-center justify-center shrink-0 ${getCategoryBg(category)}`}>
                  {getCategoryIcon(category)}
                </div>
                <span className="tracking-wide text-stone-800">{category}</span>
              </h4>
              <span className="text-xs font-medium text-stone-500 bg-stone-100/80 px-2.5 py-0.5 rounded-full border border-stone-200/40">
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
                    className={`group cursor-pointer flex items-center justify-between p-2.5 rounded border transition-all ${
                      checked 
                        ? "bg-[#faf9f6]/40 border-stone-150/50 opacity-50 hover:opacity-100" 
                        : "bg-white border-stone-200 hover:border-stone-400 shadow-sm"
                    }`}
                  >
                    <div className="flex-1 pr-2 flex flex-col text-left">
                      <span className={`text-sm font-bold transition-all leading-snug ${checked ? "text-stone-400 line-through font-medium" : "text-stone-800"}`}>
                        {item.name}
                      </span>
                      {dynamicDesc && (
                        <span className={`text-xs font-bold mt-1 transition-all flex items-center gap-1 ${
                          checked ? "text-stone-300 line-through" : "text-[#7f1d1d]/85"
                        }`}>
                          ⚖️ {dynamicDesc}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
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
                className="bg-[#7f1d1d] text-white p-1 rounded disabled:opacity-30 hover:bg-[#6b1812] active:scale-95 transition-all flex items-center justify-center shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
