import { useMemo } from "preact/hooks";
import { LABEL_PADDING, RenderingContext2D } from "./render";
import { Forest, NodeId, TreeInsertionPosition } from "../tree/forest";

export interface Layout {
	trees: LayoutTree[];
	arrows: LayoutArrow[];
}

export interface LayoutTree {
	width: number;
	height: number;
	entryX: number;
	entryY: number;
	root: LayoutNode;
	query: LayoutNodeQueryStructure;
}

export interface LayoutArrow {
	controlPoints: ControlPoint[]
	label: string;
}

export interface ControlPoint {
	x: number;
	y: number;
}

interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface LayoutAlgorithm {
	layoutForest(
		ctx: RenderingContext2D,
		forest: Forest,
		stubId: string | undefined,
		highlighted: string[]
	): Layout;
}

export interface LayoutNode {
	label: string;
	highlighted: boolean;
	nodeId: NodeId;
	rootNodeId: NodeId;
	parent: LayoutNode | undefined;
	/* X is the baseline and Y is the centre */
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

const layoutNodetoRectBounds = (node: LayoutNode): Rect => {
	return {
		x: node.absoluteX - (node.width / 2.0) - (LABEL_PADDING / 2.0),
		y: node.absoluteY - node.height - (LABEL_PADDING / 2.0),
		w: node.width + LABEL_PADDING,
		h: node.height + LABEL_PADDING,
	}
}

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

const doLinesCollide = (line1Start: ControlPoint, line1End: ControlPoint, line2Start: ControlPoint, line2End: ControlPoint): boolean => {
	/* Adapted from https://jeffreythompson.org/collision-detection/line-rect.php */
	const x1 = line1Start.x;
	const y1 = line1Start.y;
	const x2 = line1End.x;
	const y2 = line1End.y;
	const x3 = line2Start.x;
	const y3 = line2Start.y;
	const x4 = line2End.x;
	const y4 = line2End.y;

	const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

	// Parallel lines (including collinear) → treat as not colliding
	if (denominator === 0) return false;

	const uA =
		((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;

	const uB =
		((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

	// Lines collide if intersection is within both segments
	return uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1;
}

export const doesLineCollideWithRect = (rect: Rect, cp1: ControlPoint, cp2: ControlPoint): boolean => {
	return (
		doLinesCollide(cp1, cp2, { x: rect.x, y: rect.y }, { x: rect.x, y: rect.y + rect.h }) ||
		doLinesCollide(cp1, cp2, { x: rect.x, y: rect.y }, { x: rect.x + rect.w, y: rect.y }) ||
		doLinesCollide(cp1, cp2, { x: rect.x, y: rect.y }, { x: rect.x + rect.w, y: rect.y + rect.h }) ||
		doLinesCollide(cp1, cp2, { x: rect.x, y: rect.y }, { x: rect.x, y: rect.y + rect.h })
	)
}

export const getLayoutNodeAt = (
	layout: Layout,
	x: number,
	y: number
): { node: LayoutNode; root: LayoutTree } | undefined => {
	if (x < 24.0) return;
	//TODO: very bad code, refactor
	for (const l of layout.trees) {
		const localX = x - l.entryX;
		const localY = y - l.entryY;

		if (localX < -l.width || localX > l.width) continue;
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
	layout: Layout,
	treeNodeId: string | undefined
): [LayoutNode, LayoutTree] | [undefined, undefined] => {
	return useMemo(() => {
		if (treeNodeId === undefined) return [undefined, undefined];
		for (const l of layout.trees) {
			const res = l.query.nodes.find((n) => n.nodeId == treeNodeId);
			if (res !== undefined) return [res, l];
		}
		return [undefined, undefined];
	}, [layout, treeNodeId]);
};

export const getInsertionPosition = (
	layout: Layout,
	x: number,
	y: number
): TreeInsertionPosition | undefined => {
	const closestLayout = layout.trees.reduce((a, b) =>
		Math.abs(a.entryX - x) < Math.abs(b.entryX - x) ? a : b
	);
	const nodesInBand = closestLayout.query.nodes
		.filter((n) => Math.abs(n.absoluteY + closestLayout.entryY - y) < 20)
		.filter((n) => n.nodeId !== "stub");
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
			parent: closestNode.nodeId,
			index: 0,
		};
	}
	const insertOnRight: boolean =
		closestNode.absoluteX + closestLayout.entryX < x;
	if (closestNode.parent === undefined) return undefined; // Cannot insert next to the root
	const index = closestNode.parent.children
		.filter((c) => c.nodeId !== "stub")
		.findIndex((c) => c.nodeId == closestNode.nodeId);
	if (index == -1) return undefined;
	return {
		parent: closestNode.parent.nodeId,
		index: index + (insertOnRight ? 1 : 0),
	};
};
