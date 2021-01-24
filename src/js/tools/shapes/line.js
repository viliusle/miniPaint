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
		this.mouse_click = {x: null, y: null};
	}

	load() {
		this.default_events();
	}

	mousedown(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.click_valid == false)
			return;

		var mouse_x = mouse.x;
		var mouse_y = mouse.y;

		//apply snap
		var snap_info = this.calc_snap_position(e, mouse_x, mouse_y);
		if(snap_info != null){
			if(snap_info.x != null) {
				mouse_x = snap_info.x;
			}
			if(snap_info.y != null) {
				mouse_y = snap_info.y;
			}
		}

		this.mouse_click.x = mouse_x;
		this.mouse_click.y = mouse_y;

		//register new object - current layer is not ours or params changed
		this.layer = {
			type: this.name,
			params: this.clone(this.getParams()),
			status: 'draft',
			render_function: [this.name, 'render'],
			x: mouse_x,
			y: mouse_y,
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
		if (mouse.click_valid == false) {
			return;
		}

		var mouse_x = Math.round(mouse.x);
		var mouse_y = Math.round(mouse.y);
		var click_x = Math.round(this.mouse_click.x);
		var click_y = Math.round(this.mouse_click.y);

		//apply snap
		var snap_info = this.calc_snap_position(e, mouse_x, mouse_y, config.layer.id);
		if(snap_info != null){
			if(snap_info.x != null) {
				mouse_x = snap_info.x;
			}
			if(snap_info.y != null) {
				mouse_y = snap_info.y;
			}
		}

		var width = mouse_x - this.layer.x;
		var height = mouse_y - this.layer.y;
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

		this.Base_layers.render();
	}

	mouseup(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.click_valid == false) {
			config.layer.status = null;
			return;
		}

		var mouse_x = Math.round(mouse.x);
		var mouse_y = Math.round(mouse.y);
		var click_x = Math.round(this.mouse_click.x);
		var click_y = Math.round(this.mouse_click.y);

		//apply snap
		var snap_info = this.calc_snap_position(e, mouse_x, mouse_y, config.layer.id);
		if(snap_info != null){
			if(snap_info.x != null) {
				mouse_x = snap_info.x;
			}
			if(snap_info.y != null) {
				mouse_y = snap_info.y;
			}
		}
		this.snap_line_info = {x: null, y: null};


		var width = mouse_x - this.layer.x;
		var height = mouse_y - this.layer.y;

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
