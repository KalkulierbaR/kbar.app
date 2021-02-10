import { h, RefObject } from "preact";
import { useEffect, useState } from "preact/hooks";

import {
    FormulaNode,
    FormulaTreeLayoutNode,
} from "../../../types/calculus/psc";
import { PSCTreeLayoutNode } from "../../../types/calculus/psc";
import { LayoutItem } from "../../../types/layout";
import { parseFormula } from "../../../util/psc";
import { estimateSVGTextWidth } from "../../../util/text-width";
import FormulaTreeNode from "../../calculus/psc/formulaNode";

import * as style from "./style.scss";

interface Props {
    textRef: RefObject<SVGTextElement>;
    /**
     * The Formulars to put in the left side
     */
    leftFormulas: FormulaNode[];
    /**
     * The Formulars to put in the right side
     */
    rightFormulas: FormulaNode[];
    /**
     * The Node the list will be inside
     */
    node: LayoutItem<PSCTreeLayoutNode>;
    /**
     * Boolean to change the style of the node if it is selected
     */
    selected: boolean;
    /**
     * The Callback if the Formula got selected
     */
    selectFormulaCallback: (formula: FormulaTreeLayoutNode) => void;
    /**
     * Index of the selected Formula
     */
    selectedListIndex?: string;
    /**
     * The Callback if the Node got selected
     */
    selectNodeCallback: (
        node: PSCTreeLayoutNode,
        selectValue?: boolean,
    ) => void;
}

const NODE_SPACING = 4;
const SEPERATOR_SPACING = 12;
const RECTANGLE_PUFFER = 4;
const NODE_PUFFER = 16;

/**
 * Draws a Comma at the given coordinates
 * @param {number} x the x coordinate on which the comma is drawn
 * @param {number} y the y coordinate on which the comma is drawn
 * @returns {any} HTML
 */
const drawComma = (x: number, y: number) => {
    return (
        <text class={style.textSelected} text-anchor="left" x={x} y={y}>
            ,
        </text>
    );
};
/**
 * Draws the Formula for the given parameters
 * @param {FormulaTreeLayoutNode} formula the FormulaNode which will be drawn by the method
 * @param {LayoutItem<PSCTreeLayoutNode>} node the big node in which the formula is drawn
 * @param {string | undefined} selectedListIndex string in the pattern of (r, l)[0-9]* indicating the side of the formula and its index
 * @param {number} xCoord the x coordinate in which the Formula is drawn
 * @param {Function<FormulaTreeLayoutNode>} selectFormulaCallback YIKES
 * @param {Function<PSCTreeLayoutNode>} selectNodeCallback KEKW
 * @param {boolean} selected the parameter which tell if the current node is selected or not
 * @param {boolean} left shows if formula is on the left
 * @returns {any} HTML
 */
const drawFormula = (
    formula: FormulaTreeLayoutNode,
    node: LayoutItem<PSCTreeLayoutNode>,
    selectedListIndex: string | undefined,
    xCoord: number,
    selectFormulaCallback: (formula: FormulaTreeLayoutNode) => void,
    selectNodeCallback: (node: PSCTreeLayoutNode) => void,
    selected: boolean,
    left: boolean,
) => {
    return (
        <FormulaTreeNode
            formula={formula}
            node={node}
            xCord={
                xCoord +
                (estimateSVGTextWidth(parseFormula(formula)) +
                    RECTANGLE_PUFFER) /
                    2
            }
            selectedListIndex={selectedListIndex}
            selectFormulaCallback={selectFormulaCallback}
            selectNodeCallback={selectNodeCallback}
            selected={selected}
            left={left}
        />
    );
};

/**
 * Draws the Seperator between the right and left Formulas
 * @param {number}x the x coordinate on which the seperator is drawn
 * @param {number}y the y coordinate on which the seperator is drawn
 * @returns {any} HTML
 */
const drawSeperator = (x: number, y: number) => {
    return (
        <text class={style.textSelected} text-anchor="left" x={x} y={y}>
            ⊢
        </text>
    );
};

/**
 * Creates an array which contains the htmlCode for the given Sequence. (formulas, commas and the sequenceSeperator)
 * @param {FormulaNode[]}leftFormulas the formulas on the left hand side of the sequence
 * @param {FormulaNode[]}rightFormulas the formulas on the right hand side of the sequence
 * @param {LayoutItem<PSCTreeLayoutNode>}node the overlaying node in which the sequence is to be drawn
 * @param {string | undefined} selectedListIndex index
 * @param {number} dimsX dimension
 * @param {Function<FormulaTreeLayoutNode>} selectFormulaCallback YIKES
 * @param {Function<PSCTreeLayoutNode>} selectNodeCallback KEKW
 * @param {boolean}selected I dont know what this is for..........................................................................................................................................
 * @returns {any} HTML
 */
const getSequence = (
    leftFormulas: FormulaNode[],
    rightFormulas: FormulaNode[],
    node: LayoutItem<PSCTreeLayoutNode>,
    selectedListIndex: string | undefined,
    dimsX: number,
    selectFormulaCallback: (formula: FormulaTreeLayoutNode) => void,
    selectNodeCallback: (node: PSCTreeLayoutNode) => void,
    selected: boolean,
) => {
    let totalSize = 0;
    leftFormulas.forEach((elem, index) => {
        totalSize += estimateSVGTextWidth(
            parseFormula(elem) + RECTANGLE_PUFFER,
        );
        if (index < leftFormulas.length - 1) {
            totalSize += NODE_SPACING;
        }
    });

    totalSize += SEPERATOR_SPACING;

    rightFormulas.forEach((elem, index) => {
        totalSize += estimateSVGTextWidth(
            parseFormula(elem) + RECTANGLE_PUFFER,
        );
        if (index < rightFormulas.length - 1) {
            totalSize += NODE_SPACING;
        }
    });

    totalSize = dimsX + NODE_PUFFER / 2;

    const htmlArray: any[] = [];
    leftFormulas.forEach((elem, index) => {
        const formulaLayoutNode: FormulaTreeLayoutNode = {
            ...elem,
            id: "l" + index.toString(),
        };
        htmlArray.push(
            drawFormula(
                formulaLayoutNode,
                node,
                selectedListIndex,
                totalSize,
                selectFormulaCallback,
                selectNodeCallback,
                selected,
                true,
            ),
        );
        totalSize +=
            estimateSVGTextWidth(parseFormula(elem)) + RECTANGLE_PUFFER;
        if (index < leftFormulas.length - 1) {
            htmlArray.push(drawComma(totalSize, node.y));
            totalSize += NODE_SPACING;
        }
    });

    htmlArray.push(drawSeperator(totalSize, node.y));
    totalSize += SEPERATOR_SPACING;

    rightFormulas.forEach((elem, index) => {
        const formulaLayoutNode: FormulaTreeLayoutNode = {
            ...elem,
            id: "r" + index.toString(),
        };
        htmlArray.push(
            drawFormula(
                formulaLayoutNode,
                node,
                selectedListIndex,
                totalSize,
                selectFormulaCallback,
                selectNodeCallback,
                selected,
                false,
            ),
        );
        totalSize +=
            estimateSVGTextWidth(parseFormula(elem)) + RECTANGLE_PUFFER;
        if (index < rightFormulas.length - 1) {
            htmlArray.push(drawComma(totalSize, node.y));
            totalSize += NODE_SPACING;
        }
    });

    return htmlArray;
};

const horizontalList: preact.FunctionalComponent<Props> = ({
    textRef,
    leftFormulas,
    rightFormulas,
    node,
    selected,
    selectFormulaCallback,
    selectedListIndex,
    selectNodeCallback,
}) => {
    const [dims, setDims] = useState({ x: 0, y: 0, height: 0, width: 0 });

    useEffect(() => {
        if (!textRef.current) {
            return;
        }

        const box = textRef.current.getBBox();
        box.width += 16;
        box.x -= 8;
        box.height += 8;
        box.y -= 4;
        setDims(box);
    });

    return (
        <g>
            {getSequence(
                leftFormulas,
                rightFormulas,
                node,
                selectedListIndex,
                dims.x,
                selectFormulaCallback,
                selectNodeCallback,
                selected,
            ).map((el) => el)}
        </g>
    );
};

export default horizontalList;
