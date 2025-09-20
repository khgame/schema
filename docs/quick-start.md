---
layout: default
title: 快速开始
nav_order: 2
description: "5分钟上手 Schema 框架"
---

# 🚀 快速开始
{: .fs-9 }

5分钟学会使用 Schema 处理游戏数值配置
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## 📦 安装

<div class="code-example">
<h3>NPM 安装</h3>

```bash
npm install @khgame/schema
```

<h3>Yarn 安装</h3>

```bash
yarn add @khgame/schema
```

<h3>TypeScript 支持</h3>

Schema 内置 TypeScript 类型定义，无需额外安装类型包。

</div>

---

## 🎮 第一个游戏配置

让我们从一个简单的英雄角色配置开始：

<div class="code-example">
<h3>1. 定义英雄属性模式</h3>

```typescript
import { Schema, Fields } from '@khgame/schema';

const HeroSchema = Schema.define({
  id: Fields.number().required(),
  name: Fields.string().required(),
  level: Fields.number().min(1).max(100),
  classType: Fields.enum(['warrior', 'mage', 'archer', 'assassin']),
  attributes: Schema.define({
    hp: Fields.number().min(1),
    mp: Fields.number().min(0),
    attack: Fields.number().min(0),
    defense: Fields.number().min(0)
  }),
  skills: Fields.array(Fields.number()).default([]),
  isUnlocked: Fields.boolean().default(false)
});
```

<h3>2. 解析和验证数据</h3>

```typescript
// 来自游戏策划的数据
const heroData = {
  id: 1001,
  name: "烈焰战士",
  level: 15,
  classType: "warrior",
  attributes: {
    hp: 850,
    mp: 200,
    attack: 120,
    defense: 95
  },
  skills: [1, 3, 7],
  isUnlocked: true
};

// 解析并验证
const hero = HeroSchema.parse(heroData);
console.log(`${hero.name} - ${hero.classType} (Lv.${hero.level})`);
// 输出: 烈焰战士 - warrior (Lv.15)
```

</div>

---

## ⚔️ 实战：装备系统

<div class="code-example">
<h3>装备配置表结构</h3>

```typescript
const EquipmentSchema = Schema.define({
  id: Fields.number().required(),
  name: Fields.string().required(),
  type: Fields.enum(['weapon', 'helmet', 'armor', 'boots', 'accessory']),
  rarity: Fields.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']),
  
  // 基础属性
  baseStats: Schema.define({
    attack: Fields.number().default(0),
    defense: Fields.number().default(0),
    hp: Fields.number().default(0),
    critRate: Fields.number().min(0).max(1).default(0),
    critDamage: Fields.number().min(0).default(0)
  }),
  
  // 强化配置
  enhanceConfig: Schema.define({
    maxLevel: Fields.number().min(1).max(20),
    baseCost: Fields.number().min(1),
    successRates: Fields.array(Fields.number().min(0).max(1))
  }),
  
  // 装备要求
  requirements: Schema.define({
    minLevel: Fields.number().min(1).default(1),
    classRestriction: Fields.array(Fields.string()).default([]),
    questCompleted: Fields.number().optional()
  }).optional(),
  
  // 特殊效果
  effects: Fields.array(Schema.define({
    type: Fields.enum(['buff', 'passive', 'active']),
    effectId: Fields.number(),
    value: Fields.number(),
    duration: Fields.number().optional()
  })).default([])
});
```

<h3>批量处理装备数据</h3>

```typescript
const equipmentList = [
  {
    id: 2001,
    name: "新手之剑",
    type: "weapon",
    rarity: "common",
    baseStats: { attack: 25, defense: 0, hp: 0 },
    enhanceConfig: {
      maxLevel: 5,
      baseCost: 100,
      successRates: [1.0, 0.9, 0.8, 0.6, 0.4]
    },
    requirements: { minLevel: 1 },
    effects: []
  },
  {
    id: 2002,
    name: "龙鳞甲",
    type: "armor",
    rarity: "epic",
    baseStats: { attack: 0, defense: 150, hp: 300 },
    enhanceConfig: {
      maxLevel: 15,
      baseCost: 5000,
      successRates: [1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.05]
    },
    requirements: { 
      minLevel: 40,
      classRestriction: ["warrior", "paladin"],
      questCompleted: 1005
    },
    effects: [
      { type: "passive", effectId: 301, value: 10 } // 火焰抗性 +10%
    ]
  }
];

// 批量验证
const validEquipment = EquipmentSchema.parseArray(equipmentList);
console.log(`成功加载 ${validEquipment.length} 件装备`);
```

</div>

---

## 🏰 数据转换实例

<div class="callout">
<strong>💡 提示</strong><br>
Schema 支持多种数据格式的转换，让策划和程序员都能高效协作。
</div>

<div class="code-example">
<h3>从 CSV 导入技能数据</h3>

假设你有一个 `skills.csv` 文件：

```csv
id,name,type,manaCost,cooldown,damage,range,description
101,火球术,damage,30,3,120,8,发射一个火球攻击敌人
102,治愈术,heal,25,5,80,0,恢复目标生命值
103,闪现,utility,50,15,0,12,瞬间移动到指定位置
```

```typescript
const SkillSchema = Schema.define({
  id: Fields.number().required(),
  name: Fields.string().required(),
  type: Fields.enum(['damage', 'heal', 'utility', 'buff', 'debuff']),
  manaCost: Fields.number().min(0),
  cooldown: Fields.number().min(0),
  damage: Fields.number().min(0).default(0),
  range: Fields.number().min(0).default(0),
  description: Fields.string()
});

// 从 CSV 读取数据
const skills = await SkillSchema.fromCSV('./skills.csv');

// 转换为游戏引擎格式
const unitySkills = skills.map(skill => ({
  skillId: skill.id,
  displayName: skill.name,
  skillType: skill.type.toUpperCase(),
  cost: skill.manaCost,
  cooldownTime: skill.cooldown,
  damageValue: skill.damage,
  castRange: skill.range,
  tooltip: skill.description
}));
```

<h3>导出为策划友好的 Excel</h3>

```typescript
// 添加计算字段和验证规则
const enhancedSkills = skills.map(skill => ({
  ...skill,
  dps: skill.damage / Math.max(skill.cooldown, 1), // 伤害/秒
  efficiency: skill.damage / Math.max(skill.manaCost, 1), // 伤害/耗蓝
  balanceScore: calculateBalanceScore(skill) // 自定义平衡性评分
}));

// 导出到 Excel，包含公式和格式化
await SkillSchema.toExcel(enhancedSkills, './output/skills_analysis.xlsx', {
  sheets: {
    '技能数据': enhancedSkills,
    '平衡性分析': generateBalanceReport(enhancedSkills)
  },
  formatting: {
    dps: { type: 'number', decimals: 2 },
    efficiency: { type: 'number', decimals: 2 },
    balanceScore: { type: 'conditional', rules: [
      { condition: '>80', color: 'green' },
      { condition: '<60', color: 'red' }
    ]}
  }
});
```

</div>

---

## 🔧 错误处理

<div class="code-example">
<h3>优雅的错误处理</h3>

```typescript
try {
  const invalidHero = HeroSchema.parse({
    id: "不是数字",      // ❌ 类型错误
    name: "",           // ❌ 空字符串
    level: 150,         // ❌ 超出范围
    classType: "ninja", // ❌ 无效枚举值
    attributes: {
      hp: -100          // ❌ 负数值
    }
  });
} catch (error) {
  if (error instanceof Schema.ValidationError) {
    console.log('数据验证失败:');
    
    error.details.forEach(detail => {
      console.log(`  • ${detail.path}: ${detail.message}`);
    });
    
    // 输出:
    // 数据验证失败:
    //   • id: 期望数字类型，得到字符串
    //   • name: 不能为空字符串
    //   • level: 值 150 超出允许范围 1-100
    //   • classType: "ninja" 不是有效的枚举值
    //   • attributes.hp: 值不能小于 1
  }
}
```

<h3>生产环境错误监控</h3>

```typescript
// 设置错误处理器
Schema.setErrorHandler((error, context) => {
  // 记录到日志系统
  logger.error('Schema验证失败', {
    error: error.message,
    context: context,
    timestamp: new Date().toISOString(),
    stack: error.stack
  });
  
  // 发送到监控系统
  analytics.track('schema_validation_error', {
    schema: context.schemaName,
    field: context.fieldPath,
    errorType: error.type
  });
});
```

</div>

---

## 🎯 高级技巧

<div class="callout warning">
<strong>⚡ 性能优化</strong><br>
对于大量数据处理，建议使用流式处理和预编译选项。
</div>

<div class="code-example">
<h3>预编译模式</h3>

```typescript
// 编译时生成优化的验证器
const CompiledHeroSchema = Schema.compile(HeroSchema, {
  optimize: true,
  cacheValidators: true
});

// 批量处理时性能提升 3-5 倍
const heroes = CompiledHeroSchema.parseArray(largeHeroDataset);
```

<h3>自定义验证规则</h3>

```typescript
const AdvancedHeroSchema = Schema.define({
  id: Fields.number().required(),
  name: Fields.string().custom((value, context) => {
    // 自定义验证：名字不能包含敏感词
    const forbiddenWords = ['admin', 'test', 'null'];
    if (forbiddenWords.some(word => value.toLowerCase().includes(word))) {
      throw new Error(`角色名不能包含敏感词: ${value}`);
    }
    return value;
  }),
  
  level: Fields.number().custom((value, context) => {
    // 动态验证：VIP玩家等级上限更高
    const maxLevel = context.player?.isVip ? 120 : 100;
    if (value > maxLevel) {
      throw new Error(`等级不能超过 ${maxLevel}`);
    }
    return value;
  }),
  
  // 关联验证：技能必须适合角色职业
  skills: Fields.array(Fields.number()).validate((skills, context) => {
    const { classType } = context.data;
    const validSkills = getValidSkillsForClass(classType);
    
    const invalidSkills = skills.filter(skill => !validSkills.includes(skill));
    if (invalidSkills.length > 0) {
      throw new Error(`技能 ${invalidSkills.join(', ')} 不适合职业 ${classType}`);
    }
  })
});
```

</div>

---

## 🎉 下一步

恭喜！你已经掌握了 Schema 的基础用法。接下来可以：

<div class="grid">
  <div class="grid-item">
    <h3>📖 深入学习</h3>
    <p>阅读 <a href="./concepts">核心概念</a> 了解更多高级特性</p>
  </div>
  
  <div class="grid-item">
    <h3>🎮 查看示例</h3>
    <p>浏览 <a href="./examples">游戏示例</a> 获取灵感</p>
  </div>
  
  <div class="grid-item">
    <h3>📋 API 参考</h3>
    <p>查阅完整的 <a href="./api">API 文档</a></p>
  </div>
  
  <div class="grid-item">
    <h3>🤝 加入社区</h3>
    <p>在 <a href="https://discord.gg/schema-gaming">Discord</a> 分享你的项目</p>
  </div>
</div>

<div class="callout success">
<strong>🏆 成就解锁</strong><br>
你已经完成了 Schema 快速入门！现在可以开始在你的游戏项目中使用类型安全的数值配置了。
</div> 