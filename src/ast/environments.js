//@flow

import {Ordgroup, LeftRight} from "./common";
import ParseNode from "../ParseNode";
import type {Mode} from "../types";
import {Styling} from "./styling";
import {AbstractNode} from "./AST";

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

        const delimiters = environmentDelimiters[this.name];
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

const environmentDelimiters = {};
environmentDelimiters[MatrixEnvironment.prototype.environments.pmatrix] =
    ["(", ")"];
environmentDelimiters[MatrixEnvironment.prototype.environments.bmatrix] =
    ["[", "]"];
environmentDelimiters[MatrixEnvironment.prototype.environments.Bmatrix] =
    ["\\{", "\\}"];
environmentDelimiters[MatrixEnvironment.prototype.environments.vmatrix] =
    ["|", "|"];
environmentDelimiters[MatrixEnvironment.prototype.environments.Vmatrix] =
    ["\\Vert", "\\Vert"];
environmentDelimiters[MatrixEnvironment.prototype.environments.pmatrix] =
    ["(", ")"];
environmentDelimiters[CasesEnvironment.prototype.environments.cases] =
    ["\\{", "."];
environmentDelimiters[CasesEnvironment.prototype.environments.dcases] =
    ["\\{", "."];
