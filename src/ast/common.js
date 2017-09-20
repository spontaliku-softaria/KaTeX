//@flow

import * as utils from "../utils";
import type {Mode} from "../types";
import {AbstractNode} from "./AST";
import * as util from "./util";

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
            body: util.wrapOrdgroup(this.mode, this.body),
            index: util.wrapOrdgroup(this.mode, this.index),
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

export class Mod extends AbstractNode {
    body: ?AbstractNode[];
    modType: string;

    constructor(mode: Mode, body: ?AbstractNode[], modType: string) {
        super("mod", mode);
        this.body = body;
        this.modType = modType;
    }

    toParseValue() {
        return {
            type: this.type,
            value: util.toParseNodeArray(this.body),
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

export class Accent extends AbstractNode {
    body: ?AbstractNode;
    label: string;
    isStretchy: boolean;
    isShifty: boolean;

    constructor(mode: Mode, body: ?AbstractNode, label: string) {
        super("accent", mode);
        this.body = body;
        this.label = label;

        this.isStretchy = !utils.contains(notStretchyAccents, label);

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

const notStretchyAccents = [
    Accent.prototype.commands.acute, Accent.prototype.commands.grave,
    Accent.prototype.commands.ddot, Accent.prototype.commands.tilde,
    Accent.prototype.commands.bar, Accent.prototype.commands.breve,
    Accent.prototype.commands.check, Accent.prototype.commands.hat,
    Accent.prototype.commands.vec, Accent.prototype.commands.dot,
];

const shiftyAccents = [
    Accent.prototype.commands.widehat, Accent.prototype.commands.widetilde,
];

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
            below: util.wrapOrdgroup(this.mode, this.below),
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
            body: util.toParseNodeArray(this.body),
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
        return util.toParseNodeArray(this.body);
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
            body: util.wrapOrdgroup(this.mode, this.body),
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
            body: util.wrapOrdgroup(this.mode, this.body),
        };
    }
}
