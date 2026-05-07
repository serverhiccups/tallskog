import { LayoutTree, LayoutNode, LayoutArrow } from "./layout";

export const TRACK_HEIGHT: number = 72.0;
export const CHILD_PADDING: number = 16.0;
export const LABEL_PADDING: number = 8.0;

export type RenderingContext2D =
	| CanvasRenderingContext2D
	| OffscreenCanvasRenderingContext2D;

export const renderLayoutTree = (ctx: CanvasRenderingContext2D, layout: LayoutTree) => {
	// Drawing
	renderLayoutNode(ctx, layout.root, layout.entryX, layout.entryY);
};

export const renderLayoutArrow = (ctx: CanvasRenderingContext2D, arrow: LayoutArrow) => {
	for (let i = 0; i < arrow.controlPoints.length - 1; i++) {
		const p1 = arrow.controlPoints[i];
		const p2 = arrow.controlPoints[i + 1];
		lineBetween(ctx, p1.x, p1.y, p2.x, p2.y);
	}
}

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

export type TextBounds = { width: number; height: number; };

const textBoundsMemo = new Map<string, TextBounds>();

export const calculateTextBounds = (ctx: RenderingContext2D, text: string): TextBounds => {
	if (textBoundsMemo.has(text)) return textBoundsMemo.get(text) as TextBounds;
	let metrics = ctx.measureText(text);
	const res: TextBounds = {
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
	rootX: number,
	rootY: number
): void => {
	const x = root.absoluteX + rootX;
	const y = root.absoluteY + rootY;
	if (root.nodeId.startsWith("filler-")) {
		// ctx.fillStyle = "red";
		// ctx.fillRect(x - (root.width / 2.0), y - (root.height / 2.0), root.width, root.height);
		// ctx.fillStyle = "blue";
		// ctx.fillRect(x, y, 1.0, 1.0);
	} else if (root.highlighted) {
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
		if (!child.nodeId.startsWith("filler-")) {
			lineBetween(ctx, x, y + 8.0, rootX + child.absoluteX, rootY + child.absoluteY - 24.0);
		}
		renderLayoutNode(ctx, child, rootX, rootY);
	}
};
