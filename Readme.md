# @Khgame/schema

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
