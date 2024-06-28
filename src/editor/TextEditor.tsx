import { FunctionalComponent } from "preact";
import styles from "./texteditor.module.scss";

interface TextEditorProps {
	value: string;
	/** Receives the new value */
	onChange: (value: string) => any;
	isError: boolean;
}

export const TextEditor: FunctionalComponent<TextEditorProps> = ({
	value,
	onChange,
	isError,
}) => {
	return (
		<textarea
			class={`${styles.editor}${isError ? " " + styles.error : ""}`}
			id="ast"
			value={value}
			onInput={(e) => {
				if (e.target instanceof HTMLTextAreaElement) {
					onChange(e.target.value);
				}
			}}
		></textarea>
	);
};
