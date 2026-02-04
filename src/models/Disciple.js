import { REALMS, SPIRIT_ROOTS, TRAITS, SPECIAL_CONSTITUTIONS, FAMILY_BACKGROUNDS, APPEARANCES, PERSONALITIES, SURNAMES, NAMES, AFFECTION_CONFIG, AI_CONFIG, DESTINIES } from '../data/constants.js';
import { advancedAI } from '../ai/AdvancedAI.js';

// 弟子类
export class Disciple {
    constructor(isInitial = false) {
        this.id = Date.now() + Math.random();
        this.name = this.generateName();
        this.gender = Math.random() > 0.5 ? '男' : '女';
        this.age = this.generateAge(); // 生成更合理的年龄分布
        this.appearance = APPEARANCES[Math.floor(Math.random() * APPEARANCES.length)];
        this.spiritRoot = SPIRIT_ROOTS[Math.floor(Math.random() * SPIRIT_ROOTS.length)];
        this.personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
        
        // 特殊体质和家世背景
        this.constitution = this.generateConstitution();
        this.familyBackground = this.generateFamilyBackground();
        
        // 属性
        this.realm = '凡人';
        this.cultivation = 0;
        this.talent = Math.random() * 100; // 0-100的天赋值
        this.loyalty = Math.floor(Math.random() * 30) + 70; // 70-100忠诚度
        this.alive = true;
        this.injured = false;
        this.onTask = false;
        
        // 词条
        this.traits = this.generateTraits();
        
        // 命格系统
        this.destiny = this.generateDestiny();
        
        // 个人日志
        this.personalLog = [];
        
        // 任务历史
        this.taskHistory = [];
        
        // 关系
        this.relationships = {};
        this.master = null;
        this.spouse = null;
        
        // 好感度系统
        this.affection = AFFECTION_CONFIG.INITIAL_AFFECTION;
        this.affectionLevel = this.getAffectionLevel();
        
        // AI性格系统
        this.aiPersonality = this.generateAIPersonality();
        this.chatHistory = [];
        this.lastChatTime = 0;
        
        // 如果是初始弟子，给予更好的属性
        if (isInitial) {
            this.talent = Math.random() * 30 + 70; // 70-100
            this.loyalty = Math.floor(Math.random() * 10) + 90; // 90-100
            this.cultivation = Math.floor(Math.random() * 20) + 10; // 10-30
        }
        
        this.addPersonalLog(`[诞生] ${this.name} 加入宗门，灵根：${this.spiritRoot}，体质：${this.constitution.name}，家世：${this.familyBackground.name}，天赋：${this.talent.toFixed(1)}${this.destiny ? `，命格：${this.destiny.name}` : ''}`, 0);
    }
    
    // 生成年龄 - 更合理的分布，增加年轻弟子概率
    generateAge() {
        const random = Math.random();
        
        // 30% 几岁儿童 (6-12岁) - 天才儿童
        if (random < 0.30) {
            return Math.floor(Math.random() * 7) + 6;
        }
        // 40% 青少年 (13-20岁) - 最常见的修仙年龄
        else if (random < 0.70) {
            return Math.floor(Math.random() * 8) + 13;
        }
        // 20% 青年 (21-30岁) - 有一定基础
        else if (random < 0.90) {
            return Math.floor(Math.random() * 10) + 21;
        }
        // 10% 中年 (31-45岁) - 大器晚成
        else {
            return Math.floor(Math.random() * 15) + 31;
        }
    }
    
    // 生成命格
    generateDestiny() {
        const random = Math.random();
        
        // 60%概率无命格（普通人）
        if (random < 0.60) {
            return null;
        }
        
        // 40%概率有命格
        const destinyType = random < 0.80 ? 'positive' : 'negative'; // 80%正向，20%负向
        const destinies = DESTINIES[destinyType];
        
        // 根据稀有度概率选择命格
        const destinyRandom = Math.random();
        let selectedDestiny = null;
        
        for (const destiny of destinies) {
            const rarityChance = {
                'common': 0.50,
                'uncommon': 0.30,
                'rare': 0.15,
                'epic': 0.04,
                'legendary': 0.01
            };
            
            if (destinyRandom <= rarityChance[destiny.rarity]) {
                selectedDestiny = destiny;
                break;
            }
        }
        
        // 如果没有选中，选择一个普通的
        if (!selectedDestiny) {
            selectedDestiny = destinies.find(d => d.rarity === 'common');
        }
        
        return selectedDestiny;
    }
    
    // 获取命格加成
    getDestinyEffects() {
        if (!this.destiny) {
            return {};
        }
        return this.destiny.effects;
    }
    
    // 应用命格效果到属性
    applyDestinyEffects() {
        const effects = this.getDestinyEffects();
        
        // 修炼速度加成
        if (effects.cultivation) {
            return effects.cultivation;
        }
        
        // 战斗力加成
        if (effects.combat) {
            return effects.combat;
        }
        
        // 任务成功率加成
        if (effects.taskSuccess) {
            return effects.taskSuccess;
        }
        
        return 1.0; // 默认无加成
    }
    
    // 计算实际修炼速度（综合体质和命格加成）
    getCultivationSpeed() {
        let baseSpeed = 1.0;
        
        // 体质加成
        if (this.constitution && this.constitution.cultivation) {
            baseSpeed *= this.constitution.cultivation;
        }
        
        // 命格加成
        const destinyEffects = this.getDestinyEffects();
        if (destinyEffects.cultivation) {
            baseSpeed *= destinyEffects.cultivation;
        }
        
        // 修炼加成
        if (this.cultivationBonus) {
            baseSpeed *= (1 + this.cultivationBonus);
        }
        
        // 天赋加成（天赋值转换为加成系数）
        const talentBonus = 0.5 + (this.talent / 100); // 0.5-1.5的加成
        baseSpeed *= talentBonus;
        
        return baseSpeed;
    }
    
    // 计算战斗力（综合体质和命格加成）
    getCombatPower() {
        let basePower = this.talent; // 基础战斗力基于天赋
        
        // 体质加成
        if (this.constitution && this.constitution.combat) {
            basePower *= this.constitution.combat;
        }
        
        // 命格加成
        const destinyEffects = this.getDestinyEffects();
        if (destinyEffects.combat) {
            basePower *= destinyEffects.combat;
        }
        
        // 武器加成
        if (this.weapon && this.weapon.combatBonus) {
            basePower += this.weapon.combatBonus;
        }
        
        // 临时加成
        if (this.temporaryBonus && this.temporaryBonus.combat) {
            basePower += this.temporaryBonus.combat;
        }
        
        return Math.floor(basePower);
    }
    
    // 计算任务成功率
    getTaskSuccessRate(taskDifficulty = 1.0) {
        let baseRate = this.talent / 100; // 基础成功率基于天赋
        
        // 命格加成
        const destinyEffects = this.getDestinyEffects();
        if (destinyEffects.taskSuccess) {
            baseRate *= destinyEffects.taskSuccess;
        }
        
        // 考虑任务难度
        baseRate /= taskDifficulty;
        
        return Math.min(0.95, Math.max(0.05, baseRate)); // 限制在5%-95%之间
    }
    
    // 生成特殊体质
    generateConstitution() {
        // 根据稀有度概率选择体质
        const random = Math.random();
        let accumulatedChance = 0;
        
        for (const constitution of SPECIAL_CONSTITUTIONS) {
            const rarityConfig = {
                'common': 0.4,
                'uncommon': 0.3,
                'rare': 0.2,
                'epic': 0.08,
                'legendary': 0.02
            };
            accumulatedChance += rarityConfig[constitution.rarity] || 0;
            
            if (random <= accumulatedChance) {
                return constitution;
            }
        }
        
        return SPECIAL_CONSTITUTIONS[0]; // 默认凡体
    }
    
    // 生成家世背景
    generateFamilyBackground() {
        // 根据稀有度概率选择家世
        const random = Math.random();
        let accumulatedChance = 0;
        
        for (const background of FAMILY_BACKGROUNDS) {
            const rarityConfig = {
                'common': 0.4,
                'uncommon': 0.3,
                'rare': 0.2,
                'epic': 0.08,
                'legendary': 0.02
            };
            accumulatedChance += rarityConfig[background.rarity] || 0;
            
            if (random <= accumulatedChance) {
                return background;
            }
        }
        
        return FAMILY_BACKGROUNDS[0]; // 默认凡人
    }
    
    // 生成姓名
    generateName() {
        const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
        const name = NAMES[Math.floor(Math.random() * NAMES.length)];
        return surname + name;
    }
    
    // 生成词条
    generateTraits() {
        const traits = [];
        const traitCount = Math.floor(Math.random() * 3) + 1; // 1-3个词条
        
        for (let i = 0; i < traitCount; i++) {
            const availableTraits = TRAITS.filter(t => !traits.includes(t.name));
            if (availableTraits.length > 0) {
                const trait = availableTraits[Math.floor(Math.random() * availableTraits.length)];
                traits.push(trait.name); // 只存储名称
            }
        }
        
        return traits;
    }
    
    // 添加个人日志
    addPersonalLog(message, gameTick = 0) {
        this.personalLog.push({
            message,
            timestamp: Date.now(),
            gameTick: gameTick
        });
        
        // 限制日志数量
        if (this.personalLog.length > 50) {
            this.personalLog.shift();
        }
    }
    
    // 触发自发事件
    triggerAutonomousEvent(allDisciples, gameTick) {
        const events = [];
        
        // 修炼事件
        if (Math.random() < 0.3) {
            events.push(this.triggerCultivationEvent());
        }
        
        // 社交事件
        if (Math.random() < 0.2) {
            events.push(this.triggerSocialEvent(allDisciples));
        }
        
        // 奇遇事件（小概率获得功法）
        if (Math.random() < 0.05) { // 5%概率触发奇遇
            events.push(this.triggerAdventureEvent());
        }
        
        // 返回第一个有效事件
        return events.find(event => event !== null);
    }
    
    // 触发奇遇事件
    triggerAdventureEvent() {
        const adventures = [
            {
                type: 'technique_fragment',
                message: `${this.name}外出历练时，在一处山洞中发现了古老的功法残本！`,
                reward: { techniqueFragment: true }
            },
            {
                type: 'technique_fragment',
                message: `${this.name}帮助了一位受伤的老者，老者赠予了一本功法残本作为谢礼！`,
                reward: { techniqueFragment: true }
            },
            {
                type: 'technique_fragment',
                message: `${this.name}在坊市淘书时，意外发现了一本夹在古籍中的功法残页！`,
                reward: { techniqueFragment: true }
            },
            {
                type: 'breakthrough',
                message: `${this.name}在瀑布下顿悟，修为大进！`,
                reward: { experience: 30 }
            },
            {
                type: 'treasure',
                message: `${this.name}发现了一个隐藏的储物袋！`,
                reward: { spiritStones: Math.floor(Math.random() * 50) + 20 }
            },
            {
                type: 'consume_item',
                message: `${this.name}遭遇危险，消耗了宗门的一枚丹药才得以脱身！`,
                reward: { consumeItem: true, itemType: 'pill' }
            },
            {
                type: 'consume_item',
                message: `${this.name}的武器在战斗中损坏，不得不使用宗门备用武器！`,
                reward: { consumeItem: true, itemType: 'weapon' }
            }
        ];
        
        // 大气运之弟子更容易获得功法
        if (this.constitution && this.constitution.name !== '凡体') {
            const techniqueAdventures = adventures.filter(a => a.reward.techniqueFragment);
            if (Math.random() < 0.6 && techniqueAdventures.length > 0) {
                return techniqueAdventures[Math.floor(Math.random() * techniqueAdventures.length)];
            }
        }
        
        return adventures[Math.floor(Math.random() * adventures.length)];
    }
    
    // 触发修炼事件
    triggerCultivationEvent() {
        const cultivationSpeed = this.getCultivationSpeed();
        const baseExperience = Math.floor(Math.random() * 5) + 1;
        const enhancedExperience = Math.floor(baseExperience * cultivationSpeed);
        
        const events = [
            {
                type: 'cultivation',
                message: `${this.name}正在专心修炼，修为有所提升。`,
                reward: { experience: enhancedExperience },
                discipleId: this.id
            },
            {
                type: 'breakthrough',
                message: `${this.name}修炼有所感悟，修为大进！`,
                reward: { experience: Math.floor(enhancedExperience * 3) + 10 },
                discipleId: this.id
            }
        ];
        
        return events[Math.floor(Math.random() * events.length)];
    }
    
    // 触发社交事件
    triggerSocialEvent(allDisciples) {
        const otherDisciples = allDisciples.filter(d => d.id !== this.id && d.alive);
        if (otherDisciples.length === 0) return null;
        
        const other = otherDisciples[Math.floor(Math.random() * otherDisciples.length)];
        
        const events = [
            {
                type: 'social',
                message: `${this.name}与${other.name}交流修炼心得。`,
                reward: null
            },
            {
                type: 'social',
                message: `${this.name}帮助${other.name}解决修炼难题。`,
                reward: { loyalty: 1 }
            }
        ];
        
        return events[Math.floor(Math.random() * events.length)];
    }
    
    // 接受任务
    acceptTask(task) {
        if (!this.alive || this.injured || this.onTask) {
            return false;
        }
        
        this.onTask = true;
        this.currentTask = task;
        this.addPersonalLog(`[任务] 接受了任务：${task.name}`, Date.now());
        
        return true;
    }
    
    // 执行任务
    executeTask() {
        if (!this.onTask || !this.currentTask) {
            return null;
        }
        
        // 使用新的任务成功率计算
        const successRate = this.getTaskSuccessRate(this.currentTask.difficulty);
        const success = Math.random() < successRate;
        
        this.onTask = false;
        const task = this.currentTask;
        this.currentTask = null;
        
        if (success) {
            this.addPersonalLog(`[任务] 成功完成任务：${task.name}`, Date.now());
            return {
                success: true,
                message: `${this.name}成功完成了任务：${task.name}`,
                reward: task.reward
            };
        } else {
            // 任务失败，可能受伤（考虑命格和装备的影响）
            const destinyEffects = this.getDestinyEffects();
            const injuryChance = destinyEffects.injuryChance || 1.0;
            
            // 考虑受伤减少效果
            const injuryReduction = this.injuryReduction || 0;
            const finalInjuryChance = 0.3 * injuryChance * (1 - injuryReduction);
            
            if (Math.random() < finalInjuryChance) {
                this.injured = true;
                this.addPersonalLog(`[任务] 执行任务失败并受伤`, Date.now());
                return {
                    success: false,
                    message: `${this.name}执行任务失败并受伤`
                };
            } else {
                this.addPersonalLog(`[任务] 任务失败，但平安返回`, Date.now());
                return {
                    success: false,
                    message: `${this.name}任务失败，但平安返回`
                };
            }
        }
    }
    
    // 治疗
    heal() {
        if (this.injured) {
            this.injured = false;
            this.addPersonalLog(`[治疗] 伤势恢复`, Date.now());
        }
    }
    
    // 结婚
    marry(partner) {
        if (!this.alive || !partner.alive || this.spouse || partner.spouse) {
            return false;
        }
        
        this.spouse = partner.id;
        partner.spouse = this.id;
        
        this.addPersonalLog(`[婚姻] 与${partner.name}结为道侣`, Date.now());
        partner.addPersonalLog(`[婚姻] 与${this.name}结为道侣`, Date.now());
        
        return true;
    }
    
    // 离开宗门
    leaveSect() {
        this.alive = false;
        this.addPersonalLog(`[离开] 离开了宗门`, Date.now());
    }
    
    // 生成AI性格
    generateAIPersonality() {
        const personalityTypes = Object.keys(AI_CONFIG.PERSONALITIES);
        const type = personalityTypes[Math.floor(Math.random() * personalityTypes.length)];
        return {
            type: type,
            ...AI_CONFIG.PERSONALITIES[type],
            mood: Math.random() * 100, // 心情值 0-100
            memory: [], // 记忆系统
            preferences: this.generatePreferences()
        };
    }
    
    // 生成偏好
    generatePreferences() {
        return {
            topics: Object.keys(AI_CONFIG.TOPICS).sort(() => Math.random() - 0.5).slice(0, 3),
            gifts: AFFECTION_CONFIG.GIFTS.sort(() => Math.random() - 0.5).slice(0, 3),
            activities: ['修炼', '聊天', '散步', '品茶', '观星', '练剑'].sort(() => Math.random() - 0.5).slice(0, 2)
        };
    }
    
    // 获取好感度等级
    getAffectionLevel() {
        const levels = AFFECTION_CONFIG.LEVELS;
        let currentLevel = levels[0];
        
        Object.entries(levels).forEach(([threshold, level]) => {
            if (this.affection >= parseInt(threshold)) {
                currentLevel = level;
            }
        });
        
        return currentLevel;
    }
    
    // 增加好感度
    increaseAffection(amount, reason = '互动') {
        this.affection = Math.min(AFFECTION_CONFIG.MAX_AFFECTION, this.affection + amount);
        this.affectionLevel = this.getAffectionLevel();
        this.addPersonalLog(`[好感] 与老祖${reason}，好感度+${amount}，当前${this.affection}`, Date.now());
    }
    
    // 生成AI回复（异步）
    async generateResponse(userMessage, context = {}) {
        try {
            // 尝试使用高级AI
            const aiResponse = await advancedAI.generateResponse(userMessage, this);
            
            // 记录对话历史
            this.chatHistory.push({
                timestamp: Date.now(),
                user: userMessage,
                ai: aiResponse,
                affection: this.affection
            });
            
            // 增加好感度
            this.increaseAffection(
                Math.floor(Math.random() * (AFFECTION_CONFIG.INTERACTIONS.chat.max - AFFECTION_CONFIG.INTERACTIONS.chat.min + 1)) + AFFECTION_CONFIG.INTERACTIONS.chat.min,
                '聊天'
            );
            
            return aiResponse;
        } catch (error) {
            console.log('高级AI不可用，使用本地AI:', error.message);
            // 如果高级AI失败，降级到本地AI
            const localResponse = localAI.generateResponse(userMessage, this, context);
            
            // 记录对话历史
            this.chatHistory.push({
                timestamp: Date.now(),
                user: userMessage,
                ai: localResponse,
                affection: this.affection
            });
            
            // 增加好感度
            this.increaseAffection(
                Math.floor(Math.random() * (AFFECTION_CONFIG.INTERACTIONS.chat.max - AFFECTION_CONFIG.INTERACTIONS.chat.min + 1)) + AFFECTION_CONFIG.INTERACTIONS.chat.min,
                '聊天'
            );
            
            return localResponse;
        }
    }
    
    // 其他方法...
    
    // 根据好感度调整回复
    adjustResponseByAffection(response) {
        if (this.affection >= 80) {
            // 倾心或深爱
            return response + ' ❤️';
        } else if (this.affection >= 60) {
            // 亲近
            return response + ' 😊';
        } else if (this.affection >= 40) {
            // 友好
            return response + ' 🙂';
        } else {
            // 熟悉或陌生人
            return response;
        }
    }
    
    // 提取话题
    extractTopic(message) {
        const topics = {
            '修炼': ['修炼', '功法', '境界', '突破'],
            '日常': ['吃', '喝', '玩', '休息'],
            '感情': ['喜欢', '爱', '想', '念'],
            '宗门': ['宗门', '弟子', '同门']
        };
        
        for (const [topic, keywords] of Object.entries(topics)) {
            if (keywords.some(keyword => message.includes(keyword))) {
                return topic;
            }
        }
        
        return '事情';
    }
}
