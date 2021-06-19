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
	}

	load() {
		this.default_events();
	}

	dragMove(event) {
		if (config.TOOL.name != this.name)
			return;
		this.mousemove(event);
	}

	mousedown(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.click_valid == false)
			return;

		var params_hash = this.get_params_hash();
		var params = this.getParams();
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

		//more data
		config.layer.data.push([Math.ceil(mouse.x - config.layer.x), Math.ceil(mouse.y - config.layer.y)]);
		this.Base_layers.render();
	}

	mouseup(e) {
		var mouse = this.get_mouse_info(e);
		var params = this.getParams();
		if (mouse.click_valid == false) {
			config.layer.status = null;
			return;
		}

		//more data
		config.layer.data.push([Math.ceil(mouse.x - config.layer.x), Math.ceil(mouse.y - config.layer.y)]);

		this.check_dimensions();

		config.layer.status = null;
		this.Base_layers.render();
	}

	render(ctx, layer) {
		var params = layer.params;

		if (params.antialiasing == true) {
			this.render_antialiased(ctx, layer);	// remove it in future, users should use brush
		}
		else {
			this.render_aliased(ctx, layer);
		}
	}
	
	/**
	 * draw with antialiasing, nice mode
	 *
	 * @param {object} ctx
	 * @param {object} layer
	 */
	render_antialiased(ctx, layer) {
		if (layer.data.length == 0)
			return;

		var params = layer.params;
		var data = layer.data;
		var n = data.length;
		var size = params.size || 1;

		//set styles
		ctx.save();
		ctx.fillStyle = layer.color;
		ctx.strokeStyle = layer.color;
		ctx.lineWidth = size;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';

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
				if (data[i - 1] == null) {
					//exception - point
					ctx.arc(data[i][0], data[i][1], size / 2, 0, 2 * Math.PI, false);
					ctx.fill();
				}
				else {
					//lines
					ctx.beginPath();
					ctx.moveTo(data[i - 1][0], data[i - 1][1]);
					ctx.lineTo(data[i][0], data[i][1]);
					ctx.stroke();
				}
			}
		}
		if (n == 1 || data[1] == null) {
			//point
			ctx.beginPath();
			ctx.arc(data[0][0], data[0][1], size / 2, 0, 2 * Math.PI, false);
			ctx.fill();
		}

		ctx.translate(-layer.x, -layer.y);
		ctx.restore();
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

		var data = layer.data;
		var n = data.length;

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
				if (data[i - 1] == null) {
					//exception - point
					ctx.fillRect(data[i][0] - 1, data[i][1] - 1, 1, 1);
				}
				else {
					//lines
					ctx.beginPath();
					this.draw_simple_line(ctx, data[i - 1][0], data[i - 1][1], data[i][0], data[i][1]);
				}
			}
		}
		if (n == 1 || data[1] == null) {
			//point
			ctx.beginPath();
			ctx.fillRect(data[0][0] - 1, data[0][1] - 1, 1, 1);
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
	 */
	draw_simple_line(ctx, from_x, from_y, to_x, to_y) {
		var dist_x = from_x - to_x;
		var dist_y = from_y - to_y;
		var distance = Math.sqrt((dist_x * dist_x) + (dist_y * dist_y));
		var radiance = Math.atan2(dist_y, dist_x);
		for (var j = 0; j < distance; j++) {
			var x_tmp = Math.round(to_x - 1 + Math.cos(radiance) * j);
			var y_tmp = Math.round(to_y - 1 + Math.sin(radiance) * j);

			ctx.fillRect(x_tmp, y_tmp, 1, 1);
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
