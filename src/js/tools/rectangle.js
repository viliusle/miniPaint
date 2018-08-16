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
			x: mouse.x,
			y: mouse.y,
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

		var width = mouse.x - this.layer.x;
		var height = mouse.y - this.layer.y;

		if (params.square == true) {
			if (Math.abs(width) < Math.abs(height)) {
				if (width > 0)
					width = Math.abs(height);
				else
					width = -Math.abs(height);
			}
			else {
				if (height > 0)
					height = Math.abs(width);
				else
					height = -Math.abs(width);
			}
		}

		//more data
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

		var width = mouse.x - this.layer.x;
		var height = mouse.y - this.layer.y;

		if (params.square == true) {
			if (Math.abs(width) < Math.abs(height)) {
				if (width > 0)
					width = Math.abs(height);
				else
					width = -Math.abs(height);
			}
			else {
				if (height > 0)
					height = Math.abs(width);
				else
					height = -Math.abs(width);
			}
		}

		if (width == 0 && height == 0) {
			//same coordinates - cancel
			this.Base_layers.delete(config.layer.id);
			return;
		}

		//more data
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
	 * draws rectangle
	 * 
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} width
	 * @param {Number} height
	 * @param {Boolean} fill
	 */
	rectangle(ctx, x, y, width, height, fill) {
		x = x + 0.5;
		y = y + 0.5;
		width--;
		height--;
		if (typeof fill == "undefined")
			fill = false;

		ctx.beginPath();
		ctx.rect(x, y, width, height);

		if (fill) {
			ctx.fill();
		}
		else {
			ctx.stroke();
		}
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
		
		radius = parseInt(radius);
		if (typeof fill == 'undefined') {
			fill = false;
		}
		if (typeof radius === 'undefined') {
			radius = 0;
		}
		radius = Math.min(radius, width / 2, height / 2);
		radius = Math.floor(radius);
		
		//make it nicer
		x = x + 0.5;
		y = y + 0.5;
		width--;
		height--;
		
		radius = {tl: radius, tr: radius, br: radius, bl: radius};
		
		ctx.beginPath();
		ctx.moveTo(x + radius.tl, y);
		ctx.lineTo(x + width - radius.tr, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
		ctx.lineTo(x + width, y + height - radius.br);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
		ctx.lineTo(x + radius.bl, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
		ctx.lineTo(x, y + radius.tl);
		ctx.quadraticCurveTo(x, y, x + radius.tl, y);
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
