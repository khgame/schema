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

export function filterDecorators(markStr: string) {
    return {
        decorators: markStr.match(/\$[a-zA-Z0-9_]+/g) || [],
        strLeft: markStr.replace(/\$[a-zA-Z0-9_]+/g, "").trim(),
    };
}

export function parseMark(markStr: string) {
    const {decorators, strLeft} = filterDecorators(markStr);
    const typeObjects = analyzeTypeSegment(strLeft);
    return new Schema(decorators, typeObjects);
}

export function analyzeTypeSegment(typeSegment: string) {
    const optional = false;
    if (typeSegment.endsWith("?")) {
        typeSegment = typeSegment.substring(0, typeSegment.length - 1);
    }
    const typeGroupStr = typeSegment.trim();
    if (!typeGroupStr) {
        throw new Error("typeGroup not exist");
    }
    const typeObjs: SchemaNode[] = typeGroupStr.split("|")
        .map(getTypeObject);
    if (optional) {
        typeObjs.push(new SchemaNode(SupportedTypes.Undefined));
    }
    return typeObjs;
}

export function catchTemplate(typeStr: string) {
    typeStr = typeStr.trim();
    const leftAngle = typeStr.indexOf("<");
    const rightAngle = typeStr[typeStr.length - 1] === ">" ? typeStr.length - 1 : -1;
    if (leftAngle >= 0 && rightAngle >= 0) {
        return {
            typeNameAlias: typeStr.substr(0, leftAngle).trim(),
            templateTypes: analyzeTypeSegment(typeStr.substr(leftAngle + 1, rightAngle - leftAngle - 1)),
        };
    } else if (leftAngle >= 0 || rightAngle >= 0) {
        throw new Error(`getTypeName error : angle not match ${typeStr}`);
    }
    return {
        typeNameAlias: typeStr.trim(),
        templateTypes: [],
    };
}

export function getTypeObject(typeStr: string) {
    const template = catchTemplate(typeStr.toLowerCase());
    return new SchemaNode(
        getTypeNameByAlias(template.typeNameAlias),
        template.templateTypes,
    );
}
