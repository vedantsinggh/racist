"use client";
import { useEffect, useRef } from "react";
import { getCircularLidarReadings } from "../controller/lidar";
import createRoverController, { RoverState } from "../controller/rover";
import { generateTrack } from "../simulator/track";
import { Point } from "../simulator/types";
function drawPolyline(ctx: CanvasRenderingContext2D, pts: Point[]) {
    if (!pts.length)
        return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++)
        ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
}
function drawTriangle(ctx: CanvasRenderingContext2D, p1: Point, p2: Point, p3: Point) {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}
type TrackCanvasProps = {
    seed: number;
    controlPoints: number;
    minRadius: number;
    maxRadius: number;
    trackWidth: number;
    obstacleCount: number;
    safetyScale: number;
};
export function TrackCanvas({ seed, controlPoints, minRadius, maxRadius, trackWidth, obstacleCount, safetyScale }: TrackCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const roverCtrlRef = useRef<ReturnType<typeof createRoverController> | null>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext("2d")!;
        const track = generateTrack(seed, {
            controlPoints,
            minRadius,
            maxRadius,
            trackWidth,
            obstacleCount
        });
        if (track.leftEdge.length < 3 || track.rightEdge.length < 3) {
            console.warn("Invalid track edges");
            return;
        }
        function drawStaticBackground() {
            if (!canvas)
                return;
            ctx.fillStyle = "#5A7863";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < 2000; i++) {
                ctx.fillStyle = Math.random() > 0.5
                    ? "rgba(52,103,81,0.13)"
                    : "rgba(52,103,81,0.22)";
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                ctx.beginPath();
                ctx.arc(x, y, Math.random() * 1.2 + 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = "#3B4953";
            ctx.beginPath();
            ctx.moveTo(track.leftEdge[0].x, track.leftEdge[0].y);
            for (let i = 1; i < track.leftEdge.length; i++)
                ctx.lineTo(track.leftEdge[i].x, track.leftEdge[i].y);
            ctx.closePath();
            ctx.moveTo(track.rightEdge[0].x, track.rightEdge[0].y);
            for (let i = 1; i < track.rightEdge.length; i++)
                ctx.lineTo(track.rightEdge[i].x, track.rightEdge[i].y);
            ctx.closePath();
            ctx.fill("evenodd");
            ctx.strokeStyle = "#ECDBBA";
            ctx.lineWidth = 2.5;
            drawPolyline(ctx, track.leftEdge);
            drawPolyline(ctx, track.rightEdge);
            ctx.setLineDash([10, 10]);
            ctx.strokeStyle = "#ECDBBA";
            ctx.lineWidth = 1.2;
            drawPolyline(ctx, track.centerLine);
            ctx.setLineDash([]);
            ctx.save();
            ctx.strokeStyle = "#91C6BC";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(track.startLine.a.x, track.startLine.a.y);
            ctx.lineTo(track.startLine.b.x, track.startLine.b.y);
            ctx.stroke();
            ctx.restore();
        }
        drawStaticBackground();
        const a = track.startLine.a;
        const b = track.startLine.b;
        const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        let bestIdx = 0;
        let bestDist = Infinity;
        for (let i = 0; i < track.centerLine.length; i++) {
            const p = track.centerLine[i];
            const d = (p.x - center.x) * (p.x - center.x) + (p.y - center.y) * (p.y - center.y);
            if (d < bestDist) {
                bestDist = d;
                bestIdx = i;
            }
        }
        const idxA = Math.max(0, Math.min(track.centerLine.length - 1, bestIdx - 1));
        const idxB = Math.max(0, Math.min(track.centerLine.length - 1, bestIdx + 1));
        const pA = track.centerLine[idxA];
        const pB = track.centerLine[idxB];
        let vx0 = pB.x - pA.x;
        let vy0 = pB.y - pA.y;
        const vlen0 = Math.hypot(vx0, vy0) || 1;
        vx0 /= vlen0;
        vy0 /= vlen0;
        const initialHeading = Math.atan2(vy0, vx0);
        const ROBOT_SIDE = 33;
        const SAFETY_SCALE = safetyScale;
        const ROBOT_RADIUS = (ROBOT_SIDE / Math.sqrt(3)) * SAFETY_SCALE;
        if (!roverCtrlRef.current)
            roverCtrlRef.current = createRoverController({ x: center.x, y: center.y, heading: initialHeading } as RoverState, ROBOT_RADIUS);
        let raf = 0;
        let last = performance.now();
        const speed = 120;
        const beamCount = 36;
        let followIdx = bestIdx;
        const lookaheadDist = 140;
        function clamp(v: number, lo: number, hi: number) {
            return Math.max(lo, Math.min(hi, v));
        }
        function normalize(dx: number, dy: number) {
            const len = Math.hypot(dx, dy);
            if (len <= 1e-9)
                return { x: 0, y: 0 };
            return { x: dx / len, y: dy / len };
        }
        function closestPointOnSegment(p: Point, a: Point, b: Point) {
            const abx = b.x - a.x;
            const aby = b.y - a.y;
            const apx = p.x - a.x;
            const apy = p.y - a.y;
            const ab2 = abx * abx + aby * aby;
            if (ab2 <= 1e-9)
                return { x: a.x, y: a.y };
            const t = clamp((apx * abx + apy * aby) / ab2, 0, 1);
            return { x: a.x + abx * t, y: a.y + aby * t };
        }
        function minEdgeClearance(p: Point) {
            let best = Infinity;
            let bestCp: Point | null = null;
            const edges = [track.leftEdge, track.rightEdge];
            for (const edge of edges) {
                for (let i = 0; i + 1 < edge.length; i++) {
                    const a = edge[i];
                    const b = edge[i + 1];
                    const cp = closestPointOnSegment(p, a, b);
                    const d = Math.hypot(p.x - cp.x, p.y - cp.y);
                    if (d < best) {
                        best = d;
                        bestCp = cp;
                    }
                }
            }
            return { dist: best, closest: bestCp };
        }
        function resolveCollisions(state: {
            x: number;
            y: number;
            heading: number;
        }, centerIdx: number) {
            const iters = 12;
            const extra = 2;
            const center = track.centerLine[centerIdx] ?? { x: state.x, y: state.y };
            for (let iter = 0; iter < iters; iter++) {
                let changed = false;
                for (const o of track.obstacles) {
                    const dx = state.x - o.position.x;
                    const dy = state.y - o.position.y;
                    const d = Math.hypot(dx, dy);
                    const minD = o.radius + ROBOT_RADIUS + extra;
                    if (d < minD) {
                        const dir = normalize(dx, dy);
                        const useDir = (dir.x === 0 && dir.y === 0)
                            ? normalize(center.x - state.x, center.y - state.y)
                            : dir;
                        const push = (minD - d);
                        state.x += useDir.x * push;
                        state.y += useDir.y * push;
                        changed = true;
                    }
                }
                const edge = minEdgeClearance({ x: state.x, y: state.y });
                const minClear = ROBOT_RADIUS + extra;
                if (edge.closest && edge.dist < minClear) {
                    const away = normalize(state.x - edge.closest.x, state.y - edge.closest.y);
                    const toCenter = normalize(center.x - state.x, center.y - state.y);
                    const dot = away.x * toCenter.x + away.y * toCenter.y;
                    const dir = dot >= 0 ? away : { x: -away.x, y: -away.y };
                    const push = (minClear - edge.dist);
                    state.x += dir.x * push;
                    state.y += dir.y * push;
                    changed = true;
                }
                if (!changed)
                    break;
            }
        }
        function dist2(a: Point, b: Point) {
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            return dx * dx + dy * dy;
        }
        function findClosestIndex(pos: Point) {
            const n = track.centerLine.length;
            if (n === 0)
                return 0;
            let best = followIdx;
            let bestD = dist2(track.centerLine[best], pos);
            const window = 40;
            for (let k = -window; k <= window; k++) {
                const i = (followIdx + k + n) % n;
                const d = dist2(track.centerLine[i], pos);
                if (d < bestD) {
                    bestD = d;
                    best = i;
                }
            }
            if (bestD > 300 * 300) {
                best = 0;
                bestD = dist2(track.centerLine[0], pos);
                for (let i = 1; i < n; i++) {
                    const d = dist2(track.centerLine[i], pos);
                    if (d < bestD) {
                        bestD = d;
                        best = i;
                    }
                }
            }
            followIdx = best;
            return best;
        }
        function lookaheadPoint(fromIdx: number, dist: number): Point {
            const pts = track.centerLine;
            const n = pts.length;
            if (n === 0)
                return { x: 0, y: 0 };
            let i = fromIdx;
            let remaining = dist;
            while (remaining > 0) {
                const a = pts[i];
                const b = pts[(i + 1) % n];
                const seg = Math.hypot(b.x - a.x, b.y - a.y);
                if (seg >= remaining) {
                    const t = seg > 0 ? remaining / seg : 0;
                    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
                }
                remaining -= seg;
                i = (i + 1) % n;
            }
            return pts[i];
        }
        function renderFrame(now: number) {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            const ctrl = roverCtrlRef.current!;
            const prior = ctrl.getState();
            try {
                const scan = getCircularLidarReadings(prior.x, prior.y, prior.heading, track, beamCount, 800, ROBOT_RADIUS);
                const closest = findClosestIndex({ x: prior.x, y: prior.y });
                const target = lookaheadPoint(closest, lookaheadDist);
                const targetHeading = Math.atan2(target.y - prior.y, target.x - prior.x);
                if (typeof ctrl.driveWithScan === "function") {
                    ctrl.driveWithScan(scan, dt, speed, targetHeading);
                }
                else if (typeof ctrl.drive === "function") {
                    const idxForward = 0;
                    const idxRight = Math.round(beamCount / 4) % beamCount;
                    const idxBack = Math.round(beamCount / 2) % beamCount;
                    const idxLeft = Math.round((3 * beamCount) / 4) % beamCount;
                    const readings = {
                        forward: scan[idxForward],
                        right: scan[idxRight],
                        back: scan[idxBack],
                        left: scan[idxLeft]
                    };
                    ctrl.drive(readings, dt, speed);
                }
                else {
                    ctrl.step(dt, speed);
                }
                const after = ctrl.getState();
                const afterClosest = findClosestIndex({ x: after.x, y: after.y });
                resolveCollisions(after, afterClosest);
                ctrl.setState(after);
            }
            catch {
                ctrl.step(dt, speed);
            }
            const r = ctrl.getState();
            drawStaticBackground();
            try {
                const drawCenter = { x: r.x, y: r.y };
                const theta = r.heading;
                const vx = Math.cos(theta);
                const vy = Math.sin(theta);
                const px = -vy;
                const py = vx;
                const side = ROBOT_SIDE;
                const h = side * Math.sqrt(3) / 2;
                const tip = { x: drawCenter.x + vx * (2 * h / 3), y: drawCenter.y + vy * (2 * h / 3) };
                const baseCenter = { x: drawCenter.x - vx * (h / 3), y: drawCenter.y - vy * (h / 3) };
                const halfBase = side / 2;
                const left = { x: baseCenter.x + px * halfBase, y: baseCenter.y + py * halfBase };
                const right = { x: baseCenter.x - px * halfBase, y: baseCenter.y - py * halfBase };
                ctx.save();
                ctx.fillStyle = "#FFD76B";
                ctx.strokeStyle = "#B36700";
                ctx.lineWidth = 2;
                ctx.shadowColor = "rgba(0,0,0,0.6)";
                ctx.shadowBlur = 8;
                drawTriangle(ctx, tip, left, right);
                ctx.restore();
            }
            catch (e) {
                console.warn("Failed to draw rover", e);
            }
            ctx.fillStyle = "#B45253";
            for (const o of track.obstacles) {
                ctx.save();
                ctx.shadowColor = "#000";
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(o.position.x, o.position.y, o.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            raf = requestAnimationFrame(renderFrame);
        }
        raf = requestAnimationFrame(renderFrame);
        return () => cancelAnimationFrame(raf);
    }, [seed, controlPoints, minRadius, maxRadius, trackWidth, obstacleCount, safetyScale]);
    return (<canvas ref={canvasRef} width={1600} height={1200} style={{
            border: "2px solid #3F0071",
            borderRadius: "16px",
            boxShadow: "0 4px 32px #000a",
            background: "#000000",
            display: "block",
            maxWidth: "100%",
            height: "auto"
        }}/>);
}
