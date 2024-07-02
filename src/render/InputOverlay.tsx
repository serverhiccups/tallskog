import { FunctionalComponent, JSX } from "preact";
import styles from "./inputoverlay.module.scss";
import { LABEL_PADDING } from "./render";
import { DynamicForestAction } from "../tree/dynamicForest";
import { Dispatch } from "preact/hooks";

type InputOverlayProps = {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	text: string;
	dispatch: Dispatch<DynamicForestAction>;
} & JSX.HTMLAttributes<HTMLInputElement>;

export const InputOverlay: FunctionalComponent<InputOverlayProps> = ({
	id,
	x,
	y,
	width,
	height,
	text,
	dispatch,
	...rest
}) => {
	const handleOverlayInput: JSX.InputEventHandler<HTMLInputElement> = (
		e
	): void => {
		if (e.target instanceof HTMLInputElement) {
			dispatch({
				kind: "updateLabelText",
				nodeId: id,
				text: e.target.value,
			});
		}
	};

	const positionOverlayStyle = `top: ${
		y - height - LABEL_PADDING / 2.0 + 0.5
	}px;
        left: ${x - width / 2.0}px;
    `;

	return (
		<div
			id="overlay"
			class={styles.overlay}
			style={positionOverlayStyle}
			onMouseDown={(e) => e.stopPropagation()}
			onMouseUp={(e) => e.stopPropagation()}
		>
			<input
				type="text"
				class={styles.overlayinput}
				value={text}
				style={`width: ${width}px;`}
				onInput={handleOverlayInput}
				{...rest}
			/>
			<div
				id="addLeftSibling"
				class={styles.overlaychild}
				role="button"
				style={`
				top: calc(1rem - 0.5rem);
				left: calc(-1rem - 0.25rem);
				`}
				onClick={() => dispatch({ kind: "makeLeftSibling" })}
			>
				+
			</div>
			<div
				id="addRightSibling"
				class={styles.overlaychild}
				role="button"
				style={`
				top: calc(1rem - 0.5rem);
				left: calc(${width}px + 0.25rem);
				`}
				onClick={() => dispatch({ kind: "makeRightSibling" })}
			>
				+
			</div>
			<div
				id="addRightSibling"
				class={styles.overlaychild}
				role="button"
				style={`
					width: 2rem;
				top: calc(2rem + 0.25rem);
				left: calc(${width / 2.0}px - 1rem);
				`}
				onClick={() => dispatch({ kind: "makeChild" })}
			>
				+
			</div>
		</div>
	);
};
