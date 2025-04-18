import {
	createTreeNode,
	reparent,
	rootOf,
	TreeInsertionPosition,
	TreeNode,
} from "./treeNode";
import { parse, unparse } from "./parser";

export interface DynamicForest {
	roots: TreeNode[];
	diagramText: string;
	textError: boolean;
	selectedNode: TreeNode | undefined;
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
					roots: res,
					textError: false,
					selectedNode: undefined,
				};
			} catch (e) {
				return { ...state, diagramText: action.text, textError: true };
			}
		}
		case "deleteNode": {
			const node = findNodeById(state.roots, action.nodeId);
			if (node === undefined) return state;
			const root = rootOf(node);
			if (root === undefined) return state;
			const newRoots = doOnRoot(state.roots, root.id, (r) =>
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
			const node = findNodeById(state.roots, action.nodeId);
			if (node === undefined) return state;
			const root = rootOf(node);
			const newRoots = doOnRoot(state.roots, root.id, (r) =>
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
			if (selection === undefined) return state;
			return {
				...state,
				selectedNode: selection,
			};
		}
		case "deselectNode": {
			if (state.selectedNode === undefined) return state;
			return { ...state, selectedNode: undefined };
		}
		case "moveNode": {
			const toMove = findNodeById(state.roots, action.nodeId);
			if (toMove === undefined) return state;
			const root = rootOf(toMove);
			if (root === undefined) return state;
			const slimRoots = doOnRoot(state.roots, root.id, (r) =>
				deleteNode(r, toMove.id)
			);
			const insertionParent = findNodeById(
				slimRoots,
				action.insertionPosition.parent
			);
			if (insertionParent === undefined) return state;
			const insertionRoot = rootOf(insertionParent);
			const withInsertion = doOnRoot(slimRoots, insertionRoot.id, (r) =>
				insertNode(r, toMove, action.insertionPosition)
			);
			return {
				...state,
				diagramText: unparse(withInsertion),
				roots: withInsertion,
				selectedNode:
					state.selectedNode === undefined
						? undefined
						: findNodeById(withInsertion, state.selectedNode.id),
			};
		}
		case "makeRightSibling":
		case "makeLeftSibling": {
			if (state.selectedNode == undefined) return state;
			const parent = state.selectedNode.parent;
			if (parent === undefined) return state;
			const root = rootOf(state.selectedNode);
			const newSibling = createTreeNode("∅", undefined, []);
			const inserted = doOnRoot(state.roots, root.id, (r) =>
				insertNode(r, newSibling, {
					parent: parent.id,
					index:
						parent.children.findIndex((c) => c.id === state.selectedNode?.id) +
						(action.kind == "makeRightSibling" ? 1 : 0),
				})
			);
			return {
				...state,
				diagramText: unparse(inserted),
				roots: inserted,
				selectedNode: findNodeById(inserted, newSibling.id),
			};
		}
		case "makeChild": {
			if (state.selectedNode === undefined) return state;
			const node = state.selectedNode;
			const root = rootOf(node);
			const newChild = createTreeNode("∅", undefined, []);
			const inserted = doOnRoot(state.roots, root.id, (r) =>
				insertNode(r, newChild, {
					parent: node.id,
					index: node.children.length,
				})
			);
			return {
				...state,
				diagramText: unparse(inserted),
				roots: inserted,
				selectedNode: findNodeById(inserted, newChild.id),
			};
		}
		default: {
			return state;
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
	roots[rIdx] = reparent(res, undefined);
	return [...roots];
};

const deleteNode = (root: TreeNode, nodeId: string): TreeNode | undefined => {
	const updatedTree = modifyTree(root, (c: TreeNode) => {
		if (c.id === nodeId) return null;
		return c;
	});
	return updatedTree !== null ? updatedTree : undefined;
};

const insertNode = (
	root: TreeNode,
	node: TreeNode,
	pos: TreeInsertionPosition
): TreeNode | undefined => {
	const updatedTree = modifyTree(root, (c: TreeNode) => {
		if (c.id == pos.parent) {
			const kids = [...c.children];
			if (kids.length == 0) return { ...c, children: [node] };
			kids.splice(pos.index, 0, node); // Replace node
			return { ...c, children: kids };
		} else {
			return c;
		}
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
		children: res.children
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
			const current: TreeNode | undefined = stack.pop();
			if (!current) continue;
			if (current.id == nodeId) return current;
			stack.push(...current.children);
		}
	}
	return undefined;
};
