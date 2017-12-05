import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';
import GUI_tools_class from './../core/gui/gui-tools.js';
import Base_gui_class from './../core/base-gui.js';
import Base_selection_class from './../core/base-selection.js';
import alertify from './../../../node_modules/alertifyjs/build/alertify.min.js';

class Crop_class extends Base_tools_class {

	constructor(ctx) {
		super();
		var _this = this;
		this.Base_layers = new Base_layers_class();
		this.Base_gui = new Base_gui_class();
		this.GUI_tools = new GUI_tools_class();
		this.ctx = ctx;
		this.name = 'crop';
		this.selection = {
			x: null,
			y: null,
			width: null,
			height: null,
		};
		var sel_config = {
			enable_background: true,
			enable_borders: true,
			enable_controlls: true,
			data_function: function () {
				return _this.selection;
			},
		};
		this.Base_selection = new Base_selection_class(ctx, sel_config, this.name);
	}

	load() {
		var _this = this;

		//events
		document.addEventListener('mousedown', function (e) {
			if (config.TOOL.name != _this.name)
				return;
			_this.mousedown(e);
		});
		document.addEventListener('mousemove', function (e) {
			if (config.TOOL.name != _this.name)
				return;
			_this.mousemove(e);
		});
		document.addEventListener('mouseup', function (e) {
			if (config.TOOL.name != _this.name)
				return;
			_this.mouseup(e);
		});
	}

	mousedown(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.valid == false || mouse.click_valid == false)
			return;

		if (this.Base_selection.mouse_lock !== null) {
			return;
		}

		//create new selection
		this.Base_selection.set_selection(mouse.x, mouse.y, 0, 0);
	}

	mousemove(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.is_drag == false) {
			return;
		}
		if (e.type == 'mousedown' && (mouse.valid == false || mouse.click_valid == false)) {
			return;
		}
		if (this.Base_selection.mouse_lock !== null) {
			return;
		}

		var width = mouse.x - mouse.click_x;
		var height = mouse.y - mouse.click_y;

		this.Base_selection.set_selection(null, null, width, height);
	}

	mouseup(e) {
		var mouse = this.get_mouse_info(e);

		if (e.type == 'mousedown' && mouse.click_valid == false) {
			return;
		}

		var width = mouse.x - this.selection.x;
		var height = mouse.y - this.selection.y;

		if (width == 0 || height == 0) {
			//cancel selection
			this.Base_selection.reset_selection();
			config.need_render = true;
			return;
		}

		if (this.selection.width != null) {
			//make sure coords not negative
			var details = this.selection;
			var x = details.x;
			var y = details.y;
			if (details.width < 0) {
				x = x + details.width;
			}
			if (details.height < 0) {
				y = y + details.height;
			}
			this.selection = {
				x: x,
				y: y,
				width: Math.abs(details.width),
				height: Math.abs(details.height),
			};
		}

		//controll boundaries
		if (this.selection.x < 0) {
			this.selection.width += this.selection.x;
			this.selection.x = 0;
		}
		if (this.selection.y < 0) {
			this.selection.height += this.selection.y;
			this.selection.y = 0;
		}
		if (this.selection.x + this.selection.width > config.WIDTH) {
			this.selection.width = config.WIDTH - this.selection.x;
		}
		if (this.selection.y + this.selection.height > config.HEIGHT) {
			this.selection.height = config.HEIGHT - this.selection.y;
		}

		config.need_render = true;
	}

	render(ctx, layer) {
		//nothing
	}

	/**
	 * do actual crop
	 */
	on_params_update() {
		var params = this.getParams();
		var selection = this.selection;
		params.crop = true;
		this.GUI_tools.show_action_attributes();

		if (selection.width == null || selection.width == 0 || selection.height == 0) {
			alertify.error('Empty selection');
			return;
		}

		window.State.save();

		//controll boundaries
		selection.x = Math.max(selection.x, 0);
		selection.y = Math.max(selection.y, 0);
		selection.width = Math.min(selection.width, config.WIDTH);
		selection.height = Math.min(selection.height, config.HEIGHT);

		for (var i in config.layers) {
			var link = config.layers[i];
			if (link.type == null)
				continue;
			
			//move
			link.x -= parseInt(selection.x);
			link.y -= parseInt(selection.y);
			
			if(link.type == 'image'){
				//also remove unvisible data
				var left = 0;
				if(link.x < 0)
					left = -link.x;
				var top = 0;
				if(link.y < 0)
					top = -link.y;
				var right = 0;
				if(link.x + link.width > selection.width)
					right = link.x + link.width - selection.width;
				var bottom = 0;
				if(link.y + link.height > selection.height)
					bottom = link.y + link.height - selection.height;
				var width = link.width - left - right;
				var height = link.height - top - bottom;
				
				//if image was streched
				var width_ratio = (link.width / link.width_original);
				var height_ratio = (link.height / link.height_original);
				
				//create smaller canvas
				var canvas = document.createElement('canvas');
				var ctx = canvas.getContext("2d");
				canvas.width = width / width_ratio;
				canvas.height = height / height_ratio;
				
				//cut required part
				ctx.translate(-left / width_ratio, -top / height_ratio);
				canvas.getContext("2d").drawImage(link.link, 0, 0);
				ctx.translate(0, 0);
				this.Base_layers.update_layer_image(canvas, link.id);
				
				//update attributes
				link.width = Math.ceil(canvas.width * width_ratio);
				link.height = Math.ceil(canvas.height * height_ratio);
				link.x += left;
				link.y += top;
				link.width_original = canvas.width;
				link.height_original = canvas.height;
			}
		}

		config.WIDTH = parseInt(selection.width);
		config.HEIGHT = parseInt(selection.height);

		this.Base_gui.prepare_canvas();
		this.selection = {
			x: null,
			y: null,
			width: null,
			height: null,
		};
		this.Base_selection.reset_selection();
	}

	on_leave() {
		this.Base_selection.reset_selection();
	}

}

export default Crop_class;
