import { FunctionalComponent } from "preact";
import { TreeNode } from "../tree/treeNode";
import { ResizableCanvas } from "./ResizableCanvas";
import { Layout, RenderingContext2D, renderLayout } from "./render";
import { NaiveLayout } from "./naiveLayout";
import { useMemo } from "preact/hooks";

const setCanvasProperties = (ctx: RenderingContext2D): void => {
	ctx.fillStyle = "#000";
	ctx.textAlign = "center";
	ctx.lineWidth = 2.0;
	ctx.font = "24px serif"; // Must specify in px because rem is broken in OffscreenCanvas
};

interface DiagramProps {
	tree: TreeNode;
}

export const Diagram: FunctionalComponent<DiagramProps> = ({ tree }) => {
	const offscreenCtx: OffscreenCanvasRenderingContext2D | undefined =
		useMemo(() => {
			const offscreenCanvas = new OffscreenCanvas(0, 0);
			const ctx = offscreenCanvas.getContext("2d");
			if (ctx == null) return;
			return ctx;
		}, []);
	const layout: Layout | undefined = useMemo(() => {
		if (!offscreenCtx) return;
		setCanvasProperties(offscreenCtx);
		const algo = new NaiveLayout();
		return algo.doLayout(offscreenCtx, tree);
	}, [tree]);

	const draw = (ctx: CanvasRenderingContext2D) => {
		if (!tree) return;
		// Show tracks
		// ctx.fillStyle = "#333";
		// for (let i = TRACK_HEIGHT; i < height; i += TRACK_HEIGHT) {
		//     ctx.fillRect(0, i, width, 1.0);
		// }
		// Set up canvas
		setCanvasProperties(ctx);
		if (!layout) return;
		renderLayout(ctx, layout);
	};
	return <ResizableCanvas draw={draw}></ResizableCanvas>;
};
