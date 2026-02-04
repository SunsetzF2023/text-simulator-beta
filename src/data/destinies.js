// 命格系统配置 - 参考鬼谷八荒
export const DESTINIES = {
    // 正向命格 (20个)
    positive: [
        {
            name: '天命之子',
            description: '天生福运加身，奇遇概率大幅提升',
            rarity: 'legendary',
            effects: {
                adventureChance: 0.5,
                adventureReward: 2.0,
                cultivation: 1.3,
                combat: 1.2
            }
        },
        {
            name: '修炼奇才',
            description: '修炼速度极快，突破成功率提升',
            rarity: 'epic',
            effects: {
                cultivation: 1.8,
                breakthroughSuccess: 1.4,
                combat: 1.0
            }
        },
        {
            name: '战斗狂人',
            description: '为战斗而生，战斗力极其恐怖',
            rarity: 'epic',
            effects: {
                combat: 2.0,
                taskSuccess: 1.3,
                cultivation: 0.8
            }
        },
        {
            name: '福星高照',
            description: '福缘深厚，总能化险为夷',
            rarity: 'rare',
            effects: {
                adventureReward: 1.8,
                injuryChance: 0.5,
                taskSuccess: 1.2
            }
        },
        {
            name: '丹青妙手',
            description: '炼丹天赋异禀，丹药效果翻倍',
            rarity: 'rare',
            effects: {
                pillEffect: 2.0,
                cultivation: 1.2,
                healing: 1.5
            }
        },
        {
            name: '剑心通明',
            description: '剑道天赋极高，剑法威力大增',
            rarity: 'rare',
            effects: {
                combat: 1.6,
                swordTechnique: 2.0,
                cultivation: 1.1
            }
        },
        {
            name: '灵脉亲和',
            description: '天生亲近灵气，灵石产出增加',
            rarity: 'uncommon',
            effects: {
                spiritStoneOutput: 1.8,
                cultivation: 1.3,
                combat: 1.0
            }
        },
        {
            name: '悟性超群',
            description: '悟性极高，学习速度飞快',
            rarity: 'uncommon',
            effects: {
                cultivation: 1.5,
                breakthroughSuccess: 1.3,
                taskSuccess: 1.2
            }
        },
        {
            name: '体魄强健',
            description: '体格强壮，不易受伤',
            rarity: 'uncommon',
            effects: {
                combat: 1.3,
                injuryChance: 0.3,
                cultivation: 1.1
            }
        },
        {
            name: '仁心仁术',
            description: '心地善良，治疗能力出众',
            rarity: 'uncommon',
            effects: {
                healing: 2.0,
                relationship: 1.3,
                combat: 0.9
            }
        },
        {
            name: '商业奇才',
            description: '经商天赋出众，交易收益增加',
            rarity: 'uncommon',
            effects: {
                tradeProfit: 1.5,
                marketDiscount: 0.8,
                spiritStoneOutput: 1.2
            }
        },
        {
            name: '社交达人',
            description: '善于交际，人际关系极佳',
            rarity: 'common',
            effects: {
                relationship: 1.5,
                loyalty: 1.2,
                taskSuccess: 1.1
            }
        },
        {
            name: '勤修苦练',
            description: '勤奋刻苦，修炼效率提升',
            rarity: 'common',
            effects: {
                cultivation: 1.3,
                taskSuccess: 1.2,
                combat: 1.0
            }
        },
        {
            name: '心志坚定',
            description: '意志坚定，不易走火入魔',
            rarity: 'common',
            effects: {
                breakthroughSuccess: 1.2,
                cultivation: 1.1,
                injuryChance: 0.7
            }
        },
        {
            name: '机缘巧合',
            description: '总能遇到好机会',
            rarity: 'common',
            effects: {
                adventureChance: 1.3,
                taskReward: 1.2,
                cultivation: 1.0
            }
        },
        {
            name: '根骨不凡',
            description: '根骨出众，修炼速度较快',
            rarity: 'common',
            effects: {
                cultivation: 1.2,
                combat: 1.1,
                breakthroughSuccess: 1.1
            }
        },
        {
            name: '气运加身',
            description: '运气不错，小概率遇到好事',
            rarity: 'common',
            effects: {
                adventureChance: 1.2,
                injuryChance: 0.8,
                taskSuccess: 1.1
            }
        },
        {
            name: '忠心耿耿',
            description: '极其忠诚，永不背叛',
            rarity: 'common',
            effects: {
                loyalty: 1.5,
                relationship: 1.2,
                combat: 1.0
            }
        },
        {
            name: '聪慧过人',
            description: '聪明伶俐，学习能力强',
            rarity: 'common',
            effects: {
                cultivation: 1.15,
                taskSuccess: 1.15,
                breakthroughSuccess: 1.1
            }
        },
        {
            name: '身手敏捷',
            description: '身手灵活，闪避能力强',
            rarity: 'common',
            effects: {
                combat: 1.2,
                injuryChance: 0.8,
                taskSuccess: 1.1
            }
        }
    ],
    
    // 负面命格 (20个)
    negative: [
        {
            name: '天煞孤星',
            description: '命格孤寡，容易带来灾祸',
            rarity: 'legendary',
            effects: {
                adventureChance: 0.3,
                injuryChance: 2.0,
                relationship: 0.5,
                combat: 0.8
            }
        },
        {
            name: '修炼废柴',
            description: '修炼天赋极差，进展缓慢',
            rarity: 'epic',
            effects: {
                cultivation: 0.3,
                breakthroughSuccess: 0.5,
                combat: 0.9
            }
        },
        {
            name: '体弱多病',
            description: '体质虚弱，容易生病受伤',
            rarity: 'epic',
            effects: {
                combat: 0.5,
                injuryChance: 3.0,
                cultivation: 0.7,
                healing: 0.5
            }
        },
        {
            name: '厄运缠身',
            description: '运气极差，祸不单行',
            rarity: 'rare',
            effects: {
                adventureChance: 0.5,
                injuryChance: 2.5,
                taskSuccess: 0.6,
                adventureReward: 0.5
            }
        },
        {
            name: '心魔缠身',
            description: '心魔严重，容易走火入魔',
            rarity: 'rare',
            effects: {
                breakthroughSuccess: 0.4,
                cultivation: 0.8,
                injuryChance: 2.0
            }
        },
        {
            name: '丹毒侵蚀',
            description: '丹毒缠身，修炼受阻',
            rarity: 'rare',
            effects: {
                cultivation: 0.6,
                pillEffect: 0.3,
                healing: 0.7,
                combat: 0.8
            }
        },
        {
            name: '懒散成性',
            description: '天性懒惰，不愿努力',
            rarity: 'uncommon',
            effects: {
                cultivation: 0.6,
                taskSuccess: 0.7,
                spiritStoneOutput: 0.5
            }
        },
        {
            name: '贪婪自私',
            description: '贪婪自私，容易背叛',
            rarity: 'uncommon',
            effects: {
                loyalty: 0.5,
                relationship: 0.6,
                tradeProfit: 1.3
            }
        },
        {
            name: '愚笨迟钝',
            description: '天资愚钝，学习困难',
            rarity: 'uncommon',
            effects: {
                cultivation: 0.7,
                breakthroughSuccess: 0.7,
                taskSuccess: 0.8
            }
        },
        {
            name: '脾气暴躁',
            description: '脾气暴躁，人际关系差',
            rarity: 'uncommon',
            effects: {
                relationship: 0.5,
                combat: 1.2,
                loyalty: 0.8
            }
        },
        {
            name: '胆小懦弱',
            description: '胆小怕事，战斗力弱',
            rarity: 'uncommon',
            effects: {
                combat: 0.6,
                taskSuccess: 0.7,
                injuryChance: 1.5
            }
        },
        {
            name: '财运不佳',
            description: '财运不好，总是亏钱',
            rarity: 'common',
            effects: {
                spiritStoneOutput: 0.7,
                tradeProfit: 0.8,
                marketDiscount: 1.2
            }
        },
        {
            name: '多灾多难',
            description: '小麻烦不断',
            rarity: 'common',
            effects: {
                injuryChance: 1.5,
                taskSuccess: 0.9,
                adventureChance: 0.8
            }
        },
        {
            name: '心浮气躁',
            description: '心性浮躁，难以静心',
            rarity: 'common',
            effects: {
                cultivation: 0.8,
                breakthroughSuccess: 0.9,
                combat: 1.1
            }
        },
        {
            name: '体质平平',
            description: '体质普通，修炼缓慢',
            rarity: 'common',
            effects: {
                cultivation: 0.9,
                combat: 0.9,
                healing: 0.9
            }
        },
        {
            name: '孤僻寡言',
            description: '性格孤僻，不善交际',
            rarity: 'common',
            effects: {
                relationship: 0.7,
                loyalty: 0.9,
                taskSuccess: 0.9
            }
        },
        {
            name: '运气平平',
            description: '运气一般，没什么奇遇',
            rarity: 'common',
            effects: {
                adventureChance: 0.9,
                taskReward: 0.9,
                injuryChance: 1.1
            }
        },
        {
            name: '意志薄弱',
            description: '意志不坚，容易放弃',
            rarity: 'common',
            effects: {
                breakthroughSuccess: 0.8,
                cultivation: 0.9,
                loyalty: 0.9
            }
        },
        {
            name: '笨手笨脚',
            description: '手脚不灵活，做事笨拙',
            rarity: 'common',
            effects: {
                taskSuccess: 0.8,
                combat: 0.9,
                spiritStoneOutput: 0.9
            }
        },
        {
            name: '平庸之辈',
            description: '资质平庸，各方面都一般',
            rarity: 'common',
            effects: {
                cultivation: 0.85,
                combat: 0.85,
                taskSuccess: 0.9,
                breakthroughSuccess: 0.9
            }
        }
    ]
};
