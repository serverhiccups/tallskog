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

const textBoundsMemo = new Map<string, { width: number; height: number }>();

export const calculateTextBounds = (ctx: RenderingContext2D, text: string) => {
	if (textBoundsMemo.has(text)) return textBoundsMemo.get(text);
	let metrics = ctx.measureText(text);
	const res = {
		width: metrics.width + LABEL_PADDING,
		height: metrics.emHeightDescent + metrics.emHeightDescent + LABEL_PADDING,
	};
	textBoundsMemo.set(text, res);
	return res;
};

export const setCanvasProperties = (ctx: RenderingContext2D): void => {
	ctx.fillStyle = "#000";
	ctx.textAlign = "center";
	ctx.lineWidth = 2.0;
	ctx.font = `24px serif`; // Must specify in px because rem is broken in OffscreenCanvas
};

const renderLayoutNode = (
	ctx: CanvasRenderingContext2D,
	root: LayoutNode,
	x: number,
	y: number
): void => {
	if (root.highlighted) {
		ctx.fillStyle = "rgb(0 0 0 / 0.15)";
		ctx.beginPath();
		ctx.roundRect(
			x - root.width / 2.0,
			y - root.height - LABEL_PADDING / 4.0,
			root.width,
			root.height + LABEL_PADDING,
			LABEL_PADDING / 2.0
		);
		ctx.fill();
	}
	ctx.fillStyle = "black";
	ctx.fillText(root.label, x, y);
	for (let child of root.children) {
		lineBetween(ctx, x, y + 8.0, x + child.x, y + child.y - 24.0);
		renderLayoutNode(ctx, child, x + child.x, y + child.y);
	}
};
