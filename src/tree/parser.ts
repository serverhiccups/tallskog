import { Tokeniser } from "./Tokeniser";
import { TreeNode, createTreeNode } from "./treeNode";
export const parse = (text: string): TreeNode[] => {
	const tokeniser = new Tokeniser(text);
	let trees: TreeNode[] = [];
	while (tokeniser.has(PATTERNS.OPEN_SQUARE)) {
		trees.push(parseTree(tokeniser, undefined));
	}
	tokeniser.skipWhitespace();
	if (tokeniser.hasNext()) throw new Error("trailing input");
	return trees;
};

const PATTERNS = {
	OPEN_SQUARE: /\[/,
	CLOSE_SQUARE: /\]/,
	LABEL_TEXT: /"([^"]*)"/,
};

const expect = (tok: Tokeniser, pattern: RegExp) => {
	if (!tok.next(pattern)) throw new Error(`Parser error, expected ${pattern}`);
};

const require = (tok: Tokeniser, pattern: RegExp): string => {
	let next = tok.next(pattern);
	if (!next) throw new Error(`Parser error, expected ${pattern}`);
	return next;
};

const parseTree = (tok: Tokeniser, parent: TreeNode | undefined): TreeNode => {
	expect(tok, PATTERNS.OPEN_SQUARE);
	if (tok.has(PATTERNS.CLOSE_SQUARE)) {
		tok.next(PATTERNS.CLOSE_SQUARE);
		return createTreeNode("", parent, []);
	}
	let label = require(tok, PATTERNS.LABEL_TEXT);
	let children: TreeNode[] = [];
	let me = createTreeNode(label, parent, children);
	while (tok.has(PATTERNS.OPEN_SQUARE)) {
		children.push(parseTree(tok, me));
	}
	expect(tok, PATTERNS.CLOSE_SQUARE);
	return me;
};

export const unparse = (forest: TreeNode[]): string => {
	return forest.map(unparseNode).join("\n");
};

const unparseNode = (node: TreeNode): string => {
	if (node.label == "") return "[]";
	return `["${node.label}"${node.children.length > 0 ? " " : ""}${node.children
		.map(unparseNode)
		.join("")}]`;
};
