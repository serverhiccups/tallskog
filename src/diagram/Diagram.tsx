import { FunctionalComponent } from "preact";
import { Dispatch, useMemo, useRef, useState } from "preact/hooks";
import { ResizableCanvas } from "../render/ResizableCanvas";
import {
	buildLayoutNodeQueryStructure,
	getInsertionPosition,
	getLayoutNodeAt,
	Layout,
	LayoutAlgorithm,
	useLayoutNodeHandle,
} from "../render/layout";
import { NaiveLayout } from "../render/naiveLayout";
import {
	renderLayout,
	setCanvasProperties,
	TRACK_HEIGHT,
} from "../render/render";
import { DynamicForestAction } from "../tree/dynamicForest";
import { TreeNode } from "../tree/treeNode";
import { InputOverlay } from "./InputOverlay";
import styles from "./diagram.module.scss";
import { useDndState } from "./dndState";

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

	const [currentlyDragging, dropTargetId, dndActions] = useDndState();

	const algo: LayoutAlgorithm = new NaiveLayout();

	const layouts: Layout[] = useMemo(() => {
		if (!offscreenCtx) return []; // !
		setCanvasProperties(offscreenCtx);
		let layouts: Layout[] = [];
		let edge = 36.0;
		for (const tree of trees) {
			if (tree === undefined) continue; // !
			const layout = algo.doLayout(
				offscreenCtx,
				tree,
				currentlyDragging?.treeNodeId,
				dropTargetId ? [dropTargetId] : []
			);
			layouts.push({
				...layout,
				entryX: edge + layout.width / 2.0,
				entryY: TRACK_HEIGHT,
			});
			edge += layout.width + 36.0;
		}
		return layouts;
	}, [trees, currentlyDragging, dropTargetId]);

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
		if (!layouts) return;
		// Show tracks
		// ctx.fillStyle = "#333";
		// for (let i = TRACK_HEIGHT; i < height; i += TRACK_HEIGHT) {
		//     ctx.fillRect(0, i, width, 1.0);
		// }
		// Set up canvas
		setCanvasProperties(ctx);
		for (const la of layouts) {
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
		const n = getLayoutNodeAt(layouts, mouseCoords.x, mouseCoords.y);
		if (currentlyDragging) {
			// we are dropping a tree
			const insertAt = getInsertionPosition(
				layouts,
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
		} else {
			// we are (de)selecting a node
			if (n === undefined) {
				// Deselect if we clicked on nothing
				dispatch({ kind: "deselectNode" });
				return;
			}
			dispatch({ kind: "selectNode", nodeId: n.node.treeNodeId });
		}
		dndActions.endDrag();
	};

	const onMouseDown = (e: MouseEvent) => {
		const mouseCoords = mouseCoordsToCanvasSpace(e);
		const n = getLayoutNodeAt(layouts, mouseCoords.x, mouseCoords.y);
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
			const insertAt = getInsertionPosition(
				layouts,
				mouseCoords.x,
				mouseCoords.y
			);
			dndActions.movedOver(
				getLayoutNodeAt(layouts, mouseCoords.x, mouseCoords.y)?.node,
				insertAt
			);
		} else dndActions.endDrag();
	};

	const [selectedLayoutNode, selectedLayoutNodeLayout] = useLayoutNodeHandle(
		layouts,
		selectedNode?.id
	);

	const inputRef = useRef<HTMLInputElement>(null);
	const [overlayFocused, setOverlayFocused] = useState<boolean>(false);

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.code === "Backspace" && selectedLayoutNode !== undefined) {
			if (overlayFocused && selectedLayoutNode.label !== "") return;
			dispatch({ kind: "deleteNode", nodeId: selectedLayoutNode.treeNodeId });
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
					id={selectedLayoutNode.treeNodeId}
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
