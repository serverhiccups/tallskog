import { FunctionalComponent, JSX } from "preact";
import { TreeNode } from "../tree/treeNode";
import { ResizableCanvas } from "./ResizableCanvas";
import { LABEL_PADDING, RenderingContext2D, renderLayout } from "./render";
import {
	Layout,
	LayoutNode,
	getLayoutNodeAt,
	useLayoutNodeHandle,
} from "./layout";
import { NaiveLayout } from "./naiveLayout";
import { Dispatch, useMemo, useState } from "preact/hooks";
import { DynamicForestAction } from "../tree/dynamicTree";
import styles from "./diagram.module.scss";

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
	trees: (TreeNode | undefined)[];
	selectedNode: TreeNode | undefined;
	dispatch: Dispatch<DynamicForestAction>;
}

export const Diagram: FunctionalComponent<DiagramProps> = ({
	trees,
	selectedNode,
	dispatch,
}) => {
	const offscreenCtx: OffscreenCanvasRenderingContext2D | undefined =
		useMemo(() => {
			const offscreenCanvas = new OffscreenCanvas(0, 0);
			const ctx = offscreenCanvas.getContext("2d");
			if (ctx == null) return;
			return ctx;
		}, []);
	const state: DiagramState = useMemo(() => {
		if (!offscreenCtx) return { layouts: [] }; // !
		setCanvasProperties(offscreenCtx);
		const algo = new NaiveLayout();
		let s: DiagramState = {
			layouts: [],
		};
		let edge = 24.0;
		for (const tree of trees) {
			if (tree === undefined) continue; // !
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

	const [overlayText, setOverlayText] = useState<string>("");

	const onClick = (event: MouseEvent) => {
		console.log(`x: ${event.offsetX}, y: ${event.offsetY}`);
		if (!state) return;
		const n = getLayoutNodeAt(state.layouts, event.offsetX, event.offsetY);
		console.log(n);
		if (n === undefined) return;
		dispatch({ kind: "selectNode", nodeId: n.node.treeNodeId });

		// setOverlayText(n.node.label ? n.node.label : "");
		// dispatch({
		// 	kind: "deleteNode",
		// 	rootId: n.rootTreeNodeId,
		// 	nodeId: n.treeNodeId,
		// });
	};

	const [selectedLayoutNode, selectedLayoutNodeLayout] = useLayoutNodeHandle(
		state.layouts,
		selectedNode?.id
	);
	// coordinated in canvas space
	// metrics TODO: calculate based on actual element
	const width = 180;
	const height = 30;
	const positionOverlayStyle =
		selectedLayoutNode === undefined
			? "visibility: hidden;"
			: `
			top: ${
				selectedLayoutNode.absoluteY +
				selectedLayoutNodeLayout.entryY -
				height +
				LABEL_PADDING +
				1
			}px;
			left: ${
				selectedLayoutNode.absoluteX +
				selectedLayoutNodeLayout.entryX -
				width / 2.0
			}px;
		`;

	const handleOverlayInput: JSX.InputEventHandler<HTMLInputElement> = (
		e
	): void => {
		if (e.target instanceof HTMLInputElement) {
			if (selectedNode === undefined || selectedLayoutNode === undefined)
				return;
			// setOverlayText(e.target.value);
			dispatch({
				kind: "updateLabelText",
				rootId: selectedLayoutNode.rootTreeNodeId,
				nodeId: selectedLayoutNode.treeNodeId,
				text: e.target.value,
			});
		}
	};

	return (
		<div id="diagram" class={styles.diagram}>
			{selectedNode !== undefined && (
				<input
					id="overlay"
					type="text"
					class={styles.overlay}
					style={positionOverlayStyle}
					value={selectedNode.label}
					onInput={handleOverlayInput}
				/>
			)}
			<ResizableCanvas onClick={onClick} draw={draw}></ResizableCanvas>
		</div>
	);
};
