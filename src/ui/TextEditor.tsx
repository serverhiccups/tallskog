import { FunctionalComponent, JSX } from "preact";
import styles from "./texteditor.module.scss";

type TextEditorProps = {
	value: string;
	/** Receives the new value */
	onUpdate: (value: string) => any;
	isError: boolean;
} & JSX.HTMLAttributes<HTMLTextAreaElement>;

export const TextEditor: FunctionalComponent<TextEditorProps> = ({
	value,
	onUpdate,
	isError,
}) => {
	return (
		<textarea
			class={`${styles.editor}${isError ? " " + styles.error : ""}`}
			id="ast"
			value={value}
			onInput={(e) => {
				if (e.target instanceof HTMLTextAreaElement) {
					onUpdate(e.target.value);
				}
			}}
		></textarea>
	);
};
