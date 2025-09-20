import {expect} from "chai";
import "mocha";
import {
    TemplateConvertor, 
    RichConvertor, 
    EnumConvertor, 
    TNodeConvertor
} from "../../src/convertor/richConvertor";
import {TDM} from "../../src/schema/typeDescriptionMark";
import {SupportedTypes} from "../../src/constant";

describe("Rich Convertor Complete Coverage", () => {

    describe("TemplateConvertor", () => {
        
        describe("testName static method", () => {
            it("should identify pair and array types", () => {
                expect(TemplateConvertor.testName(SupportedTypes.Pair)).to.be.true;
                expect(TemplateConvertor.testName(SupportedTypes.Array)).to.be.true;
                expect(TemplateConvertor.testName(SupportedTypes.String)).to.be.false;
                expect(TemplateConvertor.testName(SupportedTypes.UInt)).to.be.false;
            });
        });

        describe("Constructor logic", () => {
            it("should fallback to Any convertor when no inner nodes", () => {
                const tdm = TDM.parse("array<>");
                const convertor = new TemplateConvertor(tdm.inner(0));
                expect(convertor.useConvertor).to.not.be.undefined;
            });

            it("should use TNodeConvertor for single inner node", () => {
                const tdm = TDM.parse("array<uint>");
                const convertor = new TemplateConvertor(tdm.inner(0));
                expect(convertor.useConvertor).to.be.instanceOf(TNodeConvertor);
            });

            it("should use RichConvertor for multiple inner nodes", () => {
                const tdm = TDM.parse("array<uint|string>");
                const convertor = new TemplateConvertor(tdm.inner(0));
                expect(convertor.useConvertor).to.be.instanceOf(RichConvertor);
            });
        });

        describe("Array validation", () => {
            it("should handle null/undefined values", () => {
                const tdm = TDM.parse("array<uint>");
                const convertor = new TemplateConvertor(tdm.inner(0));
                
                const result1 = convertor.validate(null);
                expect(result1[0]).to.be.true;
                expect(result1[1]).to.deep.equal([]);

                const result2 = convertor.validate(undefined);
                expect(result2[0]).to.be.true;
                expect(result2[1]).to.deep.equal([]);
            });

            it("should handle single values (not string)", () => {
                const tdm = TDM.parse("array<uint>");
                const convertor = new TemplateConvertor(tdm.inner(0));
                
                const result = convertor.validate(123);
                expect(result[0]).to.be.true;
                expect(result[1]).to.have.length(1);
            });

            it("should handle string values without pipe separator", () => {
                const tdm = TDM.parse("array<string>");
                const convertor = new TemplateConvertor(tdm.inner(0));
                
                const result = convertor.validate("single_value");
                expect(result[0]).to.be.true;
                expect(result[1]).to.deep.equal(["single_value"]);
            });

            it("should split pipe-separated string values", () => {
                const tdm = TDM.parse("array<uint>");
                const convertor = new TemplateConvertor(tdm.inner(0));
                
                const result = convertor.validate("1|2|3");
                expect(result[0]).to.be.true;
                expect(result[1]).to.have.length(3);
            });

            it("should trim spaces from split values", () => {
                const tdm = TDM.parse("array<string>");
                const convertor = new TemplateConvertor(tdm.inner(0));
                
                const result = convertor.validate(" a | b | c ");
                expect(result[0]).to.be.true;
                expect(result[1]).to.deep.equal(["a", "b", "c"]);
            });

            it("should validate all items and return combined result", () => {
                const tdm = TDM.parse("array<uint>");
                const convertor = new TemplateConvertor(tdm.inner(0));
                
                const result = convertor.validate("1|invalid|3");
                expect(result[0]).to.be.false; // Should fail due to invalid item
            });
        });

        describe("Pair validation", () => {
            it("should reject non-string values", () => {
                const tdm = TDM.parse("pair<uint>");
                const convertor = new TemplateConvertor(tdm.inner(0));
                
                const result = convertor.validate(123);
                expect(result[0]).to.be.false;
                expect(result[1]).to.equal(123);
            });

            it("should reject strings without colon", () => {
                const tdm = TDM.parse("pair<string>");
                const convertor = new TemplateConvertor(tdm.inner(0));
                
                const result = convertor.validate("no_colon_here");
                expect(result[0]).to.be.false;
                expect(result[1]).to.equal("no_colon_here");
            });

            it("should parse valid key:value pairs", () => {
                const tdm = TDM.parse("pair<uint>");
                const convertor = new TemplateConvertor(tdm.inner(0));
                
                const result = convertor.validate("mykey:123");
                expect(result[0]).to.be.true;
                expect(result[1]).to.deep.equal({key: "mykey", val: 123});
            });

            it("should trim spaces from key and value", () => {
                const tdm = TDM.parse("pair<string>");
                const convertor = new TemplateConvertor(tdm.inner(0));
                
                const result = convertor.validate(" key : value ");
                expect(result[0]).to.be.true;
                expect(result[1]).to.deep.equal({key: "key", val: "value"});
            });

            it("should validate the value using inner convertor", () => {
                const tdm = TDM.parse("pair<uint>");
                const convertor = new TemplateConvertor(tdm.inner(0));
                
                const result = convertor.validate("key:invalid");
                expect(result[0]).to.be.false;
            });
        });

        describe("Unknown type handling", () => {
            it("should return false for unknown template types", () => {
                // Create a mock TNode with unknown type
                const mockTNode = {
                    tName: "unknown_type",
                    innerCount: 1,
                    inner: () => ({})
                };
                const convertor = new TemplateConvertor(mockTNode as any);
                
                const result = convertor.validate("test");
                expect(result[0]).to.be.false;
                expect(result[1]).to.be.undefined;
            });
        });
    });

    describe("RichConvertor", () => {
        it("should try all convertors until one succeeds", () => {
            const tdm = TDM.parse("uint|string");
            const convertor = new RichConvertor(tdm.tSeg);
            
            const result1 = convertor.validate("123");
            expect(result1[0]).to.be.true;

            const result2 = convertor.validate("text");
            expect(result2[0]).to.be.true;
        });

        it("should return false when no convertor succeeds", () => {
            const tdm = TDM.parse("uint|ufloat");
            const convertor = new RichConvertor(tdm.tSeg);
            
            const result = convertor.validate("clearly_not_a_number");
            expect(result[0]).to.be.false;
            expect(result[1]).to.be.undefined;
        });

        it("should handle empty tSeg nodes", () => {
            const mockTSeg = { nodes: [] };
            const convertor = new RichConvertor(mockTSeg as any);
            
            const result = convertor.validate("anything");
            expect(result[0]).to.be.false;
        });
    });

    describe("EnumConvertor", () => {
        
        describe("testName static method", () => {
            it("should identify enum types", () => {
                expect(EnumConvertor.testName(SupportedTypes.Enum)).to.be.true;
                expect(EnumConvertor.testName(SupportedTypes.String)).to.be.false;
            });
        });

        describe("Constructor with context enums", () => {
            it("should load enum values from context", () => {
                const context = {
                    enums: {
                        TestEnum: {
                            VALUE1: 1,
                            VALUE2: "test",
                            VALUE3: [10, "alternative"]
                        }
                    }
                };

                const mockTNode = {
                    tSeg: {
                        nodes: [{
                            rawName: "TestEnum",
                            context: context
                        }]
                    }
                };

                const convertor = new EnumConvertor(mockTNode as any);
                expect(convertor.enumNames["VALUE1"]).to.equal(1);
                expect(convertor.enumNames["VALUE2"]).to.equal("test");
                expect(convertor.enumNames["VALUE3"]).to.equal(10); // Should take first value from array
            });

            it("should use raw name when no context available", () => {
                const mockTNode = {
                    tSeg: {
                        nodes: [{
                            rawName: "PlainEnum",
                            context: null
                        }]
                    }
                };

                const convertor = new EnumConvertor(mockTNode as any);
                expect(convertor.enumNames["PlainEnum"]).to.equal("PlainEnum");
            });

            it("should handle missing context.enums", () => {
                const context = { otherStuff: "data" };
                const mockTNode = {
                    tSeg: {
                        nodes: [{
                            rawName: "TestEnum",
                            context: context
                        }]
                    }
                };

                const convertor = new EnumConvertor(mockTNode as any);
                expect(convertor.enumNames["TestEnum"]).to.equal("TestEnum");
            });
        });

        describe("Validation", () => {
            it("should match exact values", () => {
                const context = {
                    enums: {
                        TestEnum: { OPTION1: 1, OPTION2: "test" }
                    }
                };

                const mockTNode = {
                    tSeg: {
                        nodes: [{
                            rawName: "TestEnum",
                            context: context
                        }]
                    }
                };

                const convertor = new EnumConvertor(mockTNode as any);
                
                const result1 = convertor.validate(1);
                expect(result1[0]).to.be.true;
                expect(result1[1]).to.equal(1);

                const result2 = convertor.validate("test");
                expect(result2[0]).to.be.true;
                expect(result2[1]).to.equal("test");
            });

            it("should match case-insensitive key names", () => {
                const context = {
                    enums: {
                        TestEnum: { OPTION1: 100 }
                    }
                };

                const mockTNode = {
                    tSeg: {
                        nodes: [{
                            rawName: "TestEnum",
                            context: context
                        }]
                    }
                };

                const convertor = new EnumConvertor(mockTNode as any);
                
                const result1 = convertor.validate("option1");
                expect(result1[0]).to.be.true;
                expect(result1[1]).to.equal(100);

                const result2 = convertor.validate("OPTION1");
                expect(result2[0]).to.be.true;
                expect(result2[1]).to.equal(100);
            });

            it("should handle string representations of values", () => {
                const context = {
                    enums: {
                        TestEnum: { OPTION1: 123 }
                    }
                };

                const mockTNode = {
                    tSeg: {
                        nodes: [{
                            rawName: "TestEnum",
                            context: context
                        }]
                    }
                };

                const convertor = new EnumConvertor(mockTNode as any);
                
                const result = convertor.validate("option1");
                expect(result[0]).to.be.true;
                expect(result[1]).to.equal(123);
            });

            it("should trim and lowercase input for comparison", () => {
                const mockTNode = {
                    tSeg: {
                        nodes: [{
                            rawName: "TestEnum",
                            context: null
                        }]
                    }
                };

                const convertor = new EnumConvertor(mockTNode as any);
                
                const result = convertor.validate(" TESTENUM ");
                expect(result[0]).to.be.true;
                expect(result[1]).to.equal("TestEnum");
            });

            it("should return false for non-matching values", () => {
                const context = {
                    enums: {
                        TestEnum: { VALID: 1 }
                    }
                };

                const mockTNode = {
                    tSeg: {
                        nodes: [{
                            rawName: "TestEnum",
                            context: context
                        }]
                    }
                };

                const convertor = new EnumConvertor(mockTNode as any);
                
                const result = convertor.validate("invalid_value");
                expect(result[0]).to.be.false;
                expect(result[1]).to.equal("invalid_value");
            });
        });
    });

    describe("TNodeConvertor", () => {
        
        describe("Constructor convertor selection", () => {
            it("should use TemplateConvertor for template types", () => {
                const tdm = TDM.parse("array<uint>");
                const convertor = new TNodeConvertor(tdm.inner(0));
                expect(convertor.useConvertor).to.be.instanceOf(TemplateConvertor);
            });

            it("should use EnumConvertor for enum types", () => {
                const tdm = TDM.parse("enum<TEST>");
                const convertor = new TNodeConvertor(tdm.inner(0));
                expect(convertor.useConvertor).to.be.instanceOf(EnumConvertor);
            });

            it("should use plain convertor for basic types", () => {
                const tdm = TDM.parse("uint");
                const convertor = new TNodeConvertor(tdm.inner(0));
                expect(convertor.useConvertor).to.not.be.instanceOf(TemplateConvertor);
                expect(convertor.useConvertor).to.not.be.instanceOf(EnumConvertor);
            });

            it("should throw error if no suitable convertor found", () => {
                const mockTNode = {
                    tName: "unsupported_type"
                };

                expect(() => {
                    new TNodeConvertor(mockTNode as any);
                }).to.throw();
            });
        });

        describe("Validation delegation", () => {
            it("should delegate to useConvertor", () => {
                const tdm = TDM.parse("uint");
                const convertor = new TNodeConvertor(tdm.inner(0));
                
                const result = convertor.validate("123");
                expect(result[0]).to.be.true;
                expect(result[1]).to.equal(123);
            });
        });
    });

    describe("Integration Tests", () => {
        it("should handle complex nested template structures", () => {
            const tdm = TDM.parse("array<pair<uint>>");
            const convertor = new TNodeConvertor(tdm.inner(0));
            
            const result = convertor.validate("key1:123|key2:456");
            expect(result[0]).to.be.true;
            expect(result[1]).to.have.length(2);
        });

        it("should handle enum arrays with context", () => {
            // Create mock TNode with context for enum
            const mockTNode = {
                tName: SupportedTypes.Array,
                innerCount: 1,
                inner: () => ({
                    tName: SupportedTypes.Enum,
                    tSeg: {
                        nodes: [{
                            rawName: "Status",
                            context: {
                                enums: {
                                    Status: { ACTIVE: 1, INACTIVE: 0 }
                                }
                            }
                        }]
                    }
                })
            };
            
            const convertor = new TemplateConvertor(mockTNode as any);
            
            const result = convertor.validate("active|inactive");
            expect(result[0]).to.be.true;
        });
    });
}); 