import { useReducer, useMemo } from "preact/hooks";
import { LayoutNode } from "../render/layout";
import { TreeInsertionPosition } from "../tree/treeNode";

export interface DndState {
	draggingNode: LayoutNode | undefined;
	dropTargetId: string | undefined;
	validDragStarted: boolean;
}

export type DndAction =
	| { kind: "startDrag"; node: LayoutNode }
	| {
			kind: "movedOver";
			node: LayoutNode | undefined;
			dropTarget: string | undefined;
	  }
	| { kind: "endDrag" };

export const DndReducer = (state: DndState, action: DndAction): DndState => {
	switch (action.kind) {
		case "startDrag": {
			return {
				draggingNode: action.node,
				dropTargetId: undefined,
				validDragStarted: false,
			};
		}
		case "endDrag": {
			return {
				draggingNode: undefined,
				dropTargetId: undefined,
				validDragStarted: false,
			};
		}
		case "movedOver": {
			if (state.draggingNode === undefined) return state;
			return {
				...state,
				validDragStarted: state.validDragStarted
					? true
					: action.node?.treeNodeId !== state.draggingNode.treeNodeId,
				dropTargetId: action.dropTarget,
			};
		}
	}
};

export const useDndState = (): [
	LayoutNode | undefined,
	string | undefined,
	{
		startDrag: (node: LayoutNode) => void;
		movedOver: (
			node: LayoutNode | undefined,
			insertAt: TreeInsertionPosition | undefined
		) => void;
		endDrag: () => void;
	}
] => {
	let [state, dispatch] = useReducer<DndState, DndAction>(DndReducer, {
		draggingNode: undefined,
		dropTargetId: undefined,
		validDragStarted: false,
	});

	const startDrag = (node: LayoutNode): void => {
		dispatch({ kind: "startDrag", node: node });
	};
	const movedOver = (
		node: LayoutNode | undefined,
		insertAt: TreeInsertionPosition | undefined
	): void => {
		dispatch({ kind: "movedOver", node: node, dropTarget: insertAt?.parent });
	};
	const endDrag = (): void => {
		dispatch({ kind: "endDrag" });
	};

	const currentlyDragging = useMemo((): LayoutNode | undefined => {
		return state.validDragStarted ? state.draggingNode : undefined;
	}, [state]);

	const dropTargetId = useMemo(() => {
		if (currentlyDragging === undefined) return undefined;
		return state.dropTargetId;
	}, [currentlyDragging, state]);
	return [currentlyDragging, dropTargetId, { startDrag, movedOver, endDrag }];
};
