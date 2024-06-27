import { Diagram } from "./render/Diagram";
import styles from "./app.module.scss";
import { useMemo, useReducer, useState } from "preact/hooks";
import { parse } from "./tree/parser";
import { dynamicForestReducer } from "./tree/dynamicTree";

export const App = () => {
	const [diagramCode, setDiagramCode] = useState<string>(
		'["Hello" ["A"]["B"]]'
	);
	const handleDiagramCodeChange = (event: InputEvent) => {
		if (event.target instanceof HTMLTextAreaElement) {
			setDiagramCode(event.target.value);
		}
	};

	const trees = useMemo(() => {
		const newTree = parse(diagramCode);
		return newTree;
	}, [diagramCode]);

	const [state, dispatch] = useReducer(dynamicForestReducer, {
		roots: parse(diagramCode),
	});

	return (
		<div id="app" class={styles.app}>
			<nav class={styles.nav}>Tallskog</nav>
			<div id="content" class={styles.content}>
				<div id="ast">
					<textarea
						id="ast"
						value={diagramCode}
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
