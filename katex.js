// @flow
/* eslint no-console:0 */
/**
 * This is the main entry point for KaTeX. Here, we expose functions for
 * rendering expressions either to DOM nodes or to markup strings.
 *
 * We also expose the ParseError class to check if errors thrown from KaTeX are
 * errors in the expression, or errors in javascript handling.
 */

import ParseError from "./src/ParseError";
import Settings from "./src/Settings";

import { buildTree, buildHTMLTree } from "./src/buildTree";
import parseTree from "./src/parseTree";
import utils from "./src/utils";

import type {SettingsOptions} from "./src/Settings";
import type ParseNode from "./src/ParseNode";
import symbols from "./src/symbols";

/**
 * Parse and build an expression, and place that expression in the DOM node
 * given.
 */
let render = function(
    expression: string,
    baseNode: Node,
    options: SettingsOptions,
) {
    utils.clearNode(baseNode);
    const node = renderToDomTree(expression, options).toNode();
    baseNode.appendChild(node);
};

// KaTeX's styles don't work properly in quirks mode. Print out an error, and
// disable rendering.
if (typeof document !== "undefined") {
    if (document.compatMode !== "CSS1Compat") {
        typeof console !== "undefined" && console.warn(
            "Warning: KaTeX doesn't work in quirks mode. Make sure your " +
                "website has a suitable doctype.");

        render = function() {
            throw new ParseError("KaTeX doesn't work in quirks mode.");
        };
    }
}

/**
 * Parse and build an expression, and return the markup for that.
 */
const renderToString = function(
    expression: string,
    options: SettingsOptions,
): string {
    const markup = renderToDomTree(expression, options).toMarkup();
    return markup;
};

/**
 * Parse an expression and return the parse tree.
 */
const generateParseTree = function(
    expression: string,
    options: SettingsOptions,
): ParseNode[] {
    const settings = new Settings(options);
    return parseTree(expression, settings);
};


/**
 * Generates and returns the katex build tree. This is used for advanced
 * use cases (like rendering to custom output).
 */
const renderToDomTree = function(
    expression: string,
    options: SettingsOptions,
) {
    const settings = new Settings(options);
    const tree = parseTree(expression, settings);
    return buildTree(tree, expression, settings);
};

/**
 * Generates and returns the katex build tree, with just HTML (no MathML).
 * This is used for advanced use cases (like rendering to custom output).
 */
const renderToHTMLTree = function(
    expression: string,
    options: SettingsOptions,
) {
    const settings = new Settings(options);
    const tree = parseTree(expression, settings);
    return buildHTMLTree(tree, expression, settings);
};

const symbolsClone = JSON.parse(JSON.stringify(symbols));
const copySymbols = function() {
    return symbolsClone;
};

export default {
    /**
     * Renders the given LaTeX into an HTML+MathML combination, and adds
     * it as a child to the specified DOM node.
     */
    render,
    /**
     * Renders the given LaTeX into an HTML+MathML combination string,
     * for sending to the client.
     */
    renderToString,
    /**
     * KaTeX error, usually during parsing.
     */
    ParseError,
    /**
     * Parses the given LaTeX into KaTeX's internal parse tree structure,
     * without rendering to HTML or MathML.
     *
     * NOTE: This method is not currently recommended for public use.
     * The internal tree representation is unstable and is very likely
     * to change. Use at your own risk.
     */
    __parse: generateParseTree,
    /**
     * Renders the given LaTeX into an HTML+MathML internal DOM tree
     * representation, without flattening that representation to a string.
     *
     * NOTE: This method is not currently recommended for public use.
     * The internal tree representation is unstable and is very likely
     * to change. Use at your own risk.
     */
    __renderToDomTree: renderToDomTree,
    /**
     * Renders the given LaTeX into an HTML internal DOM tree representation,
     * without MathML and without flattening that representation to a string.
     *
     * NOTE: This method is not currently recommended for public use.
     * The internal tree representation is unstable and is very likely
     * to change. Use at your own risk.
     */
    __renderToHTMLTree: renderToHTMLTree,
    /**
     * Returns set of supported symbols in internal format.
     *
     * NOTE: This method is not currently recommended for public use.
     * The internal tree representation is unstable and is very likely
     * to change. Use at your own risk.
     */
    __symbols: copySymbols,
};
