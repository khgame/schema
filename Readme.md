# @Khgame/schema

[![Build Status](https://travis-ci.org/khgame/schema.svg?branch=master)](https://travis-ci.org/khgame/schema)
[![Github Releases](https://img.shields.io/npm/dm/@khgame/schema.svg)](https://github.com/khgame/schema)
[![Github Releases](https://img.shields.io/npm/l/@khgame/schema.svg)](https://github.com/khgame/schema)
[![Github Releases](https://img.shields.io/npm/v/@khgame/schema.svg)](https://github.com/khgame/schema)

## design

### schema

#### names

- SDM: Structure Description Mark
- TDM: Type Description Mark
- MD: Mark Decorator
- TSeg: Type Description Mark Segment

### definition

```yaml
Schema: Mark+
Mark: SDM | TDM
SDM: (<MD* '['> Schema ']') | (<MD* '{'> Schema '}')
TDM: <MD* TSeg>
TSeg: TNode ('|' TNode)*
TNode: TName '<' TSeg '>' 
MD: /\$[a-zA-Z0-9_\-]+/
TName: /[a-zA-Z_][a-zA-Z0-9_]*/
```
