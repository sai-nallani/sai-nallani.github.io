// Linear water waves in a square tray, solved exactly mode by mode, with
// optional floats that bob on the surface and push back on it.
//
// Surface height is a sum of the tray's standing modes,
//     η(x, y, t) = Σ a_mn(t) ψ_mn(x, y),   ψ_mn = c_m c_n cos(mπx/L) cos(nπy/L),
// and each mode is a damped oscillator with the finite-depth dispersion relation
//     ω² = (g k + σ k³ / ρ) tanh(k h).
// A float is a mass on a spring tied to the surface under it, calibrated so the
// float and surface together have the hydrostatic stiffness ρgA.

export const RHO = 1000;       // water density, kg/m³
export const GRAVITY = 9.81;   // m/s²
export const SIGMA = 0.0728;   // surface tension of clean water, N/m
export const NU = 1.0e-6;      // kinematic viscosity, m²/s

// Every object is the same cylinder: 3 cm across, 5 cm tall
export const OBJECT_RADIUS = 0.015;
export const OBJECT_AREA = Math.PI * OBJECT_RADIUS ** 2;
export const FLOAT_LIMIT = RHO * OBJECT_AREA * 0.05;     // ≈ 0.0353 kg; heavier objects sink
export const ADDED_MASS = (4 / 3) * RHO * OBJECT_RADIUS ** 3;
const SPRING = RHO * GRAVITY * OBJECT_AREA;              // hydrostatic stiffness, N/m

// Bobbing frequency (rad/s) of an isolated float on still water
export function bobFrequency(mass: number): number {
    return Math.sqrt(SPRING / (mass + ADDED_MASS));
}

export interface TrayFloat {
    x: number;
    y: number;
    mass: number;
    z: number;            // height relative to equilibrium, m
    vz: number;
    omega0: number;       // bobFrequency(mass)
    weights: Float64Array; // footprint projected onto each mode
    spring: number;       // N/m, see drop()
    phase: number;        // unwrapped phase, rad
    history: { t: number; phase: number }[];
}

export interface TrayOptions {
    size?: number;          // side length L, m
    depth?: number;         // h, m
    modes?: number;         // modes per axis
    extraDamping?: number;  // walls and surface films, 1/s
}

export class WaveTray {
    readonly L: number;
    readonly M: number;
    readonly k: Float64Array;
    readonly omega: Float64Array;
    readonly response: Float64Array;   // k tanh(kh) / ρ: modal acceleration per unit pressure
    readonly amp: Float64Array;
    readonly vel: Float64Array;
    readonly floats: TrayFloat[] = [];
    time = 0;
    motors = false;
    motorGain = 3;            // 1/s
    motorAmplitude = 0.002;   // m
    private readonly gamma: Float64Array;
    private readonly norm: Float64Array;
    private stepDt = 0;
    private readonly c11: Float64Array;
    private readonly c12: Float64Array;
    private readonly c21: Float64Array;
    private readonly c22: Float64Array;
    private cosTable: Float64Array | null = null;
    private scratch: Float64Array | null = null;

    constructor({ size = 0.3, depth = 0.3, modes = 40, extraDamping = 0.15 }: TrayOptions = {}) {
        this.L = size;
        this.M = modes;
        const count = modes * modes;
        this.k = new Float64Array(count);
        this.omega = new Float64Array(count);
        this.response = new Float64Array(count);
        this.gamma = new Float64Array(count);
        this.amp = new Float64Array(count);
        this.vel = new Float64Array(count);
        this.c11 = new Float64Array(count);
        this.c12 = new Float64Array(count);
        this.c21 = new Float64Array(count);
        this.c22 = new Float64Array(count);
        this.norm = new Float64Array(modes);
        for (let m = 0; m < modes; m++) this.norm[m] = Math.sqrt((m === 0 ? 1 : 2) / size);

        for (let m = 0; m < modes; m++) {
            for (let n = 0; n < modes; n++) {
                const i = m * modes + n;
                if (i === 0) continue;   // the mean level carries no waves
                const k = (Math.PI / size) * Math.hypot(m, n);
                const t = Math.tanh(k * depth);
                this.k[i] = k;
                this.omega[i] = Math.sqrt((GRAVITY * k + (SIGMA / RHO) * k ** 3) * t);
                this.response[i] = (k * t) / RHO;
                this.gamma[i] = 2 * NU * k * k + extraDamping;
            }
        }
    }

    // Mode shapes at a point, times a Gaussian footprint of radius s
    project(x: number, y: number, s: number): Float64Array {
        const { M, L } = this;
        const cx = new Float64Array(M);
        const cy = new Float64Array(M);
        for (let m = 0; m < M; m++) {
            cx[m] = this.norm[m] * Math.cos((m * Math.PI * x) / L);
            cy[m] = this.norm[m] * Math.cos((m * Math.PI * y) / L);
        }
        const out = new Float64Array(M * M);
        for (let m = 0; m < M; m++) {
            for (let n = 0; n < M; n++) {
                const i = m * M + n;
                if (i === 0) continue;
                out[i] = cx[m] * cy[n] * Math.exp(-((this.k[i] * s) ** 2) / 4);
            }
        }
        return out;
    }

    // Surface height at the centers of an n×n grid, row-major with y as the row
    field(n: number, out: Float32Array): void {
        const { M, amp } = this;
        if (!this.cosTable || this.cosTable.length !== n * M) {
            this.cosTable = new Float64Array(n * M);
            this.scratch = new Float64Array(n * M);
            for (let j = 0; j < n; j++) {
                for (let m = 0; m < M; m++) {
                    this.cosTable[j * M + m] = this.norm[m] * Math.cos((m * Math.PI * (j + 0.5)) / n);
                }
            }
        }
        const C = this.cosTable;
        const T = this.scratch!;
        for (let m = 0; m < M; m++) {
            for (let j = 0; j < n; j++) {
                let sum = 0;
                for (let q = 0; q < M; q++) sum += amp[m * M + q] * C[j * M + q];
                T[m * n + j] = sum;
            }
        }
        for (let j = 0; j < n; j++) {
            for (let i = 0; i < n; i++) {
                let sum = 0;
                for (let m = 0; m < M; m++) sum += C[i * M + m] * T[m * n + j];
                out[j * n + i] = sum;
            }
        }
    }

    heightAt(x: number, y: number): number {
        const psi = this.project(x, y, 0);
        let h = 0;
        for (let i = 1; i < psi.length; i++) h += psi[i] * this.amp[i];
        return h;
    }

    // An impact leaves a Gaussian crater, η = −D exp(−r²/s²), released from rest.
    // Crater energy ∝ ρ g D² s² is a fixed share of the impact energy m g H,
    // so with s fixed by the object's size, D ∝ √m.
    drop(x: number, y: number, mass: number, depthAt20g = 0.002): void {
        const s = OBJECT_RADIUS;
        const D = depthAt20g * Math.sqrt(mass / 0.02);
        const psi = this.project(x, y, s);
        const volume = Math.PI * s * s * D;
        for (let i = 1; i < psi.length; i++) this.amp[i] -= volume * psi[i];

        if (mass < FLOAT_LIMIT) {
            // The surface under the footprint gives way too, in series with the
            // float's spring. Stiffen the spring so the pair has the true
            // hydrostatic stiffness ρgA; the water's inertia then supplies the
            // added mass on its own.
            let compliance = 0;
            for (let i = 1; i < psi.length; i++) {
                compliance += (psi[i] ** 2 * this.response[i]) / this.omega[i] ** 2;
            }
            this.floats.push({
                x, y, mass, z: -D, vz: 0, omega0: bobFrequency(mass),
                weights: psi, spring: 1 / (1 / SPRING - compliance),
                phase: Math.PI, history: [],
            });
        }
    }

    clear(): void {
        this.amp.fill(0);
        this.vel.fill(0);
        this.floats.length = 0;
        this.time = 0;
    }

    private prepare(dt: number): void {
        if (dt === this.stepDt) return;
        this.stepDt = dt;
        for (let i = 1; i < this.k.length; i++) {
            // Exact step of ä + 2γȧ + ω²a = 0
            const g = this.gamma[i];
            const wd = Math.sqrt(this.omega[i] ** 2 - g * g);
            const e = Math.exp(-g * dt);
            const c = Math.cos(wd * dt);
            const s = Math.sin(wd * dt);
            this.c11[i] = e * (c + (g / wd) * s);
            this.c12[i] = e * (s / wd);
            this.c21[i] = -e * (this.omega[i] ** 2 / wd) * s;
            this.c22[i] = e * (c - (g / wd) * s);
        }
    }

    // Spring forces between floats and the surface, applied as a half-step kick
    private kick(h: number): void {
        const { amp, vel, response } = this;
        for (const f of this.floats) {
            let surface = 0;
            for (let i = 1; i < amp.length; i++) surface += f.weights[i] * amp[i];
            const stretch = f.z - surface;
            let force = -f.spring * stretch;
            if (this.motors) {
                const a2 = f.z ** 2 + (f.vz / f.omega0) ** 2;
                force += f.mass * this.motorGain * (1 - a2 / this.motorAmplitude ** 2) * f.vz;
            }
            f.vz += (force / f.mass) * h;
            const push = f.spring * stretch * h;
            for (let i = 1; i < amp.length; i++) vel[i] += response[i] * push * f.weights[i];
        }
    }

    step(dt: number): void {
        this.prepare(dt);
        this.kick(dt / 2);
        const { amp, vel } = this;
        for (let i = 1; i < amp.length; i++) {
            const a = amp[i];
            const v = vel[i];
            amp[i] = this.c11[i] * a + this.c12[i] * v;
            vel[i] = this.c21[i] * a + this.c22[i] * v;
        }
        for (const f of this.floats) f.z += f.vz * dt;
        this.kick(dt / 2);
        this.time += dt;

        for (const f of this.floats) {
            const raw = Math.atan2(-f.vz / f.omega0, f.z);
            const turn = 2 * Math.PI;
            f.phase += ((((raw - f.phase + Math.PI) % turn) + turn) % turn) - Math.PI;
            f.history.push({ t: this.time, phase: f.phase });
            while (f.history.length > 2 && this.time - f.history[0].t > 3) f.history.shift();
        }
    }

    // Average frequency over the last few seconds, Hz
    measuredFrequency(f: TrayFloat): number | null {
        const h = f.history;
        if (h.length < 2 || h[h.length - 1].t - h[0].t < 1) return null;
        return (h[h.length - 1].phase - h[0].phase) / (2 * Math.PI * (h[h.length - 1].t - h[0].t));
    }

    // Kuramoto order parameter of the floats' phases
    order(): number {
        if (this.floats.length < 2) return 0;
        let re = 0;
        let im = 0;
        for (const f of this.floats) {
            re += Math.cos(f.phase);
            im += Math.sin(f.phase);
        }
        return Math.hypot(re, im) / this.floats.length;
    }
}
