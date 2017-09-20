//@flow

import type {Mode} from "../types";
import {AbstractNode} from "./AST";
import * as util from "./util";

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
                util.toParseNodeArray(this.body) :
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
