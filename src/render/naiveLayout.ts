import { TreeNode, isLeaf } from "../tree/treeNode";
import {
	calculateTextBounds,
	TRACK_HEIGHT,
	CHILD_PADDING,
	RenderingContext2D,
} from "./render";
import {
	Layout,
	LayoutAlgorithm,
	LayoutNode,
	buildLayoutNodeQueryStructure,
} from "./layout";

export class NaiveLayout implements LayoutAlgorithm {
	doLayout(ctx: RenderingContext2D, tree: TreeNode): Layout {
		const lt = layout(ctx, tree, 0, 0, 0, 0);
		const width = calculateTreeNodeWidth(ctx, tree);
		return {
			width: width,
			height: 0, // TODO: calculate,
			entryX: width / 2.0,
			entryY: TRACK_HEIGHT,
			root: lt,
			query: buildLayoutNodeQueryStructure(lt),
		};
	}
}

const layout = (
	ctx: RenderingContext2D,
	root: TreeNode,
	x: number,
	y: number,
	parentAbX: number,
	parentAbY: number
): LayoutNode => {
	let labelMetrics = calculateTextBounds(ctx, root.label);
	let l: LayoutNode = {
		label: root.label,
		x: x,
		y: y,
		absoluteX: parentAbX,
		absoluteY: parentAbY,
		width: labelMetrics.width,
		height: labelMetrics.height,
		children: [],
	};
	let childrenWidth = calculateChildrenWidth(ctx, root.children);
	let edge = -childrenWidth / 2.0;
	for (let child of root.children) {
		const childWidth = calculateTreeNodeWidth(ctx, child);
		const childCenterX = edge + childWidth / 2.0;
		l.children.push(
			layout(
				ctx,
				child,
				childCenterX,
				TRACK_HEIGHT,
				parentAbX + childCenterX,
				parentAbY + TRACK_HEIGHT
			)
		);
		edge += childWidth + CHILD_PADDING;
	}
	return l;
};

/**
 * @returns The combined width of the child nodes
 */
const calculateTreeNodeWidth = (
	ctx: RenderingContext2D,
	node: TreeNode
): number => {
	if (isLeaf(node)) return calculateTextBounds(ctx, node.label).width;
	return Math.max(
		calculateTextBounds(ctx, node.label).width,
		calculateChildrenWidth(ctx, node.children)
	);
};

const calculateChildrenWidth = (
	ctx: RenderingContext2D,
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
