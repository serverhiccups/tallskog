import { FunctionalComponent, JSX } from "preact";
import styles from "./inputoverlay.module.scss";
import { LABEL_PADDING } from "./render";

type InputOverlayProps = {
	x: number;
	y: number;
	width: number;
	height: number;
	text: string;
} & JSX.HTMLAttributes<HTMLInputElement>;

export const InputOverlay: FunctionalComponent<InputOverlayProps> = ({
	x,
	y,
	width,
	height,
	text,
	...rest
}) => {
	const positionOverlayStyle = `top: ${
		y - height + LABEL_PADDING / 2.0 - 0.5
	}px;
        left: ${x - width / 2.0}px;
        width: ${width}px;
        user-select: none;
    `;

	return (
		<input
			id="overlay"
			type="text"
			class={styles.overlay}
			style={positionOverlayStyle}
			value={text}
			// onMouseMove={onMouseMove}
			{...rest}
		/>
	);
};
