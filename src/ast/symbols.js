//@flow

import type {Mode} from "../types";
import {AbstractNode} from "./AST";

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
