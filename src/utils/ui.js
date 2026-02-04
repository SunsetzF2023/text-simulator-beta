import { TASK_TEMPLATES, GAME_CONFIG, MARKET_ITEMS, AUCTION_CONFIG, RARITY_CONFIG, INFLUENCE_LEVELS, VISIT_EVENTS, COLLECTIVE_EVENTS, REGION_CONFIG, REALMS, TRAITS } from '../data/constants.js';

// 更新主界面显示
export function updateDisplay(gameState) {
    console.log('=== updateDisplay 开始 ===');
    console.log('gameState:', gameState);
    
    // 强制迁移天赋词条数据
    gameState.disciples.forEach(disciple => {
        if (disciple.traits && disciple.traits.length > 0) {
            // 检查是否是旧格式（对象）
            if (typeof disciple.traits[0] === 'object' && disciple.traits[0].name) {
                disciple.traits = disciple.traits.map(trait => trait.name);
                console.log(`强制迁移弟子 ${disciple.name} 的天赋词条数据`);
            }
        }
    });
    
    console.log('开始更新宗门架构');
    // 更新宗门架构
    updateOrganizationDisplay(gameState);
    
    console.log('开始更新宗门信息');
    // 更新宗门信息
    const displaySectName = document.getElementById('displaySectName');
    const displayName = document.getElementById('displayName');
    const playerRealm = document.getElementById('playerRealm');
    
    if (displaySectName) displaySectName.textContent = gameState.sectName || '-';
    if (displayName) displayName.textContent = gameState.playerName || '-';
    if (playerRealm) playerRealm.textContent = gameState.playerRealm || '凡人';
    
    // 更新资源
    const spiritStones = document.getElementById('spiritStones');
    const breakthroughPills = document.getElementById('breakthroughPills');
    const reputation = document.getElementById('reputation');
    
    if (spiritStones) spiritStones.textContent = gameState.spiritStones || 0;
    if (breakthroughPills) breakthroughPills.textContent = gameState.breakthroughPills || 0;
    if (reputation) reputation.textContent = gameState.reputation || 0;
    
    // 更新影响力信息
    updateInfluenceDisplay(gameState);
    
    // 更新弟子列表
    updateDiscipleList(gameState);
}

// 更新影响力显示
function updateInfluenceDisplay(gameState) {
    const influenceElement = document.getElementById('influence');
    if (influenceElement) {
        influenceElement.textContent = gameState.influence || 0;
    }
}

// 计算战力
function calculateCombatPower(disciple) {
    if (!disciple.alive) return 0;
    
    // 基础战力：天赋 × 10 (天赋范围1-100，所以基础战力10-1000)
    let power = disciple.talent * 10;
    
    // 修为加成：修为 × 2 (修为0-100，所以加成0-200)
    power += disciple.cultivation * 2;
    
    // 境界加成：根据境界等级大幅提升
    const realmIndex = REALMS.indexOf(disciple.realm);
    if (realmIndex >= 0) {
        // 炼气期：0-10
        // 筑基期：11-20 (+100基础)
        // 金丹期：21-30 (+300基础)
        // 元婴期：31-40 (+600基础)
        // 化神期：41-50 (+1000基础)
        if (realmIndex >= 11 && realmIndex <= 20) { // 筑基
            power += 100;
        } else if (realmIndex >= 21 && realmIndex <= 30) { // 金丹
            power += 300;
        } else if (realmIndex >= 31 && realmIndex <= 40) { // 元婴
            power += 600;
        } else if (realmIndex >= 41 && realmIndex <= 50) { // 化神
            power += 1000;
        }
    }
    
    // 体质加成：特殊体质提供额外加成
    if (disciple.constitution && disciple.constitution.combat) {
        power *= disciple.constitution.combat; // 体质加成是乘数
    }
    
    // 忠诚度加成：忠诚度越高，发挥越稳定 (0-10)
    power += disciple.loyalty / 10;
    
    // 家世背景加成：小幅加成
    if (disciple.familyBackground && disciple.familyBackground.bonus) {
        const bonus = disciple.familyBackground.bonus;
        if (bonus.spiritStones) {
            power += Math.min(bonus.spiritStones, 50); // 最多加50
        }
        if (bonus.reputation) {
            power += Math.min(bonus.reputation * 2, 100); // 最多加100
        }
    }
    
    return Math.floor(power);
}

// 生成弟子携带宝物
function generateTreasures(disciple) {
    const treasures = [];
    
    // 根据修为境界生成宝物
    const realmIndex = REALMS.indexOf(disciple.realm);
    if (realmIndex >= 20) { // 筑基期以上
        treasures.push('基础法器');
    }
    if (realmIndex >= 30) { // 金丹期以上
        treasures.push('中级丹药');
    }
    if (realmIndex >= 40) { // 元婴期以上
        treasures.push('高级符箓');
    }
    
    // 根据家世背景添加宝物
    if (disciple.familyBackground && disciple.familyBackground.name) {
        if (disciple.familyBackground.name.includes('贵族')) {
            treasures.push('家族传家宝');
        }
        if (disciple.familyBackground.name.includes('商人')) {
            treasures.push('灵石袋');
        }
    }
    
    // 根据特殊体质添加宝物
    if (disciple.constitution && disciple.constitution.name) {
        if (disciple.constitution.name.includes('灵体')) {
            treasures.push('护身符');
        }
    }
    
    // 如果没有宝物，给一个基础的
    if (treasures.length === 0) {
        treasures.push('无');
    }
    
    return treasures;
}

// 更新弟子列表
export function updateDiscipleList(gameState) {
    const discipleList = document.getElementById('discipleList');
    if (!discipleList) return;
    
    discipleList.innerHTML = '';
    
    gameState.disciples.forEach(disciple => {
        const discipleCard = createDiscipleCard(disciple, gameState);
        discipleList.appendChild(discipleCard);
    });
}

// 创建弟子卡片
function createDiscipleCard(disciple, gameState) {
    const card = document.createElement('div');
    card.className = 'disciple-card p-3 bg-slate-800 rounded ancient-border cursor-pointer';
    
    const statusColor = disciple.alive ? (disciple.injured ? 'text-yellow-400' : 'text-emerald-400') : 'text-red-400';
    const taskStatus = disciple.onTask ? ' (任务中)' : '';
    
    card.innerHTML = `
        <div class="flex justify-between items-center">
            <div class="${statusColor}">
                <div class="font-bold">${disciple.name}${taskStatus}</div>
                <div class="text-xs">${disciple.realm} | ${disciple.spiritRoot}灵根</div>
                <div class="text-xs">天赋: ${disciple.talent.toFixed(1)} | 忠诚: ${disciple.loyalty}</div>
            </div>
            <div class="text-xs text-amber-300">
                ${disciple.alive ? (disciple.injured ? '受伤' : '健康') : '已故'}
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => {
        showDiscipleDetails(disciple, gameState);
    });
    
    return card;
}

// 显示弟子详情
export function showDiscipleDetails(disciple, gameState) {
    const modal = document.getElementById('discipleModal');
    const details = document.getElementById('discipleDetails');
    
    if (!modal || !details) return;
    
    // 计算战力
    const combatPower = calculateCombatPower(disciple);
    
    details.innerHTML = `
        <div class="grid grid-cols-2 gap-4">
            <div>
                <h3 class="text-lg font-bold text-amber-200 mb-2">👤 基本信息</h3>
                <p><span class="text-amber-300">姓名:</span> <span class="text-cyan-400 font-bold">${disciple.name}</span></p>
                <p><span class="text-amber-300">性别:</span> ${disciple.gender}</p>
                <p><span class="text-amber-300">年龄:</span> ${disciple.age}岁</p>
                <p><span class="text-amber-300">灵根:</span> <span class="text-blue-400">${disciple.spiritRoot}</span></p>
                <p><span class="text-amber-300">体质:</span> <span class="text-purple-400 font-bold">${disciple.constitution.name}</span></p>
                <p><span class="text-amber-300">体质描述:</span> <span class="text-gray-400 text-sm">${disciple.constitution.description}</span></p>
                <p><span class="text-amber-300">家世背景:</span> <span class="text-green-400">${disciple.familyBackground.name}</span></p>
                <p><span class="text-amber-300">家世描述:</span> <span class="text-gray-400 text-sm">${disciple.familyBackground.description}</span></p>
                <p><span class="text-amber-300">性格:</span> ${disciple.personality}</p>
                <p><span class="text-amber-300">外貌:</span> ${disciple.appearance}</p>
            </div>
            <div>
                <h3 class="text-lg font-bold text-amber-200 mb-2">⚔️ 修炼状态</h3>
                <p><span class="text-amber-300">境界:</span> <span class="text-yellow-400 font-bold">${disciple.realm}</span></p>
                <p><span class="text-amber-300">修为:</span> 
                    <div class="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div class="bg-blue-500 h-2 rounded-full" style="width: ${disciple.cultivation}%"></div>
                    </div>
                    <span class="text-blue-400">${disciple.cultivation.toFixed(1)}%</span>
                </p>
                <p><span class="text-amber-300">战力:</span> <span class="text-red-400 font-bold text-lg">${combatPower}</span></p>
                <p><span class="text-amber-300">天赋:</span> <span class="text-orange-400">${disciple.talent.toFixed(1)}/100</span></p>
                <p><span class="text-amber-300">忠诚度:</span> 
                    <div class="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div class="bg-green-500 h-2 rounded-full" style="width: ${disciple.loyalty}%"></div>
                    </div>
                    <span class="text-green-400">${disciple.loyalty}/100</span>
                </p>
                <p><span class="text-amber-300">状态:</span> 
                    <span class="${disciple.alive ? (disciple.injured ? 'text-yellow-400' : 'text-green-400') : 'text-red-400'} font-bold">
                        ${disciple.alive ? (disciple.injured ? '🏥 受伤治疗中' : (disciple.onTask ? '⚡ 任务执行中' : '✅ 正常')) : '💀 已故'}
                    </span>
                </p>
                <p><span class="text-amber-300">好感度:</span> <span class="text-pink-400">${disciple.affection}/100</span></p>
                <p><span class="text-amber-300">好感等级:</span> <span class="text-pink-400 font-bold">${disciple.affectionLevel.name || '未知'}</span></p>
            </div>
        </div>
        
        <div class="mt-4">
            <h3 class="text-lg font-bold text-amber-200 mb-2">🌟 天赋词条</h3>
            <div class="flex flex-wrap gap-2">
                ${disciple.traits.map(trait => {
                    // 确保trait是字符串，如果是对象则提取name
                    const traitName = typeof trait === 'object' ? trait.name : trait;
                    const traitType = TRAITS.find(t => t.name === traitName)?.type || 'neutral';
                    const colorClass = traitType === 'positive' ? 'text-green-400 bg-green-900' : 
                                     traitType === 'negative' ? 'text-red-400 bg-red-900' : 'text-yellow-400 bg-yellow-900';
                    return `<span class="px-3 py-1 rounded text-sm font-medium ${colorClass}">${traitName}</span>`;
                }).join('')}
            </div>
        </div>
        
        <div class="mt-4">
            <h3 class="text-lg font-bold text-amber-200 mb-2">🎒 携带物品</h3>
            <div class="grid grid-cols-3 gap-2">
                ${generateTreasures(disciple).map(treasure => 
                    `<div class="bg-slate-700 p-2 rounded text-center">
                        <span class="text-amber-300 text-sm">${treasure}</span>
                    </div>`
                ).join('')}
            </div>
        </div>
        
        <div class="mt-4">
            <h3 class="text-lg font-bold text-amber-200 mb-2">📜 个人日志</h3>
            <div class="max-h-32 overflow-y-auto bg-slate-800 p-3 rounded border border-slate-600">
                ${disciple.personalLog.slice(-5).map(log => 
                    `<p class="text-xs text-gray-300 mb-1">[${log.time || '未知时间'}] ${log.message}</p>`
                ).join('') || '<p class="text-xs text-gray-500">暂无日志</p>'}
            </div>
        </div>
        
        <div class="mt-4">
            <h3 class="text-lg font-bold text-amber-200 mb-2">🎮 操作</h3>
            ${disciple.alive ? `
                <div class="flex gap-2 mb-2">
                    <input type="text" id="discipleNameInput" value="${disciple.name}" 
                           class="flex-1 px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-400 focus:outline-none"
                           placeholder="输入新名字">
                    <button id="renameDiscipleBtn" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors">
                        ✏️ 改名
                    </button>
                </div>
                ${disciple.injured ? `
                    <button id="healBtn" class="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors">
                        💊 治疗 (消耗5灵石)
                    </button>
                ` : ''}
                <button id="arrangeMarriageBtn" class="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded transition-colors">
                    💑 安排道侣
                </button>
                <button id="expelBtn" class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded transition-colors">
                    ⚔️ 逐出宗门
                </button>
            ` : `
                <div class="text-red-400 font-bold">⚰️ 该弟子已经不在宗门</div>
            `}
        </div>
    `;
    
    // 显示模态框
    modal.classList.remove('hidden');
    
    // 设置事件监听器
    setupDiscipleModalEvents(disciple, gameState);
}

// 设置弟子模态框事件
function setupDiscipleModalEvents(disciple, gameState) {
    // 关闭按钮
    const closeBtn = document.getElementById('closeDiscipleModal');
    if (closeBtn) {
        closeBtn.onclick = () => {
            document.getElementById('discipleModal').classList.add('hidden');
        };
    }
    
    // 治疗按钮
    const healBtn = document.getElementById('healBtn');
    if (healBtn && disciple.injured) {
        healBtn.onclick = () => {
            if (gameState.spiritStones >= 5) {
                gameState.spiritStones -= 5;
                disciple.heal();
                updateDisplay(gameState);
                showDiscipleDetails(disciple, gameState); // 刷新详情
                addLog(`[治疗] 为${disciple.name}治疗伤势，消耗5灵石`, 'text-green-400');
            } else {
                addLog('[治疗] 灵石不足，需要5灵石才能治疗', 'text-red-400');
            }
        };
    }
    
    // 改名按钮
    const renameBtn = document.getElementById('renameDiscipleBtn');
    const nameInput = document.getElementById('discipleNameInput');
    if (renameBtn && nameInput && disciple.alive) {
        renameBtn.onclick = () => {
            const newName = nameInput.value.trim();
            if (newName && newName !== disciple.name) {
                const oldName = disciple.name;
                disciple.name = newName;
                disciple.addPersonalLog(`[改名] ${oldName} 改名为 ${newName}`, Date.now());
                updateDisplay(gameState);
                showDiscipleDetails(disciple, gameState); // 刷新详情
                addLog(`[改名] ${oldName} 改名为 ${newName}`, 'text-blue-400');
            } else if (newName === disciple.name) {
                addLog('[改名] 新名字与原名相同', 'text-gray-400');
            } else {
                addLog('[改名] 请输入有效的名字', 'text-red-400');
            }
        };
        
        // 回车键也可以改名
        nameInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                renameBtn.click();
            }
        };
    }
    
    // 安排道侣按钮
    const marryBtn = document.getElementById('arrangeMarriageBtn');
    if (marryBtn && disciple.alive && !disciple.spouse) {
        marryBtn.onclick = () => {
            showMarriageOptions(disciple, gameState);
        };
    }
    
    // 逐出宗门按钮
    const expelBtn = document.getElementById('expelBtn');
    if (expelBtn && disciple.alive) {
        expelBtn.onclick = () => {
            if (confirm(`确定要将${disciple.name}逐出宗门吗？`)) {
                disciple.leaveSect();
                updateDisplay(gameState);
                document.getElementById('discipleModal').classList.add('hidden');
                addLog(`[宗门] ${disciple.name}被逐出宗门`, 'text-red-400');
            }
        };
    }
}

// 显示结婚选项
function showMarriageOptions(disciple, gameState) {
    const availablePartners = gameState.disciples.filter(d => 
        d.id !== disciple.id && 
        d.alive && 
        !d.spouse && 
        d.gender !== disciple.gender
    );
    
    if (availablePartners.length === 0) {
        addLog('[婚姻] 没有合适的结婚对象', 'text-yellow-400');
        return;
    }
    
    const partner = availablePartners[Math.floor(Math.random() * availablePartners.length)];
    
    if (confirm(`确定要让${disciple.name}与${partner.name}结为道侣吗？`)) {
        if (disciple.marry(partner)) {
            addLog(`[婚姻] ${disciple.name}与${partner.name}结为道侣，宗门氛围更加和谐`, 'text-pink-400');
            updateDisplay(gameState);
            showDiscipleDetails(disciple, gameState); // 刷新详情
        }
    }
}

// 获取状态文本
function getStatusText(details) {
    if (!details.alive) return '已故';
    if (details.injured) return '受伤';
    if (details.onTask) return '任务中';
    return '健康';
}

// 获取词条颜色
function getTraitColor(type) {
    switch (type) {
        case 'positive': return 'trait-positive';
        case 'negative': return 'trait-negative';
        default: return 'trait-neutral';
    }
}

// 显示任务堂
export function showTaskHall() {
    const modal = document.getElementById('taskHallModal');
    const taskList = document.getElementById('taskList');
    
    if (!modal || !taskList) return;
    
    // 生成随机任务
    const availableTasks = generateRandomTasks();
    
    taskList.innerHTML = `
        <div class="space-y-4">
            ${availableTasks.map(task => createTaskCard(task)).join('')}
        </div>
    `;
    
    // 显示模态框
    modal.classList.remove('hidden');
    
    // 设置关闭事件
    const closeBtn = document.getElementById('closeTaskHallModal');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.classList.add('hidden');
        };
    }
}

// 生成随机任务
function generateRandomTasks() {
    const tasks = [];
    const taskCount = Math.floor(Math.random() * 3) + 3; // 3-5个任务
    
    for (let i = 0; i < taskCount; i++) {
        const template = TASK_TEMPLATES[Math.floor(Math.random() * TASK_TEMPLATES.length)];
        tasks.push({
            ...template,
            id: Date.now() + i,
            reward: { ...template.reward },
            difficulty: template.difficulty
        });
    }
    
    return tasks;
}

// 创建任务卡片
function createTaskCard(task) {
    const difficultyClass = getTaskDifficultyClass(task.difficulty);
    const difficultyText = getTaskDifficultyText(task.difficulty);
    
    return `
        <div class="task-card p-4 bg-slate-800 rounded ancient-border ${difficultyClass}">
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-bold text-amber-200">${task.name}</h4>
                <span class="text-xs px-2 py-1 bg-slate-700 rounded">${difficultyText}</span>
            </div>
            <p class="text-sm text-amber-300 mb-3">${task.description}</p>
            <div class="text-sm">
                <div class="text-emerald-400">奖励：</div>
                ${formatTaskReward(task.reward)}
            </div>
            <div class="mt-3">
                <button onclick="assignTask(${task.id})" class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors">
                    分配任务
                </button>
            </div>
        </div>
    `;
}

// 获取任务难度样式
function getTaskDifficultyClass(difficulty) {
    switch (difficulty) {
        case 1: return 'task-difficulty-easy';
        case 2: return 'task-difficulty-medium';
        case 3: return 'task-difficulty-hard';
        default: return '';
    }
}

// 获取任务难度文本
function getTaskDifficultyText(difficulty) {
    switch (difficulty) {
        case 1: return '简单';
        case 2: return '中等';
        case 3: return '困难';
        default: return '未知';
    }
}

// 格式化任务奖励
function formatTaskReward(reward) {
    const parts = [];
    if (reward.spiritStones) parts.push(`${reward.spiritStones}灵石`);
    if (reward.breakthroughPills) parts.push(`${reward.breakthroughPills}破境丹`);
    if (reward.experience) parts.push(`${reward.experience}修为`);
    if (reward.reputation) parts.push(`${reward.reputation}声望`);
    
    return parts.join('、') || '无';
}

// 分配任务
window.assignTask = function(taskId) {
    // 直接从全局获取gameState
    const gameState = window.game ? window.game.gameState : null;
    
    if (!gameState) {
        addLog('[任务] 游戏状态未找到，请确保游戏已启动', 'text-red-400');
        console.error('无法获取gameState，window.game:', window.game);
        return;
    }
    
    const availableDisciples = gameState.disciples.filter(d => d.alive && !d.injured && !d.onTask);
    
    if (availableDisciples.length === 0) {
        addLog('[任务] 没有可用的弟子执行任务', 'text-red-400');
        return;
    }
    
    // 简化版：随机选择弟子
    const disciple = availableDisciples[Math.floor(Math.random() * availableDisciples.length)];
    
    // 找到任务
    const taskCards = document.querySelectorAll('.task-card');
    let targetTask = null;
    
    taskCards.forEach(card => {
        if (card.innerHTML.includes(`assignTask(${taskId})`)) {
            // 从模板重新构建任务对象
            const taskName = card.querySelector('h4').textContent;
            const template = TASK_TEMPLATES.find(t => t.name === taskName);
            if (template) {
                targetTask = { ...template, id: taskId };
            }
        }
    });
    
    if (targetTask && disciple.acceptTask(targetTask)) {
        addLog(`[任务] ${disciple.name}接受了任务：${targetTask.name}`, 'text-blue-400');
        
        // 模拟任务执行
        setTimeout(() => {
            const result = disciple.executeTask();
            if (result) {
                if (result.success) {
                    // 发放奖励
                    if (result.reward) {
                        if (result.reward.spiritStones) gameState.spiritStones += result.reward.spiritStones;
                        if (result.reward.breakthroughPills) gameState.breakthroughPills += result.reward.breakthroughPills;
                        if (result.reward.reputation) gameState.reputation += result.reward.reputation;
                    }
                    addLog(result.message, 'text-green-400');
                } else {
                    addLog(result.message, 'text-red-400');
                }
                // 更新显示
                if (window.game && window.game.updateDisplay) {
                    window.game.updateDisplay();
                }
            }
        }, targetTask.duration || 5000);
        
        // 关闭任务堂
        document.getElementById('taskHallModal').classList.add('hidden');
    }
};

// 添加日志
export function addLog(message, colorClass = 'text-emerald-400') {
    const logContainer = document.getElementById('logContainer');
    if (!logContainer) return;
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry mb-2 ${colorClass} fade-in`;
    logEntry.innerHTML = `<span class="text-xs text-amber-300">[${new Date().toLocaleTimeString()}]</span> ${message}`;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // 限制日志数量
    const logs = logContainer.children;
    if (logs.length > 100) {
        logContainer.removeChild(logs[0]);
    }
}

// 显示/隐藏界面
export function showGameContainer() {
    const initModal = document.getElementById('initModal');
    const gameContainer = document.getElementById('gameContainer');
    
    if (initModal) initModal.classList.add('hidden');
    if (gameContainer) {
        gameContainer.classList.remove('hidden');
        // 强制设置flex布局，使用!important覆盖CSS
        gameContainer.style.setProperty('display', 'flex', 'important');
        gameContainer.style.setProperty('min-height', '100vh', 'important');
        gameContainer.style.setProperty('width', '100%', 'important');
        
        // 确保子容器也是flex布局
        const flexContainer = gameContainer.querySelector('div');
        if (flexContainer) {
            flexContainer.style.setProperty('display', 'flex', 'important');
            flexContainer.style.setProperty('min-height', '100vh', 'important');
            flexContainer.style.setProperty('width', '100%', 'important');
        }
    }
}

export function showInitModal() {
    const initModal = document.getElementById('initModal');
    const gameContainer = document.getElementById('gameContainer');
    
    if (initModal) initModal.classList.remove('hidden');
    if (gameContainer) gameContainer.classList.add('hidden');
}

// 获取表单数据
export function getFormData() {
    const sectName = document.getElementById('sectName')?.value?.trim() || '';
    const playerName = document.getElementById('playerName')?.value?.trim() || '';
    const gender = document.querySelector('input[name="gender"]:checked')?.value || '';
    const sectStyle = document.getElementById('sectStyle')?.value || '';
    const spiritRoot = document.getElementById('spiritRoot')?.value || '';
    
    return { sectName, playerName, gender, sectStyle, spiritRoot };
}

// 验证表单
export function validateForm(data) {
    return data.sectName && data.playerName;
}

// 设置按钮事件监听器
export function setupButtonListeners(callbacks) {
    console.log('开始设置按钮事件监听器...');
    const buttons = {
        collectBtn: () => callbacks.onCollect(),
        breakthroughBtn: () => callbacks.onBreakthrough(),
        recruitBtn: () => callbacks.onRecruit(),
        taskHallBtn: () => callbacks.onTaskHall(),
        marketBtn: () => callbacks.onMarket(),
        auctionBtn: () => callbacks.onAuction(),
        treasuryBtn: () => callbacks.onTreasury(),
        techniqueHallBtn: () => callbacks.onTechniqueHall(),
        pastRecordsBtn: () => callbacks.onPastRecords(),
        eventsBtn: () => callbacks.onEvents(),
        regionBtn: () => callbacks.onRegion()
    };
    
    Object.entries(buttons).forEach(([id, handler]) => {
        const button = document.getElementById(id);
        if (button) {
            console.log(`找到按钮 ${id}，添加事件监听器...`);
            button.addEventListener('click', (e) => {
                console.log(`按钮 ${id} 被点击！`, e);
                handler();
            });
            console.log(`按钮 ${id} 事件监听器设置完成`);
        } else {
            console.warn(`Button ${id} not found`);
        }
    });
    
    // 特别检查宝库按钮
    const treasuryBtn = document.getElementById('treasuryBtn');
    if (treasuryBtn) {
        console.log('宝库按钮找到，当前状态:', treasuryBtn.disabled);
    } else {
        console.warn('宝库按钮未找到！');
    }
    
    // 设置模态框关闭按钮
    const closeButtons = [
        'closeEventsModal',
        'closeRegionModal',
        'closeTreasuryModal',
        'closeTechniqueHallModal',
        'closePastRecordsModal'
    ];
    
    closeButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.fixed');
                if (modal) {
                    modal.classList.add('hidden');
                }
            });
        }
    });
    
    console.log('所有按钮事件监听器设置完成');
}

// 显示坊市
export function showMarket(gameState) {
    const modal = document.getElementById('marketModal');
    const marketItems = document.getElementById('marketItems');
    
    if (!modal || !marketItems) return;
    
    // 如果坊市为空或需要刷新，生成新商品
    if (gameState.marketItems.length === 0) {
        generateMarketItems(gameState);
    }
    
    marketItems.innerHTML = '';
    
    gameState.marketItems.forEach(item => {
        const itemCard = createMarketItemCard(item, gameState);
        marketItems.appendChild(itemCard);
    });
    
    // 显示模态框
    modal.classList.remove('hidden');
    
    // 设置关闭事件
    const closeBtn = document.getElementById('closeMarketModal');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.classList.add('hidden');
        };
    }
    
    // 设置刷新按钮事件
    const refreshBtn = document.getElementById('refreshMarketBtn');
    if (refreshBtn) {
        refreshBtn.onclick = () => {
            if (gameState.spiritStones >= 5) {
                gameState.spiritStones -= 5;
                generateMarketItems(gameState);
                showMarket(gameState); // 刷新显示
                addLog('[坊市] 消耗5灵石刷新商品', 'text-blue-400');
                if (window.game) window.game.updateDisplay();
            } else {
                addLog('[坊市] 灵石不足，需要5灵石才能刷新', 'text-red-400');
            }
        };
    }
}

// 生成坊市商品
function generateMarketItems(gameState) {
    gameState.marketItems = [];
    const itemCount = Math.floor(Math.random() * 6) + 8; // 8-13个商品
    
    for (let i = 0; i < itemCount; i++) {
        const template = MARKET_ITEMS[Math.floor(Math.random() * MARKET_ITEMS.length)];
        const priceVariation = 0.8 + Math.random() * 0.4; // 价格在80%-120%之间波动
        const item = {
            ...template,
            id: Date.now() + i,
            price: Math.floor(template.basePrice * priceVariation),
            stock: Math.floor(Math.random() * 3) + 1 // 1-3个库存
        };
        gameState.marketItems.push(item);
    }
    
    gameState.lastMarketRefresh = Date.now();
}

// 创建坊市商品卡片
function createMarketItemCard(item, gameState) {
    const card = document.createElement('div');
    const rarityInfo = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common;
    const canAfford = gameState.spiritStones >= item.price;
    const hasStock = item.stock > 0;
    
    card.className = `p-3 bg-slate-800 rounded ancient-border ${!canAfford || !hasStock ? 'opacity-50' : ''}`;
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <h4 class="font-bold ${rarityInfo.color}">${item.name}</h4>
            <span class="text-xs px-2 py-1 bg-slate-700 rounded ${rarityInfo.color}">${rarityInfo.name}</span>
        </div>
        <p class="text-xs text-amber-300 mb-2">${item.description}</p>
        <div class="flex justify-between items-center">
            <div>
                <span class="text-emerald-400 font-bold">${item.price}灵石</span>
                <span class="text-xs text-gray-400 ml-2">库存: ${item.stock}</span>
            </div>
            ${canAfford && hasStock ? `
                <button onclick="buyMarketItem(${item.id})" class="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors">
                    购买
                </button>
            ` : `
                <button disabled class="px-3 py-1 bg-gray-600 text-gray-400 text-xs rounded">
                    ${!hasStock ? '售罄' : '灵石不足'}
                </button>
            `}
        </div>
    `;
    
    return card;
}

// 购买坊市商品
window.buyMarketItem = function(itemId) {
    const gameState = window.game ? window.game.gameState : null;
    if (!gameState) return;
    
    const item = gameState.marketItems.find(i => i.id === itemId);
    if (!item) return;
    
    if (gameState.spiritStones >= item.price && item.stock > 0) {
        gameState.spiritStones -= item.price;
        item.stock--;
        
        addLog(`[坊市] 购买了${item.name}，消耗${item.price}灵石`, 'text-green-400');
        
        // 应用物品效果
        applyItemEffect(item, gameState);
        
        // 如果库存为0，移除商品
        if (item.stock <= 0) {
            gameState.marketItems = gameState.marketItems.filter(i => i.id !== itemId);
        }
        
        // 刷新显示
        showMarket(gameState);
        if (window.game) window.game.updateDisplay();
    }
};

// 应用物品效果（存入宝库）
function applyItemEffect(item, gameState) {
    console.log('应用物品效果，物品:', item);
    console.log('当前宝库:', gameState.treasury);
    
    // 将物品存入宝库
    const category = getCategoryByType(item.type);
    console.log('物品分类:', category);
    
    // 检查是否已有相同物品
    const existingItem = gameState.treasury[category].find(i => i.name === item.name);
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
        console.log('更新现有物品数量:', existingItem);
    } else {
        // 创建新物品
        const newItem = {
            id: Date.now() + Math.random(),
            name: item.name,
            type: item.type,
            rarity: item.rarity || 'common',
            description: item.description || '珍贵的物品',
            quantity: 1,
            obtainedFrom: item.obtainedFrom || '坊市购买'
        };
        gameState.treasury[category].push(newItem);
        console.log('添加新物品到宝库:', newItem);
    }
    
    console.log('更新后的宝库:', gameState.treasury);
    addLog(`[宝库] ${item.name} 已存入宗门宝库`, 'text-yellow-400');
}

// 根据物品类型获取分类
function getCategoryByType(itemType) {
    switch (itemType) {
        case 'pill': return 'pills';
        case 'weapon': return 'weapons';
        case 'material': return 'materials';
        default: return 'other';
    }
}

// 显示拍卖会
export function showAuction(gameState) {
    const modal = document.getElementById('auctionModal');
    const auctionItems = document.getElementById('auctionItems');
    const auctionTimer = document.getElementById('auctionTimer');
    
    if (!modal || !auctionItems) return;
    
    // 如果拍卖会为空或已结束，生成新的拍卖会
    if (gameState.auctionItems.length === 0 || Date.now() > gameState.auctionEndTime) {
        generateAuctionItems(gameState);
        // 初始NPC竞拍，让拍卖会一开始就有活动
        setTimeout(() => {
            for (let i = 0; i < 3; i++) { // 初始3次NPC竞拍
                setTimeout(() => simulateNPCBidding(gameState), i * 1000);
            }
        }, 2000);
    }
    
    auctionItems.innerHTML = '';
    
    gameState.auctionItems.forEach(item => {
        const itemCard = createAuctionItemCard(item, gameState);
        auctionItems.appendChild(itemCard);
    });
    
    // 更新拍卖会计时器
    updateAuctionTimer(gameState);
    
    // 显示模态框
    modal.classList.remove('hidden');
    
    // 设置关闭事件
    const closeBtn = document.getElementById('closeAuctionModal');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.classList.add('hidden');
        };
    }
    
    // 启动计时器更新
    if (!window.auctionTimerInterval) {
        window.auctionTimerInterval = setInterval(() => {
            updateAuctionTimer(gameState);
        }, 1000);
    }
}

// 生成拍卖会物品
function generateAuctionItems(gameState) {
    gameState.auctionItems = [];
    gameState.playerBids = {};
    
    const itemCount = Math.floor(Math.random() * 3) + AUCTION_CONFIG.START_ITEMS; // 3-5个物品
    
    for (let i = 0; i < itemCount; i++) {
        // 拍卖会物品质量更高
        const availableItems = MARKET_ITEMS.filter(item => 
            item.rarity !== 'junk' && item.rarity !== 'common'
        );
        const template = availableItems[Math.floor(Math.random() * availableItems.length)];
        
        const item = {
            ...template,
            id: Date.now() + i,
            currentBid: Math.floor(template.basePrice * 0.5), // 起拍价为原价的50%
            bidder: null,
            bidCount: 0
        };
        gameState.auctionItems.push(item);
    }
    
    gameState.auctionEndTime = Date.now() + AUCTION_CONFIG.AUCTION_DURATION;
}

// 创建拍卖物品卡片
function createAuctionItemCard(item, gameState) {
    const card = document.createElement('div');
    const rarityInfo = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common;
    const timeLeft = Math.max(0, gameState.auctionEndTime - Date.now());
    const isPlayerHighest = gameState.playerBids[item.id] === item.currentBid;
    
    card.className = `p-4 bg-slate-800 rounded ancient-border ${isPlayerHighest ? 'border-green-500' : ''}`;
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <h4 class="font-bold ${rarityInfo.color}">${item.name}</h4>
            <span class="text-xs px-2 py-1 bg-slate-700 rounded ${rarityInfo.color}">${rarityInfo.name}</span>
        </div>
        <p class="text-xs text-amber-300 mb-3">${item.description}</p>
        <div class="space-y-2">
            <div class="flex justify-between items-center">
                <span class="text-emerald-400 font-bold">当前出价: ${item.currentBid}灵石</span>
                ${item.bidder ? `<span class="text-xs text-blue-400">出价者: ${item.bidder}</span>` : ''}
            </div>
            <div class="flex space-x-2">
                <button onclick="placeBid(${item.id}, ${item.currentBid + AUCTION_CONFIG.MIN_BID_INCREMENT})" 
                        class="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs rounded transition-colors">
                    出价 ${item.currentBid + AUCTION_CONFIG.MIN_BID_INCREMENT}
                </button>
                <button onclick="placeBid(${item.id}, ${item.currentBid + AUCTION_CONFIG.MIN_BID_INCREMENT * 2})" 
                        class="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white text-xs rounded transition-colors">
                    出价 ${item.currentBid + AUCTION_CONFIG.MIN_BID_INCREMENT * 2}
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// 出价
window.placeBid = function(itemId, bidAmount) {
    const gameState = window.game ? window.game.gameState : null;
    if (!gameState) return;
    
    const item = gameState.auctionItems.find(i => i.id === itemId);
    if (!item) return;
    
    if (bidAmount <= item.currentBid) {
        addLog('[拍卖会] 出价必须高于当前价格', 'text-red-400');
        return;
    }
    
    if (gameState.spiritStones < bidAmount) {
        addLog('[拍卖会] 灵石不足', 'text-red-400');
        return;
    }
    
    // 如果玩家之前有出价，退还之前的出价
    if (gameState.playerBids[itemId]) {
        gameState.spiritStones += gameState.playerBids[itemId];
    }
    
    // 扣除新的出价
    gameState.spiritStones -= bidAmount;
    gameState.playerBids[itemId] = bidAmount;
    
    // 更新拍卖物品
    item.currentBid = bidAmount;
    item.bidder = gameState.playerName;
    item.bidCount++;
    
    // 移除延时机制，让拍卖更紧凑
    // const timeLeft = gameState.auctionEndTime - Date.now();
    // if (timeLeft < 30000) {
    //     gameState.auctionEndTime += AUCTION_CONFIG.EXTENSION_TIME;
    //     addLog('[拍卖会] 竞争激烈，拍卖时间延长10秒！', 'text-yellow-400');
    // }
    
    addLog(`[拍卖会] ${gameState.playerName}对${item.name}出价${bidAmount}灵石`, 'text-yellow-400');
    
    // 刷新显示
    showAuction(gameState);
    if (window.game) window.game.updateDisplay();
};

// 更新拍卖会计时器
function updateAuctionTimer(gameState) {
    const timerElement = document.getElementById('auctionTimer');
    if (!timerElement) return;
    
    const timeLeft = Math.max(0, gameState.auctionEndTime - Date.now());
    
    if (timeLeft === 0) {
        // 拍卖会结束，处理结果
        endAuction(gameState);
        timerElement.textContent = '拍卖会已结束';
    } else {
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        timerElement.textContent = `剩余时间: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // NPC竞拍活动 - 随机让NPC参与竞拍
        if (Math.random() < 0.4) { // 提高到40%概率触发NPC竞拍
            simulateNPCBidding(gameState);
        }
    }
}

// NPC竞拍模拟
function simulateNPCBidding(gameState) {
    if (gameState.auctionItems.length === 0) return;
    
    // 随机选择一个物品进行竞拍
    const item = gameState.auctionItems[Math.floor(Math.random() * gameState.auctionItems.length)];
    
    // NPC名字池
    const npcNames = [
        '青云剑仙', '紫霞真人', '玄机子', '丹心道人', '飞羽仙子',
        '天机老人', '无极剑尊', '碧霄仙子', '金丹大师', '元婴真君',
        '逍遥散人', '红尘剑客', '白云禅师', '青莲剑仙', '紫虚真人'
    ];
    
    const npcName = npcNames[Math.floor(Math.random() * npcNames.length)];
    
    // 计算NPC出价策略
    const minBid = item.currentBid + AUCTION_CONFIG.MIN_BID_INCREMENT;
    const maxBid = item.currentBid + Math.floor(item.value * 0.5); // 提高到物品价值的50%
    
    if (minBid <= maxBid && Math.random() < 0.85) { // 提高到85%概率出价
        const bidAmount = Math.floor(Math.random() * (maxBid - minBid + 1)) + minBid;
        
        item.currentBid = bidAmount;
        item.bidder = npcName;
        item.bidCount++;
        
        // 根据NPC类型添加不同的竞拍消息
        const messages = [
            `[宗门见闻] ${npcName}对${item.name}出价${bidAmount}灵石，神情志在必得`,
            `[宗门见闻] ${npcName}冷静地举起号牌，${item.name}价格升至${bidAmount}灵石`,
            `[宗门见闻] ${npcName}微微一笑，${item.name}被抬价至${bidAmount}灵石`,
            `[宗门见闻] ${npcName}毫不犹豫地出价${bidAmount}灵石竞拍${item.name}`,
            `[宗门见闻] ${npcName}眼中精光一闪，${item.name}价格飙升至${bidAmount}灵石`,
            `[宗门见闻] ${npcName}冷哼一声："${item.name}我志在必得！" 出价${bidAmount}灵石`,
            `[宗门见闻] ${npcName}轻蔑一笑："这点灵石也敢竞价？" 加价至${bidAmount}灵石`,
            `[宗门见闻] ${npcName}怒目而视："谁敢与我争夺${item.name}！" 出价${bidAmount}灵石`
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        addLog(message, 'text-cyan-400');
        
        // 随机触发NPC冲突
        if (Math.random() < 0.3) { // 30%概率触发冲突
            triggerNPCConflict(npcName, item, bidAmount);
        }
        
        // 刷新拍卖会显示
        showAuction(gameState);
    }
}

// NPC冲突系统
function triggerNPCConflict(npcName, item, bidAmount) {
    const npcNames = [
        '青云剑仙', '紫霞真人', '玄机子', '丹心道人', '飞羽仙子',
        '天机老人', '无极剑尊', '碧霄仙子', '金丹大师', '元婴真君',
        '逍遥散人', '红尘剑客', '白云禅师', '青莲剑仙', '紫虚真人'
    ];
    
    // 随机选择一个冲突对象
    const conflictNPC = npcNames.filter(name => name !== npcName)[Math.floor(Math.random() * (npcNames.length - 1))];
    
    const conflicts = [
        `[宗门见闻] ${conflictNPC}冷笑道："${npcName}，你出价倒是挺大方啊！"`,
        `[宗门见闻] ${conflictNPC}眼神不善地盯着${npcName}："这${item.name}我是要定了！"`,
        `[宗门见闻] ${conflictNPC}拍桌而起："${npcName}，你这是在挑衅吗？"`,
        `[宗门见闻] ${conflictNPC}低声威胁："${npcName}，你最好想清楚再出价！"`,
        `[宗门见闻] ${conflictNPC}剑气外露："为了${item.name}，我与你势不两立！"`
    ];
    
    const conflict = conflicts[Math.floor(Math.random() * conflicts.length)];
    addLog(conflict, 'text-orange-400');
}

// 拍卖会后的对战消息
function generatePostAuctionBattles(gameState) {
    const battleNPCs = [
        '青云剑仙', '紫霞真人', '玄机子', '丹心道人', '飞羽仙子',
        '天机老人', '无极剑尊', '碧霄仙子', '金丹大师', '元婴真君'
    ];
    
    // 随机生成1-3个对战消息
    const battleCount = Math.floor(Math.random() * 3) + 1;
    
    setTimeout(() => {
        for (let i = 0; i < battleCount; i++) {
            setTimeout(() => {
                const npc1 = battleNPCs[Math.floor(Math.random() * battleNPCs.length)];
                const npc2 = battleNPCs.filter(n => n !== npc1)[Math.floor(Math.random() * (battleNPCs.length - 1))];
                
                const battles = [
                    `[宗门见闻] ⚔️ ${npc1}与${npc2}在拍卖会后大打出手，灵气激荡！`,
                    `[宗门见闻] 💥 ${npc1}与${npc2}因拍卖会积怨，在城中激战三百回合！`,
                    `[宗门见闻] 🔥 ${npc1}怒火攻心，追杀${npc2}至城外！`,
                    `[宗门见闻] ⚡ ${npc1}与${npc2}约定三日后决战紫禁之巅！`,
                    `[宗门见闻] 🌪️ ${npc1}与${npc2}的战斗波及半个城池，各大宗门震惊！`,
                    `[宗门见闻] 💀 ${npc1}与${npc2}死战，最终两败俱伤，各自疗伤而去！`,
                    `[宗门见闻] 🎭 ${npc1}与${npc2}的恩怨传遍修真界，成为热议话题！`
                ];
                
                const battle = battles[Math.floor(Math.random() * battles.length)];
                addLog(battle, 'text-red-500 font-bold');
            }, i * 3000);
        }
    }, 2000);
}

// 结束拍卖会
function endAuction(gameState) {
    gameState.auctionItems.forEach(item => {
        if (item.bidder === gameState.playerName) {
            // 玩家赢得了拍卖
            applyItemEffect(item, gameState);
            addLog(`[拍卖会] 🎉 恭喜！您以${item.currentBid}灵石成功拍得${item.name}`, 'text-green-400 font-bold');
        } else if (item.bidder) {
            // 其他人赢得了拍卖，添加更多趣味描述
            const winMessages = [
                `[拍卖会] ${item.name}最终被${item.bidder}以${item.currentBid}灵石收入囊中`,
                `[拍卖会] 💰 ${item.bidder}豪掷${item.currentBid}灵石，将${item.name}拍下`,
                `[拍卖会] ${item.bidder}志在必得，${item.name}以${item.currentBid}灵石成交`,
                `[拍卖会] 经过激烈竞拍，${item.name}被${item.bidder}以${item.currentBid}灵石获得`
            ];
            const message = winMessages[Math.floor(Math.random() * winMessages.length)];
            addLog(message, 'text-blue-400');
        } else {
            // 流拍
            addLog(`[拍卖会] ${item.name}无人问津，遗憾流拍`, 'text-gray-400');
        }
        
        // 退还未中标的玩家的出价
        if (gameState.playerBids[item.id] && item.bidder !== gameState.playerName) {
            gameState.spiritStones += gameState.playerBids[item.id];
            addLog(`[拍卖会] 💰 退还${item.name}的出价${gameState.playerBids[item.id]}灵石`, 'text-green-400');
        }
    });
    
    // 清空拍卖会
    gameState.auctionItems = [];
    gameState.playerBids = {};
    gameState.auctionEndTime = 0;
    
    // 清除计时器
    if (window.auctionTimerInterval) {
        clearInterval(window.auctionTimerInterval);
        window.auctionTimerInterval = null;
    }
    
    // 关闭拍卖会界面
    const modal = document.getElementById('auctionModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // 生成拍卖会后的对战消息
    generatePostAuctionBattles(gameState);
    
    if (window.game) window.game.updateDisplay();
}

// 显示功法阁
export function showTechniqueHall(gameState) {
    const modal = document.getElementById('techniqueHallModal');
    if (modal) {
        modal.classList.remove('hidden');
        // TODO: 实现功法阁内容
        console.log('显示功法阁');
    }
}

// 显示宝库
export function showTreasury(gameState) {
    const modal = document.getElementById('treasuryModal');
    if (modal) {
        modal.classList.remove('hidden');
        showTreasuryCategory('pills');
    }
}

// 显示宝库分类
window.showTreasuryCategory = function(category) {
    console.log('showTreasuryCategory被调用，分类:', category);
    const gameState = window.game ? window.game.gameState : null;
    console.log('gameState:', gameState);
    if (!gameState) {
        console.log('gameState为空，返回');
        return;
    }
    
    console.log('宝库数据:', gameState.treasury);
    const treasuryItems = document.getElementById('treasuryItems');
    if (!treasuryItems) {
        console.log('找不到treasuryItems元素');
        return;
    }
    
    treasuryItems.innerHTML = '';
    
    const items = gameState.treasury[category] || [];
    console.log(`${category}分类的物品:`, items);
    console.log('物品数量:', items.length);
    
    if (items.length === 0) {
        treasuryItems.innerHTML = `
            <div class="col-span-3 text-center text-amber-300 py-8">
                <p class="text-lg mb-2">该分类暂无物品</p>
                <p class="text-sm">通过坊市购买或拍卖获得物品会自动存入宝库</p>
            </div>
        `;
    } else {
        items.forEach((item, index) => {
            const itemCard = createTreasuryItemCard(item, category, index, gameState);
            treasuryItems.appendChild(itemCard);
        });
    }
    
    // 更新分类按钮状态
    updateTreasuryCategoryButtons(category);
};

// 更新宝库分类按钮状态
function updateTreasuryCategoryButtons(activeCategory) {
    const buttons = document.querySelectorAll('[onclick^="showTreasuryCategory"]');
    buttons.forEach(button => {
        const category = button.getAttribute('onclick').match(/'([^']+)'/)[1];
        if (category === activeCategory) {
            button.className = button.className.replace('bg-blue-600', 'bg-blue-800').replace('hover:bg-blue-500', 'hover:bg-blue-700');
        } else {
            button.className = button.className.replace('bg-blue-800', 'bg-blue-600').replace('hover:bg-blue-700', 'hover:bg-blue-500');
        }
    });
}

// 创建宝库物品卡片
function createTreasuryItemCard(item, category, index, gameState) {
    const card = document.createElement('div');
    const rarityColors = {
        'common': 'text-gray-400',
        'uncommon': 'text-green-400',
        'rare': 'text-blue-400',
        'epic': 'text-purple-400',
        'legendary': 'text-yellow-400'
    };
    
    const rarityColor = rarityColors[item.rarity] || 'text-gray-400';
    
    card.className = 'p-3 bg-slate-800 rounded ancient-border';
    card.innerHTML = `
        <div class="mb-2">
            <div class="${rarityColor} font-bold text-sm">${item.name}</div>
            <div class="text-xs text-gray-400">${item.description || '珍贵的物品'}</div>
            <div class="text-xs text-amber-300">数量: ${item.quantity || 1}</div>
            <div class="text-xs text-gray-500">来源: ${item.obtainedFrom || '未知'}</div>
        </div>
        <div class="flex space-x-2">
            <button onclick="grantItemToDisciple('${category}', ${index})" 
                    class="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors">
                赐予弟子
            </button>
        </div>
    `;
    
    return card;
}

// 赐予物品给弟子
window.grantItemToDisciple = function(category, itemIndex) {
    const gameState = window.game ? window.game.gameState : null;
    if (!gameState) return;
    
    const item = gameState.treasury[category][itemIndex];
    if (!item) return;
    
    console.log('创建弟子选择弹窗，可用弟子:', gameState.disciples.filter(d => d.alive));
    
    // 创建弟子选择弹窗
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-slate-900 ancient-border rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 class="text-xl font-bold text-amber-200 mb-4">选择弟子</h2>
            <div class="mb-4">
                <p class="text-sm text-amber-300">将《${item.name}》赐予哪位弟子？</p>
            </div>
            <div class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto mb-4">
                ${gameState.disciples.filter(d => d.alive).map(disciple => `
                    <button onclick="confirmGrantItem('${category}', ${itemIndex}, '${disciple.id}')" 
                            class="p-2 bg-slate-800 hover:bg-slate-700 rounded text-left transition-colors">
                        <div class="text-emerald-400 font-bold">${disciple.name}</div>
                        <div class="text-xs text-gray-400">境界: ${disciple.realm}</div>
                        <div class="text-xs text-gray-400">天赋: ${disciple.talent.toFixed(1)}</div>
                        <div class="text-xs text-gray-500">ID: ${disciple.id}</div>
                    </button>
                `).join('')}
            </div>
            <button onclick="this.closest('.fixed').remove()" 
                    class="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded transition-colors">
                取消
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
};

// 确认赐予物品
window.confirmGrantItem = function(category, itemIndex, discipleId) {
    console.log('确认赐予物品:', {category, itemIndex, discipleId});
    const gameState = window.game ? window.game.gameState : null;
    if (!gameState) {
        console.log('gameState为空');
        return;
    }
    
    console.log('所有弟子ID:', gameState.disciples.map(d => ({name: d.name, id: d.id, idType: typeof d.id})));
    console.log('查找的弟子ID:', discipleId, '类型:', typeof discipleId);
    
    const item = gameState.treasury[category][itemIndex];
    const disciple = gameState.disciples.find(d => d.id == discipleId); // 使用 == 而不是 ===
    
    console.log('物品:', item);
    console.log('弟子:', disciple);
    
    if (item && disciple) {
        // 尝试应用物品效果
        const success = applyItemEffectToDisciple(item, disciple);
        
        if (success) {
            // 应用成功，从宝库中移除物品
            if (item.quantity > 1) {
                item.quantity--;
            } else {
                gameState.treasury[category].splice(itemIndex, 1);
            }
            
            // 增加忠诚度
            disciple.loyalty = Math.min(100, disciple.loyalty + 5);
            
            addLog(`[宝库] 将《${item.name}》赐予${disciple.name}，忠诚度+5`, 'text-green-400');
        } else {
            // 境界不足，物品保留在宝库中
            addLog(`[宝库] ${disciple.name}境界不足，无法使用《${item.name}》`, 'text-red-400');
        }
        
        // 关闭弹窗
        document.querySelector('.fixed').remove();
        
        // 刷新显示
        showTreasuryCategory(category);
        if (window.game) window.game.updateDisplay();
    } else {
        console.log('物品或弟子不存在');
        console.log('item:', item);
        console.log('disciple:', disciple);
        console.log('gameState.disciples:', gameState.disciples);
    }
};

// 对弟子应用物品效果
function applyItemEffectToDisciple(item, disciple) {
    // 确保弟子有宝物数组
    if (!disciple.treasuryItems) {
        disciple.treasuryItems = [];
    }
    
    // 应用具体效果
    const success = applyTreasureEffect(item, disciple);
    
    if (!success) {
        // 境界不足，不应用效果，也不添加到弟子物品
        return false;
    }
    
    // 将物品添加到弟子宝物中
    const existingItem = disciple.treasuryItems.find(i => i.name === item.name);
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        disciple.treasuryItems.push({
            ...item,
            quantity: 1,
            obtainedFrom: '宗主赐予',
            obtainedTime: Date.now()
        });
    }
    
    // 添加个人日志
    disciple.addPersonalLog(`[赐予] 获得宗主赐予的《${item.name}》`, Date.now());
    
    return true;
}

// 应用宝物效果
function applyTreasureEffect(item, disciple) {
    switch (item.type) {
        case 'pill':
            applyPillEffect(item, disciple);
            return true;
        case 'weapon':
            applyWeaponEffect(item, disciple);
            return true;
        case 'material':
            applyMaterialEffect(item, disciple);
            return true;
        default:
            return applyOtherEffect(item, disciple);
    }
}

// 应用丹药效果
function applyPillEffect(item, disciple) {
    switch (item.name) {
        case '聚气丹':
            disciple.cultivation += 20;
            addLog(`[丹药] ${disciple.name}服用聚气丹，修为+20`, 'text-green-400');
            break;
        case '筑基丹':
            disciple.cultivation += 50;
            addLog(`[丹药] ${disciple.name}服用筑基丹，修为+50`, 'text-green-400');
            break;
        case '金丹丸':
            disciple.cultivation += 100;
            addLog(`[丹药] ${disciple.name}服用金丹丸，修为+100`, 'text-green-400');
            break;
        case '洗髓丹':
            // 改善体质
            if (disciple.talent < 90) {
                disciple.talent = Math.min(90, disciple.talent + 10);
                addLog(`[丹药] ${disciple.name}服用洗髓丹，天赋+10`, 'text-purple-400');
            }
            break;
        case '换骨丹':
            // 改善灵根
            disciple.spiritRoot = upgradeSpiritRoot(disciple.spiritRoot);
            addLog(`[丹药] ${disciple.name}服用换骨丹，灵根提升为${disciple.spiritRoot}`, 'text-blue-400');
            break;
        case '破障丹':
            // 增加突破成功率
            if (!disciple.breakthroughBonus) disciple.breakthroughBonus = 0;
            disciple.breakthroughBonus += 0.2;
            addLog(`[丹药] ${disciple.name}服用破障丹，突破成功率+20%`, 'text-yellow-400');
            break;
        case '回血丹':
            if (disciple.injured) {
                disciple.heal();
                addLog(`[丹药] ${disciple.name}服用了回血丹，伤势恢复`, 'text-green-400');
            }
            break;
        default:
            // 通用丹药效果
            disciple.cultivation += 10;
            addLog(`[丹药] ${disciple.name}服用了${item.name}，修为+10`, 'text-green-400');
    }
}

// 应用武器效果
function applyWeaponEffect(item, disciple) {
    // 为弟子添加武器属性
    if (!disciple.weapon) disciple.weapon = {};
    
    disciple.weapon = {
        name: item.name,
        rarity: item.rarity,
        combatBonus: getCombatBonusByRarity(item.rarity)
    };
    
    const combatBonus = disciple.weapon.combatBonus;
    addLog(`[武器] ${disciple.name}装备了${item.name}，战斗力+${combatBonus}`, 'text-red-400');
}

// 应用材料效果
function applyMaterialEffect(item, disciple) {
    switch (item.name) {
        case '千年灵草':
            disciple.cultivation += 30;
            addLog(`[材料] ${disciple.name}使用了千年灵草，修为+30`, 'text-green-400');
            break;
        case '万年玄铁':
            // 可以用来锻造武器，暂时增加战斗力
            if (!disciple.temporaryBonus) disciple.temporaryBonus = {};
            disciple.temporaryBonus.combat = (disciple.temporaryBonus.combat || 0) + 15;
            addLog(`[材料] ${disciple.name}获得了万年玄铁，战斗力+15`, 'text-red-400');
            break;
        case '雷击木':
            // 雷系修士加成
            if (disciple.spiritRoot === '雷') {
                disciple.cultivation += 40;
                addLog(`[材料] ${disciple.name}使用雷击木，修为+40（雷系灵根加成）`, 'text-cyan-400');
            } else {
                disciple.cultivation += 20;
                addLog(`[材料] ${disciple.name}使用了雷击木，修为+20`, 'text-green-400');
            }
            break;
        default:
            // 通用材料效果
            disciple.cultivation += 15;
            addLog(`[材料] ${disciple.name}使用了${item.name}，修为+15`, 'text-green-400');
    }
}

// 检查弟子境界是否满足要求
function checkRealmRequirement(disciple, requiredRealm) {
    const realmHierarchy = [
        '凡人', '炼气期', '筑基期', '金丹期', '元婴期', 
        '化神期', '炼虚期', '合体期', '大乘期', '渡劫期', '仙人'
    ];
    
    const discipleIndex = realmHierarchy.indexOf(disciple.realm);
    const requiredIndex = realmHierarchy.indexOf(requiredRealm);
    
    return discipleIndex >= requiredIndex;
}

// 应用其他物品效果
function applyOtherEffect(item, disciple) {
    switch (item.name) {
        case '功法秘籍':
            // 增加修炼速度
            if (!disciple.cultivationBonus) disciple.cultivationBonus = 0;
            disciple.cultivationBonus += 0.1;
            addLog(`[功法] ${disciple.name}学习了功法秘籍，修炼速度+10%`, 'text-purple-400');
            break;
        case '修炼心得':
            disciple.cultivation += 25;
            addLog(`[心得] ${disciple.name}研读修炼心得，修为+25`, 'text-green-400');
            break;
        case '护身符':
            // 减少受伤概率
            if (!disciple.injuryReduction) disciple.injuryReduction = 0;
            disciple.injuryReduction += 0.2;
            addLog(`[护符] ${disciple.name}佩戴了护身符，受伤概率-20%`, 'text-blue-400');
            break;
        case '灵兽契约':
            // 获得灵兽伙伴 - 金丹期可解锁
            if (!checkRealmRequirement(disciple, '金丹期')) {
                addLog(`[灵兽] ${disciple.name}境界不足，需要达到金丹期才能签订灵兽契约`, 'text-red-400');
                // 退回物品到宝库
                return false;
            }
            if (!disciple.spiritBeast) disciple.spiritBeast = {};
            disciple.spiritBeast = {
                name: '灵兽伙伴',
                type: '凡兽',
                combatBonus: 15,
                cultivationBonus: 0.1,
                specialAbility: '守护'
            };
            addLog(`[灵兽] ${disciple.name}与灵兽签订契约，战斗力+15，修炼速度+10%`, 'text-cyan-400');
            break;
        case '妖狐幼崽':
            // 低级灵兽 - 筑基期可解锁
            if (!checkRealmRequirement(disciple, '筑基期')) {
                addLog(`[灵兽] ${disciple.name}境界不足，需要达到筑基期才能收服妖狐`, 'text-red-400');
                return false;
            }
            if (!disciple.spiritBeast) disciple.spiritBeast = {};
            disciple.spiritBeast = {
                name: '妖狐伙伴',
                type: '妖兽',
                combatBonus: 12,
                cultivationBonus: 0.08,
                specialAbility: '魅惑'
            };
            addLog(`[妖兽] ${disciple.name}收服了妖狐幼崽，战斗力+12，修炼速度+8%`, 'text-pink-400');
            break;
        case '灵蛇':
            // 中级灵兽 - 元婴期可解锁
            if (!checkRealmRequirement(disciple, '元婴期')) {
                addLog(`[灵兽] ${disciple.name}境界不足，需要达到元婴期才能收服灵蛇`, 'text-red-400');
                return false;
            }
            if (!disciple.spiritBeast) disciple.spiritBeast = {};
            disciple.spiritBeast = {
                name: '灵蛇伙伴',
                type: '灵兽',
                combatBonus: 20,
                cultivationBonus: 0.12,
                specialAbility: '剧毒'
            };
            addLog(`[灵兽] ${disciple.name}收服了灵蛇，战斗力+20，修炼速度+12%`, 'text-green-400');
            break;
        case '风狼':
            // 中级灵兽 - 元婴期可解锁
            if (!checkRealmRequirement(disciple, '元婴期')) {
                addLog(`[灵兽] ${disciple.name}境界不足，需要达到元婴期才能收服风狼`, 'text-red-400');
                return false;
            }
            if (!disciple.spiritBeast) disciple.spiritBeast = {};
            disciple.spiritBeast = {
                name: '风狼伙伴',
                type: '灵兽',
                combatBonus: 18,
                cultivationBonus: 0.15,
                specialAbility: '速度'
            };
            addLog(`[灵兽] ${disciple.name}收服了风狼，战斗力+18，修炼速度+15%`, 'text-cyan-400');
            break;
        case '青龙幼崽':
            // 高级神兽 - 化神期可解锁
            if (!checkRealmRequirement(disciple, '化神期')) {
                addLog(`[神兽] ${disciple.name}境界不足，需要达到化神期才能收服青龙`, 'text-red-400');
                return false;
            }
            if (!disciple.spiritBeast) disciple.spiritBeast = {};
            disciple.spiritBeast = {
                name: '青龙伙伴',
                type: '神兽',
                combatBonus: 35,
                cultivationBonus: 0.2,
                specialAbility: '水系加成'
            };
            // 青龙特殊效果：水系灵根弟子额外加成
            if (disciple.spiritRoot === '水') {
                disciple.spiritBeast.combatBonus += 8;
                disciple.spiritBeast.cultivationBonus += 0.05;
                addLog(`[神兽] ${disciple.name}收服了青龙，水系灵根共鸣！战斗力+43，修炼速度+25%`, 'text-blue-400');
            } else {
                addLog(`[神兽] ${disciple.name}收服了青龙，战斗力+35，修炼速度+20%`, 'text-blue-400');
            }
            break;
        case '白虎精魄':
            // 高级神兽 - 化神期可解锁
            if (!checkRealmRequirement(disciple, '化神期')) {
                addLog(`[神兽] ${disciple.name}境界不足，需要达到化神期才能获得白虎精魄`, 'text-red-400');
                return false;
            }
            if (!disciple.spiritBeast) disciple.spiritBeast = {};
            disciple.spiritBeast = {
                name: '白虎伙伴',
                type: '凶兽',
                combatBonus: 30,
                cultivationBonus: 0.08,
                specialAbility: '杀伐加成'
            };
            addLog(`[凶兽] ${disciple.name}获得了白虎精魄，战斗力+30，修炼速度+8%`, 'text-red-400');
            break;
        case '朱雀之羽':
            // 高级神兽 - 化神期可解锁
            if (!checkRealmRequirement(disciple, '化神期')) {
                addLog(`[神兽] ${disciple.name}境界不足，需要达到化神期才能获得朱雀之羽`, 'text-red-400');
                return false;
            }
            if (!disciple.spiritBeast) disciple.spiritBeast = {};
            disciple.spiritBeast = {
                name: '朱雀伙伴',
                type: '神鸟',
                combatBonus: 28,
                cultivationBonus: 0.15,
                specialAbility: '火系加成'
            };
            // 朱雀特殊效果：火系灵根弟子额外加成
            if (disciple.spiritRoot === '火') {
                disciple.spiritBeast.combatBonus += 6;
                disciple.spiritBeast.cultivationBonus += 0.05;
                addLog(`[神鸟] ${disciple.name}获得了朱雀之羽，火系灵根共鸣！战斗力+34，修炼速度+20%`, 'text-orange-400');
            } else {
                addLog(`[神鸟] ${disciple.name}获得了朱雀之羽，战斗力+28，修炼速度+15%`, 'text-orange-400');
            }
            break;
        case '玄武鳞片':
            // 高级神兽 - 化神期可解锁
            if (!checkRealmRequirement(disciple, '化神期')) {
                addLog(`[神兽] ${disciple.name}境界不足，需要达到化神期才能获得玄武鳞片`, 'text-red-400');
                return false;
            }
            if (!disciple.spiritBeast) disciple.spiritBeast = {};
            disciple.spiritBeast = {
                name: '玄武伙伴',
                type: '神兽',
                combatBonus: 25,
                cultivationBonus: 0.12,
                specialAbility: '绝对防御'
            };
            // 玄武特殊效果：大幅减少受伤概率
            if (!disciple.injuryReduction) disciple.injuryReduction = 0;
            disciple.injuryReduction += 0.3;
            addLog(`[神兽] ${disciple.name}获得了玄武鳞片，战斗力+25，修炼速度+12%，受伤概率-30%`, 'text-teal-400');
            break;
        case '麒麟血':
            // 传说级物品 - 大乘期可解锁
            if (!checkRealmRequirement(disciple, '大乘期')) {
                addLog(`[圣兽] ${disciple.name}境界不足，需要达到大乘期才能获得麒麟血脉`, 'text-red-400');
                return false;
            }
            if (!disciple.spiritBeast) disciple.spiritBeast = {};
            disciple.spiritBeast = {
                name: '麒麟伙伴',
                type: '圣兽',
                combatBonus: 40,
                cultivationBonus: 0.2,
                specialAbility: '祥瑞之力'
            };
            // 麒麟特殊效果：全面提升
            if (disciple.talent < 90) {
                disciple.talent = Math.min(90, disciple.talent + 3);
                addLog(`[圣兽] ${disciple.name}获得了麒麟血脉，天赋+3，战斗力+40，修炼速度+20%`, 'text-yellow-400');
            } else {
                addLog(`[圣兽] ${disciple.name}获得了麒麟血脉，战斗力+40，修炼速度+20%`, 'text-yellow-400');
            }
            break;
        case '修仙秘典':
            // 传说功法 - 元婴期可解锁
            if (!checkRealmRequirement(disciple, '元婴期')) {
                addLog(`[秘典] ${disciple.name}境界不足，需要达到元婴期才能研读修仙秘典`, 'text-red-400');
                return false;
            }
            if (!disciple.cultivationBonus) disciple.cultivationBonus = 0;
            disciple.cultivationBonus += 0.2;
            disciple.cultivation += 40;
            addLog(`[秘典] ${disciple.name}研读修仙秘典，修为+40，修炼速度+20%`, 'text-purple-400');
            break;
        case '仙丹':
            // 传说丹药 - 合体期可解锁
            if (!checkRealmRequirement(disciple, '合体期')) {
                addLog(`[仙丹] ${disciple.name}境界不足，需要达到合体期才能服用仙丹`, 'text-red-400');
                return false;
            }
            disciple.cultivation += 150;
            if (disciple.talent < 85) {
                disciple.talent = Math.min(85, disciple.talent + 5);
                addLog(`[仙丹] ${disciple.name}服用仙丹，修为+150，天赋+5`, 'text-gold-400');
            } else {
                addLog(`[仙丹] ${disciple.name}服用仙丹，修为+150`, 'text-gold-400');
            }
            break;
        default:
            // 通用效果
            disciple.cultivation += 10;
            addLog(`[宝物] ${disciple.name}获得了${item.name}，修为+10`, 'text-green-400');
    }
    return true; // 成功应用效果
}

// 升级灵根
function upgradeSpiritRoot(currentRoot) {
    const rootHierarchy = [
        '凡人', '金', '木', '水', '火', '土', '雷', '风', '冰', '光', '暗', '五行', '阴阳', '大道'
    ];
    
    const currentIndex = rootHierarchy.indexOf(currentRoot);
    if (currentIndex < rootHierarchy.length - 1) {
        return rootHierarchy[currentIndex + 1];
    }
    return currentRoot;
}

// 根据稀有度获取战斗力加成
function getCombatBonusByRarity(rarity) {
    const bonuses = {
        'common': 5,
        'uncommon': 10,
        'rare': 20,
        'epic': 35,
        'legendary': 50
    };
    return bonuses[rarity] || 5;
}

// 显示往昔记录
export function showPastRecords(gameState) {
    const modal = document.getElementById('pastRecordsModal');
    if (modal) {
        modal.classList.remove('hidden');
        // TODO: 实现往昔记录内容
        console.log('显示往昔记录');
    }
}

// 更新宗门架构显示
function updateOrganizationDisplay(gameState) {
    console.log('更新宗门架构显示');
    const tabsContainer = document.getElementById('organizationTabs');
    const contentContainer = document.getElementById('organizationContent');
    
    console.log('tabsContainer:', tabsContainer);
    console.log('contentContainer:', contentContainer);
    
    if (!tabsContainer || !contentContainer) {
        console.log('找不到组织架构元素');
        return;
    }
    
    // 更新弟子分层
    updateDiscipleHierarchy(gameState);
    
    // 创建标签页
    const tabs = [
        { id: 'hierarchy', name: '弟子分层', icon: '👥' },
        { id: 'positions', name: '职位管理', icon: '👑' },
        { id: 'management', name: '管理层', icon: '🏛️' }
    ];
    
    console.log('创建标签页:', tabs);
    
    tabsContainer.innerHTML = tabs.map(tab => `
        <button onclick="showOrganizationTab('${tab.id}')" 
                class="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-amber-300 rounded transition-colors text-sm"
                id="tab-${tab.id}">
            ${tab.icon} ${tab.name}
        </button>
    `).join('');
    
    console.log('标签页HTML已设置');
    
    // 默认显示弟子分层
    showOrganizationTab('hierarchy');
}

// 更新弟子分层
function updateDiscipleHierarchy(gameState) {
    const org = gameState.organization;
    
    // 清空现有分层
    org.outerDisciples = [];
    org.innerDisciples = [];
    org.personalDisciples = [];
    
    // 根据弟子境界和职位进行分层
    gameState.disciples.forEach(disciple => {
        if (!disciple.alive) return;
        
        // 检查是否有特殊职位
        const position = getDisciplePosition(disciple, org);
        
        if (position) {
            // 有职位的弟子根据职位等级分层
            if (position.level === '长老') {
                org.elders.push({ ...disciple, position });
            } else if (position.level === '执事') {
                org.managers.push({ ...disciple, position });
            }
        } else {
            // 没有职位的弟子根据境界分层
            const realmIndex = getRealmIndex(disciple.realm);
            if (realmIndex <= 2) { // 凡人、炼气期、筑基期
                org.outerDisciples.push(disciple);
            } else if (realmIndex <= 4) { // 金丹期、元婴期
                org.innerDisciples.push(disciple);
            } else { // 化神期及以上
                org.personalDisciples.push(disciple);
            }
        }
    });
}

// 获取弟子职位
function getDisciplePosition(disciple, org) {
    for (const [posKey, posConfig] of Object.entries(org.positions)) {
        const member = posConfig.current.find(member => member.id === disciple.id);
        if (member) {
            return {
                type: posKey,
                name: posConfig.name,
                level: posKey.includes('Elder') ? '长老' : '执事'
            };
        }
    }
    return null;
}

// 获取境界索引
function getRealmIndex(realm) {
    const realms = ['凡人', '炼气期', '筑基期', '金丹期', '元婴期', '化神期', '炼虚期', '合体期', '大乘期', '渡劫期', '仙人'];
    return realms.indexOf(realm);
}

// 显示组织架构标签页
window.showOrganizationTab = function(tabId) {
    console.log('显示组织架构标签页:', tabId);
    const gameState = window.game ? window.game.gameState : null;
    if (!gameState) {
        console.log('gameState为空');
        return;
    }
    
    const contentContainer = document.getElementById('organizationContent');
    if (!contentContainer) {
        console.log('找不到organizationContent元素');
        return;
    }
    
    console.log('contentContainer找到，设置内容');
    
    // 更新标签样式
    document.querySelectorAll('#organizationTabs button').forEach(btn => {
        if (btn.id === `tab-${tabId}`) {
            btn.className = btn.className.replace('bg-slate-700', 'bg-amber-600').replace('text-amber-300', 'text-white');
        } else {
            btn.className = btn.className.replace('bg-amber-600', 'bg-slate-700').replace('text-white', 'text-amber-300');
        }
    });
    
    // 显示对应内容
    switch (tabId) {
        case 'hierarchy':
            console.log('显示弟子分层');
            showDiscipleHierarchy(gameState);
            break;
        case 'positions':
            console.log('显示职位管理');
            showPositionManagement(gameState);
            break;
        case 'management':
            console.log('显示管理层');
            showManagementStructure(gameState);
            break;
    }
};

// 显示弟子分层
function showDiscipleHierarchy(gameState) {
    const contentContainer = document.getElementById('organizationContent');
    const org = gameState.organization;
    
    contentContainer.innerHTML = `
        <div class="space-y-4">
            <!-- 宗主 -->
            <div class="bg-slate-700 p-3 rounded border border-amber-500">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <span class="text-2xl">👑</span>
                        <div>
                            <div class="text-amber-300 font-bold">宗主</div>
                            <div class="text-sm text-white">${gameState.playerName}</div>
                        </div>
                    </div>
                    <div class="text-xs text-gray-400">境界: ${gameState.playerRealm}</div>
                </div>
            </div>
            
            <!-- 亲传弟子 -->
            <div class="bg-slate-800 p-3 rounded">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-purple-400 font-bold">🌟 亲传弟子 (${org.personalDisciples.length})</h3>
                    <button onclick="managePosition('personalDisciple')" class="text-xs bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded">管理</button>
                </div>
                <div class="space-y-1">
                    ${org.personalDisciples.length > 0 ? 
                        org.personalDisciples.map(d => `
                            <div class="flex justify-between items-center p-2 bg-slate-700 rounded text-sm">
                                <span class="text-white">${d.name}</span>
                                <span class="text-gray-400">${d.realm}</span>
                            </div>
                        `).join('') :
                        '<div class="text-gray-500 text-sm">暂无亲传弟子</div>'
                    }
                </div>
            </div>
            
            <!-- 内门弟子 -->
            <div class="bg-slate-800 p-3 rounded">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-blue-400 font-bold">🔵 内门弟子 (${org.innerDisciples.length})</h3>
                    <button onclick="managePosition('innerDisciple')" class="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded">管理</button>
                </div>
                <div class="space-y-1">
                    ${org.innerDisciples.length > 0 ? 
                        org.innerDisciples.map(d => `
                            <div class="flex justify-between items-center p-2 bg-slate-700 rounded text-sm">
                                <span class="text-white">${d.name}</span>
                                <span class="text-gray-400">${d.realm}</span>
                            </div>
                        `).join('') :
                        '<div class="text-gray-500 text-sm">暂无内门弟子</div>'
                    }
                </div>
            </div>
            
            <!-- 外门弟子 -->
            <div class="bg-slate-800 p-3 rounded">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-green-400 font-bold">🟢 外门弟子 (${org.outerDisciples.length})</h3>
                    <button onclick="managePosition('outerDisciple')" class="text-xs bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded">管理</button>
                </div>
                <div class="space-y-1 max-h-32 overflow-y-auto">
                    ${org.outerDisciples.length > 0 ? 
                        org.outerDisciples.map(d => `
                            <div class="flex justify-between items-center p-2 bg-slate-700 rounded text-sm">
                                <span class="text-white">${d.name}</span>
                                <span class="text-gray-400">${d.realm}</span>
                            </div>
                        `).join('') :
                        '<div class="text-gray-500 text-sm">暂无外门弟子</div>'
                    }
                </div>
            </div>
        </div>
    `;
}

// 显示职位管理
function showPositionManagement(gameState) {
    const contentContainer = document.getElementById('organizationContent');
    const org = gameState.organization;
    
    contentContainer.innerHTML = `
        <div class="space-y-4">
            ${Object.entries(org.positions).map(([posKey, posConfig]) => `
                <div class="bg-slate-800 p-3 rounded">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-amber-300 font-bold">${posConfig.name}</h3>
                        <span class="text-xs text-gray-400">${posConfig.current.length}/${posConfig.maxCount}</span>
                    </div>
                    <div class="space-y-1">
                        ${posConfig.current.length > 0 ?
                            posConfig.current.map(member => `
                                <div class="flex justify-between items-center p-2 bg-slate-700 rounded text-sm">
                                    <span class="text-white">${member.name}</span>
                                    <button onclick="removeFromPosition('${posKey}', '${member.id}')" 
                                            class="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded">移除</button>
                                </div>
                            `).join('') :
                            '<div class="text-gray-500 text-sm">暂无任职</div>'
                        }
                        ${posConfig.current.length < posConfig.maxCount ? 
                            `<button onclick="assignToPosition('${posKey}')" 
                                     class="w-full mt-2 bg-amber-600 hover:bg-amber-500 text-white text-sm py-1 rounded">
                                任命弟子
                            </button>` : ''
                        }
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// 显示管理层结构
function showManagementStructure(gameState) {
    const contentContainer = document.getElementById('organizationContent');
    const org = gameState.organization;
    
    contentContainer.innerHTML = `
        <div class="space-y-4">
            <!-- 长老层 -->
            <div class="bg-slate-800 p-3 rounded">
                <h3 class="text-purple-400 font-bold mb-2">🏛️ 长老层</h3>
                <div class="space-y-1">
                    ${org.elders.length > 0 ?
                        org.elders.map(elder => `
                            <div class="flex justify-between items-center p-2 bg-slate-700 rounded text-sm">
                                <div>
                                    <span class="text-white">${elder.name}</span>
                                    <span class="text-xs text-purple-400 ml-2">${elder.position.name}</span>
                                </div>
                                <span class="text-gray-400">${elder.realm}</span>
                            </div>
                        `).join('') :
                        '<div class="text-gray-500 text-sm">暂无长老</div>'
                    }
                </div>
            </div>
            
            <!-- 执事层 -->
            <div class="bg-slate-800 p-3 rounded">
                <h3 class="text-blue-400 font-bold mb-2">📋 执事层</h3>
                <div class="space-y-1">
                    ${org.managers.length > 0 ?
                        org.managers.map(manager => `
                            <div class="flex justify-between items-center p-2 bg-slate-700 rounded text-sm">
                                <div>
                                    <span class="text-white">${manager.name}</span>
                                    <span class="text-xs text-blue-400 ml-2">${manager.position.name}</span>
                                </div>
                                <span class="text-gray-400">${manager.realm}</span>
                            </div>
                        `).join('') :
                        '<div class="text-gray-500 text-sm">暂无执事</div>'
                    }
                </div>
            </div>
            
            <!-- 管理关系 -->
            <div class="bg-slate-800 p-3 rounded">
                <h3 class="text-amber-300 font-bold mb-2">🔗 管理关系</h3>
                <div class="text-sm text-gray-300 space-y-1">
                    <div>• 宗主 → 所有长老和执事</div>
                    <div>• 太上长老 → 内门长老</div>
                    <div>• 内门长老 → 内门执事</div>
                    <div>• 外门长老 → 外门执事</div>
                    <div>• 执事 → 对应层级的弟子</div>
                </div>
            </div>
        </div>
    `;
}

// 任命弟子到职位
window.assignToPosition = function(positionKey) {
    const gameState = window.game ? window.game.gameState : null;
    if (!gameState) return;
    
    const posConfig = gameState.organization.positions[positionKey];
    const availableDisciples = gameState.disciples.filter(d => 
        d.alive && 
        !isDiscipleInPosition(d, gameState.organization) &&
        getRealmIndex(d.realm) >= getPositionMinRealm(positionKey)
    );
    
    if (availableDisciples.length === 0) {
        alert('没有合适的弟子可以任命');
        return;
    }
    
    // 创建选择弹窗
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-slate-900 ancient-border rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 class="text-xl font-bold text-amber-200 mb-4">任命${posConfig.name}</h2>
            <div class="mb-4">
                <p class="text-sm text-amber-300">选择弟子担任${posConfig.name}</p>
                <p class="text-xs text-gray-400">要求境界: ${getPositionMinRealmName(positionKey)}及以上</p>
            </div>
            <div class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto mb-4">
                ${availableDisciples.map(disciple => `
                    <button onclick="confirmAssignPosition('${positionKey}', '${disciple.id}')" 
                            class="p-2 bg-slate-800 hover:bg-slate-700 rounded text-left transition-colors">
                        <div class="text-emerald-400 font-bold">${disciple.name}</div>
                        <div class="text-xs text-gray-400">境界: ${disciple.realm}</div>
                        <div class="text-xs text-gray-400">天赋: ${disciple.talent.toFixed(1)}</div>
                    </button>
                `).join('')}
            </div>
            <button onclick="this.closest('.fixed').remove()" 
                    class="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded transition-colors">
                取消
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
};

// 确认任命
window.confirmAssignPosition = function(positionKey, discipleId) {
    const gameState = window.game ? window.game.gameState : null;
    if (!gameState) return;
    
    const disciple = gameState.disciples.find(d => d.id === discipleId);
    const posConfig = gameState.organization.positions[positionKey];
    
    if (disciple && posConfig.current.length < posConfig.maxCount) {
        posConfig.current.push({
            id: disciple.id,
            name: disciple.name,
            assignedAt: Date.now()
        });
        
        addLog(`[宗门] ${disciple.name}被任命为${posConfig.name}`, 'text-amber-400');
        
        // 关闭弹窗
        document.querySelector('.fixed').remove();
        
        // 刷新显示
        showOrganizationTab('positions');
        updateOrganizationDisplay(gameState);
        if (window.game) window.game.updateDisplay();
    }
};

// 从职位移除
window.removeFromPosition = function(positionKey, discipleId) {
    const gameState = window.game ? window.game.gameState : null;
    if (!gameState) return;
    
    const posConfig = gameState.organization.positions[positionKey];
    const memberIndex = posConfig.current.findIndex(m => m.id === discipleId);
    
    if (memberIndex !== -1) {
        const member = posConfig.current[memberIndex];
        posConfig.current.splice(memberIndex, 1);
        
        addLog(`[宗门] ${member.name}被移除${posConfig.name}职位`, 'text-orange-400');
        
        // 刷新显示
        showOrganizationTab('positions');
        updateOrganizationDisplay(gameState);
        if (window.game) window.game.updateDisplay();
    }
};

// 管理弟子分层
window.managePosition = function(hierarchyType) {
    const gameState = window.game ? window.game.gameState : null;
    if (!gameState) return;
    
    const org = gameState.organization;
    let disciples = [];
    let title = '';
    let availableOptions = [];
    
    switch (hierarchyType) {
        case 'personalDisciple':
            disciples = org.personalDisciples;
            title = '🌟 亲传弟子管理';
            availableOptions = ['innerDisciple', 'outerDisciple'];
            break;
        case 'innerDisciple':
            disciples = org.innerDisciples;
            title = '🔵 内门弟子管理';
            availableOptions = ['personalDisciple', 'outerDisciple'];
            break;
        case 'outerDisciple':
            disciples = org.outerDisciples;
            title = '🟢 外门弟子管理';
            availableOptions = ['innerDisciple', 'personalDisciple'];
            break;
    }
    
    if (disciples.length === 0) {
        alert('该层级暂无弟子');
        return;
    }
    
    // 创建管理弹窗
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-slate-900 ancient-border rounded-lg p-6 max-w-3xl w-full mx-4">
            <h2 class="text-xl font-bold text-amber-200 mb-4">${title}</h2>
            <div class="mb-4">
                <p class="text-sm text-amber-300">选择弟子进行管理操作</p>
            </div>
            
            <!-- 弟子列表 -->
            <div class="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto mb-4">
                ${disciples.map(disciple => `
                    <div class="flex items-center justify-between p-3 bg-slate-800 rounded">
                        <div class="flex-1">
                            <div class="text-emerald-400 font-bold">${disciple.name}</div>
                            <div class="text-xs text-gray-400">境界: ${disciple.realm}</div>
                            <div class="text-xs text-gray-400">天赋: ${disciple.talent.toFixed(1)}</div>
                            ${disciple.weapon ? `<div class="text-xs text-purple-400">武器: ${disciple.weapon.name}</div>` : ''}
                            ${disciple.spiritBeast ? `<div class="text-xs text-cyan-400">灵兽: ${disciple.spiritBeast.name}</div>` : ''}
                        </div>
                        <div class="flex space-x-1">
                            <button onclick="promoteDisciple('${hierarchyType}', '${disciple.id}')" 
                                    class="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded">
                                提升
                            </button>
                            <button onclick="demoteDisciple('${hierarchyType}', '${disciple.id}')" 
                                    class="px-2 py-1 bg-orange-600 hover:bg-orange-500 text-white text-xs rounded">
                                降级
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- 操作说明 -->
            <div class="bg-slate-800 p-3 rounded text-sm text-gray-300">
                <div class="font-bold text-amber-300 mb-2">操作说明：</div>
                <div>• <span class="text-green-400">提升</span>：将弟子提升到更高层级</div>
                <div>• <span class="text-orange-400">降级</span>：将弟子降级到更低层级</div>
                <div>• 提升需要满足相应境界要求</div>
                <div>• 有职位的弟子无法调整层级</div>
            </div>
            
            <button onclick="this.closest('.fixed').remove()" 
                    class="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded transition-colors">
                关闭
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
};

// 提升弟子层级
window.promoteDisciple = function(hierarchyType, discipleId) {
    const gameState = window.game ? window.game.gameState : null;
    if (!gameState) return;
    
    const org = gameState.organization;
    const disciple = gameState.disciples.find(d => d.id == discipleId);
    
    if (!disciple) {
        alert('弟子不存在');
        return;
    }
    
    // 检查是否有职位
    const position = getDisciplePosition(disciple, org);
    if (position) {
        alert(`${disciple.name}担任${position.name}，无法调整层级`);
        return;
    }
    
    let newHierarchy = '';
    let requiredRealm = '';
    
    switch (hierarchyType) {
        case 'outerDisciple':
            newHierarchy = 'innerDisciple';
            requiredRealm = '筑基期'; // 降低要求：筑基期即可
            break;
        case 'innerDisciple':
            newHierarchy = 'personalDisciple';
            requiredRealm = '金丹期'; // 降低要求：金丹期即可
            break;
        case 'personalDisciple':
            alert('亲传弟子已是最高层级');
            return;
    }
    
    // 检查境界要求
    const realmIndex = getRealmIndex(disciple.realm);
    const requiredIndex = getRealmIndex(requiredRealm);
    
    if (realmIndex < requiredIndex) {
        alert(`${disciple.name}境界不足，需要达到${requiredRealm}才能提升`);
        return;
    }
    
    // 执行提升
    // 从原层级移除
    const sourceArray = org[hierarchyType];
    const index = sourceArray.findIndex(d => d.id == discipleId);
    if (index !== -1) {
        sourceArray.splice(index, 1);
    }
    
    // 添加到新层级
    org[newHierarchy].push(disciple);
    
    addLog(`[宗门] ${disciple.name}提升为${getHierarchyName(newHierarchy)}`, 'text-green-400');
    
    // 刷新显示
    document.querySelector('.fixed').remove();
    showOrganizationTab('hierarchy');
    updateOrganizationDisplay(gameState);
    if (window.game) window.game.updateDisplay();
};

// 降级弟子层级
window.demoteDisciple = function(hierarchyType, discipleId) {
    const gameState = window.game ? window.game.gameState : null;
    if (!gameState) return;
    
    const org = gameState.organization;
    const disciple = gameState.disciples.find(d => d.id == discipleId);
    
    if (!disciple) {
        alert('弟子不存在');
        return;
    }
    
    // 检查是否有职位
    const position = getDisciplePosition(disciple, org);
    if (position) {
        alert(`${disciple.name}担任${position.name}，无法调整层级`);
        return;
    }
    
    let newHierarchy = '';
    
    switch (hierarchyType) {
        case 'personalDisciple':
            newHierarchy = 'innerDisciple';
            break;
        case 'innerDisciple':
            newHierarchy = 'outerDisciple';
            break;
        case 'outerDisciple':
            alert('外门弟子已是最低层级');
            return;
    }
    
    // 执行降级
    // 从原层级移除
    const sourceArray = org[hierarchyType];
    const index = sourceArray.findIndex(d => d.id == discipleId);
    if (index !== -1) {
        sourceArray.splice(index, 1);
    }
    
    // 添加到新层级
    org[newHierarchy].push(disciple);
    
    addLog(`[宗门] ${disciple.name}降级为${getHierarchyName(newHierarchy)}`, 'text-orange-400');
    
    // 刷新显示
    document.querySelector('.fixed').remove();
    showOrganizationTab('hierarchy');
    updateOrganizationDisplay(gameState);
    if (window.game) window.game.updateDisplay();
};

// 获取层级名称
function getHierarchyName(hierarchyType) {
    const names = {
        outerDisciple: '外门弟子',
        innerDisciple: '内门弟子',
        personalDisciple: '亲传弟子'
    };
    return names[hierarchyType] || '未知';
}

// 检查弟子是否已在职位
function isDiscipleInPosition(disciple, org) {
    for (const posConfig of Object.values(org.positions)) {
        if (posConfig.current.find(m => m.id === disciple.id)) {
            return true;
        }
    }
    return false;
}

// 获取职位最低境界要求
function getPositionMinRealm(positionKey) {
    const requirements = {
        outerManager: 1, // 炼气期（降低要求）
        innerManager: 2, // 筑基期（降低要求）
        teachingElder: 3, // 金丹期（新增）
        outerElder: 3,   // 金丹期（降低要求）
        innerElder: 4,   // 元婴期（降低要求）
        grandElder: 5,   // 化神期（降低要求）
        enforcementElder: 4, // 元婴期（新增）
        resourceElder: 3   // 金丹期（新增）
    };
    return requirements[positionKey] || 0;
}

// 获取职位最低境界名称
function getPositionMinRealmName(positionKey) {
    const realms = ['凡人', '炼气期', '筑基期', '金丹期', '元婴期', '化神期', '炼虚期', '合体期', '大乘期', '渡劫期', '仙人'];
    const index = getPositionMinRealm(positionKey);
    return realms[index] || '凡人';
}
