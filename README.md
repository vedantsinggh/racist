## Racist Simulator

Interactive top‑down track generator and visualizer built with **Next.js**.

Deployed at [racist-ugv](https://racist-ugv.vercel.app/)

---

## High‑Level Architecture

- **UI layer (React / Next.js)**
	- [app/page.tsx](app/page.tsx) – top‑level layout and state for all track parameters.
	- [app/components/TrackCanvas.tsx](app/components/TrackCanvas.tsx) – owns the `<canvas>`, calls the simulator, and draws the world.
	- [app/components/TrackSidebar.tsx](app/components/TrackSidebar.tsx) – right‑hand parameter panel with labeled sliders and a short guide.
	- [app/components/ParamSlider.tsx](app/components/ParamSlider.tsx) – small reusable slider component used by the sidebar.

- **Simulation / geometry layer**
	- [app/simulator/rng.ts](app/simulator/rng.ts) – deterministic pseudo‑random number generator (`mulberry32`) used for reproducible tracks.
	- [app/simulator/types.ts](app/simulator/types.ts) – shared types such as `Point`, `Track`, `Obstacle`, and `TrackConfig`.
	- [app/simulator/track.ts](app/simulator/track.ts) – main `generateTrack` function that produces the centerline, left/right edges, and obstacles.
	- [app/simulator/helpers/spline.ts](app/simulator/helpers/spline.ts) – creates control points and samples a smooth closed spline.
	- [app/simulator/helpers/geometry.ts](app/simulator/helpers/geometry.ts) – geometric utilities and edge generation from the centerline.
	- [app/simulator/helpers/obstacles.ts](app/simulator/helpers/obstacles.ts) – places obstacles along/around the track.
	- [app/simulator/clipper.d.ts](app/simulator/clipper.d.ts) – TypeScript declaration for the `clipper-lib` polygon offset library used internally by the geometry helpers.

---

## How Track Generation Works

### 1. Deterministic RNG

- The simulator uses `mulberry32(seed)` from [app/simulator/rng.ts](app/simulator/rng.ts).
- Given the same seed and configuration, the exact same track is generated every time.

### 2. Control Points and Spline

- `generateTrack(seed, config)` in [app/simulator/track.ts](app/simulator/track.ts) creates a set of control points roughly arranged in a ring around the canvas center.
- The number of control points is controlled by the **Spline Complexity** slider.
- Radii of those control points fall between **Minimum Radius** and **Maximum Radius**, controlling how tight or open the corners are.
- The control points are fed into the spline helper to create a smooth closed curve, sampled into a dense polyline called the **centerline**.

### 3. Track Edges

- The centerline is offset to the left and right by half the requested **Road Width** to produce **leftEdge** and **rightEdge** polylines.
- Offsetting is handled in the geometry helpers using `clipper-lib` for robust polygon offsets, with fallbacks and validation to avoid cracks and self‑intersections where possible.
- The resulting edges form a closed track polygon used later for filling and stroking the road on the canvas.

### 4. Obstacles

- `generateObstacles` in [app/simulator/helpers/obstacles.ts](app/simulator/helpers/obstacles.ts) places circular obstacles along the track.
- It samples positions along the centerline, adds small lateral offsets, and enforces minimum spacing so obstacles do not cluster too tightly.
- The total number of obstacles is controlled by the **Obstacles** slider.

### 5. Returned Track Object

`generateTrack` returns a `Track` object (see [app/simulator/types.ts](app/simulator/types.ts)) containing at least:

- `centerLine`: polyline of points along the track center.
- `leftEdge` / `rightEdge`: polylines representing the road boundary.
- `width`: effective road width.
- `length`: number of samples along the centerline.
- `obstacles`: array of obstacle positions and radii.

This object is used exclusively by the canvas rendering code; the React components never manipulate geometry directly.

---

## Rendering Pipeline

The visual rendering lives in [app/components/TrackCanvas.tsx](app/components/TrackCanvas.tsx).

### React / canvas integration

- `TrackCanvas` is a client component with a `canvasRef` and a `useEffect` hook.
- Whenever any of the track parameters (seed, complexity, radii, width, obstacle count) change, the effect runs:
	1. Calls `generateTrack` with the current configuration.
	2. Clears and repaints the entire canvas.
	3. Draws the background, road, edges, centerline, and obstacles.

### Drawing steps

1. **Background world**
	 - Fills the whole canvas with a dark green base color.
	 - Adds a "patchy" grass effect by drawing many small semi‑transparent circles with slightly different greens at random positions.

2. **Road fill**
	 - Constructs a polygon from `leftEdge` and `rightEdge` and fills it with a dark asphalt color using the canvas `evenodd` fill rule.

3. **Road edge lines**
	 - Strokes `leftEdge` and `rightEdge` with a light accent color and slightly thicker line width to visually separate the road from the grass.

4. **Centerline**
	 - Draws the centerline as a dashed stroke down the middle of the road.

5. **Obstacles**
	 - Draws each obstacle as a filled circle with a soft shadow, using its position and radius from the `Track` object.

All drawing is done with the standard 2D Canvas API; there are no WebGL dependencies.

---

## UI and Controls

The UI is split between [app/page.tsx](app/page.tsx), [app/components/TrackSidebar.tsx](app/components/TrackSidebar.tsx), and [app/components/ParamSlider.tsx](app/components/ParamSlider.tsx).

### Top‑level page

- `Page` manages React state for:
	- `seed`
	- `controlPoints`
	- `minRadius`
	- `maxRadius`
	- `trackWidth`
	- `obstacleCount`
- It renders a flex layout:
	- Left: `TrackCanvas` with the current parameter values.
	- Right: `TrackSidebar`, which exposes sliders to adjust those values.

### Sidebar and sliders

- `TrackSidebar` receives the current parameter values and their setters as props.
- It uses `ParamSlider` to render consistent slider controls with labels and formatted display values.
- Below the sliders, it shows a short **Parameter Guide** explaining what each control does.

### What each control does

- **Random Seed**
	- Changes the pseudo‑random sequence used by the simulator.
	- Different values produce completely different tracks while keeping them reproducible.

- **Spline Complexity**
	- Sets the number of control points used to build the base spline.
	- Lower values → simpler, flowing shapes; higher values → more twisty and complex tracks.

- **Minimum Radius / Maximum Radius**
	- Define the inner and outer radial range for control point placement around the center.
	- Smaller minimum radius → tighter possible corners.
	- Larger maximum radius → longer straights and wider overall track footprint.

- **Road Width**
	- Controls the lateral offset from the centerline to each edge.
	- Larger values result in a visually wider road.

- **Obstacles**
	- Sets how many obstacle circles are generated.
	- Obstacles are distributed along the centerline with random variation.

---