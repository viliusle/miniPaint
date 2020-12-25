import app from '../app.js';
import config from '../config.js';
import { Base_action } from './base.js';

export class Toggle_layer_visibility_action extends Base_action {
	/**
	 * toggle layer visibility
	 *
	 * @param {int} layer_id
	 */
	constructor(layer_id) {
		super('toggle_layer_visibility', 'Toggle Layer Visibility');
		this.layer_id = parseInt(layer_id);
		this.old_visible = null;
	}

	async do() {
		super.do();
		const layer = app.Layers.get_layer(this.layer_id);
		this.old_visible = layer.visible;
		if (layer.visible == false)
			layer.visible = true;
		else
			layer.visible = false;
		app.Layers.render();
		app.GUI.GUI_layers.render_layers();
	}

	async undo() {
		super.undo();
		const layer = app.Layers.get_layer(this.layer_id);
		layer.visible = this.old_visible;
		this.old_visible = null;
		app.Layers.render();
		app.GUI.GUI_layers.render_layers();
	}
}