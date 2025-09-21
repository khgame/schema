# Schema Framework

类型安全的游戏数值配置解析与转换工具集。

[![npm version](https://badge.fury.io/js/%40khgame%2Fschema.svg)](https://badge.fury.io/js/%40khgame%2Fschema)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## 核心能力

- **类型校验**：支持泛型、联合、可选、装饰器（`$ghost`、`$strict`）等标记，构建严谨的配置描述。
- **软失败转换**：所有 `convert/validate` 返回 `ConvertResult { ok, value, errors }`；默认累计错误，`{ failFast: true }` 时即时抛出。
- **路径追踪**：错误项包含 `path`、`raw`、`cause` 等字段，可直接用于收敛配置问题。
- **数据导出**：`exportJson` 按列描述重建嵌套对象/数组结构，并提供原地错误日志。
- **覆盖完善**：项目内置完整单测（`npm test`），当前语句和函数覆盖率接近 100%。

## 返回结果模型

基础、模板、结构级转换器均实现统一的 `ConvertResult<T>`：

```ts
interface ConvertResult<T = unknown> {
  ok: boolean;
  value?: T;
  errors: Array<{
    message: string;
    path?: Array<string | number>;
    raw?: unknown;
    cause?: unknown;
  }>;
}

const result = convertor.convert(value, { failFast: false });
if (!result.ok) {
  result.errors.forEach(err => report(err.path, err.message));
}
```

当需要快速定位首个失败时，传入 `{ failFast: true }` 即可抛出 `TypeError`，同时在异常对象上读取 `convertErrors` 获取具体列表。

## 快速开始

### 安装

```bash
npm install @khgame/schema
# 或
yarn add @khgame/schema
```

### 基础用法

```typescript
import { Schema, Fields } from '@khgame/schema';

// 定义英雄角色配置
const HeroSchema = Schema.define({
  id: Fields.number().positive(),
  name: Fields.string().min(2).max(20),
  level: Fields.number().min(1).max(100),
  attributes: Schema.define({
    hp: Fields.number().min(1),
    attack: Fields.number().min(1),
    defense: Fields.number().min(0),
    speed: Fields.number().min(1)
  }),
  skills: Fields.array(Fields.number()).max(4),
  rarity: Fields.enum(['common', 'rare', 'epic', 'legendary'])
});

// 验证和解析数据
const hero = HeroSchema.parse({
  id: 1,
  name: "龙骑士",
  level: 25,
  attributes: {
    hp: 1500,
    attack: 320,
    defense: 180,
    speed: 85
  },
  skills: [101, 102, 105],
  rarity: "epic"
});

// 类型安全！
console.log(hero.name); // string
console.log(hero.attributes.hp); // number
```

### 数据格式转换

```typescript
import { Converters } from '@khgame/schema';

// CSV 转换
const csvConverter = new Converters.CSV(HeroSchema);
const heroes = await csvConverter.fromFile('./heroes.csv');

// Excel 导出
const excelConverter = new Converters.Excel(HeroSchema);
await excelConverter.toFile(heroes, './heroes.xlsx', {
  sheetName: '英雄数据',
  formatting: { headers: { bold: true } }
});
```

## 文档

详细说明见 [https://khgame.github.io/schema](https://khgame.github.io/schema)。

- [快速开始](https://khgame.github.io/schema/quick-start) - 5分钟上手指南
- [核心概念](https://khgame.github.io/schema/concepts) - 深入理解框架设计
- [API 文档](https://khgame.github.io/schema/api) - 完整的API参考
- [游戏示例](https://khgame.github.io/schema/examples) - 实际游戏项目案例
- [常见问题](https://khgame.github.io/schema/faq) - 问题解答

## 游戏场景示例

### 卡牌游戏

```typescript
const CardSchema = Schema.define({
  id: Fields.number(),
  name: Fields.string(),
  cost: Fields.number().min(0).max(10),
  attack: Fields.number().min(0),
  health: Fields.number().min(1),
  rarity: Fields.enum(['common', 'rare', 'epic', 'legendary']),
  cardType: Fields.enum(['minion', 'spell', 'weapon']),
  mechanics: Fields.array(Fields.string()).default([])
});
```

### MMORPG 装备系统

```typescript
const EquipmentSchema = Schema.define({
  id: Fields.number(),
  name: Fields.string(),
  type: Fields.enum(['weapon', 'armor', 'accessory']),
  level: Fields.number().min(1).max(100),
  attributes: Fields.record(Fields.number()),
  requirements: Schema.define({
    level: Fields.number().min(1),
    class: Fields.enum(['warrior', 'mage', 'archer']).optional()
  }),
  enhancement: Schema.define({
    level: Fields.number().min(0).max(15).default(0),
    success_rate: Fields.number().min(0).max(1)
  }).optional()
});
```

### 策略游戏建筑

```typescript
const BuildingSchema = Schema.define({
  id: Fields.number(),
  name: Fields.string(),
  type: Fields.enum(['residential', 'military', 'economic', 'special']),
  cost: Schema.define({
    wood: Fields.number().min(0),
    stone: Fields.number().min(0),
    gold: Fields.number().min(0)
  }),
  buildTime: Fields.number().min(1), // 秒
  population: Fields.number().min(0),
  effects: Fields.array(Schema.define({
    type: Fields.string(),
    value: Fields.number()
  })).default([])
});
```

## 开发

### 本地开发

```bash
# 克隆项目
git clone https://github.com/khgame/schema.git
cd schema

# 安装依赖
npm install

# 运行测试
npm test

# 构建项目
npm run build

# 启动文档开发服务器
cd docs
bundle install
bundle exec jekyll serve

# 覆盖率报告
npx nyc report --reporter=text-summary
```

### 项目结构

```
schema/
├── src/                 # 源代码
├── tests/               # 测试文件
├── docs/                # 文档站点
├── examples/            # 示例代码
└── packages/            # 子包
```

## 🤝 贡献

我们欢迎所有形式的贡献！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

查看 [贡献指南](CONTRIBUTING.md) 了解更多详情。

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🌟 支持项目

如果这个项目对你有帮助，请给我们一个 ⭐️！

## 📞 联系我们

- 💬 [Discord 社区](https://discord.gg/schema-gaming)
- 🐛 [问题反馈](https://github.com/khgame/schema/issues)
- 📧 [邮件联系](mailto:team@khgame.com)

---

<div align="center">
  <sub>Built with ❤️ by the KHGame team</sub>
</div>
