import { TASK_TEMPLATES, GAME_CONFIG, MARKET_ITEMS, AUCTION_CONFIG, RARITY_CONFIG, INFLUENCE_LEVELS, REALMS, SECT_UPGRADE_REQUIREMENTS, SECT_ORGANIZATION, EVIL_TASKS } from '../data/constants.js';

// 更新主界面显示
export function updateDisplay(gameState) {
    // 更新宗门信息
    const displaySectName = document.getElementById('displaySectName');
    const displayName = document.getElementById('displayName');
    const playerRealm = document.getElementById('playerRealm');
    const playerSpouse = document.getElementById('playerSpouse');
    
    if (displaySectName) displaySectName.textContent = gameState.sectName || '-';
    if (displayName) displayName.textContent = gameState.playerName || '-';
    if (playerRealm) playerRealm.textContent = gameState.playerRealm || '凡人';
    if (playerSpouse) playerSpouse.textContent = gameState.playerSpouse || '暂无';
    
    // 更新资源
    const spiritStones = document.getElementById('spiritStones');
    const breakthroughPills = document.getElementById('breakthroughPills');
    const reputation = document.getElementById('reputation');
    
    if (spiritStones) spiritStones.textContent = gameState.spiritStones || 0;
    if (breakthroughPills) breakthroughPills.textContent = gameState.breakthroughPills || 0;
    if (reputation) reputation.textContent = gameState.reputation || 0;
    
    // 显示宗门升级进度
    const sectLevel = document.getElementById('sectLevel');
    if (sectLevel) {
        const currentLevel = gameState.sectLevel || 1;
        const nextLevel = currentLevel + 1;
        const requirements = SECT_UPGRADE_REQUIREMENTS[nextLevel];
        
        if (requirements && nextLevel <= 5) {
            const currentRep = gameState.reputation || 0;
            const currentDisciples = gameState.disciples.filter(d => d.alive).length;
            
            let levelText = `Lv.${currentLevel}`;
            if (currentRep >= requirements.reputation && currentDisciples >= requirements.disciples) {
                levelText += ` <span class="text-green-400">[可升级]</span>`;
            } else {
                levelText += ` <span class="text-gray-400">[需要: 声望${requirements.reputation} 弟子${requirements.disciples}人]</span>`;
            }
            
            sectLevel.innerHTML = levelText;
        } else {
            sectLevel.textContent = `Lv.${currentLevel} <span class="text-yellow-400">[满级]</span>`;
        }
    }
    
    // 更新影响力信息
    updateInfluenceDisplay(gameState);
    
    // 更新弟子列表（只显示活着的弟子）
    updateDiscipleList(gameState);
    
    // 更新组织架构（只显示活着的弟子）
    updateOrganizationDisplay(gameState);
}

// 更新影响力显示
export function updateInfluenceDisplay(gameState) {
    const influenceLevel = document.getElementById('influenceLevel');
    const influenceReputation = document.getElementById('influenceReputation');
    const factionCount = document.getElementById('factionCount');
    
    if (!influenceLevel || !influenceReputation || !factionCount) return;
    
    const currentLevel = INFLUENCE_LEVELS.slice().reverse().find(level => 
        gameState.reputation >= level.reputation
    ) || INFLUENCE_LEVELS[0];
    
    influenceLevel.textContent = currentLevel.name;
    influenceReputation.textContent = gameState.reputation || 0;
    factionCount.textContent = `${gameState.regions?.length || 0}个`;
    
    // 检查宗门升级
    checkSectUpgrade(gameState, currentLevel);
}

// 检查宗门升级
function checkSectUpgrade(gameState, currentLevel) {
    const techniqueHallBtn = document.getElementById('techniqueHallBtn');
    if (!techniqueHallBtn) return;
    
    // 检查是否达到2级要求
    if (currentLevel.level >= 2 && !gameState.unlockedBuildings.includes('techniqueHall')) {
        gameState.unlockedBuildings.push('techniqueHall');
        gameState.sectLevel = Math.max(gameState.sectLevel, 2);
        
        techniqueHallBtn.disabled = false;
        techniqueHallBtn.textContent = '📚 功法堂';
        techniqueHallBtn.className = 'w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors ancient-border';
        
        addLog(`[升级] 恭喜！宗门升级至2级，解锁了功法堂！`, 'text-purple-400');
        addLog(`[系统] 现在可以查看和整理收集到的功法残本了。`, 'text-blue-400');
    }
}

// 显示功法堂
export function showTechniqueHall(gameState) {
    const modal = document.getElementById('techniqueHallModal');
    const techniqueFragments = document.getElementById('techniqueFragments');
    
    if (!modal || !techniqueFragments) return;
    
    techniqueFragments.innerHTML = '';
    
    if (gameState.techniqueFragments.length === 0) {
        techniqueFragments.innerHTML = `
            <div class="col-span-2 text-center text-amber-300 py-8">
                <p class="text-lg mb-2">功法堂空空如也</p>
                <p class="text-sm">通过坊市奇遇、拍卖会或弟子外出收集功法残本</p>
            </div>
        `;
    } else {
        gameState.techniqueFragments.forEach((fragment, index) => {
            const fragmentCard = createTechniqueFragmentCard(fragment, index);
            techniqueFragments.appendChild(fragmentCard);
        });
    }
    
    // 显示模态框
    modal.classList.remove('hidden');
    
    // 设置关闭事件
    const closeBtn = document.getElementById('closeTechniqueHallModal');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.classList.add('hidden');
        };
    }
}

// 创建功法残本卡片
function createTechniqueFragmentCard(fragment, index) {
    const card = document.createElement('div');
    const rarityColors = {
        'common': 'text-gray-400',
        'uncommon': 'text-green-400',
        'rare': 'text-blue-400',
        'epic': 'text-purple-400',
        'legendary': 'text-yellow-400'
    };
    
    const colorClass = rarityColors[fragment.rarity] || 'text-gray-400';
    
    card.className = 'p-4 bg-slate-800 rounded ancient-border';
    card.innerHTML = `
        <div class="mb-2">
            <h4 class="font-bold ${colorClass} text-lg">${fragment.name}</h4>
            <span class="text-xs px-2 py-1 bg-slate-700 rounded ${colorClass}">${fragment.rarity}</span>
        </div>
        <p class="text-xs text-amber-300 mb-2">${fragment.description}</p>
        <div class="text-xs text-gray-400 mb-3">
            <p class="mb-1"><strong>来历：</strong>${fragment.origin}</p>
        </div>
        <div class="flex justify-between items-center">
            <span class="text-xs text-blue-400">残本 • 无法修炼</span>
            <button onclick="studyTechniqueFragment(${index})" class="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors">
                参悟
            </button>
        </div>
    `;
    
    return card;
}

// 显示宗门宝库
export function showTreasury(gameState, category = 'pills') {
    const modal = document.getElementById('treasuryModal');
    const treasuryItems = document.getElementById('treasuryItems');
    
    if (!modal || !treasuryItems) return;
    
    treasuryItems.innerHTML = '';
    
    const items = gameState.treasury[category] || [];
    
    if (items.length === 0) {
        treasuryItems.innerHTML = `
            <div class="col-span-3 text-center text-amber-300 py-8">
                <p class="text-lg mb-2">该分类暂无物品</p>
                <p class="text-sm">通过坊市购买或拍卖获得物品会自动存入宝库</p>
            </div>
        `;
    } else {
        items.forEach((item, index) => {
            const itemCard = createTreasuryItemCard(item, category, index);
            treasuryItems.appendChild(itemCard);
        });
    }
    
    // 显示模态框
    modal.classList.remove('hidden');
    
    // 设置关闭事件
    const closeBtn = document.getElementById('closeTreasuryModal');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.classList.add('hidden');
        };
    }
}

// 显示宝库分类
window.showTreasuryCategory = function(category) {
    const gameState = window.game ? window.game.gameState : null;
    if (gameState) {
        showTreasury(gameState, category);
    }
};

// 创建宝库物品卡片
function createTreasuryItemCard(item, category, index) {
    const card = document.createElement('div');
    const rarityColors = {
        'common': 'text-gray-400',
        'uncommon': 'text-green-400',
        'rare': 'text-blue-400',
        'epic': 'text-purple-400',
        'legendary': 'text-yellow-400'
    };
    
    const colorClass = rarityColors[item.rarity] || 'text-gray-400';
    
    card.className = 'p-3 bg-slate-800 rounded ancient-border';
    card.innerHTML = `
        <div class="mb-2">
            <h4 class="font-bold ${colorClass} text-sm">${item.name}</h4>
            <span class="text-xs px-2 py-1 bg-slate-700 rounded ${colorClass}">${item.rarity}</span>
        </div>
        <p class="text-xs text-amber-300 mb-2">${item.description}</p>
        <div class="flex justify-between items-center">
            <span class="text-xs text-gray-400">数量: ${item.quantity || 1}</span>
            <button onclick="grantItemToDisciple('${category}', ${index})" class="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors">
                赐予
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
    
    // 创建弟子选择弹窗
    const discipleModal = document.createElement('div');
    discipleModal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
    
    const availableDisciples = gameState.disciples.filter(d => d.alive && !d.injured);
    
    discipleModal.innerHTML = `
        <div class="bg-slate-900 ancient-border rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 class="text-xl font-bold text-amber-200 mb-4">选择赐予弟子</h3>
            <p class="text-amber-300 mb-4">要将《${item.name}》赐予哪位弟子？</p>
            <div class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto mb-4">
                ${availableDisciples.map(disciple => `
                    <button onclick="confirmGrantItem('${category}', ${itemIndex}, ${disciple.id})" 
                            class="p-2 bg-slate-800 hover:bg-slate-700 rounded text-left transition-colors">
                        <div class="font-bold text-amber-200">${disciple.name}</div>
                        <div class="text-xs text-gray-400">${disciple.realm} • 忠诚度: ${disciple.loyalty}</div>
                    </button>
                `).join('')}
            </div>
            <button onclick="this.closest('.fixed').remove()" class="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors">
                取消
            </button>
        </div>
    `;
    
    document.body.appendChild(discipleModal);
};

// 确认赐予物品
window.confirmGrantItem = function(category, itemIndex, discipleId) {
    const gameState = window.game ? window.game.gameState : null;
    if (!gameState) return;
    
    const item = gameState.treasury[category][itemIndex];
    const disciple = gameState.disciples.find(d => d.id === discipleId);
    
    if (item && disciple) {
        // 移除物品
        if (item.quantity > 1) {
            item.quantity--;
        } else {
            gameState.treasury[category].splice(itemIndex, 1);
        }
        
        // 应用物品效果
        applyItemEffectToDisciple(item, disciple);
        
        // 增加忠诚度
        disciple.loyalty = Math.min(100, disciple.loyalty + 5);
        
        addLog(`[宝库] 将《${item.name}》赐予${disciple.name}，忠诚度+5`, 'text-green-400');
        
        // 刷新显示
        showTreasury(gameState, category);
        if (window.game) window.game.updateDisplay();
    }
    
    // 移除选择弹窗
    const modal = document.querySelector('.fixed.inset-0.bg-black');
    if (modal) modal.remove();
};

// 对弟子应用物品效果
function applyItemEffectToDisciple(item, disciple) {
    // 确保弟子有宝物数组
    if (!disciple.treasuryItems) {
        disciple.treasuryItems = [];
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
    
    switch (item.type) {
        case 'pill':
            if (item.name === '回血丹') {
                if (disciple.injured) {
                    disciple.injured = false;
                    disciple.addPersonalLog(`[治疗] 宗主赐予回血丹，伤势恢复`, Date.now());
                }
            } else if (item.name === '聚灵丹') {
                disciple.cultivation += 20;
                disciple.addPersonalLog(`[丹药] 宗主赐予聚灵丹，修为+20`, Date.now());
            }
            break;
        case 'weapon':
            disciple.talent = Math.min(100, disciple.talent + 5);
            disciple.addPersonalLog(`[武器] 宗主赐予${item.name}，天赋+5`, Date.now());
            break;
        case 'material':
            // 材料可以用于后续制作
            disciple.addPersonalLog(`[材料] 获得${item.name}，可用于后续制作`, Date.now());
            break;
    }
}

// 更新弟子列表
export function updateDiscipleList(gameState) {
    const discipleList = document.getElementById('discipleList');
    if (!discipleList) return;
    
    discipleList.innerHTML = '';
    
    // 只显示活着的弟子
    const aliveDisciples = gameState.disciples.filter(disciple => disciple.alive);
    
    aliveDisciples.forEach(disciple => {
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
                <div class="text-xs">${disciple.realm} (${disciple.cultivation}%) | ${disciple.spiritRoot}灵根</div>
                <div class="text-xs">天赋: ${disciple.talent.toFixed(1)} | 忠诚: ${disciple.loyalty}</div>
                ${disciple.constitution && disciple.constitution.name !== '凡体' ? 
                    `<div class="text-xs text-purple-400">${disciple.constitution.name}</div>` : ''}
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
                <h3 class="text-lg font-bold text-amber-200 mb-2">基本信息</h3>
                <p><span class="text-amber-300">姓名:</span> ${disciple.name}</p>
                <p><span class="text-amber-300">性别:</span> ${disciple.gender}</p>
                <p><span class="text-amber-300">年龄:</span> ${disciple.age}岁</p>
                <p><span class="text-amber-300">灵根:</span> <span class="text-blue-400">${disciple.spiritRoot}</span></p>
                <p><span class="text-amber-300">体质:</span> <span class="text-purple-400">${disciple.constitution?.name || '凡体'}</span></p>
                ${disciple.familyBackground ? 
                    `<p><span class="text-amber-300">家世:</span> <span class="text-green-400">${disciple.familyBackground.name}</span></p>` : ''}
                <p><span class="text-amber-300">性格:</span> ${disciple.personality}</p>
                <p><span class="text-amber-300">外貌:</span> ${disciple.appearance}</p>
            </div>
            <div>
                <h3 class="text-lg font-bold text-amber-200 mb-2">修炼状态</h3>
                <p><span class="text-amber-300">境界:</span> <span class="text-yellow-400">${disciple.realm} (${disciple.cultivation}%)</span></p>
                ${disciple.constitution?.description ? 
                    `<p><span class="text-amber-300">体质描述:</span> ${disciple.constitution.description}</p>` : ''}
                <p><span class="text-amber-300">战力:</span> <span class="text-red-400 font-bold">${combatPower}</span></p>
                <p><span class="text-amber-300">天赋:</span> ${disciple.talent.toFixed(1)}</p>
                <p><span class="text-amber-300">忠诚:</span> ${disciple.loyalty}/100</p>
                <p><span class="text-pink-300">好感度:</span> <span class="${disciple.affectionLevel?.color || 'text-gray-400'}">${disciple.affection || 20}/100 (${disciple.affectionLevel?.name || '陌生人'})</span></p>
                <p><span class="text-amber-300">状态:</span> ${disciple.alive ? (disciple.injured ? '受伤' : (disciple.onTask ? '任务中' : '正常')) : '已故'}</p>
                ${disciple.spouse ? `<p><span class="text-pink-300">道侣:</span> <span class="text-pink-400 font-bold">${disciple.spouse}</span></p>` : ''}
            </div>
        </div>
        
        ${disciple.treasuryItems && disciple.treasuryItems.length > 0 ? `
        <div class="mt-4">
            <h3 class="text-lg font-bold text-amber-200 mb-2">持有宝物</h3>
            <div class="grid grid-cols-2 gap-2">
                ${disciple.treasuryItems.map(item => `
                    <div class="p-2 bg-slate-800 rounded text-xs">
                        <span class="${getItemRarityColor(item.rarity)}">${item.name}</span>
                        <span class="text-gray-400"> ×${item.quantity || 1}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <div class="mt-4">
            <h3 class="text-lg font-bold text-amber-200 mb-2">操作</h3>
            <div class="flex space-x-2">
                ${disciple.alive ? `
                    ${disciple.injured ? `
                        <button id="healBtn" class="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors">
                            💊 治疗 (消耗5灵石)
                        </button>
                    ` : ''}
                    <button id="arrangeMarriageBtn" class="px-4 py-2 ${disciple.gender === '女' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-pink-600 hover:bg-pink-500'} text-white font-bold rounded transition-colors">
                        ${disciple.gender === '女' ? '💑 迎娶为道侣' : '💑 安排道侣'}
                    </button>
                    <button id="renameBtn_${disciple.id}" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded transition-colors">
                        ✏️ 改名
                    </button>
                    <button id="chatBtn_${disciple.id}" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors">
                        💬 聊天
                    </button>
                    <button id="divineChatBtn_${disciple.id}" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded transition-colors">
                        🧠 神识传音
                    </button>
                    <button id="giftBtn_${disciple.id}" class="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded transition-colors">
                        🎁 送礼
                    </button>
                    <button id="expelBtn_${disciple.id}" class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded transition-colors">
                        ⚔️ 逐出宗门
                    </button>
                ` : `
                    <div class="text-red-400 font-bold">⚰️ 该弟子已经不在宗门</div>
                `}
            </div>
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
    const renameBtn = document.getElementById(`renameBtn_${disciple.id}`);
    if (renameBtn && disciple.alive) {
        renameBtn.onclick = () => {
            const newName = prompt(`为${disciple.name}取个新名字：`, disciple.name);
            if (newName && newName.trim() && newName.trim() !== disciple.name) {
                const oldName = disciple.name;
                disciple.name = newName.trim();
                addLog(`[改名] ${oldName}改名为${disciple.name}`, 'text-indigo-400');
                showDiscipleDetails(disciple, gameState); // 刷新详情
                updateDisplay(gameState);
            }
        };
    }
    
    // 聊天按钮
    const chatBtn = document.getElementById(`chatBtn_${disciple.id}`);
    if (chatBtn && disciple.alive) {
        chatBtn.onclick = () => {
            showChatDialog(disciple, gameState);
        };
    }
    
    // 神识传音按钮
    const divineChatBtn = document.getElementById(`divineChatBtn_${disciple.id}`);
    if (divineChatBtn && disciple.alive) {
        divineChatBtn.onclick = () => {
            showDivineChatDialog(disciple, gameState);
        };
    }
    
    // 送礼按钮
    const giftBtn = document.getElementById(`giftBtn_${disciple.id}`);
    if (giftBtn && disciple.alive) {
        giftBtn.onclick = () => {
            showGiftDialog(disciple, gameState);
        };
    }
    
    // 逐出宗门按钮
    const expelBtn = document.getElementById(`expelBtn_${disciple.id}`);
    if (expelBtn && disciple.alive) {
        expelBtn.onclick = () => {
            if (confirm(`确定要将${disciple.name}逐出宗门吗？`)) {
                const reason = {
                    type: '逐出',
                    description: '因不敬师长或违反门规被逐出宗门'
                };
                recordDiscipleDeath(disciple, reason);
                document.getElementById('discipleModal').classList.add('hidden');
            }
        };
    }
    
    // 安排道侣按钮（老祖特权：可以迎娶女弟子）
    const marryBtn = document.getElementById('arrangeMarriageBtn');
    if (marryBtn && disciple.alive && !disciple.spouse) {
        marryBtn.onclick = () => {
            if (disciple.gender === '女') {
                // 老祖迎娶女弟子（需要好感度达到倾心）
                if (disciple.affection < 80) {
                    alert(`${disciple.name}对老祖的好感度还不够（需要80倾心，当前${disciple.affection}），多聊聊天、送送礼吧！`);
                    return;
                }
                
                if (confirm(`老祖要迎娶${disciple.name}为道侣吗？`)) {
                    disciple.spouse = gameState.playerName;
                    gameState.playerSpouse = disciple.name;
                    disciple.loyalty = 100; // 成为老祖道侣，忠诚度满值
                    disciple.affection = 100; // 好感度也满值
                    disciple.affectionLevel = disciple.getAffectionLevel();
                    addLog(`[道侣] 🎉 老祖迎娶${disciple.name}为道侣！${disciple.name}幸福地依偎在老祖怀中`, 'text-pink-400 font-bold');
                    showDiscipleDetails(disciple, gameState); // 刷新详情
                    updateDisplay(gameState);
                }
            } else {
                // 为男弟子安排道侣
                showMarriageOptions(disciple, gameState);
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

// 显示聊天对话框
function showChatDialog(disciple, gameState) {
    console.log('显示聊天对话框', disciple.name, disciple.aiPersonality);
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-slate-900 ancient-border rounded-lg p-6 max-w-2xl w-full mx-4">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-blue-400">💬 与${disciple.name}聊天</h2>
                <button id="closeChatModal" class="text-amber-300 hover:text-amber-200 text-2xl">&times;</button>
            </div>
            <div class="mb-4">
                <div class="text-sm text-gray-300 mb-2">
                    <span class="text-pink-300">好感度: ${disciple.affection}/100 (${disciple.affectionLevel?.name})</span>
                    <span class="ml-4 text-blue-300">性格: ${disciple.aiPersonality?.name || '未知'}</span>
                </div>
            </div>
            <div id="chatMessages" class="bg-slate-800 rounded p-4 h-64 overflow-y-auto mb-4">
                <div class="text-gray-400 text-sm">开始与${disciple.name}对话...</div>
            </div>
            <div class="flex space-x-2">
                <input type="text" id="chatInput" class="flex-1 px-3 py-2 bg-slate-800 border border-blue-500 rounded text-amber-200 focus:outline-none focus:border-blue-300" placeholder="说点什么...">
                <button id="sendMessage" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors">
                    发送
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 关闭事件
    document.getElementById('closeChatModal').onclick = () => modal.remove();
    
    // 发送消息
    const sendMessage = async () => {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        const messagesDiv = document.getElementById('chatMessages');
        
        // 添加用户消息
        const userMsg = document.createElement('div');
        userMsg.className = 'mb-2';
        userMsg.innerHTML = `<div class="text-amber-300">老祖: ${message}</div>`;
        messagesDiv.appendChild(userMsg);
        
        // 显示加载状态
        const loadingMsg = document.createElement('div');
        loadingMsg.className = 'mb-2';
        loadingMsg.innerHTML = `<div class="text-gray-400">${disciple.name}: 正在思考...</div>`;
        messagesDiv.appendChild(loadingMsg);
        
        // 滚动到底部
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        try {
            // 生成AI回复（异步）
            console.log('生成AI回复...', disciple.generateResponse);
            const aiResponse = await disciple.generateResponse(message);
            console.log('AI回复:', aiResponse);
            
            // 移除加载消息
            loadingMsg.remove();
            
            // 添加AI回复
            const aiMsg = document.createElement('div');
            aiMsg.className = 'mb-2';
            aiMsg.innerHTML = `<div class="${disciple.affectionLevel?.color || 'text-gray-400'}">${disciple.name}: ${aiResponse}</div>`;
            messagesDiv.appendChild(aiMsg);
            
        } catch (error) {
            console.error('AI回复生成失败:', error);
            // 移除加载消息
            loadingMsg.remove();
            
            // 添加错误消息
            const errorMsg = document.createElement('div');
            errorMsg.className = 'mb-2';
            errorMsg.innerHTML = `<div class="text-red-400">${disciple.name}: 弟子...弟子脑子有点乱，请再说一遍...</div>`;
            messagesDiv.appendChild(errorMsg);
        }
        
        // 滚动到底部
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        // 清空输入框
        input.value = '';
        
        // 更新显示
        updateDisplay(gameState);
    };
    
    document.getElementById('sendMessage').onclick = sendMessage;
    document.getElementById('chatInput').onkeypress = (e) => {
        if (e.key === 'Enter') sendMessage();
    };
}

// 显示送礼对话框
function showGiftDialog(disciple, gameState) {
    console.log('显示送礼对话框', disciple.name, gameState.spiritStones);
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
    
    // 礼物配置
    const gifts = [
        { name: '灵花', type: 'flower', affection: 5, cost: 10, description: '美丽的灵花，能让人心情愉悦' },
        { name: '灵果', type: 'fruit', affection: 8, cost: 20, description: '蕴含灵气的果实，有益修炼' },
        { name: '灵茶', type: 'tea', affection: 6, cost: 15, description: '清香灵茶，可静心凝神' },
        { name: '灵玉', type: 'jade', affection: 12, cost: 50, description: '温润灵玉，蕴含天地灵气' },
        { name: '丹药', type: 'pill', affection: 15, cost: 80, description: '修炼丹药，弟子最爱' },
        { name: '法器', type: 'weapon', affection: 20, cost: 150, description: '精良法器，实用珍贵' },
        { name: '功法秘籍', type: 'manual', affection: 25, cost: 200, description: '珍贵功法，修炼必备' }
    ];
    
    modal.innerHTML = `
        <div class="bg-slate-900 ancient-border rounded-lg p-6 max-w-2xl w-full mx-4">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-yellow-400">🎁 给${disciple.name}送礼</h2>
                <button id="closeGiftModal" class="text-amber-300 hover:text-amber-200 text-2xl">&times;</button>
            </div>
            <div class="mb-4">
                <div class="text-sm text-gray-300 mb-2">
                    <span class="text-pink-300">当前好感度: ${disciple.affection}/100 (${disciple.affectionLevel?.name})</span>
                    <span class="ml-4 text-yellow-300">灵石: ${gameState.spiritStones}</span>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-3 mb-4">
                ${gifts.map(gift => `
                    <div class="p-3 bg-slate-800 rounded border border-slate-600 cursor-pointer hover:border-yellow-500 transition-colors gift-item" 
                         data-gift='${JSON.stringify(gift)}'>
                        <div class="font-bold text-yellow-400">${gift.name}</div>
                        <div class="text-xs text-gray-300 mb-1">${gift.description}</div>
                        <div class="text-xs text-green-400">好感度+${gift.affection}</div>
                        <div class="text-xs text-red-400">消耗${gift.cost}灵石</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 关闭事件
    document.getElementById('closeGiftModal').onclick = () => modal.remove();
    
    // 送礼事件
    document.querySelectorAll('.gift-item').forEach(item => {
        item.onclick = () => {
            const gift = JSON.parse(item.dataset.gift);
            
            if (gameState.spiritStones < gift.cost) {
                addLog('[送礼] 灵石不足，无法赠送' + gift.name, 'text-red-400');
                return;
            }
            
            if (confirm(`确定要送给${disciple.name}${gift.name}吗？消耗${gift.cost}灵石`)) {
                gameState.spiritStones -= gift.cost;
                disciple.increaseAffection(gift.affection, `收到${gift.name}`);
                
                addLog(`[送礼] 老祖送给${disciple.name}${gift.name}，好感度+${gift.affection}`, 'text-yellow-400');
                
                modal.remove();
                showDiscipleDetails(disciple, gameState);
                updateDisplay(gameState);
            }
        };
    });
}

// 显示神识传音对话框
function showDivineChatDialog(disciple, gameState) {
    console.log('显示神识传音对话框', disciple.name);
    
    // 导入AI通讯模块
    import('./ai.js').then(({ aiCommunicator }) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-slate-900 ancient-border rounded-lg p-6 max-w-2xl w-full mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-purple-400">🧠 神识传音 - ${disciple.name}</h2>
                    <button id="closeDivineChatModal" class="text-amber-300 hover:text-amber-200 text-2xl">&times;</button>
                </div>
                
                <div class="mb-4">
                    <div class="text-sm text-gray-300 mb-2">
                        <span class="text-pink-300">好感度: ${disciple.affection}/100 (${disciple.affectionLevel?.name})</span>
                        <span class="ml-4 text-blue-300">性格: ${disciple.aiPersonality?.name || '未知'}</span>
                        <span class="ml-4 text-purple-300">境界: ${disciple.realm}</span>
                    </div>
                    <div class="text-xs text-gray-400">
                        ${aiCommunicator.isConfigured() ? 
                            `<span class="text-green-400">✅ Claude API已连接</span>` : 
                            `<span class="text-red-400">⚠️ Claude API未配置</span>`
                        }
                    </div>
                </div>
                
                <div id="divineChatMessages" class="bg-slate-800 rounded p-4 h-64 overflow-y-auto mb-4">
                    <div class="text-gray-400 text-sm">神识传音已建立，老祖可以传音给${disciple.name}...</div>
                </div>
                
                <div class="flex space-x-2 mb-4">
                    <input type="text" id="divineChatInput" class="flex-1 px-3 py-2 bg-slate-800 border border-purple-500 rounded text-amber-200 focus:outline-none focus:border-purple-300" placeholder="老祖传音...">
                    <button id="sendDivineMessage" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded transition-colors">
                        传音
                    </button>
                </div>
                
                <div class="flex justify-between items-center">
                    <button id="configAIBtn" class="text-xs text-blue-400 hover:text-blue-300">
                        ⚙️ 配置Claude API
                    </button>
                    <div class="text-xs text-gray-400">
                        💬 使用Claude 3.5进行智能对话
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 关闭事件
        document.getElementById('closeDivineChatModal').onclick = () => modal.remove();
        
        // 配置AI按钮
        document.getElementById('configAIBtn').onclick = () => {
            showAIConfigModal(aiCommunicator, modal);
        };
        
        // 发送神识传音
        const sendDivineMessage = async () => {
            const input = document.getElementById('divineChatInput');
            const message = input.value.trim();
            
            if (!message) return;
            
            if (!aiCommunicator.isConfigured()) {
                alert('请先配置Claude API！');
                return;
            }
            
            const messagesDiv = document.getElementById('divineChatMessages');
            
            // 添加老祖传音
            const userMsg = document.createElement('div');
            userMsg.className = 'mb-2';
            userMsg.innerHTML = `<div class="text-amber-300">老祖传音: ${message}</div>`;
            messagesDiv.appendChild(userMsg);
            
            // 显示弟子思考状态
            const thinkingMsg = document.createElement('div');
            thinkingMsg.className = 'mb-2';
            thinkingMsg.innerHTML = `<div class="text-gray-400">${disciple.name}: 正在接收神识...</div>`;
            messagesDiv.appendChild(thinkingMsg);
            
            // 滚动到底部
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
            
            try {
                // 调用Claude API
                const aiResponse = await aiCommunicator.fetchDiscipleResponse(message, disciple);
                
                // 移除思考状态
                thinkingMsg.remove();
                
                // 添加AI回复
                const aiMsg = document.createElement('div');
                aiMsg.className = 'mb-2';
                aiMsg.innerHTML = `<div class="${disciple.affectionLevel?.color || 'text-gray-400'}">${disciple.name}: ${aiResponse}</div>`;
                messagesDiv.appendChild(aiMsg);
                
                // 记录到弟子日志
                disciple.addPersonalLog(`[神识传音] 老祖: ${message}`, Date.now());
                disciple.addPersonalLog(`[神识传音] ${disciple.name}: ${aiResponse}`, Date.now());
                
            } catch (error) {
                console.error('Claude API调用失败:', error);
                
                // 移除思考状态
                thinkingMsg.remove();
                
                // 显示错误信息
                const errorMsg = document.createElement('div');
                errorMsg.className = 'mb-2';
                errorMsg.innerHTML = `<div class="text-red-400">${disciple.name}: 神识传音失败 - ${error.message}</div>`;
                messagesDiv.appendChild(errorMsg);
                
                // 如果是CORS错误，显示解决方案
                if (error.message.includes('CORS')) {
                    const corsMsg = document.createElement('div');
                    corsMsg.className = 'mb-2 p-2 bg-slate-700 rounded text-xs text-yellow-300';
                    corsMsg.innerHTML = `
                        <div class="font-bold">CORS跨域问题解决方案：</div>
                        <div>1. 使用代理服务器（推荐）</div>
                        <div>2. 设置浏览器CORS插件</div>
                        <div>3. 使用Vercel Edge Functions等中转服务</div>
                    `;
                    messagesDiv.appendChild(corsMsg);
                }
            }
            
            // 滚动到底部
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
            
            // 清空输入框
            input.value = '';
            
            // 更新显示
            updateDisplay(gameState);
        };
        
        document.getElementById('sendDivineMessage').onclick = sendDivineMessage;
        document.getElementById('divineChatInput').onkeypress = (e) => {
            if (e.key === 'Enter') sendDivineMessage();
        };
    }).catch(error => {
        console.error('AI模块加载失败:', error);
        alert('AI模块加载失败，请刷新页面重试');
    });
}

// 显示AI配置模态框
function showAIConfigModal(aiCommunicator, parentModal) {
    const configs = aiCommunicator.getAllConfigs();
    
    const configModal = document.createElement('div');
    configModal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
    configModal.innerHTML = `
        <div class="bg-slate-900 ancient-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-bold text-blue-400">⚙️ AI模型配置</h3>
                <button id="closeConfigModal" class="text-amber-300 hover:text-amber-200 text-2xl">&times;</button>
            </div>
            
            <!-- AI提供商选择 -->
            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-300 mb-2">选择AI模型</label>
                <div class="grid grid-cols-1 gap-4">
                    <button id="selectSiliconflow" class="p-3 border-2 ${configs.currentProvider === 'siliconflow' ? 'border-blue-500 bg-blue-900' : 'border-gray-600 bg-slate-800'} rounded-lg transition-colors">
                        <div class="font-bold text-blue-400">🌟 SiliconFlow（推荐）</div>
                        <div class="text-xs text-gray-300">完全免费，DeepSeek-V3模型</div>
                        ${configs.currentProvider === 'siliconflow' ? '<div class="text-xs text-blue-400">✅ 当前选择</div>' : ''}
                    </button>
                </div>
            </div>
            
            <!-- SiliconFlow配置 -->
            <div id="siliconflowConfig" class="space-y-4 ${configs.currentProvider === 'siliconflow' ? '' : 'hidden'}">
                <div class="p-4 bg-slate-800 rounded-lg border border-blue-500">
                    <h4 class="font-bold text-blue-400 mb-3">🌟 SiliconFlow API配置</h4>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">API Key</label>
                        <input type="password" id="siliconflowApiKeyInput" class="w-full px-3 py-2 bg-slate-700 border border-blue-500 rounded text-amber-200 focus:outline-none focus:border-blue-300" placeholder="sk-..." value="${configs.siliconflowApiKey}">
                        <div class="text-xs text-gray-400 mt-1">从 <a href="https://cloud.siliconflow.cn" target="_blank" class="text-blue-400 hover:underline">SiliconFlow控制台</a> 获取免费API Key</div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">模型</label>
                            <select id="siliconflowModelSelect" class="w-full px-3 py-2 bg-slate-700 border border-blue-500 rounded text-amber-200 focus:outline-none focus:border-blue-300">
                                <option value="deepseek-ai/DeepSeek-V3" ${configs.siliconflow.model === 'deepseek-ai/DeepSeek-V3' ? 'selected' : ''}>DeepSeek-V3（推荐）</option>
                                <option value="Qwen/Qwen2.5-7B-Instruct" ${configs.siliconflow.model === 'Qwen/Qwen2.5-7B-Instruct' ? 'selected' : ''}>Qwen2.5-7B</option>
                                <option value="meta-llama/Meta-Llama-3.1-8B-Instruct" ${configs.siliconflow.model === 'meta-llama/Meta-Llama-3.1-8B-Instruct' ? 'selected' : ''}>Llama-3.1-8B</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Max Tokens</label>
                            <input type="number" id="siliconflowMaxTokensInput" class="w-full px-3 py-2 bg-slate-700 border border-blue-500 rounded text-amber-200 focus:outline-none focus:border-blue-300" value="${configs.siliconflow.maxTokens}" min="10" max="100">
                        </div>
                    </div>
                    
                    <div class="flex space-x-2">
                        <button id="testSiliconflowBtn" class="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors">
                            测试SiliconFlow连接
                        </button>
                        <button id="saveSiliconflowBtn" class="flex-1 px-3 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors">
                            保存SiliconFlow配置
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- 使用说明 -->
            <div class="p-4 bg-slate-800 rounded-lg border border-gray-600">
                <h4 class="font-bold text-yellow-400 mb-3">📖 使用说明</h4>
                <div class="text-sm text-gray-300 space-y-2">
                    <div class="flex items-start">
                        <span class="text-blue-400 mr-2">1.</span>
                        <span>访问 <a href="https://cloud.siliconflow.cn" target="_blank" class="text-blue-400 hover:underline">SiliconFlow控制台</a> 注册账号</span>
                    </div>
                    <div class="flex items-start">
                        <span class="text-blue-400 mr-2">2.</span>
                        <span>在控制台创建免费的API Key</span>
                    </div>
                    <div class="flex items-start">
                        <span class="text-blue-400 mr-2">3.</span>
                        <span>将API Key输入上方配置框</span>
                    </div>
                    <div class="flex items-start">
                        <span class="text-blue-400 mr-2">4.</span>
                        <span>测试连接并保存配置</span>
                    </div>
                    <div class="flex items-start">
                        <span class="text-green-400 mr-2">✅</span>
                        <span>如果没有API Key，系统会自动使用本地智能回复</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(configModal);
    
    // 关闭配置模态框
    document.getElementById('closeConfigModal').onclick = () => configModal.remove();
    
    // AI提供商选择
    document.getElementById('selectSiliconflow').onclick = () => {
        aiCommunicator.setProvider('siliconflow');
        updateProviderUI('siliconflow');
    };
    
    // 更新UI显示
    function updateProviderUI(provider) {
        const siliconflowConfig = document.getElementById('siliconflowConfig');
        const siliconflowBtn = document.getElementById('selectSiliconflow');
        
        // 隐藏所有配置
        siliconflowConfig.classList.add('hidden');
        
        // 重置按钮样式
        siliconflowBtn.className = 'p-3 border-2 border-gray-600 bg-slate-800 rounded-lg transition-colors';
        
        // 显示选中的配置和按钮样式
        if (provider === 'siliconflow') {
            siliconflowConfig.classList.remove('hidden');
            siliconflowBtn.className = 'p-3 border-2 border-blue-500 bg-blue-900 rounded-lg transition-colors';
        }
    }
    
    // SiliconFlow测试连接
    document.getElementById('testSiliconflowBtn').onclick = async () => {
        const apiKey = document.getElementById('siliconflowApiKeyInput').value.trim();
        const model = document.getElementById('siliconflowModelSelect').value;
        
        if (!apiKey) {
            alert('请输入SiliconFlow API Key');
            return;
        }
        
        const btn = document.getElementById('testSiliconflowBtn');
        btn.textContent = '测试中...';
        btn.disabled = true;
        
        try {
            aiCommunicator.setSiliconflowConfig(apiKey);
            aiCommunicator.siliconflowConfig.model = model;
            
            const success = await aiCommunicator.testConnection();
            if (success) {
                alert('SiliconFlow连接测试成功！');
            } else {
                alert('SiliconFlow连接测试失败，请检查API Key');
            }
        } catch (error) {
            alert('SiliconFlow连接测试失败：' + error.message);
        } finally {
            btn.textContent = '测试SiliconFlow连接';
            btn.disabled = false;
        }
    };
    
    // 保存SiliconFlow配置
    document.getElementById('saveSiliconflowBtn').onclick = () => {
        const apiKey = document.getElementById('siliconflowApiKeyInput').value.trim();
        const model = document.getElementById('siliconflowModelSelect').value;
        const maxTokens = parseInt(document.getElementById('siliconflowMaxTokensInput').value) || 50;
        
        if (!apiKey) {
            alert('请输入SiliconFlow API Key');
            return;
        }
        
        aiCommunicator.setSiliconflowConfig(apiKey);
        aiCommunicator.siliconflowConfig.model = model;
        aiCommunicator.siliconflowConfig.maxTokens = maxTokens;
        
        // 更新游戏状态
        import('../state.js').then(({ saveAIConfig }) => {
            saveAIConfig({
                aiProvider: 'siliconflow',
                siliconflowApiKey: apiKey,
                siliconflowModel: model,
                siliconflowMaxTokens: maxTokens
            });
        });
        
        alert('SiliconFlow配置已保存！');
    };
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">模型</label>
                            <select id="qwenModelSelect" class="w-full px-3 py-2 bg-slate-700 border border-green-500 rounded text-amber-200 focus:outline-none focus:border-green-300">
                                <option value="qwen-turbo" ${configs.qwen.model === 'qwen-turbo' ? 'selected' : ''}>Qwen Turbo (推荐)</option>
                                <option value="qwen-plus" ${configs.qwen.model === 'qwen-plus' ? 'selected' : ''}>Qwen Plus</option>
                                <option value="qwen-max" ${configs.qwen.model === 'qwen-max' ? 'selected' : ''}>Qwen Max</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Max Tokens</label>
                            <input type="number" id="qwenMaxTokensInput" class="w-full px-3 py-2 bg-slate-700 border border-green-500 rounded text-amber-200 focus:outline-none focus:border-green-300" value="${configs.qwen.maxTokens}" min="10" max="1000">
                        </div>
                    </div>
                    
                    <div class="flex space-x-2">
                        <button id="testQwenBtn" class="flex-1 px-3 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors">
                            测试千问连接
                        </button>
                        <button id="saveQwenBtn" class="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors">
                            保存千问配置
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Claude配置 -->
            <div id="claudeConfig" class="space-y-4 ${configs.currentProvider === 'claude' ? '' : 'hidden'}">
                <div class="p-4 bg-slate-800 rounded-lg border border-purple-500">
                    <h4 class="font-bold text-purple-400 mb-3">🧠 Claude API配置</h4>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">API Key</label>
                        <input type="password" id="claudeApiKeyInput" class="w-full px-3 py-2 bg-slate-700 border border-purple-500 rounded text-amber-200 focus:outline-none focus:border-purple-300" placeholder="sk-ant-api03-..." value="${configs.claude.apiKey}">
                        <div class="text-xs text-gray-400 mt-1">从Anthropic控制台获取API Key</div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Base URL</label>
                        <input type="text" id="claudeBaseURLInput" class="w-full px-3 py-2 bg-slate-700 border border-purple-500 rounded text-amber-200 focus:outline-none focus:border-purple-300" value="${configs.claude.baseURL}">
                        <div class="text-xs text-gray-400 mt-1">默认: https://api.anthropic.com</div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Max Tokens</label>
                        <input type="number" id="claudeMaxTokensInput" class="w-full px-3 py-2 bg-slate-700 border border-purple-500 rounded text-amber-200 focus:outline-none focus:border-purple-300" value="${configs.claude.maxTokens}" min="10" max="1000">
                        <div class="text-xs text-gray-400 mt-1">回复最大长度，建议100字以内</div>
                    </div>
                    
                    <div class="flex space-x-2">
                        <button id="testClaudeBtn" class="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded transition-colors">
                            测试Claude连接
                        </button>
                        <button id="saveClaudeBtn" class="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors">
                            保存Claude配置
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- 获取API Key指南 -->
            <div class="mt-6 p-4 bg-slate-800 rounded-lg">
                <h4 class="font-bold text-yellow-300 mb-3">🔑 如何获取API Key</h4>
                
                <div class="space-y-3 text-sm">
                    <div class="p-3 bg-slate-700 rounded">
                        <div class="font-bold text-green-400">🌟 千问API（免费推荐）</div>
                        <div class="text-gray-300 space-y-1">
                            <div>1. 访问 <a href="https://dashscope.aliyuncs.com" target="_blank" class="text-blue-400 hover:underline">阿里云DashScope控制台</a></div>
                            <div>2. 注册/登录阿里云账号</div>
                            <div>3. 进入"API-KEY管理"页面</div>
                            <div>4. 创建新的API Key（选择"通用文本生成"服务）</div>
                            <div>5. 复制API Key到配置框中</div>
                            <div class="text-xs text-green-400">💰 新用户有免费额度，足够日常使用</div>
                        </div>
                    </div>
                    
                    <div class="p-3 bg-slate-700 rounded">
                        <div class="font-bold text-purple-400">🧠 Claude API（付费）</div>
                        <div class="text-gray-300 space-y-1">
                            <div>1. 访问 <a href="https://console.anthropic.com" target="_blank" class="text-blue-400 hover:underline">Anthropic控制台</a></div>
                            <div>2. 注册/登录账号</div>
                            <div>3. 进入"API Keys"页面</div>
                            <div>4. 创建新的API Key</div>
                            <div>5. 复制API Key到配置框中</div>
                            <div class="text-xs text-yellow-400">💰 需要付费，按使用量计费</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- CORS问题解决方案 -->
            <div class="text-xs text-gray-400">
                <div class="font-bold text-yellow-300">⚠️ 网络问题解决方案：</div>
                <div>• 千问API通常无CORS问题</div>
                <div>• Claude API可能需要代理或CORS插件</div>
                <div>• 推荐优先使用千问API</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(configModal);
    
    // 关闭配置模态框
    document.getElementById('closeConfigModal').onclick = () => configModal.remove();
    
    // AI提供商选择
    document.getElementById('selectDoubao').onclick = () => {
        aiCommunicator.setProvider('doubao');
        updateProviderUI('doubao');
    };
    
    document.getElementById('selectDeepseek').onclick = () => {
        aiCommunicator.setProvider('deepseek');
        updateProviderUI('deepseek');
    };
    
    document.getElementById('selectQwen').onclick = () => {
        aiCommunicator.setProvider('qwen');
        updateProviderUI('qwen');
    };
    
    document.getElementById('selectClaude').onclick = () => {
        aiCommunicator.setProvider('claude');
        updateProviderUI('claude');
    };
    
    // 更新UI显示
    function updateProviderUI(provider) {
        const doubaoConfig = document.getElementById('doubaoConfig');
        const deepseekConfig = document.getElementById('deepseekConfig');
        const qwenConfig = document.getElementById('qwenConfig');
        const claudeConfig = document.getElementById('claudeConfig');
        
        const doubaoBtn = document.getElementById('selectDoubao');
        const deepseekBtn = document.getElementById('selectDeepseek');
        const qwenBtn = document.getElementById('selectQwen');
        const claudeBtn = document.getElementById('selectClaude');
        
        // 隐藏所有配置
        doubaoConfig.classList.add('hidden');
        deepseekConfig.classList.add('hidden');
        qwenConfig.classList.add('hidden');
        claudeConfig.classList.add('hidden');
        
        // 重置所有按钮样式
        doubaoBtn.className = 'p-3 border-2 border-gray-600 bg-slate-800 rounded-lg transition-colors';
        deepseekBtn.className = 'p-3 border-2 border-gray-600 bg-slate-800 rounded-lg transition-colors';
        qwenBtn.className = 'p-3 border-2 border-gray-600 bg-slate-800 rounded-lg transition-colors';
        claudeBtn.className = 'p-3 border-2 border-gray-600 bg-slate-800 rounded-lg transition-colors';
        
        // 显示选中的配置和按钮样式
        if (provider === 'doubao') {
            doubaoConfig.classList.remove('hidden');
            doubaoBtn.className = 'p-3 border-2 border-orange-500 bg-orange-900 rounded-lg transition-colors';
        } else if (provider === 'deepseek') {
            deepseekConfig.classList.remove('hidden');
            deepseekBtn.className = 'p-3 border-2 border-cyan-500 bg-cyan-900 rounded-lg transition-colors';
        } else if (provider === 'qwen') {
            qwenConfig.classList.remove('hidden');
            qwenBtn.className = 'p-3 border-2 border-green-500 bg-green-900 rounded-lg transition-colors';
        } else if (provider === 'claude') {
            claudeConfig.classList.remove('hidden');
            claudeBtn.className = 'p-3 border-2 border-purple-500 bg-purple-900 rounded-lg transition-colors';
        }
    }
    
    // 千问测试连接
    document.getElementById('testQwenBtn').onclick = async () => {
        const apiKey = document.getElementById('qwenApiKeyInput').value.trim();
        const model = document.getElementById('qwenModelSelect').value;
        
        if (!apiKey) {
            alert('请输入千问API Key');
            return;
        }
        
        const btn = document.getElementById('testQwenBtn');
        btn.textContent = '测试中...';
        btn.disabled = true;
        
        try {
            aiCommunicator.setQwenConfig(apiKey);
            aiCommunicator.qwenConfig.model = model;
            await aiCommunicator.testConnection();
            alert('✅ 千问连接测试成功！');
        } catch (error) {
            alert(`❌ 千问连接测试失败: ${error.message}`);
        } finally {
            btn.textContent = '测试千问连接';
            btn.disabled = false;
        }
    };
    
    // 保存千问配置
    document.getElementById('saveQwenBtn').onclick = () => {
        const apiKey = document.getElementById('qwenApiKeyInput').value.trim();
        const model = document.getElementById('qwenModelSelect').value;
        const maxTokens = parseInt(document.getElementById('qwenMaxTokensInput').value) || 100;
        
        if (!apiKey) {
            alert('请输入千问API Key');
            return;
        }
        
        aiCommunicator.setQwenConfig(apiKey);
        aiCommunicator.qwenConfig.model = model;
        aiCommunicator.qwenConfig.maxTokens = maxTokens;
        
        // 更新游戏状态
        import('../state.js').then(({ saveAIConfig }) => {
            saveAIConfig({
                aiProvider: 'qwen',
                qwenApiKey: apiKey,
                qwenModel: model,
                qwenMaxTokens: maxTokens
            });
        });
        
        alert('千问配置已保存！');
    };
    
    // 豆包测试连接
    document.getElementById('testDoubaoBtn').onclick = async () => {
        const apiKey = document.getElementById('doubaoApiKeyInput').value.trim();
        const model = document.getElementById('doubaoModelSelect').value;
        
        if (!apiKey) {
            alert('请输入豆包API Key');
            return;
        }
        
        const btn = document.getElementById('testDoubaoBtn');
        btn.textContent = '测试中...';
        btn.disabled = true;
        
        try {
            aiCommunicator.setDoubaoConfig(apiKey);
            aiCommunicator.doubaoConfig.model = model;
            
            const success = await aiCommunicator.testConnection();
            if (success) {
                alert('豆包连接测试成功！');
            } else {
                alert('豆包连接测试失败，请检查API Key');
            }
        } catch (error) {
            alert('豆包连接测试失败：' + error.message);
        } finally {
            btn.textContent = '测试豆包连接';
            btn.disabled = false;
        }
    };
    
    // 保存豆包配置
    document.getElementById('saveDoubaoBtn').onclick = () => {
        const apiKey = document.getElementById('doubaoApiKeyInput').value.trim();
        const model = document.getElementById('doubaoModelSelect').value;
        const maxTokens = parseInt(document.getElementById('doubaoMaxTokensInput').value) || 100;
        
        if (!apiKey) {
            alert('请输入豆包API Key');
            return;
        }
        
        aiCommunicator.setDoubaoConfig(apiKey);
        aiCommunicator.doubaoConfig.model = model;
        aiCommunicator.doubaoConfig.maxTokens = maxTokens;
        
        // 更新游戏状态
        import('../state.js').then(({ saveAIConfig }) => {
            saveAIConfig({
                aiProvider: 'doubao',
                doubaoApiKey: apiKey,
                doubaoModel: model,
                doubaoMaxTokens: maxTokens
            });
        });
        
        alert('豆包配置已保存！');
    };
    
    // DeepSeek测试连接
    document.getElementById('testDeepseekBtn').onclick = async () => {
        const apiKey = document.getElementById('deepseekApiKeyInput').value.trim();
        const model = document.getElementById('deepseekModelSelect').value;
        
        if (!apiKey) {
            alert('请输入DeepSeek API Key');
            return;
        }
        
        const btn = document.getElementById('testDeepseekBtn');
        btn.textContent = '测试中...';
        btn.disabled = true;
        
        try {
            aiCommunicator.setDeepseekConfig(apiKey);
            aiCommunicator.deepseekConfig.model = model;
            
            const success = await aiCommunicator.testConnection();
            if (success) {
                alert('DeepSeek连接测试成功！');
            } else {
                alert('DeepSeek连接测试失败，请检查API Key');
            }
        } catch (error) {
            alert('DeepSeek连接测试失败：' + error.message);
        } finally {
            btn.textContent = '测试DeepSeek连接';
            btn.disabled = false;
        }
    };
    
    // 保存DeepSeek配置
    document.getElementById('saveDeepseekBtn').onclick = () => {
        const apiKey = document.getElementById('deepseekApiKeyInput').value.trim();
        const model = document.getElementById('deepseekModelSelect').value;
        const maxTokens = parseInt(document.getElementById('deepseekMaxTokensInput').value) || 100;
        
        if (!apiKey) {
            alert('请输入DeepSeek API Key');
            return;
        }
        
        aiCommunicator.setDeepseekConfig(apiKey);
        aiCommunicator.deepseekConfig.model = model;
        aiCommunicator.deepseekConfig.maxTokens = maxTokens;
        
        // 更新游戏状态
        import('../state.js').then(({ saveAIConfig }) => {
            saveAIConfig({
                aiProvider: 'deepseek',
                deepseekApiKey: apiKey,
                deepseekModel: model,
                deepseekMaxTokens: maxTokens
            });
        });
        
        alert('DeepSeek配置已保存！');
    };
    
    // Claude测试连接
    document.getElementById('testClaudeBtn').onclick = async () => {
        const apiKey = document.getElementById('claudeApiKeyInput').value.trim();
        const baseURL = document.getElementById('claudeBaseURLInput').value.trim();
        
        if (!apiKey) {
            alert('请输入Claude API Key');
            return;
        }
        
        const btn = document.getElementById('testClaudeBtn');
        btn.textContent = '测试中...';
        btn.disabled = true;
        
        try {
            aiCommunicator.setClaudeConfig(apiKey, baseURL);
            await aiCommunicator.testConnection();
            alert('✅ Claude连接测试成功！');
        } catch (error) {
            alert(`❌ Claude连接测试失败: ${error.message}`);
        } finally {
            btn.textContent = '测试Claude连接';
            btn.disabled = false;
        }
    };
    
    // 保存Claude配置
    document.getElementById('saveClaudeBtn').onclick = () => {
        const apiKey = document.getElementById('claudeApiKeyInput').value.trim();
        const baseURL = document.getElementById('claudeBaseURLInput').value.trim();
        const maxTokens = parseInt(document.getElementById('claudeMaxTokensInput').value) || 100;
        
        if (!apiKey) {
            alert('请输入Claude API Key');
            return;
        }
        
        aiCommunicator.setClaudeConfig(apiKey, baseURL);
        aiCommunicator.claudeConfig.maxTokens = maxTokens;
        
        // 更新游戏状态
        import('../state.js').then(({ saveAIConfig }) => {
            saveAIConfig({
                aiProvider: 'claude',
                claudeApiKey: apiKey,
                claudeBaseURL: baseURL,
                claudeMaxTokens: maxTokens
            });
        });
        
        alert('✅ Claude配置已保存！');
        configModal.remove();
        
        // 刷新父模态框状态
        updateParentModalStatus(parentModal, true);
    };
    
    // 更新父模态框状态
    function updateParentModalStatus(parentModal, success) {
        if (parentModal) {
            const statusDiv = parentModal.querySelector('.text-green-400, .text-red-400');
            if (statusDiv) {
                if (success) {
                    statusDiv.className = 'text-green-400';
                    statusDiv.textContent = '✅ AI API已连接';
                } else {
                    statusDiv.className = 'text-red-400';
                    statusDiv.textContent = '⚠️ AI API未配置';
                }
            }
        }
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
    
    // 根据宗门声望决定是否生成邪道任务
    const includeEvilTasks = gameState.reputation < 0; // 声望为负时出现邪道任务
    
    for (let i = 0; i < taskCount; i++) {
        let task;
        
        if (includeEvilTasks && Math.random() < 0.4) { // 40%概率生成邪道任务
            const evilTemplate = EVIL_TASKS[Math.floor(Math.random() * EVIL_TASKS.length)];
            task = {
                ...evilTemplate,
                id: Date.now() + i,
                reward: { ...evilTemplate.rewards },
                difficulty: evilTemplate.difficulty,
                isEvil: true
            };
        } else {
            const template = TASK_TEMPLATES[Math.floor(Math.random() * TASK_TEMPLATES.length)];
            task = {
                ...template,
                id: Date.now() + i,
                reward: { ...template.reward },
                difficulty: template.difficulty,
                isEvil: false
            };
        }
        
        tasks.push(task);
    }
    
    return tasks;
}

// 创建任务卡片
function createTaskCard(task) {
    const difficultyClass = getTaskDifficultyClass(task.difficulty);
    const difficultyText = getTaskDifficultyText(task.difficulty);
    const evilClass = task.isEvil ? 'border-red-600 bg-red-950' : '';
    const evilBadge = task.isEvil ? '<span class="text-xs px-2 py-1 bg-red-600 rounded text-white">邪道</span>' : '';
    
    return `
        <div class="task-card p-4 bg-slate-800 rounded ancient-border ${difficultyClass} ${evilClass}">
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-bold ${task.isEvil ? 'text-red-400' : 'text-amber-200'}">${task.name}</h4>
                <div class="flex space-x-1">
                    ${evilBadge}
                    <span class="text-xs px-2 py-1 bg-slate-700 rounded">${difficultyText}</span>
                </div>
            </div>
            <p class="text-sm ${task.isEvil ? 'text-red-300' : 'text-amber-300'} mb-3">${task.description}</p>
            <div class="text-sm">
                <div class="${task.isEvil ? 'text-red-400' : 'text-emerald-400'}">奖励：</div>
                ${formatTaskReward(task.reward, task.isEvil)}
            </div>
            <div class="mt-3">
                <button onclick="assignTask(${task.id})" class="px-3 py-1 ${task.isEvil ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'} text-white text-sm rounded transition-colors">
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
function formatTaskReward(reward, isEvil = false) {
    const parts = [];
    if (reward.spiritStones) {
        if (Array.isArray(reward.spiritStones)) {
            parts.push(`${reward.spiritStones[0]}-${reward.spiritStones[1]}灵石`);
        } else {
            parts.push(`${reward.spiritStones}灵石`);
        }
    }
    if (reward.breakthroughPills) parts.push(`${reward.breakthroughPills}破境丹`);
    if (reward.experience) parts.push(`${reward.experience}修为`);
    if (reward.reputation) {
        if (Array.isArray(reward.reputation)) {
            const repText = reward.reputation[0] < 0 ? `声望${reward.reputation[0]}-${reward.reputation[1]}` : `声望+${reward.reputation[0]}-${reward.reputation[1]}`;
            parts.push(repText);
        } else {
            const repText = reward.reputation < 0 ? `声望${reward.reputation}` : `声望+${reward.reputation}`;
            parts.push(repText);
        }
    }
    if (reward.evilKarma) {
        if (Array.isArray(reward.evilKarma)) {
            parts.push(`魔业${reward.evilKarma[0]}-${reward.evilKarma[1]}`);
        } else {
            parts.push(`魔业+${reward.evilKarma}`);
        }
    }
    if (reward.technique) parts.push('魔功传承');
    
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
    if (gameContainer) gameContainer.classList.remove('hidden');
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
        techniqueHallBtn: () => callbacks.onTechniqueHall(),
        treasuryBtn: () => callbacks.onTreasury(),
        pastRecordsBtn: () => callbacks.onPastRecords()
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
    
    // 随机触发冲突事件
    if (Math.random() < 0.1) { // 10%概率触发冲突
        triggerMarketConflictEvent(item, gameState);
        return;
    }
    
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

// 触发坊市冲突事件
function triggerMarketConflictEvent(item, gameState) {
    const events = [
        {
            title: "街头冲突",
            description: "突然间，几个修士在坊市中发生了冲突，灵石和物品散落一地！",
            choices: [
                {
                    text: "趁乱捡拾",
                    action: () => {
                        const gain = Math.floor(Math.random() * 50) + 20;
                        gameState.spiritStones += gain;
                        addLog(`[冲突] 你趁乱捡到了${gain}枚灵石！`, 'text-yellow-400');
                        
                        // 小概率获得功法残本
                        if (Math.random() < 0.3) {
                            const fragment = generateTechniqueFragment();
                            gameState.techniqueFragments = gameState.techniqueFragments || [];
                            gameState.techniqueFragments.push(fragment);
                            addLog(`[奇遇] 你还发现了一本《${fragment.name}》残本！`, 'text-purple-400');
                        }
                    }
                },
                {
                    text: "悄悄离开",
                    action: () => {
                        addLog(`[冲突] 你选择悄悄离开，避免卷入是非。`, 'text-gray-400');
                    }
                }
            ]
        },
        {
            title: "神秘商人",
            description: "一个神秘的商人向你招手，声称有稀有的功法残本出售。",
            choices: [
                {
                    text: "查看商品",
                    action: () => {
                        if (gameState.spiritStones >= 100) {
                            gameState.spiritStones -= 100;
                            const fragment = generateTechniqueFragment(true); // 高级残本
                            gameState.techniqueFragments = gameState.techniqueFragments || [];
                            gameState.techniqueFragments.push(fragment);
                            addLog(`[购买] 你花费100灵石购买了《${fragment.name}》残本！`, 'text-purple-400');
                        } else {
                            addLog(`[购买] 灵石不足，无法购买功法残本。`, 'text-red-400');
                        }
                    }
                },
                {
                    text: "拒绝离开",
                    action: () => {
                        addLog(`[坊市] 你礼貌地拒绝了商人，继续逛坊市。`, 'text-gray-400');
                    }
                }
            ]
        },
        {
            title: "弟子求助",
            description: "你的弟子突然跑来，说在坊市发现了有趣的东西。",
            choices: [
                {
                    text: "跟随查看",
                    action: () => {
                        const random = Math.random();
                        if (random < 0.4) {
                            const gain = Math.floor(Math.random() * 30) + 10;
                            gameState.spiritStones += gain;
                            addLog(`[发现] 弟子带你找到了${gain}枚被遗忘的灵石！`, 'text-green-400');
                        } else if (random < 0.7) {
                            const fragment = generateTechniqueFragment();
                            gameState.techniqueFragments = gameState.techniqueFragments || [];
                            gameState.techniqueFragments.push(fragment);
                            addLog(`[奇遇] 弟子发现了一本《${fragment.name}》残本！`, 'text-purple-400');
                        } else {
                            addLog(`[失望] 弟子只是看错了，什么都没有。`, 'text-gray-400');
                        }
                    }
                },
                {
                    text: "让弟子自己处理",
                    action: () => {
                        addLog(`[信任] 你让弟子自己处理，继续逛坊市。`, 'text-gray-400');
                    }
                }
            ]
        }
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    
    // 创建事件弹窗
    const eventModal = document.createElement('div');
    eventModal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
    eventModal.innerHTML = `
        <div class="bg-slate-900 ancient-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-xl font-bold text-amber-200 mb-4">${event.title}</h3>
            <p class="text-amber-300 mb-6">${event.description}</p>
            <div class="space-y-2">
                ${event.choices.map((choice, index) => `
                    <button onclick="handleMarketChoice(${index})" class="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors">
                        ${choice.text}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(eventModal);
    
    // 保存选择处理函数
    window.currentMarketEvent = event;
}

// 处理坊市事件选择
window.handleMarketChoice = function(choiceIndex) {
    const event = window.currentMarketEvent;
    if (event && event.choices[choiceIndex]) {
        event.choices[choiceIndex].action();
    }
    
    // 移除事件弹窗
    const eventModal = document.querySelector('.fixed.inset-0.bg-black');
    if (eventModal) {
        eventModal.remove();
    }
    
    // 刷新坊市显示
    const gameState = window.game ? window.game.gameState : null;
    if (gameState) {
        showMarket(gameState);
        if (window.game) window.game.updateDisplay();
    }
    
    window.currentMarketEvent = null;
};

// 生成功法残本
function generateTechniqueFragment(isAdvanced = false) {
    const fragments = isAdvanced ? [
        {
            name: "九转玄功残篇",
            description: "记载着上古玄功的残缺篇章，似乎蕴含着深奥的道理。",
            origin: "传说为上古大能所创，修炼可达九转之境",
            rarity: "legendary"
        },
        {
            name: "太上忘情录断章",
            description: "阐述忘情大道的残缺法诀，字字珠玑。",
            origin: "太上道门核心功法，修炼者可斩断尘缘",
            rarity: "epic"
        },
        {
            name: "万剑归宗剑谱",
            description: "剑道至高法门的残篇，剑意凌厉。",
            origin: "剑仙传承，据说练成可万剑归宗",
            rarity: "epic"
        }
    ] : [
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

// 应用物品效果（存入宝库）
function applyItemEffect(item, gameState) {
    // 将物品存入宝库
    const category = getCategoryByType(item.type);
    
    // 检查是否已有相同物品
    const existingItem = gameState.treasury[category].find(i => i.name === item.name);
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        const newItem = {
            ...item,
            quantity: 1,
            obtainedFrom: item.obtainedFrom || '未知'
        };
        gameState.treasury[category].push(newItem);
    }
    
    addLog(`[宝库] ${item.name} 已存入宗门宝库`, 'text-yellow-400');
}

// 根据物品类型获取分类
function getCategoryByType(type) {
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

// 显示拍卖会
export function showAuction(gameState) {
    const modal = document.getElementById('auctionModal');
    const auctionItems = document.getElementById('auctionItems');
    const auctionTimer = document.getElementById('auctionTimer');
    
    if (!modal || !auctionItems) return;
    
    // 如果拍卖会为空或已结束，生成新的拍卖会
    if (gameState.auctionItems.length === 0 || Date.now() > gameState.auctionEndTime) {
        generateAuctionItems(gameState);
    }
    
    // 更新拍卖物品显示
    updateAuctionItems(gameState);
    
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
            bidCount: 0,
            npcBidders: [] // NPC竞拍者列表
        };
        
        // 生成NPC竞拍者
        generateNPCBidders(item);
        gameState.auctionItems.push(item);
    }
    
    gameState.auctionEndTime = Date.now() + AUCTION_CONFIG.AUCTION_DURATION;
    
    // 启动NPC自动竞拍（如果还没有启动）
    if (!window.npcBiddingInterval) {
        startNPCBidding(gameState);
    }
}

// 生成NPC竞拍者
function generateNPCBidders(item) {
    const npcNames = [
        '青云剑仙', '丹霞子', '玄机真人', '紫阳道长', '白云散人',
        '赤炎魔君', '寒冰仙子', '雷罚天尊', '风行客', '药王传人',
        '富商钱多多', '神秘黑衣人', '东海龙王', '南山狐仙', '北境狼王'
    ];
    
    const npcCount = Math.floor(Math.random() * 3) + 2; // 2-4个NPC
    for (let i = 0; i < npcCount; i++) {
        const npc = {
            name: npcNames[Math.floor(Math.random() * npcNames.length)],
            maxBid: item.basePrice * (0.8 + Math.random() * 1.5), // 愿意支付的价格范围
            aggressiveness: Math.random(), // 激进程度 0-1
            nextBidTime: Date.now() + Math.random() * 10000 // 下次出价时间
        };
        item.npcBidders.push(npc);
    }
}

// 启动NPC自动竞拍
function startNPCBidding(gameState) {
    if (window.npcBiddingInterval) {
        clearInterval(window.npcBiddingInterval);
    }
    
    window.npcBiddingInterval = setInterval(() => {
        if (Date.now() > gameState.auctionEndTime) {
            clearInterval(window.npcBiddingInterval);
            return;
        }
        
        gameState.auctionItems.forEach(item => {
            // 随机选择一个NPC进行竞拍
            const interestedNPCs = item.npcBidders.filter(npc => 
                npc.maxBid > item.currentBid && 
                Date.now() > npc.nextBidTime &&
                Math.random() < npc.aggressiveness
            );
            
            if (interestedNPCs.length > 0) {
                const npc = interestedNPCs[Math.floor(Math.random() * interestedNPCs.length)];
                
                // 计算出价金额
                const minIncrement = AUCTION_CONFIG.MIN_BID_INCREMENT;
                const maxIncrement = minIncrement * 3;
                const increment = Math.floor(Math.random() * (maxIncrement - minIncrement + 1)) + minIncrement;
                const newBid = item.currentBid + increment;
                
                // 检查是否超过NPC的最高出价
                if (newBid <= npc.maxBid) {
                    item.currentBid = newBid;
                    item.bidder = npc.name;
                    item.bidCount++;
                    
                    // 设置下次出价时间
                    npc.nextBidTime = Date.now() + Math.random() * 8000 + 2000; // 2-10秒后
                    
                    addLog(`[拍卖会] ${npc.name}对${item.name}出价${newBid}灵石`, 'text-blue-400');
                    
                    // 刷新拍卖物品显示
                    updateAuctionItems(gameState);
                }
            }
        });
    }, 2000); // 每2秒检查一次
}

// 更新拍卖物品显示
function updateAuctionItems(gameState) {
    const auctionItems = document.getElementById('auctionItems');
    if (!auctionItems) return;
    
    auctionItems.innerHTML = '';
    
    gameState.auctionItems.forEach(item => {
        const itemCard = createAuctionItemCard(item, gameState);
        auctionItems.appendChild(itemCard);
    });
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
    
    // 最后30秒有新出价，延长拍卖时间
    const timeLeft = gameState.auctionEndTime - Date.now();
    if (timeLeft < 30000) {
        gameState.auctionEndTime += AUCTION_CONFIG.EXTENSION_TIME;
        addLog('[拍卖会] 竞争激烈，拍卖时间延长10秒！', 'text-yellow-400');
    }
    
    addLog(`[拍卖会] ${gameState.playerName}对${item.name}出价${bidAmount}灵石`, 'text-yellow-400');
    
    // 刷新拍卖物品显示
    updateAuctionItems(gameState);
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
    }
}

// 结束拍卖会
function endAuction(gameState) {
    gameState.auctionItems.forEach(item => {
        if (item.bidder === gameState.playerName) {
            // 玩家出价最高，计算获胜概率
            const winChance = calculatePlayerWinChance(item, gameState);
            const randomRoll = Math.random();
            
            if (randomRoll < winChance) {
                // 玩家获胜
                applyItemEffect(item, gameState);
                addLog(`[拍卖会] 恭喜！您以${item.currentBid}灵石获得了${item.name}`, 'text-green-400');
            } else {
                // 玩家被截胡
                const npcWinner = item.npcBidders.find(npc => npc.maxBid >= item.currentBid);
                if (npcWinner) {
                    const finalBid = item.currentBid + Math.floor(Math.random() * 100) + 50;
                    addLog(`[拍卖会] 可惜！${npcWinner.name}在最后时刻以${finalBid}灵石截胡了${item.name}`, 'text-red-400');
                }
                // 退还玩家出价
                if (gameState.playerBids[item.id]) {
                    gameState.spiritStones += gameState.playerBids[item.id];
                }
            }
        } else if (item.bidder) {
            // NPC获胜
            addLog(`[拍卖会] ${item.name}被${item.bidder}以${item.currentBid}灵石拍得`, 'text-blue-400');
        }
        
        // 退还未中标的玩家的出价
        if (gameState.playerBids[item.id] && item.bidder !== gameState.playerName) {
            gameState.spiritStones += gameState.playerBids[item.id];
        }
    });
    
    // 清空拍卖会
    gameState.auctionItems = [];
    gameState.playerBids = {};
    
    // 清除计时器
    if (window.auctionTimerInterval) {
        clearInterval(window.auctionTimerInterval);
        window.auctionTimerInterval = null;
    }
    
    if (window.npcBiddingInterval) {
        clearInterval(window.npcBiddingInterval);
        window.npcBiddingInterval = null;
    }
    
    // 刷新拍卖物品显示（清空状态）
    updateAuctionItems(gameState);
    if (window.game) window.game.updateDisplay();
}

// 计算玩家获胜概率
function calculatePlayerWinChance(item, gameState) {
    let baseChance = 0.7; // 基础70%获胜概率
    
    // 根据玩家出价比例调整
    const playerBid = gameState.playerBids[item.id] || 0;
    const itemValue = item.basePrice;
    const bidRatio = playerBid / itemValue;
    
    if (bidRatio > 1.5) baseChance += 0.2; // 出价很高，增加获胜概率
    else if (bidRatio > 1.2) baseChance += 0.1;
    else if (bidRatio < 0.8) baseChance -= 0.2; // 出价较低，减少获胜概率
    
    // 根据物品稀有度调整
    const rarityBonus = {
        'legendary': -0.1, // 传说物品竞争激烈
        'epic': -0.05,
        'rare': 0,
        'uncommon': 0.05,
        'common': 0.1
    };
    
    baseChance += rarityBonus[item.rarity] || 0;
    
    // 根据宗门影响力调整
    const influenceBonus = Math.min(gameState.reputation / 10000, 0.1); // 最多10%加成
    baseChance += influenceBonus;
    
    // 确保概率在合理范围内
    return Math.max(0.3, Math.min(0.95, baseChance));
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

// 获取物品稀有度颜色
function getItemRarityColor(rarity) {
    const colors = {
        'junk': 'text-gray-400',
        'common': 'text-white',
        'uncommon': 'text-green-400',
        'rare': 'text-blue-400',
        'epic': 'text-purple-400',
        'legendary': 'text-yellow-400'
    };
    return colors[rarity] || 'text-white';
}

// 更新组织架构显示
export function updateOrganizationDisplay(gameState) {
    const tabsContainer = document.getElementById('organizationTabs');
    const contentContainer = document.getElementById('organizationContent');
    
    if (!tabsContainer || !contentContainer) return;
    
    // 清空现有内容
    tabsContainer.innerHTML = '';
    contentContainer.innerHTML = '';
    
    // 确保弟子有组织属性
    gameState.disciples.forEach(disciple => {
        if (!disciple.organization) {
            disciple.organization = 'OUTER'; // 默认为外门弟子
        }
    });
    
    // 创建标签页
    Object.entries(SECT_ORGANIZATION).forEach(([key, org]) => {
        const tab = document.createElement('button');
        tab.className = `px-4 py-2 rounded font-bold transition-colors ${
            key === 'OUTER' ? 'bg-slate-700 text-amber-200' : 'bg-slate-600 text-gray-400 hover:bg-slate-500'
        }`;
        tab.textContent = org.name;
        tab.onclick = () => showOrganizationLevel(key, gameState);
        
        tabsContainer.appendChild(tab);
    });
    
    // 默认显示外门弟子
    showOrganizationLevel('OUTER', gameState);
}

// 显示特定组织层级的弟子
function showOrganizationLevel(levelKey, gameState) {
    const contentContainer = document.getElementById('organizationContent');
    if (!contentContainer) return;
    
    // 更新标签页样式
    const tabs = document.querySelectorAll('#organizationTabs button');
    tabs.forEach(tab => {
        tab.className = 'px-4 py-2 rounded font-bold transition-colors bg-slate-600 text-gray-400 hover:bg-slate-500';
    });
    tabs.forEach(tab => {
        if (tab.textContent === SECT_ORGANIZATION[levelKey].name) {
            tab.className = 'px-4 py-2 rounded font-bold transition-colors bg-slate-700 text-amber-200';
        }
    });
    
    // 获取该层级的弟子
    const disciples = gameState.disciples.filter(d => d.alive && d.organization === levelKey);
    const org = SECT_ORGANIZATION[levelKey];
    
    let html = `
        <div class="mb-4 p-3 bg-slate-700 rounded">
            <h3 class="font-bold ${org.color}">${org.name}</h3>
            <p class="text-xs text-gray-300">${org.description}</p>
            <p class="text-xs text-amber-300">修炼加成: ×${org.benefits.cultivationBonus} | 忠诚加成: ×${org.benefits.loyaltyBonus}</p>
            <p class="text-xs text-blue-400">人数: ${disciples.length}</p>
        </div>
    `;
    
    if (disciples.length === 0) {
        html += '<div class="text-center text-gray-400 py-4">该层级暂无弟子</div>';
    } else {
        disciples.forEach(disciple => {
            html += createOrganizationDiscipleCard(disciple, levelKey, gameState);
        });
    }
    
    contentContainer.innerHTML = html;
}

// 创建组织架构中的弟子卡片
function createOrganizationDiscipleCard(disciple, levelKey, gameState) {
    const statusColor = disciple.alive ? (disciple.injured ? 'text-yellow-400' : 'text-emerald-400') : 'text-red-400';
    const org = SECT_ORGANIZATION[levelKey];
    
    // 检查晋升条件
    const canPromoteResult = canPromote(disciple, levelKey);
    const promoteTooltip = getPromoteTooltip(disciple, levelKey);
    
    return `
        <div class="p-3 bg-slate-800 rounded border border-slate-600">
            <div class="flex justify-between items-center">
                <div class="${statusColor}">
                    <div class="font-bold">${disciple.name}</div>
                    <div class="text-xs">${disciple.realm} (${disciple.cultivation}%) | ${disciple.spiritRoot}灵根</div>
                    <div class="text-xs">天赋: ${disciple.talent.toFixed(1)} | 忠诚: ${disciple.loyalty}</div>
                    ${!canPromoteResult && org.rank < 4 ? `<div class="text-xs text-red-400">${promoteTooltip}</div>` : ''}
                </div>
                <div class="flex space-x-2">
                    ${canPromoteResult ? `
                        <button onclick="promoteDisciple('${disciple.id}')" class="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded">
                            晋升
                        </button>
                    ` : org.rank < 4 ? `
                        <button class="px-2 py-1 bg-gray-600 text-gray-400 text-xs rounded cursor-not-allowed" title="${promoteTooltip}">
                            晋升
                        </button>
                    ` : ''}
                    ${canDemote(disciple, levelKey) ? `
                        <button onclick="demoteDisciple('${disciple.id}')" class="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded">
                            贬谪
                        </button>
                    ` : ''}
                    <button onclick="showDiscipleDetails(gameState.disciples.find(d => d.id === '${disciple.id}'), gameState)" class="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded">
                        详情
                    </button>
                </div>
            </div>
        </div>
    `;
}

// 检查是否可以晋升（老祖特权：只要不是最高级就能晋升）
function canPromote(disciple, currentLevel) {
    const currentRank = SECT_ORGANIZATION[currentLevel].rank;
    return currentRank < 4; // 老祖特权，无需忠诚度和修为要求
}

// 获取晋升提示信息
function getPromoteTooltip(disciple, currentLevel) {
    const currentRank = SECT_ORGANIZATION[currentLevel].rank;
    
    if (currentRank >= 4) {
        return '已达最高等级';
    }
    
    return '老祖特权：可直接晋升';
}

// 检查是否可以贬谪
function canDemote(disciple, currentLevel) {
    const currentRank = SECT_ORGANIZATION[currentLevel].rank;
    return currentRank > 0;
}

// 晋升弟子
window.promoteDisciple = function(discipleId) {
    const disciple = gameState.disciples.find(d => d.id === discipleId);
    if (!disciple) return;
    
    const currentOrg = Object.entries(SECT_ORGANIZATION).find(([key, org]) => org.rank === disciple.organizationRank || 0);
    const nextOrg = Object.entries(SECT_ORGANIZATION).find(([key, org]) => org.rank === (currentOrg ? currentOrg[1].rank + 1 : 1));
    
    if (nextOrg) {
        disciple.organization = nextOrg[0];
        disciple.organizationRank = nextOrg[1].rank;
        disciple.loyalty = Math.min(100, disciple.loyalty + 10);
        addLog(`[晋升] ${disciple.name}晋升为${nextOrg[1].name}！`, 'text-green-400 font-bold');
        updateDisplay(gameState);
    }
};

// 贬谪弟子
window.demoteDisciple = function(discipleId) {
    const disciple = gameState.disciples.find(d => d.id === discipleId);
    if (!disciple) return;
    
    const currentOrg = Object.entries(SECT_ORGANIZATION).find(([key, org]) => org.rank === disciple.organizationRank || 0);
    const prevOrg = Object.entries(SECT_ORGANIZATION).find(([key, org]) => org.rank === (currentOrg ? currentOrg[1].rank - 1 : 0));
    
    if (prevOrg) {
        disciple.organization = prevOrg[0];
        disciple.organizationRank = prevOrg[1].rank;
        disciple.loyalty = Math.max(0, disciple.loyalty - 15);
        addLog(`[贬谪] ${disciple.name}被贬谪为${prevOrg[1].name}`, 'text-red-400');
        updateDisplay(gameState);
    }
};

// 显示往昔录
export function showPastRecords() {
    const modal = document.getElementById('pastRecordsModal');
    const recordsList = document.getElementById('pastRecordsList');
    
    if (!modal || !recordsList) return;
    
    // 获取所有死去的弟子
    const deadDisciples = gameState.disciples.filter(disciple => !disciple.alive);
    
    if (deadDisciples.length === 0) {
        recordsList.innerHTML = '<div class="text-center text-gray-400 py-8">暂无往昔记录</div>';
    } else {
        let html = '';
        deadDisciples.forEach(disciple => {
            html += createPastRecordCard(disciple);
        });
        recordsList.innerHTML = html;
    }
    
    // 显示模态框
    modal.classList.remove('hidden');
    
    // 设置关闭事件
    const closeBtn = document.getElementById('closePastRecordsModal');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.classList.add('hidden');
        };
    }
}

// 创建往昔记录卡片
function createPastRecordCard(disciple) {
    const deathReason = getDeathReason(disciple);
    const deathDate = disciple.deathDate ? new Date(disciple.deathDate).toLocaleDateString() : '未知';
    
    return `
        <div class="p-4 bg-slate-800 rounded border border-slate-600">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center mb-2">
                        <h4 class="font-bold text-gray-400">${disciple.name}</h4>
                        <span class="ml-2 px-2 py-1 bg-red-900 text-red-300 text-xs rounded">${deathReason.type}</span>
                    </div>
                    <div class="text-sm text-gray-300 mb-2">
                        <div>最终境界: ${disciple.realm} (${disciple.cultivation}%)</div>
                        <div>灵根: ${disciple.spiritRoot} | 天赋: ${disciple.talent.toFixed(1)}</div>
                        <div>原职位: ${SECT_ORGANIZATION[disciple.organization || 'OUTER']?.name || '外门弟子'}</div>
                    </div>
                    <div class="text-xs text-gray-400">
                        <div>离去时间: ${deathDate}</div>
                        <div>详情: ${deathReason.description}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 获取死亡原因
function getDeathReason(disciple) {
    if (disciple.deathReason) {
        return disciple.deathReason;
    }
    
    // 根据状态推断死亡原因
    if (disciple.injured) {
        return {
            type: '战死',
            description: '在执行任务时不幸战死'
        };
    }
    
    if (disciple.loyalty <= 0) {
        return {
            type: '叛逃',
            description: '忠诚度耗尽，背叛宗门离去'
        };
    }
    
    return {
        type: '身死',
        description: '修炼途中意外身死'
    };
}

// 记录弟子死亡
export function recordDiscipleDeath(disciple, reason) {
    disciple.alive = false;
    disciple.deathDate = Date.now();
    disciple.deathReason = reason;
    
    addLog(`[往昔] ${disciple.name}${reason.description}`, 'text-gray-400');
    updateDisplay(gameState);
}

// 逐出弟子
window.expelDisciple = function(discipleId) {
    const disciple = gameState.disciples.find(d => d.id === discipleId);
    if (!disciple) return;
    
    const reason = {
        type: '逐出',
        description: '因不敬师长或违反门规被逐出宗门'
    };
    
    recordDiscipleDeath(disciple, reason);
};
