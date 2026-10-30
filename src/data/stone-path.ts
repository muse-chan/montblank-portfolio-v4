import { Grid, gridSvg, random } from '@/lib/pixel-grid';

export const TILE_W = 96;
export const TILE_H = 64;
const STONES = ['#8e8a94', '#88848e', '#98949c', '#928e98', '#8a8590'];
const JOINT = '#5a5660';
const rand = random(1879);

// Flagstones are the cells of a Voronoi diagram over seeds that wrap around the tile, so the tile repeats without seams.
const seeds = Array.from({ length: 40 }, () => ({ x: rand() * TILE_W, y: rand() * TILE_H, color: STONES[Math.floor(rand() * STONES.length)] }));
const wrapped = (a: number, b: number, size: number) => {
	const d = Math.abs(a - b);
	return Math.min(d, size - d);
};
const g = new Grid(TILE_W, TILE_H);
for (let y = 0; y < TILE_H; y += 1) {
	for (let x = 0; x < TILE_W; x += 1) {
		let nearest = { d: Infinity, color: '' };
		let second = Infinity;
		for (const seed of seeds) {
			const d = Math.hypot(wrapped(x + 0.5, seed.x, TILE_W), wrapped(y + 0.5, seed.y, TILE_H));
			if (d < nearest.d) {
				second = nearest.d;
				nearest = { d, color: seed.color };
			} else if (d < second) second = d;
		}
		g.set(x, y, second - nearest.d < 0.9 ? JOINT : nearest.color);
	}
}
const svg = gridSvg(g).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
export const tile = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
