import { gameState, saveGame, loadGame, hasSaveData, resetGame } from './state.js';
import { Disciple } from './models/Disciple.js';
import { 
    REALMS, 
    GAME_CONFIG, 
    TASK_TEMPLATES, 
    MARKET_ITEMS, 
    AUCTION_CONFIG, 
    RARITY_CONFIG, 
    INFLUENCE_LEVELS, 
    VISIT_EVENTS, 
    COLLECTIVE_EVENTS,
    REGION_CONFIG, 
    BASE_TECHNIQUES,
    INVASION_CONFIG,
    INVADING_SECTS,
    SECT_UPGRADE_REQUIREMENTS,
    EVIL_TASKS,
    DEMON_ARTS,
    DISCIPLE_CONFLICTS
} from './data/constants.js';
import { 
    updateDisplay, 
    addLog, 
    showGameContainer, 
    showInitModal,
    getFormData,
    validateForm,
    setupButtonListeners,
    showTaskHall,
    showMarket,
    showAuction,
    showTechniqueHall,
    showTreasury,
    showPastRecords
} from './utils/ui.js';

// 游戏主类
class CultivationGame {
    constructor() {
        this.gameLoop = null;
        this.autoSaveInterval = null;
        this.isRunning = false;
        this.isVisible = true; // 页面是否可见
        this.lastTickTime = 0; // 上次心跳时间
        this.accumulatedTime = 0; // 累积的时间差
        this.lastEventTime = Date.now();
        this.lastInvasionTime = Date.now();
    }
    
    // 🏛️ 实力至上系统核心函数
    
    // 获取宗门层级（基于宗主境界）
    getSectTier() {
        const realmIndex = REALMS.indexOf(gameState.playerRealm);
        
        if (realmIndex === 0) return '隐世草庐'; // 凡人
        if (realmIndex <= 10) return '修仙家族'; // 炼气期
        if (realmIndex <= 20) return '不入流宗门'; // 筑基期
        if (realmIndex <= 30) return '三流宗门'; // 金丹期
        if (realmIndex <= 40) return '二流宗门'; // 元婴期
        if (realmIndex <= 50) return '一流宗门'; // 化神期
        return '顶级宗门'; // 化神期以上
    }
    
    // 计算宗主战力
    calculatePlayerPower() {
        const realmIndex = REALMS.indexOf(gameState.playerRealm);
        let basePower = 100; // 基础战力
        
        // 境界加成（主要战力来源）
        if (realmIndex > 0) {
            basePower += realmIndex * 80; // 每个境界层级80点战力
        }
        
        // 灵根加成
        const spiritRootBonus = this.getSpiritRootBonus(gameState.spiritRoot);
        basePower *= spiritRootBonus;
        
        // 宗门风格加成
        const styleBonus = this.getSectStyleBonus(gameState.sectStyle);
        basePower *= styleBonus;
        
        gameState.playerPower = Math.floor(basePower);
        return gameState.playerPower;
    }
    
    // 计算宗门总战力
    calculateTotalPower() {
        const playerPower = this.calculatePlayerPower();
        
        // 计算所有弟子的战力之和
        let disciplePowerSum = 0;
        gameState.disciples.forEach(disciple => {
            if (disciple.alive && !disciple.injured) {
                disciplePowerSum += disciple.getCombatPower();
            }
        });
        
        // 宗门总战力 = 宗主战力 * 权威系数 + 弟子战力之和
        const authorityMultiplier = 2.0 + (REALMS.indexOf(gameState.playerRealm) * 0.1); // 境界越高权威越大
        const totalPower = Math.floor(playerPower * authorityMultiplier + disciplePowerSum);
        
        gameState.totalPower = totalPower;
        return totalPower;
    }
    
    // 更新宗主光环加成
    updateSectAura() {
        const realmIndex = REALMS.indexOf(gameState.playerRealm);
        let aura = 1.0;
        
        // 境界越高，光环加成越高
        if (realmIndex <= 10) aura = 1.0; // 炼气期：无光环
        else if (realmIndex <= 20) aura = 1.1; // 筑基期：10%加成
        else if (realmIndex <= 30) aura = 1.3; // 金丹期：30%加成
        else if (realmIndex <= 40) aura = 1.6; // 元婴期：60%加成
        else if (realmIndex <= 50) aura = 2.0; // 化神期：100%加成
        else aura = 2.5; // 化神期以上：150%加成
        
        gameState.sectAura = aura;
        return aura;
    }
    
    // 获取灵根加成
    getSpiritRootBonus(spiritRoot) {
        const bonuses = {
            '金': 1.0, '木': 1.1, '水': 1.1, '火': 1.2, '土': 1.0,
            '雷': 1.3, '风': 1.2, '冰': 1.2, '光': 1.4, '暗': 1.3
        };
        return bonuses[spiritRoot] || 1.0;
    }
    
    // 获取宗门风格加成
    getSectStyleBonus(sectStyle) {
        const bonuses = {
            '剑修': 1.3, '法修': 1.1, '魔道': 1.4, '长生': 0.9,
            '刀修': 1.35, '符修': 1.0, '丹修': 0.8, '阵修': 1.2,
            '邪修': 1.25, '劫修': 1.45, '采补': 0.9
        };
        return bonuses[sectStyle] || 1.0;
    }
    
    // 声望与战力动态反馈
    checkReputationPowerBalance() {
        const powerThreshold = gameState.totalPower * 0.8; // 战力的80%作为声望阈值
        const reputationRatio = gameState.reputation / powerThreshold;
        
        if (reputationRatio > 1.5) {
            // 声望远超战力：被视为"肥羊"
            return 'fat_sheep';
        } else if (reputationRatio < 0.5) {
            // 战力远超声望：被视为"隐世魔头"
            return 'hidden_demon';
        } else {
            // 平衡状态
            return 'balanced';
        }
    }
    
    // 🗺️ 地区系统
    
    // 初始化地区
    initializeRegion() {
        if (!gameState.currentRegion) {
            gameState.currentRegion = {
                name: this.generateRegionName(),
                level: this.calculateRegionLevel(),
                sects: [],
                lastUpdate: Date.now()
            };
        }
        this.updateNearbySects();
    }
    
    // 生成地区名称
    generateRegionName() {
        const prefixes = ['青云', '紫霞', '天剑', '玄火', '冰霜', '雷音', '丹鼎', '万兽'];
        const suffixes = ['山脉', '平原', '河谷', '森林', '盆地', '丘陵', '峡谷', '沼泽'];
        return prefixes[Math.floor(Math.random() * prefixes.length)] + 
               suffixes[Math.floor(Math.random() * suffixes.length)];
    }
    
    // 计算地区等级（基于玩家实力）
    calculateRegionLevel() {
        const playerPower = this.calculatePlayerPower();
        if (playerPower < 500) return 1; // 新手村
        if (playerPower < 2000) return 2; // 普通地区
        if (playerPower < 5000) return 3; // 危险地区
        if (playerPower < 10000) return 4; // 高级地区
        return 5; // 顶级地区
    }
    
    // 更新周边宗门
    updateNearbySects() {
        const now = Date.now();
        // 每5分钟更新一次
        if (now - gameState.lastRegionUpdate < 300000) return;
        
        gameState.lastRegionUpdate = now;
        gameState.nearbySects = this.generateNearbySects();
        
        addLog(`[地区] ${gameState.currentRegion.name}的势力格局发生变化`, 'text-blue-400');
    }
    
    // 生成周边宗门
    generateNearbySects() {
        const sects = [];
        const playerPower = gameState.totalPower; // 使用宗门总战力而不是玩家个人战力
        const sectCount = 5 + Math.floor(Math.random() * 5); // 5-9个宗门
        
        // 添加特殊宗门（有概率出现）
        if (Math.random() < 0.3) { // 30%概率出现特殊宗门
            const specialSect = this.generateSpecialSect(playerPower);
            if (specialSect) {
                sects.push(specialSect);
            }
        }
        
        // 生成普通宗门
        const normalSectCount = sectCount - sects.length;
        for (let i = 0; i < normalSectCount; i++) {
            const sect = this.generateNPCSect(playerPower);
            
            // 添加额外属性
            sect.id = `sect_${Date.now()}_${i}`;
            sect.attitude = this.generateAttitude(playerPower, sect.totalPower);
            sect.scouted = false; // 是否已侦查
            sect.challengeCount = 0; // 挑战次数
            sect.lastChallengeTime = 0; // 上次挑战时间
            
            sects.push(sect);
        }
        
        // 按战力排序
        sects.sort((a, b) => b.totalPower - a.totalPower);
        
        return sects;
    }
    
    // 生成特殊宗门
    generateSpecialSect(playerPower) {
        const specialSects = [
            {
                name: '紫霄剑宗',
                type: '剑修',
                description: '上古剑修大派，剑道通神',
                powerMultiplier: 1.5 + Math.random() * 0.5, // 150%-200%战力
                masterRealm: '化神后期',
                specialRewards: { spiritStones: 5000, reputation: 2000, technique: '紫霄剑诀' }
            },
            {
                name: '万魔殿',
                type: '魔道',
                description: '魔道至高殿堂，魔威滔天',
                powerMultiplier: 1.6 + Math.random() * 0.4, // 160%-200%战力
                masterRealm: '返虚中期',
                specialRewards: { spiritStones: 8000, reputation: 3000, technique: '万魔心经' }
            },
            {
                name: '天机阁',
                type: '阵修',
                description: '精通天机之术，阵法无双',
                powerMultiplier: 1.4 + Math.random() * 0.3, // 140%-170%战力
                masterRealm: '化神中期',
                specialRewards: { spiritStones: 6000, reputation: 2500, technique: '天机阵图' }
            },
            {
                name: '长生谷',
                type: '长生',
                description: '追求长生不老，寿元悠长',
                powerMultiplier: 1.3 + Math.random() * 0.4, // 130%-170%战力
                masterRealm: '化神初期',
                specialRewards: { spiritStones: 4000, reputation: 1500, technique: '长生诀' }
            },
            {
                name: '血刀门',
                type: '刀修',
                description: '血刀霸道天下，杀戮成性',
                powerMultiplier: 1.45 + Math.random() * 0.35, // 145%-180%战力
                masterRealm: '化神后期',
                specialRewards: { spiritStones: 7000, reputation: 2800, technique: '血刀大法' }
            }
        ];
        
        const selectedSect = specialSects[Math.floor(Math.random() * specialSects.length)];
        const targetPower = playerPower * selectedSect.powerMultiplier;
        
        // 生成特殊宗门宗主
        const master = {
            name: this.generateSpecialNPCName(selectedSect.type),
            realm: selectedSect.masterRealm,
            power: this.calculateNPCPower(selectedSect.masterRealm, selectedSect.type),
            type: selectedSect.type
        };
        
        // 生成精英弟子
        const discipleCount = 8 + Math.floor(Math.random() * 12); // 8-20个精英弟子
        const disciples = [];
        for (let i = 0; i < discipleCount; i++) {
            const disciple = this.generateEliteDisciple(selectedSect.masterRealm, targetPower * 0.5 / discipleCount);
            disciples.push(disciple);
        }
        
        // 计算总战力
        const disciplePower = disciples.reduce((sum, d) => sum + d.power, 0);
        const totalPower = Math.floor(master.power * 2.5 + disciplePower); // 特殊宗门权威系数2.5
        
        return {
            ...selectedSect,
            id: `special_sect_${Date.now()}`,
            master: master,
            disciples: disciples,
            totalPower: totalPower,
            reputation: Math.floor(totalPower * (0.8 + Math.random() * 0.4)), // 特殊宗门声望更高
            attitude: 'hostile', // 特殊宗门默认敌对
            scouted: false,
            challengeCount: 0,
            lastChallengeTime: 0,
            isSpecial: true // 标记为特殊宗门
        };
    }
    
    // 生成特殊NPC姓名
    generateSpecialNPCName(type) {
        const specialNames = {
            '剑修': ['剑无尘', '剑心通明', '剑破苍穹', '剑绝天下'],
            '魔道': ['魔天尊', '魔无极', '魔噬乾坤', '魔霸九天'],
            '阵修': ['阵法天师', '阵通玄机', '阵破万法', '阵御天地'],
            '长生': ['长生真人', '寿元无尽', '不死仙尊', '永恒道君'],
            '刀修': ['刀霸天下', '刀破山河', '刀绝九幽', '刀噬神魔']
        };
        
        const names = specialNames[type] || ['玄天道人', '神秘高人', '无敌剑仙', '绝世魔尊'];
        return names[Math.floor(Math.random() * names.length)];
    }
    
    // 生成精英弟子
    generateEliteDisciple(masterRealm, targetPower) {
        const discipleRealm = this.getEliteDiscipleRealm(masterRealm);
        return {
            name: this.generateSpecialNPCName('剑修'), // 精英弟子都用酷炫名字
            realm: discipleRealm,
            power: this.calculateNPCPower(discipleRealm, '精英'),
            type: '精英弟子'
        };
    }
    
    // 获取精英弟子境界
    getEliteDiscipleRealm(masterRealm) {
        const masterIndex = REALMS.indexOf(masterRealm);
        const eliteIndex = Math.max(0, masterIndex - 3 + Math.floor(Math.random() * 3)); // 比宗主低3-5级
        return REALMS[eliteIndex] || '筑基期';
    }
    
    // 生成NPC宗门
    generateNPCSect(playerPower) {
        const powerVariation = 0.3 + Math.random() * 0.4; // 30%-70%的浮动
        const targetPower = playerPower * powerVariation;
        
        // 随机选择宗门类型
        const sectTypes = ['剑修', '法修', '魔道', '长生', '刀修', '符修', '丹修', '阵修'];
        const type = sectTypes[Math.floor(Math.random() * sectTypes.length)];
        
        // 生成宗主
        const masterRealm = this.getRandomRealmForPower(targetPower * 0.6); // 宗主占60%战力
        const master = {
            name: this.generateNPCName(),
            realm: masterRealm,
            power: this.calculateNPCPower(masterRealm, type),
            type: type
        };
        
        // 生成弟子
        const discipleCount = 3 + Math.floor(Math.random() * 12); // 3-15个弟子
        const disciples = [];
        for (let i = 0; i < discipleCount; i++) {
            const disciple = this.generateNPCDisciple(masterRealm, targetPower * 0.4 / discipleCount);
            disciples.push(disciple);
        }
        
        // 计算总战力
        const disciplePower = disciples.reduce((sum, d) => sum + d.power, 0);
        const totalPower = Math.floor(master.power * 2.0 + disciplePower); // 宗主权威系数2.0
        
        return {
            name: this.generateSectName(type),
            type: type,
            tier: this.getSectTierByRealm(masterRealm),
            master: master,
            disciples: disciples,
            totalPower: totalPower,
            reputation: Math.floor(totalPower * (0.5 + Math.random() * 0.5)), // 声望在战力的50%-100%之间
            attitude: this.generateAttitude(playerPower, totalPower), // 对玩家的态度
            lastUpdate: Date.now()
        };
    }
    
    // 生成NPC姓名
    generateNPCName() {
        const surnames = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
        const names = ['明', '华', '强', '芳', '军', '敏', '静', '丽', '勇', '艳'];
        return surnames[Math.floor(Math.random() * surnames.length)] + 
               names[Math.floor(Math.random() * names.length)];
    }
    
    // 生成宗门名称
    generateSectName(type) {
        const prefixes = {
            '剑修': ['剑', '锋', '刃', '鞘'],
            '法修': ['法', '术', '符', '咒'],
            '魔道': ['魔', '血', '魂', '鬼'],
            '长生': ['长', '生', '寿', '命'],
            '刀修': ['刀', '斩', '劈', '砍'],
            '符修': ['符', '印', '阵', '图'],
            '丹修': ['丹', '药', '鼎', '炉'],
            '阵修': ['阵', '图', '局', '界']
        };
        
        const suffixes = ['宗', '门', '派', '阁', '宫', '府', '庄', '山'];
        const prefixList = prefixes[type] || ['玄', '天', '地', '人'];
        
        const prefix = prefixList[Math.floor(Math.random() * prefixList.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return prefix + suffix;
    }
    
    // 根据战力获取随机境界
    getRandomRealmForPower(targetPower) {
        const realmPowers = REALMS.map((realm, index) => ({
            realm: realm,
            power: this.calculateNPCPower(realm, '剑修') // 简化计算
        }));
        
        // 找到最接近的境界
        let closestRealm = '凡人';
        let minDiff = Infinity;
        
        realmPowers.forEach(rp => {
            const diff = Math.abs(rp.power - targetPower);
            if (diff < minDiff) {
                minDiff = diff;
                closestRealm = rp.realm;
            }
        });
        
        return closestRealm;
    }
    
    // 计算NPC战力
    calculateNPCPower(realm, type) {
        const realmIndex = REALMS.indexOf(realm);
        let basePower = 100;
        
        if (realmIndex > 0) {
            basePower += realmIndex * 80;
        }
        
        // 类型加成
        const typeBonus = this.getSectStyleBonus(type);
        basePower *= typeBonus;
        
        return Math.floor(basePower);
    }
    
    // 生成NPC弟子
    generateNPCDisciple(masterRealm, targetPower) {
        const realmVariation = -5 + Math.random() * 10; // ±5个境界浮动
        const masterIndex = REALMS.indexOf(masterRealm);
        const discipleIndex = Math.max(0, Math.min(REALMS.length - 1, masterIndex + realmVariation));
        const discipleRealm = REALMS[discipleIndex];
        
        return {
            name: this.generateNPCName(),
            realm: discipleRealm,
            power: this.calculateNPCPower(discipleRealm, '普通'),
            talent: 70 + Math.random() * 30 // 70-100天赋
        };
    }
    
    // 根据境界获取宗门层级
    getSectTierByRealm(realm) {
        const realmIndex = REALMS.indexOf(realm);
        
        if (realmIndex === 0) return '隐世草庐';
        if (realmIndex <= 10) return '修仙家族';
        if (realmIndex <= 20) return '不入流宗门';
        if (realmIndex <= 30) return '三流宗门';
        if (realmIndex <= 40) return '二流宗门';
        if (realmIndex <= 50) return '一流宗门';
        return '顶级宗门';
    }
    
    // 生成对玩家的态度
    generateAttitude(playerPower, sectPower) {
        const powerRatio = playerPower / sectPower;
        
        if (powerRatio > 2) {
            // 玩家战力远超对方，对方倾向于友好
            return Math.random() < 0.7 ? 'friendly' : 'neutral';
        } else if (powerRatio > 1.5) {
            // 玩家战力较强
            return Math.random() < 0.5 ? 'friendly' : 'neutral';
        } else if (powerRatio > 0.8) {
            // 实力相当
            return Math.random() < 0.3 ? 'friendly' : (Math.random() < 0.6 ? 'neutral' : 'hostile');
        } else {
            // 玩家战力较弱
            return Math.random() < 0.2 ? 'friendly' : (Math.random() < 0.5 ? 'neutral' : 'hostile');
        }
    }
    
    // 初始化游戏
    async init() {
        console.log('初始化游戏...');
        
        // 🔄 初始化页面可见性API
        this.initializePageVisibility();
        
        // 设置开始按钮事件
        this.setupStartButton();
        
        // 检查是否有存档
        if (hasSaveData()) {
            this.checkLoadSave();
        }
        
        console.log('游戏初始化完成');
    }
    
    // 🔄 初始化页面可见性API
    initializePageVisibility() {
        // 设置页面可见性变化监听
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
        
        // 设置窗口焦点变化监听
        window.addEventListener('focus', () => {
            this.handleWindowFocus();
        });
        
        window.addEventListener('blur', () => {
            this.handleWindowBlur();
        });
        
        console.log('页面可见性API已初始化');
    }
    
    // 处理页面可见性变化
    handleVisibilityChange() {
        const wasVisible = this.isVisible;
        this.isVisible = !document.hidden;
        
        console.log(`页面可见性变化: ${wasVisible} -> ${this.isVisible}`);
        
        if (!wasVisible && this.isVisible) {
            // 页面从不可见变为可见，需要补偿时间
            this.compensateTime();
        }
    }
    
    // 处理窗口获得焦点
    handleWindowFocus() {
        if (!this.isVisible) {
            this.isVisible = true;
            console.log('窗口获得焦点，页面变为可见');
            this.compensateTime();
        }
    }
    
    // 处理窗口失去焦点
    handleWindowBlur() {
        if (this.isVisible) {
            this.isVisible = false;
            console.log('窗口失去焦点，页面变为不可见');
        }
    }
    
    // 补偿时间差
    compensateTime() {
        const now = Date.now();
        const timeDiff = now - this.lastTickTime;
        
        if (timeDiff > GAME_CONFIG.AUTO_GAIN_INTERVAL * 2) {
            // 如果时间差超过2个心跳周期，需要补偿
            this.accumulatedTime += timeDiff;
            console.log(`补偿时间差: ${timeDiff}ms, 累积时间: ${this.accumulatedTime}ms`);
            
            // 立即处理累积的时间
            this.processAccumulatedTime();
        }
        
        this.lastTickTime = now;
    }
    
    // 处理累积的时间
    processAccumulatedTime() {
        if (this.accumulatedTime <= 0) return;
        
        const tickInterval = GAME_CONFIG.AUTO_GAIN_INTERVAL;
        const ticksToProcess = Math.floor(this.accumulatedTime / tickInterval);
        
        if (ticksToProcess > 0) {
            console.log(`处理${ticksToProcess}个心跳周期的累积时间`);
            
            // 限制最大处理数量，避免一次性处理太多
            const maxTicks = Math.min(ticksToProcess, 60); // 最多处理60秒的累积时间
            
            for (let i = 0; i < maxTicks; i++) {
                this.gameTick();
            }
            
            this.accumulatedTime -= maxTicks * tickInterval;
            
            // 更新显示
            updateDisplay(gameState);
            
            addLog(`[系统] 欢迎回来！已补偿${maxTicks}秒的游戏进度`, 'text-blue-400');
        }
    }
    
    // 设置开始按钮
    setupStartButton() {
        const startBtn = document.getElementById('startBtn');
        if (!startBtn) {
            console.error('找不到开始按钮');
            return;
        }
        
        startBtn.addEventListener('click', () => this.startNewGame());
    }
    
    // 检查是否加载存档
    checkLoadSave() {
        if (confirm('检测到存档，是否加载之前的游戏进度？\n点击"确定"加载存档，点击"取消"开始新游戏。')) {
            this.loadSavedGame();
        }
    }
    
    // 开始新游戏
    startNewGame() {
        const formData = getFormData();
        
        if (!validateForm(formData)) {
            alert('[系统] 请填写宗门名称和玩家姓名！');
            return;
        }
        
        console.log('开始新游戏:', formData);
        
        // 重置游戏状态
        resetGame();
        
        // 设置玩家信息
        Object.assign(gameState, formData);
        gameState.playerRealm = '凡人';
        
        // 创建初始弟子
        for (let i = 0; i < 3; i++) {
            gameState.disciples.push(new Disciple(true));
        }
        
        // 显示游戏界面
        showGameContainer();
        
        // 更新显示
        updateDisplay(gameState);
        
        // 添加初始日志
        addLog(`[系统] ${gameState.playerName} 创立了 ${gameState.sectName}，修仙之路自此开启。`, 'text-amber-200');
        addLog(`[系统] 天降3名弟子加入宗门，愿与宗门共修仙道。`, 'text-blue-400');
        
        // 🏛️ 初始化实力至上系统
        this.calculateTotalPower();
        this.updateSectAura();
        this.initializeRegion();
        
        const sectTier = this.getSectTier();
        addLog(`[宗门] ${gameState.sectName}被认定为${sectTier}，总战力：${gameState.totalPower}`, 'text-purple-400');
        
        // 启动游戏循环
        this.startGameLoop();
        
        console.log('新游戏开始');
    }
    
    // 加载存档
    loadSavedGame() {
        if (!loadGame()) {
            alert('存档加载失败，将开始新游戏。');
            this.startNewGame();
            return;
        }
        
        // 重新构建弟子对象
        gameState.disciples = gameState.disciples.map(d => {
            const disciple = new Disciple();
            Object.assign(disciple, d);
            return disciple;
        });
        
        // 数据迁移 - 修复天赋词条格式
        gameState.disciples.forEach(disciple => {
            if (disciple.traits && disciple.traits.length > 0) {
                // 检查是否是旧格式（对象）
                if (typeof disciple.traits[0] === 'object' && disciple.traits[0].name) {
                    disciple.traits = disciple.traits.map(trait => trait.name);
                    console.log(`迁移弟子 ${disciple.name} 的天赋词条数据`);
                }
            }
        });
        
        // 显示游戏界面
        showGameContainer();
        
        // 更新显示
        updateDisplay(gameState);
        
        // 🏛️ 初始化实力至上系统
        this.calculateTotalPower();
        this.updateSectAura();
        this.initializeRegion();
        
        addLog('[系统] 游戏存档已加载。', 'text-amber-200');
        
        // 启动游戏循环
        this.startGameLoop();
        
        console.log('存档加载完成');
    }
    
    // 启动游戏循环
    startGameLoop() {
        if (this.isRunning) {
            console.log('游戏循环已在运行');
            return;
        }
        
        this.isRunning = true;
        this.lastTickTime = Date.now();
        console.log('启动游戏循环...');
        
        // 设置按钮事件监听器
        this.setupGameButtons();
        
        // 启动主心跳（每秒触发）
        this.gameLoop = setInterval(() => {
            if (this.isVisible) {
                this.gameTick();
                this.lastTickTime = Date.now();
            } else {
                // 页面不可见时，累积时间差
                const now = Date.now();
                this.accumulatedTime += now - this.lastTickTime;
                this.lastTickTime = now;
            }
        }, GAME_CONFIG.AUTO_GAIN_INTERVAL);
        
        // 启动自动存档
        this.autoSaveInterval = setInterval(() => saveGame(), GAME_CONFIG.AUTO_SAVE_INTERVAL);
        
        // 启动弟子事件系统
        this.startDiscipleEvents();
        
        console.log('游戏循环启动完成');
    }
    
    // 停止游戏循环
    stopGameLoop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
        
        console.log('游戏循环已停止');
    }
    
    // 游戏主心跳（每秒触发）
    gameTick() {
        gameState.gameTick++;
        gameState.gameTime++;
        
        // 更新时间系统（每分钟算一个游戏时间单位）
        this.updateTime();
        
        // 自动增益
        this.processAutoGain();
        
        // 检查踢馆事件
        this.checkInvasion(Date.now());
        
        // 检查集体事件
        this.checkCollectiveEvents();
        
        // 检查弟子冲突
        this.checkDiscipleConflicts();
        
        // 检查定期入侵事件（每120秒检查一次）
        this.checkPeriodicInvasion();
        
        // 检查宗门升级
        this.checkSectUpgrade();
        
        // 每10个tick显示一次心跳信息（调试用）
        if (gameState.gameTick % 10 === 0) {
            console.log(`游戏心跳: ${gameState.gameTick}, 灵石: ${gameState.spiritStones.toFixed(1)}`);
        }
    }
    
    // 检查定期入侵事件
    checkPeriodicInvasion() {
        // 每120秒（120个tick）检查一次
        if (gameState.gameTick % 120 !== 0) return;
        
        // 弟子数量少于5个时不触发入侵
        const aliveDisciples = gameState.disciples.filter(d => d.alive);
        if (aliveDisciples.length < 5) return;
        
        // 30%概率触发入侵事件
        if (Math.random() > 0.3) return;
        
        // 随机选择入侵类型
        const invasionTypes = ['demon', 'beast'];
        const invasionType = invasionTypes[Math.floor(Math.random() * invasionTypes.length)];
        
        if (invasionType === 'demon') {
            this.triggerDemonInvasion(aliveDisciples);
        } else {
            this.triggerBeastTide(aliveDisciples);
        }
    }
    
    // 触发魔门入侵
    triggerDemonInvasion(aliveDisciples) {
        const demonSects = [
            { name: '血魔宗', description: '修炼血魔功的邪派宗门', powerMultiplier: 0.5 },
            { name: '天魔教', description: '信奉天魔的邪恶组织', powerMultiplier: 0.6 },
            { name: '幽魂殿', description: '收集魂魄的阴邪宗门', powerMultiplier: 0.55 },
            { name: '万毒门', description: '用毒之术冠绝天下', powerMultiplier: 0.45 }
        ];
        
        const demonSect = demonSects[Math.floor(Math.random() * demonSects.length)];
        const invasionPower = gameState.totalPower * demonSect.powerMultiplier;
        
        addLog(`[入侵] ⚠️ ${demonSect.name}来袭！${demonSect.description}`, 'text-red-600 font-bold');
        addLog(`[入侵] 敌方战力约：${Math.floor(invasionPower)}，我方战力：${gameState.totalPower}`, 'text-red-400');
        
        // 生成敌方弟子
        const enemyDisciples = this.generateEnemyDisciples(invasionPower, demonSect.name);
        
        // 执行战斗
        this.executeInvasionBattle(aliveDisciples, enemyDisciples, '魔门入侵');
    }
    
    // 触发兽潮入侵
    triggerBeastTide(aliveDisciples) {
        const beastTypes = [
            { name: '妖狼群', description: '凶猛的妖狼群体', powerMultiplier: 0.5 },
            { name: '毒蛇潮', description: '剧毒的毒蛇群', powerMultiplier: 0.45 },
            { name: '鹰群来袭', description: '从天而降的妖鹰群', powerMultiplier: 0.55 },
            { name: '猛虎下山', description: '强大的猛虎群体', powerMultiplier: 0.6 }
        ];
        
        const beastType = beastTypes[Math.floor(Math.random() * beastTypes.length)];
        const invasionPower = gameState.totalPower * beastType.powerMultiplier;
        
        addLog(`[兽潮] 🐯 ${beastType.name}来袭！${beastType.description}`, 'text-orange-600 font-bold');
        addLog(`[兽潮] 兽潮战力约：${Math.floor(invasionPower)}，我方战力：${gameState.totalPower}`, 'text-orange-400');
        
        // 生成妖兽
        const enemyDisciples = this.generateEnemyDisciples(invasionPower, beastType.name, true);
        
        // 执行战斗
        this.executeInvasionBattle(aliveDisciples, enemyDisciples, '兽潮入侵');
    }
    
    // 生成敌方弟子/妖兽
    generateEnemyDisciples(totalPower, factionName, isBeast = false) {
        const enemies = [];
        const enemyCount = Math.floor(Math.random() * 3) + 2; // 2-4个敌人
        
        if (isBeast) {
            // 妖兽名称库 - 按实力等级分类
            const beastNamesByLevel = {
                // 凡兽-一阶妖兽
                low: [
                    '幼狼', '小狐', '野兔', '山猫', '野猪',
                    '麻雀', '松鼠', '野鸡', '青蛙', '蛇'
                ],
                
                // 二阶-三阶妖兽
                mid: [
                    '炎虎妖君', '炽焰熊君', '青牛妖君', '黑蛟妖君', '金狮妖君',
                    '银狼妖君', '赤虎妖君', '玄龟妖君', '白象妖君', '苍鹰妖君',
                    '巫山妖王', '血月妖王', '幽谷妖王', '雷泽妖王', '风林妖王',
                    '三尾妖狐', '九幽冥狼', '烈焰雄狮', '冰霜巨熊', '雷霆巨鹰'
                ],
                
                // 四阶-五阶妖兽
                high: [
                    '黑甲犀尊', '铁臂猿尊', '碧眼狐尊', '金翅雕尊', '墨鳞蛟尊',
                    '北原兽王', '南疆兽王', '西域兽王', '东海兽王', '中州兽王',
                    '苍山之主', '幽谷之主', '雷泽之主', '风林之主', '冰原之主',
                    '深渊魔蛟', '暗影毒蝎', '血瞳妖虎', '金翅大鹏', '墨玉麒麟'
                ]
            };
            
            // 根据总战力确定主要等级
            let mainLevel = 'mid';
            if (totalPower < 1500) {
                mainLevel = 'low';
            } else if (totalPower > 6000) {
                mainLevel = 'high';
            }
            
            // 随机选择不重复的妖兽名称
            const selectedNames = [];
            const tempNames = [...beastNamesByLevel[mainLevel]];
            
            // 如果主要等级名称不够，从其他等级补充
            if (tempNames.length < enemyCount) {
                const otherLevels = ['low', 'mid', 'high'].filter(level => level !== mainLevel);
                otherLevels.forEach(level => {
                    tempNames.push(...beastNamesByLevel[level]);
                });
            }
            
            for (let i = 0; i < enemyCount && tempNames.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * tempNames.length);
                selectedNames.push(tempNames[randomIndex]);
                tempNames.splice(randomIndex, 1);
            }
            
            // 生成妖兽
            selectedNames.forEach((beastName, i) => {
                const enemyPower = totalPower / enemyCount * (0.8 + Math.random() * 0.4);
                
                // 根据妖兽名称确定境界
                let realm;
                if (beastNamesByLevel.low.includes(beastName)) {
                    realm = this.getRandomBeastRealm(enemyPower * 0.7); // 低级妖兽
                } else if (beastNamesByLevel.high.includes(beastName)) {
                    realm = this.getRandomBeastRealm(enemyPower * 1.3); // 高级妖兽
                } else {
                    realm = this.getRandomBeastRealm(enemyPower); // 中级妖兽
                }
                
                enemies.push({
                    name: beastName,
                    power: Math.floor(enemyPower),
                    type: '妖兽',
                    realm: realm
                });
            });
            
        } else {
            // 魔修弟子名称库 - 按实力等级分类
            const demonNamesByLevel = {
                // 凡人-炼气期
                low: [
                    '血魔弟子', '天魔修士', '幽魂修士', '毒魔修士', '魔道修士',
                    '邪修士', '血煞修士', '魔焰弟子', '鬼影弟子', '毒炎弟子',
                    '魔门弟子', '血影修罗', '魔影狂徒', '魂魔狂徒', '毒影狂徒'
                ],
                
                // 筑基期
                mid: [
                    '血狱魔卒', '魔炎修罗', '幽冥修罗', '毒煞修罗', '魔宗狂徒',
                    '魔教修罗', '血海妖徒', '魔煞妖人', '鬼煞妖卒', '毒海妖人',
                    '魔界妖卒', '魔门精英', '魔道高手', '血影修罗', '魔影狂徒'
                ],
                
                // 金丹期及以上
                high: [
                    '魔宗护法', '魔教先锋', '血狱魔卒', '魔炎修罗', '幽冥修罗',
                    '毒煞修罗', '血海妖徒', '魔煞妖人', '鬼煞妖卒', '毒海妖人',
                    '魔门精英', '魔道高手', '魔宗护法', '魔教先锋', '血狱魔将'
                ]
            };
            
            // 根据总战力确定主要等级
            let mainLevel = 'mid';
            if (totalPower < 2000) {
                mainLevel = 'low';
            } else if (totalPower > 8000) {
                mainLevel = 'high';
            }
            
            // 随机选择不重复的魔修名称
            const selectedNames = [];
            const tempNames = [...demonNamesByLevel[mainLevel]];
            
            // 如果主要等级名称不够，从其他等级补充
            if (tempNames.length < enemyCount) {
                const otherLevels = ['low', 'mid', 'high'].filter(level => level !== mainLevel);
                otherLevels.forEach(level => {
                    tempNames.push(...demonNamesByLevel[level]);
                });
            }
            
            for (let i = 0; i < enemyCount && tempNames.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * tempNames.length);
                selectedNames.push(tempNames[randomIndex]);
                tempNames.splice(randomIndex, 1);
            }
            
            // 生成魔修弟子
            selectedNames.forEach((demonName, i) => {
                const enemyPower = totalPower / enemyCount * (0.6 + Math.random() * 0.4);
                
                // 根据名称确定境界
                let realm;
                if (demonName.includes('弟子') || demonName.includes('修士')) {
                    realm = this.getRandomDemonRealm(enemyPower * 0.8); // 弱一些
                } else if (demonName.includes('狂徒') || demonName.includes('修罗')) {
                    realm = this.getRandomDemonRealm(enemyPower); // 正常
                } else if (demonName.includes('魔卒') || demonName.includes('妖人') || demonName.includes('妖卒')) {
                    realm = this.getRandomDemonRealm(enemyPower * 1.1); // 强一些
                } else if (demonName.includes('精英') || demonName.includes('高手') || demonName.includes('护法') || demonName.includes('先锋')) {
                    realm = this.getRandomDemonRealm(enemyPower * 1.2); // 更强
                } else {
                    realm = this.getRandomDemonRealm(enemyPower); // 默认
                }
                
                enemies.push({
                    name: demonName,
                    power: Math.floor(enemyPower),
                    type: '魔修',
                    realm: realm
                });
            });
        }
        
        return enemies;
    }
    
    // 获取随机妖兽境界
    getRandomBeastRealm(power) {
        if (power < 500) return '凡兽';
        if (power < 1500) return '一阶妖兽';
        if (power < 3000) return '二阶妖兽';
        if (power < 6000) return '三阶妖兽';
        if (power < 10000) return '四阶妖兽';
        return '五阶妖兽';
    }
    
    // 获取随机魔修境界
    getRandomDemonRealm(power) {
        if (power < 800) return '炼气期';
        if (power < 2000) return '筑基期';
        if (power < 4000) return '金丹期';
        if (power < 8000) return '元婴期';
        if (power < 15000) return '化神期';
        return '返虚期';
    }
    
    // 执行入侵战斗
    executeInvasionBattle(ourDisciples, enemyDisciples, invasionType) {
        const battleLog = [];
        let ourTotalPower = ourDisciples.reduce((sum, d) => sum + d.getCombatPower(), 0);
        let enemyTotalPower = enemyDisciples.reduce((sum, e) => sum + e.power, 0);
        
        battleLog.push(`[战斗] ${invasionType}战斗开始！`);
        battleLog.push(`[战斗] 我方参战弟子：${ourDisciples.length}人，总战力：${ourTotalPower}`);
        battleLog.push(`[战斗] 敌方参战单位：${enemyDisciples.length}个，总战力：${enemyTotalPower}`);
        
        // 检查是否还有弟子存活
        if (ourDisciples.length === 0) {
            // 所有弟子都战死了，玩家亲自出战
            battleLog.push(`[绝境] 💀 所有弟子都已战死，${gameState.playerName}必须亲自出战！`);
            battleLog.push(`[绝境] 这是最后的防线，${gameState.playerName}手持神兵，准备决一死战！`);
            
            const playerVictory = this.executePlayerBattle(enemyDisciples, battleLog);
            
            if (playerVictory) {
                battleLog.push(`[奇迹] 🌟 ${gameState.playerName}以一人之力击退了${invasionType}！`);
                battleLog.push(`[奇迹] 这是传说中的奇迹，${gameState.playerName}威名震慑四方！`);
                
                // 玩家胜利的奖励
                const spiritStonesReward = Math.floor(enemyTotalPower * 0.2);
                const reputationReward = Math.floor(enemyTotalPower * 0.1);
                
                gameState.spiritStones += spiritStonesReward;
                gameState.reputation += reputationReward;
                
                battleLog.push(`[奖励] 获得${spiritStonesReward}灵石，${reputationReward}声望`);
            } else {
                // 玩家战败，游戏结束
                battleLog.push(`[终焉] 💔 ${gameState.playerName}力战不敌，最终倒在了${invasionType}的围攻之下...`);
                battleLog.push(`[终焉] 宗门覆灭，传承断绝，一切都结束了...`);
                
                // 记录到宗门见闻
                this.recordInvasionToHistory(battleLog, invasionType);
                
                // 游戏结束
                this.triggerGameOver();
                return;
            }
        } else {
            // 正常的弟子战斗
            const battleResult = this.simulateIndividualBattles(ourDisciples, enemyDisciples, battleLog);
            
            // 处理战斗结果
            const ourSurvivors = battleResult.ourSurvivors;
            const ourCasualties = battleResult.ourCasualties;
            const enemySurvivors = battleResult.enemySurvivors;
            const enemyCasualties = battleResult.enemyCasualties;
            
            // 判断胜负
            const victory = ourSurvivors.length > 0 && (enemySurvivors.length === 0 || ourSurvivors.length > enemySurvivors.length);
            
            if (victory) {
                battleLog.push(`[胜利] 我方成功击退${invasionType}！`);
                
                // 移除牺牲的弟子
                ourCasualties.forEach(casualty => {
                    const index = gameState.disciples.findIndex(d => d.id === casualty.id);
                    if (index > -1) {
                        gameState.disciples.splice(index, 1);
                    }
                });
                
                if (ourCasualties.length > 0) {
                    battleLog.push(`[损失] 不幸牺牲${ourCasualties.length}名弟子：${ourCasualties.map(d => d.name).join('、')}`);
                }
                
                // 获得奖励
                const spiritStonesReward = Math.floor(enemyTotalPower * 0.1);
                const reputationReward = Math.floor(enemyTotalPower * 0.05);
                
                gameState.spiritStones += spiritStonesReward;
                gameState.reputation += reputationReward;
                
                battleLog.push(`[奖励] 获得${spiritStonesReward}灵石，${reputationReward}声望`);
                
            } else {
                battleLog.push(`[战败] 我方败给了${invasionType}...`);
                
                // 移除牺牲的弟子
                ourCasualties.forEach(casualty => {
                    const index = gameState.disciples.findIndex(d => d.id === casualty.id);
                    if (index > -1) {
                        gameState.disciples.splice(index, 1);
                    }
                });
                
                battleLog.push(`[损失] 损失${ourCasualties.length}名弟子：${ourCasualties.map(d => d.name).join('、')}`);
                
                // 损失资源
                const spiritStonesLoss = Math.floor(gameState.spiritStones * 0.2);
                const reputationLoss = Math.floor(gameState.reputation * 0.1);
                
                gameState.spiritStones = Math.max(0, gameState.spiritStones - spiritStonesLoss);
                gameState.reputation = Math.max(0, gameState.reputation - reputationLoss);
                
                battleLog.push(`[损失] 损失${spiritStonesLoss}灵石，${reputationLoss}声望`);
            }
        }
        
        // 记录到宗门见闻
        this.recordInvasionToHistory(battleLog, invasionType);
        
        // 重新计算战力
        this.calculateTotalPower();
    }
    
    // 玩家亲自战斗
    executePlayerBattle(enemyDisciples, battleLog) {
        const playerPower = this.calculatePlayerPower();
        let playerHP = 100; // 玩家生命值
        let currentEnemyIndex = 0;
        
        battleLog.push(`[对决] ⚔️ ${gameState.playerName}(境界:${gameState.playerRealm}) VS 敌方${enemyDisciples.length}个单位`);
        battleLog.push(`[对决] 玩家战力：${playerPower}，生命值：${playerHP}`);
        
        // 逐个与敌人战斗
        while (currentEnemyIndex < enemyDisciples.length && playerHP > 0) {
            const enemy = enemyDisciples[currentEnemyIndex];
            let enemyHP = 100; // 敌人生命值
            
            battleLog.push(`[回合] 第${currentEnemyIndex + 1}回合：${gameState.playerName} VS ${enemy.name}(${enemy.realm})`);
            
            // 回合制战斗
            let round = 1;
            while (playerHP > 0 && enemyHP > 0 && round <= 10) { // 最多10回合
                // 玩家攻击
                const playerDamage = Math.floor(Math.random() * 30) + 10; // 10-40伤害
                const playerHitChance = Math.min(0.8, playerPower / (playerPower + enemy.power)); // 命中率
                
                if (Math.random() < playerHitChance) {
                    enemyHP -= playerDamage;
                    battleLog.push(`[攻击] 第${round}回合：${gameState.playerName}重创${enemy.name}，造成${playerDamage}点伤害！`);
                } else {
                    battleLog.push(`[攻击] 第${round}回合：${gameState.playerName}的攻击被${enemy.name}躲开！`);
                }
                
                if (enemyHP <= 0) break;
                
                // 敌人攻击
                const enemyDamage = Math.floor(Math.random() * 25) + 8; // 8-33伤害
                const enemyHitChance = Math.min(0.7, enemy.power / (playerPower + enemy.power)); // 命中率
                
                if (Math.random() < enemyHitChance) {
                    playerHP -= enemyDamage;
                    battleLog.push(`[反击] 第${round}回合：${enemy.name}反击${gameState.playerName}，造成${enemyDamage}点伤害！`);
                } else {
                    battleLog.push(`[反击] 第${round}回合：${enemy.name}的攻击被${gameState.playerName}躲开！`);
                }
                
                round++;
            }
            
            if (enemyHP <= 0) {
                battleLog.push(`[击杀] ${gameState.playerName}成功击杀了${enemy.name}！剩余生命值：${playerHP}`);
                currentEnemyIndex++;
            } else if (playerHP <= 0) {
                battleLog.push(`[战败] ${gameState.playerName}被${enemy.name}击败...`);
                break;
            } else {
                battleLog.push(`[平手] ${gameState.playerName}与${enemy.name}战成平手，各自后退！`);
                currentEnemyIndex++;
            }
        }
        
        // 判断最终结果
        const victory = playerHP > 0 && currentEnemyIndex === enemyDisciples.length;
        
        if (victory) {
            battleLog.push(`[胜利] 🎉 ${gameState.playerName}以一人之力击败了所有敌人！剩余生命值：${playerHP}`);
        } else {
            battleLog.push(`[失败] 💀 ${gameState.playerName}最终力竭而倒...击败了${currentEnemyIndex}个敌人`);
        }
        
        return victory;
    }
    
    // 触发游戏结束
    triggerGameOver() {
        // 停止游戏循环
        this.stopGameLoop();
        
        // 显示游戏结束界面
        const gameOverDiv = document.createElement('div');
        gameOverDiv.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
        gameOverDiv.innerHTML = `
            <div class="bg-slate-900 p-8 rounded-lg max-w-md text-center border-2 border-red-600">
                <h2 class="text-3xl font-bold text-red-500 mb-4">游戏结束</h2>
                <p class="text-gray-300 mb-4">
                    ${gameState.playerName}力战不敌，宗门覆灭。<br>
                    传承断绝，一切都结束了...
                </p>
                <div class="text-left text-gray-400 mb-6">
                    <p>最终成就：</p>
                    <p>• 宗门名称：${gameState.sectName}</p>
                    <p>• 宗主境界：${gameState.playerRealm}</p>
                    <p>• 最终声望：${gameState.reputation}</p>
                    <p>• 存续时间：${gameState.currentDay}天</p>
                </div>
                <button onclick="location.reload()" class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded">
                    重新开始
                </button>
            </div>
        `;
        document.body.appendChild(gameOverDiv);
        
        addLog(`[游戏结束] ${gameState.playerName}的传奇故事到此结束...`, 'text-red-600 font-bold');
    }
    
    // 模拟个体化战斗
    simulateIndividualBattles(ourDisciples, enemyDisciples, battleLog) {
        const ourSurvivors = [...ourDisciples];
        const ourCasualties = [];
        const enemySurvivors = [...enemyDisciples];
        const enemyCasualties = [];
        
        battleLog.push(`[入侵] ⚔️ ${ourDisciples.length}名弟子迎战${enemyDisciples.length}个敌人！`);
        
        // 简化战斗：最多5回合
        const maxRounds = Math.min(5, Math.max(ourDisciples.length, enemyDisciples.length));
        
        for (let round = 1; round <= maxRounds; round++) {
            // 如果一方已经全部阵亡，战斗结束
            if (ourSurvivors.length === 0 || enemySurvivors.length === 0) break;
            
            // 随机选择我方和敌方单位
            const ourFighter = ourSurvivors[Math.floor(Math.random() * ourSurvivors.length)];
            const enemyFighter = enemySurvivors[Math.floor(Math.random() * enemySurvivors.length)];
            
            const ourPower = ourFighter.getCombatPower();
            const enemyPower = enemyFighter.power;
            
            // 生成战斗场景和对话
            this.generateBattleScene(ourFighter, enemyFighter, round, battleLog);
            
            // 计算个体战斗结果
            const ourWinChance = ourPower / (ourPower + enemyPower);
            const ourWins = Math.random() < ourWinChance;
            
            if (ourWins) {
                // 我方胜利，敌方单位阵亡
                this.generateVictoryScene(ourFighter, enemyFighter, round, battleLog);
                
                const enemyIndex = enemySurvivors.indexOf(enemyFighter);
                if (enemyIndex > -1) {
                    enemySurvivors.splice(enemyIndex, 1);
                    enemyCasualties.push(enemyFighter);
                }
            } else {
                // 敌方胜利，我方弟子阵亡
                this.generateDefeatScene(ourFighter, enemyFighter, round, battleLog);
                
                const ourIndex = ourSurvivors.indexOf(ourFighter);
                if (ourIndex > -1) {
                    ourSurvivors.splice(ourIndex, 1);
                    ourCasualties.push(ourFighter);
                }
            }
        }
        
        // 添加旁观者反应（简化）
        if (ourSurvivors.length > enemySurvivors.length) {
            battleLog.push(`[战况] 我方占据优势，周围修士纷纷点头称赞！`);
        } else if (ourSurvivors.length < enemySurvivors.length) {
            battleLog.push(`[战况] 形势不利，凡人百姓惊恐逃离！`);
        } else {
            battleLog.push(`[战况] 战况胶着，双方各有损伤！`);
        }
        
        // 判断胜负
        const victory = ourSurvivors.length > 0 && (enemySurvivors.length === 0 || ourSurvivors.length > enemySurvivors.length);
        
        if (victory) {
            battleLog.push(`[胜利] 🎉 成功击退入侵！`);
        } else {
            battleLog.push(`[战败] 💀 战败损失惨重...`);
        }
        
        return {
            ourSurvivors,
            ourCasualties,
            enemySurvivors,
            enemyCasualties
        };
    }
    
    // 生成战斗场景
    generateBattleScene(ourFighter, enemyFighter, round, battleLog) {
        const scenes = [
            () => {
                battleLog.push(`[场景] 第${round}回合：${ourFighter.name}手持长剑，剑光如虹，直指${enemyFighter.name}！`);
                battleLog.push(`[场景] ${enemyFighter.name}冷笑一声，魔气翻涌，形成黑色护盾！`);
            },
            () => {
                battleLog.push(`[场景] 第${round}回合：${ourFighter.name}脚踏七星步，身形如鬼魅般闪现！`);
                battleLog.push(`[场景] ${enemyFighter.name}瞳孔收缩，感受到了致命威胁！`);
            },
            () => {
                battleLog.push(`[场景] 第${round}回合：${ourFighter.name}大喝一声，全身灵力爆发！`);
                battleLog.push(`[场景] 空气中的灵气开始震动，${enemyFighter.name}面色凝重！`);
            },
            () => {
                battleLog.push(`[场景] 第${round}回合：${ourFighter.name}剑指苍天，风云变色！`);
                battleLog.push(`[场景] ${enemyFighter.name}感受到天地威压，不由后退半步！`);
            },
            () => {
                battleLog.push(`[场景] 第${round}回合：${ourFighter.name}眼中杀机毕现，气势如山！`);
                battleLog.push(`[场景] ${enemyFighter.name}浑身魔气沸腾，准备拼命一击！`);
            }
        ];
        
        const randomScene = scenes[Math.floor(Math.random() * scenes.length)];
        randomScene();
        
        // 添加嘴炮对话
        this.generateBattleDialogue(ourFighter, enemyFighter, battleLog);
    }
    
    // 生成战斗对话
    generateBattleDialogue(ourFighter, enemyFighter, battleLog) {
        const dialogues = [
            {
                our: [`"${ourFighter.name}：邪魔外道，今日就是你的死期！"`, `"${ourFighter.name}：为我宗门荣耀而战！"`],
                enemy: [`"${enemyFighter.name}：哈哈哈，不自量力！"`, `"${enemyFighter.name}：今天就让你见识真正的恐怖！"`]
            },
            {
                our: [`"${ourFighter.name}：你的魔功在我面前不堪一击！"`, `"${ourFighter.name}：正道永昌，邪道必亡！"`],
                enemy: [`"${enemyFighter.name}：天真，让我来撕碎你的幻想！"`, `"${enemyFighter.name}：你的血肉将成为我的养料！"`]
            },
            {
                our: [`"${ourFighter.name}：今日我若不死，他日必诛你九族！"`, `"${ourFighter.name}：接我这最强一击！"`],
                enemy: [`"${enemyFighter.name}：就凭你？可笑！"`, `"${enemyFighter.name}：让我看看你的骨气有多硬！"`]
            }
        ];
        
        const dialogueSet = dialogues[Math.floor(Math.random() * dialogues.length)];
        const ourDialogue = dialogueSet.our[Math.floor(Math.random() * dialogueSet.our.length)];
        const enemyDialogue = dialogueSet.enemy[Math.floor(Math.random() * dialogueSet.enemy.length)];
        
        battleLog.push(`[对话] ${ourDialogue}`);
        battleLog.push(`[对话] ${enemyDialogue}`);
    }
    
    // 生成胜利场景
    generateVictoryScene(ourFighter, enemyFighter, round, battleLog) {
        const victoryScenes = [
            () => {
                battleLog.push(`[胜利] 💥 ${ourFighter.name}剑光一闪，${enemyFighter.name}的魔气护盾瞬间破碎！`);
                battleLog.push(`[胜利] ${enemyFighter.name}难以置信地看着胸口的剑伤，缓缓倒下！`);
            },
            () => {
                battleLog.push(`[胜利] 🔥 ${ourFighter.name}祭出本命法宝，金光万丈！`);
                battleLog.push(`[胜利] ${enemyFighter.name}在金光中惨叫，化为飞灰！`);
            },
            () => {
                battleLog.push(`[胜利] ⚡ ${ourFighter.name}施展出绝技，天地变色！`);
                battleLog.push(`[胜利] ${enemyFighter.name}连惨叫都来不及，就被轰成碎片！`);
            },
            () => {
                battleLog.push(`[胜利] 🌟 ${ourFighter.name}眼中精光一闪，一指点出！`);
                battleLog.push(`[胜利] ${enemyFighter.name}眉心出现血洞，生机断绝！`);
            }
        ];
        
        const randomVictory = victoryScenes[Math.floor(Math.random() * victoryScenes.length)];
        randomVictory();
    }
    
    // 生成失败场景
    generateDefeatScene(ourFighter, enemyFighter, round, battleLog) {
        const defeatScenes = [
            () => {
                battleLog.push(`[战败] 💀 ${enemyFighter.name}魔爪一挥，黑色魔气吞噬了${ourFighter.name}！`);
                battleLog.push(`[战败] ${ourFighter.name}在魔气中挣扎，最终被腐蚀殆尽！`);
            },
            () => {
                battleLog.push(`[战败] 🩸 ${enemyFighter.name}的魔刀斩下，${ourFighter.name}勉强抵挡！`);
                battleLog.push(`[战败] 刀光过后，${ourFighter.name}身体分为两半，鲜血染红大地！`);
            },
            () => {
                battleLog.push(`[战败] ⚰️ ${enemyFighter.name}施展血魔大法，${ourFighter.name}全身血液被吸干！`);
                battleLog.push(`[战败] ${ourFighter.name}变成一具干尸，眼中还残留着不甘！`);
            },
            () => {
                battleLog.push(`[战败] 💔 ${ourFighter.name}被${enemyFighter.name}重创，灵脉寸断！`);
                battleLog.push(`[战败] ${ourFighter.name}吐血而亡，临死前还想着宗门安危！`);
            }
        ];
        
        const randomDefeat = defeatScenes[Math.floor(Math.random() * defeatScenes.length)];
        randomDefeat();
    }
    
    // 生成旁观者反应
    generateSpectatorReactions(ourSurvivors, enemySurvivors, round, battleLog) {
        if (Math.random() > 0.6) return; // 40%概率生成旁观者反应
        
        const reactions = [
            () => {
                if (ourSurvivors.length > 1) {
                    const spectator = ourSurvivors[Math.floor(Math.random() * ourSurvivors.length)];
                    battleLog.push(`[旁观] ${spectator.name}看到同伴的英勇表现，热血沸腾！`);
                }
            },
            () => {
                if (enemySurvivors.length > 1) {
                    const spectator = enemySurvivors[Math.floor(Math.random() * enemySurvivors.length)];
                    battleLog.push(`[旁观] ${spectator.name}狞笑着，似乎在享受这场杀戮！`);
                }
            },
            () => {
                battleLog.push(`[旁观] 周围的修士们看到如此惨烈的战斗，无不心惊胆战！`);
                battleLog.push(`[旁观] 有人开始担心，这样的战斗会不会波及到自己！`);
            },
            () => {
                battleLog.push(`[旁观] 远处的凡人看到剑光魔气，纷纷跪地祈祷！`);
                battleLog.push(`[旁观] 有人在议论，这是正邪大战的预兆！`);
            },
            () => {
                battleLog.push(`[旁观] 天空中的飞鸟被战斗余波震死，纷纷坠落！`);
                battleLog.push(`[旁观] 大地都在颤抖，仿佛在哀悼逝去的生命！`);
            }
        ];
        
        const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
        randomReaction();
    }
    
    // 生成战斗结束场景
    generateBattleEndScene(ourSurvivors, enemySurvivors, battleLog) {
        battleLog.push(`[终局] 🌅 战斗的硝烟渐渐散去...`);
        
        if (ourSurvivors.length > 0 && enemySurvivors.length === 0) {
            battleLog.push(`[终局] ✨ 我方弟子们虽然带伤，但眼中燃烧着胜利的火焰！`);
            battleLog.push(`[终局] 🏆 ${ourSurvivors.map(d => d.name).join('、')}等人相视一笑，今日大获全胜！`);
        } else if (ourSurvivors.length === 0 && enemySurvivors.length > 0) {
            battleLog.push(`[终局] 💀 敌方魔头们狂笑着，踩着我方弟子的尸体！`);
            battleLog.push(`[终局] 😢 ${enemySurvivors.map(e => e.name).join('、')}等准备继续肆虐！`);
        } else {
            battleLog.push(`[终局] ⚖️ 双方都损失惨重，各自收兵，暂时休战！`);
            battleLog.push(`[终局] 🤔 但所有人都知道，这只是更大风暴的前奏！`);
        }
        
        battleLog.push(`[统计] 📊 战斗结果：我方存活${ourSurvivors.length}人，敌方存活${enemySurvivors.length}个`);
    }
    
    // 根据宝物计算战斗力加成
    calculatePowerFromTreasure(treasureValue) {
        // 基础战斗力加成
        let basePower = treasureValue * 2; // 基础转化比例
        
        // 根据宗门实力调整加成
        const sectPower = gameState.totalPower;
        let powerMultiplier = 1.0;
        
        // 宗门实力越强，宝物效果相对越弱（避免过度膨胀）
        if (sectPower < 1000) {
            // 弱小宗门：宝物效果显著
            powerMultiplier = 1.5;
        } else if (sectPower < 5000) {
            // 中等宗门：宝物效果正常
            powerMultiplier = 1.0;
        } else if (sectPower < 20000) {
            // 强大宗门：宝物效果减弱
            powerMultiplier = 0.8;
        } else {
            // 超强宗门：宝物效果大幅减弱
            powerMultiplier = 0.5;
        }
        
        // 根据玩家境界调整
        const realmIndex = REALMS.indexOf(gameState.playerRealm);
        let realmMultiplier = 1.0;
        
        if (realmIndex <= 5) {
            // 凡人-炼气期：宝物效果显著
            realmMultiplier = 1.3;
        } else if (realmIndex <= 15) {
            // 筑基-金丹期：宝物效果正常
            realmMultiplier = 1.0;
        } else if (realmIndex <= 25) {
            // 元婴-化神期：宝物效果减弱
            realmMultiplier = 0.7;
        } else {
            // 返虚期及以上：宝物效果大幅减弱
            realmMultiplier = 0.4;
        }
        
        // 计算最终战斗力加成
        const finalPower = Math.floor(basePower * powerMultiplier * realmMultiplier);
        
        // 确保最小加成和最大加成
        const minPower = Math.max(5, Math.floor(sectPower * 0.01)); // 最少为宗门战力的1%，但不少于5点
        const maxPower = Math.floor(sectPower * 0.15); // 最多为宗门战力的15%
        
        return Math.max(minPower, Math.min(finalPower, maxPower));
    }
    
    // 计算伤亡
    calculateCasualties(disciples, casualtyRate) {
        const casualties = [];
        const casualtyCount = Math.floor(disciples.length * casualtyRate);
        
        // 随机选择伤亡弟子（优先选择战力较低的）
        const sortedDisciples = [...disciples].sort((a, b) => a.getCombatPower() - b.getCombatPower());
        
        for (let i = 0; i < casualtyCount && i < sortedDisciples.length; i++) {
            casualties.push(sortedDisciples[i]);
        }
        
        return casualties;
    }
    
    // 记录入侵到宗门见闻
    recordInvasionToHistory(battleLog, invasionType) {
        const timestamp = new Date().toLocaleTimeString('zh-CN');
        const historyEntry = {
            time: timestamp,
            type: invasionType,
            events: [...battleLog]
        };
        
        if (!gameState.invasionHistory) {
            gameState.invasionHistory = [];
        }
        
        gameState.invasionHistory.unshift(historyEntry);
        
        // 只保留最近10次入侵记录
        if (gameState.invasionHistory.length > 10) {
            gameState.invasionHistory = gameState.invasionHistory.slice(0, 10);
        }
        
        // 显示战斗日志
        battleLog.forEach(log => {
            if (log.includes('[胜利]')) {
                addLog(log, 'text-green-400 font-bold');
            } else if (log.includes('[战败]')) {
                addLog(log, 'text-red-400 font-bold');
            } else if (log.includes('[损失]')) {
                addLog(log, 'text-red-500');
            } else if (log.includes('[奖励]')) {
                addLog(log, 'text-green-500');
            } else {
                addLog(log, 'text-yellow-400');
            }
        });
    }
    
    // 更新时间系统
    updateTime() {
        gameState.gameTime++;
        
        // 每30分钟算一天
        if (gameState.gameTime % 30 === 0) {
            gameState.currentDay++;
            
            // 每30天算一个月
            if (gameState.currentDay > 30) {
                gameState.currentDay = 1;
                gameState.currentMonth++;
                
                // 每12个月算一年
                if (gameState.currentMonth > 12) {
                    gameState.currentMonth = 1;
                    gameState.currentYear++;
                    
                    // 年度事件
                    this.handleYearlyEvents();
                }
            }
            
            // 更新时间显示
            this.updateTimeDisplay();
        }
    }
    
    // 处理年度事件
    handleYearlyEvents() {
        addLog(`[时间] ${gameState.currentYear}年开始了！`, 'text-yellow-400');
        
        // 年度招徒活动
        if (gameState.currentYear > gameState.lastRecruitmentYear) {
            this.annualRecruitment();
            gameState.lastRecruitmentYear = gameState.currentYear;
        }
        
        // 年度总结
        this.annualSummary();
    }
    
    // 年度招徒活动
    annualRecruitment() {
        addLog(`[招徒] 年度招徒活动开始！长老们外出寻找有缘人...`, 'text-green-400');
        
        // 获取所有长老
        const elders = this.getAllElders();
        
        if (elders.length === 0) {
            addLog(`[招徒] 宗门暂无长老，无法进行招徒活动`, 'text-red-400');
            return;
        }
        
        let recruitedCount = 0;
        const maxRecruits = 2; // 最多招募2人
        
        elders.forEach(elder => {
            if (recruitedCount >= maxRecruits) return;
            
            // 长老招徒成功率（基于长老境界）
            const successRate = this.getRecruitmentSuccessRate(elder);
            
            if (Math.random() < successRate) {
                const newDisciple = this.recruitNewDisciple(elder);
                if (newDisciple) {
                    recruitedCount++;
                    addLog(`[招徒] ${elder.name}成功招募了${newDisciple.name}！天赋: ${newDisciple.talent.toFixed(1)}`, 'text-green-400');
                }
            } else {
                addLog(`[招徒] ${elder.name}外出寻徒，但未能找到合适的人选`, 'text-gray-400');
            }
        });
        
        if (recruitedCount > 0) {
            addLog(`[招徒] 年度招徒活动结束，共招募${recruitedCount}名新弟子`, 'text-green-400');
        } else {
            addLog(`[招徒] 年度招徒活动结束，未能招募到新弟子`, 'text-orange-400');
        }
    }
    
    // 获取所有长老
    getAllElders() {
        const elders = [];
        const positions = gameState.organization.positions;
        
        // 收集所有长老职位的人
        Object.entries(positions).forEach(([key, pos]) => {
            if (key.includes('Elder')) {
                pos.current.forEach(member => {
                    const disciple = gameState.disciples.find(d => d.id == member.id);
                    if (disciple && disciple.alive) {
                        elders.push(disciple);
                    }
                });
            }
        });
        
        return elders;
    }
    
    // 获取招徒成功率
    getRecruitmentSuccessRate(elder) {
        const realmIndex = this.getRealmIndex(elder.realm);
        
        // 基础成功率
        let baseRate = 0.3; // 30%基础成功率
        
        // 根据长老境界调整
        if (realmIndex >= 6) { // 炼虚期及以上
            baseRate = 0.6; // 60%成功率
        } else if (realmIndex >= 4) { // 元婴期及以上
            baseRate = 0.45; // 45%成功率
        } else if (realmIndex >= 2) { // 筑基期及以上
            baseRate = 0.35; // 35%成功率
        }
        
        return baseRate;
    }
    
    // 招募新弟子
    recruitNewDisciple(elder) {
        // 有概率招募到高天赋弟子
        const isHighTalent = Math.random() < 0.2; // 20%概率高天赋
        
        const newDisciple = new Disciple(false);
        
        if (isHighTalent) {
            // 高天赋弟子
            newDisciple.talent = 70 + Math.random() * 25; // 70-95天赋
            newDisciple.cultivation = Math.random() * 50; // 额外修为
        }
        
        // 添加到弟子列表
        gameState.disciples.push(newDisciple);
        
        return newDisciple;
    }
    
    // 年度总结
    annualSummary() {
        const totalDisciples = gameState.disciples.length;
        const aliveDisciples = gameState.disciples.filter(d => d.alive).length;
        const elders = this.getAllElders().length;
        
        addLog(`[年度] ${gameState.currentYear}年总结：`, 'text-yellow-400');
        addLog(`[年度] 宗门共有弟子${totalDisciples}人，其中存活${aliveDisciples}人`, 'text-yellow-400');
        addLog(`[年度] 长老${elders}人，灵石${Math.floor(gameState.spiritStones)}枚`, 'text-yellow-400');
    }
    
    // 更新时间显示
    updateTimeDisplay() {
        const timeDisplay = document.getElementById('timeDisplay');
        if (timeDisplay) {
            timeDisplay.textContent = `${gameState.currentYear}年${gameState.currentMonth}月${gameState.currentDay}日`;
        }
    }
    
    // 获取境界索引
    getRealmIndex(realm) {
        const realms = ['凡人', '炼气期', '筑基期', '金丹期', '元婴期', '化神期', '炼虚期', '合体期', '大乘期', '渡劫期', '仙人'];
        return realms.indexOf(realm);
    }
    
    // 处理自动增益
    processAutoGain() {
        const aliveDisciples = gameState.disciples.filter(d => d.alive && !d.injured);
        if (aliveDisciples.length > 0) {
            let totalGain = 0;
            
            aliveDisciples.forEach(disciple => {
                // 基础采集量
                let baseGain = GAME_CONFIG.AUTO_GAIN_PER_DISCIPLE;
                
                // 境界加成
                const realmIndex = this.getRealmIndex(disciple.realm);
                let realmBonus = 1.0;
                
                if (realmIndex >= 1) realmBonus = 1.2;      // 炼气期
                if (realmIndex >= 2) realmBonus = 1.5;      // 筑基期  
                if (realmIndex >= 3) realmBonus = 2.0;      // 金丹期
                if (realmIndex >= 4) realmBonus = 3.0;      // 元婴期
                if (realmIndex >= 5) realmBonus = 5.0;      // 化神期及以上
                
                // 天赋加成
                const talentBonus = 0.5 + (disciple.talent / 100); // 0.5-1.5倍
                
                // 计算单个弟子的贡献
                const discipleGain = Math.floor(baseGain * realmBonus * talentBonus * 10) / 10; // 保留一位小数
                totalGain += discipleGain;
            });
            
            // 弟子数量加成（鼓励多招收弟子）
            const discipleCountBonus = Math.min(2.0, 1.0 + (aliveDisciples.length - 1) * 0.1); // 最多2倍
            totalGain = Math.floor(totalGain * discipleCountBonus * 10) / 10; // 保留一位小数
            
            gameState.spiritStones += totalGain;
            console.log(`采集灵石: +${totalGain} (弟子数:${aliveDisciples.length}, 加成:${discipleCountBonus.toFixed(1)}x)`);
        }
        
        // 自动治疗受伤弟子
        this.autoHealInjuredDisciples();
    }
    
    // 自动治疗受伤弟子
    autoHealInjuredDisciples() {
        const injuredDisciples = gameState.disciples.filter(d => d.alive && d.injured);
        injuredDisciples.forEach(disciple => {
            // 根据受伤程度决定治疗成本
            const injuryLevel = Math.random(); // 0-1随机受伤程度
            let healCost = 0;
            let injuryType = '';
            
            if (injuryLevel < 0.3) {
                // 轻伤
                healCost = 3;
                injuryType = '轻伤';
            } else if (injuryLevel < 0.7) {
                // 中伤
                healCost = 8;
                injuryType = '中伤';
            } else {
                // 重伤
                healCost = 15;
                injuryType = '重伤';
            }
            
            // 检查是否有足够灵石治疗
            if (gameState.spiritStones >= healCost) {
                gameState.spiritStones -= healCost;
                disciple.injured = false;
                disciple.addPersonalLog(`[自动治疗] ${injuryType}已治愈，消耗${healCost}灵石`, Date.now());
                addLog(`[治疗] ${disciple.name}的${injuryType}已治愈，消耗${healCost}灵石`, 'text-green-400');
            } else {
                // 灵石不足，记录无法治疗
                disciple.addPersonalLog(`[治疗] ${injuryType}需要${healCost}灵石治疗，但宗门灵石不足`, Date.now());
            }
        });
    }
    
    // 启动弟子事件系统
    startDiscipleEvents() {
        setInterval(() => {
            if (!this.isRunning || !this.isVisible) return;
            
            const aliveDisciples = gameState.disciples.filter(d => d.alive && !d.injured && !d.onTask);
            if (aliveDisciples.length === 0) return;
            
            // 随机选择一个弟子触发事件
            const randomDisciple = aliveDisciples[Math.floor(Math.random() * aliveDisciples.length)];
            const event = randomDisciple.triggerAutonomousEvent(gameState.disciples, gameState.gameTick);
            
            if (event) {
                this.handleDiscipleEvent(event);
            }
        }, GAME_CONFIG.DISCIPLE_EVENT_INTERVAL);
    }
    
    // 处理弟子事件
    handleDiscipleEvent(event) {
        let colorClass = 'text-emerald-400';
        
        // 根据事件类型设置颜色
        if (event.type === 'death' || event.type === 'leave' || event.type.includes('injury')) {
            colorClass = 'text-red-400';
        } else if (event.type === 'cultivation' && event.message.includes('提升')) {
            colorClass = 'text-green-400';
        } else if (event.type === 'technique_fragment') {
            colorClass = 'text-purple-400';
        } else if (event.type === 'expedition') {
            colorClass = 'text-blue-400';
        } else if (event.type === 'expedition_negative') {
            colorClass = 'text-red-400';
        } else if (event.type === 'pill' || event.type === 'treasure' || event.type === 'weapon') {
            colorClass = 'text-yellow-400';
        }
        
        addLog(`[弟子] ${event.message}`, colorClass);
        
        // 应用奖励
        if (event.reward) {
            if (event.reward.spiritStones) {
                gameState.spiritStones += event.reward.spiritStones;
            }
            if (event.reward.breakthroughPills) {
                gameState.breakthroughPills += event.reward.breakthroughPills;
            }
            if (event.reward.reputation) {
                gameState.reputation += event.reward.reputation;
            }
            if (event.reward.techniqueFragment) {
                // 生成功法残本
                const fragment = generateTechniqueFragment();
                gameState.techniqueFragments = gameState.techniqueFragments || [];
                gameState.techniqueFragments.push(fragment);
                addLog(`[奇遇] 获得了《${fragment.name}》残本！`, 'text-purple-400');
            }
            if (event.reward.technique) {
                // 完整功法获得
                const disciple = gameState.disciples.find(d => d.id === event.discipleId);
                if (disciple) {
                    // 根据弟子境界选择合适的功法
                    const technique = this.getRandomTechniqueForDisciple(disciple);
                    disciple.learnTechnique(technique);
                    addLog(`[奇遇] ${disciple.name}获得了完整功法《${technique.name}》！`, 'text-purple-400 font-bold');
                }
            }
            if (event.reward.experience) {
                // 计算修炼速度加成
                const disciple = gameState.disciples.find(d => d.id === event.discipleId);
                if (disciple) {
                    let experienceGain = event.reward.experience;
                    
                    // 基于灵根的加成
                    const spiritRootBonus = this.getSpiritRootBonus(disciple.spiritRoot);
                    
                    // 基于体质的加成
                    const constitutionBonus = disciple.constitution?.cultivation || 1.0;
                    
                    // 基于天赋的加成
                    const talentBonus = 0.5 + (disciple.talent / 100); // 0.5-1.5倍
                    
                    // 全局效果加成
                    const globalBonus = gameState.globalEffects.cultivationBonus / gameState.globalEffects.cultivationPenalty;
                    
                    // 总加成
                    const totalBonus = spiritRootBonus * constitutionBonus * talentBonus * globalBonus;
                    experienceGain = Math.floor(experienceGain * totalBonus);
                    
                    // 应用修为
                    disciple.cultivation = Math.max(0, Math.min(100, disciple.cultivation + experienceGain));
                    
                    // 检查突破
                    if (disciple.cultivation >= 100) {
                        this.checkBreakthrough(disciple);
                    }
                    
                    // 显示修炼消息（只有正数才显示修炼相关消息）
                    if (experienceGain > 0) {
                        if (totalBonus > 1.5) {
                            addLog(`[修炼] ${disciple.name}修炼神速，获得${experienceGain}点修为！`, 'text-purple-400');
                        } else if (totalBonus > 1.0) {
                            addLog(`[修炼] ${disciple.name}修炼顺利，获得${experienceGain}点修为`, 'text-green-400');
                        } else {
                            addLog(`[修炼] ${disciple.name}获得${experienceGain}点修为`, 'text-blue-400');
                        }
                    } else if (experienceGain < 0) {
                        addLog(`[冲突] ${disciple.name}修为受损，减少${Math.abs(experienceGain)}点修为`, 'text-red-400');
                    }
                }
            }
            if (event.reward.consumeItem) {
                // 消耗宝库物品
                this.consumeTreasuryItem(event.reward.itemType);
            }
        }
        
        // 应用惩罚
        if (event.penalty) {
            if (event.penalty.spiritStones) {
                gameState.spiritStones = Math.max(0, gameState.spiritStones - event.penalty.spiritStones);
            }
            if (event.penalty.reputation) {
                gameState.reputation = Math.max(0, gameState.reputation + event.penalty.reputation);
            }
            if (event.penalty.injured) {
                const disciple = gameState.disciples.find(d => d.id === event.discipleId);
                if (disciple) {
                    disciple.injured = true;
                    disciple.injuryTime = Date.now();
                }
            }
        }
        
        updateDisplay(gameState);
    }
    
    // 获取灵根修炼加成
    getSpiritRootBonus(spiritRoot) {
        const bonuses = {
            '金': 1.0,    // 标准灵根
            '木': 1.1,    // 木系修炼稍快
            '水': 1.1,    // 水系修炼稍快
            '火': 1.2,    // 火系修炼较快
            '土': 1.0,    // 土系标准
            '雷': 1.3,    // 雷系修炼快
            '风': 1.2,    // 风系修炼较快
            '冰': 1.2,    // 冰系修炼较快
            '光': 1.4,    // 光系修炼很快
            '暗': 1.3     // 暗系修炼快
        };
        return bonuses[spiritRoot] || 1.0;
    }
    
    // 检查突破
    checkBreakthrough(disciple) {
        if (disciple.cultivation >= 100) {
            const currentRealmIndex = REALMS.indexOf(disciple.realm);
            if (currentRealmIndex < REALMS.length - 1) {
                // 计算突破成本（与玩家一致）
                const isMajorBreakthrough = currentRealmIndex % 9 === 8;
                const spiritStoneCost = (Math.floor(currentRealmIndex / 9) + 1) * GAME_CONFIG.BREAKTHROUGH_BASE_COST;
                const needsBreakthroughPill = isMajorBreakthrough;
                
                // 检查资源是否足够
                if (gameState.spiritStones >= spiritStoneCost && (!needsBreakthroughPill || gameState.breakthroughPills >= 1)) {
                    // 消耗资源
                    gameState.spiritStones -= spiritStoneCost;
                    if (needsBreakthroughPill) {
                        gameState.breakthroughPills -= 1;
                        addLog(`[突破] ${disciple.name}消耗${spiritStoneCost}灵石和1枚破境丹，成功突破到${REALMS[currentRealmIndex + 1]}！`, 'text-purple-400 font-bold');
                    } else {
                        addLog(`[突破] ${disciple.name}消耗${spiritStoneCost}灵石，成功突破到${REALMS[currentRealmIndex + 1]}！`, 'text-yellow-400 font-bold');
                    }
                    
                    // 执行突破
                    disciple.realm = REALMS[currentRealmIndex + 1];
                    disciple.cultivation = 0;
                    
                    // 刷新显示
                    updateDisplay(gameState);
                } else {
                    // 资源不足
                    if (needsBreakthroughPill && gameState.breakthroughPills < 1) {
                        addLog(`[突破] ${disciple.name}需要${spiritStoneCost}灵石和1枚破境丹才能突破到大境界！`, 'text-red-400');
                    } else {
                        addLog(`[突破] ${disciple.name}需要${spiritStoneCost}灵石才能突破！`, 'text-red-400');
                    }
                }
            } else {
                // 已达最高境界
                disciple.cultivation = 100;
                addLog(`[境界] ${disciple.name}已达到修炼巅峰！`, 'text-purple-400 font-bold');
            }
        }
    }
    
    // 消耗宝库物品
    consumeTreasuryItem(itemType) {
        const category = this.getCategoryByType(itemType);
        const items = gameState.treasury[category] || [];
        
        if (items.length > 0) {
            // 随机消耗一个物品
            const itemIndex = Math.floor(Math.random() * items.length);
            const item = items[itemIndex];
            
            if (item.quantity > 1) {
                item.quantity--;
            } else {
                items.splice(itemIndex, 1);
            }
            
            addLog(`[消耗] 弟子外出消耗了宝库中的《${item.name}》`, 'text-orange-400');
        } else {
            addLog(`[消耗] 宝库中暂无${itemType === 'pill' ? '丹药' : '武器'}可供消耗`, 'text-gray-400');
        }
    }
    
    // 根据物品类型获取分类
    getCategoryByType(type) {
        const categoryMap = {
            'pill': 'pills',
            'weapon': 'weapons',
            'material': 'materials',
            'tool': 'other',
            'book': 'other',
            'scroll': 'other'
        };
        return categoryMap[type] || 'other';
    }
    
    // 设置游戏按钮事件
    setupGameButtons() {
        try {
            console.log('设置游戏按钮事件...');
            setupButtonListeners({
                onCollect: () => this.handleCollect(),
                onBreakthrough: () => this.handleBreakthrough(),
                onRecruit: () => this.handleRecruit(),
                onTaskHall: () => this.handleTaskHall(),
                onMarket: () => this.handleMarket(),
                onAuction: () => this.handleAuction(),
                onTechniqueHall: () => this.handleTechniqueHall(),
                onTreasury: () => this.handleTreasury(),
                onPastRecords: () => this.handlePastRecords(),
                onEvents: () => this.handleEvents(),
                onRegion: () => this.handleRegion(),
                onChangeName: () => this.handleChangeName()
            });
            console.log('游戏按钮事件设置完成');
        } catch (error) {
            console.error('设置按钮事件时出错:', error);
        }
    }
    
    // 处理采集灵石
    handleCollect() {
        try {
            console.log('处理采集灵石...');
            const realmIndex = REALMS.indexOf(gameState.playerRealm);
            const efficiency = Math.pow(1.5, Math.floor(realmIndex / 9));
            const gain = Math.floor(efficiency);
            
            gameState.spiritStones += gain;
            updateDisplay(gameState);
            addLog(`[采集] ${gameState.playerName} 采集了${gain}枚灵石。`, 'text-emerald-400');
            
            console.log(`采集灵石: +${gain}`);
        } catch (error) {
            console.error('采集灵石时出错:', error);
        }
    }
    
    // 处理突破境界
    handleBreakthrough() {
        const currentIndex = REALMS.indexOf(gameState.playerRealm);
        const oldRealm = gameState.playerRealm;
        
        if (currentIndex >= REALMS.length - 1) {
            addLog('[突破] 已达最高境界，无法继续突破。', 'text-red-400');
            return;
        }
        
        if (currentIndex % 9 === 8) {
            // 需要破境丹突破到大境界
            if (gameState.breakthroughPills >= 1 && gameState.spiritStones >= GAME_CONFIG.BREAKTHROUGH_BASE_COST) {
                gameState.breakthroughPills -= 1;
                gameState.spiritStones -= GAME_CONFIG.BREAKTHROUGH_BASE_COST;
                gameState.playerRealm = REALMS[currentIndex + 1];
                updateDisplay(gameState);
                addLog(`[突破] ${gameState.playerName} 服用破境丹，成功突破至${gameState.playerRealm}！`, 'text-purple-400');
                
                // 触发区域震动事件
                this.triggerRegionShock(oldRealm, gameState.playerRealm);
            } else {
                addLog('[突破] 需要破境丹和50灵石才能突破到大境界！', 'text-red-400');
            }
        } else {
            // 普通突破
            const cost = (Math.floor(currentIndex / 9) + 1) * GAME_CONFIG.BREAKTHROUGH_BASE_COST;
            if (gameState.spiritStones >= cost) {
                gameState.spiritStones -= cost;
                gameState.playerRealm = REALMS[currentIndex + 1];
                updateDisplay(gameState);
                addLog(`[突破] ${gameState.playerName} 消耗${cost}灵石，突破至${gameState.playerRealm}！`, 'text-purple-400');
                
                // 触发区域震动事件（小境界突破概率较低）
                if (Math.random() < 0.3) { // 30%概率触发
                    this.triggerRegionShock(oldRealm, gameState.playerRealm);
                }
            } else {
                addLog(`[突破] 灵石不足，需要${cost}灵石才能突破。`, 'text-red-400');
            }
        }
        
        // 更新实力系统
        this.calculateTotalPower();
        this.updateSectAura();
        
        const newSectTier = this.getSectTier();
        addLog(`[宗门] ${gameState.sectName}晋升为${newSectTier}，总战力：${gameState.totalPower}`, 'text-purple-400');
        
        console.log(`突破尝试: ${gameState.playerRealm}`);
    }
    
    // 🌋 区域震动事件
    triggerRegionShock(oldRealm, newRealm) {
        const isMajorBreakthrough = REALMS.indexOf(newRealm) % 9 === 8;
        
        addLog(`[震动] ${gameState.playerName}突破至${newRealm}，引发区域灵气震荡！`, 'text-yellow-400 font-bold');
        
        // 更新地区势力格局
        this.updateNearbySects();
        
        // 随机触发事件
        const eventType = Math.random();
        
        if (eventType < 0.4) {
            // 40%概率：贺礼
            this.triggerCongratulatoryGifts(newRealm);
        } else if (eventType < 0.7) {
            // 30%概率：强敌挑战
            this.triggerStrongEnemyChallenge(newRealm);
        } else if (eventType < 0.9) {
            // 20%概率：弟子倒戈
            this.triggerDiscipleDefection(newRealm);
        } else {
            // 10%概率：特殊奇遇
            this.triggerSpecialEncounter(newRealm);
        }
    }
    
    // 贺礼事件
    triggerCongratulatoryGifts(newRealm) {
        const gifts = [
            { spiritStones: Math.floor(100 + Math.random() * 400), message: '贺礼灵石' },
            { breakthroughPills: Math.floor(1 + Math.random() * 3), message: '贺礼破境丹' },
            { reputation: Math.floor(50 + Math.random() * 150), message: '声望贺礼' }
        ];
        
        const gift = gifts[Math.floor(Math.random() * gifts.length)];
        
        if (gift.spiritStones) {
            gameState.spiritStones += gift.spiritStones;
            addLog(`[贺礼] 周边宗门听闻${gameState.playerName}突破至${newRealm}，送来${gift.spiritStones}枚灵石作为贺礼！`, 'text-green-400');
        }
        if (gift.breakthroughPills) {
            gameState.breakthroughPills += gift.breakthroughPills;
            addLog(`[贺礼] 友好宗门赠送${gift.breakthroughPills}枚破境丹作为突破贺礼！`, 'text-green-400');
        }
        if (gift.reputation) {
            gameState.reputation += gift.reputation;
            addLog(`[贺礼] ${gameState.sectName}声望提升${gift.reputation}点！`, 'text-green-400');
        }
    }
    
    // 强敌挑战事件
    triggerStrongEnemyChallenge(newRealm) {
        const realmIndex = REALMS.indexOf(newRealm);
        
        // 基于宗门总战力计算难度系数，让挑战更有挑战性
        let difficultyMultiplier;
        if (realmIndex < 10) {
            // 炼气期：80%-120%总战力
            difficultyMultiplier = 0.8 + Math.random() * 0.4;
        } else if (realmIndex < 20) {
            // 筑基期：90%-140%总战力
            difficultyMultiplier = 0.9 + Math.random() * 0.5;
        } else if (realmIndex < 30) {
            // 金丹期：100%-160%总战力
            difficultyMultiplier = 1.0 + Math.random() * 0.6;
        } else {
            // 元婴期及以上：120%-200%总战力
            difficultyMultiplier = 1.2 + Math.random() * 0.8;
        }
        
        // 使用宗门总战力作为基准
        const enemyPower = gameState.totalPower * difficultyMultiplier;
        
        const enemy = this.generateNPCSect(enemyPower);
        
        // 计算实际的难度系数
        const actualDifficultyRatio = enemy.totalPower / gameState.totalPower;
        const actualDifficultyPercent = (actualDifficultyRatio * 100).toFixed(0);
        
        addLog(`[挑战] ${enemy.name}宗主${enemy.master.name}听闻${gameState.playerName}突破至${newRealm}，前来挑战！`, 'text-red-400 font-bold');
        addLog(`[挑战] 敌方战力：${enemy.totalPower}，我方战力：${gameState.totalPower} (实际难度: ${actualDifficultyPercent}%)`, 'text-red-400');
        
        // 战斗结果计算（考虑境界压制）
        const realmAdvantage = this.calculateRealmAdvantage(newRealm, enemy.master.realm);
        const adjustedWinChance = (gameState.totalPower * realmAdvantage) / enemy.totalPower;
        const victory = Math.random() < adjustedWinChance;
        
        if (victory) {
            const reputationGain = Math.floor(enemy.reputation * 0.3);
            gameState.reputation += reputationGain;
            addLog(`[胜利] ${gameState.playerName}击败了${enemy.master.name}，获得${reputationGain}点声望！`, 'text-green-400 font-bold');
        } else {
            const reputationLoss = Math.floor(gameState.reputation * 0.2);
            const spiritStonesLoss = Math.floor(gameState.spiritStones * 0.3);
            gameState.reputation = Math.max(0, gameState.reputation - reputationLoss);
            gameState.spiritStones = Math.max(0, gameState.spiritStones - spiritStonesLoss);
            addLog(`[战败] ${gameState.playerName}败给${enemy.master.name}，损失${reputationLoss}声望和${spiritStonesLoss}灵石！`, 'text-red-400 font-bold');
        }
    }
    
    // 计算境界压制优势
    calculateRealmAdvantage(playerRealm, enemyRealm) {
        const playerIndex = REALMS.indexOf(playerRealm);
        const enemyIndex = REALMS.indexOf(enemyRealm);
        const realmGap = playerIndex - enemyIndex;
        
        // 境界压制系数
        if (realmGap >= 10) {
            return 1.5; // 大境界压制，50%战力加成
        } else if (realmGap >= 5) {
            return 1.3; // 中等境界压制，30%战力加成
        } else if (realmGap >= 2) {
            return 1.15; // 小境界压制，15%战力加成
        } else if (realmGap <= -10) {
            return 0.7; // 被大境界压制，30%战力削减
        } else if (realmGap <= -5) {
            return 0.8; // 被中等境界压制，20%战力削减
        } else if (realmGap <= -2) {
            return 0.9; // 被小境界压制，10%战力削减
        } else {
            return 1.0; // 境界相近，无压制效果
        }
    }
    
    // 弟子倒戈事件（简化为随机事件）
    triggerDiscipleDefection(newRealm) {
        const eligibleDisciples = gameState.disciples.filter(d => d.alive);
        
        if (eligibleDisciples.length === 0) {
            addLog(`[道心] ${gameState.playerName}突破引发道心考验，弟子们意志坚定，无人动摇！`, 'text-blue-400');
            return;
        }
        
        // 10%概率有弟子动摇
        if (Math.random() > 0.1) {
            addLog(`[道心] ${gameState.playerName}突破引发道心考验，弟子们意志坚定，无人动摇！`, 'text-blue-400');
            return;
        }
        
        const defector = eligibleDisciples[Math.floor(Math.random() * eligibleDisciples.length)];
        const defectorIndex = gameState.disciples.findIndex(d => d.id === defector.id);
        
        gameState.disciples.splice(defectorIndex, 1);
        
        addLog(`[倒戈] ${defector.name}在${gameState.playerName}突破时道心崩碎，叛出宗门！`, 'text-red-400');
        addLog(`[损失] 宗门失去一名弟子，当前弟子数：${gameState.disciples.length}`, 'text-red-400');
        
        // 重新计算战力
        this.calculateTotalPower();
    }
    
    // 特殊奇遇事件
    triggerSpecialEncounter(newRealm) {
        const encounters = [
            {
                message: `在${gameState.playerName}突破时，天降祥瑞，宗门灵气浓度大幅提升！`,
                effect: () => {
                    gameState.globalEffects.cultivationBonus *= 1.5;
                    setTimeout(() => {
                        gameState.globalEffects.cultivationBonus /= 1.5;
                        addLog(`[祥瑞] 天降祥瑞效果结束`, 'text-blue-400');
                    }, 300000); // 5分钟
                }
            },
            {
                message: `突破时引来上古传承感悟，${gameState.playerName}修为大进！`,
                effect: () => {
                    // 可以添加特殊效果
                }
            },
            {
                message: `突破震动唤醒了沉睡的灵脉，宗门资源产出增加！`,
                effect: () => {
                    // 可以增加资源产出
                }
            }
        ];
        
        const encounter = encounters[Math.floor(Math.random() * encounters.length)];
        addLog(`[奇遇] ${encounter.message}`, 'text-purple-400 font-bold');
        
        if (encounter.effect) {
            encounter.effect();
        }
    }
    
    // 处理修改名称
    handleChangeName() {
        const modal = document.getElementById('changeNameModal');
        const newSectNameInput = document.getElementById('newSectName');
        const newPlayerNameInput = document.getElementById('newPlayerName');
        
        // 预填充当前名称
        newSectNameInput.value = gameState.sectName;
        newPlayerNameInput.value = gameState.playerName;
        
        // 显示模态框
        modal.classList.remove('hidden');
        
        // 设置事件监听器
        this.setupChangeNameModal();
    }
    
    // 设置修改名称模态框事件
    setupChangeNameModal() {
        const confirmBtn = document.getElementById('confirmChangeNameBtn');
        const cancelBtn = document.getElementById('cancelChangeNameBtn');
        const closeBtn = document.getElementById('closeChangeNameModal');
        
        // 移除旧的事件监听器
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        const newCloseBtn = closeBtn.cloneNode(true);
        
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        
        // 添加新的事件监听器
        newConfirmBtn.addEventListener('click', () => this.confirmChangeName());
        newCancelBtn.addEventListener('click', () => this.closeChangeNameModal());
        newCloseBtn.addEventListener('click', () => this.closeChangeNameModal());
    }
    
    // 确认修改名称
    confirmChangeName() {
        const newSectName = document.getElementById('newSectName').value.trim();
        const newPlayerName = document.getElementById('newPlayerName').value.trim();
        
        if (!newSectName || !newPlayerName) {
            alert('请填写完整的宗门名称和玩家姓名！');
            return;
        }
        
        const oldSectName = gameState.sectName;
        const oldPlayerName = gameState.playerName;
        
        // 更新名称
        gameState.sectName = newSectName;
        gameState.playerName = newPlayerName;
        
        // 刷新显示
        updateDisplay(gameState);
        
        // 添加日志
        if (oldSectName !== newSectName) {
            addLog(`[改名] 宗门名称从"${oldSectName}"改为"${newSectName}"`, 'text-purple-400');
        }
        if (oldPlayerName !== newPlayerName) {
            addLog(`[改名] 玩家姓名从"${oldPlayerName}"改为"${newPlayerName}"`, 'text-purple-400');
        }
        
        // 关闭模态框
        this.closeChangeNameModal();
    }
    
    // 关闭修改名称模态框
    closeChangeNameModal() {
        document.getElementById('changeNameModal').classList.add('hidden');
    }
    
    // 处理招募弟子
    handleRecruit() {
        if (gameState.spiritStones >= GAME_CONFIG.RECRUIT_COST) {
            gameState.spiritStones -= GAME_CONFIG.RECRUIT_COST;
            const newDisciple = new Disciple();
            gameState.disciples.push(newDisciple);
            updateDisplay(gameState);
            addLog(`[招募] 成功招募外门弟子 ${newDisciple.name}，消耗${GAME_CONFIG.RECRUIT_COST}灵石。`, 'text-blue-400');
        } else {
            addLog(`[招募] 灵石不足，需要${GAME_CONFIG.RECRUIT_COST}灵石才能招募弟子。`, 'text-red-400');
        }
        
        console.log(`招募弟子: ${gameState.disciples.length}`);
    }
    
    // 处理任务堂
    handleTaskHall() {
        showTaskHall();
        console.log('打开任务堂');
    }
    
    // 处理坊市
    handleMarket() {
        showMarket(gameState);
        console.log('打开坊市');
    }
    
    // 处理拍卖会
    handleAuction() {
        showAuction(gameState);
        console.log('打开拍卖会');
    }
    
    // 处理功法堂
    handleTechniqueHall() {
        showTechniqueHall(gameState);
        console.log('打开功法堂');
    }
    
    // 处理宗门宝库
    handleTreasury() {
        showTreasury(gameState);
        console.log('打开宗门宝库');
    }
    
    // 处理往昔录
    handlePastRecords() {
        showPastRecords();
        console.log('打开往昔录');
    }
    
    // 处理集体事件
    handleEvents() {
        this.showEventsModal();
        console.log('打开集体事件');
    }
    
    // 获取影响力等级
    getInfluenceLevel() {
        const reputation = gameState.reputation;
        
        // 从高到低查找对应的影响力等级
        for (let i = INFLUENCE_LEVELS.length - 1; i >= 0; i--) {
            if (reputation >= INFLUENCE_LEVELS[i].reputation) {
                return INFLUENCE_LEVELS[i];
            }
        }
        
        // 如果声望为负或很低，返回最低等级
        return INFLUENCE_LEVELS[0];
    }
    
    // 处理地区管理查看
    handleRegion() {
        this.showRegionModal();
        console.log('打开地区查看');
    }
    
    // 显示事件模态框
    showEventsModal() {
        const modal = document.getElementById('eventsModal');
        if (modal) {
            modal.classList.remove('hidden');
            this.generateEvents();
        }
    }
    
    // 显示地区模态框
    showRegionModal() {
        const modal = document.getElementById('regionModal');
        const regionMap = document.getElementById('regionMap');
        
        if (!modal || !regionMap) return;
        
        // 更新周边宗门信息
        this.updateNearbySects();
        
        // 清空并重新生成地区内容
        regionMap.innerHTML = '';
        
        // 当前地区信息
        const currentRegionDiv = document.createElement('div');
        currentRegionDiv.className = 'col-span-2 bg-slate-800 p-4 rounded ancient-border';
        currentRegionDiv.innerHTML = `
            <h3 class="text-xl font-bold text-amber-200 mb-3">🏰 当前地区</h3>
            <div class="space-y-2 text-amber-300">
                <p><strong>地区名称：</strong>${gameState.currentRegion.name}</p>
                <p><strong>地区等级：</strong>${gameState.currentRegion.level}级</p>
                <p><strong>我方宗门：</strong>${gameState.sectName}</p>
                <p><strong>宗门战力：</strong>${gameState.totalPower}</p>
                <p><strong>影响力：</strong>${this.getInfluenceLevel().name}</p>
            </div>
        `;
        regionMap.appendChild(currentRegionDiv);
        
        // 周边势力列表
        if (gameState.nearbySects && gameState.nearbySects.length > 0) {
            const nearbySectsDiv = document.createElement('div');
            nearbySectsDiv.className = 'col-span-2 bg-slate-800 p-4 rounded ancient-border';
            nearbySectsDiv.innerHTML = `
                <h3 class="text-xl font-bold text-amber-200 mb-3">⚔️ 周边势力</h3>
                <div class="space-y-3 max-h-80 overflow-y-auto">
                    ${gameState.nearbySects.map(sect => this.generateSectCard(sect)).join('')}
                </div>
            `;
            regionMap.appendChild(nearbySectsDiv);
        } else {
            const noSectsDiv = document.createElement('div');
            noSectsDiv.className = 'col-span-2 bg-slate-800 p-4 rounded ancient-border';
            noSectsDiv.innerHTML = `
                <h3 class="text-xl font-bold text-amber-200 mb-3">⚔️ 周边势力</h3>
                <p class="text-gray-400">暂无其他势力，正在探索中...</p>
            `;
            regionMap.appendChild(noSectsDiv);
        }
        
        modal.classList.remove('hidden');
        console.log('显示地区查看');
        
        // 绑定势力卡片事件
        this.bindSectEvents();
    }
    
    // 生成势力卡片
    generateSectCard(sect) {
        const attitudeColor = {
            friendly: 'text-green-400',
            neutral: 'text-yellow-400',
            hostile: 'text-red-400'
        }[sect.attitude] || 'text-gray-400';
        
        const attitudeText = {
            friendly: '友好',
            neutral: '中立',
            hostile: '敌对'
        }[sect.attitude] || '未知';
        
        return `
            <div class="sect-card bg-slate-700 p-3 rounded border border-gray-600" data-sect-id="${sect.id}">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="text-lg font-bold text-amber-200">${sect.name}</h4>
                    <span class="text-sm ${attitudeColor}">${attitudeText}</span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-sm text-gray-300 mb-3">
                    <p><strong>宗主：</strong>${sect.master.name}</p>
                    <p><strong>境界：</strong>${sect.master.realm}</p>
                    <p><strong>类型：</strong>${sect.type}</p>
                    <p><strong>战力：</strong>${sect.totalPower}</p>
                    <p><strong>弟子：</strong>${sect.disciples.length}人</p>
                    <p><strong>声望：</strong>${sect.reputation}</p>
                </div>
                <div class="flex gap-2">
                    <button class="sect-challenge-btn px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-sm rounded" data-sect-id="${sect.id}">
                        ⚔️ 挑战
                    </button>
                    <button class="sect-diplomacy-btn px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded" data-sect-id="${sect.id}">
                        🤝 外交
                    </button>
                    <button class="sect-spy-btn px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded" data-sect-id="${sect.id}">
                        🕵️ 侦查
                    </button>
                </div>
            </div>
        `;
    }
    
    // 绑定势力事件
    bindSectEvents() {
        // 挑战按钮
        document.querySelectorAll('.sect-challenge-btn').forEach(btn => {
            btn.onclick = (e) => {
                const sectId = e.target.dataset.sectId;
                this.handleSectChallenge(sectId);
            };
        });
        
        // 外交按钮
        document.querySelectorAll('.sect-diplomacy-btn').forEach(btn => {
            btn.onclick = (e) => {
                const sectId = e.target.dataset.sectId;
                this.handleSectDiplomacy(sectId);
            };
        });
        
        // 侦查按钮
        document.querySelectorAll('.sect-spy-btn').forEach(btn => {
            btn.onclick = (e) => {
                const sectId = e.target.dataset.sectId;
                this.handleSectSpy(sectId);
            };
        });
    }
    
    // 处理势力挑战
    handleSectChallenge(sectId) {
        const sect = gameState.nearbySects.find(s => s.id == sectId);
        if (!sect) return;
        
        // 显示挑战确认对话框
        const challengeDiv = document.createElement('div');
        challengeDiv.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
        challengeDiv.innerHTML = `
            <div class="bg-slate-900 ancient-border rounded-lg p-6 max-w-md w-full mx-4">
                <h3 class="text-xl font-bold text-amber-200 mb-4">⚔️ 挑战确认</h3>
                <div class="space-y-3 text-gray-300 mb-6">
                    <p><strong>挑战对象：</strong>${sect.name}</p>
                    <p><strong>对方宗主：</strong>${sect.master.name} (${sect.master.realm})</p>
                    <p><strong>对方战力：</strong>${sect.totalPower}</p>
                    <p><strong>我方战力：</strong>${gameState.totalPower}</p>
                    <p><strong>胜利概率：</strong>${this.calculateChallengeWinChance(sect).toFixed(1)}%</p>
                    <p class="text-red-400">⚠️ 挑战失败将损失声望和灵石！</p>
                </div>
                <div class="flex gap-3">
                    <button id="confirmChallenge" class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded">
                        确认挑战
                    </button>
                    <button id="cancelChallenge" class="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded">
                        取消
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(challengeDiv);
        
        // 绑定事件
        document.getElementById('confirmChallenge').onclick = () => {
            this.executeSectChallenge(sect);
            document.body.removeChild(challengeDiv);
        };
        
        document.getElementById('cancelChallenge').onclick = () => {
            document.body.removeChild(challengeDiv);
        };
    }
    
    // 执行势力挑战
    executeSectChallenge(sect) {
        const winChance = this.calculateChallengeWinChance(sect) / 100;
        const victory = Math.random() < winChance;
        
        // 更新挑战信息
        sect.challengeCount = (sect.challengeCount || 0) + 1;
        sect.lastChallengeTime = Date.now();
        
        if (victory) {
            let reputationGain = Math.floor(sect.reputation * 0.2);
            let spiritStonesGain = Math.floor(sect.totalPower * 0.1);
            
            // 特殊宗门有额外奖励
            if (sect.isSpecial && sect.specialRewards) {
                reputationGain += sect.specialRewards.reputation;
                spiritStonesGain += sect.specialRewards.spiritStones;
                
                // 获得特殊功法
                if (sect.specialRewards.technique) {
                    const techniqueData = {
                        name: sect.specialRewards.technique,
                        quality: '天阶',
                        attribute: '无属性',
                        type: 'special',
                        basePower: 500,
                        description: `击败${sect.name}获得的绝世功法`,
                        stock: 1,
                        obtainedFrom: `击败${sect.name}`,
                        purchaseDate: Date.now()
                    };
                    
                    gameState.techniqueHall.push(techniqueData);
                    addLog(`[奇遇] 获得绝世功法《${sect.specialRewards.technique}》！`, 'text-purple-400 font-bold');
                }
                
                addLog(`[史诗] 击败传奇宗门${sect.name}，获得史诗级奖励！`, 'text-yellow-400 font-bold');
            }
            
            gameState.reputation += reputationGain;
            gameState.spiritStones += spiritStonesGain;
            
            addLog(`[胜利] ${gameState.sectName}击败了${sect.name}，获得${reputationGain}声望和${spiritStonesGain}灵石！`, 'text-green-400 font-bold');
            
            // 移除被击败的宗门
            const index = gameState.nearbySects.findIndex(s => s.id === sect.id);
            if (index > -1) {
                gameState.nearbySects.splice(index, 1);
            }
        } else {
            // 挑战失败 - 损失资源和弟子
            const reputationLoss = Math.floor(gameState.reputation * 0.1); // 降低到10%损失
            const spiritStonesLoss = Math.floor(gameState.spiritStones * 0.15); // 降低到15%损失
            
            gameState.reputation = Math.max(0, gameState.reputation - reputationLoss);
            gameState.spiritStones = Math.max(0, gameState.spiritStones - spiritStonesLoss);
            
            addLog(`[战败] ${gameState.sectName}败给了${sect.name}，损失${reputationLoss}声望和${spiritStonesLoss}灵石！`, 'text-red-400 font-bold');
            
            // 弟子伤亡机制
            const aliveDisciples = gameState.disciples.filter(d => d.alive);
            if (aliveDisciples.length > 0) {
                // 按战力排序，优先移除弱小弟子
                const sortedDisciples = [...aliveDisciples].sort((a, b) => a.getCombatPower() - b.getCombatPower());
                
                // 计算伤亡数量
                let casualtyCount = 0;
                if (sect.isSpecial) {
                    // 特殊宗门挑战失败，伤亡更重
                    casualtyCount = Math.min(3, Math.floor(sortedDisciples.length * 0.2)); // 最多3个，或20%
                } else {
                    // 普通宗门挑战失败
                    casualtyCount = Math.min(2, Math.floor(sortedDisciples.length * 0.1)); // 最多2个，或10%
                }
                
                // 移除伤亡弟子
                const casualties = sortedDisciples.slice(0, casualtyCount);
                casualties.forEach(casualty => {
                    const index = gameState.disciples.findIndex(d => d.id === casualty.id);
                    if (index > -1) return;
                    
                    // 生成死亡描述
                    const deathDescriptions = [
                        `${casualty.name}在激战中被${sect.master.name}重创，不治身亡！`,
                        `${casualty.name}为保护宗门，与敌人同归于尽！`,
                        `${casualty.name}被${sect.name}的绝技击中，当场阵亡！`,
                        `${casualty.name}力战不敌，被${sect.master.name}一击毙命！`,
                        `${casualty.name}在撤退时被截杀，英勇牺牲！`
                    ];
                    
                    const deathDesc = deathDescriptions[Math.floor(Math.random() * deathDescriptions.length)];
                    addLog(`[牺牲] ${deathDesc}`, 'text-red-500');
                    
                    gameState.disciples.splice(index, 1);
                });
                
                if (casualties.length > 0) {
                    addLog(`[伤亡] 此次挑战损失${casualties.length}名弟子：${casualties.map(d => d.name).join('、')}`, 'text-red-600 font-bold');
                }
                
                // 剩余弟子可能有受伤
                const remainingDisciples = gameState.disciples.filter(d => d.alive);
                if (remainingDisciples.length > 0 && Math.random() < 0.4) {
                    const injuredCount = Math.min(2, Math.floor(remainingDisciples.length * 0.15));
                    const injuredDisciples = remainingDisciples.slice(0, injuredCount);
                    
                    injuredDisciples.forEach(injured => {
                        injured.injured = true;
                        injured.injuryTime = Date.now();
                    });
                    
                    addLog(`[受伤] ${injuredDisciples.map(d => d.name).join('、')}在战斗中受伤，需要休养！`, 'text-orange-400');
                }
            }
        }
        
        // 重新计算战力
        this.calculateTotalPower();
        
        // 刷新地区显示
        this.showRegionModal();
        updateDisplay(gameState);
    }
    
    // 计算挑战胜利概率
    calculateChallengeWinChance(sect) {
        const powerRatio = gameState.totalPower / sect.totalPower;
        const baseChance = Math.min(Math.max(powerRatio * 50, 10), 90); // 10%-90%
        
        // 境界压制加成
        const realmAdvantage = this.calculateRealmAdvantage(gameState.playerRealm, sect.master.realm);
        return Math.min(baseChance * realmAdvantage, 95);
    }
    
    // 处理势力外交
    handleSectDiplomacy(sectId) {
        const sect = gameState.nearbySects.find(s => s.id == sectId);
        if (!sect) return;
        
        const diplomacyCost = Math.floor(sect.reputation * 0.1);
        
        if (gameState.spiritStones < diplomacyCost) {
            addLog(`[外交] 灵石不足，需要${diplomacyCost}灵石进行外交`, 'text-red-400');
            return;
        }
        
        // 根据态度决定外交结果
        let result;
        if (sect.attitude === 'hostile') {
            result = Math.random() < 0.3; // 30%概率改善关系
        } else if (sect.attitude === 'neutral') {
            result = Math.random() < 0.7; // 70%概率建立友好关系
        } else {
            result = Math.random() < 0.9; // 90%概率巩固关系
        }
        
        gameState.spiritStones -= diplomacyCost;
        
        if (result) {
            sect.attitude = sect.attitude === 'hostile' ? 'neutral' : 'friendly';
            addLog(`[外交] 与${sect.name}的外交活动成功，关系改善为${sect.attitude === 'friendly' ? '友好' : '中立'}！`, 'text-green-400');
        } else {
            addLog(`[外交] 与${sect.name}的外交活动失败`, 'text-red-400');
        }
        
        this.showRegionModal();
        updateDisplay(gameState);
    }
    
    // 处理势力侦查
    handleSectSpy(sectId) {
        const sect = gameState.nearbySects.find(s => s.id == sectId);
        if (!sect) return;
        
        const spyCost = 50;
        
        if (gameState.spiritStones < spyCost) {
            addLog(`[侦查] 灵石不足，需要${spyCost}灵石进行侦查`, 'text-red-400');
            return;
        }
        
        gameState.spiritStones -= spyCost;
        
        // 侦查成功率
        const successRate = sect.attitude === 'hostile' ? 0.6 : 0.8;
        const success = Math.random() < successRate;
        
        if (success) {
            addLog(`[侦查] 成功获取${sect.name}的详细信息：`, 'text-purple-400');
            addLog(`[情报] 宗主${sect.master.name}，境界${sect.master.realm}，擅长${sect.type}，总战力${sect.totalPower}`, 'text-purple-300');
            
            // 更新侦查到的信息
            sect.scouted = true;
        } else {
            addLog(`[侦查] 侦查${sect.name}失败，被发现！关系恶化`, 'text-red-400');
            if (sect.attitude === 'friendly') {
                sect.attitude = 'neutral';
            } else if (sect.attitude === 'neutral') {
                sect.attitude = 'hostile';
            }
        }
        
        this.showRegionModal();
        updateDisplay(gameState);
    }
    
    // 生成事件
    generateEvents() {
        const eventsList = document.getElementById('eventsList');
        if (!eventsList) return;
        
        eventsList.innerHTML = '';
        
        // 随机选择2-3个事件
        const numEvents = Math.floor(Math.random() * 2) + 2; // 2-3个事件
        const selectedEvents = [];
        
        for (let i = 0; i < numEvents; i++) {
            const randomEvent = COLLECTIVE_EVENTS[Math.floor(Math.random() * COLLECTIVE_EVENTS.length)];
            if (!selectedEvents.find(e => e.name === randomEvent.name)) {
                selectedEvents.push({...randomEvent, id: `event_${i}`});
            }
        }
        
        selectedEvents.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'bg-slate-800 p-4 rounded ancient-border mb-4';
            
            // 根据事件类型设置颜色
            let typeColor = 'text-gray-300';
            let buttonColor = 'bg-green-600 hover:bg-green-500';
            
            switch (event.type) {
                case 'blessing':
                case 'celebration':
                case 'natural':
                case 'miracle':
                case 'legendary':
                    typeColor = 'text-green-400';
                    buttonColor = 'bg-green-600 hover:bg-green-500';
                    break;
                case 'curse':
                case 'catastrophe':
                    typeColor = 'text-red-400';
                    buttonColor = 'bg-red-600 hover:bg-red-500';
                    break;
                case 'crisis':
                    typeColor = 'text-orange-400';
                    buttonColor = 'bg-orange-600 hover:bg-orange-500';
                    break;
                case 'opportunity':
                case 'discovery':
                    typeColor = 'text-blue-400';
                    buttonColor = 'bg-blue-600 hover:bg-blue-500';
                    break;
            }
            
            eventDiv.innerHTML = `
                <h3 class="text-lg font-bold text-amber-200 mb-2">${this.getEventIcon(event.type)} ${event.name}</h3>
                <p class="${typeColor} mb-4">${event.description}</p>
                <div class="text-sm text-gray-400 mb-3">
                    难度: ${this.getDifficultyText(event.difficulty)}
                </div>
                <div class="flex gap-2">
                    <button class="event-accept px-4 py-2 ${buttonColor} text-white rounded transition-colors" data-event="${event.id}">
                        处理事件
                    </button>
                    <button class="event-ignore px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors" data-event="${event.id}">
                        忽略事件
                    </button>
                </div>
            `;
            
            eventsList.appendChild(eventDiv);
            
            // 存储事件数据
            eventDiv.eventData = event;
        });
        
        // 添加事件按钮监听器
        eventsList.querySelectorAll('.event-accept').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.dataset.event;
                this.handleCollectiveEventAccept(eventId);
            });
        });
        
        eventsList.querySelectorAll('.event-ignore').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.dataset.event;
                this.handleCollectiveEventIgnore(eventId);
            });
        });
    }
    
    // 获取事件图标
    getEventIcon(type) {
        const icons = {
            blessing: '🌟',
            celebration: '🎉',
            natural: '🌊',
            miracle: '✨',
            legendary: '👑',
            curse: '😈',
            catastrophe: '☄️',
            crisis: '⚔️',
            opportunity: '💎',
            discovery: '⛏️',
            event: '🏮'
        };
        return icons[type] || '📜';
    }
    
    // 获取难度文本
    getDifficultyText(difficulty) {
        const difficulties = {
            easy: '简单',
            medium: '中等',
            hard: '困难',
            rare: '罕见',
            legendary: '传说'
        };
        return difficulties[difficulty] || difficulty;
    }
    
    // 处理集体事件接受
    handleCollectiveEventAccept(eventId) {
        const eventsList = document.getElementById('eventsList');
        const eventElements = eventsList.querySelectorAll('.bg-slate-800');
        
        for (let eventElement of eventElements) {
            if (eventElement.eventData && eventElement.eventData.id === eventId) {
                const event = eventElement.eventData;
                this.applyCollectiveEvent(event);
                break;
            }
        }
        
        this.closeEventsModal();
        this.updateDisplay();
    }
    
    // 处理集体事件忽略
    handleCollectiveEventIgnore(eventId) {
        const eventsList = document.getElementById('eventsList');
        const eventElements = eventsList.querySelectorAll('.bg-slate-800');
        
        for (let eventElement of eventElements) {
            if (eventElement.eventData && eventElement.eventData.id === eventId) {
                const event = eventElement.eventData;
                addLog(`[事件] 忽略了${event.name}`, 'text-gray-400');
                break;
            }
        }
        
        this.closeEventsModal();
    }
    
    // 应用集体事件效果
    applyCollectiveEvent(event) {
        console.log('应用集体事件:', event);
        
        // 应用奖励
        if (event.reward) {
            if (event.reward.spiritStones) {
                gameState.spiritStones += event.reward.spiritStones;
                addLog(`[事件] ${event.name}，获得${event.reward.spiritStones}灵石`, 'text-emerald-400');
            }
            if (event.reward.breakthroughPills) {
                gameState.breakthroughPills += event.reward.breakthroughPills;
                addLog(`[事件] ${event.name}，获得${event.reward.breakthroughPills}枚破境丹`, 'text-purple-400');
            }
            if (event.reward.reputation) {
                gameState.reputation += event.reward.reputation;
                addLog(`[事件] ${event.name}，声望${event.reward.reputation > 0 ? '+' : ''}${event.reward.reputation}`, 'text-amber-400');
            }
            if (event.reward.globalCultivationBonus) {
                this.applyGlobalCultivationBonus(event.reward.globalCultivationBonus, event.reward.duration);
                addLog(`[事件] ${event.name}，${event.reward.message}`, 'text-green-400');
            }
            if (event.reward.globalRealmBoost) {
                this.applyGlobalRealmBoost();
                addLog(`[事件] ${event.name}，${event.reward.message}`, 'text-purple-400');
            }
            if (event.reward.randomBreakthrough) {
                this.applyRandomBreakthrough(event.reward.randomBreakthrough);
                addLog(`[事件] ${event.name}，${event.reward.message}`, 'text-purple-400');
            }
            if (event.reward.randomTechnique) {
                this.applyRandomTechnique(event.reward.randomTechnique);
                addLog(`[事件] ${event.name}，${event.reward.message}`, 'text-blue-400');
            }
        }
        
        // 应用惩罚
        if (event.penalty) {
            if (event.penalty.spiritStones) {
                gameState.spiritStones = Math.max(0, gameState.spiritStones + event.penalty.spiritStones);
                addLog(`[事件] ${event.name}，${event.penalty.message}`, 'text-red-400');
            }
            if (event.penalty.reputation) {
                gameState.reputation = Math.max(0, gameState.reputation + event.penalty.reputation);
                addLog(`[事件] ${event.name}，声望${event.penalty.reputation > 0 ? '+' : ''}${event.penalty.reputation}`, 'text-orange-400');
            }
            if (event.penalty.globalCultivationPenalty) {
                this.applyGlobalCultivationPenalty(event.penalty.globalCultivationPenalty, event.penalty.duration);
                addLog(`[事件] ${event.name}，${event.penalty.message}`, 'text-red-400');
            }
            if (event.penalty.randomInjury) {
                this.applyRandomInjury(event.penalty.randomInjury);
                addLog(`[事件] ${event.name}，${event.penalty.message}`, 'text-red-400');
            }
        }
    }
    
    // 应用全局修炼加成
    applyGlobalCultivationBonus(bonus, duration) {
        const effect = {
            type: 'cultivationBonus',
            value: bonus,
            endTime: Date.now() + duration,
            startTime: Date.now()
        };
        
        gameState.globalEffects.effects.push(effect);
        gameState.globalEffects.cultivationBonus *= bonus;
        
        // 设置定时器移除效果
        setTimeout(() => {
            this.removeGlobalEffect(effect);
            gameState.globalEffects.cultivationBonus /= bonus;
            addLog('[效果] 全局修炼加成效果结束', 'text-gray-400');
        }, duration);
    }
    
    // 应用全局修炼减益
    applyGlobalCultivationPenalty(penalty, duration) {
        const effect = {
            type: 'cultivationPenalty',
            value: penalty,
            endTime: Date.now() + duration,
            startTime: Date.now()
        };
        
        gameState.globalEffects.effects.push(effect);
        gameState.globalEffects.cultivationPenalty *= penalty;
        
        // 设置定时器移除效果
        setTimeout(() => {
            this.removeGlobalEffect(effect);
            gameState.globalEffects.cultivationPenalty /= penalty;
            addLog('[效果] 全局修炼减益效果结束', 'text-gray-400');
        }, duration);
    }
    
    // 应用全局境界提升
    applyGlobalRealmBoost() {
        gameState.disciples.forEach(disciple => {
            if (disciple.alive && !disciple.onTask) {
                const currentRealmIndex = REALMS.indexOf(disciple.realm);
                if (currentRealmIndex < REALMS.length - 1 && currentRealmIndex > 0) {
                    // 提升一个小境界
                    const newRealmIndex = Math.min(currentRealmIndex + 1, REALMS.length - 1);
                    disciple.realm = REALMS[newRealmIndex];
                    disciple.cultivation = 0;
                }
            }
        });
    }
    
    // 应用随机突破
    applyRandomBreakthrough(count) {
        const availableDisciples = gameState.disciples.filter(d => d.alive && !d.onTask && d.cultivation < 100);
        const selectedDisciples = [];
        
        for (let i = 0; i < count && i < availableDisciples.length; i++) {
            const randomIndex = Math.floor(Math.random() * availableDisciples.length);
            const disciple = availableDisciples[randomIndex];
            if (!selectedDisciples.includes(disciple)) {
                disciple.cultivation = 100;
                selectedDisciples.push(disciple);
            }
        }
    }
    
    // 应用随机功法
    applyRandomTechnique(count) {
        const availableDisciples = gameState.disciples.filter(d => d.alive && !d.onTask);
        const selectedDisciples = [];
        
        for (let i = 0; i < count && i < availableDisciples.length; i++) {
            const randomIndex = Math.floor(Math.random() * availableDisciples.length);
            const disciple = availableDisciples[randomIndex];
            if (!selectedDisciples.includes(disciple)) {
                // 随机选择一个基础功法
                const randomTechnique = BASE_TECHNIQUES[Math.floor(Math.random() * BASE_TECHNIQUES.length)];
                disciple.learnTechnique(randomTechnique);
                selectedDisciples.push(disciple);
            }
        }
    }
    
    // 应用随机受伤
    applyRandomInjury(count) {
        const availableDisciples = gameState.disciples.filter(d => d.alive && !d.injured && !d.onTask);
        const selectedDisciples = [];
        
        for (let i = 0; i < count && i < availableDisciples.length; i++) {
            const randomIndex = Math.floor(Math.random() * availableDisciples.length);
            const disciple = availableDisciples[randomIndex];
            if (!selectedDisciples.includes(disciple)) {
                disciple.injured = true;
                selectedDisciples.push(disciple);
            }
        }
    }
    
    // 移除全局效果
    removeGlobalEffect(effectToRemove) {
        const index = gameState.globalEffects.effects.findIndex(effect => 
            effect.type === effectToRemove.type && 
            effect.startTime === effectToRemove.startTime
        );
        if (index > -1) {
            gameState.globalEffects.effects.splice(index, 1);
        }
    }
    
    // 处理接受事件
    handleEventAccept(eventId) {
        console.log('接受事件:', eventId);
        if (eventId === 'spiritVein') {
            gameState.spiritStones += 1000;
            addLog('成功夺取灵脉，获得1000灵石！', 'text-emerald-400');
        }
        this.closeEventsModal();
        this.updateDisplay();
    }
    
    // 处理忽略事件
    handleEventIgnore(eventId) {
        console.log('忽略事件:', eventId);
        addLog('忽略了该事件', 'text-gray-400');
        this.closeEventsModal();
    }
    
    // 关闭事件模态框
    closeEventsModal() {
        const modal = document.getElementById('eventsModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    // 添加updateDisplay方法供外部调用
    updateDisplay() {
        updateDisplay(gameState);
    }
    
    // 根据弟子境界获取合适的功法
    getRandomTechniqueForDisciple(disciple) {
        const realmIndex = REALMS.indexOf(disciple.realm);
        let availableTechniques = BASE_TECHNIQUES;
        
        // 根据弟子境界调整功法品质概率
        if (realmIndex <= 10) {
            // 炼气期：主要获得黄阶功法
            availableTechniques = BASE_TECHNIQUES.filter(t => t.quality === '黄阶');
        } else if (realmIndex <= 20) {
            // 筑基期：可能获得玄阶功法
            availableTechniques = BASE_TECHNIQUES.filter(t => t.quality === '黄阶' || t.quality === '玄阶');
        } else if (realmIndex <= 30) {
            // 金丹期：可能获得地阶功法
            availableTechniques = BASE_TECHNIQUES.filter(t => t.quality === '玄阶' || t.quality === '地阶');
        } else {
            // 更高境界：可能获得任何功法
            availableTechniques = BASE_TECHNIQUES;
        }
        
        return availableTechniques[Math.floor(Math.random() * availableTechniques.length)];
    }
}

// 生成功法残本的辅助函数
function generateTechniqueFragment(isAdvanced = false) {
    const fragments = [
        {
            name: "基础吐纳法",
            description: "最基础的修炼法门，适合初学者。",
            origin: "流传最广的入门功法，各大宗门都有收录",
            rarity: "common"
        },
        {
            name: "五行拳谱",
            description: "结合五行之力的拳法，简单实用。",
            origin: "某位前辈观五行相生相克所创",
            rarity: "common"
        },
        {
            name: "轻身术残页",
            description: "提升身法的法门，只剩几页。",
            origin: "据说是盗门绝学，只剩残篇流传",
            rarity: "uncommon"
        },
        {
            name: "炼丹初解",
            description: "炼丹术的基础知识，记录了一些简单丹方。",
            origin: "某位丹师的手稿残页",
            rarity: "uncommon"
        },
        {
            name: "御剑术心得",
            description: "御剑飞行的心得体会，颇有见地。",
            origin: "剑修前辈的经验总结",
            rarity: "rare"
        }
    ];
    
    return fragments[Math.floor(Math.random() * fragments.length)];
}

// 检查踢馆事件
CultivationGame.prototype.checkInvasion = function(gameTick) {
    // 检查冷却时间
    if (gameState.invasionCooldown > gameTick) {
        return;
    }
    
    // 检查声望要求
    if (gameState.reputation < INVASION_CONFIG.MIN_REPUTATION) {
        return;
    }
    
    // 随机触发踢馆
    if (Math.random() < 0.002) { // 0.2%概率每次循环触发
        this.triggerInvasion();
    }
};

// 触发踢馆事件
CultivationGame.prototype.triggerInvasion = function() {
    // 根据玩家境界选择合适的挑战者
    const playerRealmIndex = REALMS.indexOf(gameState.playerRealm);
    let availableSects;
    
    if (playerRealmIndex < 10) {
        // 炼气期：较弱对手
        availableSects = INVADING_SECTS.filter(s => s.strength <= 0.6);
    } else if (playerRealmIndex < 20) {
        // 筑基期：中等对手
        availableSects = INVADING_SECTS.filter(s => s.strength <= 0.8);
    } else {
        // 金丹期及以上：所有对手都可能
        availableSects = INVADING_SECTS;
    }
    
    // 增加特殊强敌概率
    let invadingSect;
    if (Math.random() < 0.2 && playerRealmIndex >= 20) {
        // 20%概率遇到特殊强敌（金丹期及以上）
        invadingSect = {
            name: "天魔宗",
            strength: 1.2 + Math.random() * 0.5, // 1.2-1.7强度
            description: "来自魔域的强大宗门，专门挑战各路高手",
            specialty: "天魔功"
        };
    } else {
        invadingSect = availableSects[Math.floor(Math.random() * availableSects.length)];
        // 根据玩家境界增强对手
        const enhancement = Math.min(playerRealmIndex / 30, 0.5); // 最多增强50%
        invadingSect = {
            ...invadingSect,
            strength: invadingSect.strength * (1 + enhancement)
        };
    }
    
    addLog(`[踢馆] 警报！${invadingSect.name}前来踢馆！`, 'text-red-400');
    addLog(`[踢馆] ${invadingSect.description}，擅长${invadingSect.specialty}`, 'text-yellow-400');
    
    // 计算我方实力
    const ourStrength = this.calculateSectStrength();
    const theirStrength = invadingSect.strength;
    
    // 战斗结果
    const successChance = ourStrength / (ourStrength + theirStrength);
    const success = Math.random() < successChance;
    
    // 处理结果
    setTimeout(() => {
        this.resolveInvasion(invadingSect, success);
    }, 3000);
    
    // 设置冷却时间
    gameState.invasionCooldown = Date.now() + INVASION_CONFIG.BASE_COOLDOWN;
};

// 计算宗门实力
CultivationGame.prototype.calculateSectStrength = function() {
    let strength = 0;
    
    gameState.disciples.forEach(disciple => {
        if (disciple.alive && !disciple.injured) {
            // 基础实力根据境界
            const realmIndex = REALMS.indexOf(disciple.realm);
            const baseStrength = Math.pow(1.5, realmIndex);
            
            // 天赋加成
            const talentBonus = disciple.talent / 100;
            
            strength += baseStrength * (1 + talentBonus);
        }
    });
    
    // 宗主实力加成
    const playerRealmIndex = REALMS.indexOf(gameState.playerRealm);
    const playerStrength = Math.pow(2, playerRealmIndex);
    strength += playerStrength;
    
    return strength;
};

// 解决踢馆结果
CultivationGame.prototype.resolveInvasion = function(invadingSect, success) {
    if (success) {
        // 成功防御
        const reputationGain = Math.floor(Math.random() * (INVASION_CONFIG.SUCCESS_REWARD.reputation[1] - INVASION_CONFIG.SUCCESS_REWARD.reputation[0])) + INVASION_CONFIG.SUCCESS_REWARD.reputation[0];
        const spiritStonesGain = Math.floor(Math.random() * (INVASION_CONFIG.SUCCESS_REWARD.spiritStones[1] - INVASION_CONFIG.SUCCESS_REWARD.spiritStones[0])) + INVASION_CONFIG.SUCCESS_REWARD.spiritStones[0];
        
        gameState.reputation += reputationGain;
        gameState.spiritStones += spiritStonesGain;
        
        addLog(`[胜利] 成功击退${invadingSect.name}！获得${reputationGain}声望，${spiritStonesGain}灵石`, 'text-green-400');
        
        gameState.invasionHistory.push({
            sect: invadingSect.name,
            result: '胜利',
            timestamp: Date.now()
        });
    } else {
        // 防御失败
        const reputationLoss = Math.floor(Math.random() * (INVASION_CONFIG.FAILURE_PENALTY.reputation[1] - INVASION_CONFIG.FAILURE_PENALTY.reputation[0])) + INVASION_CONFIG.FAILURE_PENALTY.reputation[0];
        const spiritStonesLoss = Math.floor(Math.random() * (INVASION_CONFIG.FAILURE_PENALTY.spiritStones[1] - INVASION_CONFIG.FAILURE_PENALTY.spiritStones[0])) + INVASION_CONFIG.FAILURE_PENALTY.spiritStones[0];
        
        gameState.reputation = Math.max(0, gameState.reputation - reputationLoss);
        gameState.spiritStones = Math.max(0, gameState.spiritStones - spiritStonesLoss);
        
        addLog(`[失败] 不敌${invadingSect.name}！损失${reputationLoss}声望，${spiritStonesLoss}灵石`, 'text-red-400');
        
        // 可能有弟子受伤
        const healthyDisciples = gameState.disciples.filter(d => d.alive && !d.injured);
        if (healthyDisciples.length > 0 && Math.random() < 0.5) {
            const injuredDisciple = healthyDisciples[Math.floor(Math.random() * healthyDisciples.length)];
            injuredDisciple.injured = true;
            addLog(`[伤亡] ${injuredDisciple.name}在战斗中受伤`, 'text-orange-400');
        }
        
        gameState.invasionHistory.push({
            sect: invadingSect.name,
            result: '失败',
            timestamp: Date.now()
        });
    }
    
    updateDisplay(gameState);
};

// 检查集体事件
CultivationGame.prototype.checkCollectiveEvents = function() {
    // 每30秒（30个tick）检查一次集体事件
    if (gameState.gameTick % 30 !== 0) return;
    
    // 20%概率触发集体事件
    if (Math.random() > 0.2) return;
    
    // 随机选择一个事件
    const event = COLLECTIVE_EVENTS[Math.floor(Math.random() * COLLECTIVE_EVENTS.length)];
    
    // 显示事件选择弹窗
    this.showCollectiveEventDialog(event);
};

// 显示集体事件对话框
CultivationGame.prototype.showCollectiveEventDialog = function(event) {
    // 计算成功率
    const baseSuccessRate = event.difficulty === 'easy' ? 0.8 : 
                           event.difficulty === 'medium' ? 0.6 : 0.4;
    
    // 宗门实力加成
    const sectStrength = this.calculateSectStrength();
    const strengthBonus = Math.min(sectStrength / 1000, 0.3); // 最多30%加成
    
    const successRate = baseSuccessRate + strengthBonus;
    const successPercentage = Math.min(95, Math.floor(successRate * 100)); // 限制最高95%
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-slate-900 ancient-border rounded-lg p-6 max-w-md w-full mx-4">
            <h2 class="text-xl font-bold text-amber-200 mb-4">🌍 集体事件</h2>
            <div class="mb-4">
                <h3 class="text-lg font-bold text-yellow-400">${event.name}</h3>
                <p class="text-sm text-gray-300 mb-3">${event.description}</p>
                <div class="text-xs text-amber-300 mb-2">难度: ${event.difficulty}</div>
                <div class="text-xs text-cyan-400 mb-2 font-bold">成功概率: ${successPercentage}%</div>
                <div class="text-xs text-green-400 mb-2">奖励: ${this.formatEventReward(event.reward)}</div>
                <div class="text-xs text-red-400">失败惩罚: ${this.formatEventPenalty(event.penalty)}</div>
            </div>
            <div class="flex space-x-2">
                <button id="acceptEvent" class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors">
                    接受挑战 (${successPercentage}%)
                </button>
                <button id="ignoreEvent" class="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded transition-colors">
                    忽略事件
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定事件
    document.getElementById('acceptEvent').onclick = () => {
        this.resolveCollectiveEvent(event, true);
        modal.remove();
    };
    
    document.getElementById('ignoreEvent').onclick = () => {
        addLog(`[事件] 宗门选择忽略${event.name}`, 'text-gray-400');
        modal.remove();
    };
};

// 解决集体事件
CultivationGame.prototype.resolveCollectiveEvent = function(event, accept) {
    if (!accept) return;
    
    // 根据难度和宗门实力计算成功率
    const baseSuccessRate = event.difficulty === 'easy' ? 0.8 : 
                           event.difficulty === 'medium' ? 0.6 : 0.4;
    
    // 宗门实力加成
    const sectStrength = this.calculateSectStrength();
    const strengthBonus = Math.min(sectStrength / 1000, 0.3); // 最多30%加成
    
    const successRate = baseSuccessRate + strengthBonus;
    const success = Math.random() < successRate;
    
    if (success) {
        // 成功
        addLog(`[事件] 宗门成功应对${event.name}！`, 'text-green-400 font-bold');
        
        if (event.reward.reputation) {
            let reputationGain;
            if (Array.isArray(event.reward.reputation)) {
                reputationGain = Math.floor(Math.random() * (event.reward.reputation[1] - event.reward.reputation[0] + 1)) + event.reward.reputation[0];
            } else {
                reputationGain = event.reward.reputation;
            }
            gameState.reputation += reputationGain;
            addLog(`[声望] 获得${reputationGain}点声望`, 'text-yellow-400');
        }
        
        if (event.reward.spiritStones) {
            let spiritStonesGain;
            if (Array.isArray(event.reward.spiritStones)) {
                spiritStonesGain = Math.floor(Math.random() * (event.reward.spiritStones[1] - event.reward.spiritStones[0] + 1)) + event.reward.spiritStones[0];
            } else {
                spiritStonesGain = event.reward.spiritStones;
            }
            gameState.spiritStones += spiritStonesGain;
            addLog(`[灵石] 获得${spiritStonesGain}灵石`, 'text-emerald-400');
        }
        
        if (event.reward.breakthroughPills) {
            gameState.breakthroughPills += event.reward.breakthroughPills;
            addLog(`[丹药] 获得${event.reward.breakthroughPills}枚破境丹`, 'text-purple-400');
        }
        
        if (event.reward.experience) {
            // 根据宝物类型转化为战斗力
            const powerBonus = this.calculatePowerFromTreasure(event.reward.experience);
            
            // 给所有活着的弟子增加战斗力
            gameState.disciples.forEach(disciple => {
                if (disciple.alive) {
                    disciple.powerBonus = (disciple.powerBonus || 0) + powerBonus;
                }
            });
            
            addLog(`[宝物] 所有弟子获得宝物加持，战斗力+${powerBonus}！`, 'text-yellow-400 font-bold');
            this.calculateTotalPower(); // 重新计算总战力
        }
        
    } else {
        // 失败
        addLog(`[事件] 宗门应对${event.name}失败...`, 'text-red-400 font-bold');
        
        if (event.penalty.reputation) {
            const reputationLoss = Math.abs(event.penalty.reputation);
            gameState.reputation = Math.max(0, gameState.reputation - reputationLoss);
            addLog(`[声望] 损失${reputationLoss}点声望`, 'text-red-400');
        }
        
        if (event.penalty.spiritStones) {
            const spiritStonesLoss = Math.abs(event.penalty.spiritStones);
            gameState.spiritStones = Math.max(0, gameState.spiritStones - spiritStonesLoss);
            addLog(`[灵石] 损失${spiritStonesLoss}灵石`, 'text-red-400');
        }
        
        if (event.penalty.disciples) {
            // 随机损失弟子
            const aliveDisciples = gameState.disciples.filter(d => d.alive);
            const lossCount = Math.min(event.penalty.disciples, aliveDisciples.length);
            
            for (let i = 0; i < lossCount; i++) {
                const randomDisciple = aliveDisciples[Math.floor(Math.random() * aliveDisciples.length)];
                if (randomDisciple) {
                    randomDisciple.alive = false;
                    addLog(`[损失] ${randomDisciple.name}在事件中不幸遇难`, 'text-red-600');
                    aliveDisciples.splice(aliveDisciples.indexOf(randomDisciple), 1);
                }
            }
        }
    }
    
    updateDisplay(gameState);
};

// 格式化事件奖励
CultivationGame.prototype.formatEventReward = function(reward) {
    const parts = [];
    if (reward.reputation) parts.push(`声望 ${reward.reputation[0]}-${reward.reputation[1]}`);
    if (reward.spiritStones) parts.push(`灵石 ${reward.spiritStones[0]}-${reward.spiritStones[1]}`);
    if (reward.breakthroughPills) parts.push(`破境丹 ${reward.breakthroughPills}`);
    if (reward.experience) parts.push(`修为 +${reward.experience}`);
    if (reward.items) parts.push(`${reward.items}品质物品`);
    return parts.join(', ') || '无';
};

// 格式化事件惩罚
CultivationGame.prototype.formatEventPenalty = function(penalty) {
    const parts = [];
    if (penalty.reputation) parts.push(`声望 ${Math.abs(penalty.reputation)}`);
    if (penalty.spiritStones) parts.push(`灵石 ${Math.abs(penalty.spiritStones)}`);
    if (penalty.disciples) parts.push(`弟子 ${penalty.disciples}人`);
    return parts.join(', ') || '无';
};

// 检查弟子冲突
CultivationGame.prototype.checkDiscipleConflicts = function() {
    // 每60秒（60个tick）检查一次弟子冲突
    if (gameState.gameTick % 60 !== 0) return;
    
    const aliveDisciples = gameState.disciples.filter(d => d.alive);
    if (aliveDisciples.length < 2) return;
    
    // 随机选择一个冲突事件
    const conflict = DISCIPLE_CONFLICTS[Math.floor(Math.random() * DISCIPLE_CONFLICTS.length)];
    
    // 根据触发概率决定是否发生
    if (Math.random() > conflict.triggerChance) return;
    
    // 执行冲突事件
    this.resolveDiscipleConflict(conflict, aliveDisciples);
};

// 解决弟子冲突
CultivationGame.prototype.resolveDiscipleConflict = function(conflict, disciples) {
    let participants = [];
    let logMessage = '';
    
    switch (conflict.type) {
        case 'bullying':
            // 高等级欺负低等级
            const highRank = disciples.filter(d => (SECT_ORGANIZATION[d.organization]?.rank || 0) >= 2);
            const lowRank = disciples.filter(d => (SECT_ORGANIZATION[d.organization]?.rank || 0) <= 1);
            
            if (highRank.length > 0 && lowRank.length > 0) {
                const bully = highRank[Math.floor(Math.random() * highRank.length)];
                const victim = lowRank[Math.floor(Math.random() * lowRank.length)];
                
                participants = [bully, victim];
                
                if (Math.random() < conflict.effects.victim.injured) {
                    victim.injured = true;
                    logMessage = `[冲突] ${bully.name}霸凌${victim.name}，${victim.name}受伤了！`;
                } else {
                    logMessage = `[冲突] ${bully.name}霸凌${victim.name}，${victim.name}忍气吞声`;
                }
            }
            break;
            
        case 'challenge':
            // 随机两个弟子比试
            const shuffled = [...disciples].sort(() => Math.random() - 0.5);
            const challenger = shuffled[0];
            const opponent = shuffled[1];
            
            if (challenger && opponent) {
                participants = [challenger, opponent];
                const winner = Math.random() < 0.5 ? challenger : opponent;
                const loser = winner === challenger ? opponent : challenger;
                
                winner.cultivation = Math.min(100, winner.cultivation + conflict.effects.winner.cultivation);
                
                if (Math.random() < conflict.effects.loser.injured) {
                    loser.injured = true;
                    logMessage = `[冲突] ${challenger.name}与${opponent.name}比试，${winner.name}获胜，${loser.name}受伤！`;
                } else {
                    logMessage = `[冲突] ${challenger.name}与${opponent.name}比试，${winner.name}获胜`;
                }
            }
            break;
            
        case 'flirt':
            // 两个弟子产生情愫
            const male = disciples.filter(d => d.gender === '男');
            const female = disciples.filter(d => d.gender === '女');
            
            if (male.length > 0 && female.length > 0) {
                const lover1 = male[Math.floor(Math.random() * male.length)];
                const lover2 = female[Math.floor(Math.random() * female.length)];
                
                participants = [lover1, lover2];
                lover1.cultivation = Math.min(100, lover1.cultivation + conflict.effects.participants.cultivation);
                lover2.cultivation = Math.min(100, lover2.cultivation + conflict.effects.participants.cultivation);
                
                logMessage = `[冲突] ${lover1.name}与${lover2.name}暗中往来，修为都有所精进`;
            }
            break;
            
        case 'sabotage':
            // 弟子暗中破坏
            const saboteur = disciples[Math.floor(Math.random() * disciples.length)];
            const potentialVictims = disciples.filter(d => d.id !== saboteur.id);
            
            if (potentialVictims.length > 0) {
                const victim = potentialVictims[Math.floor(Math.random() * potentialVictims.length)];
                
                participants = [saboteur, victim];
                
                if (Math.random() < conflict.effects.victim.injured) {
                    victim.injured = true;
                    logMessage = `[冲突] ${saboteur.name}暗中破坏${victim.name}的修炼，${victim.name}受伤！`;
                } else {
                    logMessage = `[冲突] ${saboteur.name}试图破坏${victim.name}的修炼，但被发现`;
                }
            }
            break;
            
        case 'alliance':
            // 弟子结成联盟
            const allianceSize = Math.min(3, Math.floor(Math.random() * 3) + 2);
            const selectedAlliance = [...disciples].sort(() => Math.random() - 0.5).slice(0, allianceSize);
            
            participants = selectedAlliance;
            selectedAlliance.forEach(member => {
                member.cultivation = Math.min(100, member.cultivation + conflict.effects.members.cultivation);
            });
            
            const names = selectedAlliance.map(d => d.name).join('、');
            logMessage = `[冲突] ${names}结成小联盟，互相扶持修炼`;
            break;
    }
    
    if (logMessage) {
        addLog(logMessage, 'text-orange-400');
        updateDisplay(gameState);
    }
};

// 检查宗门升级
CultivationGame.prototype.checkSectUpgrade = function() {
    const currentLevel = gameState.sectLevel;
    const nextLevel = currentLevel + 1;
    
    if (nextLevel > 5) return; // 最高5级
    
    const requirements = SECT_UPGRADE_REQUIREMENTS[nextLevel];
    if (!requirements) return;
    
    const currentReputation = gameState.reputation;
    const currentDisciples = gameState.disciples.filter(d => d.alive).length;
    
    if (currentReputation >= requirements.reputation && currentDisciples >= requirements.disciples) {
        // 升级宗门
        gameState.sectLevel = nextLevel;
        
        addLog(`[升级] 恭喜！宗门升级至${nextLevel}级！`, 'text-purple-400');
        
        // 解锁新建筑
        const buildings = {
            2: '功法堂',
            3: '炼丹房',
            4: '炼器房',
            5: '传功殿'
        };
        
        if (buildings[nextLevel]) {
            gameState.unlockedBuildings.push(buildings[nextLevel]);
            addLog(`[解锁] 解锁了${buildings[nextLevel]}！`, 'text-blue-400');
        }
        
        updateDisplay(gameState);
    }
};

// 游戏实例
let game = null;

// DOM加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，开始初始化游戏...');
    
    game = new CultivationGame();
    
    // 导出游戏实例（用于调试和UI访问）
    window.game = game;
    
    // 添加一个方法来获取gameState
    Object.defineProperty(game, 'gameState', {
        get: () => gameState
    });
    
    game.init();
    
    console.log('修仙宗门模拟器启动完成！');
});
