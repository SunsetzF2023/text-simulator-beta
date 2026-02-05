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
        const playerPower = this.calculatePlayerPower();
        const sectCount = 5 + Math.floor(Math.random() * 5); // 5-9个宗门
        
        for (let i = 0; i < sectCount; i++) {
            const sect = this.generateNPCSect(playerPower);
            sects.push(sect);
        }
        
        // 按战力排序
        sects.sort((a, b) => b.totalPower - a.totalPower);
        
        return sects;
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
            talent: 70 + Math.random() * 30, // 70-100天赋
            loyalty: 80 + Math.random() * 20 // 80-100忠诚度
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
        
        if (powerRatio > 2.0) return 'fearful'; // 恐惧
        if (powerRatio > 1.5) return 'respectful'; // 尊敬
        if (powerRatio > 0.8) return 'neutral'; // 中立
        if (powerRatio > 0.5) return 'disdainful'; // 轻视
        return 'hostile'; // 敌对
    }
    
    // 初始化游戏
    async init() {
        console.log('初始化游戏...');
        
        // 设置开始按钮事件
        this.setupStartButton();
        
        // 检查是否有存档
        if (hasSaveData()) {
            this.checkLoadSave();
        }
        
        console.log('游戏初始化完成');
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
        console.log('启动游戏循环...');
        
        // 设置按钮事件监听器
        this.setupGameButtons();
        
        // 启动主心跳（每秒触发）
        this.gameLoop = setInterval(() => this.gameTick(), GAME_CONFIG.AUTO_GAIN_INTERVAL);
        
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
        
        // 检查宗门升级
        this.checkSectUpgrade();
        
        // 每10个tick显示一次心跳信息（调试用）
        if (gameState.gameTick % 10 === 0) {
            console.log(`游戏心跳: ${gameState.gameTick}, 灵石: ${gameState.spiritStones.toFixed(1)}`);
        }
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
            newDisciple.loyalty = 80 + Math.random() * 15; // 初始忠诚度更高
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
            if (!this.isRunning) return;
            
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
        const playerPower = this.calculatePlayerPower();
        const enemyPower = playerPower * (1.2 + Math.random() * 0.3); // 120%-150%的战力
        
        const enemy = this.generateNPCSect(enemyPower);
        addLog(`[挑战] ${enemy.name}宗主${enemy.master.name}听闻${gameState.playerName}突破，前来挑战！`, 'text-red-400 font-bold');
        addLog(`[挑战] 敌方战力：${enemy.totalPower}，我方战力：${gameState.totalPower}`, 'text-red-400');
        
        // 简化的战斗结果
        const winChance = gameState.totalPower / enemy.totalPower;
        const victory = Math.random() < winChance;
        
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
    
    // 弟子倒戈事件
    triggerDiscipleDefection(newRealm) {
        const eligibleDisciples = gameState.disciples.filter(d => d.alive && d.loyalty < 85);
        
        if (eligibleDisciples.length === 0) {
            addLog(`[道心] ${gameState.playerName}突破引发道心考验，弟子们忠诚坚定，无人动摇！`, 'text-blue-400');
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
    
    // 处理地区查看
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
        if (modal) {
            modal.classList.remove('hidden');
            console.log('显示地区查看');
        }
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
    const invadingSect = INVADING_SECTS[Math.floor(Math.random() * INVADING_SECTS.length)];
    
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
            
            // 忠诚度加成
            const loyaltyBonus = disciple.loyalty / 100;
            
            strength += baseStrength * (1 + talentBonus) * loyaltyBonus;
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
            addLog(`[丹药] 获得${event.reward.breakthroughPills}枚突破丹`, 'text-purple-400');
        }
        
        if (event.reward.experience) {
            // 给所有弟子加修为
            gameState.disciples.forEach(disciple => {
                if (disciple.alive) {
                    disciple.cultivation = Math.min(100, disciple.cultivation + 10);
                }
            });
            addLog(`[修炼] 所有弟子修为+10`, 'text-blue-400');
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
    if (reward.breakthroughPills) parts.push(`突破丹 ${reward.breakthroughPills}`);
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
                bully.loyalty += conflict.effects.bully.loyalty;
                victim.loyalty += conflict.effects.victim.loyalty;
                
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
                
                winner.loyalty += conflict.effects.winner.loyalty;
                winner.cultivation = Math.min(100, winner.cultivation + conflict.effects.winner.cultivation);
                loser.loyalty += conflict.effects.loser.loyalty;
                
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
                lover1.loyalty += conflict.effects.participants.loyalty;
                lover2.loyalty += conflict.effects.participants.loyalty;
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
                saboteur.loyalty += conflict.effects.saboteur.loyalty;
                victim.loyalty += conflict.effects.victim.loyalty;
                
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
                member.loyalty += conflict.effects.members.loyalty;
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
