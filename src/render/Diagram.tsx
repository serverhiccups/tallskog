import { FunctionalComponent } from "preact";
import { TreeNode } from "../tree/treeNode";
import { ResizableCanvas } from "./ResizableCanvas";
import { renderTree } from "./render";

interface DiagramProps {
	tree: TreeNode;
}

export const Diagram: FunctionalComponent<DiagramProps> = ({ tree }) => {
	const draw = (ctx: CanvasRenderingContext2D) => {
		renderTree(ctx, ctx.canvas.height, ctx.canvas.width, tree);
	};
	return <ResizableCanvas draw={draw}></ResizableCanvas>;
};
