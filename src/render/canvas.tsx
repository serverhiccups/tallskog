import { useRef, useEffect } from "preact/hooks";
import { TreeNode, addChildren, createTreeNode } from "../tree/treeNode";
import { renderTree } from "./render";
import styles from "./canvas.module.css";

export function Canvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (canvasRef.current == null) return;

		let dpr = window.devicePixelRatio || 1;
		let rect = canvasRef.current.getBoundingClientRect();
		canvasRef.current.width = rect.width * dpr;
		canvasRef.current.height = rect.height * dpr;

		const ctx = canvasRef.current.getContext("2d");
		if (ctx == null) return;
		ctx.scale(dpr, dpr);

		let treeRoot: TreeNode = createTreeNode("X");
		const y = createTreeNode("Y");
		let z = createTreeNode("My Special Node");
		const a = createTreeNode("A");
		const b = createTreeNode("B");
		const c = createTreeNode("C");
		const d = createTreeNode("D");
		treeRoot = addChildren(treeRoot, [y, z]);
		z = addChildren(z, [a, b]);
		// y.addChild(c);
		// y.addChild(d);

		renderTree(
			ctx,
			canvasRef.current.width,
			canvasRef.current.height,
			treeRoot
		);
	}, []);

	return <canvas class={styles.canvas} ref={canvasRef}></canvas>;
}
