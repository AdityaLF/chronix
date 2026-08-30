// Monotone cubic spline curve
export function computeMonotoneCubicSpline(points: { x: number; y: number }[]): string {
    const n = points.length;
    if (n === 0) { return ''; }
    if (n === 1) { return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`; }
    if (n === 2) {
        return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
    }

    const dx: number[] = [];
    const dy: number[] = [];
    const slopes: number[] = [];

    for (let i = 0; i < n - 1; i++) {
        const deltaX = points[i + 1].x - points[i].x;
        const deltaY = points[i + 1].y - points[i].y;
        dx.push(deltaX);
        dy.push(deltaY);
        slopes.push(deltaX !== 0 ? deltaY / deltaX : 0);
    }

    const tangents: number[] = [slopes[0]];
    for (let i = 1; i < n - 1; i++) {
        if (slopes[i - 1] * slopes[i] <= 0) {
            tangents.push(0);
        } else {
            tangents.push((slopes[i - 1] + slopes[i]) / 2);
        }
    }
    tangents.push(slopes[slopes.length - 1]);

    for (let i = 0; i < n - 1; i++) {
        if (slopes[i] === 0) {
            tangents[i] = 0;
            tangents[i + 1] = 0;
        } else {
            const alpha = tangents[i] / slopes[i];
            const beta = tangents[i + 1] / slopes[i];
            const hyp = Math.hypot(alpha, beta);
            if (hyp > 3) {
                const tau = 3 / hyp;
                tangents[i] = tau * alpha * slopes[i];
                tangents[i + 1] = tau * beta * slopes[i];
            }
        }
    }

    let splinePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const deltaX = dx[i];

        const cp1x = p1.x + deltaX / 3;
        const cp1y = p1.y + (tangents[i] * deltaX) / 3;

        const cp2x = p2.x - deltaX / 3;
        const cp2y = p2.y - (tangents[i + 1] * deltaX) / 3;

        splinePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return splinePath;
}
