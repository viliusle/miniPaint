import app from './../app.js';
import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';

class Pencil_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.name = 'pencil';
		this.layer = {};
		this.params_hash = false;
		this.pressure_supported = false;
		this.pointer_pressure = 0; // has range [0 - 1]
	}

	load() {
		var _this = this;

		//pointer events
		document.addEventListener('pointerdown', function (event) {
			_this.pointerdown(event);
		});
		document.addEventListener('pointermove', function (event) {
			_this.pointermove(event);
		});

		this.default_events();
	}

	dragMove(event) {
		if (config.TOOL.name != this.name)
			return;
		this.mousemove(event);
	}

	pointerdown(e) {
		// Devices that don't actually support pen pressure can give 0.5 as a false reading.
		// It is highly unlikely a real pen will read exactly 0.5 at the start of a stroke.
		if (e.pressure && e.pressure !== 0 && e.pressure !== 0.5 && e.pressure <= 1) {
			this.pressure_supported = true;
			this.pointer_pressure = e.pressure;
		} else {
			this.pressure_supported = false;
		}
	}

	pointermove(e) {
		// Pressure of exactly 1 seems to be an input error, sometimes I see it when lifting the pen
		// off the screen when pressure reading should be near 0.
		if (this.pressure_supported && e.pressure < 1) {
			this.pointer_pressure = e.pressure;
		}
	}

	mousedown(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.click_valid == false)
			return;

		var params_hash = this.get_params_hash();
		var opacity = Math.round(config.ALPHA / 255 * 100);
		
		if (config.layer.type != this.name || params_hash != this.params_hash) {
			//register new object - current layer is not ours or params changed
			this.layer = {
				type: this.name,
				data: [],
				opacity: opacity,
				params: this.clone(this.getParams()),
				status: 'draft',
				render_function: [this.name, 'render'],
				x: 0,
				y: 0,
				width: config.WIDTH,
				height: config.HEIGHT,
				hide_selection_if_active: true,
				rotate: null,
				is_vector: true,
				color: config.COLOR
			};
			app.State.do_action(
				new app.Actions.Bundle_action('new_pencil_layer', 'New Pencil Layer', [
					new app.Actions.Insert_layer_action(this.layer)
				])
			);
			this.params_hash = params_hash;
		}
		else {
			//continue adding layer data, just register break
			const new_data = JSON.parse(JSON.stringify(config.layer.data));
			new_data.push(null);
			app.State.do_action(
				new app.Actions.Bundle_action('update_pencil_layer', 'Update Pencil Layer', [
					new app.Actions.Update_layer_action(config.layer.id, {
						data: new_data
					})
				])
			);
		}
	}

	mousemove(e) {
		var mouse = this.get_mouse_info(e);
		var params = this.getParams();
		if (mouse.is_drag == false)
			return;
		if (mouse.click_valid == false) {
			return;
		}

		//detect line size
		var size = params.size;
		var new_size = size;

		if (params.pressure == true && this.pressure_supported) {
			new_size = size * this.pointer_pressure * 2;
		}

		//more data
		config.layer.data.push([
			Math.ceil(mouse.x - config.layer.x),
			Math.ceil(mouse.y - config.layer.y),
			new_size
		]);
		this.Base_layers.render();
	}

	mouseup(e) {
		var mouse = this.get_mouse_info(e);
		var params = this.getParams();
		if (mouse.click_valid == false) {
			config.layer.status = null;
			return;
		}

		//detect line size
		var size = params.size;
		var new_size = size;

		if (params.pressure == true && this.pressure_supported) {
			new_size = size * this.pointer_pressure * 2;
		}

		//more data
		config.layer.data.push([
			Math.ceil(mouse.x - config.layer.x),
			Math.ceil(mouse.y - config.layer.y),
			new_size
		]);

		this.check_dimensions();

		config.layer.status = null;
		this.Base_layers.render();
	}

	render(ctx, layer) {
		this.render_aliased(ctx, layer);
	}
	
	/**
	 * draw without antialiasing, sharp, ugly mode.
	 *
	 * @param {object} ctx
	 * @param {object} layer
	 */
	render_aliased(ctx, layer) {
		if (layer.data.length == 0)
			return;

		var params = layer.params;
		var data = layer.data;
		var n = data.length;
		var size = params.size;

		//set styles
		ctx.fillStyle = layer.color;
		ctx.strokeStyle = layer.color;
		ctx.translate(layer.x, layer.y);

		//draw
		ctx.beginPath();
		ctx.moveTo(data[0][0], data[0][1]);
		for (var i = 1; i < n; i++) {
			if (data[i] === null) {
				//break
				ctx.beginPath();
			}
			else {
				//line
				size = data[i][2];
				if(size == undefined){
					size = 1;
				}

				if (data[i - 1] == null) {
					//exception - point
					ctx.fillRect(
						data[i][0] - Math.floor(size / 2) - 1,
						data[i][1] - Math.floor(size / 2) - 1,
						size,
						size
					);
				}
				else {
					//lines
					ctx.beginPath();
					this.draw_simple_line(
						ctx,
						data[i - 1][0],
						data[i - 1][1],
						data[i][0],
						data[i][1],
						size
					);
				}
			}
		}
		if (n == 1 || data[1] == null) {
			//point
			ctx.beginPath();
			ctx.fillRect(
				data[0][0] - Math.floor(size / 2) - 1,
				data[0][1] - Math.floor(size / 2) - 1,
				size,
				size
			);
		}

		ctx.translate(-layer.x, -layer.y);
	}

	/**
	 * draws line without aliasing
	 *
	 * @param {object} ctx
	 * @param {int} from_x
	 * @param {int} from_y
	 * @param {int} to_x
	 * @param {int} to_y
	 * @param {int} size
	 */
	draw_simple_line(ctx, from_x, from_y, to_x, to_y, size) {
		var dist_x = from_x - to_x;
		var dist_y = from_y - to_y;
		var distance = Math.sqrt((dist_x * dist_x) + (dist_y * dist_y));
		var radiance = Math.atan2(dist_y, dist_x);

		for (var j = 0; j < distance; j++) {
			var x_tmp = Math.round(to_x + Math.cos(radiance) * j) - Math.floor(size / 2) - 1;
			var y_tmp = Math.round(to_y + Math.sin(radiance) * j) - Math.floor(size / 2) - 1;

			ctx.fillRect(x_tmp, y_tmp, size, size);
		}
	}

	/**
	 * recalculate layer x, y, width and height values.
	 */
	check_dimensions() {
		if(config.layer.data.length == 0)
			return;

		//find bounds
		var data = JSON.parse(JSON.stringify(config.layer.data)); // Deep copy for history
		var min_x = data[0][0];
		var min_y = data[0][1];
		var max_x = data[0][0];
		var max_y = data[0][1];
		for(var i in data){
			if(data[i] === null)
				continue;
			min_x = Math.min(min_x, data[i][0]);
			min_y = Math.min(min_y, data[i][1]);
			max_x = Math.max(max_x, data[i][0]);
			max_y = Math.max(max_y, data[i][1]);
		}

		//move current data
		for(var i in data){
			if(data[i] === null)
				continue;
			data[i][0] = data[i][0] - min_x;
			data[i][1] = data[i][1] - min_y;
		}

		//change layers bounds
		app.State.do_action(
			new app.Actions.Update_layer_action(config.layer.id, {
				x: config.layer.x + min_x,
				y: config.layer.y + min_y,
				width: max_x - min_x,
				height: max_y - min_y,
				data
			}),
			{
				merge_with_history: ['new_pencil_layer', 'update_pencil_layer']
			}
		);
	}

}

export default Pencil_class;
