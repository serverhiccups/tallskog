import { TreeNode } from "../tree/treeNode";
import { NativeLayout } from "./naiveLayout";

export const TRACK_HEIGHT: number = 72.0;
export const CHILD_PADDING: number = 16.0;

export interface Layout {
	width: number;
	height: number;
	entryX: number;
	entryY: number;
	root: LayoutNode;
}

export interface LayoutAlgorithm {
	doLayout(ctx: CanvasRenderingContext2D, tree: TreeNode): Layout;
}

export interface LayoutNode {
	label: string | undefined;
	relativeX: number;
	relativeY: number;
	width: number;
	height: number;
	children: LayoutNode[];
}

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
	const algo = new NativeLayout();
	let l = algo.doLayout(ctx, tree);
	// Drawing
	// drawTreeNode(ctx, tree, treeWidth / 2.0, 0);
	renderLayout(ctx, l.root, l.entryX, l.entryY);
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

export const calculateLabelWidth = (
	ctx: CanvasRenderingContext2D,
	node: TreeNode
): number => {
	return ctx.measureText(node.label).width + 8.0;
};

const renderLayout = (
	ctx: CanvasRenderingContext2D,
	root: LayoutNode,
	x: number,
	y: number
): void => {
	ctx.fillText(root.label ? root.label : "∅", x, y);
	for (let child of root.children) {
		lineBetween(
			ctx,
			x,
			y + 8.0,
			x + child.relativeX,
			y + child.relativeY - 24.0
		);
		renderLayout(ctx, child, x + child.relativeX, y + child.relativeY);
	}
};
