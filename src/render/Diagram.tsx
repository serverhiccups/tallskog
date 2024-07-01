import { FunctionalComponent, JSX } from "preact";
import { TreeNode } from "../tree/treeNode";
import { ResizableCanvas } from "./ResizableCanvas";
import { LABEL_PADDING, RenderingContext2D, renderLayout } from "./render";
import {
	Layout,
	LayoutAlgorithm,
	LayoutNode,
	getInsertionPosition,
	getLayoutNodeAt,
	useLayoutNodeHandle,
} from "./layout";
import { NaiveLayout } from "./naiveLayout";
import { Dispatch, useMemo, useRef, useState } from "preact/hooks";
import { DynamicForestAction } from "../tree/dynamicForest";
import styles from "./diagram.module.scss";
import { InputOverlay } from "./InputOverlay";

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

	const [draggingNode, setDraggingNode] = useState<LayoutNode | false>(false);

	const state: DiagramState = useMemo(() => {
		if (!offscreenCtx) return { layouts: [] }; // !
		setCanvasProperties(offscreenCtx);
		const algo: LayoutAlgorithm = new NaiveLayout();
		let s: DiagramState = {
			layouts: [],
		};
		let edge = 24.0;
		for (const tree of trees) {
			if (tree === undefined) continue; // !
			const layout = algo.doLayout(
				offscreenCtx,
				tree,
				draggingNode ? draggingNode.treeNodeId : undefined
			);
			s.layouts.push({
				...layout,
				entryX: edge + layout.entryX,
			});
			edge += layout.width + 24.0;
		}
		return s;
	}, [trees, draggingNode]);

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

	const diagramRef = useRef<HTMLDivElement>(null);
	const mouseCoordsToCanvasSpace = (
		e: MouseEvent
	): { x: number; y: number } => {
		if (diagramRef.current === null) {
			return { x: 0, y: 0 };
		}
		const rect = diagramRef.current.getBoundingClientRect();
		return {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		};
	};

	const onMouseUp = (event: MouseEvent) => {
		console.log("mouse up");
		const mouseCoords = mouseCoordsToCanvasSpace(event);
		// Find the layout node we clicked on
		const n = getLayoutNodeAt(state.layouts, mouseCoords.x, mouseCoords.y);
		if (draggingNode) {
			if (draggingNode.treeNodeId === n?.node.treeNodeId) {
				setDraggingNode(false);
				return;
			}
			// we are dropping a tree
			const insertAt = getInsertionPosition(
				state.layouts,
				mouseCoords.x,
				mouseCoords.y
			);
			if (insertAt === undefined) {
				setDraggingNode(false);
				return;
			}
			dispatch({
				kind: "moveNode",
				nodeId: draggingNode.treeNodeId,
				insertionPosition: insertAt,
			});
			setDraggingNode(false);
		} else {
			// we are (de)selecting a node
			if (n === undefined) {
				// Deselect if we clicked on nothing
				dispatch({ kind: "deselectNode" });
				return;
			}
			dispatch({ kind: "selectNode", nodeId: n.node.treeNodeId });
		}
	};

	const onMouseDown = (e: MouseEvent) => {
		console.log("mouse down");
		const mouseCoords = mouseCoordsToCanvasSpace(e);
		const n = getLayoutNodeAt(state.layouts, mouseCoords.x, mouseCoords.y);
		if (n === undefined) {
			dispatch({ kind: "deselectNode" });
			setDraggingNode(false);
			return;
		}
		dispatch({ kind: "selectNode", nodeId: n.node.treeNodeId });
		setDraggingNode(n.node);
	};

	const [selectedLayoutNode, selectedLayoutNodeLayout] = useLayoutNodeHandle(
		state.layouts,
		selectedNode?.id
	);
	// coordinated in canvas space
	const handleOverlayInput: JSX.InputEventHandler<HTMLInputElement> = (
		e
	): void => {
		if (e.target instanceof HTMLInputElement) {
			if (selectedNode === undefined || selectedLayoutNode === undefined)
				return;
			dispatch({
				kind: "updateLabelText",
				rootId: selectedLayoutNode.rootTreeNodeId,
				nodeId: selectedLayoutNode.treeNodeId,
				text: e.target.value,
			});
		}
	};

	return (
		<div
			id="diagram"
			class={styles.diagram}
			onMouseUp={onMouseUp}
			onMouseDown={onMouseDown}
			ref={diagramRef}
		>
			{selectedLayoutNode !== undefined && (
				<InputOverlay
					x={selectedLayoutNode.absoluteX + selectedLayoutNodeLayout.entryX}
					y={selectedLayoutNode.absoluteY + selectedLayoutNodeLayout.entryY}
					width={selectedLayoutNode.width}
					height={selectedLayoutNode.height + LABEL_PADDING}
					text={
						selectedLayoutNode.label !== undefined
							? selectedLayoutNode.label
							: ""
					}
					onInput={handleOverlayInput}
				/>
			)}
			<ResizableCanvas
				onMouseUp={onMouseUp}
				onMouseDown={onMouseDown}
				// onDragStart={onDragStart}
				// onMouseMove={onMouseMove}
				draw={draw}
			></ResizableCanvas>
		</div>
	);
};
