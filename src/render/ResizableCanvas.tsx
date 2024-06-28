import { useRef, useEffect } from "preact/hooks";
import styles from "./canvas.module.scss";
import { FunctionalComponent } from "preact";
import { JSX } from "preact";

type ResizableCanvasProps = {
	draw: (ctx: CanvasRenderingContext2D) => void;
} & JSX.HTMLAttributes<HTMLCanvasElement>;

export const ResizableCanvas: FunctionalComponent<ResizableCanvasProps> = ({
	draw,
	...rest
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (canvasRef.current == null) return;
		const { current } = canvasRef;

		const resizeCanvas = () => {
			let dpr = window.devicePixelRatio || 1;
			const { width, height } = current.getBoundingClientRect();
			current.width = width * dpr;
			current.height = height * dpr;
			const ctx = current.getContext("2d");
			if (ctx == null) return;
			ctx.scale(dpr, dpr);
			draw(ctx);
		};

		resizeCanvas(); // Draw on load
		const ro = new ResizeObserver(resizeCanvas);
		ro.observe(current);

		return () => {
			// Destroy listener when component is destroyed
			ro.unobserve(current);
		};
	}, [draw]);

	return <canvas class={styles.canvas} ref={canvasRef} {...rest}></canvas>;
};
