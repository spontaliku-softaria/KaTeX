//@flow

import type {Mode, Size, StyleStr} from "./types";
import * as utils from "./utils";
import {Token} from "./Token";
import ParseNode from "./ParseNode";

function toParseNodeArray(nodes: ?AbstractNode[]): ParseNode[] {
    if (!nodes) {
        return [];
    }

    return nodes.map(function(node) {
        return node.toParseNode();
    });
}

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
}

export class Sqrt extends AbstractNode {
    body: ?AbstractNode[];
    index: number;

    constructor(mode: Mode, body: ?AbstractNode[], index: number) {
        super("sqrt", mode);
        this.body = body;
        this.index = index;
    }

    toParseValue() {
        return {
            type: this.type,
            body: toParseNodeArray(this.body),
            index: this.index,
        };
    }
}

const textFunctionFonts = {
    "\\text": undefined, "\\textrm": "mathrm", "\\textsf": "mathsf",
    "\\texttt": "mathtt", "\\textnormal": "mathrm", "\\textbf": "mathbf",
    "\\textit": "textit",
};

export class Text extends AbstractNode {
    body: ?AbstractNode[];
    command: string;
    font: string; //TODO-AST: render logic, move to builders

    constructor(mode: Mode, body: ?AbstractNode[], command: string) {
        super("text", mode);
        this.body = body;
        this.command = command;

        this.font = textFunctionFonts[command] || oldFontFuncs[command];
    }

    toParseValue() {
        return {
            type: this.type,
            body: toParseNodeArray(this.body),
            font: this.font,
        };
    }
}

export class Color extends AbstractNode {
    body: ?AbstractNode[];
    color: Color;

    constructor(mode: Mode, body: ?AbstractNode[], color: string) {
        super("color", mode);
        this.body = body;
        this.color = color;
    }

    toParseValue() {
        return {
            type: this.type,
            value: toParseNodeArray(this.body),
            color: this.color,
        };
    }
}

export class Overline extends AbstractNode {
    body: ?AbstractNode[];

    constructor(mode: Mode, body: ?AbstractNode[]) {
        super("overline", mode);
        this.body = body;
    }

    toParseValue() {
        return {
            type: this.type,
            body: toParseNodeArray(this.body),
        };
    }
}

export class Underline extends AbstractNode {
    body: ?AbstractNode[];

    constructor(mode: Mode, body: ?AbstractNode[]) {
        super("underline", mode);
        this.body = body;
    }

    toParseValue() {
        return {
            type: this.type,
            body: toParseNodeArray(this.body),
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
            shift: this.shift,
            width: this.width,
            height: this.height,
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
            dimension: this.dimension,
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
    mclass: string; //TODO-AST: render logic, move to builders

    constructor(mode: Mode, body: ?AbstractNode[], command: string) {
        super("mclass", mode);
        this.body = body;
        this.command = command;

        this.mclass = "m" + command.substr(5);
    }

    toParseValue() {
        return {
            type: this.type,
            value: toParseNodeArray(this.body),
            mclass: this.mclass,
        };
    }
}

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
            value: toParseNodeArray(this.body),
            modType: this.modType,
        };
    }
}

export class Operation extends AbstractNode {
    body: ?AbstractNode[];
    command: string;
    limits: boolean; //TODO-AST: render logic, move to builders
    symbol: boolean; //TODO-AST: render logic, move to builders
    alwaysHandleSupSub: boolean; //TODO-AST: render logic, move to builders

    constructor(mode: Mode, body: ?AbstractNode[], command: string, limits: boolean,
                symbol: boolean) {
        super("op", mode);
        this.body = body;
        this.command = command;
        this.limits = limits;
        this.symbol = symbol;
    }

    toParseValue() {
        return {
            type: this.type,
            body: toParseNodeArray(this.body),
            limits: this.limits,
            symbol: this.symbol,
        };
    }
}

export class Fraction extends AbstractNode {
    command: string;
    numer: ?AbstractNode;
    denom: ?AbstractNode;
    hasBarLine: boolean; //TODO-AST: render logic, move to builders
    leftDelim: string; //TODO-AST: render logic, move to builders
    rightDelim: string; //TODO-AST: render logic, move to builders
    size: string; //TODO-AST: render logic, move to builders

    constructor(mode: Mode, command: string, numer: ?AbstractNode,
                denom: ?AbstractNode) {
        super("genfrac", mode);
        this.command = command;
        this.numer = numer;
        this.denom = denom;

        switch (command) {
            case "\\dfrac":
            case "\\frac":
            case "\\tfrac":
                this.hasBarLine = true;
                break;
            case "\\\\atopfrac":
                this.hasBarLine = false;
                break;
            case "\\dbinom":
            case "\\binom":
            case "\\tbinom":
                this.hasBarLine = false;
                this.leftDelim = "(";
                this.rightDelim = ")";
                break;
            default:
                throw new Error("Unrecognized genfrac command");
        }

        switch (command) {
            case "\\dfrac":
            case "\\dbinom":
                this.size = "display";
                break;
            case "\\tfrac":
            case "\\tbinom":
                this.size = "text";
                break;
            default:
                this.size = "auto";
        }
    }

    toParseValue() {
        return {
            type: this.type,
            numer: this.numer.toParseNode(),
            denom: this.denom.toParseNode(),
            hasBarLine: this.hasBarLine,
            leftDelim: this.leftDelim,
            rightDelim: this.rightDelim,
            size: this.size,
        };
    }
}

export class Lap extends AbstractNode {
    body: ?AbstractNode[];
    command: string;
    alignment: string; //TODO-AST: render logic, move to builders

    constructor(mode: Mode, body: ?AbstractNode[], command: string) {
        super("lap", mode);
        this.body = body;
        this.command = command;

        this.alignment = command.slice(5);
    }

    toParseValue() {
        return {
            type: this.type,
            body: toParseNodeArray(this.body),
            alignment: this.alignment,
        };
    }
}

export class Smash extends AbstractNode {
    body: ?AbstractNode[];
    command: string;
    tb: string;
    smashHeight: boolean; //TODO-AST: render logic, move to builders
    smashDepth: boolean; //TODO-AST: render logic, move to builders

    constructor(mode: Mode, body: ?AbstractNode[], tb: ?{ value: string }[]) {
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
            body: toParseNodeArray(this.body),
            smashHeight: this.smashHeight,
            smashDepth: this.smashDepth,
        };
    }
}

const fontAliases = {
    "\\Bbb": "\\mathbb",
    "\\bold": "\\mathbf",
    "\\frak": "\\mathfrak",
};

// Old font functions
export const oldFontFuncs = {
    "\\rm": "\\mathrm",
    "\\sf": "\\mathsf",
    "\\tt": "\\mathtt",
    "\\bf": "\\mathbf",
    "\\it": "\\mathit",
    //"\\sl": "textsl",
    //"\\sc": "textsc",
};

export class Font extends AbstractNode {
    body: ?AbstractNode[];
    command: string;
    font: string; //TODO-AST: render logic, move to builders

    constructor(mode: Mode, body: ?AbstractNode[], command: string) {
        super("font", mode);
        this.body = body;
        this.command = command;

        const font = fontAliases[command] ||
                     oldFontFuncs[command] ||
                     command;
        this.font = font.slice(1);
    }

    toParseValue() {
        return {
            type: this.type,
            body: toParseNodeArray(this.body),
            font: this.font,
        };
    }
}

const stretchyAccents = [
    "\\acute", "\\grave", "\\ddot", "\\tilde", "\\bar", "\\breve",
    "\\check", "\\hat", "\\vec", "\\dot",
];

const shiftyAccents = [
    "\\widehat", "\\widetilde",
];

export class Accent extends AbstractNode {
    body: ?AbstractNode[];
    label: string;
    isStretchy: boolean; //TODO-AST: render logic, move to builders
    isShifty: boolean; //TODO-AST: render logic, move to builders

    constructor(mode: Mode, body: ?AbstractNode[], label: string) {
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
            base: toParseNodeArray(this.body),
            label: this.label,
            isStretchy: this.isStretchy,
            isShifty: this.isShifty,
        };
    }
}

export class HorizontalBrace extends AbstractNode {
    body: ?AbstractNode[];
    label: string;
    isOver: boolean; //TODO-AST: render logic, move to builders

    constructor(mode: Mode, body: ?AbstractNode[], label: string) {
        super("horizBrace", mode);
        this.body = body;
        this.label = label;

        this.isOver = /^\\over/.test(label);
    }

    toParseValue() {
        return {
            type: this.type,
            base: toParseNodeArray(this.body),
            label: this.label,
            isOver: this.isOver,
        };
    }
}

export class AccentUnder extends AbstractNode {
    body: ?AbstractNode[];
    label: string;

    constructor(mode: Mode, body: ?AbstractNode[], label: string) {
        super("accentUnder", mode);
        this.body = body;
        this.label = label;
    }

    toParseValue() {
        return {
            type: this.type,
            base: toParseNodeArray(this.body),
            label: this.label,
        };
    }
}

export class ExtensibleArrow extends AbstractNode {
    body: ?AbstractNode[];
    label: string;
    below: ?AbstractNode[];

    constructor(mode: Mode, body: ?AbstractNode[], label: string,
                below: ?AbstractNode[]) {
        super("xArrow", mode);
        this.body = body;
        this.label = label;
        this.below = below;
    }

    toParseValue() {
        return {
            type: this.type,
            body: toParseNodeArray(this.body),
            below: this.below,
        };
    }
}

export class Enclosing extends AbstractNode {
    body: ?AbstractNode[];
    label: string;

    constructor(mode: Mode, body: ?AbstractNode[], label: string) {
        super("enclose", mode);
        this.body = body;
        this.label = label;
    }

    toParseValue() {
        return {
            type: this.type,
            body: toParseNodeArray(this.body),
            label: this.label,
        };
    }
}

export class InfixFraction extends AbstractNode {
    command: string;
    token: Token; //TODO-AST: parser logic, what to do with it?
    replaceWith: string; //TODO-AST: render logic, move to builders

    constructor(mode: Mode, command: string, token: Token) {
        super("infix", mode);
        this.command = command;
        this.token = token;

        switch (command) {
            case "\\over":
                this.replaceWith = "\\frac";
                break;
            case "\\choose":
                this.replaceWith = "\\binom";
                break;
            case "\\atop":
                this.replaceWith = "\\\\atopfrac";
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

export class AlignedRowBreak extends AbstractNode {
    command: string;
    size: ?Size;

    constructor(mode: Mode, command: string, size: Size) {
        super("cr", mode);
        this.command = command;
        this.size = size;
    }

    toParseValue() {
        return {
            type: this.type,
            size: this.size,
        };
    }
}

export class EnvironmentDelimiter extends AbstractNode {
    command: string;
    nameGroup: string;
    name: string; //TODO-AST: render logic, move to builders

    constructor(mode: Mode, command: string, nameGroup: { value: string }[]) {
        super("environment", mode);
        this.command = command;
        this.nameGroup = nameGroup;

        this.name = "";
        for (let i = 0; i < nameGroup.length; ++i) {
            this.name += nameGroup[i].value;
        }
    }

    toParseValue() {
        return {
            type: this.type,
            name: this.name,
            nameGroup: this.nameGroup,
        };
    }
}

export class RaiseBox extends AbstractNode {
    body: ?AbstractNode[];
    amount: Size;

    constructor(mode: Mode, body: ?AbstractNode[], amount: Size) {
        super("raisebox", mode);
        this.body = body;
        this.amount = amount;
    }

    toParseValue() {
        return {
            type: this.type,
            value: toParseNodeArray(this.body),
            dy: this.amount,
        };
    }
}

export class Supsub extends AbstractNode {
    base: ?AbstractNode;
    sup: ?AbstractNode[];
    sub: ?AbstractNode[];

    constructor(mode: Mode, base: ?AbstractNode, sup: ?AbstractNode[],
                sub: ?AbstractNode[]) {
        super("supsub", mode);
        this.base = base;
        this.sup = sup;
        this.sub = sub;
    }

    toParseValue() {
        return {
            type: this.type,
            base: toParseNodeArray(this.body),
            sup: toParseNodeArray(this.sup),
            sub: toParseNodeArray(this.sub),
        };
    }
}

export class LeftRight extends AbstractNode {
    body: ?AbstractNode[];
    command: string;
    left: string;
    right: string;

    constructor(mode: Mode, body: ?AbstractNode[], left: string, right: string,
                command: ?string) {
        super("leftright", mode);
        this.body = body;
        this.left = left;
        this.right = right;
        this.command = command;
    }

    toParseValue() {
        return {
            type: this.type,
            body: toParseNodeArray(this.body),
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
        return toParseNodeArray(this.body);
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
            type: this.type,
            value: toParseNodeArray(this.body),
            style: this.style,
        };
    }
}

//TODO-AST: separate render logic from semantics
export class ArrayNode extends AbstractNode {
    hskipBeforeAndAfter: ?boolean;
    arraystretch: ?number;
    addJot: ?boolean;
    cols: ?AlignSpec[];
    rows: ?AbstractNode[][];
    rowGaps: number[];

    constructor(mode: Mode, hskipBeforeAndAfter: boolean, arraystretch: number,
                addJot: boolean, cols: AlignSpec[], rows: AbstractNode[][],
                rowGaps: number[]) {
        super("array", mode);
        this.hskipBeforeAndAfter = hskipBeforeAndAfter;
        this.arraystretch = arraystretch;
        this.addJot = addJot;
        this.cols = cols;
        this.rows = rows;
        this.rowGaps = rowGaps;
    }

    toParseValue() {
        return {
            type: this.type,
            rows: toParseNodeArray(this.rows),
            hskipBeforeAndAfter: this.hskipBeforeAndAfter,
            arraystretch: this.arraystretch,
            addJot: this.addJot,
            cols: this.cols,
            rowGaps: this.rowGaps,
        };
    }
}

export class Textord extends AbstractNode {
    ligature: string;

    constructor(mode: Mode, ligature: string) {
        super("textord", mode);
        this.ligature = ligature;
    }

    toParseValue() {
        return this.ligature;
    }
}

export class Sizing extends AbstractNode {
    body: ?AbstractNode[];
    size: number;

    constructor(mode: Mode, body: AbstractNode[], size: number) {
        super("sizing", mode);
        this.body = body;
        this.size = size;
    }

    toParseValue() {
        return {
            type: this.type,
            value: toParseNodeArray(this.body),
            size: this.size,
        };
    }
}

