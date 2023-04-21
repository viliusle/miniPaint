import app from './../app.js';
import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';
import alertify from './../../../node_modules/alertifyjs/build/alertify.min.js';

class Erase_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = 'erase';
		this.tmpCanvas = null;
		this.tmpCanvasCtx = null;
		this.started = false;
	}

	load() {
		this.default_events();
	}

	default_dragMove(event, is_touch) {
		if (config.TOOL.name != this.name)
			return;
		this.mousemove(event, is_touch);

		//mouse cursor
		var mouse = this.get_mouse_info(event);
		var params = this.getParams();
		if (params.circle == true)
			this.show_mouse_cursor(mouse.x, mouse.y, params.size, 'circle');
		else
			this.show_mouse_cursor(mouse.x, mouse.y, params.size, 'rect');
	}

	on_params_update() {
		var params = this.getParams();
		var strict_element = document.querySelector('.attributes #strict');

		if (params.circle == false) {
			//hide strict controls
			strict_element.style.display = 'none';
		}
		else {
			//show strict controls
			strict_element.style.display = 'block';
		}
	}

	mousedown(e) {
		this.started = false;
		var mouse = this.get_mouse_info(e);
		var params = this.getParams();
		if (mouse.click_valid == false) {
			return;
		}
		if (config.layer.type != 'image') {
			alertify.error('This layer must contain an image. Please convert it to raster to apply this tool.');
			return;
		}
		if (config.layer.is_vector == true) {
			alertify.error('Layer is vector, convert it to raster to apply this tool.');
			return;
		}
		if (config.layer.rotate || 0 > 0) {
			alertify.error('Erase on rotate object is disabled. Please rasterize first.');
			return;
		}
		this.started = true;

		//get canvas from layer
		this.tmpCanvas = document.createElement('canvas');
		this.tmpCanvasCtx = this.tmpCanvas.getContext("2d");
		this.tmpCanvas.width = config.layer.width_original;
		this.tmpCanvas.height = config.layer.height_original;
		this.tmpCanvasCtx.drawImage(config.layer.link, 0, 0);

		this.tmpCanvasCtx.scale(
			config.layer.width_original / config.layer.width,
			config.layer.height_original / config.layer.height
		);

		//do erase
		this.erase_general(this.tmpCanvasCtx, 'click', mouse, params.size, params.strict, params.circle);

		//register tmp canvas for faster redraw
		config.layer.link_canvas = this.tmpCanvas;
		config.need_render = true;
	}

	mousemove(e, is_touch) {
		var mouse = this.get_mouse_info(e);
		var params = this.getParams();
		if (mouse.is_drag == false)
			return;
		if (mouse.click_valid == false) {
			return;
		}
		if (this.started == false) {
			return;
		}
		if (mouse.click_x == mouse.x && mouse.click_y == mouse.y) {
			//same coordinates
			return;
		}

		//do erase
		this.erase_general(this.tmpCanvasCtx, 'move', mouse, params.size, params.strict, params.circle, is_touch);

		//draw draft preview
		config.need_render = true;
	}

	mouseup(e) {
		if (this.started == false) {
			return;
		}
		delete config.layer.link_canvas;

		app.State.do_action(
			new app.Actions.Bundle_action('erase_tool', 'Erase Tool', [
				new app.Actions.Update_layer_image_action(this.tmpCanvas)
			])
		);

		//decrease memory
		this.tmpCanvas.width = 1;
		this.tmpCanvas.height = 1;
		this.tmpCanvas = null;
		this.tmpCanvasCtx = null;
	}

	erase_general(ctx, type, mouse, size, strict, is_circle, is_touch) {
		var mouse_x = Math.round(mouse.x) - config.layer.x;
		var mouse_y = Math.round(mouse.y) - config.layer.y;
		var alpha = config.ALPHA;
		var mouse_last_x = parseInt(mouse.last_x) - config.layer.x;
		var mouse_last_y = parseInt(mouse.last_y) - config.layer.y;

		ctx.beginPath();
		ctx.lineWidth = size;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		if (alpha < 255)
			ctx.strokeStyle = "rgba(255, 255, 255, " + alpha / 255 / 10 + ")";
		else
			ctx.strokeStyle = "rgba(255, 255, 255, 1)";

		if (is_circle == false) {
			//rectangle
			var size_half = Math.ceil(size / 2);
			if (size == 1) {
				//single cell mode
				mouse_x = Math.floor(mouse.x) - config.layer.x;
				mouse_y = Math.floor(mouse.y) - config.layer.y;
				size_half = 0;
			}
			ctx.save();
			ctx.globalCompositeOperation = 'destination-out';
			ctx.fillStyle = "rgba(255, 255, 255, " + alpha / 255 + ")";
			ctx.fillRect(mouse_x - size_half, mouse_y - size_half, size, size);
			ctx.restore();
		}
		else {
			//circle
			ctx.save();

			if (strict == false) {
				var radgrad = ctx.createRadialGradient(
					mouse_x, mouse_y, size / 8,
					mouse_x, mouse_y, size / 2);
				if (type == 'click')
					radgrad.addColorStop(0, "rgba(255, 255, 255, " + alpha / 255 + ")");
				else if (type == 'move')
					radgrad.addColorStop(0, "rgba(255, 255, 255, " + alpha / 255 / 2 + ")");
				radgrad.addColorStop(1, "rgba(255, 255, 255, 0)");
			}

			//set Composite
			ctx.globalCompositeOperation = 'destination-out';
			if (strict == true)
				ctx.fillStyle = "rgba(255, 255, 255, " + alpha / 255 + ")";
			else
				ctx.fillStyle = radgrad;
			ctx.beginPath();
			ctx.arc(mouse_x, mouse_y, size / 2, 0, Math.PI * 2, true);
			ctx.fill();
			ctx.restore();
		}

		//extra work if mouse moving fast - fill gaps
		if (type == 'move' && is_circle == true && mouse_last_x != false && mouse_last_y != false && is_touch !== true) {
			ctx.save();
			ctx.globalCompositeOperation = 'destination-out';

			ctx.beginPath();
			ctx.moveTo(mouse_last_x, mouse_last_y);
			ctx.lineTo(mouse_x, mouse_y);
			ctx.stroke();

			ctx.restore();
		}
	}

}
export default Erase_class;
