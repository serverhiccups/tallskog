import { findNode, Forest, getTreeRoot, makeTNode, makeTree, NodeId, TArrow, TNode, Tree } from "./forest";
import { Tokeniser } from "./Tokeniser";

const PATTERNS = {
	OPEN_SQUARE: /\[/,
	CLOSE_SQUARE: /\]/,
	OPEN_ANGLE: /\</,
	CLOSE_ANGLE: /\>/,
	LABEL_TEXT: /"([^"]*)"/,
	NODE_NUMBER: /(\d)+/
};

export const parse = (text: string): Forest => {
	const tokeniser = new Tokeniser(text);

	const targetIds: Map<number, NodeId> = new Map();

	let forest: Forest = { trees: [], arrows: [] };

	while (tokeniser.has(PATTERNS.OPEN_SQUARE)) {
		const tree = makeTree();
		parseTree(tokeniser, tree);
		forest.trees.push(tree);
	}

	forest.trees.map((t) => t.nodes).flatMap((m) => [...m.values()]).forEach((n) => {
		if (n.numericalLabel == undefined) return;
		if (targetIds.has(n.numericalLabel)) throw new Error("Parser error, duplicate node id");
		targetIds.set(n.numericalLabel, n.id);
	})

	tokeniser.skipWhitespace();
	while (tokeniser.has(PATTERNS.OPEN_ANGLE)) {
		expect(tokeniser, PATTERNS.OPEN_ANGLE);

		const startNode = parseInt(require(tokeniser, PATTERNS.NODE_NUMBER));
		const endNode = parseInt(require(tokeniser, PATTERNS.NODE_NUMBER));

		if (!targetIds.has(startNode) || !targetIds.has(endNode)) throw new Error("Parser error, arrow points to undefined node");
		//@ts-ignore
		forest.arrows.push({ start: targetIds.get(startNode), end: targetIds.get(endNode), label: "" });

		expect(tokeniser, PATTERNS.CLOSE_ANGLE);
	}
	if (tokeniser.hasNext()) throw new Error("trailing input");
	return forest;
};

const expect = (tok: Tokeniser, pattern: RegExp) => {
	if (!tok.next(pattern)) throw new Error(`Parser error, expected ${pattern}`);
};

const require = (tok: Tokeniser, pattern: RegExp, captureGroup?: number): string => {
	let next = tok.next(pattern, captureGroup);
	if (!next) throw new Error(`Parser error, expected ${pattern}`);
	return next;
};

const parseTree = (tok: Tokeniser, tree: Tree, parent?: NodeId): NodeId => {
	expect(tok, PATTERNS.OPEN_SQUARE);
	let nodeNumber = tok.has(PATTERNS.NODE_NUMBER) ? parseInt(tok.next(PATTERNS.NODE_NUMBER) ?? "") : undefined;
	if (tok.has(PATTERNS.CLOSE_SQUARE)) {
		tok.next(PATTERNS.CLOSE_SQUARE);
		let node = makeTNode("∅", parent, undefined, nodeNumber);
		if (tree.nodes.size == 0) tree.rootId = node.id; // If this is the first node, it must be the root of the tree
		tree.nodes.set(node.id, node);
		return node.id;
	}

	let label = require(tok, PATTERNS.LABEL_TEXT, 1);
	let children: NodeId[] = [];
	let me = makeTNode(label, parent, children, nodeNumber);

	if (tree.nodes.size == 0) tree.rootId = me.id; // If this is the first node, it must be the root of the tree
	tree.nodes.set(me.id, me);

	while (tok.has(PATTERNS.OPEN_SQUARE)) {
		children.push(parseTree(tok, tree, me.id));
	}
	expect(tok, PATTERNS.CLOSE_SQUARE);
	return me.id;
};

export const unparse = (forest: Forest): string => {
	return forest.trees.map((t) => unparseNode(t, getTreeRoot(t))).join("\n") + "\n" +
		forest.arrows.map((a) => unparseArrow(forest, a)).join("\n");
};

const unparseNode = (tree: Tree, node: TNode): string => {
	// if (node.label == "") return "[]";
	return `[${node.numericalLabel !== undefined ? node.numericalLabel + " " : ""}"${node.label}"${node.children.length > 0 ? " " : ""}${node.children.map((c) => tree.nodes.get(c)!)
		.map((c) => unparseNode(tree, c))
		.join("")}]`;
};

const unparseArrow = (forest: Forest, arrow: TArrow): string => {
	return `<${findNode(forest, arrow.start)?.numericalLabel} ${findNode(forest, arrow.end)?.numericalLabel}>`;
}