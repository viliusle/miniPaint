import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';
import Layer_raster_class from './../modules/layer/raster.js';
import alertify from './../../../node_modules/alertifyjs/build/alertify.min.js';

class Clone_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.Layer_raster = new Layer_raster_class();
		this.ctx = ctx;
		this.name = 'clone';
		this.tmpCanvas = null;
		this.tmpCanvasCtx = null;
		this.started = false;
		this.clone_coords = null;
	}

	load() {
		var _this = this;

		//mouse events
		document.addEventListener('mousedown', function (e) {
			if (config.TOOL.name != _this.name)
				return;
			_this.mousedown(e);
		});
		document.addEventListener('mousemove', function (e) {
			if (config.TOOL.name != _this.name)
				return;
			_this.mousemove(e);

			//mouse cursor
			var mouse = _this.get_mouse_info(e);
			var params = _this.getParams();
			_this.show_mouse_cursor(mouse.x, mouse.y, params.size, 'circle');
		});
		document.addEventListener('mouseup', function (e) {
			if (config.TOOL.name != _this.name)
				return;
			_this.mouseup(e);
		});
		document.addEventListener('contextmenu', function (e) {
			if (config.TOOL.name != _this.name)
				return;
			_this.mouseRightClick(e);
		});
	}

	on_params_update() {
		var params = this.getParams();
		var strict_element = document.getElementById('strict');

		if (params.circle == false) {
			//hide strict controlls
			strict_element.style.display = 'none';
		}
		else {
			//show strict controlls
			strict_element.style.display = 'block';
		}
	}

	mouseRightClick(e) {
		var mouse = this.get_mouse_info(e);
		var params = this.getParams();

		if (mouse.valid == true) {
			e.preventDefault();
		}
		if (params.source_layer.value == 'Previous' && config.layer.type === null) {
			this.Layer_raster.raster();
		}
		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}
		if (config.layer.rotate || 0 > 0) {
			alertify.error('Erase on rotate object is disabled. Sorry.');
			return;
		}
		if (e.which == 3 && mouse.valid == true) {
			//right click - save coords

			var mouse_x = this.adaptSize(mouse.x, 'width');
			var mouse_y = this.adaptSize(mouse.y, 'height');

			this.clone_coords = {
				x: mouse_x,
				y: mouse_y,
			};
		}
	}

	mousedown(e) {
		this.started = false;
		var mouse = this.get_mouse_info(e);
		var params = this.getParams();
		var layer = config.layer;
		var previous_layer = this.Base_layers.find_previous(config.layer.id);

		if (mouse.valid == false || mouse.click_valid == false) {
			return;
		}

		if (params.source_layer.value == 'Previous' && config.layer.type === null) {
			this.Layer_raster.raster();
		}
		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}
		if (config.layer.rotate || 0 > 0) {
			alertify.error('Erase on rotate object is disabled. Sorry.');
			return;
		}
		if (this.clone_coords === null) {
			alertify.error('Source is empty, right click on image to save source position.');
			return;
		}
		if (layer.width != layer.width_original || layer.height != layer.height_original) {
			alertify.error('Clone tool disabled for resized image. Sorry.');
			return;
		}
		if (params.source_layer.value == 'Previous' && 
			(previous_layer.width != previous_layer.width_original 
			|| previous_layer.height != previous_layer.height_original)) {
			alertify.error('Clone tool disabled for resized image. Sorry.');
			return;
		}
		if (params.source_layer.value == 'Previous') {
			if (previous_layer == null) {
				alertify.error('Can not find previous layer.');
				return;
			}
			if (previous_layer.type != 'image') {
				alertify.error('Previous layer must be image, convert it to raster to apply this tool.');
				return;
			}
		}
		this.started = true;
		window.State.save();

		//get canvas from layer
		this.tmpCanvas = document.createElement('canvas');
		this.tmpCanvasCtx = this.tmpCanvas.getContext("2d");
		this.tmpCanvas.width = config.layer.width_original;
		this.tmpCanvas.height = config.layer.height_original;
		this.tmpCanvasCtx.drawImage(config.layer.link, 0, 0);

		//clone
		this.clone_general(this.tmpCanvas, this.tmpCanvas, 'click', mouse);

		//register tmp canvas for progress redraw
		config.layer.link_canvas = this.tmpCanvas;
		config.need_render = true;
	}

	mousemove(e) {
		var mouse = this.get_mouse_info(e);
		var params = this.getParams();

		if (mouse.is_drag == false)
			return;
		if (mouse.valid == false || mouse.click_valid == false) {
			return;
		}
		if (this.started == false) {
			return;
		}

		//clone
		this.clone_general(this.tmpCanvas, this.tmpCanvas, 'move', mouse);

		//draw draft preview
		config.need_render = true;
	}

	mouseup(e) {
		if (this.started == false) {
			return;
		}
		delete config.layer.link_canvas;

		this.Base_layers.update_layer_image(this.tmpCanvas);

		//decrease memory
		this.tmpCanvas.width = 1;
		this.tmpCanvas.height = 1;
		this.tmpCanvas = null;
		this.tmpCanvasCtx = null;
	}

	clone_general(canvas_from, canvas_to, type, mouse) {
		var params = this.getParams();

		var mouse_x = Math.round(mouse.x) - config.layer.x;
		var mouse_y = Math.round(mouse.y) - config.layer.y;
		var half = Math.round(params.size / 2);

		//adapt to origin size
		mouse_x = this.adaptSize(mouse_x, 'width');
		mouse_y = this.adaptSize(mouse_y, 'height');

		//convert float coords to integers
		mouse_x = Math.round(mouse_x);
		mouse_y = Math.round(mouse_y);

		//create source canvas
		var canvas_source = document.createElement("canvas");
		var ctx_source = canvas_source.getContext("2d");
		var w = Math.ceil(params.size);
		var h = Math.ceil(params.size);
		canvas_source.width = w;
		canvas_source.height = h;

		//add data
		var x_from = Math.round(this.clone_coords.x - (mouse.click_x - mouse_x));
		var y_from = Math.round(this.clone_coords.y - (mouse.click_y - mouse_y));
		if (params.anti_aliasing == false) {
			ctx_source.arc(half, half, half, 0, Math.PI * 2, false);
			ctx_source.clip();
		}
		if (params.source_layer.value == 'Previous') {
			var previous_layer = this.Base_layers.find_previous(config.layer.id);

			x_from = Math.round(this.clone_coords.x - (mouse.click_x - mouse_x)) - previous_layer.x + config.layer.x;
			y_from = Math.round(this.clone_coords.y - (mouse.click_y - mouse_y)) - previous_layer.y + config.layer.y;

			ctx_source.drawImage(previous_layer.link, x_from - half, y_from - half, w, h, 0, 0, w, h);
		}
		else {
			ctx_source.drawImage(canvas_from, x_from - half, y_from - half, w, h, 0, 0, w, h);
		}

		//apply anti aliasing
		if (params.anti_aliasing == true) {
			var gradient = ctx_source.createRadialGradient(half, half, 0, half, half, half + 1);
			gradient.addColorStop(0, 'white');
			gradient.addColorStop(0.3, 'white');
			gradient.addColorStop(1, 'transparent');
			ctx_source.fillStyle = gradient;

			ctx_source.globalCompositeOperation = 'destination-in';
			ctx_source.fillRect(0, 0, params.size, params.size);
			ctx_source.globalCompositeOperation = 'source-over';
		}

		//finish
		canvas_to.getContext("2d").drawImage(canvas_source, mouse_x - half, mouse_y - half);
	}

}
export default Clone_class;
