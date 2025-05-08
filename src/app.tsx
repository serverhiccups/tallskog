import { Editor } from "./pages/Editor";
import styles from "./app.module.scss";

export const App = () => {
	return (
		<div id="app" class={styles.app}>
			<nav class={styles.nav}>
				<span>Tallskog</span>
				<span>About</span>
				<span>Help</span>
			</nav>
			<Editor />
		</div>
	);
};
