export type TreeNode = Readonly<{
	children: ReadonlyArray<TreeNode>;
	label: string;
	id: string;
	parent: TreeNode | undefined;
}>;

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
