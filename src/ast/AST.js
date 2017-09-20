//@flow

import type {Mode} from "../types";
import ParseNode from "../ParseNode";

export class AbstractNode {
    type: string;
    mode: Mode;

    constructor(type: string, mode: Mode) {
        this.type = type;
        this.mode = mode;
    }

    toParseValue(): {} {
        throw Error("Abstract toParseValue is called.");
    }

    toParseNode(): ParseNode {
        return new ParseNode(this.type, this.toParseValue(), this.mode);
    }
}
