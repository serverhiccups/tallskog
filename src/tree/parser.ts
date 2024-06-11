import { Tokeniser } from "./Tokeniser";
import { TreeNode, createTreeNode } from "./treeNode";
export const parse = (text: string): TreeNode[] => {
	const tokeniser = new Tokeniser(text);
	try {
		return [parseTree(tokeniser)];
	} catch (e) {}
	let trees: TreeNode[] = [];
	return trees;
};

const PATTERNS = {
	OPEN_SQUARE: /\[/,
	CLOSE_SQUARE: /\]/,
	LABEL_TEXT: /"([A-Za-z]+)"/,
};

const expect = (tok: Tokeniser, pattern: RegExp) => {
	if (!tok.next(pattern)) throw new Error(`Parser error, expected ${pattern}`);
};

const parseTree = (tok: Tokeniser): TreeNode => {
	expect(tok, PATTERNS.OPEN_SQUARE);
	let label = tok.next(PATTERNS.LABEL_TEXT);
	if (label == null) throw new Error("Parser error");
	let children: TreeNode[] = [];
	while (tok.has(PATTERNS.OPEN_SQUARE)) {
		children.push(parseTree(tok));
	}
	expect(tok, PATTERNS.CLOSE_SQUARE);
	return createTreeNode(label, children);
};
