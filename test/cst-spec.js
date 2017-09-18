/* eslint max-len:0 */
/* global beforeEach: false */
/* global expect: false */
/* global it: false */
/* global describe: false */
//@flow

import {
    AbstractNode, Color, Fraction, KatexSymbol, Mathord, Sqrt, Text,
    Textord,
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
                    "CST tree failed building parse tree with error:" +
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

    it("should build fraction", function() {
        expect(new Fraction("math", "\\frac", mathord, mathord))
            .toBuildParseTree(`\\frac{${mathordLatex}}{${mathordLatex}}`);
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
        const tree = new Color("math", [mathord], "blue");
        expect(tree).toBuildParseTree(`\\color{blue}${mathordLatex}`);
    });
});
