/* eslint max-len:0 */
/* global beforeEach: false */
/* global expect: false */
/* global it: false */
/* global describe: false */
//@flow

import {
    AbstractNode,
    Accent,
    AccentUnder,
    ArrayEnvironment,
    CasesEnvironment,
    Color,
    Enclose,
    EnvironmentAlign,
    EnvironmentSeparator,
    ExtensibleArrow,
    Font,
    Fraction,
    GatheredEnvironment,
    HorizontalBrace,
    KatexSymbol,
    Kern,
    Lap,
    MathClass,
    Mathord,
    MatrixEnvironment,
    Mod,
    Operation,
    Overline, RaiseBox,
    Rule,
    Sizing,
    Smash,
    Sqrt, Supsub,
    Text,
    Textord,
    Underline,
} from "../src/CST";
import parseTree from "../src/parseTree";
import Settings from "../src/Settings";
import ParseNode from "../src/ParseNode";
import buildTree from "../src/buildTree";

function buildLatexParseTree(latex) {
    const tree = parseTree(latex, new Settings({}));
    stripParserData(tree);

    return tree;

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
}

function buildParseTree(astTree: AbstractNode | AbstractNode[]) {
    const astTreeArray = Array.isArray(astTree) ? astTree : [astTree];

    return astTreeArray.map((astNode) => astNode.toParseNode());
}

beforeEach(function() {
    expect.extend({
        toBeEqualTree: function(actual, expected) {
            expect(stringifyWithSort(actual)).toBe(stringifyWithSort(expected));

            return {
                pass: true,
            };

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

        toBuildEqualTree: function(actual: AbstractNode[] | AbstractNode,
                                   latex: string) {
            const result = {
                pass: true,
                message: "'" + actual + "' succeeded in building",
            };

            let parseTree;

            try {
                parseTree = buildParseTree(actual);
            } catch (e) {
                result.pass = false;
                result.message =
                    "CST tree failed building parse tree with error:\n" +
                    e.stack +
                    "\n\nTree: " + JSON.stringify(actual);

                return result;
            }

            expect(parseTree).toBeEqualTree(buildLatexParseTree(latex));

            try {
                buildTree(parseTree, latex, new Settings({}));
            } catch (e) {
                result.pass = false;
                result.message =
                    "CST tree failed building DOM node with error:\n" +
                    e.stack +
                    "\n\nTree: " + JSON.stringify(actual) +
                    "\n\nParse tree: " + JSON.stringify(parseTree);
            }

            return result;
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
        expect(new KatexSymbol("math")).toBuildEqualTree("\\KaTeX");
    });

    it("should build symbols", function() {
        expect(mathord).toBuildEqualTree(mathordLatex);
        expect(textordMath).toBuildEqualTree(textordMathLatex);
    });

    it("should build sqrt", function() {
        expect(new Sqrt("math", mathord, mathord))
            .toBuildEqualTree(`\\sqrt[${mathordLatex}]{${mathordLatex}}`);
    });

    it("should build text", function() {
        expect(new Text("math", [textordText], Text.prototype.commands.text))
            .toBuildEqualTree(`\\text{${textordTextLatex}}`);

        expect(new Text("math", [textordText], Text.prototype.commands.textrm))
            .toBuildEqualTree(`\\textrm{${textordTextLatex}}`);
    });

    it("should build color", function() {
        expect(new Color("math", [mathord], "blue"))
            .toBuildEqualTree(`\\color{blue}${mathordLatex}`);
    });

    it("should build overline", function() {
        expect(new Overline("math", mathord))
            .toBuildEqualTree(`\\overline{${mathordLatex}}`);
    });

    it("should build underline", function() {
        expect(new Underline("math", mathord))
            .toBuildEqualTree(`\\underline{${mathordLatex}}`);
    });

    it("should build rule", function() {
        expect(new Rule("math", "1em", "2em", "3em"))
            .toBuildEqualTree(`\\rule[3em]{1em}{2em}`);
    });

    it("should build kern", function() {
        expect(new Kern("math", "1em"))
            .toBuildEqualTree(`\\kern{1em}`);
    });

    it("should build math class", function() {
        expect(new MathClass("math", [mathord], MathClass.prototype.commands.mathord))
            .toBuildEqualTree(`\\mathord ${mathordLatex}`);
    });

    it("should build mod", function() {
        expect(new Mod("math", null, Mod.prototype.commands.bmod))
            .toBuildEqualTree(`\\bmod`);

        expect(new Mod("math", [mathord], Mod.prototype.commands.pod))
            .toBuildEqualTree(`\\pod ${mathordLatex}`);
    });

    it("should build operation", function() {
        expect(new Operation("math", null, Operation.prototype.commands.arcsin))
            .toBuildEqualTree(`\\arcsin`);

        expect(new Operation("math", [mathord], Operation.prototype.commands.mathop))
            .toBuildEqualTree(`\\mathop{${mathordLatex}}`);
    });

    it("should build fraction", function() {
        expect(new Fraction("math", Fraction.prototype.commands.frac, mathord, mathord))
            .toBuildEqualTree(`\\frac{${mathordLatex}}{${mathordLatex}}`);
    });

    it("should build lap", function() {
        expect(new Fraction("math", Fraction.prototype.commands.frac,
            new Lap("math", mathord, Lap.prototype.commands.mathllap),
            mathord))
            .toBuildEqualTree(`\\frac{\\mathllap ${mathordLatex}}{${mathordLatex}}`);
    });

    it("should build smash", function() {
        expect(new Smash("math", mathord, [{value: "t"}, {value: "b"}]))
            .toBuildEqualTree(`\\smash[tb]{${mathordLatex}}`);
    });

    it("should build font", function() {
        expect(new Font("math", mathord, Font.prototype.commands.Bbb))
            .toBuildEqualTree(`\\Bbb ${mathordLatex}`);
    });

    it("should build accent", function() {
        expect(new Accent("math", mathord, Accent.prototype.commands.acute))
            .toBuildEqualTree(`\\acute ${mathordLatex}`);
    });

    it("should build horizontal brace", function() {
        expect(new HorizontalBrace("math", mathord, HorizontalBrace.prototype.commands.overbrace))
            .toBuildEqualTree(`\\overbrace ${mathordLatex}`);
    });

    it("should build accent below", function() {
        expect(new AccentUnder("math", mathord, AccentUnder.prototype.commands.underleftarrow))
            .toBuildEqualTree(`\\underleftarrow ${mathordLatex}`);
    });

    it("should build extensible arrow", function() {
        expect(new ExtensibleArrow("math", mathord, ExtensibleArrow.prototype.commands.xhookleftarrow, mathord))
            .toBuildEqualTree(`\\xhookleftarrow[${mathordLatex}] ${mathordLatex}`);
    });

    it("should build accent below", function() {
        expect(new Enclose("math", mathord, Enclose.prototype.commands.cancel))
            .toBuildEqualTree(`\\cancel ${mathordLatex}`);
    });

    it("should build infix fraction", function() {
        //FIXME: fix after properly handling InfixFraction
        expect(new Fraction("math", Fraction.prototype.commands.frac, mathord, mathord))
            .toBuildEqualTree(`${mathordLatex} \\over ${mathordLatex}`);
    });

    describe("for environments", function() {
        it("should build array", function() {
            expect(new ArrayEnvironment("math",
                ArrayEnvironment.prototype.environments.array,
                [
                    [mathord, mathord],
                    [mathord, mathord],
                ],
                [
                    new EnvironmentAlign("l"),
                    new EnvironmentSeparator(),
                    new EnvironmentAlign("r"),
                ]))
                .toBuildEqualTree(`\\begin{array}{l|r}
                ${mathordLatex} & ${mathordLatex} \\\\ 
                ${mathordLatex} & ${mathordLatex}
                \\end{array}`);
        });

        it("should build matrix", function() {
            expect(new MatrixEnvironment("math",
                MatrixEnvironment.prototype.environments.matrix,
                [
                    [mathord, mathord],
                    [mathord, mathord],
                ]))
                .toBuildEqualTree(`\\begin{matrix}
                ${mathordLatex} & ${mathordLatex} \\\\ 
                ${mathordLatex} & ${mathordLatex}
                \\end{matrix}`);
        });

        it("should build bmatrix", function() {
            expect(new MatrixEnvironment("math",
                MatrixEnvironment.prototype.environments.bmatrix,
                [
                    [mathord, mathord],
                    [mathord, mathord],
                ]))
                .toBuildEqualTree(`\\begin{bmatrix}
                ${mathordLatex} & ${mathordLatex} \\\\ 
                ${mathordLatex} & ${mathordLatex}
                \\end{bmatrix}`);
        });

        it("should build cases", function() {
            expect(new CasesEnvironment("math",
                CasesEnvironment.prototype.environments.cases,
                [
                    [mathord, mathord],
                    [mathord, mathord],
                ]))
                .toBuildEqualTree(`\\begin{cases}
                ${mathordLatex} & ${mathordLatex} \\\\ 
                ${mathordLatex} & ${mathordLatex}
                \\end{cases}`);
        });

        it("should build dcases", function() {
            expect(new CasesEnvironment("math",
                CasesEnvironment.prototype.environments.dcases,
                [
                    [mathord, mathord],
                    [mathord, mathord],
                ]))
                .toBuildEqualTree(`\\begin{dcases}
                ${mathordLatex} & ${mathordLatex} \\\\ 
                ${mathordLatex} & ${mathordLatex}
                \\end{dcases}`);
        });

        /*it("should build aligned", function() {
            expect(new AlignedEnvironment("math",
                AlignedEnvironment.prototype.environments.aligned,
                [
                    [mathord, mathord],
                    [mathord, mathord],
                ]))
                .toBuildParseTree(`\\begin{aligned}
                ${mathordLatex} & ${mathordLatex} \\\\ 
                ${mathordLatex} & ${mathordLatex}
                \\end{aligned}`);
        });*/

        it("should build gathered", function() {
            expect(new GatheredEnvironment("math",
                GatheredEnvironment.prototype.environments.gathered,
                [
                    [mathord, mathord],
                    [mathord, mathord],
                ]))
                .toBuildEqualTree(`\\begin{gathered}
                ${mathordLatex} & ${mathordLatex} \\\\ 
                ${mathordLatex} & ${mathordLatex}
                \\end{gathered}`);
        });
    });

    it("should build sizing", function() {
        expect(new Sizing("math", [mathord], 1))
            .toBuildEqualTree(`\\tiny ${mathordLatex}`);
    });

    it("should build raise box", function() {
        expect(new RaiseBox("math", [textordText], "1em"))
            .toBuildEqualTree(`\\raisebox{1em}{${textordTextLatex}}`);
    });

    it("should build supsub", function() {
        expect(new Supsub("math", mathord, mathord, mathord))
            .toBuildEqualTree(`${mathordLatex}_${mathordLatex}^${mathordLatex}`);
    });
});
