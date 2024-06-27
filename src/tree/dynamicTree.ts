import { TreeNode } from "./treeNode";

export interface DynamicForest {
	roots: TreeNode[];
}

export type DynamicForestAction = {
	kind: "deleteNode";
	rootId: string;
	nodeId: string;
};

export const dynamicForestReducer = (
	state: DynamicForest,
	action: DynamicForestAction
): DynamicForest => {
	switch (action.kind) {
		case "deleteNode":
			return {
				...state,
				roots: doOnRoot(state.roots, action.rootId, (r) =>
					deleteNode(r, action.nodeId)
				),
			};
	}
};

const doOnRoot = (
	roots: TreeNode[],
	rootId: string,
	action: (root: TreeNode) => TreeNode | undefined
): TreeNode[] => {
	console.log("doing");
	console.dir(roots);
	const rIdx = roots.findIndex((r) => r.id == rootId);
	if (rIdx == -1) return roots;
	console.log("found root");
	const res = action(roots[rIdx]);
	if (res === undefined) {
		roots.splice(rIdx, 1);
		return roots;
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
