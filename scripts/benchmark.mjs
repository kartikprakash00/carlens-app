// Run against an already-started production server. Never print response bodies or cookies.
const base = process.env.BENCHMARK_URL || 'http://localhost:3000';
const carId = process.env.BENCHMARK_CAR_ID;
const paths = ['/', '/cars', ...(carId ? [`/cars/${encodeURIComponent(carId)}`] : []), '/saved-cars', '/reservations', '/admin'];
for (const path of paths) {
    for (let run = 0; run < 4; run++) {
        const start = performance.now();
        try {
            const response = await fetch(new URL(path, base), {
                redirect: 'manual', signal: AbortSignal.timeout(45000),
                headers: process.env.BENCHMARK_COOKIE ? { cookie: process.env.BENCHMARK_COOKIE } : {},
            });
            const headersMs = performance.now() - start;
            const body = await response.arrayBuffer();
            console.log(JSON.stringify({ path, run: run === 0 ? 'first' : `warm-${run}`, status: response.status,
                headersMs: Math.round(headersMs), totalMs: Math.round(performance.now() - start), bytes: body.byteLength }));
        } catch (error) {
            console.log(JSON.stringify({ path, run, error: error.name, durationMs: Math.round(performance.now() - start) }));
        }
    }
}
if (!carId) console.log('Car-detail timing skipped: set BENCHMARK_CAR_ID to a real inventory ID.');
if (!process.env.BENCHMARK_COOKIE) console.log('Protected routes measure signed-out responses only; authenticated views require BENCHMARK_COOKIE.');
