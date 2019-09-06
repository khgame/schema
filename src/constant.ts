export const SupportedTypes = {
    None: "none",
    String: "string",
    Float: "float",
    UFloat: "ufloat",
    Int: "int",
    UInt: "uint",
    Boolean: "boolean",
    Undefined: "undefined",
    Any: "any", // not recommend
    Pair: "pair", // not recommend
    Array: "array", // not recommend
    Enum: "enum",
};

export const AliasTable = {
    [SupportedTypes.String]: [SupportedTypes.String, "str"],
    [SupportedTypes.Float]: [SupportedTypes.Float, "double", "single", "num", "number"],
    [SupportedTypes.UFloat]: [SupportedTypes.UFloat, "count"],
    [SupportedTypes.Int]: [SupportedTypes.Int, "int", "int8", "int16", "int32", "int64", "long"],
    [SupportedTypes.UInt]: [SupportedTypes.UInt, "uint", "uint8", "uint16", "uint32", "uint64", "ulong", "tid", "@"],
    [SupportedTypes.Boolean]: [SupportedTypes.Boolean, "bool", "onoff"],
    [SupportedTypes.Undefined]: [SupportedTypes.Undefined],
    [SupportedTypes.Any]: [SupportedTypes.Any, "dynamic", "object", "obj", "any"],
    [SupportedTypes.Pair]: [SupportedTypes.Pair],
    [SupportedTypes.Array]: [SupportedTypes.Array],
    [SupportedTypes.Enum]: [SupportedTypes.Enum],
};

export const TrueType = ["true", "t", "yes", "y", "on", "ok"];
