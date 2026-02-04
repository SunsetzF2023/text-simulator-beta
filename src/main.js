import { gameState, saveGame, loadGame, hasSaveData, resetGame } from './state.js';
import { Disciple } from './models/Disciple.js';
import { 
    REALMS, 
    GAME_CONFIG, 
    TASK_TEMPLATES, 
    MARKET_ITEMS, 
    INFLUENCE_LEVELS,
    INVASION_CONFIG,
    INVADING_SECTS,
    SECT_UPGRADE_REQUIREMENTS,
    COLLECTIVE_EVENTS,
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
        
        // 显示游戏界面
        showGameContainer();
        
        // 更新显示
        updateDisplay(gameState);
        
        // 添加加载日志
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
    
    // 处理自动增益
    processAutoGain() {
        const aliveDisciples = gameState.disciples.filter(d => d.alive && !d.injured);
        if (aliveDisciples.length > 0) {
            const gain = aliveDisciples.length * GAME_CONFIG.AUTO_GAIN_PER_DISCIPLE;
            gameState.spiritStones += gain;
            updateDisplay(gameState);
            
            // 每分钟显示一次自动增益日志
            if (Math.floor(Date.now() / 60000) !== Math.floor((Date.now() - 1000) / 60000)) {
                addLog(`[自动] 弟子们为您带来了 ${gain.toFixed(1)} 枚灵石。`, 'text-amber-300');
            }
        }
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
                    
                    // 总加成
                    const totalBonus = spiritRootBonus * constitutionBonus * talentBonus;
                    experienceGain = Math.floor(experienceGain * totalBonus);
                    
                    // 应用修为
                    disciple.cultivation = Math.min(100, disciple.cultivation + experienceGain);
                    
                    // 检查突破
                    if (disciple.cultivation >= 100) {
                        this.checkBreakthrough(disciple);
                    }
                    
                    if (totalBonus > 1.5) {
                        addLog(`[修炼] ${disciple.name}修炼神速，获得${experienceGain}点修为！`, 'text-purple-400');
                    } else if (totalBonus > 1.0) {
                        addLog(`[修炼] ${disciple.name}修炼顺利，获得${experienceGain}点修为`, 'text-green-400');
                    }
                }
            }
            if (event.reward.consumeItem) {
                // 消耗宝库物品
                this.consumeTreasuryItem(event.reward.itemType);
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
                // 突破成功
                disciple.realm = REALMS[currentRealmIndex + 1];
                disciple.cultivation = 0;
                addLog(`[突破] ${disciple.name}成功突破到${disciple.realm}！`, 'text-yellow-400 font-bold');
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
            onRegion: () => this.handleRegion()
        });
    }
    
    // 处理采集灵石
    handleCollect() {
        const realmIndex = REALMS.indexOf(gameState.playerRealm);
        const efficiency = Math.pow(1.5, Math.floor(realmIndex / 9));
        const gain = Math.floor(efficiency);
        
        gameState.spiritStones += gain;
        updateDisplay(gameState);
        addLog(`[采集] ${gameState.playerName} 采集了${gain}枚灵石。`, 'text-emerald-400');
        
        console.log(`采集灵石: +${gain}`);
    }
    
    // 处理突破境界
    handleBreakthrough() {
        const currentIndex = REALMS.indexOf(gameState.playerRealm);
        
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
            } else {
                addLog('[突破] 需要破境丹和50灵石才能突破到大境界！', 'text-red-400');
            }
        } else {
            // 小境界突破
            const cost = (Math.floor(currentIndex / 9) + 1) * GAME_CONFIG.BREAKTHROUGH_BASE_COST;
            if (gameState.spiritStones >= cost) {
                gameState.spiritStones -= cost;
                gameState.playerRealm = REALMS[currentIndex + 1];
                updateDisplay(gameState);
                addLog(`[突破] ${gameState.playerName} 消耗${cost}灵石，突破至${gameState.playerRealm}！`, 'text-purple-400');
            } else {
                addLog(`[突破] 灵石不足，需要${cost}灵石才能突破。`, 'text-red-400');
            }
        }
        
        console.log(`突破尝试: ${gameState.playerRealm}`);
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
        
        // 创建一个示例事件
        const eventDiv = document.createElement('div');
        eventDiv.className = 'bg-slate-800 p-4 rounded ancient-border';
        eventDiv.innerHTML = `
            <h3 class="text-lg font-bold text-amber-200 mb-2">🌟 灵脉发现</h3>
            <p class="text-gray-300 mb-4">宗门附近发现了一条灵脉，可以获得大量灵石，但可能有守护兽。</p>
            <div class="flex gap-2">
                <button class="event-accept px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors" data-event="spiritVein">
                    接受挑战
                </button>
                <button class="event-ignore px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors" data-event="spiritVein">
                    忽略事件
                </button>
            </div>
        `;
        
        eventsList.appendChild(eventDiv);
        
        // 添加事件按钮监听器
        eventDiv.querySelectorAll('.event-accept').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.dataset.event;
                this.handleEventAccept(eventId);
            });
        });
        
        eventDiv.querySelectorAll('.event-ignore').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.dataset.event;
                this.handleEventIgnore(eventId);
            });
        });
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
