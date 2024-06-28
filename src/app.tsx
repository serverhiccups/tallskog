import { Diagram } from "./render/Diagram";
import styles from "./app.module.scss";
import { useReducer } from "preact/hooks";
import { buildInitialState, dynamicForestReducer } from "./tree/dynamicTree";
import { TextEditor } from "./ui/TextEditor";
import { Toolbar } from "./ui/Toolbar";

export const App = () => {
	const startingText = `["Hello" ["A"]["B"]]
["Tree" ["Number"]["2"]]`;

	const [state, dispatch] = useReducer(
		dynamicForestReducer,
		buildInitialState(startingText)
	);

	return (
		<div id="app" class={styles.app}>
			<nav class={styles.nav}>Tallskog</nav>
			<div id="ast" class={styles.texteditor}>
				<TextEditor
					value={state.diagramText}
					placeholder={"Hello fart"}
					onUpdate={(v: string) => {
						dispatch({ kind: "updateDiagramText", text: v });
					}}
					isError={state.textError}
				/>
			</div>
			<div id="toolbar" class={styles.toolbar}>
				<Toolbar selectedNode={state.selectedNode} dispatch={dispatch} />
			</div>
			<div id="diagram" class={styles.diagram}>
				<Diagram
					trees={state.roots}
					selectedNode={state.selectedNode}
					dispatch={dispatch}
				></Diagram>
			</div>
		</div>
	);
};
