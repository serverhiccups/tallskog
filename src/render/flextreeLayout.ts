import { flextree, FlextreeNode } from "d3-flextree"
import { calculateTextBounds, RenderingContext2D, TRACK_HEIGHT } from "./render"
import { findNode, Forest, getTreeRoot, isMarkerLeftOfNode, makeTNode, NodeId, TArrow, TNode, Tree, TreeInsertionPosition } from "../tree/forest"
import { buildLayoutNodeQueryStructure, ControlPoint, Layout, LayoutAlgorithm, LayoutArrow, LayoutNode, LayoutTree } from "./layout";
import { interpolatePoints } from "./catmullRom";

interface ArrowFiller {
	arrowId: string;
	insertionPosition: TreeInsertionPosition;
}

export class FlexTreeLayout implements LayoutAlgorithm {
	layoutForest(ctx: RenderingContext2D, forest: Forest, stubId: string | undefined, highlighted: string[]): Layout {
		// Calculate arrow types
		const fillerPositions: ArrowFiller[] = forest.arrows.flatMap((arrow) => {
			const start = findNode(forest, arrow.start);
			const end = findNode(forest, arrow.end);
			if (start === undefined || end === undefined) throw new Error("could not find arrow head");
			return [
				{
					arrowId: arrow.id,
					insertionPosition: this.determineFillerPosition(forest, start, end),
				},
				{
					arrowId: arrow.id,
					insertionPosition: this.determineFillerPosition(forest, end, start),
				}
			]
		})

		// Layout indidual trees
		const arrowFillerMap: Map<NodeId, NodeId[]> = new Map();
		let trees = forest.trees.map((t) => this.treeLayout(ctx, t, stubId, highlighted, fillerPositions, arrowFillerMap));
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
			arrows: this.layoutArrows(ctx, trees, forest.arrows, arrowFillerMap)
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
			// If the end of the arrow is to the left of the start, the start filler needs to be to the leftmost child of the start
			// const startParent = findNode(forest, node.parent);
			// if (startParent === undefined) throw new Error("Arg!");
			if (isMarkerLeftOfNode(forest, otherEnd.id, node.id)) {
				return { parent: node.id, index: 0 };
			} else { // The end of the arrow is to the right of the start, the filler need to be to the right of the start
				return { parent: node.id, index: node.children.length }
				// return { parent: node.parent, index: startParent.children.findIndex((i) => i === node.id) + 1 };
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

	private treeLayout(ctx: RenderingContext2D, tree: Tree, stubId: string | undefined, highlighted: string[], fillerPositions: ArrowFiller[], arrowFillerMap: Map<NodeId, NodeId[]>): LayoutTree {
		const ft = flextree<TNode>({
			children: (data) => {
				// [filler index, accompany arrow ids]
				const fillerIndexes: [number, NodeId[]][] = [...fillerPositions.filter((p) => p.insertionPosition.parent == data.id).reduce((map, p) => {
					if (!map.has(p.insertionPosition.index)) map.set(p.insertionPosition.index, []);
					map.get(p.insertionPosition.index).push(p.arrowId);
					return map;
				}, new Map())];
				const children = data.children.map((c: NodeId) => tree.nodes.get(c)!);
				if (fillerIndexes.length > 0) {
					for (let i = 0; i < fillerIndexes.length; i++) {
						const fillerNode =
							makeTNode(
								"",
								data.id,
								[],
								undefined,
								`filler-${i}-${data.id}`
							);
						children.splice(fillerIndexes[i][0] + i, 0, fillerNode);
						fillerIndexes[i][1].forEach((arrowId) => {
							if (!arrowFillerMap.has(arrowId)) arrowFillerMap.set(arrowId, []);
							arrowFillerMap.get(arrowId)!.push(fillerNode.id)
						});
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

	private layoutArrows(ctx: RenderingContext2D, trees: LayoutTree[], arrows: TArrow[], arrowFillerMap: Map<NodeId, NodeId[]>): LayoutArrow[] {
		return arrows.map((a) => {
			const startLayoutNode = trees.flatMap((t) => t.query.nodes).find((n) => n.nodeId === a.start);
			const endLayoutNode = trees.flatMap((t) => t.query.nodes).find((n) => n.nodeId === a.end);
			if (startLayoutNode === undefined || endLayoutNode == undefined) return;

			const startLayoutNodeRoot = trees.find((t) => t.root.nodeId == startLayoutNode.rootNodeId);
			const endLayoutNodeRoot = trees.find((t) => t.root.nodeId == endLayoutNode.rootNodeId);
			if (startLayoutNodeRoot === undefined || endLayoutNodeRoot == undefined) return;
			if (startLayoutNodeRoot !== endLayoutNodeRoot) return; // TODO: Layout arrows between different trees

			// Get the nodes between the two nodes
			const leftNodeX = Math.min(startLayoutNode.absoluteX + startLayoutNodeRoot.entryX, endLayoutNode.absoluteX + endLayoutNodeRoot.entryX);
			const rightNodeX = Math.max(startLayoutNode.absoluteX + startLayoutNodeRoot.entryX, endLayoutNode.absoluteX + endLayoutNodeRoot.entryX);
			// Find fillers for this arrow
			const fillers = trees.flatMap((t) => t.query.nodes).filter((n) => arrowFillerMap.get(a.id)?.includes(n.nodeId));
			if (fillers.length !== 2) throw new Error("arrow did not have exactly two fillers");
			let leftFiller, rightFiller;
			if (fillers[0].absoluteX < fillers[1].absoluteX) {
				leftFiller = fillers[0];
				rightFiller = fillers[1];
			} else {
				leftFiller = fillers[1];
				rightFiller = fillers[0];
			}

			const leftFillerRoot = trees.find((t) => t.root.nodeId == leftFiller.rootNodeId)!;
			const rightFillerRoot = trees.find((t) => t.root.nodeId == rightFiller.rootNodeId)!;
			const leftFillerPosition: ControlPoint = {
				x: leftFiller.absoluteX + leftFillerRoot.entryX,
				y: leftFiller.absoluteY + leftFillerRoot.entryY
			}
			const rightFillerPosition = {
				x: rightFiller.absoluteX + rightFillerRoot.entryX,
				y: rightFiller.absoluteY + rightFillerRoot.entryY
			}

			// Box boundaries
			const obstacles = startLayoutNodeRoot.query.nodes
				.filter((n) => {
					const pos = n.absoluteY + startLayoutNodeRoot.entryY;
					return pos >= Math.min(startLayoutNode.absoluteY + startLayoutNodeRoot.entryY, endLayoutNode.absoluteY + startLayoutNodeRoot.entryY)
				})
				.filter((n) => {
					const pos = n.absoluteX + startLayoutNodeRoot.entryX;
					return pos >= leftFillerPosition.x && pos <= rightFillerPosition.x;
				});
			const lowestPoint = obstacles.reduce((max, current) =>
				current.absoluteY > max.absoluteY ? current : max
			);
			const lowestPointY = lowestPoint.absoluteY + trees.find((t) => t.root.nodeId === lowestPoint.rootNodeId)!.entryY + 10;

			// const points = ([
			const points = interpolatePoints([
				{
					x: startLayoutNode.absoluteX + startLayoutNodeRoot.entryX,
					y: startLayoutNode.absoluteY + startLayoutNodeRoot.entryY + 10,
				},
				{
					x: leftFillerPosition.x,
					y: leftFillerPosition.y
				},
				{
					x: leftFillerPosition.x,
					y: lowestPointY,
				},
				{
					x: rightFillerPosition.x,
					y: lowestPointY
				},
				{
					x: rightFillerPosition.x,
					y: rightFillerPosition.y
				},
				{
					x: endLayoutNode.absoluteX + endLayoutNodeRoot.entryX,
					y: endLayoutNode.absoluteY + endLayoutNodeRoot.entryY + 10,
				}
			]);
			return {
				controlPoints: points,
				label: ""
			}
		}).filter((x) => x !== undefined);
	}
}
