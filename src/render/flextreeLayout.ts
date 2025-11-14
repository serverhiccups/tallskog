import { flextree, FlextreeNode } from "d3-flextree"
import { calculateTextBounds, RenderingContext2D, TRACK_HEIGHT } from "./render"
import { Forest, getTreeRoot, NodeId, TNode, Tree } from "../tree/forest"
import { buildLayoutNodeQueryStructure, Layout, LayoutAlgorithm, LayoutNode, LayoutTree } from "./layout";

export class FlexTreeLayout implements LayoutAlgorithm {
	layoutForest(ctx: RenderingContext2D, forest: Forest, stubId: string | undefined, highlighted: string[]): Layout {
		// Layout indidual trees
		let trees = forest.trees.map((t) => this.treeLayout(ctx, t, stubId, highlighted));
		// Put the trees next to each other
		let edge = 36.0;
		trees = trees.map((t) => {
			const v = { ...t, entryX: t.entryX + edge, };
			edge += t.width + 36.0;
			return v;
		});
		// Calculate arrow positions
		return {
			trees,
			arrows: []
		}
	}

	private makeLayoutNode(ctx: RenderingContext2D, ftNode: FlextreeNode<TNode>, parent?: LayoutNode, stubId: string | undefined, highlighted: string[]): LayoutNode {
		const node: TNode = ftNode.data;
		const rootNode = ftNode.root?.data;
		if (rootNode === undefined) throw new Error("no root?");

		const metrics = calculateTextBounds(ctx, node.label);

		let l: LayoutNode = {
			label: node.label,
			highlighted: highlighted.includes(node.id),
			nodeId: node.id,
			rootNodeId: rootNode.id,
			parent: parent,
			absoluteX: ftNode.x,
			absoluteY: (ftNode.y + 1) * TRACK_HEIGHT,
			width: ftNode.xSize,
			height: metrics.height,
			children: [],
		};
		if (node.id === stubId) return { ...l, nodeId: "stub", label: "" };

		l.children = (ftNode.children ?? []).map((c) => {
			return this.makeLayoutNode(ctx, c, l, stubId, highlighted);
		})

		return l;
	}

	private treeLayout(ctx: RenderingContext2D, tree: Tree, stubId: string | undefined, highlighted: string[]): LayoutTree {
		const ft = flextree<TNode>({
			children: (data) => data.children.map((c: NodeId) => tree.nodes.get(c)!),
			nodeSize: (node) => {
				const metrics = calculateTextBounds(ctx, node.data.label);
				return [metrics.width, 1.0] as [number, number]
			},
			spacing: 16.0
		});
		const hierarchy = ft.hierarchy(getTreeRoot(tree));
		ft(hierarchy);
		const rootLayoutNode = this.makeLayoutNode(ctx, hierarchy, undefined, stubId, highlighted);

		return {
			width: hierarchy.extents.right - hierarchy.extents.left,
			height: (hierarchy.extents.top - hierarchy.extents.bottom) * TRACK_HEIGHT, // TODO: check if correct,
			entryX: -1 * hierarchy.extents.left,
			entryY: 0,
			root: rootLayoutNode,
			query: buildLayoutNodeQueryStructure(rootLayoutNode),
		};
	}
}
