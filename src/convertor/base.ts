export interface IConvertor {
    convert(v: any): any;

    validate(v: any): [boolean, any];
}

export abstract class Convertor implements IConvertor {
    public convert(v: any) {
        const validateRet = this.validate(v);
        if (validateRet[0]) {
            throw TypeError(`TypeError: type error ${v} => ${validateRet}`);
        }
        return validateRet[1];
    }

    public abstract validate(v: any): [boolean, any];
}
