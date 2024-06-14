import { FunctionalComponent } from "preact";
import { TreeNode } from "../tree/treeNode";
import { ResizableCanvas } from "./ResizableCanvas";
import { Layout, RenderingContext2D, renderLayout } from "./render";
import { NaiveLayout } from "./naiveLayout";
import { useMemo, useState } from "preact/hooks";

const setCanvasProperties = (ctx: RenderingContext2D): void => {
	ctx.fillStyle = "#000";
	ctx.textAlign = "center";
	ctx.lineWidth = 2.0;
	ctx.font = "24px serif"; // Must specify in px because rem is broken in OffscreenCanvas
};

interface DiagramState {
	layouts: Layout[];
}

interface DiagramProps {
	trees: TreeNode[];
}

export const Diagram: FunctionalComponent<DiagramProps> = ({ trees }) => {
	const offscreenCtx: OffscreenCanvasRenderingContext2D | undefined =
		useMemo(() => {
			const offscreenCanvas = new OffscreenCanvas(0, 0);
			const ctx = offscreenCanvas.getContext("2d");
			if (ctx == null) return;
			return ctx;
		}, []);
	const state: DiagramState | undefined = useMemo(() => {
		if (!offscreenCtx) return;
		setCanvasProperties(offscreenCtx);
		const algo = new NaiveLayout();
		let s: DiagramState = {
			layouts: [],
		};
		let edge = 24.0;
		for (const tree of trees) {
			const layout = algo.doLayout(offscreenCtx, tree);
			s.layouts.push({
				...layout,
				entryX: edge + layout.entryX,
			});
			edge += layout.width + 24.0;
		}
		return s;
	}, [trees]);

	const draw = (ctx: CanvasRenderingContext2D) => {
		if (!state) return;
		// Show tracks
		// ctx.fillStyle = "#333";
		// for (let i = TRACK_HEIGHT; i < height; i += TRACK_HEIGHT) {
		//     ctx.fillRect(0, i, width, 1.0);
		// }
		// Set up canvas
		setCanvasProperties(ctx);
		if (!state) return;
		for (const la of state.layouts) {
			renderLayout(ctx, la);
		}
	};
	return <ResizableCanvas draw={draw}></ResizableCanvas>;
};
