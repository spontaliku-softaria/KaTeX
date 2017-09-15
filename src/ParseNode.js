// @flow
import {LexerInterface, Token} from "./Token";
import type {Mode, Size, StyleStr} from "./types";
import utils from "./utils";

/**
 * The resulting parse tree nodes of the parse tree.
 *
 * It is possible to provide position information, so that a `ParseNode` can
 * fulfill a role similar to a `Token` in error reporting.
 * For details on the corresponding properties see `Token` constructor.
 * Providing such information can lead to better error reporting.
 */
export class ParseNode {
    type: string;
    mode: Mode;
    // TODO: We should combine these to ({lexer, start, end}|void) as they
    // should all exist together or not exist at all. That way, only a single
    // void check needs to be done to see if we have metadata.
    lexer: LexerInterface | void;
    start: number | void;
    end: number | void;

    /**
     * @param type - type of node, like e.g. "ordgroup"
     * @param mode - parse mode in action for this node, "math" or "text"
     * @param body
     */
    constructor(type: string, mode: Mode, body: ?ParseNode[]) {
        this.type = type;
        this.mode = mode;
        this.body = body;
    }

    /**
     * @param firstToken - first token of the input for this node, will omit
     * position information if unset
     * @param lastToken - last token of the input for this node, will default to
     * firstToken if unset
     */
    setTokens(firstToken?: Token, lastToken?: Token) {
        if (firstToken && (!lastToken || lastToken.lexer === firstToken.lexer)) {
            this.lexer = firstToken.lexer;
            this.start = firstToken.start;
            this.end = (lastToken || firstToken).end;
        }
    }

    //TODO-AST: replace with visitors?
    instance(typeConstructor): typeof typeConstructor {
        if (this instanceof typeConstructor) {
            return this;
        } else {
            return {};
        }
    }
}

export class Sqrt extends ParseNode {
    body: ?ParseNode[];
    index: number;

    constructor(mode: Mode, body: ?ParseNode[], index: number) {
        super("sqrt", mode, body);
        this.index = index;
    }
}

const textFunctionFonts = {
    "\\text": undefined, "\\textrm": "mathrm", "\\textsf": "mathsf",
    "\\texttt": "mathtt", "\\textnormal": "mathrm", "\\textbf": "mathbf",
    "\\textit": "textit",
};

export class Text extends ParseNode {
    body: ?ParseNode[];
    command: string;
    font: string; //TODO-AST: render logic, move to builders

    constructor(mode: Mode, body: ?ParseNode[], command: string) {
        super("text", mode, body);
        this.command = command;

        this.font = textFunctionFonts[command] || oldFontFuncs[command];
    }
}

export class Color extends ParseNode {
    body: ?ParseNode[];
    color: Color;

    constructor(mode: Mode, body: ?ParseNode[], color: string) {
        super("color", mode, body);
        this.color = color;
    }
}

export class Overline extends ParseNode {
    body: ?ParseNode[];

    constructor(mode: Mode, body: ?ParseNode[]) {
        super("overline", mode, body);
    }
}

export class Underline extends ParseNode {
    body: ?ParseNode[];

    constructor(mode: Mode, body: ?ParseNode[]) {
        super("underline", mode, body);
    }
}

export class Rule extends ParseNode {
    width: Size;
    height: Size;
    shift: ?Size;

    constructor(mode: Mode, width: Size, height: Size, shift: ?Size) {
        super("rule", mode);
        this.width = width;
        this.height = height;
        this.shift = shift;
    }
}

export class Kern extends ParseNode {
    dimension: Size;

    constructor(mode: Mode, dimension: Size) {
        super("kern", mode);
        this.dimension = dimension;
    }
}

export class KatexSymbol extends ParseNode {
    constructor(mode: Mode) {
        super("katex", mode);
    }
}

export class MathClass extends ParseNode {
    body: ?ParseNode[];
    command: string;
    mclass: string; //TODO-AST: render logic, move to builders

    constructor(mode: Mode, body: ?ParseNode[], command: string) {
        super("mclass", mode, body);
        this.command = command;

        this.mclass = "m" + command.substr(5);
    }
}

export class Mod extends ParseNode {
    body: ?ParseNode[];
    modType: string;

    constructor(mode: Mode, body: ?ParseNode[], modType: string) {
        super("mod", mode, body);
        this.modType = modType;
    }
}

export class Operation extends ParseNode {
    body: ?ParseNode[];
    command: string;
    limits: boolean; //TODO-AST: render logic, move to builders
    symbol: boolean; //TODO-AST: render logic, move to builders
    alwaysHandleSupSub: boolean; //TODO-AST: render logic, move to builders

    constructor(mode: Mode, body: ?ParseNode[], command: string, limits: boolean,
                symbol: boolean) {
        super("op", mode, body);
        this.command = command;
        this.limits = limits;
        this.symbol = symbol;
    }
}

export class Fraction extends ParseNode {
    command: string;
    numer: ?ParseNode[];
    denom: ?ParseNode[];
    hasBarLine: boolean; //TODO-AST: render logic, move to builders
    leftDelim: string; //TODO-AST: render logic, move to builders
    rightDelim: string; //TODO-AST: render logic, move to builders
    size: string; //TODO-AST: render logic, move to builders

    constructor(mode: Mode, command: string, numer: ?ParseNode[],
                denom: ?ParseNode[]) {
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
}

export class Lap extends ParseNode {
    body: ?ParseNode[];
    command: string;
    alignment: string; //TODO-AST: render logic, move to builders

    constructor(mode: Mode, body: ?ParseNode[], command: string) {
        super("lap", mode, body);
        this.command = command;

        this.alignment = command.slice(5);
    }
}

export class Smash extends ParseNode {
    body: ?ParseNode[];
    command: string;
    tb: string;
    smashHeight: boolean; //TODO-AST: render logic, move to builders
    smashDepth: boolean; //TODO-AST: render logic, move to builders

    constructor(mode: Mode, body: ?ParseNode[], tb: ?{value: string}[]) {
        super("smash", mode, body);
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

export class Font extends ParseNode {
    body: ?ParseNode[];
    command: string;
    font: string; //TODO-AST: render logic, move to builders

    constructor(mode: Mode, body: ?ParseNode[], command: string) {
        super("font", mode, body);
        this.command = command;

        const font = fontAliases[command] ||
                     oldFontFuncs[command] ||
                     command;
        this.font = font.slice(1);
    }
}

const stretchyAccents = [
    "\\acute", "\\grave", "\\ddot", "\\tilde", "\\bar", "\\breve",
    "\\check", "\\hat", "\\vec", "\\dot",
];

const shiftyAccents = [
    "\\widehat", "\\widetilde",
];

export class Accent extends ParseNode {
    body: ?ParseNode[];
    label: string;
    isStretchy: boolean; //TODO-AST: render logic, move to builders
    isShifty: boolean; //TODO-AST: render logic, move to builders

    constructor(mode: Mode, body: ?ParseNode[], label: string) {
        super("accent", mode, body);
        this.label = label;

        this.isStretchy = !utils.contains(stretchyAccents, label);

        this.isShifty = !this.isStretchy ||
                        utils.contains(shiftyAccents, label);
    }
}

export class HorizontalBrace extends ParseNode {
    body: ?ParseNode[];
    label: string;
    isOver: boolean; //TODO-AST: render logic, move to builders

    constructor(mode: Mode, body: ?ParseNode[], label: string) {
        super("horizBrace", mode, body);
        this.label = label;

        this.isOver = /^\\over/.test(label);
    }
}

export class AccentUnder extends ParseNode {
    body: ?ParseNode[];
    label: string;

    constructor(mode: Mode, body: ?ParseNode[], label: string) {
        super("accentUnder", mode, body);
        this.label = label;
    }
}

export class ExtensibleArrow extends ParseNode {
    body: ?ParseNode[];
    label: string;
    below: ?ParseNode[];

    constructor(mode: Mode, body: ?ParseNode[], label: string,
                below: ?ParseNode[]) {
        super("xArrow", mode, body);
        this.label = label;
        this.below = below;
    }
}

export class Enclosing extends ParseNode {
    body: ?ParseNode[];
    label: string;

    constructor(mode: Mode, body: ?ParseNode[], label: string) {
        super("enclose", mode, body);
        this.label = label;
    }
}

export class InfixFraction extends ParseNode {
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
}

export class AlignedRowBreak extends ParseNode {
    command: string;
    size: ?Size;

    constructor(mode: Mode, command: string, size: Size) {
        super("cr", mode);
        this.command = command;
        this.size = size;
    }
}

export class EnvironmentDelimiter extends ParseNode {
    command: string;
    nameGroup: string;
    name: string; //TODO-AST: render logic, move to builders

    constructor(mode: Mode, command: string, nameGroup: {value: string}[]) {
        super("environment", mode);
        this.command = command;
        this.nameGroup = nameGroup;

        this.name = "";
        for (let i = 0; i < nameGroup.length; ++i) {
            this.name += nameGroup[i].value;
        }
    }
}

export class RaiseBox extends ParseNode {
    body: ?ParseNode[];
    amount: Size;

    constructor(mode: Mode, body: ?ParseNode[], amount: Size) {
        super("raisebox", mode, body);
        this.amount = amount;
    }
}

export class Supsub extends ParseNode {
    base: ?ParseNode;
    sup: ?ParseNode[];
    sub: ?ParseNode[];

    constructor(mode: Mode, base: ?ParseNode, sup: ?ParseNode[],
                sub: ?ParseNode[]) {
        super("supsub", mode);
        this.base = base;
        this.sup = sup;
        this.sub = sub;
    }
}

export class LeftRight extends ParseNode {
    body: ?ParseNode[];
    command: string;
    left: string;
    right: string;

    constructor(mode: Mode, body: ?ParseNode[], left: string, right: string,
                command: ?string) {
        super("leftright", mode, body);
        this.left = left;
        this.right = right;
        this.command = command;
    }
}

export class Ordgroup extends ParseNode {
    body: ?ParseNode[];

    constructor(mode: Mode, body: ?ParseNode[]) {
        super("ordgroup", mode, body);
    }
}

export class Styling extends ParseNode {
    body: ?ParseNode[];
    style: StyleStr;

    constructor(mode: Mode, body: ParseNode[], style: StyleStr) {
        super("styling", mode, body);
        this.style = style;
    }
}

//TODO-AST: separate render logic from semantics
export class ArrayNode extends ParseNode {
    hskipBeforeAndAfter: ?boolean;
    arraystretch: ?number;
    addJot: ?boolean;
    cols: ?AlignSpec[];
    rows: ?ParseNode[][];
    rowGaps: number[];

    constructor(mode: Mode, hskipBeforeAndAfter: boolean, arraystretch: number,
                addJot: boolean, cols: AlignSpec[], rows: ParseNode[][],
                rowGaps: number[]) {
        super("array", mode);
        this.hskipBeforeAndAfter = hskipBeforeAndAfter;
        this.arraystretch = arraystretch;
        this.addJot = addJot;
        this.cols = cols;
        this.rows = rows;
        this.rowGaps = rowGaps;
    }
}

export class Textord extends ParseNode {
    ligature: string;

    constructor(mode: Mode, ligature: string) {
        super("textord", mode);
        this.ligature = ligature;
    }
}

export class Sizing extends ParseNode {
    body: ?ParseNode[];
    size: number;

    constructor(mode: Mode, body: ParseNode[], size: number) {
        super("sizing", mode, body);
        this.size = size;
    }
}
