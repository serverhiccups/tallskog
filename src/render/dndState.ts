import { useReducer, useMemo } from "preact/hooks";
import { LayoutNode } from "./layout";

export interface DndState {
	draggingNode: LayoutNode | undefined;
	validDragStarted: boolean;
}

export type DndAction =
	| { kind: "startDrag"; node: LayoutNode }
	| { kind: "movedOver"; node: LayoutNode | undefined }
	| { kind: "endDrag" };

export const DndReducer = (state: DndState, action: DndAction): DndState => {
	switch (action.kind) {
		case "startDrag": {
			return { draggingNode: action.node, validDragStarted: false };
		}
		case "endDrag": {
			return { draggingNode: undefined, validDragStarted: false };
		}
		case "movedOver": {
			if (state.draggingNode === undefined) return state;
			return {
				...state,
				validDragStarted: state.validDragStarted
					? true
					: action.node?.treeNodeId !== state.draggingNode.treeNodeId,
			};
		}
	}
};

export const useDndState = (): [
	LayoutNode | undefined,
	{
		startDrag: (node: LayoutNode) => void;
		movedOver: (node: LayoutNode | undefined) => void;
		endDrag: () => void;
	}
] => {
	let [state, dispatch] = useReducer<DndState, DndAction>(DndReducer, {
		draggingNode: undefined,
		validDragStarted: false,
	});

	const startDrag = (node: LayoutNode): void => {
		dispatch({ kind: "startDrag", node: node });
	};
	const movedOver = (node: LayoutNode | undefined): void => {
		dispatch({ kind: "movedOver", node: node });
	};
	const endDrag = (): void => {
		dispatch({ kind: "endDrag" });
	};

	const currentlyDragging = useMemo((): LayoutNode | undefined => {
		return state.validDragStarted ? state.draggingNode : undefined;
	}, [state]);
	return [currentlyDragging, { startDrag, movedOver, endDrag }];
};
