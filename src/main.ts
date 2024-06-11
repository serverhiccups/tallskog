import { render } from "preact";
import "./style.css";
import "./reset.css";
import { App } from "./app";

const init = () => {
	render(App(), document.body);
};

init();
