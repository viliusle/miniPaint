import app from './../../app.js';
import config from './../../config.js';
import Base_tools_class from './../../core/base-tools.js';
import Base_layers_class from './../../core/base-layers.js';

class Ellipse_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = 'ellipse';
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
		var params = this.getParams();
		if (mouse.valid == false || mouse.click_valid == false)
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
			render_function: [this.name, 'render'],
			status: 'draft',
			x: mouse_x,
			y: mouse_y,
			is_vector: true,
			color: null,
			data: {
				center_x: mouse.x,
				center_y: mouse.y,
			}
		};
		if (params.circle == true) {
			//disable rotate
			this.layer.rotate = null;
		}
		app.State.do_action(
			new app.Actions.Bundle_action('new_ellipse_layer', 'New Ellipse Layer', [
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

		var width = Math.abs(mouse_x - click_x);
		var height = Math.abs(mouse_y - click_y);

		if (params.circle == true || e.ctrlKey == true || e.metaKey) {
			width = Math.round(Math.sqrt(width * width + height * height));
			height = width;
		}

		//more data
		config.layer.x = this.layer.data.center_x - width;
		config.layer.y = this.layer.data.center_y - height;
		config.layer.width = width * 2;
		config.layer.height = height * 2;

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

		var width = Math.abs(mouse_x - click_x);
		var height = Math.abs(mouse_y - click_y);

		if (params.circle == true || e.ctrlKey == true || e.metaKey) {
			width = Math.round(Math.sqrt(width * width + height * height));
			height = width;
		}

		if (width == 0 && height == 0) {
			//same coordinates - cancel
			app.State.scrap_last_action();
			return;
		}

		var new_x = Math.round(this.layer.data.center_x - width);
		var new_y = Math.round(this.layer.data.center_y - height);

		width =  width * 2;
		height = height * 2;

		//more data
		app.State.do_action(
			new app.Actions.Update_layer_action(config.layer.id, {
				x: new_x,
				y: new_y,
				width: width,
				height: height,
				status: null
			}),
			{ merge_with_history: 'new_ellipse_layer' }
		);
	}

	render_overlay(ctx){
		var ctx = this.Base_layers.ctx;
		this.render_overlay_parent(ctx);
	}

	demo(ctx, x, y, width, height) {
		x = parseInt(x);
		y = parseInt(y);
		width = parseInt(width);
		height = parseInt(height);

		ctx.fillStyle = '#aaa';
		ctx.strokeStyle = '#555';
		ctx.lineWidth = 3;

		this.ellipse(
			ctx,
			x,
			y,
			width,
			height,
			true,
			true
		);
	}

	render(ctx, layer) {
		var params = layer.params;
		var rotateSupport = true;

		ctx.save();

		//set styles
		ctx.strokeStyle = 'transparent';
		ctx.fillStyle = 'transparent';
		if(params.border)
			ctx.strokeStyle = params.border_color;
		if(params.fill)
			ctx.fillStyle = params.fill_color;
		ctx.lineWidth = params.border_size;

		var dist_x = layer.width;
		var dist_y = layer.height;

		if (rotateSupport == false) {
			this.ellipse_by_center(
				ctx,
				layer.x + Math.round(layer.width / 2),
				layer.y + Math.round(layer.height / 2),
				dist_x,
				dist_y,
				params.border,
				params.fill
			);
		}
		else {
			ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
			ctx.rotate(layer.rotate * Math.PI / 180);
			this.ellipse_by_center(
				ctx,
				-layer.width / 2 + Math.round(layer.width / 2),
				-layer.height / 2 + Math.round(layer.height / 2),
				dist_x,
				dist_y,
				params.border,
				params.fill
			);
		}

		ctx.restore();
	}

	ellipse_by_center(ctx, cx, cy, w, h, stroke, fill) {
		this.ellipse(ctx, cx - w / 2.0, cy - h / 2.0, w, h, stroke, fill);
	}

	ellipse(ctx, x, y, w, h, stroke, fill) {
		var kappa = .5522848,
			ox = (w / 2) * kappa, // control point offset horizontal
			oy = (h / 2) * kappa, // control point offset vertical
			xe = x + w, // x-end
			ye = y + h, // y-end
			xm = x + w / 2, // x-middle
			ym = y + h / 2; // y-middle

		ctx.beginPath();
		ctx.moveTo(x, ym);
		ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
		ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
		ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
		ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
		ctx.closePath();
		if ( stroke == true)
			ctx.stroke();
		if (fill == true)
			ctx.fill();
	}

}

export default Ellipse_class;
