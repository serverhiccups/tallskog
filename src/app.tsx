import { Diagram } from "./diagram/Diagram";
import styles from "./app.module.scss";
import { useReducer } from "preact/hooks";
import { buildInitialState, dynamicForestReducer } from "./tree/dynamicForest";
import { TextEditor } from "./ui/TextEditor";
import { Toolbar } from "./ui/Toolbar";
import { makeUndoable } from "./tree/undo";

export const App = () => {
	const startingText = `["Hello" ["A" ["C"]["D"]]["B"]]
["Tree" ["Number"]["2"]]`;

	const [state, dispatch] = useReducer(makeUndoable(dynamicForestReducer), {
		past: [],
		future: [],
		present: buildInitialState(startingText),
		lastUpdateTime: 0,
	});

	return (
		<div id="app" class={styles.app}>
			<nav class={styles.nav}>Tallskog</nav>
			<div id="ast" class={styles.texteditor}>
				<TextEditor
					value={state.present.diagramText}
					placeholder={"Hello"}
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
					trees={state.present.roots}
					selectedNode={state.present.selectedNode}
					dispatch={dispatch}
				></Diagram>
			</div>
		</div>
	);
};
