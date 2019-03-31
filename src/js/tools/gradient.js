import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';
import Helper_class from './../libs/helpers.js';

class Gradient_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
		this.ctx = ctx;
		this.name = 'gradient';
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

		var name = this.name;
		var is_vector = false;
		if (params.radial == true) {
			name = 'Radial gradient';
			is_vector = true;
		}

		window.State.save();

		//register new object - current layer is not ours or params changed
		this.layer = {
			type: this.name,
			name: this.Helper.ucfirst(name) + ' #' + this.Base_layers.auto_increment,
			params: this.clone(this.getParams()),
			status: 'draft',
			render_function: [this.name, 'render'],
			x: mouse.x,
			y: mouse.y,
			rotate: null,
			is_vector: is_vector,
			color: params.color_1,
			data: {
				center_x: mouse.x,
				center_y: mouse.y,
			},
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

		if (params.radial == true) {
			config.layer.x = this.layer.data.center_x - width;
			config.layer.y = this.layer.data.center_y - height;
			config.layer.width = width * 2;
			config.layer.height = height * 2;
		}
		else {
			config.layer.width = width;
			config.layer.height = height;
		}

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

		if (width == 0 && height == 0) {
			//same coordinates - cancel
			this.Base_layers.delete(config.layer.id);
			return;
		}

		if (params.radial == true) {
			config.layer.x = this.layer.data.center_x - width;
			config.layer.y = this.layer.data.center_y - height;
			config.layer.width = width * 2;
			config.layer.height = height * 2;
		}
		else {
			config.layer.width = width;
			config.layer.height = height;
		}
		config.layer.status = null;

		this.Base_layers.render();
	}

	render(ctx, layer) {
		if (layer.width == 0 && layer.height == 0)
			return;

		var params = layer.params;
		var power = params.radial_power;
		var alpha = params.alpha / 100 * 255;
		var color1 = layer.color;
		var color2 = params.color_2;
		var radial = params.radial;

		var color2_rgb = this.Helper.hex2rgb(color2);

		var width = layer.x + layer.width - 1;
		var height = layer.y + layer.height - 1;

		if (radial == false) {
			//linear
			ctx.rect(0, 0, config.WIDTH, config.HEIGHT);
			var grd = ctx.createLinearGradient(
				layer.x, layer.y,
				width, height);

			grd.addColorStop(0, color1);
			grd.addColorStop(1, "rgba(" + color2_rgb.r + ", " + color2_rgb.g + ", "
				+ color2_rgb.b + ", " + alpha / 255 + ")");
			ctx.fillStyle = grd;
			ctx.fill();
		}
		else {
			//radial
			var dist_x = layer.width;
			var dist_y = layer.height;
			var center_x = layer.x + Math.round(layer.width / 2);
			var center_y = layer.y + Math.round(layer.height / 2);
			var distance = Math.sqrt((dist_x * dist_x) + (dist_y * dist_y));
			var radgrad = ctx.createRadialGradient(
				center_x, center_y, distance * power / 100,
				center_x, center_y, distance);

			radgrad.addColorStop(0, color1);
			radgrad.addColorStop(1, "rgba(" + color2_rgb.r + ", " + color2_rgb.g + ", "
				+ color2_rgb.b + ", " + alpha / 255 + ")");
			ctx.fillStyle = radgrad;
			ctx.fillRect(0, 0, config.WIDTH, config.HEIGHT);
		}
	}

}
export default Gradient_class;
