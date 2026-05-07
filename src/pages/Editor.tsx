import { Diagram } from "../diagram/Diagram";
import styles from "./editor.module.scss";
import { useReducer } from "preact/hooks";
import { buildInitialState, dynamicForestReducer } from "../tree/dynamicForest";
import { TextEditor } from "../ui/TextEditor";
import { Toolbar } from "../ui/Toolbar";
import { makeUndoable } from "../tree/undo";

export const Editor = () => {
	// 	const startingText = `["Hello" [1 "A" ["C"]["D"]]["B"]]
	// ["Tree" ["Number"][2 "2"]]
	// <1 2>`;
	// const startingText = `["Tree" ["Number"][2 "2" ["test"]]]`;
	// const startingText = `["Tree"]`;
	// const startingText = `["TP" ["DP_1" ["Amber"]]["T'" ["T"]["vP" ["<DP_1>"]["v'"]]]]`;
	const startingText = `["TP" ["DP_1" [1 "Amber"]]["T'" ["T"]["vP" [2 "<DP_1>"]["v'"]]]]
<1 2>`;

	const [state, dispatch] = useReducer(makeUndoable(dynamicForestReducer), {
		past: [],
		future: [],
		present: buildInitialState(startingText),
		lastUpdateTime: 0,
	});

	return (
		<div id="editor" class={styles.editor}>
			<div id="ast" class={styles.texteditor}>
				<TextEditor
					value={state.present.diagramText}
					onUpdate={(v: string) => {
						dispatch({ kind: "updateDiagramText", text: v });
					}}
					isError={state.present.textError}
				/>
			</div>
			<div id="toolbar" class={styles.toolbar}>
				<Toolbar
					selectedNode={state.present.selectedNode}
					state={state}
					dispatch={dispatch}
				/>
			</div>
			<div id="diagram" class={styles.diagram}>
				<Diagram
					forest={state.present.forest}
					selectedNode={state.present.selectedNode}
					dispatch={dispatch}
				></Diagram>
			</div>
		</div>
	);
};
