import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';

class Circle_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = 'circle';
		this.layer = {};
	}

	dragStart(event) {
		var _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mousedown(event);
	}

	dragMove(event) {
		var _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mousemove(event);
	}

	dragEnd(event) {
		var _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mouseup(event);
	}

	load() {
		var _this = this;

		//mouse events
		document.addEventListener('mousedown', function (event) {
			_this.dragStart(event);
		});
		document.addEventListener('mousemove', function (event) {
			_this.dragMove(event);
		});
		document.addEventListener('mouseup', function (event) {
			_this.dragEnd(event);
		});

		// collect touch events
		document.addEventListener('touchstart', function (event) {
			_this.dragStart(event);
		});
		document.addEventListener('touchmove', function (event) {
			_this.dragMove(event);
		});
		document.addEventListener('touchend', function (event) {
			_this.dragEnd(event);
		});
	}

	mousedown(e) {
		var mouse = this.get_mouse_info(e);
		var params = this.getParams();
		if (mouse.valid == false || mouse.click_valid == false)
			return;

		window.State.save();

		//register new object - current layer is not ours or params changed
		this.layer = {
			type: this.name,
			params: this.clone(this.getParams()),
			render_function: [this.name, 'render'],
			status: 'draft',
			x: mouse.x,
			y: mouse.y,
			is_vector: true,
			data: {
				center_x: mouse.x,
				center_y: mouse.y,
			},
		};
		if (params.circle == true) {
			//disable rotate
			this.layer.rotate = null;
		}
		this.Base_layers.insert(this.layer);
	}

	mousemove(e) {
		var mouse = this.get_mouse_info(e);
		var params = this.getParams();

		if (mouse.is_drag == false)
			return;
		if (mouse.valid == false || mouse.click_valid == false) {
			return;
		}

		var width = mouse.x - this.layer.x;
		var height = mouse.y - this.layer.y;
		if (params.circle == true) {
			width = Math.round(Math.sqrt(width * width + height * height));
			height = width;
		}

		//more data
		config.layer.x = this.layer.data.center_x - width;
		config.layer.y = this.layer.data.center_y - height;
		config.layer.width = width * 2;
		config.layer.height = height * 2;
		this.Base_layers.render();
	}

	mouseup(e) {
		var mouse = this.get_mouse_info(e);
		var params = this.getParams();

		if (mouse.valid == false || mouse.click_valid == false) {
			config.layer.status = null;
			return;
		}

		var width = mouse.x - this.layer.x;
		var height = mouse.y - this.layer.y;
		if (params.circle == true) {
			width = Math.round(Math.sqrt(width * width + height * height));
			height = width;
		}

		if (width == 0 && height == 0) {
			//same coordinates - cancel
			this.Base_layers.delete(config.layer.id);
			return;
		}

		//more data
		config.layer.x = this.layer.data.center_x - width;
		config.layer.y = this.layer.data.center_y - height;
		config.layer.width = width * 2;
		config.layer.height = height * 2;
		config.layer.status = null;
		this.Base_layers.render();
	}

	render(ctx, layer) {
		var params = layer.params;
		var rotateSupport = true;

		ctx.save();

		//set styles
		ctx.fillStyle = layer.color;
		ctx.strokeStyle = layer.color;
		ctx.lineWidth = params.size;

		var dist_x = layer.width;
		var dist_y = layer.height;

		if (rotateSupport == false) {
			this.ellipse_by_center(
				ctx,
				layer.x + Math.round(layer.width / 2),
				layer.y + Math.round(layer.height / 2),
				dist_x,
				dist_y,
				params.fill
				);
		}
		else {
			ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
			ctx.rotate(layer.rotate * Math.PI / 180);
			this.ellipse_by_center(
				ctx,
				-layer.width / 2 + Math.round(layer.width / 2),
				-layer.height / 2 + Math.round(layer.height / 2),
				dist_x,
				dist_y,
				params.fill
				);
		}

		ctx.restore();
	}

	ellipse_by_center(ctx, cx, cy, w, h, fill) {
		this.ellipse(ctx, cx - w / 2.0, cy - h / 2.0, w, h, fill);
	}

	ellipse(ctx, x, y, w, h, fill) {
		var kappa = .5522848,
			ox = (w / 2) * kappa, // control point offset horizontal
			oy = (h / 2) * kappa, // control point offset vertical
			xe = x + w, // x-end
			ye = y + h, // y-end
			xm = x + w / 2, // x-middle
			ym = y + h / 2; // y-middle

		ctx.beginPath();
		ctx.moveTo(x, ym);
		ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
		ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
		ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
		ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
		ctx.closePath();
		if (fill == undefined || fill == false)
			ctx.stroke();
		else
			ctx.fill();
	}

}
;
export default Circle_class;
