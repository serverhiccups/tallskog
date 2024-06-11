import { TreeNode, isLeaf } from "../tree/treeNode";

const TRACK_HEIGHT: number = 72.0;
const CHILD_PADDING: number = 16.0;

export const renderTree = (
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	tree: TreeNode
) => {
	// Show tracks
	ctx.fillStyle = "#333";
	for (let i = TRACK_HEIGHT; i < height; i += TRACK_HEIGHT) {
		ctx.fillRect(0, i, width, 1.0);
	}
	// Set up canvas
	ctx.fillStyle = "#000";
	ctx.textAlign = "center";
	ctx.lineWidth = 2.0;
	ctx.font = "1.5rem serif";
	// Layout
	if (!tree) return;
	let treeWidth = layoutTreeNode(ctx, tree);
	// Drawing
	drawTreeNode(ctx, tree, treeWidth / 2.0, 0);
};

/**
 * @returns The combined width of the child nodes
 */
const layoutTreeNode = (
	ctx: CanvasRenderingContext2D,
	node: TreeNode
): number => {
	if (isLeaf(node)) return calculateLabelWidth(ctx, node);
	return Math.max(
		calculateLabelWidth(ctx, node),
		layoutChildren(ctx, node.children)
	);
};

const layoutChildren = (
	ctx: CanvasRenderingContext2D,
	children: TreeNode[]
): number => {
	return Math.max(
		0,
		children.map((n) => layoutTreeNode(ctx, n)).reduce((a, b) => a + b, 0) +
			(children.length - 1) * CHILD_PADDING
	);
};

const drawTreeNode = (
	ctx: CanvasRenderingContext2D,
	node: TreeNode,
	x: number,
	rail: number
): void => {
	// centerLine(ctx, x);
	ctx.fillText(node.label, x, railToY(rail));
	let childrenWidth = layoutChildren(ctx, node.children);
	let edge = x - childrenWidth / 2.0;
	let i = 0;
	for (let child of node.children) {
		const childWidth = layoutTreeNode(ctx, child);
		const childCenterX = edge + childWidth / 2.0;
		lineBetween(
			ctx,
			x,
			railToY(rail) + 8.0,
			childCenterX,
			railToY(rail + 1) - 24.0
		);
		drawTreeNode(ctx, child, childCenterX, rail + 1);
		edge += childWidth + CHILD_PADDING;
		i++;
	}
};

const railToY = (rail: number): number => {
	return TRACK_HEIGHT * (rail + 1);
};

const centerLine = (ctx: CanvasRenderingContext2D, x: number): void => {
	ctx.fillStyle = "purple";
	ctx.fillRect(x - 1, 0, 2, 800);
	ctx.fillStyle = "black";
};

const lineBetween = (
	ctx: CanvasRenderingContext2D,
	x1: number,
	y1: number,
	x2: number,
	y2: number
): void => {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.closePath();
	ctx.stroke();
};

const calculateLabelWidth = (
	ctx: CanvasRenderingContext2D,
	node: TreeNode
): number => {
	return ctx.measureText(node.label).width + 8.0;
};
