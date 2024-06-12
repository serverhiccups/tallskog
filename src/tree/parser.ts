import { Tokeniser } from "./Tokeniser";
import { TreeNode, createTreeNode } from "./treeNode";
export const parse = (text: string): TreeNode[] => {
	const tokeniser = new Tokeniser(text);
	let trees: TreeNode[] = [];
	try {
		// return [parseTree(tokeniser)];
		while (tokeniser.has(PATTERNS.OPEN_SQUARE)) {
			trees.push(parseTree(tokeniser));
		}
	} catch (e) {}
	return trees;
};

const PATTERNS = {
	OPEN_SQUARE: /\[/,
	CLOSE_SQUARE: /\]/,
	LABEL_TEXT: /"([^"]+)"/,
};

const expect = (tok: Tokeniser, pattern: RegExp) => {
	if (!tok.next(pattern)) throw new Error(`Parser error, expected ${pattern}`);
};

const require = (tok: Tokeniser, pattern: RegExp): string => {
	let next = tok.next(pattern);
	if (!next) throw new Error(`Parser error, expected ${pattern}`);
	return next;
};

const parseTree = (tok: Tokeniser): TreeNode => {
	expect(tok, PATTERNS.OPEN_SQUARE);
	let label = require(tok, PATTERNS.LABEL_TEXT);
	let children: TreeNode[] = [];
	while (tok.has(PATTERNS.OPEN_SQUARE)) {
		children.push(parseTree(tok));
	}
	expect(tok, PATTERNS.CLOSE_SQUARE);
	return createTreeNode(label, children);
};
