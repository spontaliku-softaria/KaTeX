//@flow

import {Ordgroup} from "./common";
import {AbstractNode} from "./AST";
import type {Mode} from "../types";
import ParseNode from "../ParseNode";

export function wrapOrdgroup(mode: Mode,
                             node: ? AbstractNode | AbstractNode[]): ParseNode {
    return new Ordgroup(mode, Array.isArray(node) ? node : [node])
        .toParseNode();
}

export function toParseSize(size: Size): {
    number: number, unit: string
} {
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

export function toParseNodeArray(nodes: ? AbstractNode[]): ParseNode[] {
    if (!nodes) {
        return null;
    }

    return nodes.map(function(node) {
        return node.toParseNode();
    });
}
