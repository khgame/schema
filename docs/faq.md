---
layout: default
title: FAQ
nav_order: 6
description: "Frequently asked questions and troubleshooting"
---

# FAQ 💡
{: .no_toc }

Frequently asked questions and troubleshooting.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## General Questions

### What is Schema designed for?

Schema is specifically designed for **game development** where you need to process large amounts of configuration data from spreadsheets (Excel/CSV) into strongly-typed JavaScript objects. It's perfect for:

- Character stats and progression tables
- Item databases and loot tables  
- Skill trees and ability definitions
- Level configuration and procedural generation data
- Economic systems and resource management

### How is Schema different from other validation libraries?

Schema is **game-focused** with features specifically for game development:

- **Tabular data processing**: Designed for CSV/Excel import workflows
- **Game-specific types**: Built-in support for enums, optional fields, nested structures
- **Batch processing**: Efficient handling of thousands of rows
- **Error reporting**: Detailed error stacks with row/column information
- **Context system**: External enum definitions for referential integrity

### Can I use Schema in production?

Yes! Schema is designed for production use with:

- **High performance**: 10,000+ rows/second processing
- **Memory efficiency**: Streaming support for large datasets
- **Detailed error reporting**: Production-ready error handling
- **Type safety**: Full TypeScript support

---

## Schema Definition

### How do I define optional fields?

Use the `?` suffix to make any field optional:

```typescript
const schema = parseSchema([
  'id',              // Required
  'name',            // Required
  'description?',    // Optional
  'level'            // Required
]);

// Works with: [1, 'Hero'] (missing description)
// And with: [1, 'Hero', 'A brave warrior', 10]
```

### How do I create nested objects?

Use `{}` braces to define object structures:

```typescript
const schema = parseSchema([
  'character_id',
  'stats', '{',      // Start nested object
    'hp',
    'attack', 
    'defense',
  '}',               // End nested object
  'level'
]);

// Converts: [1, 100, 50, 30, 10]
// To: { character_id: 1, stats: { hp: 100, attack: 50, defense: 30 }, level: 10 }
```

### How do I define arrays?

Use `[]` brackets to define array structures:

```typescript
// Simple array
const schema = parseSchema([
  'character_id',
  'skills', '[', 'uint', ']'  // Array of unsigned integers
]);

// Array of objects
const schema = parseSchema([
  'character_id', 
  'inventory', '[',
    '{',
      'item_id', 'quantity',
    '}',
  ']'
]);
```

### What types are supported?

Schema supports all common game data types:

| Type | Aliases | Use Case |
|------|---------|----------|
| `uint` | `@`, `tid` | IDs, counts, positive numbers |
| `int` | `long` | Signed numbers, damage values |  
| `float` | `double`, `number` | Decimal values, rates |
| `ufloat` | `count` | Positive decimals, percentages |
| `string` | `str` | Names, descriptions |
| `boolean` | `bool`, `onoff` | Flags, switches |
| `enum` | - | Predefined choices |

### How do I use enums?

Define enums inline or with context:

```typescript
// Inline enum
const schema = parseSchema([
  'id',
  'enum<common|rare|epic|legendary>'
]);

// Context-based enum (recommended)
const context = {
  enums: {
    Rarity: { COMMON: 1, RARE: 2, EPIC: 3, LEGENDARY: 4 }
  }
};

const schema = parseSchema([
  'id',
  'enum<Rarity>'
], context);
```

---

## Data Conversion

### How do I convert a single row of data?

Use `SchemaConvertor.convert()`:

```typescript
const schema = parseSchema(['id', 'name', 'level']);
const convertor = new SchemaConvertor(schema);

const result = convertor.convert([1, 'Hero', 10]);
console.log(result); // { id: 1, name: 'Hero', level: 10 }
```

### How do I process multiple rows (CSV data)?

Use `exportJson()` for batch processing:

```typescript
import { exportJson } from '@khgame/schema';

const schema = parseSchema(['id', 'name', 'level']);
const headers = ['id', 'name', 'level'];
const csvData = [
  [1, 'Hero A', 10],
  [2, 'Hero B', 15],
  [3, 'Hero C', 20]
];

const results = exportJson(schema, headers, csvData);
```

### How do I handle validation errors?

Use `validate()` for non-throwing validation:

```typescript
const convertor = new SchemaConvertor(schema);
const [isValid, result] = convertor.validate(data);

if (isValid) {
  console.log('Success:', result);
} else {
  console.log('Validation failed:', result);
}
```

### How do I process very large datasets?

Process data in chunks to avoid memory issues:

```typescript
async function processLargeCSV(data: any[][]) {
  const chunkSize = 1000;
  const results = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const converted = exportJson(schema, headers, chunk);
    results.push(...converted);
    
    // Yield to event loop every 5000 rows
    if (i % 5000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return results;
}
```

---

## Common Issues

### "TypeError: type error" - What does this mean?

This error occurs when data doesn't match the expected type. The error message includes details about what was expected vs. what was received:

```typescript
// Schema expects uint, but gets string
const schema = parseSchema(['id', 'level']);
try {
  const result = convertor.convert([1, 'not_a_number']);
} catch (error) {
  console.log(error.message); // Shows expected uint, got string
}
```

**Solutions:**
- Check your CSV data for unexpected values
- Ensure numbers aren't quoted as strings
- Use optional fields (`?`) if some data might be missing

### Empty or null values in arrays

Arrays ignore empty values by default. Use `$strict` decorator for validation:

```typescript
// Normal array: ignores empty values
const normalSchema = parseSchema([
  'rewards', '[', 'uint', ']'
]);

// Strict array: validates all values
const strictSchema = parseSchema([
  '$strict', 'rewards', '[', 'uint', ']'
]);
```

### Nested object becomes undefined

This happens when all fields in a `$ghost` object are empty:

```typescript
const schema = parseSchema([
  'id',
  '$ghost', 'optional_stats', '{',
    'bonus_hp?',
    'bonus_attack?'
  '}'
]);

// If both bonus fields are empty, optional_stats becomes undefined
```

This is by design - remove `$ghost` if you always want the object.

### Performance issues with large datasets

**Common causes:**
- Processing all data at once instead of chunks
- Creating new convertors for each row
- Not reusing schema instances

**Solutions:**
```typescript
// ✅ Good: Reuse convertor, process in chunks
const convertor = new SchemaConvertor(schema);
const processInChunks = (data) => {
  // ... chunk processing logic
};

// ❌ Bad: New convertor each time
data.forEach(row => {
  const convertor = new SchemaConvertor(schema); // Don't do this!
  convertor.convert(row);
});
```

---

## Advanced Usage

### Can I create custom data types?

Yes, extend the `Convertor` class:

```typescript
import { Convertor, ConvertResult } from '@khgame/schema';

class DateConvertor extends Convertor {
  validate(value: any): ConvertResult {
    if (typeof value === 'string') {
      const date = new Date(value);
      return [!isNaN(date.getTime()), date];
    }
    return [false, value];
  }
}
```

### How do I handle different data formats per field?

Use union types with `|`:

```typescript
const schema = parseSchema([
  'id',
  'value',           // Auto-detects type
  'string|uint',     // Explicit union: accepts string OR uint
  'float|string'     // Accepts float OR string
]);
```

### Can I validate data without converting?

Yes, use the `validate()` method:

```typescript
const convertor = new SchemaConvertor(schema);

// Only validate, don't convert
const [isValid, result] = convertor.validate(data);

if (isValid) {
  // Data is valid, result contains converted data
  saveToDatabase(result);
} else {
  // Data is invalid, result contains error information
  logValidationErrors(result);
}
```

### How do I debug schema parsing issues?

Inspect the parsed schema structure:

```typescript
const schema = parseSchema(['id', 'stats', '{', 'hp', 'mp', '}']);

console.log('Schema type:', schema.sdmType);
console.log('Number of marks:', schema.marks.length);
console.log('Schema string:', schema.toSchemaStr());
console.log('Schema JSON:', JSON.stringify(schema.toSchemaJson(), null, 2));
```

---

## Integration

### How do I integrate with Excel/CSV imports?

Here's a complete example:

```typescript
import * as XLSX from 'xlsx';
import { parseSchema, exportJson } from '@khgame/schema';

// Read Excel file
const workbook = XLSX.readFile('characters.xlsx');
const worksheet = workbook.Sheets['Characters'];
const csvData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// Extract headers and data
const [headers, ...rows] = csvData;

// Define schema
const schema = parseSchema([
  'id', 'name', 'class', 'level',
  'stats', '{', 'hp', 'attack', 'defense', '}'
]);

// Convert data
const characters = exportJson(schema, headers, rows);
```

### How do I use Schema with TypeScript?

Schema has full TypeScript support:

```typescript
import { parseSchema, SchemaConvertor, IContext } from '@khgame/schema';

interface Character {
  id: number;
  name: string;
  level: number;
  stats: {
    hp: number;
    attack: number;
    defense: number;
  };
}

const schema = parseSchema([
  'id', 'name', 'level',
  'stats', '{', 'hp', 'attack', 'defense', '}'
]);

const convertor = new SchemaConvertor(schema);
const character: Character = convertor.convert(rawData);
```

### Can I use Schema in Node.js servers?

Absolutely! Schema works great for server-side data processing:

```typescript
import express from 'express';
import { parseSchema, exportJson } from '@khgame/schema';

const app = express();

app.post('/upload-characters', (req, res) => {
  try {
    const { data } = req.body; // CSV data from client
    const schema = parseSchema(characterSchema);
    const characters = exportJson(schema, headers, data);
    
    // Save to database
    await saveCharacters(characters);
    
    res.json({ success: true, count: characters.length });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

Still have questions? Join our [Discord community](https://discord.gg/gamedev) or check out the [GitHub discussions](https://github.com/khgame/schema/discussions)! 🎮 