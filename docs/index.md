---
layout: default
title: Home
nav_order: 1
description: "Schema - 游戏数值配置的类型安全解决方案"
permalink: /
---

<div class="hero-section">
  <div class="container">
    <h1 class="text-center">🎮 Schema Framework</h1>
    <p class="text-center lead">游戏开发中的类型安全数值配置解决方案</p>
    <div class="text-center">
      <a href="./quick-start" class="btn btn-primary btn-lg mr-3">🚀 快速开始</a>
      <a href="./examples" class="btn btn-outline-light btn-lg">📖 查看示例</a>
    </div>
  </div>
</div>

# 为什么选择 Schema？

在游戏开发中，数值配置是核心环节。无论是角色属性、装备数据还是关卡配置，都需要安全可靠的数据处理方案。Schema 框架专为此而生。

<div class="grid">
  <div class="grid-item">
    <h3>🛡️ 类型安全</h3>
    <p>编译时类型检查，运行时数据验证，确保游戏数值配置的准确性</p>
  </div>
  
  <div class="grid-item">
    <h3>🎯 游戏专用</h3>
    <p>专为游戏开发设计，内置常见游戏数值模式和最佳实践</p>
  </div>
  
  <div class="grid-item">
    <h3>⚡ 高性能</h3>
    <p>零运行时开销的类型系统，高效的数据转换和验证</p>
  </div>
  
  <div class="grid-item">
    <h3>🔄 格式转换</h3>
    <p>支持多种数据格式互转：JSON、CSV、Excel、数据库</p>
  </div>
  
  <div class="grid-item">
    <h3>🎨 开发友好</h3>
    <p>直观的 API 设计，完善的 TypeScript 支持和智能提示</p>
  </div>
  
  <div class="grid-item">
    <h3>📊 数据洞察</h3>
    <p>内置数据分析工具，帮助优化游戏平衡性</p>
  </div>
</div>

## 🎮 实际游戏场景

### RPG 角色属性配置

```typescript
import { Schema, Fields } from '@khgame/schema';

// 定义角色属性模式
const CharacterSchema = Schema.define({
  id: Fields.number().required(),
  name: Fields.string().required(),
  level: Fields.number().min(1).max(100),
  attributes: Schema.define({
    hp: Fields.number().min(1),
    mp: Fields.number().min(0),
    attack: Fields.number().min(0),
    defense: Fields.number().min(0),
    speed: Fields.number().min(1).max(999)
  }),
  skills: Fields.array(Fields.number()),
  rarity: Fields.enum(['common', 'rare', 'epic', 'legendary'])
});

// 类型安全的数据处理
const character = CharacterSchema.parse({
  id: 1001,
  name: "勇者艾克",
  level: 25,
  attributes: {
    hp: 1200,
    mp: 800,
    attack: 150,
    defense: 120,
    speed: 95
  },
  skills: [101, 102, 105],
  rarity: "epic"
});

console.log(`${character.name} (Lv.${character.level})`);
```

### 装备系统配置

```typescript
const EquipmentSchema = Schema.define({
  id: Fields.number().required(),
  name: Fields.string().required(),
  type: Fields.enum(['weapon', 'armor', 'accessory']),
  grade: Fields.number().min(1).max(10),
  baseStats: Schema.define({
    attack: Fields.number().default(0),
    defense: Fields.number().default(0),
    critRate: Fields.number().min(0).max(1).default(0),
    critDamage: Fields.number().min(0).default(0)
  }),
  enhanceConfig: Schema.define({
    maxLevel: Fields.number().max(15),
    costFormula: Fields.string(), // "base_cost * (level ^ 1.5)"
    successRate: Fields.array(Fields.number().min(0).max(1))
  }),
  dropSources: Fields.array(Schema.define({
    stageId: Fields.number(),
    dropRate: Fields.number().min(0).max(1),
    conditions: Fields.array(Fields.string()).optional()
  }))
});
```

### 关卡配置系统

```typescript
const StageSchema = Schema.define({
  id: Fields.number().required(),
  name: Fields.string().required(),
  difficulty: Fields.enum(['easy', 'normal', 'hard', 'nightmare']),
  waves: Fields.array(Schema.define({
    enemies: Fields.array(Schema.define({
      monsterId: Fields.number(),
      level: Fields.number(),
      position: Schema.define({
        x: Fields.number(),
        y: Fields.number()
      }),
      aiType: Fields.enum(['aggressive', 'defensive', 'support'])
    })),
    bossConfig: Schema.define({
      monsterId: Fields.number(),
      level: Fields.number(),
      enrageTimer: Fields.number().default(180), // 秒
      phases: Fields.array(Schema.define({
        hpThreshold: Fields.number().min(0).max(1),
        skillRotation: Fields.array(Fields.number())
      }))
    }).optional()
  })),
  rewards: Schema.define({
    baseExp: Fields.number(),
    baseGold: Fields.number(),
    items: Fields.array(Schema.define({
      itemId: Fields.number(),
      quantity: Fields.number(),
      dropRate: Fields.number().min(0).max(1)
    }))
  }),
  requirements: Schema.define({
    minLevel: Fields.number().default(1),
    preStages: Fields.array(Fields.number()).default([]),
    requiredItems: Fields.array(Fields.number()).default([])
  })
});
```

## 核心能力速览

<div class="callout">
<strong>使用提示</strong><br>
以下示例基于内部实践总结，可按需裁剪到自己的项目流程。
</div>

### 数据验证和错误处理

```typescript
try {
  const invalidCharacter = CharacterSchema.parse({
    id: "not-a-number", // ❌ 类型错误
    level: 150,          // ❌ 超出范围
    attributes: {
      hp: -100           // ❌ 负数血量
    }
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('验证失败:', error.details);
    // 输出具体的错误信息和路径
  }
}
```

### 数据格式转换

```typescript
// 从 CSV 批量导入角色数据
const characters = await CharacterSchema.fromCSV('./characters.csv');

// 转换为内部数据结构
const normalized = CharacterSchema.convertTo('runtime', characters);

// 导出为策划表格
await CharacterSchema.toExcel(normalized, './output/characters.xlsx');
```

## 二维表配合实践

Schema 标记与二维表（CSV / Excel）列是一一对应的。常见做法：

1. **同步列描述**：在策划表的首行维护列名数组 `descList`，保持顺序与 `parseSchema` 中的标记一致。
2. **读取原始表格**：按行读取 CSV/Excel，将每行转换为简单数组 `values: any[]`，下标与列位置相同。
3. **验证与转换**：调用 `const result = new SchemaConvertor(schema).convert(values)`，读取 `result.ok` 判断是否通过；若失败，`result.errors` 给出列路径与原始值。
4. **导出结构对象**：使用 `exportJson(schema, descList, rows)` 将验证通过的数据重建为嵌套对象/数组。

示例表格：

```
id,name,level,stats.hp,stats.attack
1,Hero,10,100,25
2,Mage,12,80,30
```

对应的 schema 标记：

```ts
const schemaMarks = [
  'uint',
  'string',
  'uint',
  'stats', '{',
    'uint', // hp
    'uint', // attack
  '}'
];
```

只要列顺序保持一致，就能在一次转换里完成校验、结构化和错误定位。若列发生调整，只需同步更新首行描述与标记顺序即可。

### 配置热更新支持

```typescript
// 监听配置文件变化
SchemaManager.watch('./configs/characters.json', (newData) => {
  const validatedData = CharacterSchema.parseArray(newData);
  GameDataManager.updateCharacters(validatedData);
  console.log(`已更新 ${validatedData.length} 个角色配置`);
});
```

## 🚀 立即开始

<div class="callout success">
<strong>💎 推荐路径</strong><br>
1. 阅读 <a href="./quick-start">快速开始</a> 指南<br>
2. 查看 <a href="./examples">游戏示例</a> 了解实际应用<br>
3. 参考 <a href="./api">API 文档</a> 深入学习<br>
4. 加入 <a href="https://discord.gg/schema-gaming">Discord 社区</a> 交流经验
</div>

```bash
# 安装
npm install @khgame/schema

# 或使用 yarn
yarn add @khgame/schema
```

---

<div class="text-center mt-5">
  <p class="text-muted">
    由 <a href="https://github.com/khgame">KHGame</a> 团队开发，专为游戏开发者打造 ❤️
  </p>
</div> 
