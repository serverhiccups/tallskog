import { parse, unparse } from "./parser";
import { deleteNode, Forest, hasNode, makeChild, makeSibling, moveNode, NodeId, TreeInsertionPosition, updateNodeLabel } from "./forest";

export interface DynamicForest {
	forest: Forest;
	diagramText: string;
	textError: boolean;
	selectedNode?: NodeId;
}

export type DynamicForestAction =
	| { kind: "deleteNode"; nodeId: string }
	| { kind: "updateDiagramText"; text: string }
	| { kind: "updateLabelText"; nodeId: string; text: string }
	| { kind: "selectNode"; nodeId: string }
	| { kind: "deselectNode" }
	| {
		kind: "moveNode";
		nodeId: string;
		insertionPosition: TreeInsertionPosition;
	}
	| { kind: "makeLeftSibling" }
	| { kind: "makeRightSibling" }
	| { kind: "makeChild" };

export const dynamicForestReducer = (
	state: DynamicForest,
	action: DynamicForestAction
): DynamicForest => {
	switch (action.kind) {
		case "updateDiagramText": {
			try {
				const res = parse(action.text);
				return {
					...state,
					diagramText: action.text,
					forest: res,
					textError: false,
					selectedNode: undefined,
				};
			} catch (e) {
				return { ...state, diagramText: action.text, textError: true };
			}
		}
		case "deleteNode": {
			const newForest = deleteNode(state.forest, action.nodeId);
			return {
				...state,
				diagramText: unparse(newForest),
				forest: newForest,
				textError: false,
				selectedNode: state.selectedNode !== undefined && hasNode(newForest, state.selectedNode)
					? state.selectedNode : undefined
			};
		}
		case "updateLabelText": {
			const newForest = updateNodeLabel(state.forest, action.nodeId, action.text);
			return {
				...state,
				diagramText: unparse(newForest),
				forest: newForest,
				textError: false,
				selectedNode: state.selectedNode !== undefined && hasNode(newForest, state.selectedNode)
					? state.selectedNode : undefined
			};
		}
		case "selectNode": {
			if (state.selectedNode === action.nodeId) return state;
			return {
				...state,
				selectedNode: hasNode(state.forest, action.nodeId) ? action.nodeId : undefined
			};
		}
		case "deselectNode": {
			if (state.selectedNode === undefined) return state;
			return { ...state, selectedNode: undefined };
		}
		case "moveNode": {
			const newForest = moveNode(state.forest, action.nodeId, action.insertionPosition.parent, action.insertionPosition.index);
			return {
				...state,
				diagramText: unparse(newForest),
				forest: newForest,
				selectedNode: hasNode(newForest, action.nodeId) ? action.nodeId : undefined
			};
		}
		case "makeRightSibling":
		case "makeLeftSibling": {
			if (state.selectedNode == undefined) return state;
			const newForest = makeSibling(state.forest, state.selectedNode, action.kind === "makeLeftSibling" ? "left" : "right");
			return {
				...state,
				diagramText: unparse(newForest),
				forest: newForest,
				selectedNode: hasNode(newForest, state.selectedNode) ? state.selectedNode : undefined
			};
		}
		case "makeChild": {
			if (state.selectedNode === undefined) return state;
			const newForest = makeChild(state.forest, state.selectedNode)
			return {
				...state,
				diagramText: unparse(newForest),
				forest: newForest,
				selectedNode: hasNode(newForest, state.selectedNode) ? state.selectedNode : undefined // TODO: make select new child
			};
		}
		default: {
			return state;
		}
	}
};

export const buildInitialState = (tree: string): DynamicForest => {
	return {
		forest: parse(tree),
		diagramText: tree,
		textError: false,
		selectedNode: undefined,
	};
};