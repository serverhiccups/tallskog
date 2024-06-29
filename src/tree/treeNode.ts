export type TreeNode = Readonly<{
	children: ReadonlyArray<TreeNode>;
	label: string;
	id: string;
	parent: TreeNode | undefined;
}>;

export type TreeInsertionPosition = {
	parent: string;
	index: number;
};

export const createTreeNode = (
	label: string,
	parent: TreeNode | undefined,
	children: TreeNode[] = [],
	id: string = crypto.randomUUID()
): TreeNode => {
	return {
		id: id,
		parent: parent,
		label: label,
		children: children,
	};
};

export const addChildren = (node: TreeNode, children: TreeNode[]): TreeNode => {
	return {
		...node,
		children: [...node.children, ...children],
	};
};

export const removeChild = (parent: TreeNode, childId: string): TreeNode => {
	return {
		...parent,
		children: parent.children.filter((n) => n.id != childId),
	};
};

export const isLeaf = (node: TreeNode): boolean => {
	return node.children.length == 0;
};

export const rootOf = (start: TreeNode): TreeNode => {
	let current = start;
	while (current.parent !== undefined) current = current.parent;
	return current;
};
