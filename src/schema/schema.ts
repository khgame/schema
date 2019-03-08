export class Schema {
    constructor(public readonly decorators: string[], public readonly typeObjects: SchemaNode[]) {
    }

    public toSchemaStr() {
        return `${this.typeObjects.reduce((prev, tObj) => prev + "|" + tObj.toSchemaStr(), "").substr(1)}`;
    }
}

export class SchemaNode {
    constructor(public readonly typeName: string, public readonly templateTypeObjects: SchemaNode[] = []) {
    }

    public toSchemaStr() {
        if (!this.typeName) {
            throw new Error("the type dose not exit");
        }
        const templateArgStr: string = this.templateTypeObjects.reduce((prev, tObj) => prev + "|" + tObj.toSchemaStr(), "").substr(1);
        return templateArgStr ? `${this.typeName}<${templateArgStr}>` : `${this.typeName}`;
    }
}
