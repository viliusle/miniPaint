import app from './../../app.js';
import config from './../../config.js';
import Base_tools_class from './../../core/base-tools.js';
import Base_layers_class from './../../core/base-layers.js';

class Line_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = 'line';
		this.layer = {};
		this.best_ratio = 1;
		this.snap_line_info = {x: null, y: null};
	}

	load() {
		this.default_events();
	}

	mousedown(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.valid == false || mouse.click_valid == false)
			return;

		var x_pos = mouse.x;
		var y_pos = mouse.y;

		//apply snap
		var snap_info = this.calc_snap_initial(e, x_pos, y_pos);
		if(snap_info != null){
			if(snap_info.x != null) {
				x_pos = snap_info.x;
			}
			if(snap_info.y != null) {
				y_pos = snap_info.y;
			}
		}

		//register new object - current layer is not ours or params changed
		this.layer = {
			type: this.name,
			params: this.clone(this.getParams()),
			status: 'draft',
			render_function: [this.name, 'render'],
			x: x_pos,
			y: y_pos,
			rotate: null,
			is_vector: true,
			color: config.COLOR
		};
		app.State.do_action(
			new app.Actions.Bundle_action('new_line_layer', 'New Line Layer', [
				new app.Actions.Insert_layer_action(this.layer)
			])
		);
	}

	mousemove(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.is_drag == false)
			return;
		if (mouse.valid == false || mouse.click_valid == false) {
			return;
		}

		var width = mouse.x - this.layer.x;
		var height = mouse.y - this.layer.y;
		if (e.ctrlKey == true || e.metaKey) {
			//one direction only
			if (Math.abs(width) < Math.abs(height))
				width = 0;
			else
				height = 0;
		}

		//more data
		config.layer.width = width;
		config.layer.height = height;

		//apply snap
		var snap_info = this.calc_snap_end(e);
		if(snap_info != null){
			if(snap_info.width != null) {
				config.layer.width = snap_info.width;
			}
			if(snap_info.height != null) {
				config.layer.height = snap_info.height;
			}
		}

		this.Base_layers.render();
	}

	mouseup(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.valid == false || mouse.click_valid == false) {
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

		if (e.ctrlKey == true || e.metaKey) {
			//one direction only
			if (Math.abs(width) < Math.abs(height))
				width = 0;
			else
				height = 0;
		}

		//apply snap
		var snap_info = this.calc_snap_end(e);
		if(snap_info != null){
			if(snap_info.width != null) {
				width = snap_info.width;
			}
			if(snap_info.height != null) {
				height = snap_info.height;
			}
		}
		this.snap_line_info = {x: null, y: null};

		//more data
		app.State.do_action(
			new app.Actions.Update_layer_action(config.layer.id, {
				width,
				height,
				status: null
			}),
			{ merge_with_history: 'new_line_layer' }
		);
	}

	render_overlay(ctx){
		var ctx = this.Base_layers.ctx;
		this.render_overlay_parent(ctx);
	}

	demo(ctx, x, y, width, height) {
		var coords = [
			[0, 0],
			[100, 100],
		];
		this.draw_shape(ctx, x, y, width, height, coords);
	}

	render(ctx, layer) {
		if (layer.width == 0 && layer.height == 0)
			return;

		var params = layer.params;

		//set styles
		ctx.fillStyle = layer.color;
		ctx.strokeStyle = layer.color;
		ctx.lineWidth = params.size;
		ctx.lineCap = 'round';

		var width = layer.x + layer.width;
		var height = layer.y + layer.height;

		//draw line
		ctx.beginPath();
		ctx.moveTo(layer.x, layer.y);
		ctx.lineTo(width, height);
		ctx.stroke();
	}

}

export default Line_class;
