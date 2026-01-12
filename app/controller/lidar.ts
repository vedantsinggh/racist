import { Point, Track } from "../simulator/types";
function cross(a: Point, b: Point) {
    return a.x * b.y - a.y * b.x;
}
function sub(a: Point, b: Point): Point {
    return { x: a.x - b.x, y: a.y - b.y };
}
function dot(a: Point, b: Point) {
    return a.x * b.x + a.y * b.y;
}
function raySegmentIntersect(origin: Point, dir: Point, a: Point, b: Point): number | null {
    const v = sub(b, a);
    const w = sub(a, origin);
    const den = cross(dir, v);
    if (Math.abs(den) < 1e-9)
        return null;
    const t = cross(w, v) / den;
    const u = cross(w, dir) / den;
    if (t >= 0 && u >= 0 && u <= 1)
        return t;
    return null;
}
function rayCircleIntersect(origin: Point, dir: Point, c: Point, r: number): number | null {
    const oc = sub(origin, c);
    const b = 2 * dot(oc, dir);
    const cval = dot(oc, oc) - r * r;
    const disc = b * b - 4 * cval;
    if (disc < 0)
        return null;
    const sqrtD = Math.sqrt(disc);
    const t1 = (-b - sqrtD) / 2;
    const t2 = (-b + sqrtD) / 2;
    const t = (t1 >= 0) ? t1 : (t2 >= 0 ? t2 : null);
    return t as number | null;
}
export type LidarReading = {
    forward: number;
    right: number;
    back: number;
    left: number;
};
export type LidarScan = number[];
export function getLidarReadings(x: number, y: number, heading: number, track: Track, maxRange = 800, robotRadius = 20, minRange = 0): LidarReading {
    const origin: Point = { x, y };
    const dirs = [0, Math.PI / 2, Math.PI, -Math.PI / 2].map(a => a + heading);
    const readings = dirs.map(d => {
        const dir: Point = { x: Math.cos(d), y: Math.sin(d) };
        let bestClearance = maxRange;
        const edges = [track.leftEdge, track.rightEdge];
        for (const edge of edges) {
            for (let i = 0; i + 1 < edge.length; i++) {
                const a = edge[i];
                const b = edge[i + 1];
                const t = raySegmentIntersect(origin, dir, a, b);
                if (t !== null) {
                    const clearance = t - robotRadius;
                    if (clearance < bestClearance)
                        bestClearance = clearance;
                }
            }
        }
        for (const o of track.obstacles) {
            const t = rayCircleIntersect(origin, dir, o.position, o.radius);
            if (t !== null) {
                const clearance = t - robotRadius;
                if (clearance < bestClearance)
                    bestClearance = clearance;
            }
        }
        const val = bestClearance;
        return Math.max(minRange, Math.min(val, maxRange));
    });
    return {
        forward: readings[0],
        right: readings[1],
        back: readings[2],
        left: readings[3]
    };
}
export function getCircularLidarReadings(x: number, y: number, heading: number, track: Track, beamCount = 36, maxRange = 800, robotRadius = 20, minRange = 0): LidarScan {
    const origin: Point = { x, y };
    const dirs = Array.from({ length: beamCount }, (_, i) => (i * (2 * Math.PI)) / beamCount + heading);
    return dirs.map(d => {
        const dir: Point = { x: Math.cos(d), y: Math.sin(d) };
        let bestClearance = maxRange;
        const edges = [track.leftEdge, track.rightEdge];
        for (const edge of edges) {
            for (let i = 0; i + 1 < edge.length; i++) {
                const a = edge[i];
                const b = edge[i + 1];
                const t = raySegmentIntersect(origin, dir, a, b);
                if (t !== null) {
                    const clearance = t - robotRadius;
                    if (clearance < bestClearance)
                        bestClearance = clearance;
                }
            }
        }
        for (const o of track.obstacles) {
            const t = rayCircleIntersect(origin, dir, o.position, o.radius);
            if (t !== null) {
                const clearance = t - robotRadius;
                if (clearance < bestClearance)
                    bestClearance = clearance;
            }
        }
        return Math.max(minRange, Math.min(bestClearance, maxRange));
    });
}
export default getLidarReadings;
