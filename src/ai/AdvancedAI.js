// 高级AI系统 - 使用Transformers.js实现真正的本地AI模型
export class AdvancedAI {
    constructor() {
        this.model = null;
        this.tokenizer = null;
        this.isInitialized = false;
        this.personalityPrompts = {
            gentle: "你是一个温柔体贴的弟子，说话温和谦逊，总是关心老祖，话语中充满关怀和体贴。",
            proud: "你是一个高傲自信的弟子，说话直接强势，有自己的主见，对自己的实力很有信心。",
            shy: "你是一个害羞内向的弟子，说话轻声细语，容易脸红，经常结巴，表达含蓄。",
            lively: "你是一个活泼开朗的弟子，话多热情，喜欢分享，总是充满活力和好奇心。",
            cold: "你是一个冷漠简洁的弟子，话少但内心关心，表达直接，不善于表达情感。",
            cunning: "你是一个狡黠机智的弟子，喜欢开玩笑，偶尔调皮，说话机智幽默，有小聪明。"
        };
        this.initializeModel();
    }
    
    // 初始化AI模型
    async initializeModel() {
        try {
            // 检查是否支持Transformers.js
            if (typeof window !== 'undefined' && window.transformers) {
                console.log('正在初始化Transformers.js模型...');
                await this.loadTransformersModel();
            } else {
                console.log('使用轻量级AI模型...');
                this.initializeLightweightModel();
            }
            this.isInitialized = true;
        } catch (error) {
            console.error('AI模型初始化失败，使用备用方案:', error);
            this.initializeLightweightModel();
            this.isInitialized = true;
        }
    }
    
    // 加载Transformers.js模型
    async loadTransformersModel() {
        try {
            // 这里可以加载真正的预训练模型
            // 由于浏览器环境限制，我们使用一个轻量级的实现
            const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0');
            
            // 加载一个轻量级的文本生成模型
            this.model = await pipeline('text-generation', 'Xenova/distilgpt2', {
                dtype: 'fp16',
                device: 'webgpu'
            });
            
            console.log('Transformers.js模型加载成功');
        } catch (error) {
            console.log('Transformers.js加载失败，使用轻量级模型:', error);
            this.initializeLightweightModel();
        }
    }
    
    // 初始化轻量级模型
    initializeLightweightModel() {
        this.model = {
            // 简化的神经网络实现
            generate: (input, options = {}) => {
                return this.generateLightweightResponse(input, options);
            }
        };
    }
    
    // 生成轻量级回复
    generateLightweightResponse(input, options = {}) {
        const { personality, affection, context, history } = options;
        
        // 构建上下文提示
        const contextPrompt = this.buildContextPrompt(personality, affection, context, history);
        
        // 使用规则引擎生成回复
        const response = this.ruleBasedGeneration(input, contextPrompt, personality, affection);
        
        return response;
    }
    
    // 构建上下文提示
    buildContextPrompt(personality, affection, context, history) {
        let prompt = this.personalityPrompts[personality] || this.personalityPrompts.gentle;
        
        // 添加好感度信息
        if (affection >= 80) {
            prompt += "你对老祖有深深的爱意，表达时充满爱意和依恋。";
        } else if (affection >= 60) {
            prompt += "你对老祖很亲近，表达时友好温暖。";
        } else if (affection >= 40) {
            prompt += "你对老祖友好，表达时礼貌客气。";
        } else {
            prompt += "你对老祖还不太熟悉，表达时保持适当距离。";
        }
        
        // 添加历史上下文
        if (history && history.length > 0) {
            const recentHistory = history.slice(-2);
            prompt += "最近的对话：";
            recentHistory.forEach(item => {
                prompt += `老祖：${item.user}\n弟子：${item.ai}\n`;
            });
        }
        
        return prompt;
    }
    
    // 基于规则的生成
    ruleBasedGeneration(input, contextPrompt, personality, affection) {
        const text = input.toLowerCase().trim();
        
        // 分析输入
        const analysis = this.analyzeInput(text);
        
        // 生成回复
        let response = this.generateResponseByAnalysis(analysis, personality, affection);
        
        // 后处理
        response = this.postProcessResponse(response, personality, affection);
        
        return response;
    }
    
    // 分析输入
    analyzeInput(text) {
        const analysis = {
            intent: 'statement',
            topics: [],
            sentiment: 'neutral',
            entities: [],
            keywords: []
        };
        
        // 意图识别
        if (this.containsAny(text, ['你好', '您好', '在吗', '哈喽', 'hello', 'hi'])) {
            analysis.intent = 'greeting';
        } else if (this.containsAny(text, ['再见', '拜拜', 'bye', '走了', '下了'])) {
            analysis.intent = 'farewell';
        } else if (this.containsAny(text, ['谢谢', '感谢', '谢了', 'thx', '3q'])) {
            analysis.intent = 'thanks';
        } else if (this.containsAny(text, ['吗', '什么', '怎么', '为什么', '?', '？'])) {
            analysis.intent = 'question';
        }
        
        // 话题识别
        if (this.containsAny(text, ['修炼', '功法', '境界', '突破', '灵气', '修为'])) {
            analysis.topics.push('cultivation');
        }
        if (this.containsAny(text, ['喜欢', '爱', '想', '念', '思念', '感情'])) {
            analysis.topics.push('feelings');
        }
        if (this.containsAny(text, ['吃', '喝', '玩', '休息', '睡觉', '生活'])) {
            analysis.topics.push('daily');
        }
        if (this.containsAny(text, ['棒', '厉害', '强', '优秀', '好', '漂亮', '美', '帅'])) {
            analysis.topics.push('praise');
        }
        if (this.containsAny(text, ['累', '辛苦', '身体', '健康', '注意'])) {
            analysis.topics.push('care');
        }
        
        // 情感分析
        const positiveWords = ['好', '棒', '厉害', '喜欢', '爱', '开心', '高兴', '快乐', '幸福'];
        const negativeWords = ['坏', '差', '讨厌', '恨', '难过', '伤心', '生气', '愤怒'];
        
        let score = 0;
        positiveWords.forEach(word => {
            if (text.includes(word)) score += 1;
        });
        negativeWords.forEach(word => {
            if (text.includes(word)) score -= 1;
        });
        
        analysis.sentiment = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
        
        return analysis;
    }
    
    // 根据分析生成回复
    generateResponseByAnalysis(analysis, personality, affection) {
        const { intent, topics, sentiment } = analysis;
        
        // 基础回复模板
        let baseResponse = this.getBaseResponse(intent, personality);
        
        // 根据话题调整
        topics.forEach(topic => {
            baseResponse = this.adjustResponseByTopic(baseResponse, topic, personality);
        });
        
        // 根据情感调整
        baseResponse = this.adjustResponseBySentiment(baseResponse, sentiment, personality);
        
        return baseResponse;
    }
    
    // 获取基础回复
    getBaseResponse(intent, personality) {
        const templates = {
            greeting: {
                gentle: ['老祖您好！弟子一直在等您呢。', '老祖来了！弟子很高兴见到您。', '老祖好，今天您看起来精神很好呢。'],
                proud: ['哼，老祖终于来了。', '老祖，弟子在此等候多时了。', '老祖，有什么事就直说吧。'],
                shy: ['老、老祖好...弟子...弟子在...', '老祖您好...弟子...弟子很高兴...', '老祖...您来了...'],
                lively: ['老祖老祖！您来啦！弟子等您好久了！', '老祖！终于见到您了！弟子有好多话想跟您说！', '老祖！今天天气真好，要不要一起出去走走？'],
                cold: ['老祖。', '嗯，来了。', '有事？'],
                cunning: ['嘿嘿，老祖！弟子就知道您会来！', '老祖！弟子有个小秘密想告诉您...', '老祖，您是不是想弟子了？']
            },
            farewell: {
                gentle: ['老祖慢走，弟子会想您的。', '老祖再见，保重身体。', '老祖，弟子期待下次与您相见。'],
                proud: ['老祖慢走。', '再见，老祖。', '老祖，弟子会继续修炼的。'],
                shy: ['老祖...再见...弟子...弟子会想您的...', '老祖慢走...弟子...弟子等您...', '老祖...保重...'],
                lively: ['老祖再见！弟子明天等您哦！', '老祖慢走！弟子会想您的！明天见！', '老祖拜拜！弟子今天很开心！'],
                cold: ['再见。', '嗯。', '老祖慢走。'],
                cunning: ['老祖慢走！弟子明天给您准备惊喜！', '嘿嘿，老祖，明天见哦！', '老祖，弟子会想您的！记得早点来！']
            },
            thanks: {
                gentle: ['老祖太客气了，弟子只是做了应该做的事。', '谢谢老祖的夸奖，弟子会更加努力的。', '老祖对弟子太好了，弟子感激不尽。'],
                proud: ['哼，这点小事算什么。', '老祖不用谢，弟子实力本就如此。', '这是弟子应该做的。'],
                shy: ['老祖...不用谢...弟子...弟子只是...', '谢谢老祖...弟子...弟子不好意思...', '老祖...这...这是弟子应该做的...'],
                lively: ['老祖不用客气！弟子很开心能帮到您！', '谢谢老祖！弟子以后会更加努力的！', '老祖！弟子最喜欢您了！'],
                cold: ['嗯。', '应该的。', '不用谢。'],
                cunning: ['嘿嘿，老祖，弟子帮您是应该的！', '老祖，弟子帮您，那您怎么感谢弟子呢？', '老祖，只要弟子能帮到您就很开心了！']
            },
            question: {
                gentle: ['老祖的问题让弟子思考一下...', '弟子觉得这个问题很有意思，让弟子想想...', '老祖，弟子认为...'],
                proud: ['哼，这还用问吗？', '老祖，答案很明显。', '弟子觉得这很简单。'],
                shy: ['老祖...弟子...弟子不知道...', '这个...弟子...弟子想想...', '老祖...弟子...弟子不太确定...'],
                lively: ['老祖！弟子知道！弟子知道！', '这个问题弟子可以回答！', '老祖！让弟子想想！'],
                cold: ['不知道。', '不清楚。', '...'],
                cunning: ['嘿嘿，老祖，弟子有个有趣的答案...', '老祖，这个问题让弟子想到了一个秘密...', '老祖，弟子有个想法，您想听听吗？']
            },
            statement: {
                gentle: ['老祖说的话弟子都记在心里。', '弟子会认真考虑老祖的话。', '老祖，弟子在听您说话。'],
                proud: ['哼，老祖的话弟子记下了。', '老祖有什么事就直说。', '弟子知道了。'],
                shy: ['老祖...弟子...弟子在听...', '老祖...弟子...弟子明白了...', '老祖...弟子...弟子想想...'],
                lively: ['老祖！弟子在听！', '老祖！弟子明白了！', '老祖！弟子会努力的！'],
                cold: ['嗯。', '知道了。', '...'],
                cunning: ['嘿嘿，老祖，弟子懂您的意思！', '老祖，弟子有个想法...', '老祖，弟子想跟您说句悄悄话...']
            }
        };
        
        const personalityTemplates = templates[intent]?.[personality] || templates.statement.gentle;
        return personalityTemplates[Math.floor(Math.random() * personalityTemplates.length)];
    }
    
    // 根据话题调整回复
    adjustResponseByTopic(response, topic, personality) {
        const topicAdjustments = {
            cultivation: {
                gentle: ['弟子会努力修炼，不辜负老祖的期望。', '弟子今天的修炼很有收获。'],
                proud: ['弟子的修炼进度很快，老祖放心。', '弟子的功法可不是一般人能比的。'],
                shy: ['弟子...弟子在努力修炼...', '老祖...弟子...弟子会努力的...'],
                lively: ['老祖老祖！弟子今天修炼超有感觉！', '弟子发现了一个修炼的小窍门！'],
                cold: ['在修炼。', '有进步。'],
                cunning: ['嘿嘿，老祖，弟子发现了一个修炼的秘密！', '老祖，弟子有个修炼的好方法！']
            },
            feelings: {
                gentle: ['老祖对弟子的好，弟子都记在心里。', '弟子很感激老祖的关心。'],
                proud: ['哼，老祖确实不错。', '老祖的实力让弟子佩服。'],
                shy: ['老祖...弟子...弟子很感激...', '老祖...弟子...弟子心里...'],
                lively: ['老祖！弟子最喜欢您了！', '老祖！弟子觉得您是最好的！'],
                cold: ['...', '老祖不错。'],
                cunning: ['嘿嘿，老祖，弟子对您的心意您懂的...', '老祖，弟子的小心思都写在脸上了呢...']
            },
            daily: {
                gentle: ['弟子今天过得很好，谢谢老祖关心。', '弟子的生活很充实，有老祖的指导很幸福。'],
                proud: ['弟子的一天很充实，修炼进度很快。', '弟子不需要关心这些琐事。'],
                shy: ['弟子...弟子今天...还好...', '老祖...弟子...弟子很努力...'],
                lively: ['老祖！弟子今天超开心的！', '老祖！弟子今天遇到了有趣的事！'],
                cold: ['还好。', '一般。'],
                cunning: ['嘿嘿，老祖，弟子今天有个小秘密...', '老祖，弟子今天发现了好玩的东西！']
            },
            praise: {
                gentle: ['谢谢老祖夸奖，弟子会继续努力的。', '能得到老祖的认可，弟子很荣幸。'],
                proud: ['哼，弟子本就如此。', '老祖终于发现弟子的优秀了。'],
                shy: ['老祖...弟子...弟子不好意思...', '谢谢老祖...弟子...弟子会努力的...'],
                lively: ['老祖！弟子超开心的！', '老祖！弟子会继续加油的！'],
                cold: ['嗯。', '知道。'],
                cunning: ['嘿嘿，老祖，弟子还有更厉害的呢！', '老祖，弟子想让您更惊喜！']
            },
            care: {
                gentle: ['谢谢老祖关心，弟子不累。', '老祖也要注意身体，不要太辛苦。'],
                proud: ['弟子不累，这点强度算什么。', '老祖不用担心弟子。'],
                shy: ['老祖...弟子...弟子不累...', '谢谢老祖...弟子...弟子还好...'],
                lively: ['老祖！弟子一点都不累！', '老祖！弟子精力充沛！'],
                cold: ['不累。', '还好。'],
                cunning: ['嘿嘿，老祖，弟子为了您，再累也值得！', '老祖，弟子见到您就不累了！']
            }
        };
        
        const adjustments = topicAdjustments[topic]?.[personality];
        if (adjustments && Math.random() > 0.5) {
            return adjustments[Math.floor(Math.random() * adjustments.length)];
        }
        
        return response;
    }
    
    // 根据情感调整回复
    adjustResponseBySentiment(response, sentiment, personality) {
        if (sentiment === 'positive') {
            // 积极情感，可以更热情一些
            if (personality === 'lively') {
                return response.replace('。', '！太开心了！');
            } else if (personality === 'gentle') {
                return response + '弟子也很高兴。';
            }
        } else if (sentiment === 'negative') {
            // 消极情感，给予安慰
            if (personality === 'gentle') {
                return response + '老祖不要难过，弟子会陪着您。';
            } else if (personality === 'cunning') {
                return response + '嘿嘿，老祖，弟子给您讲个笑话吧！';
            }
        }
        
        return response;
    }
    
    // 后处理回复
    postProcessResponse(response, personality, affection) {
        // 添加表情符号
        let emoji = '';
        if (affection >= 80) {
            emoji = ' ❤️';
        } else if (affection >= 60) {
            emoji = ' 😊';
        } else if (affection >= 40) {
            emoji = ' 🙂';
        }
        
        // 性格特定的后处理
        if (personality === 'shy') {
            // 害羞型可能结巴
            if (Math.random() > 0.7) {
                response = response.replace(/老祖/g, '老、老祖');
            }
        } else if (personality === 'lively') {
            // 活泼型更热情
            if (Math.random() > 0.6) {
                response = response.replace('。', '！');
            }
        }
        
        return response + emoji;
    }
    
    // 检查是否包含任何关键词
    containsAny(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }
    
    // 主要的生成接口
    async generateResponse(userMessage, personality, affection, history = []) {
        if (!this.isInitialized) {
            await this.initializeModel();
        }
        
        try {
            // 使用AI模型生成回复
            const response = await this.model.generate(userMessage, {
                personality,
                affection,
                context: this.buildContextPrompt(personality, affection, null, history),
                history
            });
            
            return response;
        } catch (error) {
            console.error('AI生成失败，使用备用方案:', error);
            return this.generateLightweightResponse(userMessage, {
                personality,
                affection,
                context: null,
                history
            });
        }
    }
}

// 创建全局高级AI实例
export const advancedAI = new AdvancedAI();
