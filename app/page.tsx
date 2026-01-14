"use client";
import { useState } from "react";
import { TrackCanvas } from "./components/TrackCanvas";
import { TrackSidebar } from "./components/TrackSidebar";
export default function Page() {
    const [seed, setSeed] = useState(69420);
    const [controlPoints, setControlPoints] = useState(16);
    const [minRadius, setMinRadius] = useState(300);
    const [maxRadius, setMaxRadius] = useState(520);
    const [trackWidth, setTrackWidth] = useState(90);
    const [obstacleCount, setObstacleCount] = useState(15);
    const [safetyScalePercent, setSafetyScalePercent] = useState(100);
    return (<div className="app-root" style={{
            background: "#000000",
            fontFamily: "Montserrat, Segoe UI, Arial, sans-serif"
        }}>
      <div className="canvas-wrapper">
        <TrackCanvas seed={seed} controlPoints={controlPoints} minRadius={minRadius} maxRadius={maxRadius} trackWidth={trackWidth} obstacleCount={obstacleCount} safetyScale={safetyScalePercent / 100}/>
      </div>
      <TrackSidebar seed={seed} setSeed={setSeed} controlPoints={controlPoints} setControlPoints={setControlPoints} minRadius={minRadius} setMinRadius={setMinRadius} maxRadius={maxRadius} setMaxRadius={setMaxRadius} trackWidth={trackWidth} setTrackWidth={setTrackWidth} obstacleCount={obstacleCount} setObstacleCount={setObstacleCount} safetyScalePercent={safetyScalePercent} setSafetyScalePercent={setSafetyScalePercent}/>
    </div>);
}
