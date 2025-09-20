import {expect} from "chai";
import "mocha";
import {
    TDMConvertor, 
    SDMConvertor, 
    SchemaConvertor,
    MarkConvertorResultToErrorStack,
    ISDMConvertResult
} from "../../src/convertor/schemaConvertor";
import {parseSchema} from "../../src/schema";
import {TDM} from "../../src/schema/typeDescriptionMark";

describe("Schema Convertor Complete Coverage", () => {

    describe("TDMConvertor", () => {
        describe("Constructor and inheritance", () => {
            it("should extend RichConvertor correctly", () => {
                const tdm = TDM.parse("uint");
                const convertor = new TDMConvertor(tdm);
                expect(convertor.tdm).to.equal(tdm);
            });
        });

        describe("convert method with error wrapping", () => {
            it("should wrap conversion errors with mark index", () => {
                const tdm = TDM.parse("uint");
                const convertor = new TDMConvertor(tdm);
                
                expect(() => {
                    convertor.convert("invalid_number");
                }).to.throw(/tdm\[\d+\]/); // Match any number since markInd is read-only
            });

            it("should pass through successful conversions", () => {
                const tdm = TDM.parse("uint");
                const convertor = new TDMConvertor(tdm);
                
                const result = convertor.convert("123");
                expect(result).to.equal(123);
            });
        });
    });

    describe("MarkConvertorResultToErrorStack", () => {
        it("should return undefined when result is successful", () => {
            const successResult: [boolean, ISDMConvertResult | undefined] = [true, {}];
            const errorStack = MarkConvertorResultToErrorStack(successResult);
            expect(errorStack).to.be.undefined;
        });

        it("should return __UNDEFINED__ when convertResults is undefined", () => {
            const failResult: [boolean, ISDMConvertResult | undefined] = [false, undefined];
            const errorStack = MarkConvertorResultToErrorStack(failResult);
            expect(errorStack).to.equal("__UNDEFINED__");
        });

        it("should process simple error results", () => {
            const convertResults: ISDMConvertResult = {
                0: [false, "error_value"],
                1: [true, "success_value"],
                2: [false, "another_error"]
            };
            const failResult: [boolean, ISDMConvertResult | undefined] = [false, convertResults];
            
            const errorStack = MarkConvertorResultToErrorStack(failResult);
            expect(errorStack[0]).to.equal("error_value");
            expect(errorStack[1]).to.be.undefined; // Successful results are skipped
            expect(errorStack[2]).to.equal("another_error");
        });

        it("should handle nested error structures recursively", () => {
            const nestedError: ISDMConvertResult = {
                10: [false, "nested_error"]
            };
            const convertResults: ISDMConvertResult = {
                0: [false, [false, nestedError]]
            };
            const failResult: [boolean, ISDMConvertResult | undefined] = [false, convertResults];
            
            const errorStack = MarkConvertorResultToErrorStack(failResult);
            expect(errorStack[0]).to.be.an('object');
            expect(errorStack[0][10]).to.equal("nested_error");
        });

        it("should return raw value when child has no keys", () => {
            const convertResults: ISDMConvertResult = {
                0: [false, [false, {}]] // Empty child object
            };
            const failResult: [boolean, ISDMConvertResult | undefined] = [false, convertResults];
            
            const errorStack = MarkConvertorResultToErrorStack(failResult);
            expect(errorStack[0]).to.deep.equal([false, {}]);
        });
    });

    describe("SDMConvertor", () => {
        describe("Constructor", () => {
            it("should initialize with SDM", () => {
                const schema = parseSchema(['id', 'name']);
                const convertor = new SDMConvertor(schema);
                expect(convertor.sdm).to.equal(schema);
                expect(convertor.converLst).to.be.an('array');
            });
        });

        describe("getConvertor method", () => {
            it("should return undefined for invalid index", () => {
                const schema = parseSchema(['id']);
                const convertor = new SDMConvertor(schema);
                
                const result = convertor.getConvertor(999);
                expect(result).to.be.undefined;
            });

            it("should create and cache SDMConvertor for SDM marks", () => {
                const schema = parseSchema(['character', '{', 'name', 'level', '}']);
                const convertor = new SDMConvertor(schema);
                
                const subConvertor = convertor.getConvertor(0);
                expect(subConvertor).to.be.instanceOf(SDMConvertor);
                
                // Should return cached instance
                const cachedConvertor = convertor.getConvertor(0);
                expect(cachedConvertor).to.equal(subConvertor);
            });

            it("should create and cache TDMConvertor for TDM marks", () => {
                const schema = parseSchema(['id', 'name']);
                const convertor = new SDMConvertor(schema);
                
                const tdmConvertor = convertor.getConvertor(0);
                expect(tdmConvertor).to.be.instanceOf(TDMConvertor);
                
                // Should return cached instance
                const cachedConvertor = convertor.getConvertor(0);
                expect(cachedConvertor).to.equal(tdmConvertor);
            });
        });

        describe("validate method for different scenarios", () => {
            it("should validate simple object structure", () => {
                const schema = parseSchema(['id', 'name']);
                const convertor = new SDMConvertor(schema);
                
                const result = convertor.validate([1, 'test']);
                expect(result[0]).to.be.true;
                expect(result[1]).to.be.an('object');
            });

            it("should handle validation failures", () => {
                const schema = parseSchema(['uint', 'string']);
                const convertor = new SDMConvertor(schema);
                
                const result = convertor.validate(['invalid', 123]);
                expect(result[0]).to.be.false;
                expect(result[1]).to.be.an('object');
            });

            it("should handle nested SDM validation", () => {
                const schema = parseSchema([
                    'character', '{',
                        'name', 'level',
                    '}'
                ]);
                const convertor = new SDMConvertor(schema);
                
                const result = convertor.validate(['Hero', 10]);
                expect(result[0]).to.be.true;
            });

            it("should handle array structure with $strict decorator", () => {
                const schema = parseSchema(['$strict', '[', 'uint', 'string', ']']);
                const convertor = new SDMConvertor(schema);
                
                const result = convertor.validate([123, 'test']);
                expect(result[0]).to.be.true;
            });

            it("should handle array structure without $strict decorator", () => {
                const schema = parseSchema(['[', 'uint', 'string', ']']);
                const convertor = new SDMConvertor(schema);
                
                // Test with some undefined values
                const result = convertor.validate([123, undefined]);
                expect(result[0]).to.be.true;
            });

            it("should handle $ghost decorator for arrays with all undefined", () => {
                const schema = parseSchema(['$ghost', '[', 'uint', 'string', ']']);
                const convertor = new SDMConvertor(schema);
                
                const result = convertor.validate([undefined, undefined]);
                expect(result[0]).to.be.true;
                expect(result[1]).to.be.undefined;
            });

            it("should handle $ghost decorator for objects with all undefined", () => {
                const schema = parseSchema([
                    '$ghost', 'optional', '{',
                        'field1', 'field2',
                    '}'
                ]);
                const convertor = new SDMConvertor(schema);
                
                const result = convertor.validate([undefined, undefined]);
                expect(result[0]).to.be.true;
                expect(result[1]).to.be.undefined;
            });

            it("should handle mixed successful and failed validations", () => {
                const schema = parseSchema(['uint', 'string', 'uint']);
                const convertor = new SDMConvertor(schema);
                
                const result = convertor.validate([123, 'test', 'invalid']);
                expect(result[0]).to.be.false;
                expect(result[1]).to.have.property('2'); // Third field should have error
            });

            it("should record original values for failed TDM validations", () => {
                const schema = parseSchema(['uint']);
                const convertor = new SDMConvertor(schema);
                
                const result = convertor.validate(['invalid_number']);
                expect(result[0]).to.be.false;
                expect(result[1]).to.not.be.undefined;
                if (result[1]) {
                    expect(result[1][0][1]).to.equal('invalid_number');
                }
            });
        });

        describe("convert method", () => {
            it("should successfully convert valid data", () => {
                const schema = parseSchema(['id', 'name']);
                const convertor = new SDMConvertor(schema);
                
                const result = convertor.convert([1, 'test']);
                expect(result).to.be.an('object');
            });

            it("should throw TypeError with error stack for invalid data", () => {
                const schema = parseSchema(['uint', 'string']);
                const convertor = new SDMConvertor(schema);
                
                expect(() => {
                    convertor.convert(['invalid', 123]);
                }).to.throw(Error);
            });

            it("should include detailed error stack in exception", () => {
                const schema = parseSchema(['uint', 'string']);
                const convertor = new SDMConvertor(schema);
                
                try {
                    convertor.convert(['invalid', 123]);
                    expect.fail("Should have thrown an error");
                } catch (error) {
                    expect(error.message).to.include('invalid');
                }
            });
        });

        describe("Edge cases and complex scenarios", () => {
            it("should handle deeply nested structures", () => {
                const schema = parseSchema([
                    'root', '{',
                        'level1', '{',
                            'level2', '{',
                                'value',
                            '}',
                        '}',
                    '}'
                ]);
                const convertor = new SDMConvertor(schema);
                
                const result = convertor.validate(['test_value']);
                expect(result[0]).to.be.true;
            });

            it("should handle empty input arrays", () => {
                const schema = parseSchema(['id']);
                const convertor = new SDMConvertor(schema);
                
                const result = convertor.validate([]);
                expect(result[0]).to.be.false;
            });

            it("should handle null and undefined inputs", () => {
                const schema = parseSchema(['any']);
                const convertor = new SDMConvertor(schema);
                
                const result1 = convertor.validate([null]);
                expect(result1[0]).to.be.true;

                const result2 = convertor.validate([undefined]);
                expect(result2[0]).to.be.true;
            });
        });
    });

    describe("SchemaConvertor", () => {
        describe("Inheritance from SDMConvertor", () => {
            it("should extend SDMConvertor correctly", () => {
                const schema = parseSchema(['id', 'name']);
                const convertor = new SchemaConvertor(schema);
                expect(convertor).to.be.instanceOf(SDMConvertor);
                expect(convertor.sdm).to.equal(schema);
            });

            it("should inherit all SDMConvertor functionality", () => {
                const schema = parseSchema(['id', 'name']);
                const convertor = new SchemaConvertor(schema);
                
                const result = convertor.validate([1, 'test']);
                expect(result[0]).to.be.true;
                
                const converted = convertor.convert([1, 'test']);
                expect(converted).to.be.an('object');
            });
        });
    });

    describe("Integration Tests", () => {
        it("should handle complete end-to-end conversion workflow", () => {
            const schema = parseSchema([
                'character', '{',
                    'id',
                    'name', 
                    'stats', '{',
                        'hp', 'mp',
                    '}',
                    'skills', '[',
                        'uint', 'uint', 'uint',
                    ']',
                '}'
            ]);
            const convertor = new SchemaConvertor(schema);
            
            const testData = [123, 'Hero', 100, 50, 1, 2, 3];
            const result = convertor.convert(testData);
            
            expect(result).to.be.an('object');
            expect(result).to.have.property('0');
        });

        it("should provide detailed error information for complex failures", () => {
            const schema = parseSchema([
                'data', '{',
                    'valid_field',
                    'invalid_field',
                    'nested', '{',
                        'also_invalid',
                    '}',
                '}'
            ]);
            const convertor = new SchemaConvertor(schema);
            
            try {
                convertor.convert(['valid', 'this_will_fail_uint', 'this_will_also_fail']);
                expect.fail("Should have thrown an error");
            } catch (error) {
                expect(error.message).to.include('Error Stack');
                expect(error.message).to.include('this_will_fail_uint');
                expect(error.message).to.include('this_will_also_fail');
            }
        });

        it("should handle mixed array and object structures", () => {
            const schema = parseSchema([
                'items', '[',
                    'item', '{',
                        'id', 'name',
                    '}',
                ']'
            ]);
            const convertor = new SchemaConvertor(schema);
            
            const result = convertor.validate([1, 'Item1', 2, 'Item2']);
            expect(result[0]).to.be.true;
        });
    });
}); 