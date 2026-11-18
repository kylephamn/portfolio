// ASCII koi pond behind the hero text.
// Water, ripples and lily pads use a 12px character grid; fish use a finer 6px grid
// so their bodies can be shaded. No dependencies.
(() => {
    const hero = document.getElementById('home');
    const cv = document.getElementById('koi-pond');
    if (!hero || !cv) return;
    const ctx = cv.getContext('2d');
    const content = hero.querySelector('.koi-content');

    const FONT = 'ui-monospace, Menlo, Consolas, monospace';
    const CH = 13, FH = 6.4, STEP = 1000 / 60;
    let W, H, CW, FW, COLS, ROWS, FC, FR, stamp, pstamp, scale = 1;
    let fid = 0, t = 0, titleBox = { x0: 0, x1: 0, y0: 0, y1: 0 };

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = hero.clientWidth; H = hero.clientHeight;
        cv.width = W * dpr; cv.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.font = '12px ' + FONT; CW = ctx.measureText('M').width;
        ctx.font = '6px ' + FONT; FW = ctx.measureText('M').width;
        COLS = Math.ceil(W / CW); ROWS = Math.ceil(H / CH);
        FC = Math.ceil(W / FW); FR = Math.ceil(H / FH);
        stamp = new Int32Array(FC * FR); pstamp = new Int32Array(COLS * ROWS);
        scale = Math.max(0.85, Math.min(1.3, W / 1200));
        if (content) {
            const h = hero.getBoundingClientRect(), c = content.getBoundingClientRect();
            titleBox = { x0: c.left - h.left, x1: c.right - h.left, y0: c.top - h.top, y1: c.bottom - h.top };
        }
    }
    resize();

    // Characters are collected per color and drawn in batches to keep fillStyle changes low.
    const BK = new Map();
    const bput = (x, y, c, col) => { let b = BK.get(col); if (!b) BK.set(col, b = []); b.push(x, y, c); };
    function bflush() {
        for (const [col, b] of BK) { ctx.fillStyle = col; for (let i = 0; i < b.length; i += 3) ctx.fillText(b[i + 2], b[i], b[i + 1]); }
        BK.clear();
    }
    const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
    const rand = Math.random;

    function shade(h, f) {
        const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) * f | 0);
        return `rgb(${c[0]},${c[1]},${c[2]})`;
    }
    const HEX = { W: '#f3f1ea', R: '#e2412f', K: '#6a6a70', G: '#f4b740', O: '#ff8a3d', B: '#b5804f', AG: '#ecc66e', AR: '#e3563a' };
    const PAL = {};
    for (const k in HEX) PAL[k] = { b: [shade(HEX[k], .58), shade(HEX[k], .8), shade(HEX[k], 1)], f: [shade(HEX[k], .38), shade(HEX[k], .6)] };
    const RAMP = '.:-=+*#%@';

    // Body half-width along the spine (u: 0 = nose, 1 = tail base).
    const KOI = [[0, .3], [.03, .55], [.08, .8], [.2, .97], [.32, 1], [.5, .86], [.68, .6], [.82, .36], [.9, .24], [.93, 0]];
    const ARO = [[0, .25], [.03, .5], [.1, .8], [.2, .95], [.55, 1], [.75, .8], [.88, .5], [.92, 0]];
    function prof(A, u) {
        if (u <= A[0][0]) return A[0][1];
        for (let i = 1; i < A.length; i++) if (u <= A[i][0]) { const p = A[i - 1], q = A[i]; return p[1] + (q[1] - p[1]) * (u - p[0]) / (q[0] - p[0]); }
        return 0;
    }

    // kohaku, ogon, showa, tancho, butterfly, sanke, chagoi
    const TYPES = [
        { base: 'W', p: [['R', 3, .5]] },
        { base: 'G', metal: 1 },
        { base: 'K', p: [['R', 3, .55], ['W', 2, .45]] },
        { base: 'W', fixed: { u: .08, v: 0, r: .62, c: 'R' } },
        { base: 'O', p: [['W', 2, .5]], fin: 1.9, tail: 1.45, ext: .5 },
        { base: 'W', p: [['R', 3, .5], ['K', 3, .22]] },
        { base: 'B' },
    ];
    const fish = [];
    let ti = 0;

    function spawnPos() {
        if (rand() < .5) return { x: 60 + rand() * (W - 120), y: 50 + rand() * (H - 100) };
        return outsidePoint(60);
    }
    function outsidePoint(m) {
        const e = rand() * 4 | 0;
        return e === 0 ? { x: -m, y: rand() * H } : e === 1 ? { x: W + m, y: rand() * H } : e === 2 ? { x: rand() * W, y: -m } : { x: rand() * W, y: H + m };
    }
    function layBody(f, p) {
        const a = Math.atan2(H / 2 - p.y, W / 2 - p.x) + (rand() - .5) * 1.5;
        f.a = a; f.s = f.L / (f.N - 1); f.segs = [];
        for (let i = 0; i < f.N; i++) f.segs.push({ x: p.x - Math.cos(a) * f.s * i, y: p.y - Math.sin(a) * f.s * i });
    }
    const common = () => ({ ph: rand() * 99, boost: 0, off: 0, offMax: 120, tgt: null, ret: 0 });

    function makeKoi() {
        const T = TYPES[ti++ % TYPES.length], L = (95 + rand() * 30) * scale;
        const f = Object.assign(common(), {
            kind: 'koi', L, Wd: L * .155, N: 14, prof: KOI, end: .93, ext: T.ext || .3, tailW: T.tail || 1, finS: T.fin || 1, fork: 1,
            base: T.base, metal: T.metal, patches: [], sp: (.55 + rand() * .4) * scale, wig: .06, wf: .2 + rand() * .06, turn: .1,
            fins: [{ a: .17, b: .4, len: 1.25, flap: 1, grow: 0 }, { a: .55, b: .66, len: .55, flap: 0, grow: 0 }],
        });
        if (T.p) for (const [c, n, r] of T.p) for (let j = 0; j < n; j++)
            f.patches.push({ u: .1 + rand() * .72, v: (rand() - .5) * 1.3, r: r * (.8 + rand() * .6), c, s: rand() * 9 });
        if (T.fixed) f.patches.push(Object.assign({ s: 0 }, T.fixed));
        layBody(f, spawnPos());
        fish.push(f);
    }
    function makeArowana() {
        const f = Object.assign(common(), {
            kind: 'aro', L: 240 * scale, Wd: 12.5 * scale, N: 20, prof: ARO, end: .92, ext: .2, tailW: 1.15, finS: 1, fork: 0,
            sp: .48 * scale, wig: .025, wf: .12, turn: .05, offMax: 150, ridge: [.62, .9],
            fins: [{ a: .12, b: .24, len: 1.7, flap: 1, grow: 0 }, { a: .6, b: .9, len: .85, flap: 0, grow: 1 }],
        });
        layBody(f, { x: -120, y: H * .7 });
        fish.push(f);
    }
    const koiCount = Math.max(4, Math.min(9, Math.round(W * H / 110000)));
    for (let i = 0; i < koiCount; i++) makeKoi();
    makeArowana();

    function pat(f, u, v) {
        for (const p of f.patches) {
            const dx = (u - p.u) * f.L / f.Wd, dy = v / f.Wd - p.v, d = Math.hypot(dx, dy);
            if (d < p.r * (1 + .3 * Math.sin(Math.atan2(dy, dx) * 3 + p.s))) return p.c;
        }
        return f.base;
    }

    const pads = [[.08, .2, 40, 1], [.92, .24, 34, 0], [.12, .82, 46, 1], [.86, .8, 38, 1], [.52, .93, 28, 0], [.34, .09, 24, 0], [.7, .1, 30, 1]]
        .map(p => ({ fx: p[0], fy: p[1], x: p[0] * W, y: p[1] * H, r: p[2] * scale, lotus: p[3], rot: rand() * 6.28, vx: 0, vy: 0, ph: rand() * 99 }));

    let mx = -999, my = -999, ripples = [];
    function local(e) { const b = hero.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; }
    hero.addEventListener('pointermove', e => { [mx, my] = local(e); });
    hero.addEventListener('pointerleave', () => { mx = my = -999; });
    hero.addEventListener('click', e => { const [x, y] = local(e); ripples.push({ x, y, t0: t }); });

    function stepFish(f) {
        const P = f.segs, h = P[0];
        f.a += (rand() - .5) * f.turn + Math.sin(t * .015 + f.ph) * f.turn * .15;
        let fx = 0, fy = 0;
        // Fish may leave the hero, but get called back after a few seconds out of view.
        const out = h.x < -20 || h.x > W + 20 || h.y < -20 || h.y > H + 20;
        const far = Math.max(-h.x, h.x - W, -h.y, h.y - H);
        if (out) {
            f.off++;
            if ((f.off > f.offMax || far > 230) && !f.ret) { f.ret = 1; f.tgt = { x: W * (.15 + rand() * .7), y: H * (.15 + rand() * .7) }; }
        } else if (f.off) { f.off = 0; f.offMax = 90 + rand() * 220; }
        if (!out && !f.tgt && rand() < .0018) { f.tgt = outsidePoint(160); f.ret = 0; }
        if (f.tgt) {
            const dx = f.tgt.x - h.x, dy = f.tgt.y - h.y, d = Math.hypot(dx, dy) || 1;
            fx += dx / d * 1.3; fy += dy / d * 1.3;
            if (f.ret) f.boost = Math.max(f.boost, 1.2); // hurry back into view
            if (d < 50) { f.tgt = null; f.ret = 0; }
        }
        const dx = h.x - mx, dy = h.y - my, d = Math.hypot(dx, dy) || 1;
        if (d < 110) { fx += dx / d * 3; fy += dy / d * 3; f.boost = Math.max(f.boost, 1.6); }
        for (const r of ripples) if (t - r.t0 < 30) {
            const rx = h.x - r.x, ry = h.y - r.y, rd = Math.hypot(rx, ry) || 1;
            if (rd < 170) { fx += rx / rd * 3; fy += ry / rd * 3; f.boost = Math.max(f.boost, 2.2); }
        }
        if (fx || fy) { const df = wrapA(Math.atan2(fy, fx) - f.a); f.a += Math.max(-.07, Math.min(.07, df * .08)); }
        f.boost *= .97;
        const sp = f.sp * (1 + f.boost), wg = Math.sin(t * f.wf * (1 + f.boost * .5) + f.ph) * f.wig * 4;
        h.x += Math.cos(f.a + wg) * sp; h.y += Math.sin(f.a + wg) * sp;
        for (let i = 1; i < P.length; i++) {
            const p = P[i - 1], s = P[i], ex = p.x - s.x, ey = p.y - s.y, dd = Math.hypot(ex, ey) || 1;
            if (dd > f.s) { s.x += ex * (dd - f.s) / dd; s.y += ey * (dd - f.s) / dd; }
        }
        for (const p of pads) if (Math.hypot(h.x - p.x, h.y - p.y) < p.r) { p.vx += Math.cos(f.a) * .006 * sp; p.vy += Math.sin(f.a) * .006 * sp; }
    }

    // Rasterize a fish onto the fine grid: each cell finds its nearest spine point,
    // giving (u along body, v across body), which then decides body/fin/eye and shading.
    function drawFish(f) {
        const P = f.segs, N = P.length;
        const lx = P[N - 1].x - P[N - 2].x, ly = P[N - 1].y - P[N - 2].y, ll = Math.hypot(lx, ly) || 1;
        const E = { x: P[N - 1].x + lx / ll * f.L * f.ext, y: P[N - 1].y + ly / ll * f.L * f.ext };
        let x0 = E.x, x1 = E.x, y0 = E.y, y1 = E.y;
        for (const p of P) { if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y; }
        const pad = f.Wd * Math.max(f.finS, f.tailW) * 1.9 + 4;
        const gx0 = Math.max(0, Math.floor((x0 - pad) / FW)), gx1 = Math.min(FC - 1, Math.ceil((x1 + pad) / FW));
        const gy0 = Math.max(0, Math.floor((y0 - pad) / FH)), gy1 = Math.min(FR - 1, Math.ceil((y1 + pad) / FH));
        if (gx0 > gx1 || gy0 > gy1) return; // fully off-screen

        const S = [];
        for (let i = 0; i < N - 1; i++) {
            const a = P[i], b = P[i + 1], dx = b.x - a.x, dy = b.y - a.y;
            S.push([a.x, a.y, dx, dy, dx * dx + dy * dy || 1, i / (N - 1), 1 / (N - 1)]);
        }
        { const a = P[N - 1], dx = E.x - a.x, dy = E.y - a.y; S.push([a.x, a.y, dx, dy, dx * dx + dy * dy || 1, 1, f.ext]); }
        const lim = pad * pad, T0 = f.end - .08, span = 1 + f.ext - T0;

        for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
            const ci = gy * FC + gx;
            if (stamp[ci] === fid) continue;
            const px = gx * FW + FW / 2, py = gy * FH + FH / 2;
            let bd = 1e9, u = 0, bc = 0;
            for (const s of S) {
                let k = ((px - s[0]) * s[2] + (py - s[1]) * s[3]) / s[4];
                k = k < 0 ? 0 : k > 1 ? 1 : k;
                const qx = s[0] + s[2] * k - px, qy = s[1] + s[3] * k - py, d2 = qx * qx + qy * qy;
                if (d2 < bd) { bd = d2; u = s[5] + s[6] * k; bc = s[2] * (py - s[1]) - s[3] * (px - s[0]); }
            }
            if (bd > lim) continue;
            const av = Math.sqrt(bd), v = bc >= 0 ? av : -av, w = prof(f.prof, u) * f.Wd;
            let ch = null, col;

            if (u < f.end && av < w) {
                if (u > .045 && u < .085 && Math.abs(av - w * .55) < FW * .7) continue; // eyes
                let b = (1 - (av / w) ** 2) * .7 + .3;
                if (f.kind === 'aro') {
                    const sx = u * f.L / 5, row = Math.floor(v / 4.5 + 50);
                    if (((sx + (row & 1) * .5) % 1) > .78) b *= .5; // scale edges
                    if (u > f.ridge[0] && u < f.ridge[1] && av < f.Wd * .22) { ch = ':'; col = PAL.AR.b[1]; }
                    else { const pc = u > .62 ? PAL.AR : PAL.AG; ch = RAMP[Math.min(8, b * 9 | 0)]; col = pc.b[b > .72 ? 2 : b > .42 ? 1 : 0]; }
                } else {
                    b *= f.metal ? .82 + .18 * Math.sin(u * f.L * .9 + v * .8 + t * .05) : .93 + .07 * Math.sin(u * f.L * 1.1) * Math.sin(v * 1.1);
                    const pc = PAL[pat(f, u, v)];
                    ch = RAMP[Math.min(8, b * 9 | 0)]; col = pc.b[b > .72 ? 2 : b > .42 ? 1 : 0];
                }
            } else {
                let e = -1;
                if (u > T0) { // tail
                    const fu = (u - T0) / span;
                    if (fu <= 1) {
                        const vv = v - Math.sin(fu * 3 - t * .2 + f.ph) * f.Wd * .45 * fu;
                        const tw = f.Wd * f.tailW * (.25 + .95 * Math.sin(fu * Math.PI * .8));
                        const fork = f.fork && fu > .65 && Math.abs(vv) < f.Wd * 1.3 * (fu - .65) / .35;
                        if (!fork && Math.abs(vv) < tw) e = Math.abs(vv) / tw;
                    }
                }
                if (e < 0) for (const fn of f.fins) if (u > fn.a && u < fn.b) {
                    const fu = (u - fn.a) / (fn.b - fn.a);
                    const fl = f.Wd * fn.len * f.finS * (fn.grow ? fu : (1 - fu) * (fu < .15 ? fu / .15 : 1))
                        * (fn.flap ? .75 + .25 * Math.sin(t * .14 + f.ph + (v > 0 ? 0 : 3.14)) : 1);
                    if (av > w && av - w < fl) { e = (av - w) / fl; break; }
                }
                if (e >= 0) {
                    const pc = f.kind === 'aro' ? PAL.AR : PAL[pat(f, Math.min(u, .9), 0)];
                    ch = e > .82 ? '\'' : Math.sin(u * f.L * .7 + av * .2) > 0 ? ':' : '.';
                    col = pc.f[e < .5 ? 1 : 0];
                }
            }
            if (ch) { stamp[ci] = fid; bput(gx * FW, gy * FH, ch, col); }
        }

        if (f.kind === 'aro') { // barbels
            const h = P[0], dx = (P[0].x - P[1].x) / f.s, dy = (P[0].y - P[1].y) / f.s;
            for (let k = 3; k < 16; k += 2.5) for (const sg of [-1, 1]) {
                const x = h.x + dx * k - dy * (2 + k * .3) * sg, y = h.y + dy * k + dx * (2 + k * .3) * sg;
                const gx = Math.floor(x / FW), gy = Math.floor(y / FH);
                if (gx >= 0 && gy >= 0 && gx < FC && gy < FR && stamp[gy * FC + gx] !== fid) { stamp[gy * FC + gx] = fid; bput(gx * FW, gy * FH, '.', PAL.AG.b[1]); }
            }
        }
    }

    function stepPad(p) {
        // Keep pads off the text: push out through whichever side of the text block is closest.
        const b = titleBox, m = p.r * .6;
        if (p.x > b.x0 - m && p.x < b.x1 + m && p.y > b.y0 - m && p.y < b.y1 + m) {
            const l = p.x - (b.x0 - m), r = b.x1 + m - p.x, u = p.y - (b.y0 - m), d = b.y1 + m - p.y, k = Math.min(l, r, u, d);
            if (k === l) p.vx -= .006; else if (k === r) p.vx += .006; else if (k === u) p.vy -= .006; else p.vy += .006;
        }
        if (p.x < p.r * .4) p.vx += .01; if (p.x > W - p.r * .4) p.vx -= .01;
        if (p.y < p.r * .4) p.vy += .01; if (p.y > H - p.r * .4) p.vy -= .01;
        const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy) || 1;
        if (d < p.r + 40) { p.vx += dx / d * .03; p.vy += dy / d * .03; }
        for (const r of ripples) {
            const age = t - r.t0, rad = age * 2.2, rx = p.x - r.x, ry = p.y - r.y, rd = Math.hypot(rx, ry) || 1;
            if (Math.abs(rd - rad) < p.r * .6 && age < 110) { p.vx += rx / rd * .04; p.vy += ry / rd * .04; }
        }
        p.vx += Math.sin(t * .004 + p.ph) * .0015; p.vy += Math.cos(t * .003 + p.ph) * .0015;
        p.vx *= .985; p.vy *= .985; p.x += p.vx; p.y += p.vy;
        p.rot += .0012 + p.vx * .004;
    }

    let rects = [];
    function putP(px, py, c, col) { // pad cells get a black backing so fish pass underneath
        const gx = Math.floor(px / CW), gy = Math.floor(py / CH);
        if (gx < 0 || gy < 0 || gx >= COLS || gy >= ROWS) return;
        const i = gy * COLS + gx;
        if (pstamp[i] === fid) return;
        pstamp[i] = fid; rects.push(gx * CW, gy * CH); bput(gx * CW, gy * CH, c, col);
    }
    function drawPad(p) {
        if (p.lotus) {
            const lx = p.x - Math.cos(p.rot) * p.r * .35, ly = p.y - Math.sin(p.rot) * p.r * .35;
            const bloom = .5 + .5 * Math.sin(t * .006 + p.ph), pr = t * .003 + p.ph;
            if (bloom < .22) { putP(lx, ly, 'o', '#f4a3c0'); putP(lx, ly - CH, '^', '#f7c1d4'); }
            else {
                putP(lx, ly, '@', '#ffd166');
                const R2 = CW * (.6 + .6 * bloom);
                for (let i = 0; i < 4; i++) { const a = -pr * 1.3 + i * 1.571 + .4; putP(lx + Math.cos(a) * R2, ly + Math.sin(a) * R2 * .75, 'o', '#ffd1e0'); }
                const R1 = CW * (.9 + 1.9 * bloom);
                for (let i = 0; i < 8; i++) { const a = pr + i * .785; putP(lx + Math.cos(a) * R1, ly + Math.sin(a) * R1 * .75, bloom > .6 ? '*' : '\'', '#f08fb3'); }
            }
        }
        const x0 = Math.floor((p.x - p.r - CW) / CW), x1 = Math.ceil((p.x + p.r + CW) / CW);
        const y0 = Math.floor((p.y - p.r - CH) / CH), y1 = Math.ceil((p.y + p.r + CH) / CH);
        for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) {
            const cx = gx * CW + CW / 2, cy = gy * CH + CH / 2, dx = cx - p.x, dy = cy - p.y, d = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
            const rr = p.r * (1 + .05 * Math.sin(ang * 6 + t * .03 + p.ph));
            if (d > rr) continue;
            const rel = wrapA(ang - p.rot);
            if (Math.abs(rel) < .28 && d > rr * .12) continue; // notch
            let c = '#', col = '#1f5a35';
            if (d > rr - CW * 1.1) { c = 'o'; col = '#4f9e5e'; }
            else {
                for (let v = 1; v < 6; v++) if (Math.abs(wrapA(rel - v * 1.047)) < .09 && d > CW) { c = ':'; col = '#5fae6c'; }
                if (c === '#' && (gx * 7 + gy * 13) % 11 === 0) { c = '%'; col = '#2a6e41'; }
            }
            putP(cx, cy, c, col);
        }
    }

    function drawWater() {
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
            const v = Math.sin(x * .28 + t * .018) + Math.sin(y * .55 - t * .013) + Math.sin((x + y) * .13 + t * .007);
            if (v > 2.35) bput(x * CW, y * CH, '~', '#22384d');
            else if (v > 1.95) bput(x * CW, y * CH, '·', '#17283a');
            else if ((x * 31 + y * 17 + Math.floor(t * .01)) % 97 === 0) bput(x * CW, y * CH, '.', '#142231');
        }
    }
    function ring(x, y, rad, n, ch, col) {
        for (let i = 0; i < n; i++) {
            const a = i / n * 6.283, gx = Math.floor((x + Math.cos(a) * rad) / CW), gy = Math.floor((y + Math.sin(a) * rad * .85) / CH);
            bput(gx * CW, gy * CH, ch, col);
        }
    }
    function drawRipples() {
        ripples = ripples.filter(r => t - r.t0 < 130);
        for (const r of ripples) {
            const age = t - r.t0, rad = age * 2.2, al = 1 - age / 130, n = Math.max(14, rad * .45);
            ring(r.x, r.y, rad, n, age < 45 ? 'o' : '·', `rgba(160,200,235,${al.toFixed(2)})`);
            if (rad > 26) ring(r.x, r.y, rad - 24, n * .7, '·', `rgba(160,200,235,${(al * .5).toFixed(2)})`);
        }
    }

    function update() {
        t++;
        if (rand() < .004) ripples.push({ x: rand() * W, y: rand() * H, t0: t });
        fish.forEach(stepFish);
        pads.forEach(stepPad);
    }
    function render() {
        fid++;
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
        ctx.textBaseline = 'top';
        ctx.font = '12px ' + FONT; drawWater(); bflush();
        ctx.font = '6px ' + FONT; for (const f of fish) drawFish(f); bflush();
        ctx.font = '12px ' + FONT; drawRipples(); bflush();
        rects = []; pads.forEach(drawPad);
        ctx.fillStyle = '#000';
        for (let i = 0; i < rects.length; i += 2) ctx.fillRect(rects[i], rects[i + 1], CW + .5, CH);
        bflush();
    }

    new ResizeObserver(() => {
        resize();
        for (const p of pads) { p.x = Math.min(p.x, W); p.y = Math.min(p.y, H); }
        if (still) render();
    }).observe(hero);

    // Fixed 60Hz simulation so speed is the same on 120Hz displays; pause when the hero is off-screen.
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let running = false, last = 0, acc = 0;
    function loop(now) {
        if (!running) return;
        acc += Math.min(now - last, 100); last = now;
        while (acc >= STEP) { update(); acc -= STEP; }
        render();
        requestAnimationFrame(loop);
    }
    if (still) { for (let i = 0; i < 120; i++) update(); render(); return; }
    new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
        else if (!e.isIntersecting) running = false;
    }).observe(hero);
})();
