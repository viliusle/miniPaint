import app from './../app.js';
import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';
import GUI_tools_class from './../core/gui/gui-tools.js';
import Base_gui_class from './../core/base-gui.js';
import Base_selection_class from './../core/base-selection.js';
import alertify from './../../../node_modules/alertifyjs/build/alertify.min.js';

class Animation_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.GUI_tools = new GUI_tools_class();
		this.Base_gui = new Base_gui_class();
		this.name = 'animation';
		this.intervalID = null;
		this.index = 0;
		this.toggle_layer_visibility_action = new app.Actions.Toggle_layer_visibility_action();

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
			enable_rotation: false,
			enable_move: false,
			data_function: function () {
				return null;
			},
		};
		this.Base_selection = new Base_selection_class(ctx, sel_config, this.name);
	}

	on_params_update(data) {
		if(data.key != "play")
			return;

		var params = this.getParams();
		if (config.layers.length == 1) {
			alertify.error('Can not animate 1 layer.');
			return;
		}
		this.stop();

		if (params.play == true) {
			this.start(params.delay);
		}
	}

	on_activate() {
		return [
			new app.Actions.Stop_animation_action(false)
		];
	}

	on_leave() {
		return [
			new app.Actions.Stop_animation_action(true)
		];
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
		new app.Actions.Stop_animation_action(true).do();
	}

	play(_this) {

		for (var i in config.layers) {
			config.layers[i].visible = false;
		}

		//show 1
		if (config.layers[this.index] != undefined) {
			this.toggle_layer_visibility_action.layer_id = config.layers[this.index].id;
			this.toggle_layer_visibility_action.do();
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
