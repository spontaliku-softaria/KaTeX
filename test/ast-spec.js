/* eslint max-len:0 */
/* global beforeEach: false */
/* global expect: false */
/* global it: false */
/* global describe: false */
//@flow

import Options from "../src/Options";
import {
    AbstractNode, Fraction, KatexSymbol,
    Textord,
} from "../src/abstractTree";
import buildHTML from "../src/buildHTML";
import * as Style from "../src/Style";

const defaultOptions = new Options({
    style: Style.TEXT,
    size: 5,
    maxSize: Infinity,
});

const _getBuiltTree = function(tree) {
    const rootNode = buildHTML(tree, defaultOptions);

    // Remove the outer .katex and .katex-inner layers
    return rootNode.children[2].children;
};

beforeEach(function() {
    expect.extend({
        toBuildParseTree: function(actual: AbstractNode[] | AbstractNode) {
            const result = {
                pass: true,
                message: "'" + actual + "' succeeded in building",
            };

            const actualArray = Array.isArray(actual) ?
                actual :
                [actual];

            let parseTree;

            try {
                parseTree = actualArray.map(
                    (astNode) => astNode.toParseNode());
            } catch (e) {
                result.pass = false;
                result.message =
                    "AST tree failed in building parse tree with error " +
                    e.message +
                    "\nStack: " +
                    e.stack +
                    "\nTree: " +
                    JSON.stringify(actual);

                return result;
            }

            let built;
            try {
                built = _getBuiltTree(parseTree);
            } catch (e) {
                result.pass = false;
                result.message = "AST tree failed in building with error " +
                                 e.message +
                                 "\nStack: " +
                                 e.stack +
                                 "\nTree: " +
                                 JSON.stringify(actual);

                return result;
            }

            expect(built[0]).toBeDefined();

            return result;
        },
    });
});

describe("An AST tree", function() {
    it("should  build KaTeX symbol", function() {
        expect(new KatexSymbol("math")).toBuildParseTree();
    });

    it("should build fraction with symbols", function() {
        const tree = new Fraction("math", "\\frac",
            new Textord("math", "1"),
            new Textord("math", "a"));
        expect(tree).toBuildParseTree();
    });
});
