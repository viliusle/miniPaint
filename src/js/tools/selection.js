import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';
import Base_selection_class from './../core/base-selection.js';
import GUI_tools_class from './../core/gui/gui-tools.js';
import alertify from './../../../node_modules/alertifyjs/build/alertify.min.js';

var instance = null;

class Selection_class extends Base_tools_class {

	constructor(ctx) {
		super();

		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		var _this = this;

		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = 'selection';
		this.type = null;
		this.tmpCanvas = null;
		this.tmpCanvasCtx = null;
		this.selection_coords_from = null;
		this.selection = {
			x: null,
			y: null,
			width: null,
			height: null,
		};

		var sel_config = {
			enable_background: true,
			enable_borders: true,
			enable_controls: false,
			data_function: function () {
				return _this.selection;
			},
		};
		this.Base_selection = new Base_selection_class(ctx, sel_config, this.name);
		this.GUI_tools = new GUI_tools_class();
	}

	dragStart(event) {
		var _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mousedown(event);
	}

	dragMove(event) {
		var _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mousemove(event);
	}

	dragEnd(event) {
		var _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mouseup(event);
	}

	load() {
		var _this = this;

		//mouse events
		document.addEventListener('mousedown', function (event) {
			_this.dragStart(event);
		});
		document.addEventListener('mousemove', function (event) {
			_this.dragMove(event);
		});
		document.addEventListener('mouseup', function (event) {
			_this.dragEnd(event);
		});

		// collect touch events
		document.addEventListener('touchstart', function (event) {
			_this.dragStart(event);
		});
		document.addEventListener('touchmove', function (event) {
			_this.dragMove(event);
		});
		document.addEventListener('touchend', function (event) {
			_this.dragEnd(event);
		});

		document.addEventListener('keydown', function (e) {
			var code = e.keyCode;
			if (e.target.type == 'text' || e.target.tagName == 'INPUT' || e.target.type == 'textarea')
				return;

			if (code == 27) {
				//escape
				_this.on_leave();
			}
			if (code == 46) {
				//delete
				if (config.TOOL.name == _this.name) {
					window.State.save();
					_this.delete_selection();
				}
			}
			if (code == 65 && (e.ctrlKey == true || e.metaKey)) {
				//A
				e.preventDefault();
				_this.select_all();
			}
		}, false);
	}

	mousedown(e) {
		var mouse = this.get_mouse_info(e);
		var layer = config.layer;
		if (mouse.valid == false || mouse.click_valid == false)
			return;

		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}

		if (this.selection.width != null && this.selection.height != null
			&& mouse.x > this.selection.x
			&& mouse.x < this.selection.x + this.selection.width
			&& mouse.y > this.selection.y
			&& mouse.y < this.selection.y + this.selection.height
			&& layer.width == layer.width_original && layer.height == layer.height_original
			) {
			//move
			this.type = 'move';

			if (this.tmpCanvas == null) {
				this.init_tmp_canvas();

				//register tmp canvas for faster redraw
				config.layer.link_canvas = this.tmpCanvas;
				config.need_render = true;
			}
		}
		else {
			//save last translation?
			if (this.selection.width != null && this.selection.height != null) {
				this.save_translate();
			}

			//create new selection
			this.selection = {
				x: mouse.x,
				y: mouse.y,
				width: 0,
				height: 0,
			};
			this.type = 'create';
			this.selection_coords_from = {x: mouse.x, y: mouse.y};
		}
	}

	mousemove(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.is_drag == false)
			return;
		if (e.type == 'mousedown' && (mouse.valid == false || mouse.click_valid == false) || config.layer.type != 'image') {
			return;
		}
		if (this.selection_coords_from === null) {
			return;
		}
		if (this.type == 'create') {
			//create new selection
			this.selection.width = mouse.x - mouse.click_x;
			this.selection.height = mouse.y - mouse.click_y;
			config.need_render = true;
		}
		else {
			//move selection
			var selection = this.selection;
			var layer = config.layer;
			var x = this.selection.x + (mouse.x - mouse.last_x);
			var y = this.selection.y + (mouse.y - mouse.last_y);
			var width = Math.ceil(selection.width);
			var height = Math.ceil(selection.height);
			var from_x = this.selection_coords_from.x;
			var from_y = this.selection_coords_from.y;

			this.Base_selection.set_selection(x, y, null, null);

			//move data
			this.tmpCanvasCtx.clearRect(0, 0, layer.width, layer.height);
			this.tmpCanvasCtx.drawImage(layer.link, 0, 0, layer.width, layer.height);
			this.tmpCanvasCtx.clearRect(from_x - layer.x, from_y - layer.y, selection.width, selection.height);
			this.tmpCanvasCtx.drawImage(layer.link,
				Math.round(from_x - layer.x), Math.round(from_y - layer.y), width, height,
				Math.round(selection.x - layer.x), Math.round(selection.y - layer.y), width, height
				);

			//draw draft preview
			config.need_render = true;
		}
	}

	mouseup(e) {
		var mouse = this.get_mouse_info(e);

		if ((e.type == 'mousedown' && mouse.click_valid == false) || config.layer.type != 'image') {
			return;
		}

		var width = mouse.x - this.selection.x;
		var height = mouse.y - this.selection.y;

		if (width == 0 || height == 0) {
			//cancel selection
			this.on_leave();
			return;
		}

		if (this.selection.width != null && this.selection.height != null) {
			//make sure coords not negative
			var details = this.selection;
			var x = details.x;
			var y = details.y;
			if (details.width < 0) {
				x = x + details.width;
				this.selection_coords_from.x = x;
			}
			if (details.height < 0) {
				y = y + details.height;
				this.selection_coords_from.y = y;
			}
			this.selection = {
				x: x,
				y: y,
				width: Math.abs(details.width),
				height: Math.abs(details.height),
			};
			config.need_render = true;
		}
	}

	select_all() {
		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}
		if (config.TOOL.name != 'selection') {
			this.GUI_tools.activate_tool(this.name);
		}

		this.selection = {
			x: 0,
			y: 0,
			width: config.WIDTH,
			height: config.HEIGHT,
		};
		config.need_render = true;
	}

	render(ctx, layer) {
		//nothing
	}

	save_translate() {
		if (this.tmpCanvas == null)
			return;

		delete config.layer.link_canvas;
		this.Base_layers.update_layer_image(this.tmpCanvas);

		this.reset_tmp_canvas();
		config.need_render = true;
	}

	delete_selection() {
		var selection = this.selection;
		var layer = config.layer;

		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}

		if (selection == null) {
			alertify.error('Nothing is selected.');
			return;
		}

		this.init_tmp_canvas();

		var mouse_x = selection.x - layer.x;
		var mouse_y = selection.y - layer.y;

		//adapt to origin size
		mouse_x = this.adaptSize(mouse_x, 'width');
		mouse_y = this.adaptSize(mouse_y, 'height');
		selection.width = this.adaptSize(selection.width, 'width');
		selection.height = this.adaptSize(selection.height, 'height');

		//do erase
		this.tmpCanvasCtx.clearRect(mouse_x, mouse_y, selection.width, selection.height);

		this.Base_layers.update_layer_image(this.tmpCanvas);
		this.selection = {
			x: null,
			y: null,
			width: null,
			height: null,
		};
		this.Base_selection.reset_selection();
		this.reset_tmp_canvas();

		delete config.layer.link_canvas;
		this.reset_tmp_canvas();
	}

	init_tmp_canvas() {
		this.tmpCanvas = document.createElement('canvas');
		this.tmpCanvasCtx = this.tmpCanvas.getContext("2d");
		this.tmpCanvas.width = config.layer.width_original;
		this.tmpCanvas.height = config.layer.height_original;
		this.tmpCanvasCtx.drawImage(config.layer.link, 0, 0);
	}

	on_leave() {
		this.selection = {
			x: null,
			y: null,
			width: null,
			height: null,
		};
		this.Base_selection.reset_selection();
		delete config.layer.link_canvas;
		this.reset_tmp_canvas();
	}

	clear_selection() {
		this.on_leave();
	}

	reset_tmp_canvas() {
		if (this.tmpCanvas == null)
			return;
		this.tmpCanvas.width = 1;
		this.tmpCanvas.height = 1;
		this.tmpCanvas = null;
		this.tmpCanvasCtx = null;
	}

}
;
export default Selection_class;
