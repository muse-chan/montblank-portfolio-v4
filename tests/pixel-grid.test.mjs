import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import { Grid, gridSvg, random } from '../src/lib/pixel-grid.ts';

test('merges solid regions into a single rectangle', () => {
	const grid = new Grid(100, 100);
	grid.rect(0, 0, 100, 100, '#ffffff');
	assert.deepEqual(grid.paths(), [{ fill: '#ffffff', d: 'M0 0h100v100h-100z' }]);
});

test('keeps transparent gaps and separate colour runs', () => {
	const grid = new Grid(4, 4);
	grid.rect(0, 0, 2, 4, '#ffffff');
	grid.set(0, 2, null);
	grid.rect(2, 1, 2, 2, '#000000');
	assert.deepEqual(grid.paths(), [
		{ fill: '#ffffff', d: 'M0 0h2v2h-2zM1 2h1v1h-1zM0 3h2v1h-2z' },
		{ fill: '#000000', d: 'M2 1h2v2h-2z' },
	]);
});

test('recomputes paths after cells change', () => {
	const grid = new Grid(2, 2);
	grid.rect(0, 0, 2, 2, '#ffffff');
	const initial = grid.paths();
	grid.set(1, 1, null);
	assert.notDeepEqual(grid.paths(), initial);
	assert.deepEqual(grid.paths(), grid.paths());
});

test('renders every cell at its original colour and three-pixel size', async () => {
	const rand = random(1102);
	const palette = [null, '#4a2c1d', '#fff4e2', '#c8442f'];
	for (const [width, height] of [[1, 1], [23, 17], [96, 64]]) {
		const grid = new Grid(width, height);
		for (let y = 0; y < height; y += 1) {
			for (let x = 0; x < width; x += 1) grid.set(x, y, palette[Math.floor(rand() * palette.length)]);
		}
		const svg = gridSvg(grid).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
		const { data, info } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
		assert.equal(info.width, width * 3);
		assert.equal(info.height, height * 3);
		for (let y = 0; y < info.height; y += 1) {
			for (let x = 0; x < info.width; x += 1) {
				const colour = grid.get(Math.floor(x / 3), Math.floor(y / 3));
				const expected = colour ? [...Buffer.from(colour.slice(1), 'hex'), 255] : [0, 0, 0, 0];
				const offset = (y * info.width + x) * 4;
				assert.deepEqual([...data.subarray(offset, offset + 4)], expected, `pixel ${x},${y}`);
			}
		}
	}
});
