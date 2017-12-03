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

	load() {
		var _this = this;

		//events
		document.addEventListener('mousedown', function (e) {
			if (config.TOOL.name != _this.name)
				return;
			_this.mousedown(e);
		});
		document.addEventListener('mousemove', function (e) {
			if (config.TOOL.name != _this.name)
				return;
			_this.mousemove(e);
		});
		document.addEventListener('mouseup', function (e) {
			if (config.TOOL.name != _this.name)
				return;
			_this.mouseup(e);
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

		ctx.save();

		//set styles
		ctx.fillStyle = layer.color;
		ctx.strokeStyle = layer.color;
		ctx.lineWidth = params.size;

		if (rotateSupport == false) {
			this.rectangle(ctx, layer.x, layer.y, layer.width, layer.height, fill);
		}
		else {
			//rotate
			ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
			ctx.rotate(layer.rotate * Math.PI / 180);
			this.rectangle(ctx, -layer.width / 2, -layer.height / 2, layer.width, layer.height, fill);
		}

		ctx.restore();
	}

	//draws rectangle
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

}
;
export default Rectangle_class;
