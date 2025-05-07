import { FunctionalComponent, createRef } from "preact";
import { Dispatch, useMemo, useState } from "preact/hooks";
import { ResizableCanvas } from "../render/ResizableCanvas";
import {
	buildLayoutNodeQueryStructure,
	getInsertionPosition,
	getLayoutNodeAt,
	LayoutTree,
	LayoutAlgorithm,
	useLayoutNodeHandle,
	Layout,
} from "../render/layout";
import { NaiveLayout } from "../render/naiveLayout";
import { renderLayout, setCanvasProperties } from "../render/render";
import { DynamicForestAction } from "../tree/dynamicForest";
import { InputOverlay } from "./InputOverlay";
import styles from "./diagram.module.scss";
import { useDndState } from "./dndState";
import { Forest, NodeId } from "../tree/forest";

interface DiagramProps {
	forest: Forest;
	selectedNode?: NodeId;
	dispatch: Dispatch<DynamicForestAction>;
}

export const Diagram: FunctionalComponent<DiagramProps> = ({
	forest,
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

	const [currentlyDragging, dropTargetId, dndActions] = useDndState();

	const algo: LayoutAlgorithm = new NaiveLayout();

	const layout: Layout = useMemo(() => {
		if (forest === undefined) return { trees: [] };
		if (!offscreenCtx) return { trees: [] };
		setCanvasProperties(offscreenCtx);
		return algo.layoutForest(
			offscreenCtx,
			forest,
			currentlyDragging?.nodeId,
			dropTargetId ? [dropTargetId] : []
		);
	}, [forest, currentlyDragging, dropTargetId]);

	const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({
		x: 0,
		y: 0,
	});

	const draggingPreview: LayoutTree | undefined = useMemo(() => {
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
		if (!layout) return;
		// Show tracks
		// ctx.fillStyle = "#333";
		// for (let i = TRACK_HEIGHT; i < height; i += TRACK_HEIGHT) {
		//     ctx.fillRect(0, i, width, 1.0);
		// }
		// Set up canvas
		setCanvasProperties(ctx);
		for (const la of layout.trees) {
			renderLayout(ctx, la);
		}
		if (draggingPreview !== undefined) {
			renderLayout(ctx, draggingPreview);
		}
	};

	const diagramRef = createRef<HTMLDivElement>();
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
		const n = getLayoutNodeAt(layout, mouseCoords.x, mouseCoords.y);
		if (currentlyDragging) {
			// we are dropping a tree
			const insertAt = getInsertionPosition(
				layout,
				mouseCoords.x,
				mouseCoords.y
			);
			if (insertAt === undefined) {
				dndActions.endDrag();
				return;
			}
			dispatch({
				kind: "moveNode",
				nodeId: currentlyDragging.nodeId,
				insertionPosition: insertAt,
			});
		} else {
			// we are (de)selecting a node
			if (n === undefined) {
				// Deselect if we clicked on nothing
				dispatch({ kind: "deselectNode" });
				return;
			}
			dispatch({ kind: "selectNode", nodeId: n.node.nodeId });
		}
		dndActions.endDrag();
	};

	const onMouseDown = (e: MouseEvent) => {
		const mouseCoords = mouseCoordsToCanvasSpace(e);
		const n = getLayoutNodeAt(layout, mouseCoords.x, mouseCoords.y);
		if (n === undefined) {
			dispatch({ kind: "deselectNode" });
			return;
		}
		dispatch({ kind: "selectNode", nodeId: n.node.nodeId });
		dndActions.startDrag(n.node);
	};

	const onMouseMove = (e: MouseEvent) => {
		const mouseCoords = mouseCoordsToCanvasSpace(e);
		setMousePosition(mouseCoords);
		if (e.buttons & 1) {
			const insertAt = getInsertionPosition(
				layout,
				mouseCoords.x,
				mouseCoords.y
			);
			dndActions.movedOver(
				getLayoutNodeAt(layout, mouseCoords.x, mouseCoords.y)?.node,
				insertAt
			);
		} else dndActions.endDrag();
	};

	const [selectedLayoutNode, selectedLayoutNodeLayout] = useLayoutNodeHandle(
		layout,
		selectedNode
	);

	const inputRef = createRef<HTMLInputElement>();
	const [overlayFocused, setOverlayFocused] = useState<boolean>(false);

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.code === "Backspace" && selectedLayoutNode !== undefined) {
			// debugger;
			if (overlayFocused && selectedLayoutNode.label !== "") return;
			dispatch({ kind: "deleteNode", nodeId: selectedLayoutNode.nodeId });
		} else if (e.code == "Escape") {
			dispatch({ kind: "deselectNode" });
		}
	};

	return (
		<div
			id="diagram"
			class={styles.diagram}
			onMouseUp={onMouseUp}
			onMouseDown={onMouseDown}
			onMouseMove={onMouseMove}
			onKeyDown={onKeyDown}
			ref={diagramRef}
			tabIndex={0}
		>
			{selectedLayoutNode !== undefined && (
				<InputOverlay
					id={selectedLayoutNode.nodeId}
					x={selectedLayoutNode.absoluteX + selectedLayoutNodeLayout.entryX}
					y={selectedLayoutNode.absoluteY + selectedLayoutNodeLayout.entryY}
					width={selectedLayoutNode.width}
					height={selectedLayoutNode.height}
					dispatch={dispatch}
					onFocusUpdate={setOverlayFocused}
					inputRef={inputRef}
					text={
						selectedLayoutNode.label !== undefined
							? selectedLayoutNode.label
							: ""
					}
				/>
			)}
			<ResizableCanvas draw={draw}></ResizableCanvas>
		</div>
	);
};
