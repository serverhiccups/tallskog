import { TreeNode } from "./treeNode";
import { parse, unparse } from "./parser";

export interface DynamicForest {
	roots: TreeNode[];
	diagramText: string;
	textError: boolean;
}

export type DynamicForestAction =
	| {
			kind: "deleteNode";
			rootId: string;
			nodeId: string;
	  }
	| { kind: "updateDiagramText"; text: string };

export const dynamicForestReducer = (
	state: DynamicForest,
	action: DynamicForestAction
): DynamicForest => {
	switch (action.kind) {
		case "updateDiagramText":
			try {
				const res = parse(action.text);
				return {
					...state,
					diagramText: action.text,
					roots: res,
					textError: false,
				};
			} catch (e) {
				return { ...state, diagramText: action.text, textError: true };
			}
		case "deleteNode":
			const newRoots = doOnRoot(state.roots, action.rootId, (r) =>
				deleteNode(r, action.nodeId)
			);
			return {
				...state,
				diagramText: unparse(newRoots),
				roots: newRoots,
				textError: false,
			};
	}
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

// const findNodeById = (
// 	dyanmicTree: DynamicForest,
// 	nodeId: string
// ): TreeNode | null => {
// 	let stack = [];
// 	stack.push(dyanmicTree.roots);
// 	while (stack.length > 1) {
// 		const current = stack.pop();
// 		if (!current) continue;
// 		if (current.id == nodeId) return current;
// 	}
// 	return null;
// };
