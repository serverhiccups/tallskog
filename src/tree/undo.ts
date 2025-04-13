import { Reducer } from "preact/hooks";

export type UndoState<T> = {
	past: Array<T>;
	present: T;
	future: Array<T>;
	lastUpdateTime: number; // epoch milliseconds
};

export type UndoAction = "undo" | "redo";

export const makeUndoable = <T, A>(reducer: Reducer<T, A>) => {
	return (state: UndoState<T>, action: A | UndoAction): UndoState<T> => {
		switch (action) {
			case "undo": {
				if (state.past.length == 0) return state;
				return {
					future: [...state.future, state.present],
					present: state.past.pop() as T,
					past: state.past,
					lastUpdateTime: 0 // 0 forces the next dispatch to create a step
				};
			}
			case "redo": {
				if (state.future.length == 0) return state;
				return {
					past: [...state.past, state.present],
					present: state.future.pop() as T,
					future: state.future,
					lastUpdateTime: 0
				};
			}
			default: {
				// structuredClone to avoid issues with different undo states being connected
				const freshInnerState = structuredClone(state.present);
				const newInnerState = reducer(freshInnerState, action);
				if (newInnerState === freshInnerState) return state;
				return {
					present: newInnerState,
					future: [],
					past: performance.now() - state.lastUpdateTime > 300 ? [...state.past, state.present] : [...state.past],
					lastUpdateTime: performance.now()
				};
			}
		}
	};
};
