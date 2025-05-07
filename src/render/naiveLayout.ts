import {
	calculateTextBounds,
	TRACK_HEIGHT,
	CHILD_PADDING,
	RenderingContext2D,
} from "./render";
import {
	LayoutTree,
	LayoutAlgorithm,
	LayoutNode,
	buildLayoutNodeQueryStructure,
	Layout,

} from "./layout";
import { Forest, getTreeRoot, NodeId, TNode, Tree } from "../tree/forest";

export class NaiveLayout implements LayoutAlgorithm {
	layoutForest(ctx: RenderingContext2D, forest: Forest, stubId: string | undefined, highlighted: string[]): Layout {
		let trees = forest.trees.map((t) => this.layoutTree(ctx, t, stubId, highlighted));
		let edge = 36.0;
		trees = trees.map((t) => {
			const v = { ...t, entryX: edge + t.width / 2.0, entryY: TRACK_HEIGHT };
			edge += t.width + 36.0;
			return v;
		});
		return {
			trees
		}
	}
	layoutTree(
		ctx: RenderingContext2D,
		tree: Tree,
		stubId: string | undefined,
		highlighted: string[]
	): LayoutTree {
		const lt = layout(
			ctx,
			tree,
			getTreeRoot(tree),
			stubId,
			highlighted,
			getTreeRoot(tree).id,
			undefined,
			0,
			0,
			0,
			0
		);
		const width = calculateTreeNodeWidth(ctx, getTreeRoot(tree), tree);
		return {
			width: width,
			height: 0, // TODO: calculate,
			entryX: 0,
			entryY: 0,
			root: lt,
			query: buildLayoutNodeQueryStructure(lt),
		};
	}
}

const layout = (
	ctx: RenderingContext2D,
	tree: Tree,
	current: TNode,
	stubId: string | undefined,
	highlighted: string[],
	rootTreeNodeId: NodeId,
	parent: LayoutNode | undefined,
	x: number,
	y: number,
	parentAbX: number,
	parentAbY: number
): LayoutNode => {
	let labelMetrics = calculateTextBounds(ctx, current.label);
	let l: LayoutNode = {
		label: current.label,
		highlighted: highlighted.includes(current.id),
		nodeId: current.id,
		rootNodeId: rootTreeNodeId,
		parent: parent,
		x: x,
		y: y,
		absoluteX: parentAbX,
		absoluteY: parentAbY,
		width: labelMetrics.width,
		height: labelMetrics.height,
		children: [],
	};
	if (current.id === stubId) return { ...l, nodeId: "stub", label: "" };
	let childrenWidth = calculateChildrenWidth(ctx, current.children.map((c) => tree.nodes.get(c)!), tree);
	let edge = -childrenWidth / 2.0;
	for (let child of current.children) {
		const childWidth = calculateTreeNodeWidth(ctx, tree.nodes.get(child)!, tree);
		const childCenterX = edge + childWidth / 2.0;
		l.children.push(
			layout(
				ctx,
				tree,
				tree.nodes.get(child)!,
				stubId,
				highlighted,
				rootTreeNodeId,
				l,
				childCenterX,
				TRACK_HEIGHT,
				parentAbX + childCenterX,
				parentAbY + TRACK_HEIGHT
			)
		);
		edge += childWidth + CHILD_PADDING;
	}
	return l;
};

/**
 * @returns The combined width of the child nodes
 */
const calculateTreeNodeWidth = (
	ctx: RenderingContext2D,
	node: TNode,
	tree: Tree
): number => {
	if (node.children.length == 0) return calculateTextBounds(ctx, node.label).width;
	return Math.max(
		calculateTextBounds(ctx, node.label).width,
		calculateChildrenWidth(ctx, node.children.map((c) => tree.nodes.get(c)!), tree,)
	);
};

const calculateChildrenWidth = (
	ctx: RenderingContext2D,
	children: readonly TNode[],
	tree: Tree
): number => {
	return Math.max(
		0,
		children
			.map((n) => calculateTreeNodeWidth(ctx, n, tree))
			.reduce((a, b) => a + b, 0) +
		(children.length - 1) * CHILD_PADDING
	);
};
