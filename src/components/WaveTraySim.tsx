"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { WaveTray, FLOAT_LIMIT, OBJECT_RADIUS, bobFrequency } from "@/lib/waveTray";

const GRID = 128;           // field resolution
const READOUT = 8;          // readout points per side
const DT = 1 / 240;         // physics step, s
const MAX_FLOATS = 12;
const HISTORY = 20;         // seconds of frequency history
const SAMPLE = 0.1;         // seconds between history samples
const HEIGHT_SCALE = 0.0005; // surface height that maps to most of the color range, m
const LIFT = 15000;         // screen px per m of height for readout dots, at 600 px wide
const FLOAT_LIFT = 3000;    // the same for floats, which move much more

const FLOAT_COLORS = [
    "#d1603d", "#3d8fd1", "#e0a526", "#6a9f4b", "#9b5fc0", "#cf5c8f",
    "#2fa39a", "#8c6d46", "#5b6fd6", "#b8b83a", "#d17c3d", "#4aa0c4",
];

type Rgb = [number, number, number];

interface Palette {
    still: Rgb;
    crest: Rgb;
    trough: Rgb;
    ink: string;
    muted: string;
    grid: string;
    panel: string;
}

const LIGHT: Palette = {
    still: [196, 214, 222], crest: [246, 244, 238], trough: [58, 98, 120],
    ink: "#2c2c2c", muted: "#6b6b6b", grid: "rgba(0,0,0,0.12)", panel: "#f5f3ef",
};

const DARK: Palette = {
    still: [34, 52, 62], crest: [120, 160, 178], trough: [8, 14, 18],
    ink: "#e8e8e8", muted: "#a0a0a0", grid: "rgba(255,255,255,0.12)", panel: "#242424",
};

interface Splash { x: number; y: number; t: number }

function describe(grams: number): string {
    const mass = grams / 1000;
    if (mass >= FLOAT_LIMIT) return `${grams} g: sinks (floats need under 35 g)`;
    const hz = bobFrequency(mass) / (2 * Math.PI);
    return `${grams} g: floats; alone on open water it bobs at ${hz.toFixed(1)} Hz`;
}

export default function WaveTraySim() {
    const trayRef = useRef<HTMLCanvasElement>(null);
    const plotRef = useRef<HTMLCanvasElement>(null);
    const simRef = useRef<WaveTray | null>(null);
    const tracesRef = useRef<number[][]>([]);
    const splashesRef = useRef<Splash[]>([]);
    const pausedRef = useRef(false);
    const speedRef = useRef(1);
    const [grams, setGrams] = useState(20);
    const [motors, setMotors] = useState(false);
    const [paused, setPaused] = useState(false);
    const [slow, setSlow] = useState(false);
    const [touched, setTouched] = useState(false);

    // Created on first use in an effect or handler, never during render.
    // Extra damping of 0.6/s stands in for foam-lined walls that soak up
    // reflections; with bare walls the tray's own resonances dominate.
    const getSim = () => (simRef.current ??= new WaveTray({ extraDamping: 0.6 }));

    useEffect(() => { pausedRef.current = paused; }, [paused]);
    useEffect(() => { speedRef.current = slow ? 0.25 : 1; }, [slow]);
    useEffect(() => { getSim().motors = motors; }, [motors]);

    useEffect(() => {
        const sim = getSim();
        const tray = trayRef.current!;
        const plot = plotRef.current!;
        const field = new Float32Array(GRID * GRID);
        const buffer = document.createElement("canvas");
        buffer.width = GRID;
        buffer.height = GRID;
        const bufferCtx = buffer.getContext("2d")!;
        const image = bufferCtx.createImageData(GRID, GRID);
        let palette = LIGHT;
        let visible = true;
        let frame = 0;
        let last = performance.now();
        let pending = 0;
        let nextSample = 0;

        const readTheme = () => {
            palette = document.documentElement.getAttribute("data-theme") === "dark" ? DARK : LIGHT;
        };
        readTheme();
        const themeWatch = new MutationObserver(readTheme);
        themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

        const fit = (canvas: HTMLCanvasElement) => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = Math.round(canvas.clientWidth * dpr);
            const h = Math.round(canvas.clientHeight * dpr);
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }
            return dpr;
        };

        const drawTray = () => {
            const dpr = fit(tray);
            const ctx = tray.getContext("2d")!;
            const W = tray.width;
            const px = W / sim.L;   // canvas px per m
            sim.field(GRID, field);

            const { still, crest, trough } = palette;
            const data = image.data;
            for (let j = 0; j < GRID; j++) {
                for (let i = 0; i < GRID; i++) {
                    const idx = j * GRID + i;
                    const v = Math.tanh(field[idx] / HEIGHT_SCALE);
                    // light from the upper left, from the local slope
                    const right = i < GRID - 1 ? field[idx + 1] : field[idx];
                    const down = j < GRID - 1 ? field[idx + GRID] : field[idx];
                    const shade = Math.max(-0.25, Math.min(0.25, ((field[idx] - right) + (field[idx] - down)) * 300));
                    const target = v > 0 ? crest : trough;
                    const a = Math.abs(v);
                    for (let c = 0; c < 3; c++) {
                        const base = still[c] + (target[c] - still[c]) * a;
                        data[idx * 4 + c] = Math.max(0, Math.min(255, base + shade * 255));
                    }
                    data[idx * 4 + 3] = 255;
                }
            }
            bufferCtx.putImageData(image, 0, 0);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(buffer, 0, 0, W, W);

            // Readout grid: each point is lifted on screen by its height
            const lift = (LIFT * W) / 600;
            const floatLift = (FLOAT_LIFT * W) / 600;
            const step = GRID / READOUT;
            ctx.lineWidth = 1 * dpr;
            for (let gy = 0; gy < READOUT; gy++) {
                for (let gx = 0; gx < READOUT; gx++) {
                    const i0 = Math.floor((gx + 0.5) * step - 0.5);
                    const j0 = Math.floor((gy + 0.5) * step - 0.5);
                    const h = (field[j0 * GRID + i0] + field[j0 * GRID + i0 + 1]
                        + field[(j0 + 1) * GRID + i0] + field[(j0 + 1) * GRID + i0 + 1]) / 4;
                    const x = ((gx + 0.5) / READOUT) * W;
                    const y = ((gy + 0.5) / READOUT) * W;
                    const dy = Math.max(-14 * dpr, Math.min(14 * dpr, h * lift));
                    ctx.strokeStyle = palette.ink;
                    ctx.globalAlpha = 0.35;
                    ctx.beginPath();
                    ctx.moveTo(x - 3 * dpr, y);
                    ctx.lineTo(x + 3 * dpr, y);
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, y - dy);
                    ctx.stroke();
                    ctx.globalAlpha = 0.85;
                    ctx.fillStyle = palette.ink;
                    ctx.beginPath();
                    ctx.arc(x, y - dy, 2.2 * dpr, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
            ctx.globalAlpha = 1;

            // Sinking objects leave a fading ring
            const splashes = splashesRef.current;
            for (let s = splashes.length - 1; s >= 0; s--) {
                const age = sim.time - splashes[s].t;
                if (age > 1.2 || age < 0) { splashes.splice(s, 1); continue; }
                ctx.strokeStyle = palette.ink;
                ctx.globalAlpha = 0.6 * (1 - age / 1.2);
                ctx.lineWidth = 1.5 * dpr;
                ctx.beginPath();
                ctx.arc(splashes[s].x * px, splashes[s].y * px, OBJECT_RADIUS * px * (1 + age * 2), 0, 2 * Math.PI);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;

            // Floats, to scale, lifted by their height like the readout dots
            sim.floats.forEach((f, n) => {
                const x = f.x * px;
                const y = f.y * px - Math.max(-14 * dpr, Math.min(14 * dpr, f.z * floatLift));
                const r = OBJECT_RADIUS * px;
                ctx.fillStyle = FLOAT_COLORS[n % FLOAT_COLORS.length];
                ctx.strokeStyle = "rgba(0,0,0,0.45)";
                ctx.lineWidth = 1.5 * dpr;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = "#fff";
                ctx.font = `${Math.round(r * 0.8)}px Inter, sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(String(n + 1), x, y + r * 0.04);
            });

            // Scale bar and clock
            ctx.fillStyle = palette.ink;
            ctx.strokeStyle = palette.ink;
            ctx.lineWidth = 2 * dpr;
            const bar = 0.1 * px;
            const pad = 12 * dpr;
            ctx.beginPath();
            ctx.moveTo(pad, W - pad);
            ctx.lineTo(pad + bar, W - pad);
            ctx.stroke();
            ctx.font = `${11 * dpr}px Inter, sans-serif`;
            ctx.textAlign = "left";
            ctx.textBaseline = "bottom";
            ctx.fillText("10 cm", pad, W - pad - 4 * dpr);
            ctx.textAlign = "right";
            ctx.fillText(`t = ${sim.time.toFixed(1)} s`, W - pad, W - pad + 2 * dpr);
        };

        const drawPlot = () => {
            const dpr = fit(plot);
            const ctx = plot.getContext("2d")!;
            const W = plot.width;
            const H = plot.height;
            ctx.fillStyle = palette.panel;
            ctx.fillRect(0, 0, W, H);
            ctx.font = `${11 * dpr}px Inter, sans-serif`;

            const dial = Math.min(H, 150 * dpr);
            const left = 40 * dpr;
            const right = W - dial - 12 * dpr;
            const top = 20 * dpr;
            const bottom = H - 22 * dpr;
            const traces = tracesRef.current;

            let lo = Infinity;
            let hi = -Infinity;
            for (const tr of traces) for (const v of tr) if (Number.isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
            if (!Number.isFinite(lo)) { lo = 2.2; hi = 3.2; }
            const mid = (lo + hi) / 2;
            const span = Math.max(0.15, (hi - lo) * 1.2);
            lo = mid - span / 2;
            hi = mid + span / 2;
            const yOf = (v: number) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);

            ctx.strokeStyle = palette.grid;
            ctx.fillStyle = palette.muted;
            ctx.lineWidth = 1 * dpr;
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            const gridStep = span > 0.8 ? 0.2 : span > 0.4 ? 0.1 : span > 0.2 ? 0.05 : 0.02;
            for (let v = Math.ceil(lo / gridStep) * gridStep; v <= hi; v += gridStep) {
                ctx.beginPath();
                ctx.moveTo(left, yOf(v));
                ctx.lineTo(right, yOf(v));
                ctx.stroke();
                ctx.fillText(v.toFixed(2), left - 6 * dpr, yOf(v));
            }
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText("Bobbing frequency (Hz), last 20 s", left, 4 * dpr);

            const samples = HISTORY / SAMPLE;
            traces.forEach((tr, n) => {
                ctx.strokeStyle = FLOAT_COLORS[n % FLOAT_COLORS.length];
                ctx.lineWidth = 2 * dpr;
                ctx.beginPath();
                let pen = false;
                tr.forEach((v, k) => {
                    const x = right - ((tr.length - 1 - k) / samples) * (right - left);
                    if (!Number.isFinite(v)) { pen = false; return; }
                    if (pen) ctx.lineTo(x, yOf(v)); else ctx.moveTo(x, yOf(v));
                    pen = true;
                });
                ctx.stroke();
            });
            if (traces.length === 0) {
                ctx.fillStyle = palette.muted;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("Drop a light object to add a float", (left + right) / 2, (top + bottom) / 2);
            }

            // Phase dial: each float's phase relative to float 1
            const cx = W - dial / 2 - 4 * dpr;
            const cy = H / 2 + 6 * dpr;
            const R = dial / 2 - 22 * dpr;
            ctx.strokeStyle = palette.grid;
            ctx.lineWidth = 1.5 * dpr;
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fillStyle = palette.muted;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText("Phase vs. float 1", cx, 4 * dpr);
            const floats = sim.floats;
            if (floats.length > 0) {
                const ref = floats[0].phase;
                floats.forEach((f, n) => {
                    const a = f.phase - ref - Math.PI / 2;
                    ctx.fillStyle = FLOAT_COLORS[n % FLOAT_COLORS.length];
                    ctx.beginPath();
                    ctx.arc(cx + R * Math.cos(a), cy + R * Math.sin(a), 6 * dpr, 0, 2 * Math.PI);
                    ctx.fill();
                });
            }
        };

        const tick = (now: number) => {
            frame = requestAnimationFrame(tick);
            const elapsed = Math.min(0.05, (now - last) / 1000);
            last = now;
            if (!visible) return;
            if (!pausedRef.current) {
                pending += elapsed * speedRef.current;
                while (pending >= DT) {
                    pending -= DT;
                    sim.step(DT);
                    if (sim.time >= nextSample || nextSample - sim.time > SAMPLE) {
                        nextSample = sim.time + SAMPLE;
                        sim.floats.forEach((f, n) => {
                            const tr = tracesRef.current[n];
                            tr.push(sim.measuredFrequency(f) ?? NaN);
                            if (tr.length > HISTORY / SAMPLE) tr.shift();
                        });
                    }
                }
            }
            drawTray();
            drawPlot();
        };

        const seen = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            last = performance.now();
        });
        seen.observe(tray);
        frame = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(frame);
            seen.disconnect();
            themeWatch.disconnect();
        };
    }, []);

    const dropAt = (x: number, y: number, mass: number) => {
        const sim = getSim();
        const s = OBJECT_RADIUS;
        x = Math.max(s, Math.min(sim.L - s, x));
        y = Math.max(s, Math.min(sim.L - s, y));
        if (mass < FLOAT_LIMIT && sim.floats.length >= MAX_FLOATS) {
            sim.floats.shift();
            tracesRef.current.shift();
        }
        const before = sim.floats.length;
        sim.drop(x, y, mass);
        if (sim.floats.length > before) {
            tracesRef.current.push([]);
        } else {
            splashesRef.current.push({ x, y, t: sim.time });
        }
        setTouched(true);
    };

    const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const L = getSim().L;
        dropAt(((e.clientX - rect.left) / rect.width) * L, ((e.clientY - rect.top) / rect.height) * L, grams / 1000);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLCanvasElement>) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        const L = getSim().L;
        dropAt(L * (0.2 + 0.6 * Math.random()), L * (0.2 + 0.6 * Math.random()), grams / 1000);
    };

    const clear = () => {
        getSim().clear();
        tracesRef.current = [];
        splashesRef.current = [];
    };

    // Three floats, 6 cm apart, started at random phases with motors on.
    // In a line they lock within about 10 s; in a triangle they never settle.
    const preset = (shape: "line" | "triangle") => {
        clear();
        const sim = getSim();
        const c = sim.L / 2;
        const layout: [number, number, number][] = shape === "line"
            ? [[0.022, c - 0.06, c], [0.020, c, c], [0.024, c + 0.06, c]]
            : [[0.020, c - 0.03, c + 0.017], [0.022, c + 0.03, c + 0.017], [0.024, c, c - 0.035]];
        layout.forEach(([mass, x, y], n) => {
            dropAt(x, y, mass);
            const f = sim.floats[n];
            const phase = 2 * Math.PI * Math.random();
            f.z = 0.002 * Math.cos(phase);
            f.vz = -0.002 * f.omega0 * Math.sin(phase);
        });
        sim.amp.fill(0);
        sim.vel.fill(0);
        setMotors(true);
        setPaused(false);
    };

    return (
        <figure className="sim" aria-label="Interactive wave tray simulation">
            <div className="sim-tray">
                <canvas
                    ref={trayRef}
                    className="sim-canvas"
                    tabIndex={0}
                    role="img"
                    aria-label="A 30 cm square tray of water seen from above, with an 8 by 8 grid of readout points. Click or press Enter to drop an object."
                    onPointerDown={onPointerDown}
                    onKeyDown={onKeyDown}
                />
                {!touched && <p className="sim-hint">Click the water to drop an object</p>}
            </div>
            <div className="sim-controls">
                <label className="sim-mass">
                    <span>Mass</span>
                    <input
                        type="range" min={8} max={60} step={0.5} value={grams}
                        onChange={(e) => setGrams(Number(e.target.value))}
                    />
                    <output>{describe(grams)}</output>
                </label>
                <div className="sim-buttons">
                    <button type="button" onClick={() => preset("line")}>Three in a line</button>
                    <button type="button" onClick={() => preset("triangle")}>Three in a triangle</button>
                    <button type="button" aria-pressed={motors} onClick={() => setMotors((m) => !m)}>
                        Drive {motors ? "on" : "off"}
                    </button>
                    <button type="button" aria-pressed={slow} onClick={() => setSlow((v) => !v)}>
                        ¼ speed
                    </button>
                    <button type="button" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
                        {paused ? "Play" : "Pause"}
                    </button>
                    <button type="button" onClick={clear}>Clear</button>
                </div>
            </div>
            <canvas ref={plotRef} className="sim-plot" role="img" aria-label="Each float's bobbing frequency over the last 20 seconds, and its phase relative to float 1." />
        </figure>
    );
}
