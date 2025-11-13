import {
	calculateTextBounds,
	TRACK_HEIGHT,
	CHILD_PADDING,
	RenderingContext2D,
	TextBounds
} from "./render";
import {
	LayoutTree,
	LayoutAlgorithm,
	LayoutNode,
	buildLayoutNodeQueryStructure,
	Layout,
	LayoutArrow,
} from "./layout";
import { Forest, getSiblings, getTreeRoot, NodeId, TNode, Tree } from "../tree/forest";

const MIN_SPACING = 16.0;

/**
 * Implementation of Buchheim et al's linear-time tidy tree layout algorithm.
 * Does not currently layout the arrows
 */

interface Contours {
	left: number[];
	right: number[];
}

export class CompactLayout implements LayoutAlgorithm {
	layoutForest(ctx: RenderingContext2D, forest: Forest, stubId: string | undefined, highlighted: string[]): Layout {
		// Layout indidual trees
		let trees = forest.trees.map((t) => this.treeLayout(ctx, t));
		// Put the trees next to each other
		let edge = 36.0;
		trees = trees.map((t) => {
			const v = { ...t, entryX: edge + t.width / 2.0, entryY: TRACK_HEIGHT };
			edge += t.width + 36.0;
			return v;
		});
		// Calculate arrow positions
		return {
			trees,
			arrows: []
		}
	}

	private treeLayout(ctx: RenderingContext2D, tree: Tree): LayoutTree {
		const metricsMemo: Map<NodeId, TextBounds> = new Map();
		const getNodeLabelMetrics = (node: NodeId): TextBounds => {
			if (metricsMemo.has(node)) return metricsMemo.get(node)!;
			const metrics = calculateTextBounds(ctx, tree.nodes.get(node)!.label);
			metricsMemo.set(node, metrics);
			return metrics;
		}

		const distanceBetweenCenters = (left: NodeId, right: NodeId): number => {
			return (getNodeLabelMetrics(left).width + getNodeLabelMetrics(right).width) / 2 + MIN_SPACING;
		}

		// Beginning of algorithm
		const mod: Map<NodeId, number> = new Map();
		const thread: Map<NodeId, NodeId> = new Map();
		const ancestor: Map<NodeId, NodeId> = new Map();
		const prelim: Map<NodeId, number> = new Map();

		const change: Map<NodeId, number> = new Map();
		const shift: Map<NodeId, number> = new Map();

		const contours: Map<NodeId, Contours> = new Map();

		for (const n of tree.nodes.values()) {
			mod.set(n.id, 0);
			// thread.set(n.id, 0); ????
			ancestor.set(n.id, n.id);
		}

		const getLeftSibling = (v: NodeId): NodeId | undefined => {
			const siblings = getSiblings(tree, v);
			const vIndex = siblings.findIndex((i) => i === v);
			if (vIndex == -1 || vIndex == 0) return undefined;
			return siblings[vIndex - 1];
		}

		// const nextLeft = (vId: NodeId | null): NodeId | null => {
		// 	if (vId === null) throw new Error("vId was null");
		// 	const v = tree.nodes.get(vId);
		// 	if (v === undefined) throw new Error("v was not found in the tree");
		// 	const vChildren = v.children;
		// 	if (vChildren.length > 0) { // if v has a child
		// 		return vChildren[0];
		// 	} else {
		// 		return thread.get(vId) ?? null;
		// 	}
		// }

		// const nextRight = (vId: NodeId | null): NodeId | null => {
		// 	if (vId === null) return null;
		// 	const v = tree.nodes.get(vId);
		// 	if (v === undefined) throw new Error("v was not found in the tree");
		// 	const vChildren = v.children;
		// 	if (vChildren.length > 0) { // if v has a child
		// 		return vChildren[vChildren.length - 1];
		// 	} else {
		// 		return thread.get(vId) ?? null;
		// 	}
		// }

		const next = (nodeId: NodeId | null, direction: "left" | "right", visited: Set<NodeId>): NodeId | null => {
			if (nodeId === null) return null;
			if (visited.has(nodeId)) return null; // prevent cycles
			visited.add(nodeId);

			const node = tree.nodes.get(nodeId);
			if (!node) return null;

			if (node.children.length > 0) {
				return direction === "left" ? node.children[0] : node.children[node.children.length - 1];
			}

			const t = thread.get(nodeId) ?? null;
			if (t && !visited.has(t)) return t;

			return null;
		}

		const moveSubtree = (w_minus: NodeId, w_plus: NodeId, shiftAmount: number) => {
			const minusSiblings = getSiblings(tree, w_minus);
			if (!minusSiblings.includes(w_plus)) throw new Error("w- and w+ are not siblings");
			const subtrees = minusSiblings.findIndex((i) => i === w_plus) - minusSiblings.findIndex((i) => i === w_minus);

			change.set(w_plus, (change.get(w_plus) ?? 0) - (shiftAmount / subtrees));
			shift.set(w_plus, (shift.get(w_plus) ?? 0) + shiftAmount)

			change.set(w_minus, (change.get(w_minus) ?? 0) + (shiftAmount / subtrees));

			// prelim.set(w_plus, (prelim.get(w_plus) ?? 0) + shiftAmount)
			// mod.set(w_plus, (mod.get(w_plus) ?? 0) + shiftAmount)
		}

		const distinctAncestor = (v_i_minus: NodeId, v: NodeId, defaultAncestor: NodeId): NodeId => {
			const vSiblings = getSiblings(tree, v);
			if (vSiblings.includes(v_i_minus)) {
				return ancestor.get(v_i_minus)!;
			}
			return defaultAncestor;
		}

		const executeShifts = (vId: NodeId) => {
			let shift_acc = 0;
			let change_acc = 0;
			for (const w of tree.nodes.get(vId)!.children) {
				prelim.set(w, (prelim.get(w) ?? 0) + shift_acc);
				mod.set(w, (mod.get(w) ?? 0) + shift_acc);
				change_acc += change.get(w) ?? 0;
				shift_acc += (shift.get(w) ?? 0) + change_acc;
			}
		}

		const apportion = (vId: NodeId, defaultAncestor: NodeId) => {
			const w = getLeftSibling(vId);
			if (w !== undefined) { // if node v has left sibling w
				const visitedLeft: Set<NodeId> = new Set();
				const visitedRight: Set<NodeId> = new Set();

				const nextLeft = (nodeId: NodeId | null): NodeId | null => {
					return next(nodeId, "left", new Set());
				}

				const nextRight = (nodeId: NodeId | null): NodeId | null => {
					return next(nodeId, "right", new Set());
				}

				let v_i_plus: NodeId = vId;
				let v_o_plus: NodeId = vId;
				let v_i_minus: NodeId = w;
				let v_o_minus: NodeId = getSiblings(tree, v_i_plus)[0];

				let s_i_plus = mod.get(v_i_plus)!;
				let s_o_plus = mod.get(v_o_plus)!;
				let s_i_minus = mod.get(v_i_minus)!;
				let s_o_minus = mod.get(v_o_minus)!;

				let right = nextRight(v_i_minus);
				let left = nextLeft(v_i_plus);

				while (left !== null && right !== null) {
					v_i_minus = right;
					v_i_plus = left;
					v_o_minus = nextLeft(v_o_minus) ?? v_o_minus;
					v_o_plus = nextRight(v_o_plus) ?? v_o_plus;

					ancestor.set(v_o_plus, vId);

					const leftContour = contours.get(v_i_minus)?.right;
					const rightContour = contours.get(v_i_plus)?.left;
					if (!leftContour || !rightContour) break;

					const maxDepth = Math.min(leftContour.length, rightContour.length);

					let shiftAmount = -Infinity;
					for (let d = 0; d < maxDepth; d++) {
						const leftEdge = leftContour[d] + s_i_minus;
						const rightEdge = rightContour[d] + s_i_plus;
						shiftAmount = Math.max(shiftAmount, leftEdge - rightEdge + MIN_SPACING);
					}

					if (shiftAmount > 0 && isFinite(shiftAmount)) {
						moveSubtree(distinctAncestor(v_i_minus, vId, defaultAncestor), vId, shiftAmount)
						s_i_plus += shiftAmount;
						s_o_plus += shiftAmount;
					}

					s_i_minus += mod.get(v_i_minus)!;
					s_i_plus += mod.get(v_i_plus)!;
					s_o_minus += mod.get(v_o_minus)!;
					s_o_plus += mod.get(v_o_plus)!;

					right = nextRight(v_i_minus);
					left = nextLeft(v_i_plus);
				}
				if (right !== null && nextRight(v_o_plus) === null) {
					thread.set(v_o_plus, right);
					mod.set(v_o_plus, mod.get(v_o_plus)! + s_i_minus - s_o_plus);
				}
				if (left !== null && nextLeft(v_o_minus) === null) {
					thread.set(v_o_minus, left);
					mod.set(v_o_minus, mod.get(v_o_minus)! + s_i_plus - s_o_minus);
					defaultAncestor = vId;
				}
			}
		}

		const firstWalk = (vId: NodeId) => {
			const v = tree.nodes.get(vId);
			if (v === undefined) throw new Error("tried to traverse node that doesn't exist " + vId);
			if (v.children.length == 0) { // if node is a leaf
				prelim.set(v.id, 0);
				const w = getLeftSibling(v.id);
				if (w !== undefined) {
					const p = prelim.get(w)! + distanceBetweenCenters(w, v.id);
					prelim.set(v.id, p);
				} else {
					prelim.set(v.id, 0);
				}

				const width = getNodeLabelMetrics(v.id).width;
				contours.set(v.id, {
					left: [-width / 2],
					right: [width / 2]
				});
			} else {
				const defaultAncestor = v.children[0];
				for (const w of v.children) {
					firstWalk(w);
					apportion(w, defaultAncestor);
				}
				executeShifts(v.id);
				// let midpoint = (1 / 2) * (prelim.get(v.children[0])! + prelim.get(v.children[v.children.length - 1])!);
				const firstPrelim = prelim.get(v.children[0])!;
				const lastPrelim = prelim.get(v.children[v.children.length - 1])!;
				let midpoint = 0.5 * (firstPrelim + lastPrelim);


				const w = getLeftSibling(v.id);
				if (w !== undefined) {
					prelim.set(v.id, prelim.get(w)! + distanceBetweenCenters(w, v.id));
					mod.set(v.id, prelim.get(v.id)! - midpoint);
				} else {
					prelim.set(v.id, midpoint);
				}

				// compute contours for this node
				const width = getNodeLabelMetrics(v.id).width;
				// const leftContour: number[] = [prelim.get(v.id)! - width / 2];
				// const rightContour: number[] = [prelim.get(v.id)! + width / 2];
				const leftContour: number[] = [-width / 2];
				const rightContour: number[] = [width / 2];

				for (const child of v.children) {
					const childContours = contours.get(child)!;
					for (let depth = 0; depth < childContours.left.length; depth++) {
						// Ensure the parent contour array has a slot at this depth
						if (leftContour[depth + 1] === undefined) leftContour[depth + 1] = Infinity;
						if (rightContour[depth + 1] === undefined) rightContour[depth + 1] = -Infinity;

						// Add the child’s prelim to position the child correctly
						leftContour[depth + 1] = Math.min(
							leftContour[depth + 1],
							childContours.left[depth] + prelim.get(child)!
						);
						rightContour[depth + 1] = Math.max(
							rightContour[depth + 1],
							childContours.right[depth] + prelim.get(child)!
						);
					}

				}

				contours.set(v.id, { left: leftContour, right: rightContour });
			}

		}

		// Perform work
		const root = getTreeRoot(tree);
		firstWalk(root.id);

		const secondWalk = (v: TNode, m: number, depth: number, parent?: LayoutNode): LayoutNode => {
			const x = prelim.get(v.id)! + m;
			const y = depth * TRACK_HEIGHT;
			const layoutChildren: LayoutNode[] = [];

			const offsetX = parent ? x - parent.absoluteX : x;
			const offsetY = parent ? y - parent.absoluteY : y;

			const metrics = getNodeLabelMetrics(v.id);

			let node: LayoutNode = {
				label: v.label,
				highlighted: false,
				nodeId: v.id,
				rootNodeId: root.id,
				parent: parent,
				x: offsetX,
				y: offsetY,
				absoluteX: x,
				absoluteY: y,
				width: metrics.width,
				height: metrics.height,
				children: layoutChildren
			}

			for (const child of v.children) {
				layoutChildren.push(secondWalk(tree.nodes.get(child)!, m + mod.get(child)!, depth + 1, node));
			}

			return node;
		}


		const rootPrelim = prelim.get(root.id);
		if (rootPrelim === undefined) throw new Error("oh noes");

		const layoutRootNode = secondWalk(root, -1 * rootPrelim, 0);

		const rootContours = contours.get(root.id)!;
		const leftMost = Math.min(...rootContours.left.filter((i) => !Number.isNaN(i)));
		const rightMost = Math.max(...rootContours.right.filter((i) => !Number.isNaN(i)));
		const totalWidth = rightMost - leftMost;

		const entryX = rightMost - layoutRootNode.absoluteX;

		return {
			width: totalWidth,
			height: 0, // TODO: calculate
			// entryX: entryX,
			// entryY: TRACK_HEIGHT,
			entryX: 0,
			entryY: 0,
			root: layoutRootNode,
			query: buildLayoutNodeQueryStructure(layoutRootNode)
		}
	}
}
