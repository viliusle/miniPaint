import app from './../app.js';
import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';
import alertify from './../../../node_modules/alertifyjs/build/alertify.min.js';
import ImageFilters from './../libs/imagefilters.js';
import Helper_class from './../libs/helpers.js';

class Blur_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
		this.ctx = ctx;
		this.name = 'blur';
		this.tmpCanvas = null;
		this.tmpCanvasCtx = null;
		this.started = false;
	}

	load() {
		this.default_events();
	}

	default_dragMove(event) {
		if (config.TOOL.name != this.name)
			return;
		this.mousemove(event);

		//mouse cursor
		var mouse = this.get_mouse_info(event);
		var params = this.getParams();
		this.show_mouse_cursor(mouse.x, mouse.y, params.size, 'circle');
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

		//do blur
		this.blur_general('click', mouse, params.size, params.strength);

		//register tmp canvas for faster redraw
		config.layer.link_canvas = this.tmpCanvas;
		config.need_render = true;
	}

	mousemove(e) {
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

		//do blur
		this.blur_general('move', mouse, params.size, params.strength);

		//draw draft preview
		config.need_render = true;
	}

	mouseup(e) {
		if (this.started == false) {
			return;
		}
		delete config.layer.link_canvas;

		app.State.do_action(
			new app.Actions.Bundle_action('blur_tool', 'Blur Tool', [
				new app.Actions.Update_layer_image_action(this.tmpCanvas)
			])
		);

		//decrease memory
		this.tmpCanvas.width = 1;
		this.tmpCanvas.height = 1;
		this.tmpCanvas = null;
		this.tmpCanvasCtx = null;
	}

	blur_general(type, mouse, size, strength) {
		var ctx = this.tmpCanvasCtx;
		var mouse_x = Math.round(mouse.x) - config.layer.x;
		var mouse_y = Math.round(mouse.y) - config.layer.y;

		//adapt to origin size
		mouse_x = this.adaptSize(mouse_x, 'width');
		mouse_y = this.adaptSize(mouse_y, 'height');
		var size_w = this.adaptSize(size, 'width');
		var size_h = this.adaptSize(size, 'height');

		//find center
		var center_x = mouse_x - Math.round(size_w / 2);
		var center_y = mouse_y - Math.round(size_h / 2);

		//convert float coords to integers
		center_x = Math.round(center_x);
		center_y = Math.round(center_y);
		mouse_x = Math.round(mouse_x);
		mouse_y = Math.round(mouse_y);

		if (type == 'move') {
			strength = strength / 2;
			if (strength < 1)
				strength = 1;
		}

		var imageData = ctx.getImageData(center_x, center_y, size_w, size_h);
		var filtered = ImageFilters.StackBlur(imageData, strength); //add effect
		this.Helper.image_round(this.tmpCanvasCtx, mouse_x, mouse_y, size_w, size_h, filtered);
	}

}
export default Blur_class;
