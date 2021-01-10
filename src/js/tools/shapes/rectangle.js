import app from './../../app.js';
import config from './../../config.js';
import Base_tools_class from './../../core/base-tools.js';
import Base_layers_class from './../../core/base-layers.js';

class Rectangle_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = 'rectangle';
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
			x: Math.round(x_pos),
			y: Math.round(y_pos),
			color: null,
			is_vector: true
		};
		app.State.do_action(
			new app.Actions.Bundle_action('new_rectangle_layer', 'New Rectangle Layer', [
				new app.Actions.Insert_layer_action(this.layer)
			])
		);
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

		if (params.square == true || e.ctrlKey == true || e.metaKey) {
			if (width < height) {
				width = height;
			}
			else {
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

		//apply snap
		var snap_info = this.calc_snap_end(e);
		if(snap_info != null && params.square == false){
			if(snap_info.width != null) {
				config.layer.width = snap_info.width;
			}
			if(snap_info.height != null) {
				config.layer.height = snap_info.height;
			}
		}
		else{
			this.snap_line_info = {x: null, y: null};
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
		
		var mouse_x = Math.round(mouse.x);
		var mouse_y = Math.round(mouse.y);
		var click_x = Math.round(mouse.click_x);
		var click_y = Math.round(mouse.click_y);
		var x = Math.min(mouse_x, click_x);
		var y = Math.min(mouse_y, click_y);
		var width = Math.abs(mouse_x - click_x);
		var height = Math.abs(mouse_y - click_y);

		if (params.square == true || e.ctrlKey == true || e.metaKey) {
			if (width < height) {
				width = height;
			}
			else {
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
			app.State.scrap_last_action();
			return;
		}

		//apply snap
		var snap_info = this.calc_snap_end(e);
		if(snap_info != null && params.square == false){
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
				x,
				y,
				width,
				height,
				status: null
			}),
			{ merge_with_history: 'new_rectangle_layer' }
		);
	}

	render_overlay(ctx){
		var ctx = this.Base_layers.ctx;
		this.render_overlay_parent(ctx);
	}

	demo(ctx, x, y, width, height) {
		var coords = [
			[0, 0],
			[100, 0],
			[100, 100],
			[0, 100],
			[0, 0],
		];
		this.draw_shape(ctx, x, y, width, height, coords);
	}

	render(ctx, layer) {
		var params = layer.params;
		var fill = params.fill;
		var stroke = params.border;
		var rotateSupport = true;
		var radius = params.radius;
		if(radius == undefined)
			radius = 0;

		ctx.save();

		//set styles
		ctx.strokeStyle = 'transparent';
		ctx.fillStyle = 'transparent';
		if(params.border)
			ctx.strokeStyle = params.border_color;
		if(params.fill)
			ctx.fillStyle = params.fill_color;
		ctx.lineWidth = params.border_size;

		if (rotateSupport == false) {
			this.roundRect(ctx, layer.x, layer.y, layer.width, layer.height, radius, fill, stroke);
		}
		else {
			//rotate
			ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
			ctx.rotate(layer.rotate * Math.PI / 180);
			this.roundRect(ctx, -layer.width / 2, -layer.height / 2, layer.width, layer.height, radius, fill, stroke);
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
	roundRect(ctx, x, y, width, height, radius, fill, stroke) {
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
		if (width % 2 == 1 && config.layer.status != 'draft') {
			x -= 0.5;
		}
		if (height % 2 == 1 && config.layer.status != 'draft') {
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
		if (stroke) {
			ctx.stroke();
		}
	}

}

export default Rectangle_class;
