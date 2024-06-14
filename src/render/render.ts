import { TreeNode } from "../tree/treeNode";
import { NativeLayout } from "./naiveLayout";

export const TRACK_HEIGHT: number = 72.0;
export const CHILD_PADDING: number = 16.0;
export const LABEL_PADDING: number = 8.0;

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
	x: number;
	y: number;
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
	console.dir(l);
	// Drawing
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

export const calculateTextBounds = (
	ctx: CanvasRenderingContext2D,
	text: string
) => {
	let metrics = ctx.measureText(text);
	return {
		width: metrics.width + LABEL_PADDING,
		height: metrics.emHeightDescent + metrics.emHeightDescent + LABEL_PADDING,
	};
};

const renderLayout = (
	ctx: CanvasRenderingContext2D,
	root: LayoutNode,
	x: number,
	y: number
): void => {
	ctx.fillStyle = "rgba(255, 0, 100, 0.5)";
	ctx.fillRect(
		x - root.width / 2.0,
		y - root.height - LABEL_PADDING / 2.0,
		root.width,
		root.height + LABEL_PADDING
	);
	ctx.fillStyle = "black";
	ctx.fillText(root.label ? root.label : "∅", x, y);
	for (let child of root.children) {
		lineBetween(ctx, x, y + 8.0, x + child.x, y + child.y - 24.0);
		renderLayout(ctx, child, x + child.x, y + child.y);
	}
};
