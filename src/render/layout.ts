import { useMemo } from "preact/hooks";
import { TreeNode } from "../tree/treeNode";
import { LABEL_PADDING } from "./render";

export interface Layout {
	width: number;
	height: number;
	entryX: number;
	entryY: number;
	root: LayoutNode;
	query: LayoutNodeQueryStructure;
}

export interface LayoutAlgorithm {
	doLayout(ctx: CanvasRenderingContext2D, tree: TreeNode): Layout;
}

export interface LayoutNode {
	label: string | undefined;
	treeNodeId: string;
	rootTreeNodeId: string;
	x: number;
	y: number;
	absoluteX: number;
	absoluteY: number;
	width: number;
	height: number;
	children: LayoutNode[];
}

interface LayoutNodeQueryStructure {
	nodes: LayoutNode[];
}

function flattenLayout(root: LayoutNode): LayoutNode[] {
	if (root.children.length == 0) return [root];
	return [root, ...root.children.map(flattenLayout).flat()];
}

export const buildLayoutNodeQueryStructure = (
	root: LayoutNode
): LayoutNodeQueryStructure => {
	return {
		nodes: flattenLayout(root),
	};
};

export const getLayoutNodeAt = (
	layouts: Layout[],
	x: number,
	y: number
): { node: LayoutNode; root: Layout } | undefined => {
	if (x < 24.0) return;
	//TODO: very bad code, refactor
	let edge = 24.0;
	for (const l of layouts) {
		const localX = x - edge - l.width / 2.0;
		const localY = y - 72.0;
		edge += l.width + 24.0;

		if (localX < -l.width / 2.0 || localX > l.width / 2.0) continue;
		for (const node of l.query.nodes) {
			if (
				localX < node.absoluteX - node.width / 2.0 - LABEL_PADDING / 2.0 ||
				localX > node.absoluteX + node.width / 2.0 + LABEL_PADDING / 2.0 ||
				localY < node.absoluteY - node.height - LABEL_PADDING / 2.0 ||
				localY > node.absoluteY + LABEL_PADDING / 2.0
			)
				continue;
			return { node, root: l };
		}
	}
	return;
};

export const useLayoutNodeHandle = (
	layouts: Layout[],
	treeNodeId: string | undefined
): [LayoutNode, Layout] | [undefined, undefined] => {
	return useMemo(() => {
		if (treeNodeId === undefined) return [undefined, undefined];
		for (const l of layouts) {
			const res = l.query.nodes.find((n) => n.treeNodeId == treeNodeId);
			if (res !== undefined) return [res, l];
		}
		return [undefined, undefined];
	}, [layouts, treeNodeId]);
};
