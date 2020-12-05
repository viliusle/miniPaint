import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';

class Rectangle_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = 'rectangle';
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
		if (mouse.valid == false || mouse.click_valid == false)
			return;

		window.State.save();

		//register new object - current layer is not ours or params changed
		this.layer = {
			type: this.name,
			params: this.clone(this.getParams()),
			status: 'draft',
			render_function: [this.name, 'render'],
			x: Math.round(mouse.x),
			y: Math.round(mouse.y),
			is_vector: true,
		};
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

		var mouse_x = Math.round(mouse.x);
		var mouse_y = Math.round(mouse.y);
		var click_x = Math.round(mouse.click_x);
		var click_y = Math.round(mouse.click_y);
		var x = Math.min(mouse_x, click_x);
		var y = Math.min(mouse_y, click_y);
		var width = Math.abs(mouse_x - click_x);
		var height = Math.abs(mouse_y - click_y);

		if (params.square == true) {
			if (width < height) {
				width = height;
			} else {
				height = width;
			}
			if (mouse_x < click_x) {
				x = click_x - width;
			}
			if (mouse_y < click_y) {
				y = click_y - height;
			}
		}

		//more data
		config.layer.x = x;
		config.layer.y = y;
		config.layer.width = width;
		config.layer.height = height;
		this.Base_layers.render();
	}

	mouseup(e) {
		var mouse = this.get_mouse_info(e);
		var params = this.getParams();

		if (mouse.valid == false || mouse.click_valid == false) {
			config.layer.status = null;
			return;
		}
		
		var mouse_x = Math.round(mouse.x);
		var mouse_y = Math.round(mouse.y);
		var click_x = Math.round(mouse.click_x);
		var click_y = Math.round(mouse.click_y);
		var x = Math.min(mouse_x, click_x);
		var y = Math.min(mouse_y, click_y);
		var width = Math.abs(mouse_x - click_x);
		var height = Math.abs(mouse_y - click_y);

		if (params.square == true) {
			if (width < height) {
				width = height;
			} else {
				height = width;
			}
			if (mouse_x < click_x) {
				x = click_x - width;
			}
			if (mouse_y < click_y) {
				y = click_y - height;
			}
		}

		if (width == 0 && height == 0) {
			//same coordinates - cancel
			this.Base_layers.delete(config.layer.id);
			return;
		}

		//more data
		config.layer.x = x;
		config.layer.y = y;
		config.layer.width = width;
		config.layer.height = height;
		config.layer.status = null;
		this.Base_layers.render();
	}

	render(ctx, layer) {
		var params = layer.params;
		var fill = params.fill;
		var rotateSupport = true;
		var radius = params.radius;
		if(radius == undefined)
			radius = 0;

		ctx.save();

		//set styles
		ctx.fillStyle = layer.color;
		ctx.strokeStyle = layer.color;
		ctx.lineWidth = params.size;

		if (rotateSupport == false) {
			this.roundRect(ctx, layer.x, layer.y, layer.width, layer.height, radius, fill);
		}
		else {
			//rotate
			ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
			ctx.rotate(layer.rotate * Math.PI / 180);
			this.roundRect(ctx, -layer.width / 2, -layer.height / 2, layer.width, layer.height, radius, fill);
		}

		ctx.restore();
	}

	/**
	 * Draws a rounded rectangle on canvas.
	 * 
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} width
	 * @param {Number} height
	 * @param {Number} radius
	 * @param {Boolean} fill
	 */
	roundRect(ctx, x, y, width, height, radius, fill) {
		x = parseInt(x);
		y = parseInt(y);
		width = parseInt(width);
		height = parseInt(height);
		if(width < 0){
			width = Math.abs(width);
			x = x - width;
		}
		if(height < 0){
			height = Math.abs(height);
			y = y - height;
		}
		var smaller_dimension = Math.min(width, height);

		radius = parseInt(radius);
		if (typeof fill == 'undefined') {
			fill = false;
		}
		if (typeof radius === 'undefined') {
			radius = 0;
		}
		radius = Math.min(radius, width / 2, height / 2);
		radius = Math.floor(radius);
		
		// Odd dimensions must draw offset half a pixel
		if (width % 2 == 1) {
			x -= 0.5;
		}
		if (height % 2 == 1) {
			y -= 0.5;
		}

		var stroke_offset = !fill && ctx.lineWidth % 2 == 1 && width > 1 && height > 1 ? 0.5 : 0;
		
		if (smaller_dimension < 2) fill = true;

		radius = {tl: radius, tr: radius, br: radius, bl: radius};
		ctx.beginPath();
		ctx.moveTo(x + radius.tl + stroke_offset, y + stroke_offset);
		ctx.lineTo(x + width - radius.tr - stroke_offset, y + stroke_offset);
		ctx.quadraticCurveTo(x + width - stroke_offset, y + stroke_offset, x + width - stroke_offset, y + radius.tr + stroke_offset);
		ctx.lineTo(x + width - stroke_offset, y + height - radius.br - stroke_offset);
		ctx.quadraticCurveTo(x + width - stroke_offset, y + height - stroke_offset, x + width - radius.br - stroke_offset, y + height - stroke_offset);
		ctx.lineTo(x + radius.bl + stroke_offset, y + height - stroke_offset);
		ctx.quadraticCurveTo(x + stroke_offset, y + height - stroke_offset, x + stroke_offset, y + height - radius.bl - stroke_offset);
		ctx.lineTo(x + stroke_offset, y + radius.tl + stroke_offset);
		ctx.quadraticCurveTo(x + stroke_offset, y + stroke_offset, x + radius.tl + stroke_offset, y + stroke_offset);
		ctx.closePath();
		if (fill) {
			ctx.fill();
		}
		else {
			ctx.stroke();
		}
	}

}

export default Rectangle_class;
