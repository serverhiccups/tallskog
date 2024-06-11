export type TreeNode = Readonly<{
	children: TreeNode[];
	label: string;
}>;

export const createTreeNode = (
	label: string,
	children: TreeNode[] = []
): TreeNode => {
	return {
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

export const isLeaf = (node: TreeNode): boolean => {
	return node.children.length == 0;
};
