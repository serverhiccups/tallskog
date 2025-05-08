import { createRef, RefObject } from "preact"
import { useCallback, useEffect, useState } from "preact/hooks";

export const useInputFocusState = (): [RefObject<HTMLInputElement>, boolean] => {
	const ref = createRef<HTMLInputElement>();
	const [focusState, setFocusState] = useState<boolean>(false);

	const handleFocusChange = useCallback(() => {
		if (ref.current == document.activeElement) {
			setFocusState(true);
		} else setFocusState(false);
	}, []);

	useEffect(() => {
		const inputElement = ref.current;
		if (inputElement !== null) {
			console.log(inputElement);
			inputElement.addEventListener("focus", handleFocusChange);
			inputElement.addEventListener("blur", handleFocusChange);
			setFocusState(ref.current === document.activeElement);
		}


		return () => {
			if (inputElement !== null) {
				inputElement.removeEventListener("focus", handleFocusChange);
				inputElement.removeEventListener("blur", handleFocusChange);
			}
			setFocusState(false);
		};
	}, [ref.current]);
	return [ref, focusState];
};
