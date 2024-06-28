import { FunctionalComponent, JSX } from "preact";
import { Dispatch } from "preact/hooks";
import { DynamicForestAction } from "../tree/dynamicTree";
import styles from "./toolbar.module.scss";
import { TreeNode } from "../tree/treeNode";

type ToolbarProps = {
	dispatch: Dispatch<DynamicForestAction>;
	selectedNode: TreeNode | undefined;
} & JSX.HTMLAttributes<HTMLDivElement>;

export const Toolbar: FunctionalComponent<ToolbarProps> = ({
	dispatch,
	selectedNode,
	...rest
}) => {
	return (
		<div class={styles.toolbar} {...rest}>
			<span
				onClick={() => {
					if (selectedNode === undefined) return;
					dispatch({ kind: "deleteNode", nodeId: selectedNode.id });
				}}
			>
				Delete
			</span>
		</div>
	);
};
