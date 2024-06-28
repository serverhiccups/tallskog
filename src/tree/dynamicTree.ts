import { TreeNode } from "./treeNode";
import { parse, unparse } from "./parser";

export interface DynamicForest {
	roots: TreeNode[];
	diagramText: string;
	textError: boolean;
	selectedNode: TreeNode | undefined;
}

export type DynamicForestAction =
	| {
			kind: "deleteNode";
			rootId: string;
			nodeId: string;
	  }
	| { kind: "updateDiagramText"; text: string }
	| { kind: "updateLabelText"; rootId: string; nodeId: string; text: string }
	| { kind: "selectNode"; nodeId: string }
	| { kind: "deselectNode" };

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
					roots: res,
					textError: false,
					selectedNode: undefined,
				};
			} catch (e) {
				return { ...state, diagramText: action.text, textError: true };
			}
		}
		case "deleteNode": {
			const newRoots = doOnRoot(state.roots, action.rootId, (r) =>
				deleteNode(r, action.nodeId)
			);
			return {
				...state,
				diagramText: unparse(newRoots),
				roots: newRoots,
				textError: false,
				selectedNode:
					state.selectedNode === undefined
						? undefined
						: findNodeById(newRoots, state.selectedNode.id),
			};
		}
		case "updateLabelText": {
			const newRoots = doOnRoot(state.roots, action.rootId, (r) =>
				updateLabel(r, action.nodeId, action.text)
			);
			return {
				...state,
				diagramText: unparse(newRoots),
				roots: newRoots,
				textError: false,
				selectedNode:
					state.selectedNode === undefined
						? undefined
						: findNodeById(newRoots, state.selectedNode.id),
			};
		}
		case "selectNode": {
			const selection = findNodeById(state.roots, action.nodeId);
			return {
				...state,
				selectedNode: selection,
			};
		}
		case "deselectNode": {
			return { ...state, selectedNode: undefined };
		}
	}
};

export const buildInitialState = (tree: string): DynamicForest => {
	return {
		roots: parse(tree),
		diagramText: tree,
		textError: false,
		selectedNode: undefined,
	};
};

const doOnRoot = (
	roots: TreeNode[],
	rootId: string,
	action: (root: TreeNode) => TreeNode | undefined
): TreeNode[] => {
	const rIdx = roots.findIndex((r) => r.id == rootId);
	if (rIdx == -1) return roots;
	const res = action(roots[rIdx]);
	if (res === undefined) {
		roots.splice(rIdx, 1);
		return [...roots];
	}
	roots[rIdx] = res;
	return [...roots];
};

const deleteNode = (root: TreeNode, nodeId: string): TreeNode | undefined => {
	const updatedTree = modifyTree(root, (c: TreeNode) => {
		if (c.id == nodeId) return null;
		return c;
	});
	return updatedTree !== null ? updatedTree : undefined;
};

const updateLabel = (
	root: TreeNode,
	nodeId: string,
	newLabel: string
): TreeNode => {
	const updatedTree = modifyTree(root, (c: TreeNode) => {
		if (c.id == nodeId) return { ...c, label: newLabel };
		return c;
	});
	if (updatedTree === null) return root;
	return updatedTree;
};

const modifyTree = (
	currentNode: TreeNode,
	editFunction: (currentNode: TreeNode) => TreeNode | null
): TreeNode | null => {
	const res = editFunction(currentNode);
	if (res === null) return null;

	return {
		...res,
		children: currentNode.children
			.map((c) => modifyTree(c, editFunction))
			.filter((c) => c !== null),
	};
};

const findNodeById = (
	roots: TreeNode[],
	nodeId: string
): TreeNode | undefined => {
	for (const root of roots) {
		let stack = [];
		stack.push(root);
		while (stack.length > 0) {
			const current = stack.pop();
			if (!current) continue;
			if (current.id == nodeId) {
				console.log("found");
				console.dir(current);
				return current;
			}
			stack.push(...current.children);
		}
	}
	return undefined;
};
