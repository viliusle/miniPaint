import app from './../app.js';
import config from './../config.js';
import { Base_action } from './base.js';

export class Select_previous_layer_action extends Base_action {
	constructor(reference_layer_id) {
		super('select_previous_layer', 'Select Previous Layer');
		this.reference_layer_id = reference_layer_id;
		this.old_config_layer = null;
	}

	async do() {
		super.do();
		const previous_layer = app.Layers.find_previous(this.reference_layer_id);
		if (!previous_layer) {
			throw new Error('Aborted - Previous layer to select not found');
		}
		this.old_config_layer = config.layer;
		config.layer = previous_layer;

		app.Layers.render();
		app.GUI.GUI_layers.render_layers();
	}

	async undo() {
		super.undo();
		config.layer = this.old_config_layer;
		this.old_config_layer = null;

		app.Layers.render();
		app.GUI.GUI_layers.render_layers();
	}
}