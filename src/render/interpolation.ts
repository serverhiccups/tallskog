import { ControlPoint } from "./layout";

const SAMPLES_PER_SEGMENT = 10;

export const interpolatePoints = (controlPoints: ControlPoint[]): ControlPoint[] => {
	// const controlPoints = [p0, p1, p2, p3]; // Maybe duplicate end and start points?
	const curvePoints: ControlPoint[] = [];
	for (let i = 0; i < controlPoints.length - 1; i++) {
		const z0 = controlPoints[Math.max(i - 1, 0)]
		const z1 = controlPoints[i]
		const z2 = controlPoints[i + 1]
		const z3 = controlPoints[Math.min(i + 2, controlPoints.length - 1)]

		for (let s = 0; s <= SAMPLES_PER_SEGMENT; s++) {
			const t = s / SAMPLES_PER_SEGMENT;
			const point = catmullRomPoint(z0, z1, z2, z3, t);
			curvePoints.push(point);
		}
	}
	return curvePoints;
}

const addPoints = (a: ControlPoint, b: ControlPoint): ControlPoint => {
	return { x: a.x + b.x, y: a.y + b.y };
}

const subPoints = (a: ControlPoint, b: ControlPoint): ControlPoint => {
	return { x: a.x - b.x, y: a.y - b.y };
}

const multPointScalar = (a: ControlPoint, s: number): ControlPoint => {
	return { x: a.x * s, y: a.y * s }
}

const catmullRomPoint = (p0: ControlPoint, p1: ControlPoint, p2: ControlPoint, p3: ControlPoint, t: number): ControlPoint => {
	const t2 = t * t;
	const t3 = t2 * t;

	const term1 = multPointScalar(p1, 2);

	const term2 = multPointScalar(subPoints(p2, p0), t);

	const term3 = multPointScalar(
		addPoints(
			subPoints(multPointScalar(p0, 2), multPointScalar(p1, 5)),
			subPoints(multPointScalar(p2, 4), p3)
		),
		t2
	)

	const term4 = multPointScalar(
		addPoints(
			subPoints(multPointScalar(p1, 3), multPointScalar(p0, 1)),
			subPoints(p3, multPointScalar(p2, 3))
		),
		t3
	)

	return multPointScalar(addPoints(addPoints(term1, term2), addPoints(term3, term4)), 0.5);

}
