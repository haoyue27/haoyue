/**
 * 物品系统 - 掉落,装备,消耗品,套装
 */

// 装备品质颜色
export const RARITY = {
  COMMON: { name: '普通', color: '#aaaaaa', class: 'common', mult: 1 },
  RARE: { name: '稀有', color: '#339af0', class: 'rare', mult: 1.5 },
  EPIC: { name: '史诗', color: '#ae3ec9', class: 'epic', mult: 2.2 },
  LEGENDARY: { name: '传说', color: '#ff8c00', class: 'legendary', mult: 3.5 }
};

// 装备类型
export const EQUIP_TYPE = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  RING: 'ring',
  HELMET: 'helmet',
  BOOTS: 'boots'
};

// 套装定义
export const SET_BONUSES = {
  'forest_guard': {
    name: '森林守卫',
    pieces: ['vine_bow', 'leaf_armor', 'nature_ring'],
    bonuses: {
      2: { atk: 5, def: 3, name: '森林之力' },
      3: { atk: 10, def: 8, spd: 1.5, name: '自然之怒' }
    }
  },
  'inferno': {
    name: '烈焰套装',
    pieces: ['fire_blade', 'magic_robe', 'fire_ring'],
    bonuses: {
      2: { atk: 12, name: '烈焰之心' },
      3: { atk: 25, mp: 30, name: '火山爆发' }
    }
  },
  'dragon': {
    name: '龙族套装',
    pieces: ['dragon_slayer', 'dragon_scale', 'legendary_ring'],
    bonuses: {
      2: { atk: 15, def: 10, name: '龙威' },
      3: { atk: 35, def: 25, spd: 2, name: '龙神降世' }
    }
  }
};

/**
 * 装备定义（扩展）
 */
export const EQUIPMENT_DB = {
  // 武器
  'wooden_sword': {
    id: 'wooden_sword', name: '木剑', type: EQUIP_TYPE.WEAPON,
    rarity: RARITY.COMMON, atk: 3, icon: '🗡️', desc: '新手训练用剑'
  },
  'iron_sword': {
    id: 'iron_sword', name: '铁剑', type: EQUIP_TYPE.WEAPON,
    rarity: RARITY.RARE, atk: 8, icon: '⚔️', desc: '可靠的铁制长剑'
  },
  'fire_blade': {
    id: 'fire_blade', name: '烈焰之刃', type: EQUIP_TYPE.WEAPON,
    rarity: RARITY.EPIC, atk: 18, icon: '🔥', desc: '燃烧着永不熄灭的火焰'
  },
  'dragon_slayer': {
    id: 'dragon_slayer', name: '屠龙者', type: EQUIP_TYPE.WEAPON,
    rarity: RARITY.LEGENDARY, atk: 35, icon: '⚡', desc: '传说中的屠龙巨剑'
  },
  'vine_bow': {
    id: 'vine_bow', name: '藤蔓之弓', type: EQUIP_TYPE.WEAPON,
    rarity: RARITY.RARE, atk: 10, icon: '🏹', desc: '由古老藤蔓制成的弓'
  },
  'crystal_staff': {
    id: 'crystal_staff', name: '水晶法杖', type: EQUIP_TYPE.WEAPON,
    rarity: RARITY.EPIC, atk: 22, icon: '🔮', desc: '蕴含魔法的水晶法杖'
  },
  'thunder_edge': {
    id: 'thunder_edge', name: '雷光刃', type: EQUIP_TYPE.WEAPON,
    rarity: RARITY.LEGENDARY, atk: 40, icon: '🌩️', desc: '召唤雷电的神兵'
  },
  
  // 头盔
  'leather_cap': {
    id: 'leather_cap', name: '皮帽', type: EQUIP_TYPE.HELMET,
    rarity: RARITY.COMMON, def: 1, icon: '🎩', desc: '简单的皮制帽子'
  },
  'iron_helmet': {
    id: 'iron_helmet', name: '铁盔', type: EQUIP_TYPE.HELMET,
    rarity: RARITY.RARE, def: 4, icon: '⛑️', desc: '保护头部的铁盔'
  },
  'crown': {
    id: 'crown', name: '王者之冠', type: EQUIP_TYPE.HELMET,
    rarity: RARITY.LEGENDARY, def: 12, atk: 5, icon: '👑', desc: '象征王权的宝冠'
  },
  
  // 铠甲
  'leather_armor': {
    id: 'leather_armor', name: '皮甲', type: EQUIP_TYPE.ARMOR,
    rarity: RARITY.COMMON, def: 2, icon: '👕', desc: '轻便的皮制护甲'
  },
  'chain_mail': {
    id: 'chain_mail', name: '锁子甲', type: EQUIP_TYPE.ARMOR,
    rarity: RARITY.RARE, def: 6, icon: '🛡️', desc: '金属环连接而成的铠甲'
  },
  'magic_robe': {
    id: 'magic_robe', name: '魔法长袍', type: EQUIP_TYPE.ARMOR,
    rarity: RARITY.EPIC, def: 12, icon: '👘', desc: '附魔的法师长袍'
  },
  'dragon_scale': {
    id: 'dragon_scale', name: '龙鳞战甲', type: EQUIP_TYPE.ARMOR,
    rarity: RARITY.LEGENDARY, def: 25, icon: '🐉', desc: '用龙鳞打造的铠甲'
  },
  'leaf_armor': {
    id: 'leaf_armor', name: '叶织护甲', type: EQUIP_TYPE.ARMOR,
    rarity: RARITY.RARE, def: 8, icon: '🍃', desc: '由树叶编织的自然护甲'
  },
  
  // 戒指
  'copper_ring': {
    id: 'copper_ring', name: '铜戒指', type: EQUIP_TYPE.RING,
    rarity: RARITY.COMMON, atk: 1, def: 1, icon: '💍', desc: '简单的铜戒指'
  },
  'silver_ring': {
    id: 'silver_ring', name: '银戒指', type: EQUIP_TYPE.RING,
    rarity: RARITY.RARE, atk: 3, def: 3, icon: '💍', desc: '精致的银戒指'
  },
  'power_ring': {
    id: 'power_ring', name: '力量戒指', type: EQUIP_TYPE.RING,
    rarity: RARITY.EPIC, atk: 8, def: 4, icon: '💍', desc: '蕴含力量的戒指'
  },
  'legendary_ring': {
    id: 'legendary_ring', name: '王者之戒', type: EQUIP_TYPE.RING,
    rarity: RARITY.LEGENDARY, atk: 15, def: 10, icon: '👑', desc: '传说级的王者戒指'
  },
  'nature_ring': {
    id: 'nature_ring', name: '自然之戒', type: EQUIP_TYPE.RING,
    rarity: RARITY.RARE, atk: 4, def: 6, icon: '💍', desc: '与自然共鸣的戒指'
  },
  'fire_ring': {
    id: 'fire_ring', name: '烈焰之戒', type: EQUIP_TYPE.RING,
    rarity: RARITY.EPIC, atk: 12, def: 5, icon: '💍', desc: '燃烧着火焰的戒指'
  },
  
  // 靴子
  'sandals': {
    id: 'sandals', name: '草鞋', type: EQUIP_TYPE.BOOTS,
    rarity: RARITY.COMMON, def: 1, icon: '👡', desc: '简单的草鞋'
  },
  'leather_boots': {
    id: 'leather_boots', name: '皮靴', type: EQUIP_TYPE.BOOTS,
    rarity: RARITY.RARE, def: 3, spd: 0.5, icon: '👢', desc: '轻便的皮靴'
  },
  'wind_boots': {
    id: 'wind_boots', name: '疾风之靴', type: EQUIP_TYPE.BOOTS,
    rarity: RARITY.EPIC, def: 6, spd: 1.5, icon: '👟', desc: '速度如风的靴子'
  },
  'dragon_boots': {
    id: 'dragon_boots', name: '龙行靴', type: EQUIP_TYPE.BOOTS,
    rarity: RARITY.LEGENDARY, def: 10, spd: 2.5, icon: '👞', desc: '龙族战士的靴子'
  }
};

/**
 * 消耗品定义
 */
export const CONSUMABLES = {
  'health_potion': { id: 'health_potion', name: '生命药水', icon: '❤️', effect: 'heal', value: 30, desc: '回复30% HP' },
  'mana_potion': { id: 'mana_potion', name: '魔法药水', icon: '💙', effect: 'mana', value: 20, desc: '回复20% MP' },
  'super_potion': { id: 'super_potion', name: '超级药水', icon: '🌟', effect: 'heal', value: 100, desc: '完全回复HP' }
};

/**
 * 掉落表（扩展）
 */
const DROP_TABLES = {
  'slime': [
    { item: 'gold', chance: 0.8, min: 5, max: 15 },
    { item: 'health_potion', chance: 0.15 },
    { item: 'copper_ring', chance: 0.05 }
  ],
  'goblin': [
    { item: 'gold', chance: 0.9, min: 10, max: 25 },
    { item: 'health_potion', chance: 0.2 },
    { item: 'leather_armor', chance: 0.08 },
    { item: 'iron_sword', chance: 0.05 }
  ],
  'skeleton': [
    { item: 'gold', chance: 0.85, min: 15, max: 30 },
    { item: 'mana_potion', chance: 0.15 },
    { item: 'chain_mail', chance: 0.1 },
    { item: 'iron_helmet', chance: 0.08 }
  ],
  'crystal_golem': [
    { item: 'gold', chance: 1.0, min: 50, max: 100 },
    { item: 'magic_robe', chance: 0.3 },
    { item: 'power_ring', chance: 0.2 },
    { item: 'crystal_staff', chance: 0.15 }
  ],
  'fire_dragon': [
    { item: 'gold', chance: 1.0, min: 200, max: 500 },
    { item: 'dragon_slayer', chance: 0.5 },
    { item: 'dragon_scale', chance: 0.4 },
    { item: 'legendary_ring', chance: 0.3 },
    { item: 'crown', chance: 0.2 },
    { item: 'super_potion', chance: 0.5 }
  ]
};

/**
 * 根据敌人类型生成掉落
 */
export function generateDrop(enemyType) {
  const drops = [];
  const table = DROP_TABLES[enemyType] || DROP_TABLES['slime'];
  
  for (const entry of table) {
    if (Math.random() < entry.chance) {
      if (entry.item === 'gold') {
        const amount = Math.floor(entry.min + Math.random() * (entry.max - entry.min));
        drops.push({ type: 'gold', amount });
      } else if (CONSUMABLES[entry.item]) {
        drops.push({ type: 'consumable', item: CONSUMABLES[entry.item] });
      } else if (EQUIPMENT_DB[entry.item]) {
        drops.push({ type: 'equipment', item: EQUIPMENT_DB[entry.item] });
      }
    }
  }
  
  return drops;
}

/**
 * 随机生成一件装备（用于宝箱等）
 */
export function randomEquip() {
  const entries = Object.values(EQUIPMENT_DB);
  const roll = Math.random();
  let rarity;
  
  if (roll < 0.01) rarity = RARITY.LEGENDARY;
  else if (roll < 0.05) rarity = RARITY.EPIC;
  else if (roll < 0.2) rarity = RARITY.RARE;
  else rarity = RARITY.COMMON;
  
  const candidates = entries.filter(e => e.rarity === rarity);
  if (candidates.length === 0) {
    return entries[Math.floor(Math.random() * entries.length)];
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * 计算套装激活数量
 */
export function getActiveSetCount(player) {
  const equipped = Object.values(player.equipment).filter(e => e !== null).map(e => e.id);
  const setCounts = {};
  
  for (const setId of Object.keys(SET_BONUSES)) {
    const set = SET_BONUSES[setId];
    const count = set.pieces.filter(pieceId => equipped.includes(pieceId)).length;
    setCounts[setId] = count;
  }
  
  return setCounts;
}

/**
 * 应用套装属性加成
 */
export function applySetBonuses(player) {
  const setCounts = getActiveSetCount(player);
  let bonusAtk = 0, bonusDef = 0, bonusSpd = 0;
  
  for (const [setId, count] of Object.entries(setCounts)) {
    const set = SET_BONUSES[setId];
    if (!set || count < 2) continue;
    
    // 找到激活的最高级奖励
    let activeBonus = null;
    for (const [pieceCount, bonus] of Object.entries(set.bonuses)) {
      if (count >= parseInt(pieceCount)) {
        activeBonus = bonus;
      }
    }
    
    if (activeBonus) {
      bonusAtk += activeBonus.atk || 0;
      bonusDef += activeBonus.def || 0;
      bonusSpd += activeBonus.spd || 0;
    }
  }
  
  return { atk: bonusAtk, def: bonusDef, spd: bonusSpd };
}

export default { RARITY, EQUIP_TYPE, EQUIPMENT_DB, CONSUMABLES, SET_BONUSES, generateDrop, randomEquip, getActiveSetCount, applySetBonuses };

