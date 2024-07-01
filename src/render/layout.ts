import { useMemo } from "preact/hooks";
import { TreeInsertionPosition, TreeNode } from "../tree/treeNode";
import { LABEL_PADDING, RenderingContext2D } from "./render";

export interface Layout {
	width: number;
	height: number;
	entryX: number;
	entryY: number;
	root: LayoutNode;
	query: LayoutNodeQueryStructure;
}

export interface LayoutAlgorithm {
	doLayout(
		ctx: RenderingContext2D,
		tree: TreeNode,
		stubId: string | undefined
	): Layout;
}

export interface LayoutNode {
	label: string | undefined;
	treeNodeId: string;
	rootTreeNodeId: string;
	parent: LayoutNode | undefined;
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

const isPointInsideLayoutNode = (
	node: LayoutNode,
	x: number,
	y: number
): boolean => {
	// the baseline is at x = 0
	return (
		y < LABEL_PADDING / 2.0 &&
		y > -node.height - LABEL_PADDING / 2.0 &&
		x > -node.width / 2.0 - LABEL_PADDING / 2.0 &&
		x < node.width / 2.0 + LABEL_PADDING / 2.0
	);
};

export const getLayoutNodeAt = (
	layouts: Layout[],
	x: number,
	y: number
): { node: LayoutNode; root: Layout } | undefined => {
	if (x < 24.0) return;
	//TODO: very bad code, refactor
	for (const l of layouts) {
		const localX = x - l.entryX;
		const localY = y - l.entryY;

		if (localX < -l.width / 2.0 || localX > l.width / 2.0) continue;
		for (const node of l.query.nodes) {
			if (
				isPointInsideLayoutNode(
					node,
					localX - node.absoluteX,
					localY - node.absoluteY
				)
			)
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

export const getInsertionPosition = (
	layouts: Layout[],
	x: number,
	y: number
): TreeInsertionPosition | undefined => {
	const closestLayout = layouts.reduce((a, b) =>
		Math.abs(a.entryX - x) < Math.abs(b.entryX - x) ? a : b
	);
	const nodesInBand = closestLayout.query.nodes.filter(
		(n) => Math.abs(n.absoluteY + closestLayout.entryY - y) < 20
	);
	if (nodesInBand.length == 0) return undefined;
	const closestNode = nodesInBand.reduce((a, b) =>
		Math.abs(a.absoluteX + closestLayout.entryX - x) <
		Math.abs(b.absoluteX + closestLayout.entryX - x)
			? a
			: b
	);
	if (closestNode === undefined) return;
	// If we're on top of a node, insert as a child to it
	if (
		isPointInsideLayoutNode(
			closestNode,
			x - closestLayout.entryX - closestNode.absoluteX,
			y - closestLayout.entryY - closestNode.absoluteY
		)
	) {
		return {
			parent: closestNode.treeNodeId,
			index: 0,
		};
	}
	const insertOnRight: boolean =
		closestNode.absoluteX + closestLayout.entryX < x;
	if (closestNode.parent === undefined) return undefined; // Cannot insert next to the root
	const index = closestNode.parent.children.findIndex(
		(c) => c.treeNodeId == closestNode.treeNodeId
	);
	if (index == -1) return undefined;
	return {
		parent: closestNode.parent.treeNodeId,
		index: index + (insertOnRight ? 1 : 0),
	};
};
