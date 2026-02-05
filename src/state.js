import { GAME_CONFIG } from './data/constants.js';

// 全局游戏状态
export const gameState = {
    // 玩家信息
    playerName: '',
    gender: '',
    sectName: '',
    sectStyle: '',
    spiritRoot: '',
    playerRealm: '凡人',
    playerSpouse: '',
    
    // 资源
    spiritStones: GAME_CONFIG.INITIAL_SPIRIT_STONES,
    breakthroughPills: 0,
    reputation: 0,
    
    // AI配置
    config: {
        aiProvider: localStorage.getItem('ai_provider') || 'qwen',
        claudeApiKey: localStorage.getItem('claude_api_key') || '',
        claudeBaseURL: localStorage.getItem('claude_base_url') || 'https://api.anthropic.com',
        claudeMaxTokens: 100,
        claudeModel: 'claude-3-5-sonnet-20241022',
        qwenApiKey: localStorage.getItem('qwen_api_key') || '',
        qwenMaxTokens: 100,
        qwenModel: 'qwen-turbo'
    },
    
    // 弟子
    disciples: [],
    
    // 建筑
    buildings: {},
    
    // 游戏时间
    gameTick: 0,
    gameTime: 0,
    
    // 任务
    activeTasks: [],
    completedTasks: [],
    
    // 坊市
    marketItems: [],
    lastMarketRefresh: 0,
    
    // 拍卖会
    auctionItems: [],
    auctionEndTime: 0,
    playerBids: {},
    
    // 宗门影响力
    influence: 1, // 影响力等级
    influenceReputation: 0, // 当前影响力声望
    
    // 势力范围
    regions: [], // 附近地区
    
    // 功法系统
    techniqueFragments: [], // 功法残本
    sectLevel: 1, // 宗门等级
    unlockedBuildings: [], // 解锁的建筑
    techniqueHall: [], // 功法堂 - 存储已购买的功法
    
    // 宗门宝库
    treasury: {
        pills: [], // 丹药
        weapons: [], // 武器
        materials: [], // 材料
        other: [] // 其他物品
    },
    
    // 踢馆系统
    invasionCooldown: 0, // 踢馆冷却时间
    invasionHistory: [], // 踢馆历史
    
    // 拜访和事件
    visitedFactions: [], // 已拜访的势力
    alliances: [], // 同盟
    enemies: [], // 敌对势力
    activeEvents: [], // 当前事件
    eventHistory: [], // 历史事件
    
    // 时间系统
    gameTime: 0, // 游戏时间（分钟）
    currentYear: 1, // 当前年份
    currentMonth: 1, // 当前月份 (1-12)
    currentDay: 1, // 当前日期 (1-30)
    lastRecruitmentYear: 0, // 上次招徒年份
    recruitmentCooldown: 0, // 招徒冷却时间
    
    // 宗门架构
    organization: {
        // 宗主：玩家自己
        sectMaster: {
            id: 'player',
            name: '宗主',
            position: '宗主',
            level: '宗主',
            managedBy: null
        },
        // 长老层
        elders: [], // 内门长老列表
        // 执事层
        managers: [], // 外门执事、内门执事等
        // 弟子分层
        outerDisciples: [], // 外门弟子
        innerDisciples: [], // 内门弟子
        personalDisciples: [], // 亲传弟子
        // 职位配置
        positions: {
            outerManager: { name: '外门执事', count: 0, maxCount: 3, current: [] }, // 增加到3人
            innerManager: { name: '内门执事', count: 0, maxCount: 4, current: [] }, // 增加到4人
            teachingElder: { name: '传功长老', count: 0, maxCount: 2, current: [] }, // 新增
            outerElder: { name: '外门长老', count: 0, maxCount: 2, current: [] }, // 增加到2人
            innerElder: { name: '内门长老', count: 0, maxCount: 3, current: [] }, // 增加到3人
            grandElder: { name: '太上长老', count: 0, maxCount: 2, current: [] }, // 增加到2人
            enforcementElder: { name: '执法长老', count: 0, maxCount: 1, current: [] }, // 新增
            resourceElder: { name: '资源长老', count: 0, maxCount: 1, current: [] }  // 新增
        }
    }
};

// 保存游戏
export function saveGame() {
    try {
        const saveData = {
            gameState: JSON.parse(JSON.stringify(gameState)),
            timestamp: Date.now(),
            version: '1.0.0'
        };
        localStorage.setItem('cultivationSectSave', JSON.stringify(saveData));
        console.log('游戏已保存');
        return true;
    } catch (error) {
        console.error('保存游戏失败:', error);
        return false;
    }
}

// 加载游戏
export function loadGame() {
    try {
        const saveData = localStorage.getItem('cultivationSectSave');
        if (!saveData) {
            console.log('没有找到存档');
            return false;
        }
        
        const parsed = JSON.parse(saveData);
        
        // 恢复游戏状态
        Object.assign(gameState, parsed.gameState);
        
        console.log('游戏已加载');
        return true;
    } catch (error) {
        console.error('加载游戏失败:', error);
        return false;
    }
}

// 重置游戏
export function resetGame() {
    // 保存玩家信息（如果存在）
    const playerInfo = {
        playerName: gameState.playerName,
        gender: gameState.gender,
        sectName: gameState.sectName,
        sectStyle: gameState.sectStyle,
        spiritRoot: gameState.spiritRoot,
        playerRealm: gameState.playerRealm
    };
    
    // 清空游戏状态
    gameState.playerName = '';
    gameState.gender = '';
    gameState.sectName = '';
    gameState.sectStyle = '';
    gameState.spiritRoot = '';
    gameState.playerRealm = '凡人';
    gameState.spiritStones = GAME_CONFIG.INITIAL_SPIRIT_STONES;
    gameState.breakthroughPills = 0;
    gameState.reputation = 0;
    gameState.disciples = [];
    gameState.buildings = {};
    gameState.gameTick = 0;
    gameState.gameTime = 0;
    gameState.activeTasks = [];
    gameState.completedTasks = [];
    gameState.events = [];
    gameState.techniqueHall = []; // 重置功法堂
    
    // 恢复玩家信息
    Object.assign(gameState, playerInfo);
    
    console.log('游戏已重置');
}

// 检查是否有存档
export function hasSaveData() {
    return localStorage.getItem('cultivationSectSave') !== null;
}

// 获取存档时间戳
export function getSaveTimestamp() {
    try {
        const saveData = localStorage.getItem('cultivationSectSave');
        if (!saveData) return null;
        
        const parsed = JSON.parse(saveData);
        return new Date(parsed.timestamp);
    } catch (error) {
        console.error('获取存档时间戳失败:', error);
        return null;
    }
}

// 删除存档
export function deleteSave() {
    try {
        localStorage.removeItem('cultivationSectSave');
        console.log('存档已删除');
        return true;
    } catch (error) {
        console.error('删除存档失败:', error);
        return false;
    }
}

// 导出游戏数据
export function exportGameData() {
    try {
        const saveData = {
            gameState: JSON.parse(JSON.stringify(gameState)),
            timestamp: Date.now(),
            version: '1.0.0'
        };
        
        const dataStr = JSON.stringify(saveData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `cultivation_sect_save_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        
        console.log('游戏数据已导出');
        return true;
    } catch (error) {
        console.error('导出游戏数据失败:', error);
        return false;
    }
}

// 导入游戏数据
export function importGameData(file) {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const saveData = JSON.parse(e.target.result);
                    
                    // 验证数据格式
                    if (!saveData.gameState || !saveData.version) {
                        throw new Error('无效的存档格式');
                    }
                    
                    // 恢复游戏状态
                    Object.assign(gameState, saveData.gameState);
                    
                    console.log('游戏数据已导入');
                    resolve(true);
                } catch (error) {
                    console.error('导入数据解析失败:', error);
                    reject(error);
                }
            };
            
            reader.onerror = function() {
                console.error('文件读取失败');
                reject(new Error('文件读取失败'));
            };
            
            reader.readAsText(file);
        } catch (error) {
            console.error('导入游戏数据失败:', error);
            reject(error);
        }
    });
}

// 保存AI配置
export function saveAIConfig(config) {
    gameState.config = { ...gameState.config, ...config };
    
    // 保存到localStorage
    if (config.aiProvider) localStorage.setItem('ai_provider', config.aiProvider);
    if (config.claudeApiKey) localStorage.setItem('claude_api_key', config.claudeApiKey);
    if (config.claudeBaseURL) localStorage.setItem('claude_base_url', config.claudeBaseURL);
    if (config.qwenApiKey) localStorage.setItem('qwen_api_key', config.qwenApiKey);
    if (config.siliconflowApiKey) localStorage.setItem('siliconflow_api_key', config.siliconflowApiKey);
    
    saveGame();
}

// 获取AI配置
export function getAIConfig() {
    return {
        aiProvider: localStorage.getItem('ai_provider') || 'siliconflow',
        claudeApiKey: localStorage.getItem('claude_api_key') || '',
        claudeBaseURL: localStorage.getItem('claude_base_url') || 'https://api.anthropic.com',
        claudeMaxTokens: parseInt(localStorage.getItem('claude_max_tokens')) || 50,
        claudeModel: localStorage.getItem('claude_model') || 'claude-3-5-sonnet-20241022',
        qwenApiKey: localStorage.getItem('qwen_api_key') || '',
        qwenMaxTokens: parseInt(localStorage.getItem('qwen_max_tokens')) || 50,
        qwenModel: localStorage.getItem('qwen_model') || 'qwen-turbo',
        siliconflowApiKey: localStorage.getItem('siliconflow_api_key') || '',
        siliconflowMaxTokens: parseInt(localStorage.getItem('siliconflow_max_tokens')) || 50,
        siliconflowModel: localStorage.getItem('siliconflow_model') || 'deepseek-ai/DeepSeek-V3'
    };
}

// 获取游戏统计信息
export function getGameStats() {
    return {
        playTime: gameState.gameTime,
        totalDisciples: gameState.disciples.length,
        aliveDisciples: gameState.disciples.filter(d => d.alive).length,
        totalSpiritStones: gameState.spiritStones,
        totalBreakthroughPills: gameState.breakthroughPills,
        completedTasks: gameState.completedTasks.length,
        currentRealm: gameState.playerRealm,
        sectReputation: gameState.reputation
    };
}
