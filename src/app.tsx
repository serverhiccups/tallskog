import { Diagram } from "./render/Diagram";
import styles from "./app.module.scss";
import { useMemo, useReducer, useState } from "preact/hooks";
import { parse } from "./tree/parser";
import { dynamicForestReducer } from "./tree/dynamicTree";

export const App = () => {
	const startingText = '["Hello" ["A"]["B"]]';

	const [state, dispatch] = useReducer(dynamicForestReducer, {
		roots: parse(startingText),
		diagramText: startingText,
	});

	const handleDiagramCodeChange = (event: InputEvent) => {
		if (event.target instanceof HTMLTextAreaElement) {
			dispatch({ kind: "updateDiagramText", text: event.target.value });
		}
	};

	return (
		<div id="app" class={styles.app}>
			<nav class={styles.nav}>Tallskog</nav>
			<div id="content" class={styles.content}>
				<div id="ast">
					<textarea
						id="ast"
						value={state.diagramText}
						onInput={handleDiagramCodeChange}
					></textarea>
				</div>
				<div id="output">
					<Diagram trees={state.roots} dispatch={dispatch}></Diagram>
				</div>
			</div>
		</div>
	);
};
