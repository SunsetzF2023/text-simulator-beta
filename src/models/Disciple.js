import { REALMS, SPIRIT_ROOTS, TRAITS, SPECIAL_CONSTITUTIONS, FAMILY_BACKGROUNDS, APPEARANCES, PERSONALITIES, SURNAMES, NAMES, AFFECTION_CONFIG, AI_CONFIG, DESTINIES, BASE_TECHNIQUES, TECHNIQUE_LEVELS, TECHNIQUE_QUALITIES } from '../data/constants.js';
import { advancedAI } from '../ai/AdvancedAI.js';

// 数据迁移函数 - 修复旧格式的天赋词条
function migrateTraitsData(disciple) {
    if (disciple.traits && disciple.traits.length > 0) {
        // 检查是否是旧格式（对象）
        if (typeof disciple.traits[0] === 'object' && disciple.traits[0].name) {
            disciple.traits = disciple.traits.map(trait => trait.name);
            console.log(`迁移弟子 ${disciple.name} 的天赋词条数据`);
        }
    }
}

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
        
        // 功法修炼系统
        this.techniques = []; // 已学会的功法
        this.currentTechnique = null; // 当前修炼的功法
        this.techniqueProgress = {}; // 功法修炼进度
        
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
    
    // 计算实际修炼速度（综合体质、命格和灵兽加成）
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
        
        // 灵兽加成
        if (this.spiritBeast && this.spiritBeast.cultivationBonus) {
            baseSpeed *= (1 + this.spiritBeast.cultivationBonus);
        }
        
        // 天赋加成（天赋值转换为加成系数）
        const talentBonus = 0.5 + (this.talent / 100); // 0.5-1.5的加成
        baseSpeed *= talentBonus;
        
        return baseSpeed;
    }
    
    // 计算战斗力（综合体质、命格、武器和灵兽加成）
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
        
        // 灵兽加成
        if (this.spiritBeast && this.spiritBeast.combatBonus) {
            basePower += this.spiritBeast.combatBonus;
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
        
        // 玩家境界和战力加成
        if (window.game && window.game.gameState) {
            const gameState = window.game.gameState;
            const playerRealmIndex = REALMS.indexOf(gameState.playerRealm);
            const discipleRealmIndex = REALMS.indexOf(this.realm);
            
            // 玩家境界越高，弟子任务成功率越高
            if (playerRealmIndex > 10) { // 玩家至少筑基期
                baseRate *= 1 + (playerRealmIndex - 10) * 0.05; // 每个大境界+5%成功率
            }
            
            // 玩家战力加成
            const playerPower = this.calculatePlayerPower(gameState);
            if (playerPower > 100) {
                baseRate *= 1 + Math.min(playerPower / 1000, 0.3); // 最多+30%成功率
            }
            
            // 弟子与玩家境界差距影响
            const realmGap = playerRealmIndex - discipleRealmIndex;
            if (realmGap > 5) {
                baseRate *= 1.2; // 玩家境界远高于弟子，任务成功率+20%
            } else if (realmGap < -3) {
                baseRate *= 0.8; // 弟子境界高于玩家太多，任务成功率-20%
            }
        }
        
        return Math.min(0.95, Math.max(0.05, baseRate)); // 限制在5%-95%之间
    }
    
    // 计算玩家战力
    calculatePlayerPower(gameState) {
        let power = 0;
        
        // 境界贡献
        const realmIndex = REALMS.indexOf(gameState.playerRealm);
        power += realmIndex * 10;
        
        // 弟子数量贡献
        power += gameState.disciples.length * 5;
        
        // 资源贡献
        if (gameState.spiritStones) power += Math.min(gameState.spiritStones / 10, 50);
        if (gameState.breakthroughPills) power += gameState.breakthroughPills * 20;
        if (gameState.reputation) power += Math.min(gameState.reputation / 5, 100);
        
        return power;
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
                reward: { experience: 80 } // 提高到80
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
        const baseExperience = Math.floor(Math.random() * 15) + 10; // 提高基础修为：10-24
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
                reward: { experience: Math.floor(enhancedExperience * 3) + 30 }, // 大幅提高突破奖励
                discipleId: this.id
            },
            {
                type: 'breakthrough',
                message: `${this.name}心无旁骛，进入深度修炼状态！`,
                reward: { experience: Math.floor(enhancedExperience * 4) + 50 }, // 更高的修炼奖励
                discipleId: this.id
            },
            {
                type: 'breakthrough',
                message: `${this.name}灵光一闪，突破瓶颈！`,
                reward: { experience: Math.floor(enhancedExperience * 5) + 80 }, // 突破性奖励
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
        
        // 根据性格决定事件类型
        const conflictChance = this.personality === '狂傲' ? 0.4 : 
                              this.personality === '卑劣' ? 0.3 : 
                              this.personality === '残暴' ? 0.35 : 0.1;
        
        const isConflict = Math.random() < conflictChance;
        
        if (isConflict) {
            // 冲突事件
            const conflicts = [
                {
                    type: 'conflict',
                    message: `${this.name}与${other.name}因修炼理念不合发生争执！`,
                    reward: { experience: -15 },
                    discipleId: this.id,
                    targetId: other.id
                },
                {
                    type: 'conflict',
                    message: `${this.name}嫉妒${other.name}的天赋，暗中使绊！`,
                    reward: { experience: -20 },
                    discipleId: this.id,
                    targetId: other.id
                },
                {
                    type: 'conflict',
                    message: `${this.name}与${other.name}发生肢体冲突，双方都受了点内伤！`,
                    reward: { experience: -25 },
                    discipleId: this.id,
                    targetId: other.id
                },
                {
                    type: 'conflict',
                    message: `${this.name}在比试中败给了${other.name}，心神受损！`,
                    reward: { experience: -18 },
                    discipleId: this.id,
                    targetId: other.id
                }
            ];
            
            const conflict = conflicts[Math.floor(Math.random() * conflicts.length)];
            
            // 对双方都产生影响
            if (conflict.reward.experience) {
                this.cultivation = Math.max(0, this.cultivation + conflict.reward.experience);
                other.cultivation = Math.max(0, other.cultivation + Math.floor(conflict.reward.experience * 0.7));
            }
            
            return conflict;
        } else {
            // 友好事件
            const friendlyEvents = [
                {
                    type: 'social',
                    message: `${this.name}与${other.name}交流修炼心得，都有所收获。`,
                    reward: { experience: 20 },
                    discipleId: this.id,
                    targetId: other.id
                },
                {
                    type: 'social',
                    message: `${this.name}帮助${other.name}解决修炼难题，教学相长。`,
                    reward: { experience: 25 },
                    discipleId: this.id,
                    targetId: other.id
                },
                {
                    type: 'social',
                    message: `${this.name}与${other.name}切磋武艺，共同进步！`,
                    reward: { experience: 30 },
                    discipleId: this.id,
                    targetId: other.id
                },
                {
                    type: 'social',
                    message: `${this.name}和${other.name}一起顿悟，修为大进！`,
                    reward: { experience: 50 },
                    discipleId: this.id,
                    targetId: other.id
                }
            ];
            
            const friendly = friendlyEvents[Math.floor(Math.random() * friendlyEvents.length)];
            
            // 对双方都产生正面影响
            if (friendly.reward.experience) {
                this.cultivation += friendly.reward.experience;
                other.cultivation += Math.floor(friendly.reward.experience * 0.8);
            }
            
            return friendly;
        }
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
            // 给予弟子个人成长奖励
            if (task.reward) {
                if (task.reward.experience) {
                    this.cultivation += task.reward.experience;
                    this.addPersonalLog(`[任务] 获得修为：${task.reward.experience}`, Date.now());
                }
                // 弟子个人也可能获得一些额外奖励
                if (task.reward.spiritStones && Math.random() < 0.3) {
                    // 30%概率弟子个人获得少量灵石作为奖励
                    const personalReward = Math.floor(task.reward.spiritStones * 0.1);
                    this.addPersonalLog(`[任务] 获得个人奖励：${personalReward}灵石`, Date.now());
                }
            }
            
            // 记录任务历史
            this.taskHistory.push({
                taskName: task.name,
                success: true,
                time: Date.now(),
                reward: task.reward
            });
            
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
                
                // 记录失败的任务历史
                this.taskHistory.push({
                    taskName: task.name,
                    success: false,
                    time: Date.now(),
                    injured: true
                });
                
                return {
                    success: false,
                    message: `${this.name}执行任务失败并受伤`
                };
            } else {
                this.addPersonalLog(`[任务] 任务失败，但平安返回`, Date.now());
                
                // 记录失败的任务历史
                this.taskHistory.push({
                    taskName: task.name,
                    success: false,
                    time: Date.now(),
                    injured: false
                });
                
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
    
    // 获取功法修炼等级
    getTechniqueLevel(techniqueName) {
        const progress = this.techniqueProgress[techniqueName] || 0;
        for (let i = TECHNIQUE_LEVELS.length - 1; i >= 0; i--) {
            if (progress >= TECHNIQUE_LEVELS[i].progress) {
                return TECHNIQUE_LEVELS[i];
            }
        }
        return TECHNIQUE_LEVELS[0];
    }
    
    // 学习功法
    learnTechnique(techniqueData) {
        if (!techniqueData) return false;
        
        // 检查是否已学会
        if (this.techniques.find(t => t.name === techniqueData.name)) {
            return false;
        }
        
        // 检查属性匹配
        const matchBonus = this.getTechniqueMatchBonus(techniqueData);
        if (matchBonus < 0.3) {
            this.addPersonalLog(`[功法] ${techniqueData.name}与自身属性不匹配，修炼效果很差`, Date.now());
        }
        
        this.techniques.push(techniqueData);
        this.techniqueProgress[techniqueData.name] = 0;
        
        if (!this.currentTechnique) {
            this.currentTechnique = techniqueData;
        }
        
        this.addPersonalLog(`[功法] 学会了${techniqueData.quality}功法：${techniqueData.name}`, Date.now());
        return true;
    }
    
    // 获取功法匹配加成
    getTechniqueMatchBonus(technique) {
        let bonus = 1.0;
        
        // 灵根匹配
        if (technique.attribute && technique.attribute !== '无属性') {
            if (this.spiritRoot === technique.attribute) {
                bonus += 0.5; // 完美匹配
            } else if (this.isCompatibleElement(this.spiritRoot, technique.attribute)) {
                bonus += 0.2; // 兼容匹配
            } else {
                bonus -= 0.3; // 不匹配
            }
        }
        
        // 体质匹配
        if (this.constitution) {
            if (technique.type === 'body' && this.constitution.name.includes('体')) {
                bonus += 0.3;
            }
            if (technique.type === 'foundation' && this.constitution.name.includes('灵')) {
                bonus += 0.3;
            }
        }
        
        return Math.max(0.1, bonus);
    }
    
    // 检查元素兼容性
    isCompatibleElement(root1, root2) {
        const compatibility = {
            '金': ['土', '冰'],
            '木': ['水', '风'],
            '水': ['金', '木'],
            '火': ['木', '风'],
            '土': ['金', '火'],
            '雷': ['水', '风'],
            '风': ['火', '雷'],
            '冰': ['水', '土']
        };
        
        return compatibility[root1]?.includes(root2) || false;
    }
    
    // 修炼功法
    practiceTechnique() {
        if (!this.currentTechnique) return null;
        
        const technique = this.currentTechnique;
        const matchBonus = this.getTechniqueMatchBonus(technique);
        const currentProgress = this.techniqueProgress[technique.name] || 0;
        
        if (currentProgress >= 100) {
            this.addPersonalLog(`[功法] ${technique.name}已达到登峰造极境界`, Date.now());
            return null;
        }
        
        // 计算修炼进度
        const baseProgress = Math.random() * 3 + 1; // 1-4基础进度
        const talentBonus = this.talent / 100; // 天赋加成
        const finalProgress = baseProgress * matchBonus * talentBonus;
        
        this.techniqueProgress[technique.name] = Math.min(100, currentProgress + finalProgress);
        
        const newLevel = this.getTechniqueLevel(technique.name);
        const oldLevel = this.getTechniqueLevel(currentProgress);
        
        let result = {
            technique: technique.name,
            progress: this.techniqueProgress[technique.name],
            levelUp: false
        };
        
        // 检查是否升级
        if (newLevel.progress > oldLevel.progress) {
            result.levelUp = true;
            result.newLevel = newLevel.name;
            this.addPersonalLog(`[功法] ${technique.name}修炼至${newLevel.name}！`, Date.now());
        }
        
        return result;
    }
    
    // 获取功法战力加成
    getTechniquePowerBonus() {
        let totalBonus = 0;
        
        for (const technique of this.techniques) {
            const progress = this.techniqueProgress[technique.name] || 0;
            const level = this.getTechniqueLevel(technique.name);
            const quality = TECHNIQUE_QUALITIES[technique.quality];
            const matchBonus = this.getTechniqueMatchBonus(technique);
            
            const powerBonus = technique.basePower * quality.multiplier * level.powerBonus * matchBonus;
            totalBonus += powerBonus;
        }
        
        return Math.floor(totalBonus);
    }
    
    // 切换修炼功法
    switchTechnique(techniqueName) {
        const technique = this.techniques.find(t => t.name === techniqueName);
        if (technique) {
            this.currentTechnique = technique;
            this.addPersonalLog(`[功法] 开始修炼${technique.name}`, Date.now());
            return true;
        }
        return false;
    }
    
    // 获取功法信息
    getTechniqueInfo() {
        return this.techniques.map(technique => ({
            name: technique.name,
            quality: technique.quality,
            attribute: technique.attribute,
            type: technique.type,
            description: technique.description,
            progress: this.techniqueProgress[technique.name] || 0,
            level: this.getTechniqueLevel(technique.name),
            isCurrent: this.currentTechnique?.name === technique.name,
            matchBonus: this.getTechniqueMatchBonus(technique),
            powerBonus: Math.floor(technique.basePower * TECHNIQUE_QUALITIES[technique.quality].multiplier * this.getTechniqueLevel(technique.name).powerBonus * this.getTechniqueMatchBonus(technique))
        }));
    }
}
