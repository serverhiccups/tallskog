import { TreeNode } from "../tree/treeNode";

export interface Layout {
	width: number;
	height: number;
	entryX: number;
	entryY: number;
	root: LayoutNode;
}

export interface LayoutAlgorithm {
	doLayout(ctx: CanvasRenderingContext2D, tree: TreeNode): Layout;
}

export interface LayoutNode {
	label: string | undefined;
	x: number;
	y: number;
	absoluteX: number;
	absoluteY: number;
	width: number;
	height: number;
	children: LayoutNode[];
}

function flattenLayout(root: LayoutNode): LayoutNode[] {
	if (root.children.length == 0) return [root];
	return [root, ...root.children.map(flattenLayout).flat()];
}

export const getLayoutNodeAt = (
	state: Layout[],
	x: number,
	y: number
): LayoutNode | undefined => {
	if (x < 24.0) return;
	//TODO: very bad code, refactor
	let edge = 24.0;
	for (const l of state) {
		const localX = x - edge - l.width / 2.0;
		const localY = y - 72.0;
		edge += l.width + 24.0;

		if (localX < -l.width / 2.0 || localX > l.width / 2.0) continue;
		for (const node of flattenLayout(l.root)) {
			if (
				localX < node.absoluteX - node.width / 2.0 ||
				localX > node.absoluteX + node.width / 2.0 ||
				localY < node.absoluteY - node.height ||
				localY > node.absoluteY
			)
				continue;
			return node;
		}
	}
	return;
};
