/**
 * schema rule:
 *
 * Mark => [Decorators] TypeSegment
 * Decorators => Decorator[<'|'>Decorators]
 * TypeSegment => [TypeGroup][<'?'>]
 * TypeGroup => Type[<'|'>TypeGroup]
 * Type => TypeName[<'<'>TypeGroup<'>'>]
 * Decorator => <'$'>Identity
 * Type => Identity
 */

import {AliasTable, SupportedTypes} from "../constant";
import {Schema, SchemaNode} from "./schema";

function reverseAlias() {
    const ret: { [typeStr: string]: string } = {};
    for (const key in AliasTable) {
        AliasTable[key].forEach((a) => {
            ret[a] = key;
        });
    }
    return ret;
}

export const reverseAliasTable = reverseAlias();

export function getTypeNameByAlias(typeNameAlias: string) {
    return reverseAliasTable[typeNameAlias] || SupportedTypes.None;
}

export function parseDecorators(markStr: string) {
    return {
        decorators: markStr.match(/\$[a-zA-Z0-9_]+/g) || [],
        strLeft: markStr.replace(/\$[a-zA-Z0-9_]+/g, "").trim(),
    };
}

export function parseMark(markStr: string): Schema {
    const {decorators, strLeft} = parseDecorators(markStr);
    const typeObjects = parseTypeSegment(strLeft);
    return new Schema(decorators, typeObjects);
}

export function parseTypeSegment(typeSegment: string): SchemaNode[] {
    let optional = false;
    if (!typeSegment) {
        return [];
    }

    if (typeSegment[typeSegment.length - 1] === "?") {
        typeSegment = typeSegment.substring(0, typeSegment.length - 1);
        optional = true;
    }
    const typeGroupStr = typeSegment.trim();

    const splitorPoses: Array<[number, number]> = [];
    for (let i = 0, depth = 0; i < typeGroupStr.length; i++) {
        switch (typeGroupStr[i]) {
            case "<":
                depth += 1;
                break;
            case ">":
                depth -= 1;
                break;
            case "|":
                if (depth === 0) {
                    splitorPoses.push([
                        splitorPoses.length > 0 ? splitorPoses[splitorPoses.length - 1][1] + 1 : 0,
                        i,
                    ]);
                }
                break;
        }
    }
    splitorPoses.push([
            splitorPoses.length > 0 ? splitorPoses[splitorPoses.length - 1][1] + 1 : 0,
            typeGroupStr.length,
        ],
    );

    if (!typeGroupStr) {
        throw new Error("typeGroup not exist");
    }
    const typeObjs: SchemaNode[] = splitorPoses.map(
        (splitorPos) => parseSchemaNode(typeGroupStr.substr(...splitorPos)),
    );
    if (optional) {
        typeObjs.push(new SchemaNode(SupportedTypes.Undefined));
    }
    return typeObjs;
}

export function parseTemplate(typeStr: string)
    : { typeNameAlias: string, templateTypes: SchemaNode[] } {
    typeStr = typeStr.trim();
    const leftAngle = typeStr.indexOf("<");
    const rightAngle = typeStr[typeStr.length - 1] === ">" ? typeStr.length - 1 : -1;
    if (leftAngle >= 0 && rightAngle >= 0) {
        return {
            typeNameAlias: typeStr.substr(0, leftAngle).trim(),
            templateTypes: parseTypeSegment(typeStr.substr(leftAngle + 1, rightAngle - leftAngle - 1)),
        };
    } else if (leftAngle >= 0 || rightAngle >= 0) {
        throw new Error(`getTypeName error : angle not match ${typeStr} <(${leftAngle}) >(${rightAngle})`);
    }
    return {
        typeNameAlias: typeStr,
        templateTypes: [],
    };
}

export function parseSchemaNode(typeStr: string): SchemaNode {
    const template = parseTemplate(typeStr.toLowerCase());
    return new SchemaNode(
        getTypeNameByAlias(template.typeNameAlias),
        template.templateTypes,
    );
}
