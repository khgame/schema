import {SupportedTypes} from "../constant";

function nodeGroupToSchemaStr(nodes: SchemaNode[]) {
    return nodes.reduce(
        (prev, tObj) => prev + (tObj.typeName === SupportedTypes.Undefined ? "?" : ("|" + tObj.toSchemaStr()))
        , "",
    ).substr(1);
}

export class SchemaNodeGroup {

    constructor(public readonly nodes: SchemaNode[]) {

    }

    public inner(index: number): SchemaNode {
        return this.nodes[index];
    }

    public get innerCount(): number {
        return this.nodes.length;
    }

}

export class Schema extends SchemaNodeGroup {
    constructor(public readonly decorators: string[], public readonly nodes: SchemaNode[]) {
        super(nodes);
    }

    public toSchemaStr() {
        return `${
            this.decorators.reduce((prev, cur) => prev + " " + cur, "")} ${
            nodeGroupToSchemaStr(this.nodes)}`;
    }
}

export class SchemaNode extends SchemaNodeGroup {
    constructor(public readonly typeName: string, public readonly nodes: SchemaNode[] = []) {
        super(nodes);
    }

    public toSchemaStr() {
        if (!this.typeName) {
            throw new Error("the type dose not exit");
        }
        const templateArgStr: string = nodeGroupToSchemaStr(this.nodes);
        return templateArgStr ? `${this.typeName}<${templateArgStr}>` : `${this.typeName}`;
    }
}
