import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';
import GUI_tools_class from './../core/gui/gui-tools.js';
import Base_gui_class from './../core/base-gui.js';
import Base_selection_class from './../core/base-selection.js';
import alertify from './../../../node_modules/alertifyjs/build/alertify.min.js';

var instance = null;

class Animation_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.GUI_tools = new GUI_tools_class();
		this.Base_gui = new Base_gui_class();
		this.name = 'animation';
		this.intervalID = null;
		this.index = 0;

		this.disable_selection(ctx);
	}

	load() {
		//nothing
	}

	render(ctx, layer) {
		//nothing
	}

	/**
	 * disable_selection
	 */
	disable_selection(ctx) {
		var sel_config = {
			enable_background: false,
			enable_borders: false,
			enable_controls: false,
			data_function: function () {
				return null;
			},
		};
		this.Base_selection = new Base_selection_class(ctx, sel_config, this.name);
	}

	on_params_update() {
		var params = this.getParams();
		if (config.layers.length == 1) {
			alertify.error('Can not animate 1 layer.');
			return;
		}

		if (params.play == true) {
			this.start(params.delay);
		}
		else {
			this.stop();
		}
	}

	on_leave() {
		this.stop();
	}

	start(delay) {
		var _this = this;
		delay = parseInt(delay);
		if (delay < 0)
			delay = 50;

		this.intervalID = window.setInterval(function () {
			_this.play(_this);
		}, delay);
	}

	stop() {
		var params = this.getParams();
		if (this.intervalID == null)
			return;

		clearInterval(this.intervalID);
		params.play = false;
		this.index = 0;
		this.GUI_tools.show_action_attributes();

		//make all visible
		for (var i in config.layers) {
			config.layers[i].visible = true;
		}

		this.Base_gui.GUI_layers.render_layers();
		config.need_render = true;
	}

	play(_this) {

		for (var i in config.layers) {
			config.layers[i].visible = false;
		}

		//show 1
		if (config.layers[this.index] != undefined) {
			_this.Base_layers.toggle_visibility(config.layers[this.index].id);
		}

		//change index
		if (config.layers[this.index + 1] != undefined) {
			this.index++;
		}
		else {
			this.index = 0;
		}
	}

}
;
export default Animation_class;
