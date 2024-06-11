import { Diagram } from "./render/Diagram";
import styles from "./app.module.scss";
import { useMemo, useState } from "preact/hooks";
import { parse } from "./tree/parser";

export const App = () => {
	const [diagramCode, setDiagramCode] = useState<string>("");
	const handleDiagramCodeChange = (event: InputEvent) => {
		if (event.target instanceof HTMLTextAreaElement) {
			setDiagramCode(event.target.value);
		}
	};

	const tree = useMemo(() => {
		const newTree = parse(diagramCode);
		return newTree[0];
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
					<Diagram tree={tree}></Diagram>
				</div>
			</div>
		</div>
	);
};
