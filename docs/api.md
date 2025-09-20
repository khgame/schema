---
layout: default
title: API 文档
nav_order: 5
description: "Schema 框架完整 API 参考文档"
---

# 📚 API 文档
{: .fs-9 }

Schema 框架完整 API 参考文档
{: .fs-6 .fw-300 }

---

## 🏗️ Schema 核心 API

### Schema.define()

定义数据结构模式。

<div class="code-example">
<h3>基础用法</h3>

```typescript
import { Schema, Fields } from '@khgame/schema';

const CharacterSchema = Schema.define({
  id: Fields.number().required(),
  name: Fields.string().min(2).max(50),
  level: Fields.number().min(1).max(100).default(1),
  isActive: Fields.boolean().default(true)
});

// 类型推断
type Character = typeof CharacterSchema._type;
// { id: number; name: string; level: number; isActive: boolean }
```

<h3>嵌套结构</h3>

```typescript
const ComplexSchema = Schema.define({
  character: Schema.define({
    id: Fields.number(),
    name: Fields.string(),
    stats: Schema.define({
      hp: Fields.number().min(0),
      mp: Fields.number().min(0),
      attack: Fields.number().min(0)
    })
  }),
  equipment: Fields.array(
    Schema.define({
      id: Fields.number(),
      type: Fields.enum(['weapon', 'armor', 'accessory']),
      attributes: Fields.record(Fields.number())
    })
  )
});
```

</div>

**参数:**
- `definition`: 对象，定义数据结构
- `options?`: 可选配置对象

**返回值:** Schema 实例

---

### Schema 实例方法

#### `.parse(data)`

解析并验证数据。

<div class="code-example">

```typescript
try {
  const character = CharacterSchema.parse({
    id: 1,
    name: "勇者",
    level: 10
  });
  console.log(character); // 验证通过的数据
} catch (error) {
  console.error('验证失败:', error.message);
}
```

</div>

**参数:**
- `data`: 要验证的数据

**返回值:** 验证后的类型安全数据

**抛出:** `ValidationError` 当验证失败时

#### `.safeParse(data)`

安全解析，返回结果对象而不抛出异常。

<div class="code-example">

```typescript
const result = CharacterSchema.safeParse({
  id: "invalid",
  name: "test"
});

if (result.success) {
  console.log('数据:', result.data);
} else {
  console.log('错误:', result.errors);
}
```

</div>

**返回值:** `{ success: boolean; data?: T; errors?: ValidationError[] }`

#### `.parseArray(data[])`

批量解析数据数组。

<div class="code-example">

```typescript
const characters = CharacterSchema.parseArray([
  { id: 1, name: "战士", level: 10 },
  { id: 2, name: "法师", level: 15 },
  { id: 3, name: "弓手", level: 12 }
]);
```

</div>

#### `.extend(definition)`

扩展现有模式。

<div class="code-example">

```typescript
const PlayerSchema = CharacterSchema.extend({
  guild: Fields.string().optional(),
  lastLogin: Fields.date().default(() => new Date()),
  
  // 重写现有字段
  level: Fields.number().min(1).max(200) // 提高等级上限
});
```

</div>

#### `.pick(keys[])`

选择特定字段创建新模式。

<div class="code-example">

```typescript
const CharacterSummary = CharacterSchema.pick(['id', 'name', 'level']);
// 只包含: { id: number; name: string; level: number }
```

</div>

#### `.omit(keys[])`

排除特定字段创建新模式。

<div class="code-example">

```typescript
const PublicCharacter = CharacterSchema.omit(['id']);
// 不包含 id 字段
```

</div>

#### `.partial()`

将所有字段设为可选。

<div class="code-example">

```typescript
const CharacterUpdate = CharacterSchema.partial();
// 所有字段都变为可选，用于更新操作
```

</div>

#### `.required()`

将所有字段设为必需。

<div class="code-example">

```typescript
const StrictCharacter = CharacterSchema.required();
// 所有字段都必须提供
```

</div>

---

## 🎨 Fields API

### 数值类型

#### Fields.number()

定义数值字段。

<div class="code-example">

```typescript
const NumberField = Fields.number()
  .min(0)                    // 最小值
  .max(100)                  // 最大值
  .positive()                // 必须为正数
  .negative()                // 必须为负数
  .nonNegative()            // 非负数
  .nonPositive()            // 非正数
  .multipleOf(5)            // 必须是5的倍数
  .finite()                 // 必须是有限数
  .safe()                   // 在安全整数范围内
  .default(0)               // 默认值
  .optional()               // 可选字段
  .nullable()               // 允许null
  .transform(x => x * 2);   // 数据转换
```

</div>

**方法链:**
- `.min(value)`: 设置最小值
- `.max(value)`: 设置最大值
- `.positive()`: 必须大于0
- `.negative()`: 必须小于0
- `.integer()`: 必须是整数
- `.multipleOf(value)`: 必须是倍数
- `.finite()`: 必须是有限数
- `.default(value)`: 设置默认值

#### Fields.integer()

整数字段的便捷方法。

<div class="code-example">

```typescript
const IntField = Fields.integer()
  .min(1)
  .max(999999)
  .default(1);

// 等同于
const SameField = Fields.number().integer().min(1).max(999999).default(1);
```

</div>

#### Fields.float()

浮点数字段的便捷方法。

<div class="code-example">

```typescript
const FloatField = Fields.float()
  .min(0.0)
  .max(1.0)
  .precision(2);  // 保留2位小数
```

</div>

### 字符串类型

#### Fields.string()

定义字符串字段。

<div class="code-example">

```typescript
const StringField = Fields.string()
  .min(1)                           // 最小长度
  .max(100)                         // 最大长度
  .length(10)                       // 固定长度
  .email()                          // 邮箱格式
  .url()                            // URL格式
  .uuid()                           // UUID格式
  .regex(/^[a-zA-Z0-9_]+$/)        // 正则匹配
  .includes('test')                 // 必须包含
  .startsWith('prefix')             // 必须以...开头
  .endsWith('suffix')               // 必须以...结尾
  .trim()                           // 自动去除首尾空格
  .toLowerCase()                    // 转为小写
  .toUpperCase()                    // 转为大写
  .default('')                      // 默认值
  .optional();                      // 可选字段
```

</div>

**预定义格式:**
- `.email()`: 验证邮箱格式
- `.url()`: 验证URL格式
- `.uuid()`: 验证UUID格式
- `.cuid()`: 验证CUID格式
- `.datetime()`: 验证ISO datetime格式

#### Fields.enum()

枚举字段。

<div class="code-example">

```typescript
// 字符串枚举
const RarityField = Fields.enum(['common', 'rare', 'epic', 'legendary']);

// 数值枚举
const ClassField = Fields.enum([1, 2, 3, 4] as const);

// 使用TypeScript enum
enum CharacterClass {
  WARRIOR = 'warrior',
  MAGE = 'mage',
  ARCHER = 'archer'
}

const ClassEnumField = Fields.nativeEnum(CharacterClass);
```

</div>

#### Fields.literal()

字面量类型。

<div class="code-example">

```typescript
const TypeField = Fields.literal('character');
// 只能是 'character' 这个值

const VersionField = Fields.literal(1);
// 只能是数值 1
```

</div>

### 布尔类型

#### Fields.boolean()

布尔字段。

<div class="code-example">

```typescript
const BoolField = Fields.boolean()
  .default(false)
  .optional();

// 自动转换
const CoerceBoolField = Fields.boolean()
  .coerce(); // "true"/"false", 1/0, "yes"/"no" 都会被转换
```

</div>

### 日期类型

#### Fields.date()

日期字段。

<div class="code-example">

```typescript
const DateField = Fields.date()
  .min(new Date('2020-01-01'))     // 最早日期
  .max(new Date('2030-12-31'))     // 最晚日期
  .default(() => new Date())        // 默认为当前时间
  .optional();

// 从字符串解析
const DateStringField = Fields.date()
  .coerce(); // 自动将字符串转换为Date对象
```

</div>

### 数组类型

#### Fields.array()

数组字段。

<div class="code-example">

```typescript
// 基础数组
const NumberArrayField = Fields.array(Fields.number())
  .min(1)                    // 最少1个元素
  .max(10)                   // 最多10个元素
  .length(5)                 // 固定5个元素
  .nonempty()               // 不能为空数组
  .unique()                 // 元素必须唯一
  .default([]);             // 默认空数组

// 复杂数组
const CharacterArrayField = Fields.array(
  Schema.define({
    id: Fields.number(),
    name: Fields.string()
  })
).min(1).max(100);

// 元组
const CoordinateField = Fields.tuple([
  Fields.number(), // x
  Fields.number(), // y
  Fields.number().optional() // z (可选)
]);
```

</div>

**方法:**
- `.min(length)`: 最小长度
- `.max(length)`: 最大长度
- `.length(size)`: 固定长度
- `.nonempty()`: 不能为空
- `.unique()`: 元素唯一

### 对象类型

#### Fields.object()

对象字段。

<div class="code-example">

```typescript
// 基础对象
const MetadataField = Fields.object({
  version: Fields.string(),
  timestamp: Fields.date(),
  author: Fields.string().optional()
});

// 动态键
const AttributesField = Fields.record(Fields.number());
// { [key: string]: number }

// 限制键
const SpecificAttributesField = Fields.record(
  Fields.number(),
  Fields.enum(['strength', 'agility', 'intellect'])
);
// { strength?: number; agility?: number; intellect?: number }
```

</div>

#### Fields.record()

记录类型（动态键的对象）。

<div class="code-example">

```typescript
// 字符串键，数值值
const StatsField = Fields.record(Fields.number());

// 特定键类型
const ConfigField = Fields.record(
  Fields.string(), // 值类型
  Fields.enum(['debug', 'info', 'warn', 'error']) // 键类型
);
```

</div>

### 联合类型

#### Fields.union()

联合类型字段。

<div class="code-example">

```typescript
// 简单联合
const IdField = Fields.union([
  Fields.string(),
  Fields.number()
]);

// 对象判别联合
const ItemField = Fields.discriminatedUnion('type', [
  Schema.define({
    type: Fields.literal('weapon'),
    damage: Fields.number(),
    criticalRate: Fields.number()
  }),
  Schema.define({
    type: Fields.literal('armor'),
    defense: Fields.number(),
    resistance: Fields.number()
  }),
  Schema.define({
    type: Fields.literal('consumable'),
    effect: Fields.string(),
    duration: Fields.number().optional()
  })
]);
```

</div>

### 特殊类型

#### Fields.any()

接受任意类型。

<div class="code-example">

```typescript
const AnyField = Fields.any();
// 不进行类型检查，但保留在模式中
```

</div>

#### Fields.unknown()

未知类型，需要进一步验证。

<div class="code-example">

```typescript
const UnknownField = Fields.unknown()
  .refine((data) => {
    // 自定义验证逻辑
    return typeof data === 'object' && data !== null;
  }, '必须是对象');
```

</div>

#### Fields.null()

null 类型。

<div class="code-example">

```typescript
const NullField = Fields.null();

// 常与union结合使用
const NullableStringField = Fields.union([
  Fields.string(),
  Fields.null()
]);

// 或使用便捷方法
const SameField = Fields.string().nullable();
```

</div>

#### Fields.void()

undefined 类型。

<div class="code-example">

```typescript
const VoidField = Fields.void();

// 可选字段的另一种表示
const OptionalField = Fields.union([
  Fields.string(),
  Fields.void()
]);
```

</div>

---

## 🔗 高级方法

### 条件验证

#### .when()

基于其他字段的条件验证。

<div class="code-example">

```typescript
const ItemSchema = Schema.define({
  type: Fields.enum(['weapon', 'armor', 'consumable']),
  
  damage: Fields.number().when('type', {
    is: 'weapon',
    then: Fields.number().min(1).required(),
    otherwise: Fields.number().optional()
  }),
  
  // 多条件
  durability: Fields.number().when('type', {
    is: ['weapon', 'armor'],
    then: Fields.number().min(1).max(100),
    otherwise: Fields.void()
  }),
  
  // 复杂条件
  specialEffect: Fields.string().when('type', {
    is: (value) => value === 'weapon' || value === 'armor',
    then: Fields.string().optional(),
    otherwise: Fields.void()
  })
});
```

</div>

### 自定义验证

#### .refine()

添加自定义验证逻辑。

<div class="code-example">

```typescript
const PasswordField = Fields.string()
  .min(8)
  .refine(
    (password) => /[A-Z]/.test(password),
    '密码必须包含大写字母'
  )
  .refine(
    (password) => /[a-z]/.test(password),
    '密码必须包含小写字母'
  )
  .refine(
    (password) => /\d/.test(password),
    '密码必须包含数字'
  );

// 访问整个对象的验证
const CharacterSchema = Schema.define({
  level: Fields.number().min(1).max(100),
  experience: Fields.number().min(0)
}).refine(
  (data) => {
    const requiredExp = data.level * 100;
    return data.experience >= requiredExp;
  },
  {
    message: '经验值不足当前等级要求',
    path: ['experience'] // 错误路径
  }
);
```

</div>

#### .superRefine()

超级验证，支持多个错误。

<div class="code-example">

```typescript
const ComplexValidation = Schema.define({
  startDate: Fields.date(),
  endDate: Fields.date(),
  participants: Fields.array(Fields.string())
}).superRefine((data, ctx) => {
  // 日期验证
  if (data.endDate <= data.startDate) {
    ctx.addIssue({
      code: 'custom',
      message: '结束日期必须晚于开始日期',
      path: ['endDate']
    });
  }
  
  // 参与者验证
  if (data.participants.length === 0) {
    ctx.addIssue({
      code: 'custom',
      message: '至少需要一个参与者',
      path: ['participants']
    });
  }
  
  // 重复参与者检查
  const unique = new Set(data.participants);
  if (unique.size !== data.participants.length) {
    ctx.addIssue({
      code: 'custom',
      message: '参与者不能重复',
      path: ['participants']
    });
  }
});
```

</div>

### 数据转换

#### .transform()

转换验证后的数据。

<div class="code-example">

```typescript
// 字符串转换
const TrimmedString = Fields.string()
  .transform(s => s.trim())
  .transform(s => s.toLowerCase());

// 数值转换
const RoundedNumber = Fields.number()
  .transform(n => Math.round(n * 100) / 100); // 保留2位小数

// 复杂转换
const CharacterSchema = Schema.define({
  name: Fields.string(),
  level: Fields.number(),
  classId: Fields.number()
}).transform((data) => ({
  ...data,
  // 添加计算属性
  displayName: `${data.name} (Lv.${data.level})`,
  className: getClassName(data.classId),
  powerLevel: calculatePowerLevel(data.level)
}));
```

</div>

#### .preprocess()

预处理输入数据。

<div class="code-example">

```typescript
// 字符串预处理
const NumberFromString = Fields.number()
  .preprocess((val) => {
    if (typeof val === 'string') {
      const parsed = Number(val);
      return isNaN(parsed) ? val : parsed;
    }
    return val;
  });

// 日期预处理
const DateFromString = Fields.date()
  .preprocess((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  });
```

</div>

---

## 🛠️ 转换器 API

### CSV 转换器

<div class="code-example">

```typescript
import { Converters } from '@khgame/schema';

const csvConverter = new Converters.CSV(CharacterSchema, {
  delimiter: ',',           // 分隔符
  quote: '"',              // 引号字符
  headers: true,           // 第一行是否为标题
  skipEmptyLines: true,    // 跳过空行
  encoding: 'utf8'         // 文件编码
});

// 从文件读取
const characters = await csvConverter.fromFile('./characters.csv');

// 从字符串读取
const csvData = `id,name,level
1,勇者,10
2,法师,15`;
const parsed = csvConverter.fromString(csvData);

// 导出到文件
await csvConverter.toFile(characters, './output.csv', {
  headers: ['id', 'name', 'level'], // 自定义列顺序
  includeHeaders: true
});

// 导出为字符串
const csvString = csvConverter.toString(characters);
```

</div>

### Excel 转换器

<div class="code-example">

```typescript
const excelConverter = new Converters.Excel(CharacterSchema, {
  sheetName: '角色数据',
  headerStyle: {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '4472C4' } },
    alignment: { horizontal: 'center' }
  },
  dataStyle: {
    alignment: { horizontal: 'left' },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' }
    }
  }
});

// 读取Excel文件
const data = await excelConverter.fromFile('./data.xlsx', {
  sheet: 0,              // 工作表索引或名称
  range: 'A1:D100',      // 读取范围
  skipRows: 1            // 跳过行数
});

// 导出Excel
await excelConverter.toFile(characters, './output.xlsx', {
  autoWidth: true,       // 自动调整列宽
  freezeHeaders: true,   // 冻结标题行
  filters: true          // 添加筛选器
});
```

</div>

### JSON 转换器

<div class="code-example">

```typescript
const jsonConverter = new Converters.JSON(CharacterSchema, {
  pretty: true,          // 格式化输出
  indent: 2,             // 缩进空格数
  dateFormat: 'iso',     // 日期格式: 'iso' | 'timestamp' | 'locale'
  removeNulls: false     // 移除null值
});

// 解析JSON
const characters = jsonConverter.parse(jsonString);

// 序列化
const jsonString = jsonConverter.stringify(characters);

// 从文件读取
const data = await jsonConverter.fromFile('./data.json');

// 写入文件
await jsonConverter.toFile(characters, './output.json');
```

</div>

### 数据库转换器

<div class="code-example">

```typescript
const dbConverter = new Converters.Database(CharacterSchema, {
  tableName: 'characters',
  dialect: 'mysql',       // 'mysql' | 'postgresql' | 'sqlite'
  keyMapping: {           // 字段映射
    'id': 'character_id',
    'name': 'display_name'
  }
});

// 生成建表SQL
const createTableSQL = dbConverter.generateCreateTable();

// 生成插入SQL
const insertSQL = dbConverter.generateInsert(characters);

// 生成更新SQL
const updateSQL = dbConverter.generateUpdate(character, { id: 1 });

// 解析查询结果
const characters = dbConverter.parseQueryResult(queryResults);
```

</div>

---

## 🎯 验证错误 API

### ValidationError

验证错误的详细信息。

<div class="code-example">

```typescript
try {
  CharacterSchema.parse(invalidData);
} catch (error) {
  if (error instanceof Schema.ValidationError) {
    // 错误详情
    console.log(error.message);     // 主错误信息
    console.log(error.errors);      // 所有错误数组
    console.log(error.path);        // 错误路径
    console.log(error.code);        // 错误代码
    
    // 格式化错误
    const formatted = error.format();
    console.log(formatted);
    
    // 错误映射
    const errorMap = error.flatten();
    console.log(errorMap.fieldErrors);
    console.log(errorMap.formErrors);
    
    // 自定义错误处理
    error.errors.forEach(issue => {
      console.log(`字段 ${issue.path.join('.')}: ${issue.message}`);
    });
  }
}
```

</div>

### 错误类型

```typescript
interface ValidationIssue {
  code: string;           // 错误代码
  path: (string | number)[]; // 错误路径
  message: string;        // 错误信息
  expected?: string;      // 期望类型
  received?: string;      // 实际类型
  value?: any;           // 错误值
}
```

---

## ⚙️ 配置 API

### 全局配置

<div class="code-example">

```typescript
import { Schema } from '@khgame/schema';

Schema.configure({
  // 错误消息配置
  errorMap: {
    required: '字段不能为空',
    invalid_type: '数据类型错误',
    too_small: '值太小',
    too_big: '值太大'
  },
  
  // 性能配置
  performance: {
    caching: true,         // 启用缓存
    precompile: true,      // 预编译模式
    batchSize: 1000       // 批处理大小
  },
  
  // 开发配置
  development: {
    strict: false,         // 严格模式
    warnings: true,        // 显示警告
    debugging: false       // 调试模式
  }
});
```

</div>

### 环境配置

<div class="code-example">

```typescript
// 开发环境
if (process.env.NODE_ENV === 'development') {
  Schema.configure({
    development: {
      strict: false,
      warnings: true,
      debugging: true
    },
    performance: {
      caching: false
    }
  });
}

// 生产环境
if (process.env.NODE_ENV === 'production') {
  Schema.configure({
    development: {
      strict: true,
      warnings: false,
      debugging: false
    },
    performance: {
      caching: true,
      precompile: true
    }
  });
}
```

</div>

---

## 🔧 工具函数

### 类型工具

<div class="code-example">

```typescript
import { Schema, type TypeOf, type Input, type Output } from '@khgame/schema';

const CharacterSchema = Schema.define({
  id: Fields.number(),
  name: Fields.string().transform(s => s.toUpperCase()),
  level: Fields.number().default(1)
});

// 提取类型
type Character = TypeOf<typeof CharacterSchema>;
// { id: number; name: string; level: number }

type CharacterInput = Input<typeof CharacterSchema>;
// { id: number; name: string; level?: number }

type CharacterOutput = Output<typeof CharacterSchema>;
// { id: number; name: string; level: number } (name被转换为大写)
```

</div>

### 模式工具

<div class="code-example">

```typescript
// 检查模式兼容性
const isCompatible = Schema.isCompatible(SchemaA, SchemaB);

// 合并模式
const MergedSchema = Schema.merge(BaseSchema, ExtendSchema);

// 模式分析
const analysis = Schema.analyze(ComplexSchema);
console.log(analysis.depth);        // 嵌套深度
console.log(analysis.fieldCount);   // 字段数量
console.log(analysis.complexity);   // 复杂度评分

// 生成示例数据
const sampleData = Schema.generateSample(CharacterSchema, {
  count: 10,           // 生成数量
  seed: 12345,         // 随机种子
  locale: 'zh-CN'      // 本地化设置
});
```

</div>

### 调试工具

<div class="code-example">

```typescript
// 启用调试
Schema.debug(true);

// 性能分析
const profiler = Schema.createProfiler();
profiler.start('validation');

CharacterSchema.parse(data);

const metrics = profiler.end('validation');
console.log(`验证耗时: ${metrics.duration}ms`);

// 模式可视化
const visualization = Schema.visualize(CharacterSchema, {
  format: 'svg',       // 'svg' | 'png' | 'json'
  theme: 'dark',       // 'light' | 'dark'
  showTypes: true,     // 显示类型信息
  showValidators: true // 显示验证器
});
```

</div>

---

## 💡 最佳实践

### 模式组织

<div class="callout callout-success">
<strong>💡 建议</strong><br>
将复杂的模式拆分为更小的、可重用的组件，使用模块化的方式组织代码。
</div>

<div class="code-example">

```typescript
// schemas/common.ts
export const BaseEntitySchema = Schema.define({
  id: Fields.number().positive(),
  createdAt: Fields.date().default(() => new Date()),
  updatedAt: Fields.date().default(() => new Date())
});

export const NamedEntitySchema = BaseEntitySchema.extend({
  name: Fields.string().min(1).max(100),
  description: Fields.string().optional()
});

// schemas/character.ts
export const CharacterStatsSchema = Schema.define({
  hp: Fields.number().min(1),
  mp: Fields.number().min(0),
  attack: Fields.number().min(1),
  defense: Fields.number().min(0),
  speed: Fields.number().min(1)
});

export const CharacterSchema = NamedEntitySchema.extend({
  level: Fields.number().min(1).max(100),
  experience: Fields.number().min(0),
  stats: CharacterStatsSchema,
  classId: Fields.number().positive()
});

// schemas/index.ts
export * from './common';
export * from './character';
export * from './equipment';
export * from './skill';
```

</div>

### 错误处理

<div class="code-example">

```typescript
// 统一错误处理
function validateGameData<T>(schema: Schema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof Schema.ValidationError) {
      // 记录详细错误
      logger.error('数据验证失败', {
        errors: error.errors,
        data: data
      });
      
      // 提供用户友好的错误信息
      const userMessage = formatUserError(error);
      throw new UserFriendlyError(userMessage);
    }
    throw error;
  }
}

function formatUserError(error: Schema.ValidationError): string {
  const fieldErrors = error.flatten().fieldErrors;
  const messages = Object.entries(fieldErrors).map(
    ([field, errors]) => `${field}: ${errors.join(', ')}`
  );
  return `配置错误: ${messages.join('; ')}`;
}
```

</div>

### 性能优化

<div class="code-example">

```typescript
// 预编译常用模式
const CompiledCharacterSchema = Schema.compile(CharacterSchema);
const CompiledEquipmentSchema = Schema.compile(EquipmentSchema);

// 批量处理
async function processBatchData(rawData: unknown[]) {
  const batchSize = 1000;
  const results = [];
  
  for (let i = 0; i < rawData.length; i += batchSize) {
    const batch = rawData.slice(i, i + batchSize);
    const validated = CompiledCharacterSchema.parseArray(batch);
    results.push(...validated);
  }
  
  return results;
}

// 缓存验证结果
const validationCache = new Map();

function cachedValidate<T>(schema: Schema<T>, data: unknown): T {
  const key = JSON.stringify(data);
  
  if (validationCache.has(key)) {
    return validationCache.get(key);
  }
  
  const result = schema.parse(data);
  validationCache.set(key, result);
  return result;
}
```

</div>

<div class="grid">
  <div class="grid-item">
    <h3>🏗️ 下一步</h3>
    <p>查看 <a href="./examples">游戏示例</a> 学习实际应用</p>
  </div>
  
  <div class="grid-item">
    <h3>❓ 疑问</h3>
    <p>参考 <a href="./faq">FAQ</a> 解决常见问题</p>
  </div>
  
  <div class="grid-item">
    <h3>💬 讨论</h3>
    <p>加入 <a href="https://discord.gg/schema-gaming">Discord</a> 社区</p>
  </div>
  
  <div class="grid-item">
    <h3>🐛 反馈</h3>
    <p>在 <a href="https://github.com/khgame/schema">GitHub</a> 提交问题</p>
  </div>
</div> 