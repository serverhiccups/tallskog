import { Forest, getTreeRoot, makeTNode, makeTree, NodeId, TNode, Tree } from "./forest";
import { Tokeniser } from "./Tokeniser";

const PATTERNS = {
	OPEN_SQUARE: /\[/,
	CLOSE_SQUARE: /\]/,
	LABEL_TEXT: /"([^"]*)"/,
};

export const parse = (text: string): Forest => {
	const tokeniser = new Tokeniser(text);
	let forest: Forest = { trees: [] };
	while (tokeniser.has(PATTERNS.OPEN_SQUARE)) {
		const tree = makeTree();
		parseTree(tokeniser, tree);
		forest.trees.push(tree);
	}
	tokeniser.skipWhitespace();
	if (tokeniser.hasNext()) throw new Error("trailing input");
	// console.log("forest:", forest)
	return forest;
};

const expect = (tok: Tokeniser, pattern: RegExp) => {
	if (!tok.next(pattern)) throw new Error(`Parser error, expected ${pattern}`);
};

const require = (tok: Tokeniser, pattern: RegExp): string => {
	let next = tok.next(pattern);
	if (!next) throw new Error(`Parser error, expected ${pattern}`);
	return next;
};

const parseTree = (tok: Tokeniser, tree: Tree, parent?: NodeId): NodeId => {
	expect(tok, PATTERNS.OPEN_SQUARE);
	if (tok.has(PATTERNS.CLOSE_SQUARE)) {
		tok.next(PATTERNS.CLOSE_SQUARE);
		let node = makeTNode("∅", parent);
		if (tree.nodes.size == 0) tree.rootId = node.id; // If this is the first node, it must be the root of the tree
		tree.nodes.set(node.id, node);
		return node.id;
	}

	let label = require(tok, PATTERNS.LABEL_TEXT);
	let children: NodeId[] = [];
	let me = makeTNode(label, parent, children);

	if (tree.nodes.size == 0) tree.rootId = me.id; // If this is the first node, it must be the root of the tree
	tree.nodes.set(me.id, me);

	while (tok.has(PATTERNS.OPEN_SQUARE)) {
		children.push(parseTree(tok, tree, me.id));
	}
	expect(tok, PATTERNS.CLOSE_SQUARE);
	return me.id;
};

export const unparse = (forest: Forest): string => {
	return forest.trees.map((t) => unparseNode(t, getTreeRoot(t))).join("\n");
};

const unparseNode = (tree: Tree, node: TNode): string => {
	if (node.label == "") return "[]";
	return `["${node.label}"${node.children.length > 0 ? " " : ""}${node.children.map((c) => tree.nodes.get(c)!)
		.map((c) => unparseNode(tree, c))
		.join("")}]`;
};
