// 本地AI模型系统
export class LocalAI {
    constructor() {
        this.model = this.initializeModel();
        this.context = new Map(); // 记忆上下文
        this.personalityTraits = {
            gentle: { temperature: 0.7, style: '温柔体贴' },
            proud: { temperature: 0.9, style: '高傲自信' },
            shy: { temperature: 0.5, style: '害羞内向' },
            lively: { temperature: 0.8, style: '活泼开朗' },
            cold: { temperature: 0.3, style: '冷漠简洁' },
            cunning: { temperature: 0.9, style: '狡黠机智' }
        };
    }
    
    // 初始化本地AI模型
    initializeModel() {
        // 创建一个简单的神经网络模型
        return {
            // 词汇表
            vocabulary: this.buildVocabulary(),
            
            // 情感分析器
            sentimentAnalyzer: this.buildSentimentAnalyzer(),
            
            // 上下文理解器
            contextAnalyzer: this.buildContextAnalyzer(),
            
            // 回复生成器
            responseGenerator: this.buildResponseGenerator()
        };
    }
    
    // 构建词汇表
    buildVocabulary() {
        return {
            // 问候语
            greetings: ['你好', '您好', '在吗', '在不在', '哈喽', 'hello', 'hi', '嗨'],
            
            // 告别语
            farewells: ['再见', '拜拜', 'bye', '走了', '下了', '88', '回见'],
            
            // 感谢语
            thanks: ['谢谢', '感谢', '谢了', 'thx', '3q', '多谢', '感谢'],
            
            // 修炼相关
            cultivation: ['修炼', '功法', '境界', '突破', '灵气', '修为', '道法', '法术', '练功'],
            
            // 感情相关
            feelings: ['喜欢', '爱', '想', '念', '思念', '感情', '心', '喜欢', '在意'],
            
            // 日常相关
            daily: ['吃', '喝', '玩', '休息', '睡觉', '吃饭', '生活', '今天', '昨天', '明天'],
            
            // 夸奖相关
            praise: ['棒', '厉害', '强', '优秀', '好', '漂亮', '美', '帅', '聪明', '不错'],
            
            // 关心相关
            care: ['累', '辛苦', '累不累', '休息', '身体', '健康', '注意', '保重'],
            
            // 问题相关
            questions: ['吗', '什么', '怎么', '为什么', '哪里', '谁', '何时', '如何', '?', '？']
        };
    }
    
    // 构建情感分析器
    buildSentimentAnalyzer() {
        return {
            // 分析文本情感
            analyze: (text) => {
                const positive = ['好', '棒', '厉害', '喜欢', '爱', '开心', '高兴', '快乐', '幸福'];
                const negative = ['坏', '差', '讨厌', '恨', '难过', '伤心', '生气', '愤怒'];
                
                let score = 0;
                positive.forEach(word => {
                    if (text.includes(word)) score += 1;
                });
                negative.forEach(word => {
                    if (text.includes(word)) score -= 1;
                });
                
                return {
                    score: score,
                    sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
                    intensity: Math.abs(score)
                };
            }
        };
    }
    
    // 构建上下文理解器
    buildContextAnalyzer() {
        return {
            // 分析对话上下文
            analyze: (text, history = []) => {
                const topics = [];
                const entities = [];
                const intent = this.detectIntent(text);
                
                // 提取话题
                if (this.containsAny(text, this.model.vocabulary.cultivation)) {
                    topics.push('cultivation');
                }
                if (this.containsAny(text, this.model.vocabulary.feelings)) {
                    topics.push('feelings');
                }
                if (this.containsAny(text, this.model.vocabulary.daily)) {
                    topics.push('daily');
                }
                if (this.containsAny(text, this.model.vocabulary.praise)) {
                    topics.push('praise');
                }
                if (this.containsAny(text, this.model.vocabulary.care)) {
                    topics.push('care');
                }
                
                // 提取实体
                entities.push(...this.extractEntities(text));
                
                return {
                    topics,
                    entities,
                    intent,
                    context: this.buildContextFromHistory(history)
                };
            },
            
            // 检测意图
            detectIntent: (text) => {
                if (this.containsAny(text, this.model.vocabulary.greetings)) {
                    return 'greeting';
                }
                if (this.containsAny(text, this.model.vocabulary.farewells)) {
                    return 'farewell';
                }
                if (this.containsAny(text, this.model.vocabulary.thanks)) {
                    return 'thanks';
                }
                if (this.containsAny(text, this.model.vocabulary.questions)) {
                    return 'question';
                }
                return 'statement';
            },
            
            // 从历史构建上下文
            buildContextFromHistory: (history) => {
                if (history.length === 0) return null;
                
                const recentHistory = history.slice(-3); // 最近3条对话
                return {
                    recentTopics: recentHistory.map(h => h.topic).filter(Boolean),
                    sentiment: recentHistory.map(h => h.sentiment).filter(Boolean),
                    patterns: this.detectPatterns(recentHistory)
                };
            }
        };
    }
    
    // 构建回复生成器
    buildResponseGenerator() {
        return {
            // 生成回复
            generate: (context, personality, affection) => {
                const { intent, topics, entities, context: historyContext } = context;
                
                // 根据意图生成基础回复
                let baseResponse = this.generateByIntent(intent, personality, affection);
                
                // 根据话题调整回复
                if (topics.length > 0) {
                    baseResponse = this.adjustByTopics(baseResponse, topics, personality);
                }
                
                // 根据上下文调整回复
                if (historyContext) {
                    baseResponse = this.adjustByContext(baseResponse, historyContext, personality);
                }
                
                // 根据好感度调整语气
                baseResponse = this.adjustByAffection(baseResponse, affection, personality);
                
                return baseResponse;
            },
            
            // 根据意图生成回复
            generateByIntent: (intent, personality, affection) => {
                const templates = this.getResponseTemplates(intent, personality);
                return this.selectTemplate(templates, affection);
            },
            
            // 获取回复模板
            getResponseTemplates: (intent, personality) => {
                const templates = {
                    greeting: {
                        gentle: [
                            '老祖您好！弟子一直在等您呢。',
                            '老祖来了！弟子很高兴见到您。',
                            '老祖好，今天您看起来精神很好呢。'
                        ],
                        proud: [
                            '哼，老祖终于来了。',
                            '老祖，弟子在此等候多时了。',
                            '老祖，有什么事就直说吧。'
                        ],
                        shy: [
                            '老、老祖好...弟子...弟子在...',
                            '老祖您好...弟子...弟子很高兴...',
                            '老祖...您来了...'
                        ],
                        lively: [
                            '老祖老祖！您来啦！弟子等您好久了！',
                            '老祖！终于见到您了！弟子有好多话想跟您说！',
                            '老祖！今天天气真好，要不要一起出去走走？'
                        ],
                        cold: [
                            '老祖。',
                            '嗯，来了。',
                            '有事？'
                        ],
                        cunning: [
                            '嘿嘿，老祖！弟子就知道您会来！',
                            '老祖！弟子有个小秘密想告诉您...',
                            '老祖，您是不是想弟子了？'
                        ]
                    },
                    farewell: {
                        gentle: [
                            '老祖慢走，弟子会想您的。',
                            '老祖再见，保重身体。',
                            '老祖，弟子期待下次与您相见。'
                        ],
                        proud: [
                            '老祖慢走。',
                            '再见，老祖。',
                            '老祖，弟子会继续修炼的。'
                        ],
                        shy: [
                            '老祖...再见...弟子...弟子会想您的...',
                            '老祖慢走...弟子...弟子等您...',
                            '老祖...保重...'
                        ],
                        lively: [
                            '老祖再见！弟子明天等您哦！',
                            '老祖慢走！弟子会想您的！明天见！',
                            '老祖拜拜！弟子今天很开心！'
                        ],
                        cold: [
                            '再见。',
                            '嗯。',
                            '老祖慢走。'
                        ],
                        cunning: [
                            '老祖慢走！弟子明天给您准备惊喜！',
                            '嘿嘿，老祖，明天见哦！',
                            '老祖，弟子会想您的！记得早点来！'
                        ]
                    },
                    thanks: {
                        gentle: [
                            '老祖太客气了，弟子只是做了应该做的事。',
                            '谢谢老祖的夸奖，弟子会更加努力的。',
                            '老祖对弟子太好了，弟子感激不尽。'
                        ],
                        proud: [
                            '哼，这点小事算什么。',
                            '老祖不用谢，弟子实力本就如此。',
                            '这是弟子应该做的。'
                        ],
                        shy: [
                            '老祖...不用谢...弟子...弟子只是...',
                            '谢谢老祖...弟子...弟子不好意思...',
                            '老祖...这...这是弟子应该做的...'
                        ],
                        lively: [
                            '老祖不用客气！弟子很开心能帮到您！',
                            '谢谢老祖！弟子以后会更加努力的！',
                            '老祖！弟子最喜欢您了！'
                        ],
                        cold: [
                            '嗯。',
                            '应该的。',
                            '不用谢。'
                        ],
                        cunning: [
                            '嘿嘿，老祖，弟子帮您是应该的！',
                            '老祖，弟子帮您，那您怎么感谢弟子呢？',
                            '老祖，只要弟子能帮到您就很开心了！'
                        ]
                    },
                    question: {
                        gentle: [
                            '老祖的问题让弟子思考一下...',
                            '弟子觉得这个问题很有意思，让弟子想想...',
                            '老祖，弟子认为...'
                        ],
                        proud: [
                            '哼，这还用问吗？',
                            '老祖，答案很明显。',
                            '弟子觉得这很简单。'
                        ],
                        shy: [
                            '老祖...弟子...弟子不知道...',
                            '这个...弟子...弟子想想...',
                            '老祖...弟子...弟子不太确定...'
                        ],
                        lively: [
                            '老祖！弟子知道！弟子知道！',
                            '这个问题弟子可以回答！',
                            '老祖！让弟子想想！'
                        ],
                        cold: [
                            '不知道。',
                            '不清楚。',
                            '...'
                        ],
                        cunning: [
                            '嘿嘿，老祖，弟子有个有趣的答案...',
                            '老祖，这个问题让弟子想到了一个秘密...',
                            '老祖，弟子有个想法，您想听听吗？'
                        ]
                    },
                    statement: {
                        gentle: [
                            '老祖说的话弟子都记在心里。',
                            '弟子会认真考虑老祖的话。',
                            '老祖，弟子在听您说话。'
                        ],
                        proud: [
                            '哼，老祖的话弟子记下了。',
                            '老祖有什么事就直说。',
                            '弟子知道了。'
                        ],
                        shy: [
                            '老祖...弟子...弟子在听...',
                            '老祖...弟子...弟子明白了...',
                            '老祖...弟子...弟子想想...'
                        ],
                        lively: [
                            '老祖！弟子在听！',
                            '老祖！弟子明白了！',
                            '老祖！弟子会努力的！'
                        ],
                        cold: [
                            '嗯。',
                            '知道了。',
                            '...'
                        ],
                        cunning: [
                            '嘿嘿，老祖，弟子懂您的意思！',
                            '老祖，弟子有个想法...',
                            '老祖，弟子想跟您说句悄悄话...'
                        ]
                    }
                };
                
                return templates[intent]?.[personality] || templates.statement.gentle;
            },
            
            // 根据话题调整回复
            adjustByTopics: (response, topics, personality) => {
                let adjustedResponse = response;
                
                topics.forEach(topic => {
                    switch (topic) {
                        case 'cultivation':
                            adjustedResponse = this.addCultivationContext(adjustedResponse, personality);
                            break;
                        case 'feelings':
                            adjustedResponse = this.addFeelingsContext(adjustedResponse, personality);
                            break;
                        case 'daily':
                            adjustedResponse = this.addDailyContext(adjustedResponse, personality);
                            break;
                        case 'praise':
                            adjustedResponse = this.addPraiseContext(adjustedResponse, personality);
                            break;
                        case 'care':
                            adjustedResponse = this.addCareContext(adjustedResponse, personality);
                            break;
                    }
                });
                
                return adjustedResponse;
            },
            
            // 添加修炼上下文
            addCultivationContext: (response, personality) => {
                const cultivationContexts = {
                    gentle: ['弟子会努力修炼，不辜负老祖的期望。', '弟子今天的修炼很有收获。'],
                    proud: ['弟子的修炼进度很快，老祖放心。', '弟子的功法可不是一般人能比的。'],
                    shy: ['弟子...弟子在努力修炼...', '老祖...弟子...弟子会努力的...'],
                    lively: ['老祖老祖！弟子今天修炼超有感觉！', '弟子发现了一个修炼的小窍门！'],
                    cold: ['在修炼。', '有进步。'],
                    cunning: ['嘿嘿，老祖，弟子发现了一个修炼的秘密！', '老祖，弟子有个修炼的好方法！']
                };
                
                const contexts = cultivationContexts[personality] || cultivationContexts.gentle;
                return Math.random() > 0.5 ? response : contexts[Math.floor(Math.random() * contexts.length)];
            },
            
            // 添加感情上下文
            addFeelingsContext: (response, personality) => {
                const feelingsContexts = {
                    gentle: ['老祖对弟子的好，弟子都记在心里。', '弟子很感激老祖的关心。'],
                    proud: ['哼，老祖确实不错。', '老祖的实力让弟子佩服。'],
                    shy: ['老祖...弟子...弟子很感激...', '老祖...弟子...弟子心里...'],
                    lively: ['老祖！弟子最喜欢您了！', '老祖！弟子觉得您是最好的！'],
                    cold: ['...', '老祖不错。'],
                    cunning: ['嘿嘿，老祖，弟子对您的心意您懂的...', '老祖，弟子的小心思都写在脸上了呢...']
                };
                
                const contexts = feelingsContexts[personality] || feelingsContexts.gentle;
                return Math.random() > 0.5 ? response : contexts[Math.floor(Math.random() * contexts.length)];
            },
            
            // 添加日常上下文
            addDailyContext: (response, personality) => {
                const dailyContexts = {
                    gentle: ['弟子今天过得很好，谢谢老祖关心。', '弟子的生活很充实，有老祖的指导很幸福。'],
                    proud: ['弟子的一天很充实，修炼进度很快。', '弟子不需要关心这些琐事。'],
                    shy: ['弟子...弟子今天...还好...', '老祖...弟子...弟子很努力...'],
                    lively: ['老祖！弟子今天超开心的！', '老祖！弟子今天遇到了有趣的事！'],
                    cold: ['还好。', '一般。'],
                    cunning: ['嘿嘿，老祖，弟子今天有个小秘密...', '老祖，弟子今天发现了好玩的东西！']
                };
                
                const contexts = dailyContexts[personality] || dailyContexts.gentle;
                return Math.random() > 0.5 ? response : contexts[Math.floor(Math.random() * contexts.length)];
            },
            
            // 添加夸奖上下文
            addPraiseContext: (response, personality) => {
                const praiseContexts = {
                    gentle: ['谢谢老祖夸奖，弟子会继续努力的。', '能得到老祖的认可，弟子很荣幸。'],
                    proud: ['哼，弟子本就如此。', '老祖终于发现弟子的优秀了。'],
                    shy: ['老祖...弟子...弟子不好意思...', '谢谢老祖...弟子...弟子会努力的...'],
                    lively: ['老祖！弟子超开心的！', '老祖！弟子会继续加油的！'],
                    cold: ['嗯。', '知道。'],
                    cunning: ['嘿嘿，老祖，弟子还有更厉害的呢！', '老祖，弟子想让您更惊喜！']
                };
                
                const contexts = praiseContexts[personality] || praiseContexts.gentle;
                return Math.random() > 0.5 ? response : contexts[Math.floor(Math.random() * contexts.length)];
            },
            
            // 添加关心上下文
            addCareContext: (response, personality) => {
                const careContexts = {
                    gentle: ['谢谢老祖关心，弟子不累。', '老祖也要注意身体，不要太辛苦。'],
                    proud: ['弟子不累，这点强度算什么。', '老祖不用担心弟子。'],
                    shy: ['老祖...弟子...弟子不累...', '谢谢老祖...弟子...弟子还好...'],
                    lively: ['老祖！弟子一点都不累！', '老祖！弟子精力充沛！'],
                    cold: ['不累。', '还好。'],
                    cunning: ['嘿嘿，老祖，弟子为了您，再累也值得！', '老祖，弟子见到您就不累了！']
                };
                
                const contexts = careContexts[personality] || careContexts.gentle;
                return Math.random() > 0.5 ? response : contexts[Math.floor(Math.random() * contexts.length)];
            },
            
            // 根据上下文调整回复
            adjustByContext: (response, historyContext, personality) => {
                // 这里可以根据历史对话上下文进一步调整回复
                // 比如如果之前讨论过修炼，可以延续这个话题
                return response;
            },
            
            // 根据好感度调整语气
            adjustByAffection: (response, affection, personality) => {
                let emoji = '';
                if (affection >= 80) {
                    emoji = ' ❤️';
                } else if (affection >= 60) {
                    emoji = ' 😊';
                } else if (affection >= 40) {
                    emoji = ' 🙂';
                }
                
                return response + emoji;
            },
            
            // 选择模板
            selectTemplate: (templates, affection) => {
                // 根据好感度调整选择概率
                const weights = templates.map((template, index) => {
                    // 好感度高的弟子更倾向于表达感情
                    if (affection >= 80 && template.includes('喜欢') || template.includes('爱')) {
                        return 2;
                    }
                    return 1;
                });
                
                const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
                let random = Math.random() * totalWeight;
                
                for (let i = 0; i < templates.length; i++) {
                    random -= weights[i];
                    if (random <= 0) {
                        return templates[i];
                    }
                }
                
                return templates[0];
            }
        };
    }
    
    // 检查文本是否包含任何关键词
    containsAny(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }
    
    // 提取实体
    extractEntities(text) {
        const entities = [];
        
        // 提取人名（这里简化处理）
        if (text.includes('老祖')) {
            entities.push({ type: 'person', value: '老祖' });
        }
        
        return entities;
    }
    
    // 检测模式
    detectPatterns(history) {
        // 检测对话模式，比如是否总是问问题，是否总是夸奖等
        const patterns = [];
        
        const intents = history.map(h => h.intent);
        const questionCount = intents.filter(intent => intent === 'question').length;
        
        if (questionCount > intents.length * 0.7) {
            patterns.push('question_heavy');
        }
        
        return patterns;
    }
    
    // 生成AI回复（主要接口）
    generateResponse(userMessage, personality, affection, history = []) {
        // 分析输入
        const sentiment = this.model.sentimentAnalyzer.analyze(userMessage);
        const context = this.model.contextAnalyzer.analyze(userMessage, history);
        
        // 生成回复
        const response = this.model.responseGenerator.generate(context, personality, affection);
        
        // 记录对话历史
        history.push({
            user: userMessage,
            ai: response,
            sentiment: sentiment,
            intent: context.intent,
            topics: context.topics,
            timestamp: Date.now()
        });
        
        return response;
    }
}

// 创建全局AI实例
export const localAI = new LocalAI();
