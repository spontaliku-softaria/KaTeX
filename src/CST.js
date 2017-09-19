//@flow

import type {Mode, Size, StyleStr} from "./types";
import * as utils from "./utils";
import {Token} from "./Token";
import ParseNode from "./ParseNode";

export class AbstractNode {
    type: string;
    mode: Mode;

    constructor(type: string, mode: Mode) {
        this.type = type;
        this.mode = mode;
    }

    toParseValue(): {} {
        throw Error("toParseValue is not implemented in " + this.constructor);
    }

    toParseNode(): ParseNode {
        return new ParseNode(this.type, this.toParseValue(), this.mode);
    }

    wrapOrdgroup(mode: Mode, node: ?AbstractNode | AbstractNode[]): ParseNode {
        return new Ordgroup(mode, Array.isArray(node) ? node : [node])
            .toParseNode();
    }

    parseSize(size: Size): { number: number, unit: string } {
        //FIXME: copy-pasted from Parser.js
        const match = (/([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/).exec(size);
        if (!match) {
            throw new Error("Invalid size: '" + size + "'");
        }

        return {
            number: Number(match[1] + match[2]), // sign + magnitude
            unit: match[3],
        };
    }

    toParseNodeArray(nodes: ?AbstractNode[]): ParseNode[] {
        if (!nodes) {
            return null;
        }

        return nodes.map(function(node) {
            return node.toParseNode();
        });
    }
}

export class Sqrt extends AbstractNode {
    body: ?AbstractNode;
    index: ?AbstractNode;

    constructor(mode: Mode, body: ?AbstractNode, index: ?AbstractNode) {
        super("sqrt", mode);
        this.body = body;
        this.index = index;
    }

    toParseValue() {
        return {
            type: this.type,
            body: this.wrapOrdgroup(this.mode, this.body),
            index: this.wrapOrdgroup(this.mode, this.index),
        };
    }
}

export class Text extends AbstractNode {
    body: ?AbstractNode[];
    command: string;
    font: string;

    constructor(mode: Mode, body: ?AbstractNode[], command: string) {
        super("text", mode);
        this.body = body;
        this.command = command;

        this.font = textFunctionFonts[command] || oldFontFuncs[command];
    }

    toParseValue() {
        return {
            type: this.type,
            body: this.toParseNodeArray(this.body),
            font: this.font,
        };
    }
}

Text.prototype.commands = {
    text: "\\text",
    textrm: "\\textrm",
    textsf: "\\textsf",
    texttt: "\\texttt",
    textnormal: "\\textnormal",
    textbf: "\\textbf",
    textit: "\\textit",
    // old font commands
    rm: "\\rm",
    sf: "\\sf",
    tt: "\\tt",
    bf: "\\bf",
    it: "\\it",
};

export class Color extends AbstractNode {
    body: ?AbstractNode[];
    color: string;

    constructor(mode: Mode, body: ?AbstractNode[], color: string) {
        super("color", mode);
        this.body = body;
        this.color = color;
    }

    toParseValue() {
        return {
            type: this.type,
            value: this.toParseNodeArray(this.body),
            color: this.color,
        };
    }
}

export class Overline extends AbstractNode {
    body: ?AbstractNode;

    constructor(mode: Mode, body: ?AbstractNode) {
        super("overline", mode);
        this.body = body;
    }

    toParseValue() {
        return {
            type: this.type,
            body: this.wrapOrdgroup(this.mode, this.body),
        };
    }
}

export class Underline extends AbstractNode {
    body: ?AbstractNode;

    constructor(mode: Mode, body: ?AbstractNode) {
        super("underline", mode);
        this.body = body;
    }

    toParseValue() {
        return {
            type: this.type,
            body: this.wrapOrdgroup(this.mode, this.body),
        };
    }
}

export class Rule extends AbstractNode {
    width: Size;
    height: Size;
    shift: ?Size;

    constructor(mode: Mode, width: Size, height: Size, shift: ?Size) {
        super("rule", mode);
        this.width = width;
        this.height = height;
        this.shift = shift;
    }

    toParseValue() {
        return {
            type: this.type,
            shift: this.parseSize(this.shift),
            width: this.parseSize(this.width),
            height: this.parseSize(this.height),
        };
    }
}

export class Kern extends AbstractNode {
    dimension: Size;

    constructor(mode: Mode, dimension: Size) {
        super("kern", mode);
        this.dimension = dimension;
    }

    toParseValue() {
        return {
            type: this.type,
            dimension: this.parseSize(this.dimension),
        };
    }
}

export class KatexSymbol extends AbstractNode {
    constructor(mode: Mode) {
        super("katex", mode);
    }

    toParseValue() {
        return {
            type: this.type,
        };
    }
}

export class MathClass extends AbstractNode {
    body: ?AbstractNode[];
    command: string;
    mclass: string;

    constructor(mode: Mode, body: ?AbstractNode[], command: string) {
        super("mclass", mode);
        this.body = body;
        this.command = command;

        this.mclass = "m" + command.substr(5);
    }

    toParseValue() {
        return {
            type: this.type,
            value: this.toParseNodeArray(this.body),
            mclass: this.mclass,
        };
    }
}

MathClass.prototype.commands = {
    mathord: "\\mathord",
    mathbin: "\\mathbin",
    mathrel: "\\mathrel",
    mathopen: "\\mathopen",
    mathclose: "\\mathclose",
    mathpunct: "\\mathpunct",
    mathinner: "\\mathinner",
};

export class Mod extends AbstractNode {
    body: ?AbstractNode[];
    modType: string;

    constructor(mode: Mode, body: ?AbstractNode[], modType: string) {
        super("mod", mode, body);
        this.body = body;
        this.modType = modType;
    }

    toParseValue() {
        return {
            type: this.type,
            value: this.toParseNodeArray(this.body),
            modType: this.modType.slice(1),
        };
    }
}

Mod.prototype.commands = {
    bmod: "\\bmod",
    pod: "\\pod",
    pmod: "\\pmod",
    mod: "\\mod",
};

export class Operation extends AbstractNode {
    body: ?AbstractNode[];
    command: string;
    limits: boolean;
    symbol: boolean;
    alwaysHandleSupSub: boolean;

    constructor(mode: Mode, body: ?AbstractNode[], command: string) {
        super("op", mode);
        this.body = body;
        this.command = command;

        // No limits, not symbols
        if (operationsNotLimitsNotSymbols.indexOf(command) >= 0) {
            this.limits = false;
            this.symbol = false;
        } else if (operationsLimitsNotSymbols.indexOf(command) >= 0) {
            this.limits = true;
            this.symbol = false;
        } else if (operationsNotLimitsSymbols.indexOf(command) >= 0) {
            this.limits = false;
            this.symbol = true;
        } else if (operationsLimitsSymbols.indexOf(command) >= 0) {
            this.limits = true;
            this.symbol = true;
        }
    }

    toParseValue() {
        return {
            type: this.type,
            value: this.command === this.commands.mathop ?
                this.toParseNodeArray(this.body) :
                undefined,
            body: this.command !== this.commands.mathop ?
                this.command :
                undefined,
            limits: this.limits,
            symbol: this.symbol,
        };
    }
}

Operation.prototype.commands = {
    arcsin: "\\arcsin",
    arccos: "\\arccos",
    arctan: "\\arctan",
    arctg: "\\arctg",
    arcctg: "\\arcctg",
    arg: "\\arg",
    ch: "\\ch",
    cos: "\\cos",
    cosec: "\\cosec",
    cosh: "\\cosh",
    cot: "\\cot",
    cotg: "\\cotg",
    coth: "\\coth",
    csc: "\\csc",
    ctg: "\\ctg",
    cth: "\\cth",
    deg: "\\deg",
    dim: "\\dim",
    exp: "\\exp",
    hom: "\\hom",
    ker: "\\ker",
    lg: "\\lg",
    ln: "\\ln",
    log: "\\log",
    sec: "\\sec",
    sin: "\\sin",
    sinh: "\\sinh",
    sh: "\\sh",
    tan: "\\tan",
    tanh: "\\tanh",
    tg: "\\tg",
    th: "\\th",
    det: "\\det",
    gcd: "\\gcd",
    inf: "\\inf",
    lim: "\\lim",
    liminf: "\\liminf",
    limsup: "\\limsup",
    max: "\\max",
    min: "\\min",
    Pr: "\\Pr",
    sup: "\\sup",
    int: "\\int",
    iint: "\\iint",
    iiint: "\\iiint",
    oint: "\\oint",
    coprod: "\\coprod",
    bigvee: "\\bigvee",
    bigwedge: "\\bigwedge",
    biguplus: "\\biguplus",
    bigcap: "\\bigcap",
    bigcup: "\\bigcup",
    intop: "\\intop",
    prod: "\\prod",
    sum: "\\sum",
    bigotimes: "\\bigotimes",
    bigoplus: "\\bigoplus",
    bigodot: "\\bigodot",
    bigsqcup: "\\bigsqcup",
    smallint: "\\smallint",
    mathop: "\\mathop",
};

export class Fraction extends AbstractNode {
    command: string;
    numer: ?AbstractNode;
    denom: ?AbstractNode;
    hasBarLine: boolean;
    leftDelim: string;
    rightDelim: string;
    size: string;

    constructor(mode: Mode, command: string, numer: ?AbstractNode,
                denom: ?AbstractNode) {
        super("genfrac", mode);
        this.command = command;
        this.numer = numer;
        this.denom = denom;
        this.leftDelim = null;
        this.rightDelim = null;

        switch (command) {
            case this.commands.dfrac:
            case this.commands.frac:
            case this.commands.tfrac:
                this.hasBarLine = true;
                break;
            case this.commands.atopfrac:
                this.hasBarLine = false;
                break;
            case this.commands.dbinom:
            case this.commands.binom:
            case this.commands.tbinom:
                this.hasBarLine = false;
                this.leftDelim = "(";
                this.rightDelim = ")";
                break;
            default:
                throw new Error("Unrecognized genfrac command");
        }

        switch (command) {
            case this.commands.dfrac:
            case this.commands.dbinom:
                this.size = "display";
                break;
            case this.commands.tfrac:
            case this.commands.tbinom:
                this.size = "text";
                break;
            default:
                this.size = "auto";
        }
    }

    toParseValue() {
        return {
            type: this.type,
            numer: this.wrapOrdgroup(this.mode, this.numer),
            denom: this.wrapOrdgroup(this.mode, this.denom),
            hasBarLine: this.hasBarLine,
            leftDelim: this.leftDelim,
            rightDelim: this.rightDelim,
            size: this.size,
        };
    }
}

Fraction.prototype.commands = {
    dfrac: "\\dfrac",
    frac: "\\frac",
    tfrac: "\\tfrac",
    dbinom: "\\dbinom",
    binom: "\\binom",
    tbinom: "\\tbinom",
    atopfrac: "\\\\atopfrac", // can’t be entered directly
};

export class Lap extends AbstractNode {
    body: ?AbstractNode;
    command: string;
    alignment: string;

    constructor(mode: Mode, body: ?AbstractNode, command: string) {
        super("lap", mode);
        this.body = body;
        this.command = command;

        this.alignment = command.slice(5);
    }

    toParseValue() {
        return {
            type: this.type,
            body: this.body ? this.body.toParseNode() : null,
            alignment: this.alignment,
        };
    }
}

Lap.prototype.commands = {
    mathllap: "\\mathllap",
    mathrlap: "\\mathrlap",
    mathclap: "\\mathclap",
};

export class Smash extends AbstractNode {
    body: ?AbstractNode;
    command: string;
    tb: string;
    smashHeight: boolean;
    smashDepth: boolean;

    constructor(mode: Mode, body: ?AbstractNode, tb: ?{ value: string }[]) {
        super("smash", mode);
        this.body = body;
        this.tb = tb;

        this.smashHeight = false;
        this.smashDepth = false;
        if (tb) {
            // Optional [tb] argument is engaged.
            // ref: amsmath: \renewcommand{\smash}[1][tb]{%
            //               def\mb@t{\ht}\def\mb@b{\dp}\def\mb@tb{\ht\z@\z@\dp}%
            let letter = "";
            for (let i = 0; i < tb.length; ++i) {
                letter = tb[i].value;
                if (letter === "t") {
                    this.smashHeight = true;
                } else if (letter === "b") {
                    this.smashDepth = true;
                } else {
                    this.smashHeight = false;
                    this.smashDepth = false;
                    break;
                }
            }
        } else {
            this.smashHeight = true;
            this.smashDepth = true;
        }
    }

    toParseValue() {
        return {
            type: this.type,
            body: this.wrapOrdgroup(this.mode, this.body),
            smashHeight: this.smashHeight,
            smashDepth: this.smashDepth,
        };
    }
}

export class Font extends AbstractNode {
    body: ?AbstractNode;
    command: string;
    font: string;

    constructor(mode: Mode, body: ?AbstractNode, command: string) {
        super("font", mode);
        this.body = body;
        this.command = command;

        this.font = fontAliases[command] ||
                    textFunctionFonts[command] ||
                    oldFontFuncs[command] ||
                    command.slice(1);
    }

    toParseValue() {
        return {
            type: this.type,
            body: this.body ? this.body.toParseNode() : null,
            font: this.font,
        };
    }
}

Font.prototype.commands = {
    // styles
    mathrm: "\\mathrm",
    mathit: "\\mathit",
    mathbf: "\\mathbf",

    // families
    mathbb: "\\mathbb",
    mathcal: "\\mathcal",
    mathfrak: "\\mathfrak",
    mathscr: "\\mathscr",
    mathsf: "\\mathsf",
    mathtt: "\\mathtt",

    // aliases
    Bbb: "\\Bbb",
    bold: "\\bold",
    frak: "\\frak",
};

export class Accent extends AbstractNode {
    body: ?AbstractNode;
    label: string;
    isStretchy: boolean;
    isShifty: boolean;

    constructor(mode: Mode, body: ?AbstractNode, label: string) {
        super("accent", mode);
        this.body = body;
        this.label = label;

        this.isStretchy = !utils.contains(stretchyAccents, label);

        this.isShifty = !this.isStretchy ||
                        utils.contains(shiftyAccents, label);
    }

    toParseValue() {
        return {
            type: this.type,
            base: this.body ? this.body.toParseNode() : null,
            label: this.label,
            isStretchy: this.isStretchy,
            isShifty: this.isShifty,
        };
    }
}

Accent.prototype.commands = {
    acute: "\\acute",
    grave: "\\grave",
    ddot: "\\ddot",
    tilde: "\\tilde",
    bar: "\\bar",
    breve: "\\breve",
    check: "\\check",
    hat: "\\hat",
    vec: "\\vec",
    dot: "\\dot",
    widehat: "\\widehat",
    widetilde: "\\widetilde",
    overrightarrow: "\\overrightarrow",
    overleftarrow: "\\overleftarrow",
    Overrightarrow: "\\Overrightarrow",
    overleftrightarrow: "\\overleftrightarrow",
    overgroup: "\\overgroup",
    overlinesegment: "\\overlinesegment",
    overleftharpoon: "\\overleftharpoon",
    overrightharpoon: "\\overrightharpoon",

    // Text-mode accents
    quote: "\\'",
    graveSym: "\\`",
    cap: "\\^",
    tilda: "\\~",
    eq: "\\=",
    u: "\\u",
    dotSym: "\\.",
    backslash: "\\\"",
    r: "\\r",
    H: "\\H",
    v: "\\v",
};

export class HorizontalBrace extends AbstractNode {
    body: ?AbstractNode;
    label: string;
    isOver: boolean;

    constructor(mode: Mode, body: ?AbstractNode, label: string) {
        super("horizBrace", mode);
        this.body = body;
        this.label = label;

        this.isOver = /^\\over/.test(label);
    }

    toParseValue() {
        return {
            type: this.type,
            base: this.body ? this.body.toParseNode() : null,
            label: this.label,
            isOver: this.isOver,
        };
    }
}

HorizontalBrace.prototype.commands = {
    overbrace: "\\overbrace",
    underbrace: "\\underbrace",
};

export class AccentUnder extends AbstractNode {
    body: ?AbstractNode;
    label: string;

    constructor(mode: Mode, body: ?AbstractNode, label: string) {
        super("accentUnder", mode);
        this.body = body;
        this.label = label;
    }

    toParseValue() {
        return {
            type: this.type,
            base: this.body ? this.body.toParseNode() : null,
            label: this.label,
        };
    }
}

AccentUnder.prototype.commands = {
    underleftarrow: "\\underleftarrow",
    underrightarrow: "\\underrightarrow",
    underleftrightarrow: "\\underleftrightarrow",
    undergroup: "\\undergroup",
    underlinesegment: "\\underlinesegment",
    undertilde: "\\undertilde",
};

export class ExtensibleArrow extends AbstractNode {
    body: ?AbstractNode;
    label: string;
    below: ?AbstractNode;

    constructor(mode: Mode, body: ?AbstractNode, label: string,
                below: ?AbstractNode) {
        super("xArrow", mode);
        this.body = body;
        this.label = label;
        this.below = below;
    }

    toParseValue() {
        return {
            type: this.type,
            body: this.body ? this.body.toParseNode() : null,
            below: this.wrapOrdgroup(this.mode, this.below),
            label: this.label,
        };
    }
}

ExtensibleArrow.prototype.commands = {
    xleftarrow: "\\xleftarrow",
    xrightarrow: "\\xrightarrow",
    xLeftarrow: "\\xLeftarrow",
    xRightarrow: "\\xRightarrow",
    xleftrightarrow: "\\xleftrightarrow",
    xLeftrightarrow: "\\xLeftrightarrow",
    xhookleftarrow: "\\xhookleftarrow",
    xhookrightarrow: "\\xhookrightarrow",
    xmapsto: "\\xmapsto",
    xrightharpoondown: "\\xrightharpoondown",
    xrightharpoonup: "\\xrightharpoonup",
    xleftharpoondown: "\\xleftharpoondown",
    xleftharpoonup: "\\xleftharpoonup",
    xrightleftharpoons: "\\xrightleftharpoons",
    xleftrightharpoons: "\\xleftrightharpoons",
    xLongequal: "\\xLongequal",
    xtwoheadrightarrow: "\\xtwoheadrightarrow",
    xtwoheadleftarrow: "\\xtwoheadleftarrow",
    xtofrom: "\\xtofrom",
};

export class Enclose extends AbstractNode {
    body: ?AbstractNode;
    label: string;

    constructor(mode: Mode, body: ?AbstractNode, label: string) {
        super("enclose", mode);
        this.body = body;
        this.label = label;
    }

    toParseValue() {
        return {
            type: this.type,
            body: this.body ? this.body.toParseNode() : null,
            label: this.label,
        };
    }
}

Enclose.prototype.commands = {
    cancel: "\\cancel",
    bcancel: "\\bcancel",
    xcancel: "\\xcancel",
    sout: "\\sout",
    fbox: "\\fbox",
};

//TODO: find out how to handle InfixFraction - it is being parsed into Fraction
// in Parser.js:handleInfixNodes
export class InfixFraction extends AbstractNode {
    command: string;
    token: Token;
    replaceWith: string;

    constructor(mode: Mode, command: string, token: Token) {
        super("infix", mode);
        this.command = command;
        this.token = token;

        switch (command) {
            case this.commands.over:
                this.replaceWith = Fraction.prototype.commands.frac;
                break;
            case this.commands.choose:
                this.replaceWith = Fraction.prototype.commands.binom;
                break;
            case this.commands.atop:
                this.replaceWith = Fraction.prototype.commands.atopfrac;
                break;
            default:
                throw new Error("Unrecognized infix genfrac command");
        }
    }

    toParseValue() {
        return {
            type: this.type,
            replaceWith: this.replaceWith,
            token: this.token,
        };
    }
}

InfixFraction.prototype.commands = {
    over: "\\over",
    choose: "\\choose",
    atop: "\\atop",
};

export class RaiseBox extends AbstractNode {
    body: ?AbstractNode | AbstractNode[];
    amount: Size;

    constructor(mode: Mode, body: ?AbstractNode | AbstractNode[], amount: Size) {
        super("raisebox", mode);
        this.body = body;
        this.amount = amount;
    }

    toParseValue() {
        return {
            type: this.type,
            value: this.toParseNodeArray(this.body),
            body: this.wrapOrdgroup("text", this.body),
            dy: {
                mode: this.mode,
                type: "size",
                value: this.parseSize(this.amount),
            },
        };
    }
}

export class Supsub extends AbstractNode {
    base: ?AbstractNode;
    sup: ?AbstractNode;
    sub: ?AbstractNode;

    constructor(mode: Mode, base: ?AbstractNode, sup: ?AbstractNode,
                sub: ?AbstractNode) {
        super("supsub", mode);
        this.base = base;
        this.sup = sup;
        this.sub = sub;
    }

    toParseValue() {
        return {
            base: this.base ? this.base.toParseNode() : null,
            sup: this.sup ? this.sup.toParseNode() : null,
            sub: this.sub ? this.sub.toParseNode() : null,
        };
    }
}

export class LeftRight extends AbstractNode {
    body: ?AbstractNode[];
    left: string;
    right: string;

    constructor(mode: Mode, body: ?AbstractNode[], left: string, right: string) {
        super("leftright", mode);
        this.body = body;
        this.left = left;
        this.right = right;
    }

    toParseValue() {
        return {
            body: this.toParseNodeArray(this.body),
            left: this.left,
            right: this.right,
        };
    }
}

export class Ordgroup extends AbstractNode {
    body: ?AbstractNode[];

    constructor(mode: Mode, body: ?AbstractNode[]) {
        super("ordgroup", mode);
        this.body = body;
    }

    toParseValue() {
        return this.toParseNodeArray(this.body);
    }
}

export class Styling extends AbstractNode {
    body: ?AbstractNode[];
    style: StyleStr;

    constructor(mode: Mode, body: AbstractNode[], style: StyleStr) {
        super("styling", mode);
        this.body = body;
        this.style = style;
    }

    toParseValue() {
        return {
            value: this.toParseNodeArray(this.body),
            style: this.style,
        };
    }
}

export class AbstractEnvironment extends AbstractNode {
    name: string;
    body: AbstractNode[][];
    style: string;
    rowGaps: number[];

    constructor(mode: Mode, name: string, body: AbstractNode[][],
                style: "display" | "text", rowGaps: ?number[]) {
        super("array", mode);
        this.name = name;
        this.body = body;
        this.style = style;
        //FIXME strange Katex behaviour (try to remove [null] and run tests)
        this.rowGaps = rowGaps || [null];
    }

    toParseNode(): ParseNode {
        const parseValue = this.toParseValue();
        parseValue.rowGaps = this.rowGaps;

        const mode = this.mode;
        const style = this.style;
        parseValue.body = this.body.map(function(row) {
            return row.map(function(cell) {
                return new Styling(mode, [new Ordgroup(mode, [cell])], style)
                    .toParseNode();
            });
        });

        const delimiters = envitronmentDelimiters[this.name];
        if (delimiters) {
            const leftRightParseNode = new LeftRight(this.mode, [],
                delimiters[0], delimiters[1])
                .toParseNode();

            leftRightParseNode.value.body = [
                new ParseNode(this.type, parseValue, this.mode),
            ];

            return leftRightParseNode;
        } else {
            return new ParseNode(this.type, parseValue, this.mode);
        }
    }

    toColsParseNodes(cols: ?Array<EnvironmentAlign | EnvironmentSeparator>) {
        if (!cols) {
            return [];
        }

        return cols.map(function(col) {
            return col.toValue();
        });
    }
}

export class ArrayEnvironment extends AbstractEnvironment {
    cols: ?Array<EnvironmentAlign | EnvironmentSeparator>;

    constructor(mode: Mode, name: string, body: AbstractNode[][],
                cols: Array<EnvironmentAlign | EnvironmentSeparator>,
                rowGaps: ?number[]) {
        super(mode, name, body,
            name === ArrayEnvironment.prototype.environments.darray ?
                "display" :
                "text",
            rowGaps);
        this.cols = cols;
    }

    toParseValue() {
        return {
            type: this.type,
            hskipBeforeAndAfter: true,
            cols: this.toColsParseNodes(this.cols),
        };
    }
}

ArrayEnvironment.prototype.environments = {
    array: "array",
    darray: "darray",
};

export class MatrixEnvironment extends AbstractEnvironment {
    constructor(mode: Mode, name: string, body: AbstractNode[][],
                rowGaps: ?number[]) {
        super(mode, name, body, "text", rowGaps);
    }

    toParseValue() {
        return {
            type: this.type,
            hskipBeforeAndAfter: false,
        };
    }
}

MatrixEnvironment.prototype.environments = {
    matrix: "matrix",
    pmatrix: "pmatrix",
    bmatrix: "bmatrix",
    Bmatrix: "Bmatrix",
    vmatrix: "vmatrix",
    Vmatrix: "Vmatrix",
};

export class CasesEnvironment extends AbstractEnvironment {
    constructor(mode: Mode, name: string, body: AbstractNode[][],
                rowGaps: ?number[]) {
        super(mode, name, body,
            name === CasesEnvironment.prototype.environments.dcases ?
                "display" :
                "text",
            rowGaps);
    }

    toParseValue() {
        return {
            type: this.type,
            arraystretch: 1.2,
            cols: this.toColsParseNodes([
                // TODO(kevinb) get the current style.
                // For now we use the metrics for TEXT style which is what we were
                // doing before.  Before attempting to get the current style we
                // should look at TeX's behavior especially for \over and matrices.
                new EnvironmentAlign("l", 0, 1.0 /* 1em quad */),
                new EnvironmentAlign("l", 0, 0),
            ]),
        };
    }
}

CasesEnvironment.prototype.environments = {
    cases: "cases",
    dcases: "dcases",
};

export class AlignedEnvironment extends AbstractEnvironment {
    constructor(mode: Mode, name: string, body: AbstractNode[][],
                rowGaps: ?number[]) {
        super(mode, name, body, "display", rowGaps);
    }

    // TODO: do stuff from environments.js
    toParseValue(): {} {
        return {
            type: this.type,
            addJot: true,
        };
    }
}

AlignedEnvironment.prototype.environments = {
    aligned: "aligned",
};

export class GatheredEnvironment extends AbstractEnvironment {
    constructor(mode: Mode, name: string, body: AbstractNode[][],
                rowGaps: ?number[]) {
        super(mode, name, body, "display", rowGaps);
    }

    toParseValue(): {} {
        return {
            type: this.type,
            cols: this.toColsParseNodes([
                new EnvironmentAlign("c"),
            ]),
            addJot: true,
        };
    }
}

GatheredEnvironment.prototype.environments = {
    gathered: "gathered",
};

export class EnvironmentAlign {
    align: string;
    pregap: ?number;
    postgap: ?number;

    constructor(align: "l" | "r" | "c", pregap: ?number, postgap: ?number) {
        this.align = align;
        this.pregap = pregap;
        this.postgap = postgap;
    }

    //FIXME this is not AbstractNode.toParseValue! Add interface?
    toValue() {
        return {
            type: "align",
            align: this.align,
            pregap: this.pregap,
            postgap: this.postgap,
        };
    }
}

export class EnvironmentSeparator {
    constructor() {
    }

    //FIXME this is not AbstractNode.toParseValue! Add interface?
    toValue() {
        return {
            type: "separator",
            separator: "|", //FIXME: is there any other separators?
        };
    }
}

export class Sizing extends AbstractNode {
    body: ?AbstractNode[];
    size: number;

    constructor(mode: Mode, body: AbstractNode[], size: number /* 1-11 */) {
        super("sizing", mode);
        this.body = body;
        this.size = size;
    }

    toParseValue() {
        return {
            value: this.toParseNodeArray(this.body),
            size: this.size,
        };
    }
}

export class AbstractSymbol extends AbstractNode {
    ligature: string;

    constructor(type: string, mode: Mode, ligature: string) {
        super(type, mode);
        this.ligature = ligature;
    }

    toParseValue() {
        return this.ligature;
    }
}

export class Textord extends AbstractSymbol {
    constructor(mode: Mode, ligature: string) {
        super("textord", mode, ligature);
    }
}

export class Mathord extends AbstractSymbol {
    constructor(mode: Mode, ligature: string) {
        super("mathord", mode, ligature);
    }
}

const textFunctionFonts = {};
textFunctionFonts[Text.prototype.commands.textrm] = "mathrm";
textFunctionFonts[Text.prototype.commands.textsf] = "mathsf";
textFunctionFonts[Text.prototype.commands.texttt] = "mathtt";
textFunctionFonts[Text.prototype.commands.textnormal] = "mathrm";
textFunctionFonts[Text.prototype.commands.textbf] = "mathbf";
textFunctionFonts[Text.prototype.commands.textit] = "textit";

// Old font functions
const oldFontFuncs = {};
oldFontFuncs[Text.prototype.commands.rm] = "mathrm";
oldFontFuncs[Text.prototype.commands.sf] = "mathsf";
oldFontFuncs[Text.prototype.commands.tt] = "mathtt";
oldFontFuncs[Text.prototype.commands.bf] = "mathbf";
oldFontFuncs[Text.prototype.commands.it] = "mathit";
//oldFontFuncs[Text.prototype.sl] = "textsl";
//oldFontFuncs[Text.prototype.sc] = "textsc";

const fontAliases = {};
fontAliases[Font.prototype.commands.Bbb] = "mathbb";
fontAliases[Font.prototype.commands.bold] = "mathbf";
fontAliases[Font.prototype.commands.frak] = "mathfrak";

const operationsNotLimitsNotSymbols = [
    Operation.prototype.commands.arcsin, Operation.prototype.commands.arccos,
    Operation.prototype.commands.arctan, Operation.prototype.commands.arctg,
    Operation.prototype.commands.arcctg, Operation.prototype.commands.arg,
    Operation.prototype.commands.ch, Operation.prototype.commands.cos,
    Operation.prototype.commands.cosec, Operation.prototype.commands.cosh,
    Operation.prototype.commands.cot, Operation.prototype.commands.cotg,
    Operation.prototype.commands.coth, Operation.prototype.commands.csc,
    Operation.prototype.commands.ctg, Operation.prototype.commands.cth,
    Operation.prototype.commands.deg, Operation.prototype.commands.dim,
    Operation.prototype.commands.exp, Operation.prototype.commands.hom,
    Operation.prototype.commands.ker, Operation.prototype.commands.lg,
    Operation.prototype.commands.ln, Operation.prototype.commands.log,
    Operation.prototype.commands.sec, Operation.prototype.commands.sin,
    Operation.prototype.commands.sinh, Operation.prototype.commands.sh,
    Operation.prototype.commands.tan, Operation.prototype.commands.tanh,
    Operation.prototype.commands.tg, Operation.prototype.commands.th,
    Operation.prototype.commands.mathop,
];

const operationsLimitsNotSymbols = [
    Operation.prototype.commands.det, Operation.prototype.commands.gcd,
    Operation.prototype.commands.inf, Operation.prototype.commands.lim,
    Operation.prototype.commands.liminf, Operation.prototype.commands.limsup,
    Operation.prototype.commands.max, Operation.prototype.commands.min,
    Operation.prototype.commands.Pr, Operation.prototype.commands.sup,
];

const operationsNotLimitsSymbols = [
    Operation.prototype.commands.int, Operation.prototype.commands.iint,
    Operation.prototype.commands.iiint, Operation.prototype.commands.oint,
];

const operationsLimitsSymbols = [
    Operation.prototype.commands.coprod, Operation.prototype.commands.bigvee,
    Operation.prototype.commands.bigwedge,
    Operation.prototype.commands.biguplus, Operation.prototype.commands.bigcap,
    Operation.prototype.commands.bigcup, Operation.prototype.commands.intop,
    Operation.prototype.commands.prod, Operation.prototype.commands.sum,
    Operation.prototype.commands.bigotimes,
    Operation.prototype.commands.bigoplus, Operation.prototype.commands.bigodot,
    Operation.prototype.commands.bigsqcup,
    Operation.prototype.commands.smallint,
];

const stretchyAccents = [
    Accent.prototype.commands.acute, Accent.prototype.commands.grave,
    Accent.prototype.commands.ddot, Accent.prototype.commands.tilde,
    Accent.prototype.commands.bar, Accent.prototype.commands.breve,
    Accent.prototype.commands.check, Accent.prototype.commands.hat,
    Accent.prototype.commands.vec, Accent.prototype.commands.dot,
];

const shiftyAccents = [
    Accent.prototype.commands.widehat, Accent.prototype.commands.widetilde,
];

const envitronmentDelimiters = {};
envitronmentDelimiters[MatrixEnvironment.prototype.environments.pmatrix] =
    ["(", ")"];
envitronmentDelimiters[MatrixEnvironment.prototype.environments.bmatrix] =
    ["[", "]"];
envitronmentDelimiters[MatrixEnvironment.prototype.environments.Bmatrix] =
    ["\\{", "\\}"];
envitronmentDelimiters[MatrixEnvironment.prototype.environments.vmatrix] =
    ["|", "|"];
envitronmentDelimiters[MatrixEnvironment.prototype.environments.Vmatrix] =
    ["\\Vert", "\\Vert"];
envitronmentDelimiters[MatrixEnvironment.prototype.environments.pmatrix] =
    ["(", ")"];
envitronmentDelimiters[CasesEnvironment.prototype.environments.cases] =
    envitronmentDelimiters[CasesEnvironment.prototype.environments.dcases] =
        ["\\{", "."];
