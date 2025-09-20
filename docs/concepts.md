---
layout: default
title: 核心概念
nav_order: 4
description: "深入理解 Schema 框架的设计理念和架构"
---

# 🧠 核心概念
{: .fs-9 }

深入理解 Schema 框架的设计理念和架构
{: .fs-6 .fw-300 }

---

## 🎯 设计哲学

Schema 框架的设计遵循以下核心理念：

<div class="grid">
  <div class="grid-item">
    <h3>🛡️ 类型安全优先</h3>
    <p>编译时类型检查确保数据结构的正确性，减少运行时错误</p>
  </div>
  
  <div class="grid-item">
    <h3>🎮 游戏开发专用</h3>
    <p>专为游戏数值配置设计，内置游戏开发最佳实践</p>
  </div>
  
  <div class="grid-item">
    <h3>⚡ 性能导向</h3>
    <p>零运行时开销，高效的批量处理和数据转换</p>
  </div>
  
  <div class="grid-item">
    <h3>🔧 开发体验</h3>
    <p>直观的API设计，完善的错误提示和调试支持</p>
  </div>
</div>

---

## 📋 Schema 定义

### 基础字段类型

<div class="code-example">
<h3>数值类型</h3>

```typescript
import { Fields } from '@khgame/schema';

// 基础数值
const damage = Fields.number().min(0);
const level = Fields.number().min(1).max(100);
const percentage = Fields.number().min(0).max(1);

// 整数类型
const itemId = Fields.integer().positive();
const experience = Fields.integer().min(0);

// 浮点数
const criticalRate = Fields.float().min(0).max(1);
const attackSpeed = Fields.float().min(0.1).max(5.0);
```

<h3>字符串类型</h3>

```typescript
// 基础字符串
const name = Fields.string().min(2).max(50);
const description = Fields.string().optional();

// 枚举类型
const rarity = Fields.enum(['common', 'rare', 'epic', 'legendary']);
const element = Fields.enum(['fire', 'water', 'earth', 'air', 'neutral']);

// 格式验证
const email = Fields.string().email();
const url = Fields.string().url();
const uuid = Fields.string().uuid();

// 自定义验证
const playerName = Fields.string()
  .min(3)
  .max(16)
  .matches(/^[a-zA-Z0-9_]+$/, '只能包含字母、数字和下划线');
```

<h3>复杂类型</h3>

```typescript
// 数组类型
const skillIds = Fields.array(Fields.number()).min(1).max(10);
const tags = Fields.array(Fields.string()).unique();

// 对象类型
const position = Schema.define({
  x: Fields.number(),
  y: Fields.number(),
  z: Fields.number().default(0)
});

// 可选字段
const optionalData = Schema.define({
  required: Fields.string().required(),
  optional: Fields.string().optional(),
  withDefault: Fields.number().default(100)
});
```

</div>

### 条件验证

<div class="code-example">
<h3>when 条件</h3>

```typescript
const ItemSchema = Schema.define({
  type: Fields.enum(['weapon', 'armor', 'consumable']),
  
  // 根据类型条件验证
  damage: Fields.number().when('type', {
    is: 'weapon',
    then: Fields.number().min(1).required(),
    otherwise: Fields.number().optional()
  }),
  
  defense: Fields.number().when('type', {
    is: 'armor', 
    then: Fields.number().min(1).required(),
    otherwise: Fields.number().default(0)
  }),
  
  // 多条件
  durability: Fields.number().when('type', {
    is: ['weapon', 'armor'],
    then: Fields.number().min(1).max(100).required(),
    otherwise: Fields.number().optional()
  })
});
```

<h3>跨字段验证</h3>

```typescript
const CharacterSchema = Schema.define({
  level: Fields.number().min(1).max(100),
  experience: Fields.number().min(0),
  
  // 经验值必须符合等级要求
  validate: (data) => {
    const requiredExp = calculateRequiredExp(data.level);
    if (data.experience < requiredExp) {
      throw new Error(`等级 ${data.level} 需要至少 ${requiredExp} 经验值`);
    }
  }
});
```

</div>

---

## 🎨 高级模式

### 联合类型

<div class="code-example">
<h3>动态结构</h3>

```typescript
// 不同技能类型有不同的配置结构
const SkillSchema = Schema.union({
  // 主动技能
  active: Schema.define({
    type: Fields.literal('active'),
    manaCost: Fields.number().min(1),
    cooldown: Fields.number().min(0),
    castTime: Fields.number().min(0),
    targetType: Fields.enum(['self', 'ally', 'enemy', 'area'])
  }),
  
  // 被动技能
  passive: Schema.define({
    type: Fields.literal('passive'),
    triggerCondition: Fields.enum(['always', 'combat', 'hit', 'kill']),
    stackable: Fields.boolean().default(false),
    maxStacks: Fields.number().when('stackable', {
      is: true,
      then: Fields.number().min(1).max(10).required(),
      otherwise: Fields.number().optional()
    })
  }),
  
  // 光环技能
  aura: Schema.define({
    type: Fields.literal('aura'),
    radius: Fields.number().min(1),
    affectedTargets: Fields.enum(['allies', 'enemies', 'all']),
    stacksWithOthers: Fields.boolean().default(true)
  })
}, 'type'); // 使用 type 字段区分
```

</div>

### 递归结构

<div class="code-example">
<h3>技能树系统</h3>

```typescript
// 定义递归的技能树结构
const SkillNodeSchema: Schema = Schema.define({
  id: Fields.number().required(),
  name: Fields.string().required(),
  description: Fields.string(),
  
  // 技能要求
  requirements: Schema.define({
    level: Fields.number().min(1),
    prerequisites: Fields.array(Fields.number()).default([]),
    skillPoints: Fields.number().min(1),
    attribute: Schema.define({
      stat: Fields.enum(['strength', 'agility', 'intellect']),
      minValue: Fields.number().min(1)
    }).optional()
  }),
  
  // 技能效果
  effects: Fields.array(Schema.define({
    type: Fields.enum(['stat_bonus', 'new_ability', 'unlock_skill']),
    value: Fields.number(),
    target: Fields.string()
  })),
  
  // 子技能（递归）
  children: Fields.array(Fields.lazy(() => SkillNodeSchema)).default([]),
  
  // UI 显示
  position: Schema.define({
    x: Fields.number(),
    y: Fields.number(),
    tier: Fields.number().min(1).max(10)
  })
});
```

</div>

### 模式扩展

<div class="code-example">
<h3>基础扩展</h3>

```typescript
// 基础实体模式
const BaseEntitySchema = Schema.define({
  id: Fields.number().required(),
  name: Fields.string().required(),
  createdAt: Fields.date().default(() => new Date()),
  updatedAt: Fields.date().default(() => new Date())
});

// 扩展为游戏实体
const GameEntitySchema = BaseEntitySchema.extend({
  level: Fields.number().min(1).max(100),
  experience: Fields.number().min(0),
  isActive: Fields.boolean().default(true)
});

// 进一步扩展为角色
const CharacterSchema = GameEntitySchema.extend({
  class: Fields.enum(['warrior', 'mage', 'archer']),
  attributes: Schema.define({
    strength: Fields.number().min(1),
    agility: Fields.number().min(1),
    intellect: Fields.number().min(1)
  }),
  equipment: Fields.array(Fields.number()).default([])
});

// 选择性扩展（只添加某些字段）
const NPCSchema = BaseEntitySchema.pick(['id', 'name']).extend({
  dialogue: Fields.array(Fields.string()),
  questIds: Fields.array(Fields.number()).default([])
});
```

</div>

---

## 🔄 数据转换

### 内置转换器

<div class="code-example">
<h3>格式转换</h3>

```typescript
import { Schema, Converters } from '@khgame/schema';

const CharacterSchema = Schema.define({
  id: Fields.number(),
  name: Fields.string(),
  level: Fields.number(),
  attributes: Schema.define({
    hp: Fields.number(),
    mp: Fields.number(),
    attack: Fields.number()
  })
});

// CSV 转换
const csvConverter = new Converters.CSV(CharacterSchema);
const characters = await csvConverter.fromFile('./characters.csv');

// Excel 转换  
const excelConverter = new Converters.Excel(CharacterSchema);
await excelConverter.toFile(characters, './output.xlsx', {
  sheetName: '角色数据',
  formatting: {
    headers: { bold: true, bgColor: '#4472C4' },
    numbers: { decimals: 0 }
  }
});

// JSON 转换
const jsonConverter = new Converters.JSON(CharacterSchema);
const jsonData = jsonConverter.stringify(characters, { indent: 2 });

// 数据库转换
const dbConverter = new Converters.Database(CharacterSchema);
const sqlInserts = dbConverter.toSQL(characters, 'characters');
```

</div>

### 自定义转换器

<div class="code-example">
<h3>游戏引擎格式</h3>

```typescript
// Unity 引擎格式转换器
class UnityConverter extends Converters.Base {
  convert(data: any[]): UnityAsset[] {
    return data.map(item => ({
      // Unity ScriptableObject 格式
      m_ObjectHideFlags: 0,
      m_CorrespondingSourceObject: null,
      m_PrefabInstance: null,
      m_PrefabAsset: null,
      m_GameObject: null,
      m_Enabled: 1,
      m_EditorHideFlags: 0,
      m_Script: { fileID: 11500000, guid: this.scriptGuid },
      
      // 实际数据
      id: item.id,
      displayName: item.name,
      gameLevel: item.level,
      stats: {
        healthPoints: item.attributes.hp,
        manaPoints: item.attributes.mp,
        attackPower: item.attributes.attack
      }
    }));
  }
}

// Unreal Engine 格式
class UnrealConverter extends Converters.Base {
  convert(data: any[]): UnrealDataTable[] {
    const rows = {};
    
    data.forEach(item => {
      rows[`Character_${item.id}`] = {
        ID: item.id,
        Name: item.name,
        Level: item.level,
        HP: item.attributes.hp,
        MP: item.attributes.mp,
        Attack: item.attributes.attack
      };
    });
    
    return {
      Type: "DataTable",
      Rows: rows
    };
  }
}
```

</div>

---

## 🛠️ 验证系统

### 错误处理

<div class="code-example">
<h3>详细错误信息</h3>

```typescript
try {
  const character = CharacterSchema.parse({
    id: "not_a_number",
    name: "",
    level: 150,
    attributes: {
      hp: -100
    }
  });
} catch (error) {
  if (error instanceof Schema.ValidationError) {
    console.log('验证错误详情:');
    
    error.details.forEach(detail => {
      console.log(`
        路径: ${detail.path}
        值: ${detail.value}
        错误: ${detail.message}
        期望类型: ${detail.expectedType}
        实际类型: ${detail.actualType}
      `);
    });
    
    // 输出结构化错误信息
    const errorMap = error.toMap();
    console.log(JSON.stringify(errorMap, null, 2));
  }
}
```

<h3>自定义验证器</h3>

```typescript
// 全局验证器
Schema.addValidator('gameBalance', (value, context) => {
  // 检查游戏平衡性
  if (context.schema.type === 'character') {
    const totalStats = value.attributes.hp + value.attributes.attack;
    const expectedTotal = value.level * 10;
    
    if (Math.abs(totalStats - expectedTotal) > expectedTotal * 0.2) {
      throw new Error(`角色数值不平衡: 总属性 ${totalStats}, 期望 ${expectedTotal}`);
    }
  }
});

// 字段级验证器
const validatedSchema = CharacterSchema.validate('gameBalance');
```

</div>

### 批量验证

<div class="code-example">
<h3>大数据集处理</h3>

```typescript
// 流式验证，适合大文件
const streamValidator = Schema.createStreamValidator(CharacterSchema, {
  batchSize: 1000,
  errorStrategy: 'collect', // 'stop' | 'collect' | 'skip'
  onProgress: (processed, total) => {
    console.log(`处理进度: ${processed}/${total}`);
  },
  onError: (error, rowIndex) => {
    console.log(`第 ${rowIndex} 行错误:`, error.message);
  }
});

const result = await streamValidator.validateFile('./large_dataset.csv');

console.log(`
  成功: ${result.success.length}
  失败: ${result.errors.length}
  总计: ${result.total}
`);
```

</div>

---

## ⚡ 性能优化

### 预编译

<div class="code-example">
<h3>编译时优化</h3>

```typescript
// 预编译验证器，提升运行时性能
const CompiledSchema = Schema.compile(CharacterSchema, {
  // 优化选项
  optimize: true,
  cacheValidators: true,
  inlineValidation: true,
  
  // 代码生成选项
  target: 'es2020',
  minify: true,
  
  // 类型生成
  generateTypes: true,
  typeOutput: './types/character.d.ts'
});

// 使用预编译版本，性能提升 3-5 倍
const characters = CompiledSchema.parseArray(largeDataset);
```

</div>

### 缓存策略

<div class="code-example">
<h3>智能缓存</h3>

```typescript
// 配置缓存策略
Schema.configure({
  cache: {
    // 验证结果缓存
    validation: {
      enabled: true,
      maxSize: 10000,
      ttl: 60000 // 1分钟
    },
    
    // 模式编译缓存
    compilation: {
      enabled: true,
      persistent: true, // 持久化到磁盘
      directory: './.schema-cache'
    },
    
    // 类型推断缓存
    typeInference: {
      enabled: true,
      maxDepth: 10
    }
  }
});

// 缓存预热
await Schema.warmupCache([
  CharacterSchema,
  EquipmentSchema,
  SkillSchema
]);
```

</div>

---

## 🎮 游戏开发最佳实践

### 配置管理

<div class="code-example">
<h3>环境配置</h3>

```typescript
// 多环境配置管理
const ConfigManager = {
  development: {
    validation: { strict: false },
    logging: { level: 'debug' },
    features: { experimentalFeatures: true }
  },
  
  production: {
    validation: { strict: true },
    logging: { level: 'error' },
    features: { experimentalFeatures: false }
  },
  
  testing: {
    validation: { strict: true },
    logging: { level: 'silent' },
    features: { experimentalFeatures: true }
  }
};

// 应用环境配置
Schema.configure(ConfigManager[process.env.NODE_ENV || 'development']);
```

</div>

### 模块化设计

<div class="code-example">
<h3>模式组织</h3>

```typescript
// schemas/base.ts - 基础模式
export const BaseSchema = Schema.define({
  id: Fields.number().required(),
  createdAt: Fields.date().default(() => new Date())
});

// schemas/character.ts - 角色模式
export const CharacterSchema = BaseSchema.extend({
  name: Fields.string(),
  level: Fields.number()
});

// schemas/equipment.ts - 装备模式  
export const EquipmentSchema = BaseSchema.extend({
  name: Fields.string(),
  type: Fields.enum(['weapon', 'armor'])
});

// schemas/index.ts - 统一导出
export * from './base';
export * from './character';
export * from './equipment';

// 模式注册中心
export const SchemaRegistry = {
  character: CharacterSchema,
  equipment: EquipmentSchema
};
```

</div>

---

## 🔍 调试和开发工具

### 开发工具支持

<div class="callout">
<strong>🔧 开发者工具</strong><br>
Schema 提供了丰富的开发工具，包括 VS Code 插件、浏览器扩展和命令行工具。
</div>

<div class="code-example">
<h3>调试工具</h3>

```typescript
// 启用调试模式
Schema.debug({
  enabled: true,
  logLevel: 'verbose',
  showStackTrace: true,
  
  // 性能分析
  profile: {
    validation: true,
    conversion: true,
    compilation: true
  },
  
  // 可视化
  visualization: {
    showSchemaGraph: true,
    showDataFlow: true,
    exportFormats: ['svg', 'png', 'json']
  }
});

// 模式分析
const analysis = Schema.analyze(CharacterSchema);
console.log(analysis.complexity);    // 复杂度评分
console.log(analysis.performance);   // 性能预测
console.log(analysis.suggestions);   // 优化建议
```

</div>

<div class="grid">
  <div class="grid-item">
    <h3>📖 下一步</h3>
    <p>学习 <a href="./api">API 文档</a> 掌握所有方法</p>
  </div>
  
  <div class="grid-item">
    <h3>🎮 实践</h3>
    <p>查看 <a href="./examples">游戏示例</a> 应用这些概念</p>
  </div>
  
  <div class="grid-item">
    <h3>❓ 疑问</h3>
    <p>参考 <a href="./faq">FAQ</a> 解决常见问题</p>
  </div>
  
  <div class="grid-item">
    <h3>💬 社区</h3>
    <p>加入 <a href="https://discord.gg/schema-gaming">Discord</a> 讨论</p>
  </div>
</div> 