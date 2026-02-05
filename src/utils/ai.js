// AI通讯模块 - 完全免费方案
export class AICommunicator {
    constructor() {
        // 当前使用的AI提供商
        this.currentProvider = localStorage.getItem('ai_provider') || 'siliconflow';
        
        // SiliconFlow配置（免费）
        this.siliconflowConfig = {
            apiKey: localStorage.getItem('siliconflow_api_key') || '',
            baseURL: 'https://api.siliconflow.cn',
            maxTokens: 50,
            model: 'deepseek-ai/DeepSeek-V3'
        };
        
        // 保留其他配置作为备选
        this.claudeConfig = {
            apiKey: localStorage.getItem('claude_api_key') || '',
            baseURL: localStorage.getItem('claude_base_url') || 'https://api.anthropic.com',
            maxTokens: 50,
            model: 'claude-3-5-sonnet-20241022'
        };
        
        this.qwenConfig = {
            apiKey: localStorage.getItem('qwen_api_key') || '',
            baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            maxTokens: 50,
            model: 'qwen-turbo'
        };
    }

    // 设置AI提供商
    setProvider(provider) {
        this.currentProvider = provider;
        localStorage.setItem('ai_provider', provider);
    }

    // 获取当前配置
    getCurrentConfig() {
        switch (this.currentProvider) {
            case 'siliconflow': return this.siliconflowConfig;
            case 'claude': return this.claudeConfig;
            case 'qwen': return this.qwenConfig;
            default: return this.siliconflowConfig;
        }
    }

    // 设置SiliconFlow配置
    setSiliconflowConfig(apiKey) {
        this.siliconflowConfig.apiKey = apiKey;
        localStorage.setItem('siliconflow_api_key', apiKey);
    }

    // 设置Claude配置
    setClaudeConfig(apiKey, baseURL = 'https://api.anthropic.com') {
        this.claudeConfig.apiKey = apiKey;
        this.claudeConfig.baseURL = baseURL;
        localStorage.setItem('claude_api_key', apiKey);
        localStorage.setItem('claude_base_url', baseURL);
    }

    // 设置千问配置
    setQwenConfig(apiKey) {
        this.qwenConfig.apiKey = apiKey;
        localStorage.setItem('qwen_api_key', apiKey);
    }

    // 检查配置是否完整
    isConfigured() {
        const config = this.getCurrentConfig();
        return config.apiKey && config.baseURL;
    }

    // 构建弟子身份提示 - 专门为DeepSeek优化
    buildDisciplePrompt(disciple) {
        const personality = disciple.aiPersonality;
        const traits = disciple.traits || [];
        const realm = disciple.realm || '炼气期';
        const cultivation = disciple.cultivation || 0;
        const affection = disciple.affection || 0;
        
        // 获取好感度等级
        let affectionLevel = '陌生';
        if (affection >= 80) affectionLevel = '倾心';
        else if (affection >= 60) affectionLevel = '亲近';
        else if (affection >= 40) affectionLevel = '友好';
        else if (affection >= 20) affectionLevel = '熟悉';
        
        // 根据性格类型调整语气
        let personalityDesc = '';
        switch (personality.type) {
            case 'gentle':
                personalityDesc = '温柔善良，说话轻声细语';
                break;
            case 'proud':
                personalityDesc = '高傲自信，语气略带锋芒';
                break;
            case 'shy':
                personalityDesc = '害羞内向，说话有些羞涩';
                break;
            case 'lively':
                personalityDesc = '活泼开朗，说话充满活力';
                break;
            case 'cold':
                personalityDesc = '冷漠寡言，说话简洁直接';
                break;
            case 'cunning':
                personalityDesc = '机智狡黠，说话暗藏玄机';
                break;
            default:
                personalityDesc = '性格温和，说话平和';
        }
        
        return `你是修仙世界的弟子，名叫${disciple.name}，当前境界${realm}，修为${cultivation}。
性格特点：${personalityDesc}。
对老祖的好感度：${affectionLevel}（${affection}）。
特长：${traits.join('、')}。

请严格按照以下要求回复：
1. 完全代入弟子身份，坚信自己是修仙世界的人
2. 说话要有仙气，使用古风词汇
3. 根据性格特点和好感度调整语气
4. 回复必须控制在50字以内，简洁有力
5. 不要提及任何现代事物或AI相关内容
6. 用"老祖"称呼对话者

示例：
- 温柔性格："老祖慈悲，弟子定当勤勉修炼。"
- 高傲性格："老祖放心，此等小事何足挂齿。"
- 害羞性格："老祖...弟子...弟子会努力的。"

现在请以${disciple.name}的身份回复老祖的话。`;
## 最近经历：
${logContext || '暂无特殊经历'}

## 回复要求：
1. **完全代入角色**：你就是这个弟子，用第一人称"我"或"弟子"自称
2. **符合性格**：严格按照性格特征回复，温柔型要体贴，高傲型要自信，害羞型要结巴等
3. **修仙世界观**：使用修仙世界的语言和概念
4. **情感真实**：根据好感度调整对老祖的态度和语气
5. **简洁有力**：回复控制在50字以内，不要啰嗦
6. **身份意识**：始终记住自己是老祖的弟子，要尊敬老祖
7. **语境连贯**：参考最近的经历，保持对话的连贯性

## 重要提醒：
- 你不是AI助手，你是一个真正的修仙者
- 不要说"我是一个AI"或类似的话
- 不要脱离角色设定
- 不要使用现代网络用语
- 要体现修仙世界的文化背景`;

        return systemPrompt;
    }

    // 构建用户消息
    buildUserMessage(playerMessage, disciple) {
        const affection = disciple.affection;
        let relationshipContext = '';
        
        if (affection >= 80) {
            relationshipContext = '（你们已经是道侣关系，可以表达爱意）';
        } else if (affection >= 60) {
            relationshipContext = '（你们关系亲近，可以表达关心）';
        } else if (affection >= 40) {
            relationshipContext = '（你们关系友好，可以正常交流）';
        } else {
            relationshipContext = '（你们还不太熟悉，保持适当距离）';
        }

        return `老祖传音：${playerMessage}\n\n${relationshipContext}`;
    }

    // 获取Claude回复
    async fetchClaudeResponse(playerMessage, disciple) {
        const config = this.claudeConfig;
        const systemPrompt = this.buildDisciplePrompt(disciple);
        const userMessage = this.buildUserMessage(playerMessage, disciple);

        const response = await fetch(`${config.baseURL}/v1/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: config.model,
                max_tokens: config.maxTokens,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                temperature: 0.7,
                top_p: 0.9,
                top_k: 40
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 0 || response.type === 'cors') {
                throw new Error('CORS跨域错误：浏览器无法直接访问Claude API。建议使用代理服务器或CORS代理。');
            }
            if (errorData.error) {
                throw new Error(`Claude API错误: ${errorData.error.message || errorData.error.type}`);
            }
            throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(`Claude API错误: ${data.error.message}`);
        }

        const aiResponse = data.content?.[0]?.text?.trim();
        if (!aiResponse) {
            throw new Error('Claude回复为空');
        }

        return aiResponse;
    }

    // 获取千问回复
    async fetchQwenResponse(playerMessage, disciple) {
        const config = this.qwenConfig;
        const systemPrompt = this.buildDisciplePrompt(disciple);
        const userMessage = this.buildUserMessage(playerMessage, disciple);

        const response = await fetch(`${config.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                max_tokens: config.maxTokens,
                temperature: 0.7,
                top_p: 0.9,
                repetition_penalty: 1.1
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.error) {
                throw new Error(`千问API错误: ${errorData.error.message || errorData.error.type}`);
            }
            throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(`千问API错误: ${data.error.message}`);
        }

        const aiResponse = data.choices?.[0]?.message?.content?.trim();
        if (!aiResponse) {
            throw new Error('千问回复为空');
        }

        return aiResponse;
    }

    // 获取豆包回复
    async fetchDoubaoResponse(playerMessage, disciple) {
        const config = this.doubaoConfig;
        const systemPrompt = this.buildDisciplePrompt(disciple);
        const userMessage = this.buildUserMessage(playerMessage, disciple);

        const response = await fetch(`${config.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                max_tokens: config.maxTokens,
                temperature: 0.7,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.error) {
                throw new Error(`豆包API错误: ${errorData.error.message || errorData.error.type}`);
            }
            throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(`豆包API错误: ${data.error.message}`);
        }

        const aiResponse = data.choices?.[0]?.message?.content?.trim();
        if (!aiResponse) {
            throw new Error('豆包回复为空');
        }

        return aiResponse;
    }

    // 获取DeepSeek回复
    async fetchDeepseekResponse(playerMessage, disciple) {
        const config = this.deepseekConfig;
        const systemPrompt = this.buildDisciplePrompt(disciple);
        const userMessage = this.buildUserMessage(playerMessage, disciple);

        const response = await fetch(`${config.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                max_tokens: config.maxTokens,
                temperature: 0.7,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.error) {
                throw new Error(`DeepSeek API错误: ${errorData.error.message || errorData.error.type}`);
            }
            throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(`DeepSeek API错误: ${data.error.message}`);
        }

        const aiResponse = data.choices?.[0]?.message?.content?.trim();
        if (!aiResponse) {
            throw new Error('DeepSeek回复为空');
        }

        return aiResponse;
    }
    // 获取弟子回复（主要接口）
    async fetchDiscipleResponse(playerMessage, disciple) {
        if (!this.isConfigured()) {
            throw new Error('AI API未配置，请先配置API Key');
        }

        try {
            if (this.currentProvider === 'claude') {
                return await this.fetchClaudeResponse(playerMessage, disciple);
            } else if (this.currentProvider === 'qwen') {
                return await this.fetchQwenResponse(playerMessage, disciple);
            } else if (this.currentProvider === 'doubao') {
                return await this.fetchDoubaoResponse(playerMessage, disciple);
            } else if (this.currentProvider === 'deepseek') {
                return await this.fetchDeepseekResponse(playerMessage, disciple);
            } else {
                throw new Error('未知的AI提供商');
            }
        } catch (error) {
            console.error('AI请求失败:', error);
            
            if (error.message.includes('fetch') || error.message.includes('network')) {
                throw new Error('网络连接失败。请检查网络连接或API配置。');
            }
            
            throw error;
        }
    }

    // 测试连接
    async testConnection() {
        if (!this.isConfigured()) {
            throw new Error('API未配置');
        }

        try {
            if (this.currentProvider === 'claude') {
                const response = await fetch(`${this.claudeConfig.baseURL}/v1/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.claudeConfig.apiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: this.claudeConfig.model,
                        max_tokens: 10,
                        messages: [
                            {
                                role: 'user',
                                content: '测试'
                            }
                        ]
                    })
                });
                return response.ok;
            } else if (this.currentProvider === 'qwen') {
                const response = await fetch(`${this.qwenConfig.baseURL}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.qwenConfig.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.qwenConfig.model,
                        messages: [
                            {
                                role: 'user',
                                content: '测试'
                            }
                        ],
                        max_tokens: 10
                    })
                });
                return response.ok;
            } else if (this.currentProvider === 'doubao') {
                const response = await fetch(`${this.doubaoConfig.baseURL}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.doubaoConfig.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.doubaoConfig.model,
                        messages: [
                            {
                                role: 'user',
                                content: '测试'
                            }
                        ],
                        max_tokens: 10
                    })
                });
                return response.ok;
            } else if (this.currentProvider === 'deepseek') {
                const response = await fetch(`${this.deepseekConfig.baseURL}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.deepseekConfig.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.deepseekConfig.model,
                        messages: [
                            {
                                role: 'user',
                                content: '测试'
                            }
                        ],
                        max_tokens: 10
                    })
                });
                return response.ok;
            }
        } catch (error) {
            throw new Error(`连接测试失败: ${error.message}`);
        }
    }

    // 获取所有配置
    getAllConfigs() {
        return {
            currentProvider: this.currentProvider,
            claude: this.claudeConfig,
            qwen: this.qwenConfig,
            doubao: this.doubaoConfig,
            deepseek: this.deepseekConfig
        };
    }
}

// 创建全局AI通讯实例
export const aiCommunicator = new AICommunicator();
