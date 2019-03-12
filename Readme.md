# @Khgame/schema

[![Build Status](https://travis-ci.org/khgame/schema.svg?branch=master)](https://travis-ci.org/khgame/schema)
[![Github Releases](https://img.shields.io/npm/dm/@khgame/schema.svg)](https://github.com/khgame/schema)
[![Github Releases](https://img.shields.io/npm/l/@khgame/schema.svg)](https://github.com/khgame/schema)
[![Github Releases](https://img.shields.io/npm/v/@khgame/schema.svg)](https://github.com/khgame/schema)

## design

### definition

#### names

- Mark: what filled in a mark line slot
- SDM: **S**tructure **D**escription **M**ark
- TDM: **T**ype **D**escription **M**ark
- ArrSDM: SDM that presented an array `[...]`
- ObjSDM: SDM that presented an object `{...}`
- MD: **M**ark **D**ecorator
- TSeg: Types segment
- TName: Type name


```yaml
Schema: Mark+
Mark: SDM | TDM
SDM: ArrSDM | ObjSDM
ArrSDM: <MD* '['> Schema ']'
ObjSDM: <MD* '{'> Schema '}'
TDM: <MD* TSeg>
TSeg: TNode ('|' TNode)*
TNode: TName '<' TSeg '>' 
MD: /\$[a-zA-Z0-9_\-]+/
TName: /[a-zA-Z_][a-zA-Z0-9_]*/
```

### decorators

#### ArrSDM

- $strict
- $ghost

#### ObjSDM

- $ghost

#### TDM

*(none)*