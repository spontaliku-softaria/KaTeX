// @flow
import defineFunction from "../defineFunction";
import buildCommon from "../buildCommon";
import mathMLTree from "../mathMLTree";
import ParseNode from "../ParseNode";

import * as html from "../buildHTML";
import * as mml from "../buildMathML";

defineFunction({
    type: "underline",
    names: ["\\underline"],
    props: {
        numArgs: 1,
        allowedInText: true,
    },
    handler({parser}, args) {
        const body = args[0];
        return new ParseNode("underline", {
            type: "underline",
            body: body,
        }, parser.mode);
    },
    htmlBuilder(group, options) {
        // Underlines are handled in the TeXbook pg 443, Rule 10.
        // Build the inner group.
        const innerGroup = html.buildGroup(group.value.body, options);

        // Create the line to go below the body
        const line = buildCommon.makeLineSpan("underline-line", options);

        // Generate the vlist, with the appropriate kerns
        const vlist = buildCommon.makeVList({
            positionType: "top",
            positionData: innerGroup.height,
            children: [
                {type: "kern", size: line.height},
                {type: "elem", elem: line},
                {type: "kern", size: 3 * line.height},
                {type: "elem", elem: innerGroup},
            ],
        }, options);

        return buildCommon.makeSpan(["mord", "underline"], [vlist], options);
    },
    mathmlBuilder(group, options) {
        const operator = new mathMLTree.MathNode(
            "mo", [new mathMLTree.TextNode("\u203e")]);
        operator.setAttribute("stretchy", "true");

        const node = new mathMLTree.MathNode(
            "munder",
            [mml.buildGroup(group.value.body, options), operator]);
        node.setAttribute("accentunder", "true");

        return node;
    },
});
