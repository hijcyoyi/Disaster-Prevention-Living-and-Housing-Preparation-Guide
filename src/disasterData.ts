export interface EmergencyStep {
  id: string;
  text: string;
}

export interface EmergencyGuide {
  title: string;
  subtitle: string;
  color: string;
  badge: string;
  steps: EmergencyStep[];
}

export const EMERGENCY_GUIDES: Record<string, EmergencyGuide> = {
  earthquake: {
    title: '🌋 強烈有感地震：趴下、掩護、穩住！',
    subtitle: '就地避難與極限求生命令（適用５級強以上震度及頻繁餘震）',
    color: 'from-red-950 to-red-900 text-white border-red-750 hover:from-red-900 hover:to-red-800',
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
    color: 'from-blue-950 to-blue-900 text-white border-blue-750 hover:from-blue-900 hover:to-blue-800',
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
    color: 'from-emerald-950 to-emerald-900 text-white border-emerald-750 hover:from-emerald-900 hover:to-emerald-800',
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
    color: 'from-amber-950 to-amber-900 text-white border-amber-700 hover:from-amber-900 hover:to-amber-800',
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
    color: 'from-rose-950 to-rose-900 text-white border-rose-700 hover:from-rose-900 hover:to-rose-800',
    badge: '濃煙、火災、火場逃生避護',
    steps: [
      { id: 'fr_smoke', text: '【壓低身姿避濃煙】遇濃煙應採取低姿勢爬行，因空氣在地面附近（離地 30 公分以下）最乾淨，利用手肘與膝蓋前進。' },
      { id: 'fr_door', text: '【觸摸把手探火情】開門前先用手背觸摸金屬門把。若把手燙手，代表門外已有大火，此時絕對不要開門！' },
      { id: 'fr_seal', text: '【濕毛巾塞住門縫】若無法開門逃生，應將門鎖好，並用濕毛巾、衣物或膠帶塞住門縫與空隙，防止致命濃煙與毒氣滲入。' },
      { id: 'fr_window', text: '【退向窗邊揮舞呼救】關好門後，退向臨街或臨外之窗邊，撥打 119 通報自己受困位置，並揮舞手電筒或亮色衣物呼救。' }
    ]
  }
};

export interface ScenarioContent {
  title: string;
  icon: string;
  category: string;
  shortDesc: string;
  pwaReadyText: string;
  guidelines: {
    sectionTitle: string;
    items: { title: string; desc: string; targetId?: string }[];
  }[];
}

export const SCENARIO_DATA: Record<string, ScenarioContent> = {
  earthquake_securing: {
    title: '住宅防震安全固定',
    icon: '🏢',
    category: '住宅結構與家具加固',
    shortDesc: '高樓搖晃加劇！九成地震受傷來自大型家具傾倒砸傷。利用 L 型固定器與伸縮支撐桿，打造無感震室內。',
    pwaReadyText: '此單元已完整下載至您的瀏覽器快取中，若震後停電、斷網，您可以完全在離線狀態下依照此手冊加固家具。',
    guidelines: [
      {
        sectionTitle: '第一步：盤點高危險家具',
        items: [
          { title: '衣櫃、高鞋櫃 (高度 > 120cm)', desc: '特別加裝 L 型牆面鐵件固定或耐震伸縮桿防傾斜。' },
          { title: '電視、懸掛畫作或吊掛冷氣', desc: '採用耐震防滑貼片或雙孔防脫落掛鉤，電視背面使用防傾倒鋼索連接電視櫃。' },
          { title: '廚房玻璃餐具櫃', desc: '拉門一律加裝自動防墜安全扣（震動時自動鎖死上扣），防護玻璃餐具飛散。' }
        ]
      },
      {
        sectionTitle: '第二步：加固工具與安裝法門',
        items: [
          { title: 'L 型金屬固定件 (最推薦)', desc: '直接鎖入水泥牆柱與櫃體頂端，承受最大的剪力拉扯力道。' },
          { title: '頂天立地耐震伸縮桿', desc: '適用於無法鑽孔的租屋族。放置於櫃體頂部兩端，旋緊並加墊木片防滑，頂住天花板。' },
          { title: '安全防爆隔熱膜', desc: '在臥房落地窗或玄關大門玻璃處張貼，確保玻璃震碎時不飛濺割傷腳掌。' }
        ]
      }
    ]
  },
  water_outage: {
    title: '斷水斷電極限應變',
    icon: '⚡',
    category: '住宅備水與防災儲能',
    shortDesc: '災汛侵襲常伴隨數日斷電斷水。提前確認總配電盤、水塔儲水，並以每人三天 9 公升的水量盤點全家生命線。',
    pwaReadyText: '本救生卡已完整緩存，遭遇暴洪或供水線切斷時，一鍵點擊便能查看淨水法、保冷電力和安全配電切斷技巧。',
    guidelines: [
      {
        sectionTitle: '儲水備水策略 (每人 3L / 日)',
        items: [
          { title: '維生飲用水 (瓶裝水為主)', desc: '每人每天 3 公升為絕對底線。一個四口之家 3 天需儲備 36 公升的瓶裝水。' },
          { title: '生活次級用水 (洗滌、沖廁)', desc: '利用密封儲水桶、浴缸提前蓄水。嚴防斷水期馬桶反溢，建議加裝防逆流防溢閥。' }
        ]
      },
      {
        sectionTitle: '電力與能源自救法',
        items: [
          { title: '12V / 24V 車載應急快充與行動發電機', desc: '儲備大於 30000mAh 且支持 PD 快充之行動電源，保持手機通聯。' },
          { title: '冰箱保冷黃金 24 小時', desc: '停電後嚴禁頻繁開啟冰箱門！預先將冷凍庫塞滿結冰水，可維持冷藏室低溫長達 18-24 小時。' },
          { title: '總配電盤/斷路器一鍵切斷', desc: '一樓淹水前應迅速去配線盤拉下總開關，杜絕淹水導電使整棟房屋通電造成致命電擊。' }
        ]
      }
    ]
  },
  family_plan: {
    title: '家庭避難與約定計畫',
    icon: '👨‍👩‍👧‍👦',
    category: '聯絡平安與避難動線',
    shortDesc: '當通訊網路全數中斷時，您如何與分散的家人會合？事先約定緊急集合點與離線平安專線，是存活的最佳防護網。',
    pwaReadyText: '本章節支持全離線讀取，災時可隨時調閱家庭約定避難路線與 1991 互助留言碼，慌亂中指引全家人有序團聚。',
    guidelines: [
      {
        sectionTitle: '家庭緊急通訊計畫',
        items: [
          { title: '約定 1991 報平安留言板', desc: '約定好特定家長的手機號碼作為共同的平安留言板。斷網或塞車時直接撥 1991 互存留言。' },
          { title: '第一與第二集合點約定', desc: '第 1 集合點（住宅樓下大操場）、第 2 集合點（里鄰指定的防災避難公園），防止迷失。' }
        ]
      },
      {
        sectionTitle: '逃生出口與動線演練',
        items: [
          { title: '出入口與鞋履擺放原則', desc: '大門口鞋櫃旁必須常擺堅硬厚底工作鞋。玄關大門保持 100% 淨空，不可放置任何雜物自行卡死。' },
          { title: '高齡與嬰幼兒的撤離職責', desc: '明確指定由哪位大人負責抱走襁褓嬰兒，哪位大人負責帶領或背走高齡長輩，防止臨震手忙腳亂。' }
        ]
      }
    ]
  }
};
