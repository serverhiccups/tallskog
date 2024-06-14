import { Diagram } from "./render/Diagram";
import styles from "./app.module.scss";
import { useMemo, useState } from "preact/hooks";
import { parse } from "./tree/parser";

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
					<Diagram trees={trees}></Diagram>
				</div>
			</div>
		</div>
	);
};
