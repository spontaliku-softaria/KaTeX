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

import buildTree from "./src/buildTree";
import parseTree from "./src/parseTree";
import utils from "./src/utils";
import {Mode} from "./src/types";
import ParseNode from "./src/ParseNode";

/**
 * Parse and build an expression, and place that expression in the DOM node
 * given.
 */
let render = function(expression, baseNode, options) {
    utils.clearNode(baseNode);

    const settings = new Settings(options);

    const tree = parseTree(expression, settings);
    const node = buildTree(tree, expression, settings).toNode();

    baseNode.appendChild(node);
};

/**
 * Build parse tree in to DOM tree, and place that tree in the DOM node given.
 */
const renderTree = function(tree, expression, baseNode, options) {
    utils.clearNode(baseNode);

    const settings = new Settings(options);

    const node = buildTree(tree, expression, settings).toNode();

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
const renderToString = function(expression, options) {
    const settings = new Settings(options);

    const tree = parseTree(expression, settings);
    return buildTree(tree, expression, settings).toMarkup();
};

/**
 * Build parse tree into DOM tree, and return the markup for that.
 */
const renderTreeToString = function(tree, expression, options) {
    const settings = new Settings(options);

    return buildTree(tree, expression, settings).toMarkup();
};

/**
 * Parse an expression and return the parse tree.
 */
const generateParseTree = function(expression, options) {
    const settings = new Settings(options);
    return parseTree(expression, settings);
};

module.exports = {
    render: render,
    renderToString: renderToString,
    renderTree: renderTree,
    renderTreeToString: renderTreeToString,
    /**
     * NOTE: This method is not currently recommended for public use.
     * The internal tree representation is unstable and is very likely
     * to change. Use at your own risk.
     */
    __parse: generateParseTree,
    ParseError: ParseError,
    Mode: Mode,
    ParseNode: ParseNode,
};
