import { TreeNode, isLeaf } from "../tree/treeNode";
import {
	LayoutAlgorithm,
	Layout,
	LayoutNode,
	calculateTextBounds,
	TRACK_HEIGHT,
	CHILD_PADDING,
} from "./render";

export class NativeLayout implements LayoutAlgorithm {
	doLayout(ctx: CanvasRenderingContext2D, tree: TreeNode): Layout {
		const lt = layout(ctx, tree, 0, 0);
		const width = calculateTreeNodeWidth(ctx, tree);
		return {
			width: width,
			height: 0, // TODO: calculate,
			entryX: width / 2.0,
			entryY: TRACK_HEIGHT,
			root: lt,
		};
	}
}

const layout = (
	ctx: CanvasRenderingContext2D,
	root: TreeNode,
	x: number,
	y: number
): LayoutNode => {
	let labelMetrics = calculateTextBounds(ctx, root.label);
	let l: LayoutNode = {
		label: root.label,
		x: x,
		y: y,
		width: labelMetrics.width,
		height: labelMetrics.height,
		children: [],
	};
	let childrenWidth = calculateChildrenWidth(ctx, root.children);
	let edge = -childrenWidth / 2.0;
	for (let child of root.children) {
		const childWidth = calculateTreeNodeWidth(ctx, child);
		const childCenterX = edge + childWidth / 2.0;
		l.children.push(layout(ctx, child, childCenterX, TRACK_HEIGHT));
		edge += childWidth + CHILD_PADDING;
	}
	return l;
};

/**
 * @returns The combined width of the child nodes
 */
const calculateTreeNodeWidth = (
	ctx: CanvasRenderingContext2D,
	node: TreeNode
): number => {
	if (isLeaf(node)) return calculateTextBounds(ctx, node.label).width;
	return Math.max(
		calculateTextBounds(ctx, node.label).width,
		calculateChildrenWidth(ctx, node.children)
	);
};

const calculateChildrenWidth = (
	ctx: CanvasRenderingContext2D,
	children: TreeNode[]
): number => {
	return Math.max(
		0,
		children
			.map((n) => calculateTreeNodeWidth(ctx, n))
			.reduce((a, b) => a + b, 0) +
			(children.length - 1) * CHILD_PADDING
	);
};