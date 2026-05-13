import { LayoutTree, LayoutNode, LayoutArrow, ControlPoint } from "./layout";

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
	ctx.beginPath()
	ctx.moveTo(arrow.controlPoints[0].x, arrow.controlPoints[0].y);
	for (let i = 1; i < arrow.controlPoints.length; i++) {
		ctx.lineTo(arrow.controlPoints[i].x, arrow.controlPoints[i].y);
	}
	ctx.stroke();
	renderArrowHead(ctx, arrow.controlPoints[arrow.controlPoints.length - 2], arrow.controlPoints[arrow.controlPoints.length - 1]);
}

const renderArrowHead = (ctx: CanvasRenderingContext2D, penultimatePoint: ControlPoint, finalPoint: ControlPoint) => {

	const arrowAngle = Math.atan2(penultimatePoint.y - finalPoint.y, penultimatePoint.x - finalPoint.x);
	const leftAngle = arrowAngle - (Math.PI / 4.0)
	const rightAngle = arrowAngle + (Math.PI / 4.0)

	const leftPoint: ControlPoint = {
		x: finalPoint.x + (16.0 * Math.cos(leftAngle)),
		y: finalPoint.y + (16.0 * Math.sin(leftAngle))
	}
	const rightPoint: ControlPoint = {
		x: finalPoint.x + (16.0 * Math.cos(rightAngle)),
		y: finalPoint.y + (16.0 * Math.sin(rightAngle))
	}

	lineBetween(ctx, finalPoint.x, finalPoint.y, leftPoint.x, leftPoint.y);
	lineBetween(ctx, finalPoint.x, finalPoint.y, rightPoint.x, rightPoint.y);
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
