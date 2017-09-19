/* eslint max-len:0 */
/* global beforeEach: false */
/* global expect: false */
/* global it: false */
/* global describe: false */
//@flow

import {
    AbstractNode, Color, Fraction, KatexSymbol, Kern, Lap, MathClass, Mathord,
    Mod,
    Operation,
    Overline, Rule, Smash,
    Sqrt,
    Text,
    Textord, Underline,
} from "../src/CST";
import parseTree from "../src/parseTree";
import Settings from "../src/Settings";
import ParseNode from "../src/ParseNode";

beforeEach(function() {
    expect.extend({
        toBuildParseTree: function(actual: AbstractNode[] | AbstractNode,
                                   latex: string) {
            const result = {
                pass: true,
                message: "'" + actual + "' succeeded in building",
            };

            const actualArray = Array.isArray(actual) ?
                actual :
                [actual];

            let builtParseTree;

            try {
                builtParseTree = actualArray.map(
                    (astNode) => astNode.toParseNode());
            } catch (e) {
                result.pass = false;
                result.message =
                    "CST tree failed building parse tree with error:\n" +
                    e.stack +
                    "\n\nTree: " +
                    JSON.stringify(actualArray);

                return result;
            }

            const latexParseTree = parseTree(latex, new Settings({}));
            stripParserData(latexParseTree);

            expect(stringifyWithSort(builtParseTree))
                .toBe(stringifyWithSort(latexParseTree));

            return result;

            function stripParserData(node: ParseNode[] | ParseNode) {
                if (node instanceof Array) {
                    node.forEach(stripParserData);
                } else {
                    for (const field in node) {
                        if (!node.hasOwnProperty(field)) {
                            continue;
                        }

                        if (["lexer", "start", "end"].includes(field)) {
                            delete node[field];
                            continue;
                        }

                        if (node[field] instanceof Object) {
                            stripParserData(node[field]);
                        }
                    }
                }
            }

            function stringifyWithSort(object) {
                return JSON.stringify(object, (key, value) => {
                    if (value instanceof Object && !(value instanceof Array)) {
                        return Object.keys(value)
                            .sort()
                            .reduce((sorted, key) => {
                                sorted[key] = value[key];

                                return sorted;
                            }, {});
                    } else {
                        return value;
                    }
                });
            }
        },
    });
});

describe("An AST tree", function() {
    const mathordLatex = "\\lambda";
    const mathord = new Mathord("math", mathordLatex);
    const textordMathLatex = "\\infty";
    const textordMath = new Textord("math", textordMathLatex);
    const textordTextLatex = "a";
    const textordText = new Textord("text", textordTextLatex);

    it("should  build KaTeX symbol", function() {
        expect(new KatexSymbol("math")).toBuildParseTree("\\KaTeX");
    });

    it("should build symbols", function() {
        expect(mathord).toBuildParseTree(mathordLatex);
        expect(textordMath).toBuildParseTree(textordMathLatex);
    });

    it("should build sqrt", function() {
        expect(new Sqrt("math", mathord, mathord))
            .toBuildParseTree(`\\sqrt[${mathordLatex}]{${mathordLatex}}`);
    });

    it("should build text", function() {
        expect(new Text("math", [textordText], Text.prototype.commands.text))
            .toBuildParseTree(`\\text{${textordTextLatex}}`);

        expect(new Text("math", [textordText], Text.prototype.commands.textrm))
            .toBuildParseTree(`\\textrm{${textordTextLatex}}`);
    });

    it("should build color", function() {
        expect(new Color("math", [mathord], "blue"))
            .toBuildParseTree(`\\color{blue}${mathordLatex}`);
    });

    it("should build overline", function() {
        expect(new Overline("math", mathord))
            .toBuildParseTree(`\\overline{${mathordLatex}}`);
    });

    it("should build underline", function() {
        expect(new Underline("math", mathord))
            .toBuildParseTree(`\\underline{${mathordLatex}}`);
    });

    it("should build rule", function() {
        expect(new Rule("math", "1em", "2em", "3em"))
            .toBuildParseTree(`\\rule[3em]{1em}{2em}`);
    });

    it("should build kern", function() {
        expect(new Kern("math", "1em"))
            .toBuildParseTree(`\\kern{1em}`);
    });

    it("should build math class", function() {
        expect(new MathClass("math", [mathord], MathClass.prototype.commands.mathord))
            .toBuildParseTree(`\\mathord ${mathordLatex}`);
    });

    it("should build mod", function() {
        expect(new Mod("math", null, Mod.prototype.commands.bmod))
            .toBuildParseTree(`\\bmod`);

        expect(new Mod("math", [mathord], Mod.prototype.commands.pod))
            .toBuildParseTree(`\\pod ${mathordLatex}`);
    });

    it("should build operation", function() {
        expect(new Operation("math", null, Operation.prototype.commands.arcsin))
            .toBuildParseTree(`\\arcsin`);

        expect(new Operation("math", [mathord], Operation.prototype.commands.mathop))
            .toBuildParseTree(`\\mathop{${mathordLatex}}`);
    });

    it("should build fraction", function() {
        expect(new Fraction("math", Fraction.prototype.commands.frac, mathord, mathord))
            .toBuildParseTree(`\\frac{${mathordLatex}}{${mathordLatex}}`);
    });

    it("should build lap", function() {
        expect(new Fraction("math", Fraction.prototype.commands.frac,
            new Lap("math", mathord, Lap.prototype.commands.mathllap),
            mathord))
            .toBuildParseTree(`\\frac{\\mathllap ${mathordLatex}}{${mathordLatex}}`);
    });

    it("should build smash", function() {
        expect(new Smash("math", mathord, [{value: "t"}, {value: "b"}]))
            .toBuildParseTree(`\\smash[tb]{${mathordLatex}}`);
    });
});
