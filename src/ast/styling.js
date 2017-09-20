//@flow

import type {Mode, Size, StyleStr} from "../types";
import {AbstractNode} from "./AST";
import * as util from "./util";

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
            body: util.toParseNodeArray(this.body),
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
            value: util.toParseNodeArray(this.body),
            color: this.color,
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
            shift: util.toParseSize(this.shift),
            width: util.toParseSize(this.width),
            height: util.toParseSize(this.height),
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
            value: util.toParseNodeArray(this.body),
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
            body: util.wrapOrdgroup(this.mode, this.body),
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
            value: util.toParseNodeArray(this.body),
            body: util.wrapOrdgroup("text", this.body),
            dy: {
                mode: this.mode,
                type: "size",
                value: util.toParseSize(this.amount),
            },
        };
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
            value: util.toParseNodeArray(this.body),
            style: this.style,
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
            value: util.toParseNodeArray(this.body),
            size: this.size,
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
            dimension: util.toParseSize(this.dimension),
        };
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
