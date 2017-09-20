//@flow

import {Token} from "../Token";
import type {Mode} from "../types";
import {AbstractNode} from "./AST";
import * as util from "./util";

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
            numer: util.wrapOrdgroup(this.mode, this.numer),
            denom: util.wrapOrdgroup(this.mode, this.denom),
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
