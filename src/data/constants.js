// 游戏常量配置
export const REALMS = [
    '凡人',
    '炼气一层', '炼气二层', '炼气三层', '炼气四层', '炼气五层',
    '炼气六层', '炼气七层', '炼气八层', '炼气九层', '炼气大圆满',
    '筑基一层', '筑基二层', '筑基三层', '筑基四层', '筑基五层',
    '筑基六层', '筑基七层', '筑基八层', '筑基九层', '筑基大圆满',
    '金丹一层', '金丹二层', '金丹三层', '金丹四层', '金丹五层',
    '金丹六层', '金丹七层', '金丹八层', '金丹九层', '金丹大圆满',
    '元婴一层', '元婴二层', '元婴三层', '元婴四层', '元婴五层',
    '元婴六层', '元婴七层', '元婴八层', '元婴九层', '元婴大圆满',
    '化神一层', '化神二层', '化神三层', '化神四层', '化神五层',
    '化神六层', '化神七层', '化神八层', '化神九层', '化神大圆满'
];

export const TRAITS = [
    { name: '天生废柴', effect: '突破成功率-20%', type: 'negative' },
    { name: '剑心通明', effect: '攻击翻倍', type: 'positive' },
    { name: '天选之人', effect: '奇遇概率+50%', type: 'positive' },
    { name: '懒散', effect: '产出灵石-30%', type: 'negative' },
    { name: '根骨绝佳', effect: '修炼速度+40%', type: 'positive' },
    { name: '体弱多病', effect: '容易受伤', type: 'negative' },
    { name: '悟性超群', effect: '突破成功率+30%', type: 'positive' },
    { name: '福缘深厚', effect: '奇遇奖励翻倍', type: 'positive' },
    { name: '心魔缠身', effect: '容易走火入魔', type: 'negative' },
    { name: '丹毒缠身', effect: '修炼速度-20%', type: 'negative' },
    { name: '灵脉亲和', effect: '灵石产出+50%', type: 'positive' },
    { name: '杀伐果断', effect: '战斗威力+30%', type: 'positive' },
    { name: '仁心仁术', effect: '治疗能力+40%', type: 'positive' },
    { name: '贪婪', effect: '容易背叛', type: 'negative' },
    { name: '忠诚', effect: '永远不会背叛', type: 'positive' }
];

export const SPIRIT_ROOTS = ['金', '木', '水', '火', '土', '雷', '风', '冰', '光', '暗'];

export const PERSONALITIES = ['正直', '卑劣', '狂傲', '胆小', '温和', '残暴', '狡诈', '憨厚'];

export const SURNAMES = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗'];

export const NAMES = ['明', '华', '强', '芳', '军', '敏', '静', '丽', '勇', '艳', '杰', '涛', '鹏', '飞', '霞', '雪', '梅', '兰', '菊', '竹'];

export const APPEARANCES = [
    '面容清秀，眼神明亮',
    '身材高大，气宇轩昂',
    '容貌娇美，气质出众',
    '面容刚毅，眼神锐利',
    '身形瘦弱，但精神矍铄',
    '相貌平平，但目光坚定',
    '仙风道骨，超凡脱俗',
    '英气逼人，威风凛凛',
    '温文尔雅，书卷气息',
    '妖艳绝伦，魅惑众生'
];

export const TASK_TEMPLATES = [
    { 
        type: 'cultivation', 
        name: '灵石采集', 
        difficulty: 1, 
        description: '采集灵石为宗门积累资源',
        reward: { spiritStones: 25, experience: 40 },
        duration: 3000
    },
    { 
        type: 'cultivation', 
        name: '宗门守卫', 
        difficulty: 1, 
        description: '守护宗门安全',
        reward: { spiritStones: 20, experience: 35 },
        duration: 4000
    },
    { 
        type: 'adventure', 
        name: '野外历练', 
        difficulty: 2, 
        description: '在野外历练提升实力',
        reward: { experience: 60, breakthroughPills: 3, spiritStones: 15 },
        duration: 6000
    },
    { 
        type: 'adventure', 
        name: '秘境探索', 
        difficulty: 3, 
        description: '探索附近的小型秘境',
        reward: { spiritStones: 80, breakthroughPills: 5, experience: 80 },
        duration: 8000
    },
    { 
        type: 'social', 
        name: '宗门宣传', 
        difficulty: 1, 
        description: '宣传宗门招收新弟子',
        reward: { reputation: 30, experience: 25 },
        duration: 5000
    },
    { 
        type: 'social', 
        name: '外交任务', 
        difficulty: 2, 
        description: '与其他宗门进行外交活动',
        reward: { reputation: 50, spiritStones: 45, experience: 40 },
        duration: 7000
    },
    { 
        type: 'alchemy', 
        name: '炼丹协助', 
        difficulty: 2, 
        description: '协助炼制丹药',
        reward: { breakthroughPills: 4, experience: 50, spiritStones: 25 },
        duration: 6000
    },
    { 
        type: 'alchemy', 
        name: '药材收集', 
        difficulty: 1, 
        description: '收集炼丹所需的药材',
        reward: { breakthroughPills: 2, spiritStones: 30, experience: 30 },
        duration: 4000
    },
    { 
        type: 'combat', 
        name: '妖兽猎杀', 
        difficulty: 3, 
        description: '猎杀威胁宗门的妖兽',
        reward: { spiritStones: 120, experience: 100, breakthroughPills: 6 },
        duration: 10000
    },
    { 
        type: 'combat', 
        name: '护送任务', 
        difficulty: 2, 
        description: '护送重要人物安全到达目的地',
        reward: { spiritStones: 70, reputation: 40, experience: 60 },
        duration: 8000
    }
];

// 游戏配置
export const GAME_CONFIG = {
    AUTO_SAVE_INTERVAL: 30000, // 30秒自动保存
    DISCIPLE_EVENT_INTERVAL: 15000, // 15秒弟子事件
    AUTO_GAIN_INTERVAL: 1000, // 1秒自动增益
    INITIAL_SPIRIT_STONES: 10,
    RECRUIT_COST: 10,
    BREAKTHROUGH_BASE_COST: 50,
    AUTO_GAIN_PER_DISCIPLE: 0.1,
    MAX_DISCIPLES: 50,
    TASK_SUCCESS_BASE_RATE: 0.7
};

// 建筑配置
export const BUILDINGS = {
    trainingGround: {
        name: '练功场',
        cost: 100,
        effect: '弟子修炼速度+20%',
        maxLevel: 5
    },
    alchemyRoom: {
        name: '炼丹房',
        cost: 200,
        effect: '破境丹产出+30%',
        maxLevel: 5
    },
    spiritMine: {
        name: '灵石矿',
        cost: 150,
        effect: '灵石产出+40%',
        maxLevel: 5
    },
    library: {
        name: '藏书阁',
        cost: 120,
        effect: '弟子突破成功率+15%',
        maxLevel: 5
    },
    defenseTower: {
        name: '防御塔',
        cost: 180,
        effect: '宗门防御力+25%',
        maxLevel: 5
    }
};

// 宗门风格加成
export const SECT_STYLE_BONUSES = {
    '剑修': { combat: 1.3, cultivation: 1.0, alchemy: 0.9 },
    '法修': { combat: 1.1, cultivation: 1.2, alchemy: 1.0 },
    '魔道': { combat: 1.4, cultivation: 1.1, alchemy: 0.8 },
    '长生': { combat: 0.8, cultivation: 1.4, alchemy: 1.2 },
    '刀修': { combat: 1.35, cultivation: 0.95, alchemy: 0.85 },
    '符修': { combat: 1.0, cultivation: 1.1, alchemy: 1.3 },
    '丹修': { combat: 0.7, cultivation: 1.0, alchemy: 1.5 },
    '阵修': { combat: 1.2, cultivation: 1.1, alchemy: 1.0 },
    '邪修': { combat: 1.25, cultivation: 1.15, alchemy: 0.9 },
    '劫修': { combat: 1.45, cultivation: 0.9, alchemy: 0.7 },
    '采补': { combat: 0.9, cultivation: 1.3, alchemy: 1.1 }
};

// 坊市商品配置
export const MARKET_ITEMS = [
    // 基础物品
    { name: '下品灵石', type: 'resource', basePrice: 1, rarity: 'common', description: '最基础的修炼资源' },
    { name: '中品灵石', type: 'resource', basePrice: 10, rarity: 'uncommon', description: '品质较好的灵石' },
    { name: '上品灵石', type: 'resource', basePrice: 100, rarity: 'rare', description: '高品质灵石，修炼效果极佳' },
    
    // 丹药
    { name: '回血丹', type: 'pill', basePrice: 5, rarity: 'common', description: '快速恢复伤势' },
    { name: '聚气丹', type: 'pill', basePrice: 15, rarity: 'uncommon', description: '短时间内提升修炼效率' },
    { name: '破障丹', type: 'pill', basePrice: 50, rarity: 'rare', description: '增加突破成功率' },
    { name: '筑基丹', type: 'pill', basePrice: 200, rarity: 'epic', description: '筑基期必备丹药' },
    
    // 法器
    { name: '木剑', type: 'weapon', basePrice: 8, rarity: 'common', description: '新手修士的基础武器' },
    { name: '铁剑', type: 'weapon', basePrice: 25, rarity: 'uncommon', description: '坚固的铁制长剑' },
    { name: '灵剑', type: 'weapon', basePrice: 80, rarity: 'rare', description: '蕴含灵气的法剑' },
    { name: '飞剑', type: 'weapon', basePrice: 300, rarity: 'epic', description: '可御使飞行的高级法器' },
    
    // 防具
    { name: '布衣', type: 'armor', basePrice: 5, rarity: 'common', description: '简单的防护衣物' },
    { name: '皮甲', type: 'armor', basePrice: 20, rarity: 'uncommon', description: '兽皮制成的护甲' },
    { name: '法袍', type: 'armor', basePrice: 60, rarity: 'rare', description: '蕴含法力的道袍' },
    { name: '护身符', type: 'talisman', basePrice: 40, rarity: 'rare', description: '可抵挡一次致命攻击' },
    
    // 功法秘籍
    { name: '基础剑诀', type: 'manual', basePrice: 30, rarity: 'uncommon', description: '入门级剑法秘籍' },
    { name: '炼气心得', type: 'manual', basePrice: 50, rarity: 'rare', description: '前人炼气经验总结' },
    { name: '筑基要诀', type: 'manual', basePrice: 150, rarity: 'epic', description: '筑基期的修炼指南' },
    { name: '丹方残卷', type: 'manual', basePrice: 100, rarity: 'rare', description: '记录了某种丹药的炼制方法' },
    
    // 特殊物品
    { name: '灵兽蛋', type: 'special', basePrice: 120, rarity: 'epic', description: '神秘的兽蛋，可能孵化出灵兽' },
    { name: '古玉', type: 'special', basePrice: 80, rarity: 'rare', description: '蕴含神秘力量的古玉' },
    { name: '地图残片', type: 'special', basePrice: 60, rarity: 'rare', description: '可能指向某个秘境的地图' },
    { name: '天机符', type: 'special', basePrice: 200, rarity: 'epic', description: '可占卜吉凶的法符' },
    
    // 垃圾物品（增加趣味性）
    { name: '破碗', type: 'junk', basePrice: 1, rarity: 'junk', description: '一个破了的碗，好像没什么用' },
    { name: '石头', type: 'junk', basePrice: 1, rarity: 'junk', description: '普通的石头' },
    { name: '树枝', type: 'junk', basePrice: 1, rarity: 'junk', description: '一根干枯的树枝' },
    { name: '废纸', type: 'junk', basePrice: 1, rarity: 'junk', description: '写了些奇怪符号的废纸' }
];

// 拍卖会配置
export const AUCTION_CONFIG = {
    MIN_BID_INCREMENT: 5, // 最小加价幅度
    AUCTION_DURATION: 30000, // 拍卖持续时间（毫秒）
    EXTENSION_TIME: 10000, // 最后加价延长的时间
    START_ITEMS: 3, // 初始拍卖物品数量
MAX_ITEMS: 6, // 最大拍卖物品数量
    
    // NPC竞拍者名字池
    NPC_BIDDERS: [
        '青云剑仙', '紫霞真人', '玄机子', '丹心道人', '飞羽仙子',
        '天机老人', '无极剑尊', '碧霄仙子', '金丹大师', '元婴真君',
        '白云剑客', '红尘炼心士', '逍遥散人', '寒月仙子', '烈火真君',
        '清风道长', '明月师太', '雷震子', '冰心仙子', '土行孙'
    ],
    
    // NPC竞拍策略
    NPC_BIDDING_STRATEGIES: {
        aggressive: { // 激进型：喜欢高价竞拍稀有物品
            chance: 0.3,
            minBidMultiplier: 1.5,
            maxBidMultiplier: 3.0,
            preferredRarity: ['legendary', 'epic']
        },
        moderate: { // 温和型：理性出价，考虑性价比
            chance: 0.4,
            minBidMultiplier: 1.0,
            maxBidMultiplier: 2.0,
            preferredRarity: ['epic', 'rare']
        },
        conservative: { // 保守型：只拍便宜的常见物品
            chance: 0.3,
            minBidMultiplier: 0.8,
            maxBidMultiplier: 1.5,
            preferredRarity: ['rare', 'uncommon']
        }
    }
};

export const INVASION_CONFIG = {
    BASE_COOLDOWN: 60000, // 1分钟基础冷却时间（从5分钟调整为1分钟）
    MIN_REPUTATION: 20, // 最小声望要求（从50调整为20）
    SUCCESS_REWARD: {
        reputation: [15, 35], // 声望奖励范围
        spiritStones: [80, 200] // 灵石奖励范围
    },
    FAILURE_PENALTY: {
        reputation: [8, 20], // 声望损失范围
        spiritStones: [40, 100] // 灵石损失范围
    }
};

export const INVADING_SECTS = [
    {
        name: "青云剑宗",
        strength: 0.6, // 相对强度
        description: "以剑术闻名的中等宗门",
        specialty: "剑术"
    },
    {
        name: "丹霞谷",
        strength: 0.5,
        description: "擅长炼丹的和平宗门",
        specialty: "炼丹"
    },
    {
        name: "玄机门",
        strength: 0.7,
        description: "精通阵法的神秘宗门",
        specialty: "阵法"
    },
    {
        name: "天魔教",
        strength: 0.8,
        description: "行事邪魔的强大宗门",
        specialty: "魔功"
    },
    {
        name: "万兽山庄",
        strength: 0.6,
        description: "驯养灵兽的独特宗门",
        specialty: "驭兽"
    },
    {
        name: "散修联盟",
        strength: 0.4,
        description: "松散的修士组织",
        specialty: "杂学"
    }
];

export const SECT_UPGRADE_REQUIREMENTS = {
    1: { reputation: 0, disciples: 0 }, // 初始
    2: { reputation: 50, disciples: 2 }, // 解锁功法堂（从100调整为50）
    3: { reputation: 200, disciples: 5 }, // 解锁炼丹房（从500调整为200）
    4: { reputation: 600, disciples: 10 }, // 解锁炼器房（从1500调整为600）
    5: { reputation: 1500, disciples: 25 } // 解锁传功殿（从5000调整为1500）
};

// 组织架构配置
export const SECT_ORGANIZATION = {
    MORTAL: {
        name: '杂役弟子',
        rank: 0,
        color: 'text-gray-400',
        description: '负责宗门杂务，无修炼资源',
        benefits: { cultivationBonus: 0.5, loyaltyBonus: 0.8 }
    },
    OUTER: {
        name: '外门弟子',
        rank: 1,
        color: 'text-green-400',
        description: '宗门外围成员，基础修炼资源',
        benefits: { cultivationBonus: 0.8, loyaltyBonus: 1.0 }
    },
    INNER: {
        name: '内门弟子',
        rank: 2,
        color: 'text-blue-400',
        description: '宗门核心成员，优质修炼资源',
        benefits: { cultivationBonus: 1.2, loyaltyBonus: 1.2 }
    },
    ELITE: {
        name: '精英弟子',
        rank: 3,
        color: 'text-purple-400',
        description: '宗门精英，顶级修炼资源',
        benefits: { cultivationBonus: 1.5, loyaltyBonus: 1.5 }
    },
    ELDER: {
        name: '长老',
        rank: 4,
        color: 'text-yellow-400',
        description: '宗门长老，管理宗门事务',
        benefits: { cultivationBonus: 1.3, loyaltyBonus: 2.0 }
    }
};

// 邪道任务配置
export const EVIL_TASKS = [
    {
        type: 'assassination',
        name: '暗杀敌对修士',
        description: '潜入敌对宗门，暗杀关键人物',
        difficulty: 'hard',
        duration: 86400000, // 24小时
        rewards: {
            reputation: [-30, -10], // 降低声望
            spiritStones: [200, 500],
            evilKarma: [20, 40]
        },
        penalties: {
            disciples: 1,
            reputation: -20
        }
    },
    {
        type: 'soul_extraction',
        name: '炼魂夺魄',
        description: '捕获修士，抽取灵魂修炼',
        difficulty: 'extreme',
        duration: 172800000, // 48小时
        rewards: {
            reputation: [-50, -20],
            breakthroughPills: 3,
            evilKarma: [40, 60]
        },
        penalties: {
            disciples: 2,
            reputation: -30
        }
    },
    {
        type: 'blood_cultivation',
        name: '血祭修炼',
        description: '用生灵鲜血进行血祭，快速提升修为',
        difficulty: 'medium',
        duration: 43200000, // 12小时
        rewards: {
            reputation: [-20, -5],
            experience: 50,
            evilKarma: [15, 25]
        },
        penalties: {
            reputation: -15,
            disciples: 1
        }
    },
    {
        type: 'demon_pact',
        name: '与魔结盟',
        description: '与魔道势力达成协议，获得魔功传承',
        difficulty: 'hard',
        duration: 86400000, // 24小时
        rewards: {
            reputation: [-40, -15],
            technique: 'demon_art',
            evilKarma: [30, 50]
        },
        penalties: {
            reputation: -25,
            disciples: 1
        }
    },
    {
        type: 'sect_sabotage',
        name: '破坏敌对宗门',
        description: '潜入敌对宗门，破坏其修炼资源',
        difficulty: 'medium',
        duration: 43200000, // 12小时
        rewards: {
            reputation: [-15, -5],
            spiritStones: [150, 300],
            evilKarma: [10, 20]
        },
        penalties: {
            reputation: -10
        }
    }
];

// 魔功配置
export const DEMON_ARTS = [
    {
        name: '血神经',
        description: '以血炼气，杀戮越强修为越快',
        type: 'cultivation',
        power: 1.5,
        evilKarmaCost: 50,
        sideEffect: 'increased_aggression'
    },
    {
        name: '夺魂大法',
        description: '抽取他人灵魂补充自身',
        type: 'combat',
        power: 2.0,
        evilKarmaCost: 80,
        sideEffect: 'soul_instability'
    },
    {
        name: '万毒心经',
        description: '修炼万种剧毒，以毒攻毒',
        type: 'defense',
        power: 1.3,
        evilKarmaCost: 40,
        sideEffect: 'poison_resistance'
    },
    {
        name: '白骨魔功',
        description: '炼化白骨为力量，不死不灭',
        type: 'regeneration',
        power: 1.8,
        evilKarmaCost: 100,
        sideEffect: 'undead_traits'
    }
];

// 弟子冲突事件
export const DISCIPLE_CONFLICTS = [
    {
        type: 'bullying',
        name: '霸凌事件',
        description: '高等级弟子欺负低等级弟子',
        triggerChance: 0.1,
        effects: {
            victim: { loyalty: -10, injured: 0.3 },
            bully: { loyalty: 5 }
        }
    },
    {
        type: 'challenge',
        name: '挑衅挑战',
        description: '弟子之间发生争执，要求比试',
        triggerChance: 0.08,
        effects: {
            winner: { loyalty: 10, cultivation: 5 },
            loser: { loyalty: -5, injured: 0.5 }
        }
    },
    {
        type: 'flirt',
        name: '勾搭事件',
        description: '弟子之间产生情愫，暗中往来',
        triggerChance: 0.12,
        effects: {
            participants: { loyalty: 15, cultivation: 3 }
        }
    },
    {
        type: 'sabotage',
        name: '暗中破坏',
        description: '弟子暗中破坏竞争对手的修炼',
        triggerChance: 0.05,
        effects: {
            victim: { loyalty: -15, injured: 0.4 },
            saboteur: { loyalty: -20 }
        }
    },
    {
        type: 'alliance',
        name: '结成联盟',
        description: '弟子之间结成小团体，互相扶持',
        triggerChance: 0.15,
        effects: {
            members: { loyalty: 8, cultivation: 2 }
        }
    }
];

// 好感度系统配置
export const AFFECTION_CONFIG = {
    MAX_AFFECTION: 100,
    INITIAL_AFFECTION: 20,
    
    // 好感度等级
    LEVELS: {
        0: { name: '陌生人', color: 'text-gray-400', description: '刚认识的弟子' },
        20: { name: '熟悉', color: 'text-blue-400', description: '开始熟悉的老祖' },
        40: { name: '友好', color: 'text-green-400', description: '对老祖有好感' },
        60: { name: '亲近', color: 'text-yellow-400', description: '与老祖关系亲近' },
        80: { name: '倾心', color: 'text-pink-400', description: '对老祖心生爱慕' },
        100: { name: '深爱', color: 'text-red-400', description: '深深爱着老祖' }
    },
    
    // 好感度增加方式
    INTERACTIONS: {
        chat: { min: 1, max: 3, description: '聊天' },
        gift: { min: 5, max: 10, description: '送礼' },
        praise: { min: 2, max: 5, description: '夸奖' },
        help: { min: 3, max: 8, description: '帮助修炼' },
        breakthrough: { min: 10, max: 15, description: '帮助突破' }
    },
    
    // 礼物配置
    GIFTS: [
        { name: '灵花', type: 'flower', affection: 5, cost: 10, description: '美丽的灵花，能让人心情愉悦' },
        { name: '灵果', type: 'fruit', affection: 8, cost: 20, description: '蕴含灵气的果实，有益修炼' },
        { name: '灵茶', type: 'tea', affection: 6, cost: 15, description: '清香灵茶，可静心凝神' },
        { name: '灵玉', type: 'jade', affection: 12, cost: 50, description: '温润灵玉，蕴含天地灵气' },
        { name: '丹药', type: 'pill', affection: 15, cost: 80, description: '修炼丹药，弟子最爱' },
        { name: '法器', type: 'weapon', affection: 20, cost: 150, description: '精良法器，实用珍贵' },
        { name: '功法秘籍', type: 'manual', affection: 25, cost: 200, description: '珍贵功法，修炼必备' }
    ]
};

// AI对话系统配置
export const AI_CONFIG = {
    // 弟子性格类型
    PERSONALITIES: {
        gentle: {
            name: '温柔型',
            traits: ['善良', '体贴', '温柔', '细心'],
            speechStyle: '温和谦逊',
            responsePattern: '总是关心老祖，话语温柔'
        },
        proud: {
            name: '高傲型',
            traits: ['骄傲', '自信', '强势', '独立'],
            speechStyle: '自信强势',
            responsePattern: '说话直接，有自己的主见'
        },
        shy: {
            name: '害羞型',
            traits: ['内向', '害羞', '敏感', '纯真'],
            speechStyle: '羞涩内向',
            responsePattern: '说话轻声细语，容易脸红'
        },
        lively: {
            name: '活泼型',
            traits: ['开朗', '活泼', '好奇', '热情'],
            speechStyle: '热情开朗',
            responsePattern: '话多，喜欢和老祖分享'
        },
        cold: {
            name: '冷漠型',
            traits: ['冷漠', '理性', '独立', '神秘'],
            speechStyle: '冷淡简洁',
            responsePattern: '话少，但内心关心老祖'
        },
        cunning: {
            name: '狡黠型',
            traits: ['聪明', '狡黠', '机智', '调皮'],
            speechStyle: '机智幽默',
            responsePattern: '喜欢开玩笑，偶尔调皮'
        }
    },
    
    // 对话主题
    TOPICS: {
        cultivation: '修炼',
        daily: '日常',
        feelings: '感情',
        sect: '宗门',
        future: '未来',
        past: '往事',
        dreams: '梦想',
        worries: '烦恼'
    },
    
    // 回复模板
    RESPONSE_TEMPLATES: {
        greeting: [
            '老祖，您来了！{emotion}',
            '老祖好！{emotion}',
            '见到老祖真开心！{emotion}',
            '老祖，弟子在此等候多时了。{emotion}'
        ],
        farewell: [
            '老祖慢走，弟子会想您的。{emotion}',
            '老祖再见！{emotion}',
            '期待下次与老祖相见。{emotion}',
            '老祖保重身体！{emotion}'
        ],
        thanks: [
            '谢谢老祖！弟子感激不尽。{emotion}',
            '老祖对弟子太好了！{emotion}',
            '弟子不知该如何报答老祖的恩情。{emotion}',
            '有老祖这样的师父，真是弟子的福气。{emotion}'
        ]
    }
};

// 稀有度配置
export const RARITY_CONFIG = {
    junk: { color: 'text-gray-400', name: '垃圾', chance: 0.3 },
    common: { color: 'text-white', name: '普通', chance: 0.35 },
    uncommon: { color: 'text-green-400', name: '精良', chance: 0.2 },
    rare: { color: 'text-blue-400', name: '稀有', chance: 0.1 },
    epic: { color: 'text-purple-400', name: '史诗', chance: 0.05 }
};

// 特殊体质配置
export const SPECIAL_CONSTITUTIONS = [
    { name: '凡体', rarity: 'common', description: '普通人的体质，无特殊效果', combat: 1.0, cultivation: 1.0 },
    { name: '灵体', rarity: 'uncommon', description: '天生亲近灵气，修炼速度大幅提升', combat: 1.1, cultivation: 1.6 },
    { name: '剑体', rarity: 'uncommon', description: '天生适合剑道，剑法威力提升', combat: 1.4, cultivation: 1.2 },
    { name: '丹体', rarity: 'uncommon', description: '炼丹天赋异禀，丹药效果提升', combat: 0.9, cultivation: 1.4 },
    { name: '雷体', rarity: 'rare', description: '掌控雷电之力，雷系功法威力大增', combat: 1.5, cultivation: 1.3 },
    { name: '冰体', rarity: 'rare', description: '寒冰体质，冰系功法效果翻倍', combat: 1.4, cultivation: 1.3 },
    { name: '火体', rarity: 'rare', description: '纯阳之体，火系功法威力惊人', combat: 1.4, cultivation: 1.3 },
    { name: '毒体', rarity: 'rare', description: '万毒不侵，毒系功法威力大增', combat: 1.3, cultivation: 1.2 },
    { name: '战体', rarity: 'epic', description: '为战斗而生，战斗力极其恐怖', combat: 1.8, cultivation: 1.1 },
    { name: '道体', rarity: 'epic', description: '先天道体，修炼速度极快', combat: 1.3, cultivation: 2.0 },
    { name: '圣体', rarity: 'epic', description: '万古罕见的圣人之体', combat: 1.6, cultivation: 1.8 },
    { name: '仙体', rarity: 'legendary', description: '传说中的仙人体质', combat: 2.0, cultivation: 2.2 }
];

// 家世背景配置
export const FAMILY_BACKGROUNDS = [
    { name: '凡人', rarity: 'common', description: '普通农家出身', bonus: { spiritStones: 0, reputation: 0 } },
    { name: '商贾', rarity: 'common', description: '商人家庭，有些积蓄', bonus: { spiritStones: 5, reputation: 0 } },
    { name: '书香', rarity: 'common', description: '读书人家庭，知书达理', bonus: { spiritStones: 0, reputation: 1 } },
    { name: '武馆', rarity: 'uncommon', description: '武馆弟子，基础扎实', bonus: { spiritStones: 0, reputation: 2 } },
    { name: '药铺', rarity: 'uncommon', description: '药铺学徒，懂些医术', bonus: { spiritStones: 3, reputation: 1 } },
    { name: '铁匠', rarity: 'uncommon', description: '铁匠之子，体格强壮', bonus: { spiritStones: 0, reputation: 1 } },
    { name: '官宦', rarity: 'rare', description: '官宦之家，有些背景', bonus: { spiritStones: 10, reputation: 5 } },
    { name: '修仙世家', rarity: 'rare', description: '小修仙家族出身', bonus: { spiritStones: 15, reputation: 3 } },
    { name: '贵族', rarity: 'epic', description: '贵族后裔，地位尊贵', bonus: { spiritStones: 20, reputation: 10 } },
    { name: '皇族', rarity: 'legendary', description: '皇室血脉，身份显赫', bonus: { spiritStones: 50, reputation: 20 } }
];

// 宗门影响力等级
export const INFLUENCE_LEVELS = [
    { level: 1, name: '无名小派', description: '刚刚建立，无人知晓', reputation: 0, maxDisciples: 10 },
    { level: 2, name: '乡野小宗', description: '在附近小有名气', reputation: 100, maxDisciples: 20 },
    { level: 3, name: '地方宗门', description: '在县城有一定地位', reputation: 500, maxDisciples: 50 },
    { level: 4, name: '郡县大派', description: '在郡县颇有影响力', reputation: 2000, maxDisciples: 100 },
    { level: 5, name: '州府名门', description: '在整个州府都很有名', reputation: 10000, maxDisciples: 200 },
    { level: 6, name: '一方霸主', description: '掌控一方势力', reputation: 50000, maxDisciples: 500 },
    { level: 7, name: '修仙圣地', description: '修士向往的圣地', reputation: 200000, maxDisciples: 1000 },
    { level: 8, name: '天下大派', description: '威震天下的大宗门', reputation: 1000000, maxDisciples: 5000 },
    { level: 9, name: '仙门至尊', description: '修仙界的至尊存在', reputation: 5000000, maxDisciples: 10000 }
];

// 势力类型
export const FACTION_TYPES = {
    SECT: '宗门',
    GOVERNMENT: '官府', 
    ORGANIZATION: '组织',
    SECRET_REALM: '秘境',
    ANCIENT_RUIN: '古迹',
    DANGER_ZONE: '险地'
};

// 地区配置
export const REGION_CONFIG = {
    // 宗门类型
    SECT_NAMES: ['青云门', '紫霞派', '天剑宗', '玄火门', '冰霜宫', '雷音寺', '丹鼎阁', '万兽山庄'],
    
    // 官府类型
    GOVERNMENT_NAMES: ['镇魔司', '修仙联盟', '州府衙门', '县城衙门', '仙卫府', '监察司'],
    
    // 组织类型
    ORGANIZATION_NAMES: ['商会', '杀手组织', '情报网', '佣兵团', '炼丹师公会', '炼器师协会'],
    
    // 秘境类型
    SECRET_REALM_NAMES: ['古修士洞府', '上古战场', '灵脉矿洞', '妖兽森林', '雷击峡谷', '万毒沼泽'],
    
    // 古迹类型
    ANCIENT_RUIN_NAMES: ['仙帝遗迹', '神魔战场', '太古神山', '星空古路', '轮回之地', '九幽深渊'],
    
    // 险地类型
    DANGER_ZONE_NAMES: ['万妖谷', '死亡沙漠', '无尽海', '九幽之地', '血色平原', '诅咒之地']
};

// 拜访事件配置
export const VISIT_EVENTS = [
    {
        type: 'tribute',
        name: '上贡',
        description: '向强大宗门进贡，获得庇护',
        cost: { spiritStones: 50, reputation: 10 },
        reward: { reputation: 20, protection: true },
        chance: 0.3
    },
    {
        type: 'work',
        name: '派遣弟子',
        description: '派遣弟子去其他宗门干活，获得报酬',
        cost: { disciples: 1 },
        reward: { spiritStones: 100, experience: 50 },
        chance: 0.4
    },
    {
        type: 'trade',
        name: '贸易往来',
        description: '与其他势力进行贸易',
        cost: { spiritStones: 30 },
        reward: { spiritStones: 40, items: true },
        chance: 0.2
    },
    {
        type: 'alliance',
        name: '结盟',
        description: '尝试与其他势力结盟',
        cost: { reputation: 50 },
        reward: { alliance: true, reputation: 30 },
        chance: 0.1
    }
];

// 集体事件配置
export const COLLECTIVE_EVENTS = [
    {
        name: '妖兽袭击',
        description: '附近出现妖兽袭击村庄',
        type: 'crisis',
        difficulty: 'easy',
        reward: { reputation: 20, spiritStones: 30 },
        penalty: { reputation: -10, disciples: 1 }
    },
    {
        name: '灵脉发现',
        description: '附近发现了新的灵脉',
        type: 'opportunity',
        difficulty: 'medium',
        reward: { spiritStones: 200, breakthroughPills: 2 },
        penalty: {}
    },
    {
        name: '修仙大会',
        description: '附近举办修仙大会',
        type: 'event',
        difficulty: 'medium',
        reward: { reputation: 50, experience: 100 },
        penalty: {}
    },
    {
        name: '魔修作乱',
        description: '魔修在附近作乱，需要镇压',
        type: 'crisis',
        difficulty: 'hard',
        reward: { reputation: 100, spiritStones: 150 },
        penalty: { reputation: -30, disciples: 2 }
    },
    {
        name: '上古遗迹开启',
        description: '附近的上古遗迹开启',
        type: 'opportunity',
        difficulty: 'hard',
        reward: { items: 'epic', experience: 200 },
        penalty: { disciples: 1 }
    }
];

// 导入命格系统
export { DESTINIES } from './destinies.js';
