//handles zoom and pan
//https://stackoverflow.com/questions/44009094/how-to-bound-image-pan-when-zooming-html-canvas/44015705#44015705
const zoomView = (() => {
	const matrix = [1, 0, 0, 1, 0, 0]; // current view transform
	const invMatrix = [1, 0, 0, 1, 0, 0]; // current inverse view transform
	var m = matrix;  // alias
	var im = invMatrix; // alias
	var scale = 1;   // current scale
	const bounds = {
		top: 0,
		left: 0,
		right: 200,
		bottom: 200,
	};
	var useConstraint = true; // if true then limit pan and zoom to 
	// keep bounds within the current context

	var maxScale = 1;
	const workPoint1 = {x: 0, y: 0};
	const workPoint2 = {x: 0, y: 0};
	const wp1 = workPoint1; // alias
	const wp2 = workPoint2; // alias
	var ctx;
	const pos = {// current position of origin
		x: 0,
		y: 0,
	};
	var dirty = true;
	const API = {
		canvasDefault() {
			ctx.setTransform(1, 0, 0, 1, 0, 0);
		},
		apply() {
			if (dirty) {
				this.update();
			}
			ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
		},
		getPosition() {
			return { x: pos.x, y: pos.y };
		},
		getContext() {
			return ctx;
		},
		getBounds() {
			return bounds;
		},
		getScale() {
			return scale;
		},
		getMaxScale() {
			return maxScale;
		},
		matrix, // expose the matrix
		invMatrix, // expose the inverse matrix
		update() { // call to update transforms
			dirty = false;
			m[3] = m[0] = scale;
			m[1] = m[2] = 0;
			m[4] = pos.x;
			m[5] = pos.y;
			if (useConstraint) {
				this.constrain();
			}
			this.invScale = 1 / scale;
			// calculate the inverse transformation
			var cross = m[0] * m[3] - m[1] * m[2];
			im[0] = m[3] / cross;
			im[1] = -m[1] / cross;
			im[2] = -m[2] / cross;
			im[3] = m[0] / cross;
		},
		constrain() {
			maxScale = Math.min(
				ctx.canvas.width / (bounds.right - bounds.left),
				ctx.canvas.height / (bounds.bottom - bounds.top)
				);
			if (scale < maxScale) {
				m[0] = m[3] = scale = maxScale;
			}
			wp1.x = bounds.left;
			wp1.y = bounds.top;
			this.toScreen(wp1, wp2);
			if (wp2.x > 0) {
				m[4] = pos.x -= wp2.x;
			}
			if (wp2.y > 0) {
				m[5] = pos.y -= wp2.y;
			}
			wp1.x = bounds.right;
			wp1.y = bounds.bottom;
			this.toScreen(wp1, wp2);
			if (wp2.x < ctx.canvas.width) {
				m[4] = (pos.x -= wp2.x - ctx.canvas.width);
			}
			if (wp2.y < ctx.canvas.height) {
				m[5] = (pos.y -= wp2.y - ctx.canvas.height);
			}
		},
		toWorld(from_x, from_y) {  // convert screen to world coords
			var xx, yy;
			var pointW = {};
			if (dirty) {
				this.update();
			}
			xx = from_x - m[4];
			yy = from_y - m[5];
			pointW.x = xx * im[0] + yy * im[2];
			pointW.y = xx * im[1] + yy * im[3];
			return pointW;
		},
		toScreen(from, point = {}){  // convert world coords to screen coords
			if (dirty) {
				this.update();
			}
			point.x = from.x * m[0] + from.y * m[2] + m[4];
			point.y = from.x * m[1] + from.y * m[3] + m[5];
			return point;
		},
		scaleAt(x_from, y_from, amount) { // at in screen coords
			if (dirty) {
				this.update();
			}
			scale *= amount;
			pos.x = x_from - (x_from - pos.x) * amount;
			pos.y = y_from - (y_from - pos.y) * amount;
			dirty = true;
		},
		move(move_x, move_y) {  // move is in screen coords
			pos.x += move_x;
			pos.y += move_y;
			dirty = true;
		},
		setContext(context) {
			ctx = context;
			dirty = true;
		},
		setBounds(top, left, right, bottom) {
			bounds.top = top;
			bounds.left = left;
			bounds.right = right;
			bounds.bottom = bottom;
			useConstraint = true;
			dirty = true;
		}
	};
	return API;
})();

export default zoomView;