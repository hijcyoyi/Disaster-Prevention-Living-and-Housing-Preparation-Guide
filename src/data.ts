import { SupplyItem } from './types';

export const defaultSupplies: SupplyItem[] = [
  // 糧食飲水
  { id: '1', category: '糧食飲水', name: '隨身瓶裝水 (避難包必備)', hasIt: false, urgency: 'immediate' },
  { id: '2', category: '糧食飲水', name: '大容量飲用水 (居家儲置 3天份以上)', hasIt: false, urgency: 'routine' },
  { id: '3', category: '糧食飲水', name: '高熱量隨身防災食品 (能量棒、堅果、營養口糧)', hasIt: false, urgency: 'immediate' },
  { id: '4', category: '糧食飲水', name: '居家耐儲主食與罐頭 (無須加熱即可食用食品)', hasIt: false, urgency: 'routine' },
  
  // 保暖禦寒
  { id: '5', category: '保暖禦寒', name: '輕便雨衣 (防風防雨隨身攜帶)', hasIt: false, urgency: 'immediate' },
  { id: '6', category: '保暖禦寒', name: '保暖外套 (防失溫隨身攜帶)', hasIt: false, urgency: 'immediate' },
  { id: '7', category: '保暖禦寒', name: '隨身蓄熱暖暖包', hasIt: false, urgency: 'immediate' },
  { id: '8', category: '保暖禦寒', name: '家庭備用毛毯與防寒睡袋', hasIt: false, urgency: 'routine' },
  { id: '9', category: '保暖禦寒', name: '乾爽換穿厚襪 (預防濕底失溫)', hasIt: false, urgency: 'routine' },
  
  // 醫療急救
  { id: '10', category: '醫療急救', name: '個人三天份常備藥/慢性病處方藥 (防水密隨身袋)', hasIt: false, urgency: 'immediate' },
  { id: '11', category: '醫療急救', name: '隨身基礎急救包 (OK繃、酒精棉片、透氣膠帶)', hasIt: false, urgency: 'immediate' },
  { id: '12', category: '醫療急救', name: '優碘或強效消毒軟膏', hasIt: false, urgency: 'immediate' },
  { id: '13', category: '醫療急救', name: '大卷繃帶與醫用無菌紗布', hasIt: false, urgency: 'routine' },
  { id: '14', category: '醫療急救', name: '生理食鹽水 (傷口沖洗清洗用)', hasIt: false, urgency: 'routine' },
  { id: '15', category: '醫療急救', name: '滅菌棉花棒與常規剪刀', hasIt: false, urgency: 'routine' },
  
  // 重要物品
  { id: '16', category: '重要物品', name: '重要身分證/健保卡影本 (置入防水密袋隨身)', hasIt: false, urgency: 'immediate' },
  { id: '17', category: '重要物品', name: '小額現金與零錢 (避開停電/斷網投幣使用，隨行攜帶)', hasIt: false, urgency: 'immediate' },
  { id: '18', category: '重要物品', name: '存摺或產權證明影本 (儲置於安全固定處防洪)', hasIt: false, urgency: 'routine' },
  
  // 求生工具
  { id: '19', category: '求生工具', name: '高亮度 LED 手電筒/頭燈', hasIt: false, urgency: 'immediate' },
  { id: '20', category: '求生工具', name: '適配備用全新乾電池', hasIt: false, urgency: 'immediate' },
  { id: '21', category: '求生工具', name: '高頻求救哨 (懸掛於隨身避難包外側)', hasIt: false, urgency: 'immediate' },
  { id: '22', category: '求生工具', name: '防風打火機或防災火柴', hasIt: false, urgency: 'immediate' },
  { id: '23', category: '求生工具', name: '多功能瑞士刀/工具鉗 (居家應急排除硬體)', hasIt: false, urgency: 'routine' },
  
  // 其他備品
  { id: '24', category: '其他備品', name: '充飽電行動電源與高壽命充電線 (手機續航關鍵)', hasIt: false, urgency: 'immediate' },
  { id: '25', category: '其他備品', name: '隨身防護口罩 (防塵防煙防病毒)', hasIt: false, urgency: 'immediate' },
  { id: '26', category: '其他備品', name: '隨攜包裝衛生紙與手部消毒酒精', hasIt: false, urgency: 'immediate' },
  { id: '27', category: '其他備品', name: '高濕度厚款潔膚擦拭巾 (居家不便斷水期清潔)', hasIt: false, urgency: 'routine' },
];
