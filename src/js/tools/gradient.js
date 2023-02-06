import app from './../app.js';
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

	load() {
		this.default_events();
	}

	mousedown(e) {
		var mouse = this.get_mouse_info(e);
		var params = this.getParams();
		if (mouse.click_valid == false)
			return;

		var name = this.name;
		var is_vector = false;
		if (params.radial == true) {
			name = 'Radial gradient';
			is_vector = true;
		}

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
			color: null,
			data: {
				center_x: mouse.x,
				center_y: mouse.y,
			},
		};
		app.State.do_action(
			new app.Actions.Bundle_action('new_gradient_layer', 'New Gradient Layer', [
				new app.Actions.Insert_layer_action(this.layer)
			])
		);
	}

	mousemove(e) {
		var mouse = this.get_mouse_info(e);
		var params = this.getParams();
		if (mouse.is_drag == false)
			return;
		if (mouse.click_valid == false) {
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
		if (mouse.click_valid == false) {
			config.layer.status = null;
			return;
		}

		var width = mouse.x - this.layer.x;
		var height = mouse.y - this.layer.y;

		if (width == 0 && height == 0) {
			//same coordinates - cancel
			app.State.scrap_last_action();
			return;
		}

		let new_settings = {};
		if (params.radial == true) {
			new_settings = {
				x: this.layer.data.center_x - width,
				y: this.layer.data.center_y - height,
				width: width * 2,
				height: height * 2
			}
		}
		else {
			new_settings = {
				width,
				height
			}
		}
		new_settings.status = null;

		app.State.do_action(
			new app.Actions.Update_layer_action(config.layer.id, new_settings),
			{ merge_with_history: 'new_gradient_layer' }
		);

		this.Base_layers.render();
	}

	render(ctx, layer) {
		if (layer.width == 0 && layer.height == 0)
			return;

		var params = layer.params;
		var power = params.radial_power;
		if(power > 99){
			power = 99;
		}
		var alpha = params.alpha / 100 * 255;
		if(power > 255){
			power = 255;
		}

		var color1 = params.color_1;
		var color2 = params.color_2;
		var radial = params.radial;

		var color2_rgb = this.Helper.hexToRgb(color2);

		var width = layer.x + layer.width - 1;
		var height = layer.y + layer.height - 1;

		if (radial == false) {
			//linear
			ctx.beginPath();
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
