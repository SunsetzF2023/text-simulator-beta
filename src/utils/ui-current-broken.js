// UI工具函数 - 简化版本
import { aiCommunicator } from './ai.js';
import { saveAIConfig, getAIConfig } from '../state.js';

// 添加日志
export function addLog(message, type = 'info') {
    const logContainer = document.getElementById('gameLog');
    if (logContainer) {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }
}

// 更新显示
export function updateDisplay(gameState) {
    // 隐藏初始化模态框
    const initModal = document.getElementById('initModal');
    if (initModal) {
        initModal.style.display = 'none';
    }
    
    // 显示游戏容器
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
        gameContainer.style.display = 'block';
    }
    
    // 更新玩家信息显示
    const playerNameElement = document.getElementById('playerNameDisplay');
    if (playerNameElement && gameState.playerName) {
        playerNameElement.textContent = gameState.playerName;
    }
    
    const sectNameElement = document.getElementById('sectNameDisplay');
    if (sectNameElement && gameState.sectName) {
        sectNameElement.textContent = gameState.sectName;
    }
    
    // 更新灵石显示
    const spiritStonesElement = document.getElementById('spiritStonesDisplay');
    if (spiritStonesElement) {
        spiritStonesElement.textContent = Math.floor(gameState.spiritStones || 0);
    }
}

// 显示游戏容器
export function showGameContainer() {
    const container = document.getElementById('gameContainer');
    if (container) {
        container.style.display = 'block';
    }
}

// 显示初始化模态框
export function showInitModal() {
    // 这里可以添加初始化模态框的逻辑
}

// 获取表单数据
export function getFormData(formId) {
    // 如果没有提供formId，直接从页面获取所有输入
    if (!formId) {
        const data = {};
        
        // 获取玩家姓名
        const playerNameInput = document.getElementById('playerName');
        if (playerNameInput) {
            data.playerName = playerNameInput.value.trim();
        }
        
        // 获取宗门名称
        const sectNameInput = document.getElementById('sectName');
        if (sectNameInput) {
            data.sectName = sectNameInput.value.trim();
        }
        
        // 获取性别
        const genderInput = document.querySelector('input[name="gender"]:checked');
        if (genderInput) {
            data.gender = genderInput.value;
        }
        
        // 获取宗门风格
        const sectStyleSelect = document.getElementById('sectStyle');
        if (sectStyleSelect) {
            data.sectStyle = sectStyleSelect.value;
        }
        
        return data;
    }
    
    // 如果提供了formId，使用传统方式获取
    const form = document.getElementById(formId);
    if (!form) return {};
    
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    return data;
}

// 验证表单
export function validateForm(formData) {
    // 如果传入的是字符串，认为是formId
    if (typeof formData === 'string') {
        const form = document.getElementById(formData);
        if (!form) return false;
        return form.checkValidity();
    }
    
    // 如果传入的是对象，验证必要字段
    if (typeof formData === 'object' && formData !== null) {
        return formData.playerName && formData.sectName;
    }
    
    return false;
}

// 设置按钮监听器
export function setupButtonListeners() {
    // 这里可以添加按钮监听器的逻辑
}

// 显示任务大厅
export function showTaskHall() {
    addLog('任务大厅功能开发中...', 'info');
}

// 显示市场
export function showMarket() {
    addLog('市场功能开发中...', 'info');
}

// 显示拍卖行
export function showAuction() {
    addLog('拍卖行功能开发中...', 'info');
}

// 显示功法阁
export function showTechniqueHall() {
    addLog('功法阁功能开发中...', 'info');
}

// 显示宝库
export function showTreasury() {
    addLog('宝库功能开发中...', 'info');
}

// 显示过往记录
export function showPastRecords() {
    addLog('过往记录功能开发中...', 'info');
}

// 显示弟子详情
export function showDiscipleDetails(disciple) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-slate-900 ancient-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-amber-400">${disciple.name}</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-amber-300 hover:text-amber-200 text-2xl">&times;</button>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <div class="text-sm text-gray-400">境界</div>
                    <div class="text-amber-300 font-bold">${disciple.realm}</div>
                </div>
                <div>
                    <div class="text-sm text-gray-400">修为</div>
                    <div class="text-amber-300 font-bold">${disciple.cultivation}</div>
                </div>
                <div>
                    <div class="text-sm text-gray-400">好感度</div>
                    <div class="text-amber-300 font-bold">${disciple.affection}</div>
                </div>
                <div>
                    <div class="text-sm text-gray-400">性格</div>
                    <div class="text-amber-300 font-bold">${disciple.aiPersonality.type}</div>
                </div>
            </div>
            
            <div class="mb-4">
                <div class="text-sm text-gray-400 mb-2">特长</div>
                <div class="flex flex-wrap gap-2">
                    ${disciple.traits.map(trait => `<span class="px-2 py-1 bg-slate-700 text-amber-300 rounded text-sm">${trait}</span>`).join('')}
                </div>
            </div>
            
            <div class="mb-4">
                <div class="text-sm text-gray-400 mb-2">个人日志</div>
                <div class="bg-slate-800 p-3 rounded max-h-32 overflow-y-auto text-sm text-gray-300">
                    ${disciple.personalLog.slice(-5).map(log => `<div>${log}</div>`).join('')}
                </div>
            </div>
            
            <div class="flex space-x-2">
                <button onclick="showDivineChatDialog('${disciple.name}')" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors">
                    🧠 神识传音
                </button>
                <button onclick="showAIConfigModal()" class="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors">
                    ⚙️ 配置AI模型
                </button>
                <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded transition-colors">
                    关闭
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 显示神识传音对话框
window.showDivineChatDialog = function(discipleName) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-slate-900 ancient-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-bold text-blue-400">🧠 神识传音 - ${discipleName}</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-amber-300 hover:text-amber-200 text-2xl">&times;</button>
            </div>
            
            <div id="chatMessages" class="bg-slate-800 p-4 rounded mb-4 h-64 overflow-y-auto">
                <div class="text-gray-400 text-sm">神识传音已建立，老祖可以传音给${discipleName}...</div>
            </div>
            
            <div class="flex space-x-2">
                <input type="text" id="messageInput" placeholder="输入要传音的话..." class="flex-1 px-3 py-2 bg-slate-700 border border-blue-500 rounded text-amber-200 focus:outline-none focus:border-blue-300">
                <button onclick="sendMessage('${discipleName}')" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors">
                    传音
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 聚焦输入框
    document.getElementById('messageInput').focus();
    
    // 回车发送
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage(discipleName);
        }
    });
};

// 发送消息
window.sendMessage = async function(discipleName) {
    const input = document.getElementById('messageInput');
    const messages = document.getElementById('chatMessages');
    const message = input.value.trim();
    
    if (!message) return;
    
    // 显示用户消息
    messages.innerHTML += `<div class="mb-2"><span class="text-amber-400 font-bold">老祖传音:</span> ${message}</div>`;
    
    // 清空输入框
    input.value = '';
    
    // 显示加载状态
    messages.innerHTML += `<div class="mb-2"><span class="text-blue-400">${discipleName}:</span> <span class="text-gray-400">弟子正在接收神识...</span></div>`;
    messages.scrollTop = messages.scrollHeight;
    
    try {
        // 这里需要获取实际的弟子对象，暂时使用模拟对象
        const mockDisciple = {
            name: discipleName,
            realm: '炼气期',
            cultivation: 100,
            affection: 50,
            traits: ['修炼', '悟性'],
            aiPersonality: { type: 'gentle' }
        };
        
        const response = await aiCommunicator.fetchDiscipleResponse(message, mockDisciple);
        
        // 移除加载消息
        const lastMessage = messages.lastElementChild;
        if (lastMessage && lastMessage.textContent.includes('弟子正在接收神识')) {
            lastMessage.remove();
        }
        
        // 显示AI回复
        messages.innerHTML += `<div class="mb-2"><span class="text-green-400 font-bold">${discipleName}:</span> ${response}</div>`;
    } catch (error) {
        // 移除加载消息
        const lastMessage = messages.lastElementChild;
        if (lastMessage && lastMessage.textContent.includes('弟子正在接收神识')) {
            lastMessage.remove();
        }
        
        // 显示错误
        messages.innerHTML += `<div class="mb-2"><span class="text-red-400">${discipleName}:</span> 神识传音失败 - ${error.message}</div>`;
    }
    
    messages.scrollTop = messages.scrollHeight;
};

// 显示AI配置模态框
window.showAIConfigModal = function() {
    const configs = getAIConfig();
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-slate-900 ancient-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-bold text-blue-400">⚙️ AI模型配置</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-amber-300 hover:text-amber-200 text-2xl">&times;</button>
            </div>
            
            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-300 mb-2">选择AI模型</label>
                <div class="grid grid-cols-1 gap-4">
                    <button id="selectSiliconflow" class="p-3 border-2 ${configs.aiProvider === 'siliconflow' ? 'border-blue-500 bg-blue-900' : 'border-gray-600 bg-slate-800'} rounded-lg transition-colors">
                        <div class="font-bold text-blue-400">🌟 SiliconFlow（推荐）</div>
                        <div class="text-xs text-gray-300">完全免费，DeepSeek-V3模型</div>
                        ${configs.aiProvider === 'siliconflow' ? '<div class="text-xs text-blue-400">✅ 当前选择</div>' : ''}
                    </button>
                </div>
            </div>
            
            <div id="siliconflowConfig" class="space-y-4 ${configs.aiProvider === 'siliconflow' ? '' : 'hidden'}">
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
                                <option value="deepseek-ai/DeepSeek-V3" ${configs.siliconflowModel === 'deepseek-ai/DeepSeek-V3' ? 'selected' : ''}>DeepSeek-V3（推荐）</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Max Tokens</label>
                            <input type="number" id="siliconflowMaxTokensInput" class="w-full px-3 py-2 bg-slate-700 border border-blue-500 rounded text-amber-200 focus:outline-none focus:border-blue-300" value="${configs.siliconflowMaxTokens}" min="10" max="100">
                        </div>
                    </div>
                    
                    <div class="flex space-x-2">
                        <button onclick="testSiliconflow()" class="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors">
                            测试SiliconFlow连接
                        </button>
                        <button onclick="saveSiliconflow()" class="flex-1 px-3 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors">
                            保存SiliconFlow配置
                        </button>
                    </div>
                </div>
            </div>
            
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
    
    document.body.appendChild(modal);
    
    // 绑定事件
    document.getElementById('selectSiliconflow').onclick = () => {
        aiCommunicator.setProvider('siliconflow');
        updateProviderUI('siliconflow');
    };
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

// 测试SiliconFlow连接
window.testSiliconflow = async function() {
    const apiKey = document.getElementById('siliconflowApiKeyInput').value.trim();
    const model = document.getElementById('siliconflowModelSelect').value;
    
    if (!apiKey) {
        alert('请输入SiliconFlow API Key');
        return;
    }
    
    const btn = event.target;
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
window.saveSiliconflow = function() {
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
    saveAIConfig({
        aiProvider: 'siliconflow',
        siliconflowApiKey: apiKey,
        siliconflowModel: model,
        siliconflowMaxTokens: maxTokens
    });
    
    alert('SiliconFlow配置已保存！');
};
