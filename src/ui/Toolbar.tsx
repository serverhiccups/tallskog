import { FunctionalComponent, JSX } from "preact";
import { Dispatch } from "preact/hooks";
import { DynamicForestAction } from "../tree/dynamicForest";
import styles from "./toolbar.module.scss";
import { UndoAction, UndoState } from "../tree/undo";

type ToolbarProps = {
	dispatch: Dispatch<DynamicForestAction | UndoAction>;
	state: UndoState<any>;
	selectedNode: string | undefined;
} & JSX.HTMLAttributes<HTMLDivElement>;

export const Toolbar: FunctionalComponent<ToolbarProps> = ({
	dispatch,
	state,
	selectedNode,
	...rest
}) => {
	return (
		<div class={styles.toolbar} {...rest}>
			<span
				onClick={() => {
					if (selectedNode === undefined) return;
					dispatch({ kind: "deleteNode", nodeId: selectedNode });
				}}
			>
				Delete
			</span>
			<span
				class={state.past.length == 0 ? styles.disabled : ""}
				onClick={() => {
					dispatch("undo");
				}}
			>
				Undo
			</span>
			<span
				class={state.future.length == 0 ? styles.disabled : ""}
				onClick={() => {
					dispatch("redo");
				}}
			>
				Redo
			</span>
		</div>
	);
};
