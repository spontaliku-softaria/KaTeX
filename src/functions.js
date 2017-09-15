// @flow
/** Include this to ensure that all functions are defined. */
import ParseError from "./ParseError";
import * as ParseNode from "./ParseNode";
import {
    default as _defineFunction,
    ordargument,
    _functions,
} from "./defineFunction";

import type {FunctionPropSpec, FunctionHandler} from "./defineFunction" ;

// WARNING: New functions should be added to src/functions and imported here.

const functions = _functions;
export default functions;

// Define a convenience function that mimcs the old semantics of defineFunction
// to support existing code so that we can migrate it a little bit at a time.
const defineFunction = function(
    names: string[],
    props: FunctionPropSpec,
    handler: ?FunctionHandler, // null only if handled in parser
) {
    _defineFunction({names, props, handler});
};

// A normal square root
defineFunction(["\\sqrt"], {
    numArgs: 1,
    numOptionalArgs: 1,
}, function(context, args) {
    return new ParseNode.Sqrt(
        context.parser.mode,
        args[1],
        args[0]
    );
});

// Non-mathy text, possibly in a font
defineFunction([
    "\\text", "\\textrm", "\\textsf", "\\texttt", "\\textnormal",
    "\\textbf", "\\textit",
], {
    numArgs: 1,
    argTypes: ["text"],
    greediness: 2,
    allowedInText: true,
}, function(context, args) {
    return new ParseNode.Text(
        context.parser.mode,
        ordargument(args[0]),
        context.funcName
    );
});

// A two-argument custom color
defineFunction(["\\textcolor"], {
    numArgs: 2,
    allowedInText: true,
    greediness: 3,
    argTypes: ["color", "original"],
}, function(context, args) {
    return new ParseNode.Color(
        context.parser.mode,
        ordargument(args[1]),
        args[0].value
    );
});

// \color is handled in Parser.js's parseImplicitGroup
defineFunction(["\\color"], {
    numArgs: 1,
    allowedInText: true,
    greediness: 3,
    argTypes: ["color"],
}, null);

// An overline
defineFunction(["\\overline"], {
    numArgs: 1,
}, function(context, args) {
    return new ParseNode.Overline(
        context.parser.mode,
        args[0]
    );
});

// An underline
defineFunction(["\\underline"], {
    numArgs: 1,
}, function(context, args) {
    return new ParseNode.Underline(
        context.parser.mode,
        args[0]
    );
});

// A box of the width and height
defineFunction(["\\rule"], {
    numArgs: 2,
    numOptionalArgs: 1,
    argTypes: ["size", "size", "size"],
}, function(context, args) {
    return new ParseNode.Rule(
        context.parser.mode,
        args[1].value,
        args[2].value,
        args[0] && args[0].value
    );
});

// TODO: In TeX, \mkern only accepts mu-units, and \kern does not accept
// mu-units. In current KaTeX we relax this; both commands accept any unit.
defineFunction(["\\kern", "\\mkern"], {
    numArgs: 1,
    argTypes: ["size"],
}, function(context, args) {
    return new ParseNode.Kern(
        context.parser.mode,
        args[0].value
    );
});

// A KaTeX logo
defineFunction(["\\KaTeX"], {
    numArgs: 0,
}, function(context) {
    return new ParseNode.KatexSymbol(
        context.parser.mode
    );
});

import "./functions/phantom";

// Math class commands except \mathop
defineFunction([
    "\\mathord", "\\mathbin", "\\mathrel", "\\mathopen",
    "\\mathclose", "\\mathpunct", "\\mathinner",
], {
    numArgs: 1,
}, function(context, args) {
    return new ParseNode.MathClass(
        context.parser.mode,
        ordargument(args[0]),
        context.funcName);
});

// Build a relation by placing one symbol on top of another
defineFunction(["\\stackrel"], {
    numArgs: 2,
}, function(context, args) {
    const bottom = new ParseNode.Operation(
        args[1].mode,
        ordargument(args[1]),
        context.funcName,
        true,
        false);
    bottom.alwaysHandleSupSub = true;

    const supsub = new ParseNode.Supsub(
        args[0].mode,
        bottom,
        args[0],
        null
    );

    return new ParseNode.MathClass(
        context.parser.mode,
        [supsub],
        "\\mathrel"
    );
});

// \mod-type functions
defineFunction(["\\bmod"], {
    numArgs: 0,
}, function(context, args) {
    return new ParseNode.Mod(
        context.parser.mode,
        null,
        "bmod"
    );
});

defineFunction(["\\pod", "\\pmod", "\\mod"], {
    numArgs: 1,
}, function(context, args) {
    return new ParseNode.Mod(
        context.parser.mode,
        ordargument(args[0]),
        context.funcName.substr(1)
    );
});

// Single-argument color functions
defineFunction([
    "\\blue", "\\orange", "\\pink", "\\red",
    "\\green", "\\gray", "\\purple",
    "\\blueA", "\\blueB", "\\blueC", "\\blueD", "\\blueE",
    "\\tealA", "\\tealB", "\\tealC", "\\tealD", "\\tealE",
    "\\greenA", "\\greenB", "\\greenC", "\\greenD", "\\greenE",
    "\\goldA", "\\goldB", "\\goldC", "\\goldD", "\\goldE",
    "\\redA", "\\redB", "\\redC", "\\redD", "\\redE",
    "\\maroonA", "\\maroonB", "\\maroonC", "\\maroonD", "\\maroonE",
    "\\purpleA", "\\purpleB", "\\purpleC", "\\purpleD", "\\purpleE",
    "\\mintA", "\\mintB", "\\mintC",
    "\\grayA", "\\grayB", "\\grayC", "\\grayD", "\\grayE",
    "\\grayF", "\\grayG", "\\grayH", "\\grayI",
    "\\kaBlue", "\\kaGreen",
], {
    numArgs: 1,
    allowedInText: true,
    greediness: 3,
}, function(context, args) {
    return new ParseNode.Color(
        context.parser.mode,
        ordargument(args[0]),
        "katex-" + context.funcName.slice(1)
    );
});

// There are 2 flags for operators; whether they produce limits in
// displaystyle, and whether they are symbols and should grow in
// displaystyle. These four groups cover the four possible choices.

// No limits, not symbols
defineFunction([
    "\\arcsin", "\\arccos", "\\arctan", "\\arctg", "\\arcctg",
    "\\arg", "\\ch", "\\cos", "\\cosec", "\\cosh", "\\cot", "\\cotg",
    "\\coth", "\\csc", "\\ctg", "\\cth", "\\deg", "\\dim", "\\exp",
    "\\hom", "\\ker", "\\lg", "\\ln", "\\log", "\\sec", "\\sin",
    "\\sinh", "\\sh", "\\tan", "\\tanh", "\\tg", "\\th",
], {
    numArgs: 0,
}, function(context) {
    return new ParseNode.Operation(
        context.parser.mode,
        null,
        context.funcName,
        false,
        false
    );
});

// Limits, not symbols
defineFunction([
    "\\det", "\\gcd", "\\inf", "\\lim", "\\liminf", "\\limsup", "\\max",
    "\\min", "\\Pr", "\\sup",
], {
    numArgs: 0,
}, function(context) {
    return new ParseNode.Operation(
        context.parser.mode,
        null,
        context.funcName,
        true,
        false
    );
});

// No limits, symbols
defineFunction([
    "\\int", "\\iint", "\\iiint", "\\oint",
], {
    numArgs: 0,
}, function(context) {
    return new ParseNode.Operation(
        context.parser.mode,
        null,
        context.funcName,
        false,
        true
    );
});

// Limits, symbols
defineFunction([
    "\\coprod", "\\bigvee", "\\bigwedge", "\\biguplus", "\\bigcap",
    "\\bigcup", "\\intop", "\\prod", "\\sum", "\\bigotimes",
    "\\bigoplus", "\\bigodot", "\\bigsqcup", "\\smallint",
], {
    numArgs: 0,
}, function(context) {
    return new ParseNode.Operation(
        context.parser.mode,
        null,
        context.funcName,
        true,
        true
    );
});

// \mathop class command
defineFunction(["\\mathop"], {
    numArgs: 1,
}, function(context, args) {
    return new ParseNode.Operation(
        context.parser.mode,
        ordargument(args[0]),
        context.funcName,
        false,
        false
    );
});

import "./functions/operators";

// Fractions
defineFunction([
    "\\dfrac", "\\frac", "\\tfrac",
    "\\dbinom", "\\binom", "\\tbinom",
    "\\\\atopfrac", // can’t be entered directly
], {
    numArgs: 2,
    greediness: 2,
}, function(context, args) {
    return new ParseNode.Fraction(
        context.parser.mode,
        context.funcName,
        args[0],
        args[1]
    );
});

// Horizontal overlap functions
defineFunction(["\\mathllap", "\\mathrlap", "\\mathclap"], {
    numArgs: 1,
    allowedInText: true,
}, function(context, args) {
    return new ParseNode.Lap(
        context.parser.mode,
        args[0],
        context.funcName
    );
});

// smash, with optional [tb], as in AMS
defineFunction(["\\smash"], {
    numArgs: 1,
    numOptionalArgs: 1,
    allowedInText: true,
}, function(context, args) {
    return new ParseNode.Smash(
        context.parser.mode,
        args[1].value,
        args[0]
    );
});

import "./functions/delimsizing";

// Sizing functions (handled in Parser.js explicitly, hence no handler)
defineFunction([
    "\\tiny", "\\scriptsize", "\\footnotesize", "\\small",
    "\\normalsize", "\\large", "\\Large", "\\LARGE", "\\huge", "\\Huge",
], {numArgs: 0}, null);

// Style changing functions (handled in Parser.js explicitly, hence no
// handler)
defineFunction([
    "\\displaystyle", "\\textstyle", "\\scriptstyle",
    "\\scriptscriptstyle",
], {numArgs: 0}, null);

// Old font changing functions
defineFunction([
    "\\rm", "\\sf", "\\tt", "\\bf", "\\it", //"\\sl", "\\sc",
], {numArgs: 0}, null);

defineFunction([
    // styles
    "\\mathrm", "\\mathit", "\\mathbf",

    // families
    "\\mathbb", "\\mathcal", "\\mathfrak", "\\mathscr", "\\mathsf",
    "\\mathtt",

    // aliases
    "\\Bbb", "\\bold", "\\frak",
], {
    numArgs: 1,
    greediness: 2,
}, function(context, args) {
    return new ParseNode.Font(
        context.parser.mode,
        args[0],
        context.funcName
    );
});

// Accents
defineFunction([
    "\\acute", "\\grave", "\\ddot", "\\tilde", "\\bar", "\\breve",
    "\\check", "\\hat", "\\vec", "\\dot",
    "\\widehat", "\\widetilde", "\\overrightarrow", "\\overleftarrow",
    "\\Overrightarrow", "\\overleftrightarrow", "\\overgroup",
    "\\overlinesegment", "\\overleftharpoon", "\\overrightharpoon",
], {
    numArgs: 1,
}, function(context, args) {
    return new ParseNode.Accent(
        context.parser.mode,
        args[0],
        context.funcName);
});

// Text-mode accents
defineFunction([
    "\\'", "\\`", "\\^", "\\~", "\\=", "\\u", "\\.", '\\"',
    "\\r", "\\H", "\\v",
], {
    numArgs: 1,
    allowedInText: true,
    allowedInMath: false,
}, function(context, args) {
    return new ParseNode.Accent(
        context.parser.mode,
        args[0],
        context.funcName);
});

// Horizontal stretchy braces
defineFunction([
    "\\overbrace", "\\underbrace",
], {
    numArgs: 1,
}, function(context, args) {
    return new ParseNode.HorizontalBrace(
        context.parser.mode,
        args[0],
        context.funcName
    );
});

// Stretchy accents under the body
defineFunction([
    "\\underleftarrow", "\\underrightarrow", "\\underleftrightarrow",
    "\\undergroup", "\\underlinesegment", "\\undertilde",
], {
    numArgs: 1,
}, function(context, args) {
    return new ParseNode.AccentUnder(
        context.parser.mode,
        args[0],
        context.funcName
    );
});

// Stretchy arrows with an optional argument
defineFunction([
    "\\xleftarrow", "\\xrightarrow", "\\xLeftarrow", "\\xRightarrow",
    "\\xleftrightarrow", "\\xLeftrightarrow", "\\xhookleftarrow",
    "\\xhookrightarrow", "\\xmapsto", "\\xrightharpoondown",
    "\\xrightharpoonup", "\\xleftharpoondown", "\\xleftharpoonup",
    "\\xrightleftharpoons", "\\xleftrightharpoons", "\\xLongequal",
    "\\xtwoheadrightarrow", "\\xtwoheadleftarrow", "\\xLongequal",
    "\\xtofrom",
], {
    numArgs: 1,
    numOptionalArgs: 1,
}, function(context, args) {
    return new ParseNode.ExtensibleArrow(
        context.parser.mode,
        args[1],
        context.funcName,
        args[0]
    );
});

// enclose
defineFunction(["\\cancel", "\\bcancel", "\\xcancel", "\\sout", "\\fbox"], {
    numArgs: 1,
}, function(context, args) {
    return new ParseNode.Enclosing(
        context.parser.mode,
        args[0],
        context.funcName
    );
});

// Infix generalized fractions
defineFunction(["\\over", "\\choose", "\\atop"], {
    numArgs: 0,
    infix: true,
}, function(context) {
    return new ParseNode.InfixFraction(
        context.parser.mode,
        context.funcName,
        context.token
    );
});

// Row breaks for aligned data
defineFunction(["\\\\", "\\cr"], {
    numArgs: 0,
    numOptionalArgs: 1,
    argTypes: ["size"],
}, function(context, args) {
    return new ParseNode.AlignedRowBreak(
        context.parser.mode,
        context.funcName,
        args[0]
    );
});

// Environment delimiters
defineFunction(["\\begin", "\\end"], {
    numArgs: 1,
    argTypes: ["text"],
}, function(context, args) {
    if (args[0].type !== "ordgroup") {
        throw new ParseError("Invalid environment name", args[0]);
    }

    return new ParseNode.EnvironmentDelimiter(
        context.parser.mode,
        context.funcName,
        args[0].value
    );
});

// Box manipulation
defineFunction(["\\raisebox"], {
    numArgs: 2,
    argTypes: ["size", "text"],
    allowedInText: true,
}, function(context, args) {
    return new ParseNode.RaiseBox(
        context.parser.mode,
        ordargument(args[1]),
        args[0]
    );
});
