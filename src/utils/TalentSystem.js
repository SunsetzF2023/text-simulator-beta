// 词条系统：负责加载、查询、应用词条效果
// 使词条不只是文本，而是影响游戏数值的实际逻辑

import { TALENTS } from '../data/talents.js';

// 词条库（按 ID 索引，便于快速查找）
const talentMap = new Map();
TALENTS.forEach((talent, index) => {
  talentMap.set(talent.name, talent);
});

/**
 * 获取单个词条的定义
 * @param {string} talentName - 词条名称
 * @returns {Object|null} 词条对象或 null
 */
export function getTalent(talentName) {
  return talentMap.get(talentName) || null;
}

/**
 * 从列表中随机选择一个词条
 * @param {Array<string>} exclude - 要排除的词条名称列表（可选）
 * @returns {Object} 词条对象
 */
export function getRandomTalent(exclude = []) {
  const available = TALENTS.filter(t => !exclude.includes(t.name));
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * 按稀有度筛选词条
 * @param {string} rarity - 稀有度（common, uncommon, rare, epic, legendary）
 * @returns {Array<Object>} 符合条件的词条列表
 */
export function getTalentsByRarity(rarity) {
  return TALENTS.filter(t => t.rarity === rarity);
}

/**
 * 计算弟子的词条加成总合
 * 这是核心函数：弟子拥有的所有词条效果都在这里叠加
 * 
 * @param {Array<string>} talentNames - 弟子拥有的词条名称列表
 * @returns {Object} 综合后的效果对象
 */
export function calculateTalentEffects(talentNames = []) {
  const combined = {};
  
  talentNames.forEach(name => {
    const talent = getTalent(name);
    if (!talent) return; // 词条不存在，跳过
    
    // 对每个 effect key，进行累加或相乘
    Object.entries(talent.effects || {}).forEach(([key, value]) => {
      if (typeof value === 'number') {
        // 乘性加成：使用乘法累加（如 1.2, 1.5）
        if (combined[key] === undefined) {
          combined[key] = value;
        } else {
          combined[key] *= value;
        }
      } else if (typeof value === 'boolean') {
        // 布尔值：只要有一个为 true 就是 true
        combined[key] = combined[key] || value;
      }
    });
  });
  
  return combined;
}

/**
 * 应用词条加成到具体数值
 * 用于计算修炼速度、战斗力等实际游戏数值
 * 
 * @param {number} baseValue - 基础数值
 * @param {string} effectKey - 效果键（如 'cultivation', 'combat'）
 * @param {Array<string>} talentNames - 弟子拥有的词条名称列表
 * @returns {number} 应用加成后的数值
 */
export function applyTalentBonus(baseValue, effectKey, talentNames = []) {
  const effects = calculateTalentEffects(talentNames);
  const multiplier = effects[effectKey] || 1.0;
  return baseValue * multiplier;
}

/**
 * 为弟子生成初始词条
 * 稀有度越高的词条，获取概率越低
 * 
 * @param {number} count - 要生成的词条数量（默认 1-3 个）
 * @returns {Array<string>} 词条名称列表
 */
export function generateInitialTalents(count = undefined) {
  if (count === undefined) {
    count = Math.floor(Math.random() * 3) + 1; // 随机 1-3 个
  }
  
  const talents = [];
  
  for (let i = 0; i < count; i++) {
    const random = Math.random();
    let selectedTalent = null;
    
    // 按稀有度分配概率
    if (random < 0.60) {
      // 60% 普通（common）
      const commonTalents = getTalentsByRarity('common');
      selectedTalent = commonTalents[Math.floor(Math.random() * commonTalents.length)];
    } else if (random < 0.85) {
      // 25% 不常见（uncommon）
      const uncommonTalents = getTalentsByRarity('uncommon');
      selectedTalent = uncommonTalents[Math.floor(Math.random() * uncommonTalents.length)];
    } else if (random < 0.97) {
      // 12% 稀有（rare）
      const rareTalents = getTalentsByRarity('rare');
      selectedTalent = rareTalents[Math.floor(Math.random() * rareTalents.length)];
    } else if (random < 0.99) {
      // 2% 史诗（epic）
      const epicTalents = getTalentsByRarity('epic');
      if (epicTalents.length > 0) {
        selectedTalent = epicTalents[Math.floor(Math.random() * epicTalents.length)];
      }
    } else {
      // 1% 传奇（legendary）
      const legendaryTalents = getTalentsByRarity('legendary');
      if (legendaryTalents.length > 0) {
        selectedTalent = legendaryTalents[Math.floor(Math.random() * legendaryTalents.length)];
      }
    }
    
    if (selectedTalent) {
      talents.push(selectedTalent.name);
    }
  }
  
  return talents;
}

/**
 * 获取词条描述（用于 UI 显示）
 * @param {Array<string>} talentNames - 词条名称列表
 * @returns {Array<Object>} 包含 name 和 description 的对象数组
 */
export function getTalentDescriptions(talentNames = []) {
  return talentNames
    .map(name => {
      const talent = getTalent(name);
      return talent ? { name: talent.name, description: talent.description, rarity: talent.rarity } : null;
    })
    .filter(t => t !== null);
}

/**
 * 调试：输出所有词条
 */
export function debugPrintAllTalents() {
  console.log(`\n=== 词条库总数: ${TALENTS.length} ===`);
  const byRarity = {};
  TALENTS.forEach(t => {
    byRarity[t.rarity] = (byRarity[t.rarity] || 0) + 1;
  });
  console.log('按稀有度统计:', byRarity);
  console.log('\n前 10 个词条:');
  TALENTS.slice(0, 10).forEach(t => {
    console.log(`  - [${t.rarity}] ${t.name}: ${t.description}`);
  });
}
