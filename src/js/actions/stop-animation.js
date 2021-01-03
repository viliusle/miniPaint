import app from './../app.js';
import config from './../config.js';
import { Base_action } from './base.js';

export class Stop_animation_action extends Base_action {
	/**
	 * Stops the currently playing animation, both do and undo states will stop animation
	 */
	constructor(reset_layer_visibility) {
		super('stop_animation', 'Stop Animation');
		this.reset_layer_visibility = !!reset_layer_visibility;
	}

	async do() {
		super.do();
		const animation_tool = app.GUI.GUI_tools.tools_modules.animation.object;
		var params = animation_tool.getParams();
		if (animation_tool.intervalID == null)
			return;

		clearInterval(animation_tool.intervalID);
		params.play = false;
		animation_tool.index = 0;
		animation_tool.GUI_tools.show_action_attributes();

		// make all visible
		if (this.reset_layer_visibility) {
			for (let i in config.layers) {
				config.layers[i].visible = true;
			}
		}

		animation_tool.Base_gui.GUI_layers.render_layers();
		config.need_render = true;
	}

	async undo() {
		super.undo();
		const animation_tool = app.GUI.GUI_tools.tools_modules.animation.object;
		var params = animation_tool.getParams();
		if (animation_tool.intervalID == null)
			return;

		clearInterval(animation_tool.intervalID);
		params.play = false;
		animation_tool.index = 0;
		animation_tool.GUI_tools.show_action_attributes();

		// make all visible
		if (this.reset_layer_visibility) {
			for (let i in config.layers) {
				config.layers[i].visible = true;
			}
		}

		animation_tool.Base_gui.GUI_layers.render_layers();
		config.need_render = true;
	}
}