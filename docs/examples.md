---
layout: default
title: 游戏示例
nav_order: 3
description: "真实游戏项目中的 Schema 使用场景"
---

# 🎮 游戏示例
{: .fs-9 }

看看 Schema 在各种游戏类型中的实际应用
{: .fs-6 .fw-300 }

---

## 🃏 卡牌游戏：《炉石传说》风格

### 卡牌数据配置

<div class="code-example">
<h3>卡牌模式定义</h3>

```typescript
import { Schema, Fields } from '@khgame/schema';

const CardSchema = Schema.define({
  id: Fields.number().required(),
  name: Fields.string().required(),
  
  // 基础属性
  cost: Fields.number().min(0).max(10),
  attack: Fields.number().min(0).optional(),
  health: Fields.number().min(1).optional(),
  
  // 卡牌类型
  cardType: Fields.enum(['minion', 'spell', 'weapon']),
  rarity: Fields.enum(['common', 'rare', 'epic', 'legendary']),
  cardClass: Fields.enum(['neutral', 'warrior', 'mage', 'priest', 'rogue', 'paladin']),
  
  // 种族和机制
  race: Fields.enum(['none', 'beast', 'dragon', 'elemental', 'mech', 'murloc']).default('none'),
  mechanics: Fields.array(Fields.enum([
    'taunt', 'charge', 'windfury', 'divine_shield', 'stealth', 
    'battlecry', 'deathrattle', 'spell_damage', 'lifesteal'
  ])).default([]),
  
  // 效果描述
  description: Fields.string(),
  flavorText: Fields.string().optional(),
  
  // 收集信息
  collectible: Fields.boolean().default(true),
  set: Fields.string().required(),
  
  // 平衡相关
  nerfHistory: Fields.array(Schema.define({
    version: Fields.string(),
    changes: Fields.string(),
    reason: Fields.string()
  })).default([])
});

// 特殊验证：随从卡必须有攻击力和生命值
const ValidatedCardSchema = CardSchema.extend({
  attack: Fields.number().when('cardType', {
    is: 'minion',
    then: Fields.number().min(0).required(),
    otherwise: Fields.number().optional()
  }),
  health: Fields.number().when('cardType', {
    is: 'minion', 
    then: Fields.number().min(1).required(),
    otherwise: Fields.number().optional()
  })
});
```

<h3>实际卡牌数据</h3>

```typescript
const hearthstoneCards = [
  {
    id: 1001,
    name: "烈焰风暴",
    cost: 7,
    cardType: "spell",
    rarity: "epic", 
    cardClass: "mage",
    description: "对所有敌方随从造成4点伤害",
    flavorText: "法师的终极清场法术",
    set: "classic",
    mechanics: []
  },
  {
    id: 1002,
    name: "银色侍卫",
    cost: 1,
    attack: 1,
    health: 1,
    cardType: "minion",
    rarity: "common",
    cardClass: "neutral",
    race: "none",
    mechanics: ["divine_shield"],
    description: "圣盾",
    set: "classic"
  },
  {
    id: 1003,
    name: "暗影烈焰",
    cost: 4,
    cardType: "spell", 
    rarity: "rare",
    cardClass: "warlock",
    description: "摧毁一个友方随从，对所有敌方随从造成等同于其攻击力的伤害",
    set: "classic",
    nerfHistory: [
      {
        version: "1.2.0",
        changes: "法力消耗从3增加到4",
        reason: "在竞技模式中过于强势"
      }
    ]
  }
];

// 验证所有卡牌数据
const validCards = ValidatedCardSchema.parseArray(hearthstoneCards);
console.log(`成功加载 ${validCards.length} 张卡牌`);
```

</div>

### 套牌配置系统

<div class="code-example">
<h3>套牌构建</h3>

```typescript
const DeckSchema = Schema.define({
  id: Fields.number().required(),
  name: Fields.string().required(),
  heroClass: Fields.enum(['warrior', 'mage', 'priest', 'rogue', 'paladin']),
  format: Fields.enum(['standard', 'wild', 'classic']),
  
  cards: Fields.array(Schema.define({
    cardId: Fields.number(),
    count: Fields.number().min(1).max(2), // 最多2张同名卡
  })).length(30), // 套牌必须30张卡
  
  // 元数据
  archetype: Fields.enum(['aggro', 'midrange', 'control', 'combo']),
  winRate: Fields.number().min(0).max(1).optional(),
  popularity: Fields.number().min(0).max(1).optional(),
  
  creator: Fields.string(),
  createdAt: Fields.date(),
  tags: Fields.array(Fields.string()).default([])
});

// 自定义验证：检查套牌合法性
const ValidatedDeckSchema = DeckSchema.validate((deck) => {
  const totalCards = deck.cards.reduce((sum, card) => sum + card.count, 0);
  if (totalCards !== 30) {
    throw new Error(`套牌必须包含30张卡，当前${totalCards}张`);
  }
  
  // 检查传说卡数量限制
  const legendaryCards = deck.cards.filter(card => {
    const cardData = getCardById(card.cardId);
    return cardData.rarity === 'legendary' && card.count > 1;
  });
  
  if (legendaryCards.length > 0) {
    throw new Error('传说卡牌最多只能放入1张');
  }
});
```

</div>

---

## ⚔️ MMORPG：《魔兽世界》风格

### 角色和职业系统

<div class="code-example">
<h3>角色属性系统</h3>

```typescript
const CharacterSchema = Schema.define({
  id: Fields.number().required(),
  name: Fields.string().min(2).max(16),
  
  // 基础信息
  race: Fields.enum(['human', 'orc', 'elf', 'dwarf', 'undead', 'tauren']),
  class: Fields.enum(['warrior', 'mage', 'priest', 'rogue', 'hunter', 'paladin']),
  level: Fields.number().min(1).max(80),
  experience: Fields.number().min(0),
  
  // 核心属性
  attributes: Schema.define({
    strength: Fields.number().min(1),
    agility: Fields.number().min(1),
    intellect: Fields.number().min(1),
    stamina: Fields.number().min(1),
    spirit: Fields.number().min(1)
  }),
  
  // 战斗属性（由核心属性计算得出）
  combatStats: Schema.define({
    health: Fields.number().min(1),
    mana: Fields.number().min(0),
    attackPower: Fields.number().min(0),
    spellPower: Fields.number().min(0),
    armor: Fields.number().min(0),
    dodge: Fields.number().min(0).max(1),
    critChance: Fields.number().min(0).max(1)
  }),
  
  // 技能点分配
  talents: Schema.define({
    tree1: Fields.array(Schema.define({
      talentId: Fields.number(),
      points: Fields.number().min(0).max(5)
    })),
    tree2: Fields.array(Schema.define({
      talentId: Fields.number(), 
      points: Fields.number().min(0).max(5)
    })),
    tree3: Fields.array(Schema.define({
      talentId: Fields.number(),
      points: Fields.number().min(0).max(5)
    }))
  }),
  
  // 装备槽位
  equipment: Schema.define({
    head: Fields.number().optional(),
    neck: Fields.number().optional(), 
    shoulders: Fields.number().optional(),
    chest: Fields.number().optional(),
    waist: Fields.number().optional(),
    legs: Fields.number().optional(),
    feet: Fields.number().optional(),
    wrists: Fields.number().optional(),
    hands: Fields.number().optional(),
    finger1: Fields.number().optional(),
    finger2: Fields.number().optional(),
    trinket1: Fields.number().optional(),
    trinket2: Fields.number().optional(),
    mainHand: Fields.number().optional(),
    offHand: Fields.number().optional(),
    ranged: Fields.number().optional()
  }),
  
  // 进度记录
  progression: Schema.define({
    dungeonsCompleted: Fields.array(Fields.number()).default([]),
    raidsCompleted: Fields.array(Fields.number()).default([]),
    achievementsUnlocked: Fields.array(Fields.number()).default([]),
    questsCompleted: Fields.array(Fields.number()).default([])
  })
});
```

<h3>装备系统</h3>

```typescript
const EquipmentSchema = Schema.define({
  id: Fields.number().required(),
  name: Fields.string().required(),
  
  // 装备基础信息
  slot: Fields.enum([
    'head', 'neck', 'shoulders', 'chest', 'waist', 'legs', 
    'feet', 'wrists', 'hands', 'finger', 'trinket', 
    'mainHand', 'offHand', 'ranged'
  ]),
  
  type: Fields.enum([
    'cloth', 'leather', 'mail', 'plate', 'sword', 'axe', 
    'mace', 'dagger', 'bow', 'staff', 'wand', 'shield'
  ]),
  
  // 品质和等级
  quality: Fields.enum(['poor', 'common', 'uncommon', 'rare', 'epic', 'legendary']),
  itemLevel: Fields.number().min(1).max(284),
  requiredLevel: Fields.number().min(1).max(80),
  
  // 属性加成
  stats: Schema.define({
    strength: Fields.number().default(0),
    agility: Fields.number().default(0), 
    intellect: Fields.number().default(0),
    stamina: Fields.number().default(0),
    spirit: Fields.number().default(0),
    
    // 战斗属性
    attackPower: Fields.number().default(0),
    spellPower: Fields.number().default(0),
    armor: Fields.number().default(0),
    
    // 特殊属性
    critRating: Fields.number().default(0),
    hasteRating: Fields.number().default(0),
    hitRating: Fields.number().default(0),
    expertiseRating: Fields.number().default(0)
  }),
  
  // 宝石插槽
  sockets: Fields.array(Schema.define({
    color: Fields.enum(['red', 'yellow', 'blue', 'meta']),
    gemId: Fields.number().optional()
  })).default([]),
  
  // 附魔
  enchantment: Schema.define({
    enchantId: Fields.number(),
    stats: Schema.define({
      // 附魔提供的属性加成
    })
  }).optional(),
  
  // 装备限制
  restrictions: Schema.define({
    classes: Fields.array(Fields.string()).default([]),
    races: Fields.array(Fields.string()).default([]),
    reputation: Schema.define({
      faction: Fields.string(),
      level: Fields.enum(['neutral', 'friendly', 'honored', 'revered', 'exalted'])
    }).optional()
  }),
  
  // 掉落信息
  dropInfo: Schema.define({
    sources: Fields.array(Schema.define({
      type: Fields.enum(['dungeon', 'raid', 'quest', 'vendor', 'craft']),
      sourceId: Fields.number(),
      dropRate: Fields.number().min(0).max(1),
      difficulty: Fields.enum(['normal', 'heroic']).optional()
    }))
  })
});
```

</div>

### 副本和Boss配置

<div class="code-example">
<h3>副本配置</h3>

```typescript
const DungeonSchema = Schema.define({
  id: Fields.number().required(),
  name: Fields.string().required(),
  
  // 副本信息
  type: Fields.enum(['dungeon', 'raid']),
  difficulty: Fields.enum(['normal', 'heroic', 'mythic']),
  minLevel: Fields.number().min(1).max(80),
  maxPlayers: Fields.number().min(1).max(40),
  
  // 地图和路径
  map: Schema.define({
    zones: Fields.array(Schema.define({
      id: Fields.number(),
      name: Fields.string(),
      coordinates: Schema.define({
        x: Fields.number(),
        y: Fields.number(),
        z: Fields.number()
      }),
      encounterIds: Fields.array(Fields.number())
    })),
    paths: Fields.array(Schema.define({
      from: Fields.number(),
      to: Fields.number(),
      requirements: Fields.array(Fields.string()).default([])
    }))
  }),
  
  // Boss战配置
  encounters: Fields.array(Schema.define({
    id: Fields.number(),
    name: Fields.string(),
    type: Fields.enum(['boss', 'miniboss', 'trash']),
    
    // Boss属性
    stats: Schema.define({
      health: Fields.number().min(1),
      armor: Fields.number().min(0),
      resistances: Schema.define({
        fire: Fields.number().default(0),
        frost: Fields.number().default(0),
        nature: Fields.number().default(0),
        shadow: Fields.number().default(0),
        arcane: Fields.number().default(0)
      })
    }),
    
    // 技能轮换
    abilities: Fields.array(Schema.define({
      id: Fields.number(),
      name: Fields.string(),
      cooldown: Fields.number().min(0),
      castTime: Fields.number().min(0),
      damage: Fields.number().min(0),
      effects: Fields.array(Fields.string()),
      priority: Fields.number().min(1).max(10)
    })),
    
    // 阶段转换
    phases: Fields.array(Schema.define({
      healthThreshold: Fields.number().min(0).max(1),
      abilities: Fields.array(Fields.number()),
      specialMechanics: Fields.array(Fields.string())
    })),
    
    // 掉落战利品
    lootTable: Schema.define({
      guaranteedItems: Fields.array(Fields.number()).default([]),
      rareItems: Fields.array(Schema.define({
        itemId: Fields.number(),
        dropRate: Fields.number().min(0).max(1)
      })).default([]),
      currencyRewards: Schema.define({
        gold: Fields.number().default(0),
        tokens: Fields.number().default(0)
      })
    })
  }))
});
```

</div>

---

## 🏰 策略游戏：《帝国时代》风格

### 建筑和科技树

<div class="code-example">
<h3>建筑系统</h3>

```typescript
const BuildingSchema = Schema.define({
  id: Fields.number().required(),
  name: Fields.string().required(),
  
  // 建筑类型
  category: Fields.enum([
    'military', 'economic', 'defensive', 'research', 'wonder'
  ]),
  
  // 建造成本
  cost: Schema.define({
    wood: Fields.number().min(0).default(0),
    food: Fields.number().min(0).default(0),
    gold: Fields.number().min(0).default(0),
    stone: Fields.number().min(0).default(0)
  }),
  
  // 建造时间和人口
  buildTime: Fields.number().min(1), // 秒
  populationCost: Fields.number().min(0).default(0),
  populationProvided: Fields.number().min(0).default(0),
  
  // 建筑属性
  hitPoints: Fields.number().min(1),
  armor: Schema.define({
    melee: Fields.number().default(0),
    pierce: Fields.number().default(0)
  }),
  
  // 攻击能力（如果有）
  attack: Schema.define({
    damage: Fields.number().min(0).default(0),
    range: Fields.number().min(0).default(0),
    rateOfFire: Fields.number().min(0).default(0),
    damageType: Fields.enum(['melee', 'pierce', 'siege']).optional()
  }).optional(),
  
  // 生产能力
  trainable: Fields.array(Fields.number()).default([]), // 可训练的单位ID
  researchable: Fields.array(Fields.number()).default([]), // 可研究的科技ID
  
  // 特殊能力
  specialAbilities: Fields.array(Schema.define({
    type: Fields.enum(['garrison', 'heal', 'convert', 'trade']),
    capacity: Fields.number().optional(),
    rate: Fields.number().optional(),
    range: Fields.number().optional()
  })).default([]),
  
  // 建造条件
  requirements: Schema.define({
    age: Fields.enum(['dark', 'feudal', 'castle', 'imperial']),
    prerequisiteBuildings: Fields.array(Fields.number()).default([]),
    prerequisiteTechs: Fields.array(Fields.number()).default([])
  }),
  
  // 文明特殊性
  civilizationBonuses: Fields.array(Schema.define({
    civilizationId: Fields.number(),
    bonusType: Fields.enum(['cost_reduction', 'stat_bonus', 'special_ability']),
    value: Fields.number(),
    description: Fields.string()
  })).default([])
});
```

<h3>科技树系统</h3>

```typescript
const TechnologySchema = Schema.define({
  id: Fields.number().required(),
  name: Fields.string().required(),
  
  // 科技分类
  category: Fields.enum([
    'military', 'economic', 'defensive', 'unique', 'age_advance'
  ]),
  
  // 研究成本
  cost: Schema.define({
    wood: Fields.number().min(0).default(0),
    food: Fields.number().min(0).default(0), 
    gold: Fields.number().min(0).default(0),
    stone: Fields.number().min(0).default(0)
  }),
  
  researchTime: Fields.number().min(1), // 秒
  
  // 效果类型
  effects: Fields.array(Schema.define({
    targetType: Fields.enum(['unit', 'building', 'resource', 'global']),
    targetIds: Fields.array(Fields.number()).default([]), // 空数组表示影响所有同类型
    
    effectType: Fields.enum([
      'stat_increase', 'stat_multiply', 'cost_reduction', 
      'new_ability', 'upgrade_unit', 'unlock_building'
    ]),
    
    // 具体效果
    statModifications: Schema.define({
      hitPoints: Fields.number().default(0),
      attack: Fields.number().default(0),
      armor: Fields.number().default(0),
      speed: Fields.number().default(0),
      range: Fields.number().default(0),
      accuracy: Fields.number().default(0)
    }).optional(),
    
    // 百分比加成
    multipliers: Schema.define({
      hitPoints: Fields.number().min(0).default(1),
      attack: Fields.number().min(0).default(1),
      workRate: Fields.number().min(0).default(1)
    }).optional(),
    
    newAbilities: Fields.array(Fields.string()).default([]),
    unlockedUnits: Fields.array(Fields.number()).default([]),
    unlockedBuildings: Fields.array(Fields.number()).default([])
  })),
  
  // 研究条件
  requirements: Schema.define({
    age: Fields.enum(['dark', 'feudal', 'castle', 'imperial']),
    prerequisiteTechs: Fields.array(Fields.number()).default([]),
    requiredBuilding: Fields.number(),
    civilizationRestrictions: Fields.array(Fields.number()).default([])
  }),
  
  // 描述
  description: Fields.string(),
  flavorText: Fields.string().optional()
});
```

<h3>单位配置</h3>

```typescript
const UnitSchema = Schema.define({
  id: Fields.number().required(),
  name: Fields.string().required(),
  
  // 单位分类
  type: Fields.enum([
    'infantry', 'archer', 'cavalry', 'siege', 'naval', 'monk', 'villager'
  ]),
  
  // 训练成本
  cost: Schema.define({
    wood: Fields.number().min(0).default(0),
    food: Fields.number().min(0).default(0),
    gold: Fields.number().min(0).default(0)
  }),
  
  trainTime: Fields.number().min(1), // 秒
  populationCost: Fields.number().min(1),
  
  // 战斗属性
  hitPoints: Fields.number().min(1),
  attack: Fields.number().min(0),
  armor: Schema.define({
    melee: Fields.number().default(0),
    pierce: Fields.number().default(0)
  }),
  
  // 移动和攻击
  speed: Fields.number().min(0),
  range: Fields.number().min(0),
  rateOfFire: Fields.number().min(0),
  accuracy: Fields.number().min(0).max(1),
  
  // 伤害类型和护甲类型
  damageType: Fields.enum(['melee', 'pierce', 'siege']),
  armorClass: Fields.array(Fields.enum([
    'infantry', 'archer', 'cavalry', 'siege', 'building', 'ship'
  ])),
  
  // 特殊攻击加成
  attackBonuses: Fields.array(Schema.define({
    targetArmorClass: Fields.string(),
    bonusDamage: Fields.number()
  })).default([]),
  
  // 特殊能力
  abilities: Fields.array(Schema.define({
    type: Fields.enum(['heal', 'convert', 'build', 'gather', 'transport']),
    value: Fields.number().optional(),
    range: Fields.number().optional(),
    resourceTypes: Fields.array(Fields.string()).default([])
  })).default([]),
  
  // 升级路径
  upgrades: Fields.array(Schema.define({
    technologyId: Fields.number(),
    resultUnitId: Fields.number().optional() // 如果升级会变成新单位
  })).default([]),
  
  // 训练条件
  requirements: Schema.define({
    age: Fields.enum(['dark', 'feudal', 'castle', 'imperial']),
    building: Fields.number(),
    prerequisiteTechs: Fields.array(Fields.number()).default([])
  })
});
```

</div>

---

## 🎯 Roguelike：《以撒的结合》风格

### 道具系统

<div class="code-example">
<h3>道具配置</h3>

```typescript
const ItemSchema = Schema.define({
  id: Fields.number().required(),
  name: Fields.string().required(),
  
  // 道具分类
  type: Fields.enum([
    'active', 'passive', 'trinket', 'pickup', 'familiar'
  ]),
  
  rarity: Fields.enum(['common', 'uncommon', 'rare', 'special', 'secret']),
  
  // 房间池分配
  pools: Fields.array(Fields.enum([
    'treasure', 'shop', 'boss', 'devil', 'angel', 'secret', 
    'library', 'curse', 'red_chest', 'beggar'
  ])),
  
  // 基础属性修改
  statsModifier: Schema.define({
    health: Fields.number().default(0),
    damage: Fields.number().default(0),
    tears: Fields.number().default(0), // 射速
    range: Fields.number().default(0),
    shotSpeed: Fields.number().default(0),
    luck: Fields.number().default(0)
  }).optional(),
  
  // 百分比修改
  multipliers: Schema.define({
    damage: Fields.number().min(0).default(1),
    tears: Fields.number().min(0).default(1),
    range: Fields.number().min(0).default(1)
  }).optional(),
  
  // 特殊效果
  effects: Fields.array(Schema.define({
    type: Fields.enum([
      'tear_effect', 'on_hit', 'on_kill', 'room_clear', 
      'damage_taken', 'item_pickup', 'floor_generation'
    ]),
    
    // 触发条件
    trigger: Schema.define({
      chance: Fields.number().min(0).max(1).default(1),
      cooldown: Fields.number().min(0).default(0),
      charges: Fields.number().min(0).optional()
    }).optional(),
    
    // 效果参数
    parameters: Schema.define({
      damage: Fields.number().optional(),
      statusEffect: Fields.string().optional(),
      duration: Fields.number().optional(),
      projectileCount: Fields.number().optional(),
      knockback: Fields.number().optional()
    }).optional()
  })).default([]),
  
  // 视觉效果
  appearance: Schema.define({
    sprite: Fields.string(),
    tearColor: Fields.string().optional(),
    tearShape: Fields.enum(['normal', 'blood', 'laser', 'ring']).optional(),
    aura: Fields.string().optional()
  }),
  
  // 获取条件
  unlockCondition: Schema.define({
    type: Fields.enum(['achievement', 'donation', 'win_streak', 'challenge']),
    requirement: Fields.string()
  }).optional(),
  
  // 物品组合
  synergies: Fields.array(Schema.define({
    withItemId: Fields.number(),
    effect: Fields.string(),
    priority: Fields.number().default(1)
  })).default([]),
  
  // 互斥物品
  conflicts: Fields.array(Fields.number()).default([]),
  
  description: Fields.string(),
  quote: Fields.string().optional()
});
```

<h3>房间生成配置</h3>

```typescript
const RoomSchema = Schema.define({
  id: Fields.number().required(),
  name: Fields.string().required(),
  
  // 房间类型
  type: Fields.enum([
    'normal', 'treasure', 'shop', 'boss', 'secret', 'super_secret',
    'sacrifice', 'devil', 'angel', 'error', 'library', 'planetarium'
  ]),
  
  // 房间尺寸
  size: Schema.define({
    width: Fields.number().min(1).max(4),
    height: Fields.number().min(1).max(4),
    shape: Fields.enum(['rectangle', 'L_shape', 'cross', 'irregular'])
  }),
  
  // 门的配置
  doors: Schema.define({
    north: Fields.boolean().default(false),
    south: Fields.boolean().default(false),
    east: Fields.boolean().default(false),
    west: Fields.boolean().default(false)
  }),
  
  // 房间布局
  layout: Schema.define({
    obstacles: Fields.array(Schema.define({
      type: Fields.enum(['rock', 'pit', 'spikes', 'fire', 'poop']),
      position: Schema.define({
        x: Fields.number(),
        y: Fields.number()
      }),
      destructible: Fields.boolean().default(true)
    })).default([]),
    
    pickups: Fields.array(Schema.define({
      type: Fields.enum(['coin', 'bomb', 'key', 'heart', 'pill', 'card']),
      position: Schema.define({
        x: Fields.number(),
        y: Fields.number()
      }),
      value: Fields.number().default(1)
    })).default([])
  }),
  
  // 敌人配置
  enemies: Fields.array(Schema.define({
    enemyId: Fields.number(),
    position: Schema.define({
      x: Fields.number(),
      y: Fields.number()
    }),
    variant: Fields.number().default(0),
    subType: Fields.number().default(0)
  })).default([]),
  
  // 生成权重
  weight: Fields.number().min(0).default(1),
  
  // 生成条件
  spawnConditions: Schema.define({
    minFloor: Fields.number().min(1).default(1),
    maxFloor: Fields.number().max(999).default(999),
    requiredItems: Fields.array(Fields.number()).default([]),
    forbiddenItems: Fields.array(Fields.number()).default([]),
    playerStats: Schema.define({
      minDamage: Fields.number().optional(),
      maxDamage: Fields.number().optional(),
      minHealth: Fields.number().optional()
    }).optional()
  }),
  
  // 特殊机制
  mechanics: Fields.array(Schema.define({
    type: Fields.enum([
      'curse_room', 'blood_donation', 'slot_machine', 
      'begging', 'sacrifice', 'demon_beggar'
    ]),
    cost: Fields.number().default(1),
    rewards: Fields.array(Fields.string())
  })).default([])
});
```

</div>

---

## 📊 平衡性分析工具

<div class="code-example">
<h3>自动平衡性检测</h3>

```typescript
// 为所有游戏类型提供平衡性分析
const BalanceAnalyzer = {
  // 卡牌游戏平衡性
  analyzeCard(card: Card): BalanceReport {
    const stats = {
      costEfficiency: card.attack + card.health / card.cost,
      powerLevel: calculatePowerLevel(card),
      synergies: findSynergies(card),
      counters: findCounters(card)
    };
    
    return {
      overall: stats.powerLevel > 8 ? 'overpowered' : 
               stats.powerLevel < 4 ? 'underpowered' : 'balanced',
      details: stats,
      suggestions: generateBalanceSuggestions(stats)
    };
  },
  
  // MMORPG装备平衡性
  analyzeEquipment(equipment: Equipment): BalanceReport {
    const itemBudget = calculateItemBudget(equipment.itemLevel);
    const actualValue = calculateStatValue(equipment.stats);
    
    return {
      budgetUsage: actualValue / itemBudget,
      itemizedStats: Object.entries(equipment.stats)
        .filter(([_, value]) => value > 0)
        .map(([stat, value]) => ({
          stat,
          value,
          efficiency: calculateStatEfficiency(stat, value, equipment.itemLevel)
        }))
    };
  },
  
  // 策略游戏单位平衡性
  analyzeUnit(unit: Unit): BalanceReport {
    const costEffectiveness = {
      combat: unit.attack * unit.hitPoints / getTotalCost(unit.cost),
      economic: unit.workRate / getTotalCost(unit.cost),
      utility: calculateUtilityValue(unit.abilities) / getTotalCost(unit.cost)
    };
    
    return {
      role: determineUnitRole(unit),
      effectiveness: costEffectiveness,
      comparison: compareWithSimilarUnits(unit),
      metaPosition: calculateMetaPosition(unit)
    };
  }
};

// 批量分析和报告生成
function generateBalanceReport(gameData: any[], dataType: string) {
  const analyses = gameData.map(item => 
    BalanceAnalyzer[`analyze${dataType}`](item)
  );
  
  return {
    summary: {
      total: analyses.length,
      balanced: analyses.filter(a => a.overall === 'balanced').length,
      overpowered: analyses.filter(a => a.overall === 'overpowered').length,
      underpowered: analyses.filter(a => a.overall === 'underpowered').length
    },
    detailed: analyses,
    recommendations: generateGlobalRecommendations(analyses)
  };
}
```

</div>

---

## 🎉 社区贡献

<div class="callout">
<strong>🌟 分享你的游戏配置</strong><br>
我们欢迎社区贡献更多游戏类型的配置示例！请在 GitHub 上提交你的游戏项目案例。
</div>

### 热门社区示例

- **🎪 塔防游戏**：防御塔、敌人波次、升级路径配置
- **🏁 赛车游戏**：车辆属性、赛道设计、物理参数配置  
- **🎲 桌游数字化**：规则引擎、卡牌效果、计分系统配置
- **🚀 太空探索**：星系生成、科技树、资源配置

<div class="grid">
  <div class="grid-item">
    <h3>📚 学习更多</h3>
    <p>查看 <a href="./concepts">核心概念</a> 深入理解 Schema 设计理念</p>
  </div>
  
  <div class="grid-item">
    <h3>🔧 实践应用</h3>
    <p>参考 <a href="./api">API 文档</a> 实现你的游戏配置系统</p>
  </div>
  
  <div class="grid-item">
    <h3>💬 交流讨论</h3>
    <p>加入 <a href="https://discord.gg/schema-gaming">Discord</a> 与其他开发者交流</p>
  </div>
  
  <div class="grid-item">
    <h3>🤝 贡献代码</h3>
    <p>在 <a href="https://github.com/khgame/schema">GitHub</a> 上贡献你的示例</p>
  </div>
</div> 