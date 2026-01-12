export type RoverState = {
    x: number;
    y: number;
    heading: number;
};
export type RoverController = {
    getState(): RoverState;
    setState(s: RoverState): void;
    step(dt: number, speed: number): void;
    rotate(delta: number): void;
};
export type RoverAutoController = RoverController & {
    drive: (readings: {
        forward: number;
        right: number;
        back: number;
        left: number;
    }, dt: number, speed: number) => void;
    driveWithScan: (scan: number[], dt: number, speed: number, targetHeadingWorld?: number) => void;
};
function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
}
function normalizeAngle(a: number) {
    let x = a;
    while (x <= -Math.PI)
        x += 2 * Math.PI;
    while (x > Math.PI)
        x -= 2 * Math.PI;
    return x;
}
export default function createRoverController(initial: RoverState, robotRadius = 20) {
    const state: RoverState = { x: initial.x, y: initial.y, heading: initial.heading };
    let lastSteer = 0;
    let lastX = state.x;
    let lastY = state.y;
    let stuckTime = 0;
    let escapeTime = 0;
    const ctrl: RoverAutoController = {
        getState() {
            return { x: state.x, y: state.y, heading: state.heading };
        },
        setState(s: RoverState) {
            state.x = s.x;
            state.y = s.y;
            state.heading = s.heading;
        },
        step(dt: number, speed: number) {
            state.x += Math.cos(state.heading) * speed * dt;
            state.y += Math.sin(state.heading) * speed * dt;
        },
        rotate(delta: number) {
            state.heading += delta;
        },
        drive(readings: {
            forward: number;
            right: number;
            back: number;
            left: number;
        }, dt: number, speed: number) {
            const desiredClearance = Math.max(45, robotRadius * 1.2);
            const minClearance = Math.max(12, robotRadius + 6);
            const stopClearance = minClearance;
            const maxRange = 800;
            const turnRate = 2.2;
            const steerSmooth = 0.65;
            let steerCmd = 0;
            if (readings.forward <= stopClearance) {
                const sign = readings.left >= readings.right ? -1 : 1;
                steerCmd = sign * turnRate * 1.6;
            }
            else if (readings.forward < desiredClearance) {
                steerCmd = (readings.left > readings.right ? -1 : 1) * turnRate;
            }
            steerCmd += ((readings.right - readings.left) / maxRange) * (turnRate * 0.5);
            const steer = steerSmooth * lastSteer + (1 - steerSmooth) * steerCmd;
            lastSteer = steer;
            state.heading = normalizeAngle(state.heading + steer * dt);
            const available = Math.max(0, readings.forward - minClearance);
            const speedScale = readings.forward < desiredClearance ? 0.55 : 1;
            const step = readings.forward <= stopClearance ? 0 : Math.min(speed * speedScale * dt, available);
            if (step > 0) {
                state.x += Math.cos(state.heading) * step;
                state.y += Math.sin(state.heading) * step;
            }
        },
        driveWithScan(scan: number[], dt: number, speed: number, targetHeadingWorld?: number) {
            if (!scan.length)
                return;
            const beamCount = scan.length;
            const stepAngle = (2 * Math.PI) / beamCount;
            const desiredClearance = robotRadius * 2.5;
            const minClearance = Math.max(12, robotRadius + 4);
            const stopClearance = minClearance + 4;
            const maxOmega = 2.2;
            const steerSmooth = 0.65;
            const deadZone = 0.02;
            const forward = scan[0];
            const right = scan[Math.floor(beamCount / 4) % beamCount];
            const left = scan[Math.floor((3 * beamCount) / 4) % beamCount];
            let omegaTrack = 0;
            if (typeof targetHeadingWorld === "number" && Number.isFinite(targetHeadingWorld)) {
                const err = normalizeAngle(targetHeadingWorld - state.heading);
                omegaTrack = clamp(err * 2.2, -maxOmega, maxOmega);
            }
            let omegaAvoid = 0;
            if (forward <= stopClearance) {
                const sign = left >= right ? -1 : 1;
                omegaAvoid = sign * maxOmega;
            }
            else {
                let vx = 0;
                let vy = 0;
                for (let i = 0; i < beamCount; i++) {
                    const ang = i * stepAngle;
                    const clearance = Math.max(0, scan[i] - minClearance);
                    const weight = Math.min(clearance / desiredClearance, 1);
                    const facing = Math.max(0, Math.cos(ang));
                    const w = weight * facing;
                    vx += Math.cos(ang) * w;
                    vy += Math.sin(ang) * w;
                }
                vx += 0.6;
                if (vx !== 0 || vy !== 0) {
                    const targetAngle = Math.atan2(vy, vx);
                    const clamped = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetAngle));
                    omegaAvoid = clamp(clamped * 2, -maxOmega, maxOmega);
                }
                omegaAvoid += clamp(((right - left) / 800) * (maxOmega * 0.55), -maxOmega, maxOmega);
            }
            const moved = Math.hypot(state.x - lastX, state.y - lastY);
            lastX = state.x;
            lastY = state.y;
            if (moved < 0.3)
                stuckTime += dt;
            else
                stuckTime = 0;
            if (escapeTime > 0)
                escapeTime = Math.max(0, escapeTime - dt);
            if (stuckTime > 1 && escapeTime <= 0) {
                escapeTime = 0.9;
                stuckTime = 0;
            }
            let omegaCmd = 0;
            if (escapeTime > 0) {
                let bestI = 0;
                let bestScore = -Infinity;
                for (let i = 0; i < beamCount; i++) {
                    const ang = i * stepAngle;
                    const a = normalizeAngle(ang);
                    const facing = Math.max(0, Math.cos(a));
                    if (facing <= 0)
                        continue;
                    const score = scan[i] * facing;
                    if (score > bestScore) {
                        bestScore = score;
                        bestI = i;
                    }
                }
                const bestAng = normalizeAngle(bestI * stepAngle);
                omegaCmd = clamp(bestAng * 3, -maxOmega, maxOmega);
            }
            else {
                const danger = clamp((desiredClearance - forward) / desiredClearance, 0, 1);
                const wAvoid = clamp(0.25 + danger * 0.75, 0, 1);
                const wTrack = 1 - wAvoid;
                omegaCmd = omegaTrack * wTrack + omegaAvoid * wAvoid;
            }
            if (Math.abs(omegaCmd) < deadZone)
                omegaCmd = 0;
            const omega = steerSmooth * lastSteer + (1 - steerSmooth) * clamp(omegaCmd, -maxOmega, maxOmega);
            lastSteer = omega;
            state.heading = normalizeAngle(state.heading + omega * dt);
            const available = Math.max(0, forward - minClearance);
            const speedScale = forward < desiredClearance ? 0.55 : 1;
            const headingPenalty = 1 - clamp(Math.abs(normalizeAngle((targetHeadingWorld ?? state.heading) - state.heading)) / 1.2, 0, 0.6);
            const stepWanted = speed * speedScale * headingPenalty * dt;
            const step = forward <= stopClearance ? 0 : Math.min(stepWanted, available);
            if (step > 0) {
                state.x += Math.cos(state.heading) * step;
                state.y += Math.sin(state.heading) * step;
            }
        }
    };
    return ctrl;
}
