import { Editor } from "./pages/Editor";
import { Link, Route, Switch } from "wouter-preact";
import styles from "./app.module.scss";
import { Home } from "./pages/Home";

export const App = () => {
	return (
		<div id="app" class={styles.app}>
			<nav class={styles.nav}>
				<Link href="/">Tallskog</Link>
				<Link href="/editor">Editor</Link>
			</nav>
			<Switch>
				<Route path="/editor">
					<Editor />
				</Route>

				{/* Default Route */}
				<Route>
					<Home />
				</Route>
			</Switch>
		</div>
	);
};
