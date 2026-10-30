// Pixel-art scenes drawn in code: a grid of colours turned into one SVG path per colour (see pixel-path.ts for small sprites).

export class Grid {
	readonly cells: (string | null)[];

	constructor(
		readonly width: number,
		readonly height: number,
	) {
		this.cells = new Array(width * height).fill(null);
	}

	set(x: number, y: number, color: string | null) {
		const cx = Math.round(x);
		const cy = Math.round(y);
		if (cx < 0 || cy < 0 || cx >= this.width || cy >= this.height) return;
		this.cells[cy * this.width + cx] = color;
	}

	get(x: number, y: number) {
		if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
		return this.cells[y * this.width + x];
	}

	rect(x: number, y: number, w: number, h: number, color: string) {
		for (let dy = 0; dy < h; dy += 1) for (let dx = 0; dx < w; dx += 1) this.set(x + dx, y + dy, color);
	}

	column(x: number, from: number, to: number, color: string) {
		for (let y = Math.round(from); y < Math.round(to); y += 1) this.set(x, y, color);
	}

	disc(cx: number, cy: number, r: number, color: (dx: number, dy: number, d: number) => string | null) {
		for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y += 1) {
			for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x += 1) {
				const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
				if (d <= r) {
					const c = color(x + 0.5 - cx, y + 0.5 - cy, d);
					if (c) this.set(x, y, c);
				}
			}
		}
	}

	/** Paints string rows ('.' transparent) with a palette, top-left at (x, y). */
	sprite(rows: string[], palette: Record<string, string>, x: number, y: number) {
		rows.forEach((row, dy) => [...row].forEach((key, dx) => palette[key] && this.set(x + dx, y + dy, palette[key])));
	}

	/**
	 * Returns one SVG path per colour, merging identical horizontal runs across adjacent rows without changing any cells.
	 * @example
	 * const paths = new Grid(16, 16).paths();
	 */
	paths() {
		const rectangles: { x: number; y: number; width: number; height: number; color: string }[] = [];
		let previous = new Map<string, (typeof rectangles)[number]>();
		for (let y = 0; y < this.height; y += 1) {
			const current = new Map<string, (typeof rectangles)[number]>();
			let x = 0;
			while (x < this.width) {
				const color = this.cells[y * this.width + x];
				let end = x + 1;
				while (end < this.width && this.cells[y * this.width + end] === color) end += 1;
				if (color) {
					const width = end - x;
					const key = `${x}:${width}:${color}`;
					const rectangle = previous.get(key);
					if (rectangle) {
						rectangle.height += 1;
						current.set(key, rectangle);
					} else {
						const rectangle = { x, y, width, height: 1, color };
						rectangles.push(rectangle);
						current.set(key, rectangle);
					}
				}
				x = end;
			}
			previous = current;
		}
		const paths = new Map<string, string[]>();
		for (const { x, y, width, height, color } of rectangles) {
			const commands = paths.get(color) ?? [];
			commands.push(`M${x} ${y}h${width}v${height}h-${width}z`);
			paths.set(color, commands);
		}
		return [...paths].map(([fill, commands]) => ({ fill, d: commands.join('') }));
	}
}

/** Smooth wavy offset in whole dots, the same family as public/pixel/edge-*.svg. */
export const wave = (x: number, period: number, phase: number, amp = 1) =>
	Math.round(amp * (1.6 * Math.sin((2 * Math.PI * x) / period + phase) + 0.9 * Math.sin((4 * Math.PI * x) / period + phase * 2.3)));

export function random(seed: number) {
	let state = seed;
	return () => {
		state = (state * 1664525 + 1013904223) % 4294967296;
		return state / 4294967296;
	};
}

/** Sprite rows to an inline SVG string; one cell is one dot. */
export function spriteSvg(rows: string[], palette: Record<string, string>, className = '') {
	const g = new Grid(rows[0].length, rows.length);
	g.sprite(rows, palette, 0, 0);
	const body = g.paths().map((p) => `<path fill="${p.fill}" d="${p.d}"/>`).join('');
	return `<svg class="${className}" viewBox="0 0 ${g.width} ${g.height}" width="${g.width * 3}" height="${g.height * 3}" shape-rendering="crispEdges" aria-hidden="true">${body}</svg>`;
}

export function gridSvg(g: Grid, className = '') {
	const body = g.paths().map((p) => `<path fill="${p.fill}" d="${p.d}"/>`).join('');
	return `<svg class="${className}" viewBox="0 0 ${g.width} ${g.height}" width="${g.width * 3}" height="${g.height * 3}" shape-rendering="crispEdges" aria-hidden="true">${body}</svg>`;
}

