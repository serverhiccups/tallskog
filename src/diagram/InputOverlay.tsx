import { FunctionalComponent, JSX } from "preact";
import styles from "./inputoverlay.module.scss";
import { LABEL_PADDING } from "../render/render";
import { DynamicForestAction } from "../tree/dynamicForest";
import { Dispatch, Ref, useEffect, useRef } from "preact/hooks";
import { useBrowserType } from "../ui/browser";

type InputOverlayProps = {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	text: string;
	onFocusUpdate: (value: boolean) => void;
	inputRef: Ref<HTMLInputElement>;
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
	onFocusUpdate,
	inputRef,
	...rest
}) => {
	onFocusUpdate(inputRef?.current == document.activeElement);

	const handleFocusChange = (e: FocusEvent) => {
		if (e.target == document.activeElement) {
			onFocusUpdate(true);
		} else onFocusUpdate(false);
	};

	useEffect(() => {
		if (inputRef.current !== null) {
			inputRef.current.addEventListener("focus", handleFocusChange);
			inputRef.current.addEventListener("blur", handleFocusChange);
		}

		return () => {
			if (inputRef.current !== null) {
				inputRef.current.removeEventListener("focus", handleFocusChange);
				inputRef.current.removeEventListener("blur", handleFocusChange);
			}
			onFocusUpdate(false);
		};
	});

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

	const positionOverlayStyle = `top: ${y - height - LABEL_PADDING / 2.0 - 1}px;
        left: ${x - width / 2.0}px;
    `;

	const [browserType] = useBrowserType();

	const dragBlocker = {
		onMouseDown: (e: MouseEvent) => e.stopPropagation(),
		onMouseUp: (e: MouseEvent) => e.stopPropagation(),
	};

	return (
		<div id="overlay" class={styles.overlay} style={positionOverlayStyle}>
			<input
				type="text"
				class={styles.overlayinput}
				value={text}
				style={`width: ${width}px;
				${browserType == "firefoxmac" ? "padding-top: 0.5rem;" : ""}`}
				onInput={handleOverlayInput}
				ref={inputRef}
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
				{...dragBlocker}
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
				{...dragBlocker}
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
				{...dragBlocker}
				onClick={() => dispatch({ kind: "makeChild" })}
			>
				+
			</div>
		</div>
	);
};
