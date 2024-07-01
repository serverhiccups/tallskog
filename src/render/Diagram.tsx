import { FunctionalComponent, JSX } from "preact";
import { TreeNode } from "../tree/treeNode";
import { ResizableCanvas } from "./ResizableCanvas";
import {
	LABEL_PADDING,
	RenderingContext2D,
	renderLayout,
	TRACK_HEIGHT,
} from "./render";
import {
	Layout,
	LayoutAlgorithm,
	buildLayoutNodeQueryStructure,
	getInsertionPosition,
	getLayoutNodeAt,
	useLayoutNodeHandle,
} from "./layout";
import { NaiveLayout } from "./naiveLayout";
import { Dispatch, useMemo, useRef, useState } from "preact/hooks";
import { DynamicForestAction } from "../tree/dynamicForest";
import styles from "./diagram.module.scss";
import { InputOverlay } from "./InputOverlay";
import { useDndState } from "./dndState";

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

	// const [draggingNode, setDraggingNode] = useState<LayoutNode | false>(false);
	const [currentlyDragging, dndActions] = useDndState();

	const algo: LayoutAlgorithm = new NaiveLayout();

	const state: DiagramState = useMemo(() => {
		if (!offscreenCtx) return { layouts: [] }; // !
		setCanvasProperties(offscreenCtx);
		let s: DiagramState = {
			layouts: [],
		};
		let edge = 36.0;
		for (const tree of trees) {
			if (tree === undefined) continue; // !
			const layout = algo.doLayout(
				offscreenCtx,
				tree,
				currentlyDragging?.treeNodeId
			);
			s.layouts.push({
				...layout,
				entryX: edge + layout.width / 2.0,
				entryY: TRACK_HEIGHT,
			});
			edge += layout.width + 36.0;
		}
		return s;
	}, [trees, currentlyDragging]);

	const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({
		x: 0,
		y: 0,
	});

	const draggingPreview: Layout | undefined = useMemo(() => {
		if (currentlyDragging === undefined) return undefined;
		return {
			width: currentlyDragging.width,
			height: currentlyDragging.height,
			entryX: mousePosition.x,
			entryY: mousePosition.y + 10.0,
			root: currentlyDragging,
			query: buildLayoutNodeQueryStructure(currentlyDragging),
		};
	}, [currentlyDragging, mousePosition]);

	const draw = (ctx: CanvasRenderingContext2D) => {
		if (!state) return;
		// Show tracks
		// ctx.fillStyle = "#333";
		// for (let i = TRACK_HEIGHT; i < height; i += TRACK_HEIGHT) {
		//     ctx.fillRect(0, i, width, 1.0);
		// }
		// Set up canvas
		setCanvasProperties(ctx);
		for (const la of state.layouts) {
			renderLayout(ctx, la);
		}
		if (draggingPreview !== undefined) {
			renderLayout(ctx, draggingPreview);
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
		const mouseCoords = mouseCoordsToCanvasSpace(event);
		// Find the layout node we clicked on
		const n = getLayoutNodeAt(state.layouts, mouseCoords.x, mouseCoords.y);
		if (currentlyDragging) {
			// we are dropping a tree
			const insertAt = getInsertionPosition(
				state.layouts,
				mouseCoords.x,
				mouseCoords.y
			);
			if (insertAt === undefined) {
				dndActions.endDrag();
				return;
			}
			dispatch({
				kind: "moveNode",
				nodeId: currentlyDragging.treeNodeId,
				insertionPosition: insertAt,
			});
			dndActions.endDrag();
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
		const mouseCoords = mouseCoordsToCanvasSpace(e);
		const n = getLayoutNodeAt(state.layouts, mouseCoords.x, mouseCoords.y);
		if (n === undefined) {
			dispatch({ kind: "deselectNode" });
			return;
		}
		dispatch({ kind: "selectNode", nodeId: n.node.treeNodeId });
		dndActions.startDrag(n.node);
	};

	const onMouseMove = (e: MouseEvent) => {
		const mouseCoords = mouseCoordsToCanvasSpace(e);
		setMousePosition(mouseCoords);
		if (e.buttons & 1) {
			dndActions.movedOver(
				getLayoutNodeAt(state.layouts, mouseCoords.x, mouseCoords.y)?.node
			);
		}
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
			onMouseMove={onMouseMove}
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
			<ResizableCanvas draw={draw}></ResizableCanvas>
		</div>
	);
};
