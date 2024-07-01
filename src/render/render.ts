import { Layout, LayoutNode } from "./layout";

export const TRACK_HEIGHT: number = 72.0;
export const CHILD_PADDING: number = 16.0;
export const LABEL_PADDING: number = 8.0;

export type RenderingContext2D =
	| CanvasRenderingContext2D
	| OffscreenCanvasRenderingContext2D;

export const renderLayout = (ctx: CanvasRenderingContext2D, layout: Layout) => {
	// Drawing
	renderLayoutNode(ctx, layout.root, layout.entryX, layout.entryY);
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

export const calculateTextBounds = (ctx: RenderingContext2D, text: string) => {
	let metrics = ctx.measureText(text);
	return {
		width: metrics.width + LABEL_PADDING,
		height: metrics.emHeightDescent + metrics.emHeightDescent + LABEL_PADDING,
	};
};

const renderLayoutNode = (
	ctx: CanvasRenderingContext2D,
	root: LayoutNode,
	x: number,
	y: number
): void => {
	if (root.highlighted) {
		ctx.fillStyle = "rgba(255, 0, 100, 0.5)";
		ctx.fillRect(
			x - root.width / 2.0,
			y - root.height - LABEL_PADDING / 2.0,
			root.width,
			root.height + LABEL_PADDING
		);
		ctx.fillStyle = "black";
	}
	ctx.fillText(root.label, x, y);
	for (let child of root.children) {
		lineBetween(ctx, x, y + 8.0, x + child.x, y + child.y - 24.0);
		renderLayoutNode(ctx, child, x + child.x, y + child.y);
	}
};
