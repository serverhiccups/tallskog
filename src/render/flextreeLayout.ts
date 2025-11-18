import { flextree, FlextreeNode } from "d3-flextree"
import { calculateTextBounds, RenderingContext2D, TRACK_HEIGHT } from "./render"
import { findNode, Forest, getTreeRoot, isMarkerLeftOfNode, makeTNode, NodeId, TNode, Tree, TreeInsertionPosition } from "../tree/forest"
import { buildLayoutNodeQueryStructure, Layout, LayoutAlgorithm, LayoutNode, LayoutTree } from "./layout";

export class FlexTreeLayout implements LayoutAlgorithm {
	layoutForest(ctx: RenderingContext2D, forest: Forest, stubId: string | undefined, highlighted: string[]): Layout {
		// Calculate arrow types
		const fillerPositions = forest.arrows.flatMap((arrow) => {
			const start = findNode(forest, arrow.start);
			const end = findNode(forest, arrow.end);
			if (start === undefined || end === undefined) throw new Error("could not find arrow head");
			return [
				this.determineFillerPosition(forest, start, end),
				this.determineFillerPosition(forest, end, start),
			]
		})

		// Layout indidual trees
		let trees = forest.trees.map((t) => this.treeLayout(ctx, t, stubId, highlighted, fillerPositions));
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

	private determineFillerPosition(forest: Forest, node: TNode, otherEnd: TNode): TreeInsertionPosition {
		// If a node does not have any children, the arrow can approach from the bottom, ie. its filler is a child to the node
		if (node.children.length == 0) {
			return { parent: node.id, index: 0 }
		} else {
			// If the marker is the root, you should place the filler as the rightmost or leftmost child of the root
			if (node.parent === undefined) {
				if (isMarkerLeftOfNode(forest, otherEnd.id, node.id)) {
					return { parent: node.id, index: 0 };
				} else {
					return { parent: node.id, index: node.children.length }
				}
			}
			// If the end of the arrow is to the left of the start, the start filler needs to be to the left of the start
			const startParent = findNode(forest, node.parent);
			if (startParent === undefined) throw new Error("Arg!");
			if (isMarkerLeftOfNode(forest, otherEnd.id, node.id)) {
				return { parent: node.parent, index: startParent.children.findIndex((i) => i === node.id) };
			} else { // The end of the arrow is to the right of the start, the filler need to be to the right of the start
				return { parent: node.parent, index: startParent.children.findIndex((i) => i === node.id) + 1 };
			}
		}
	}

	private makeLayoutNode(ctx: RenderingContext2D, ftNode: FlextreeNode<TNode>, parent: LayoutNode | undefined, stubId: string | undefined, highlighted: string[]): LayoutNode {
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
			height: node.id.startsWith("filler-") ? ftNode.ySize : metrics.height,
			children: [],
		};
		if (node.id === stubId) return { ...l, nodeId: "stub", label: "" };

		l.children = (ftNode.children ?? []).map((c) => {
			return this.makeLayoutNode(ctx, c, l, stubId, highlighted);
		})

		return l;
	}

	private treeLayout(ctx: RenderingContext2D, tree: Tree, stubId: string | undefined, highlighted: string[], fillerPositions: TreeInsertionPosition[]): LayoutTree {
		const ft = flextree<TNode>({
			children: (data) => {
				const fillerIndexes = Array.from(new Set(fillerPositions.filter((p) => p.parent === data.id).map((f) => f.index))).sort();
				const children = data.children.map((c: NodeId) => tree.nodes.get(c)!);
				if (fillerIndexes.length > 0) {
					for (let i = 0; i < fillerIndexes.length; i++) {
						children.splice(fillerIndexes[i] + i, 0, makeTNode(
							"",
							data.id,
							[],
							undefined,
							`filler-${i}-${data.id}`
						));
					}
				}
				return children;
			},
			nodeSize: (node) => {
				if (node.data.id.startsWith("filler-")) return [16.0, 250.0] as const; // TODO: calculate the actual height needed
				const metrics = calculateTextBounds(ctx, node.data.label);
				return [metrics.width, 1.0] as const
			},
			spacing: (node, otherNode) => {
				if (node.data.id.startsWith("filler-") || otherNode.data.id.startsWith("filler-")) return 0.0;
				return 24.0;
			}
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
