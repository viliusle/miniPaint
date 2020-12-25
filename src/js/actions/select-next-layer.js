import app from './../app.js';
import config from './../config.js';
import { Base_action } from './base.js';

export class Select_next_layer_action extends Base_action {
	constructor(reference_layer_id) {
		super('select_next_layer', 'Select Next Layer');
		this.reference_layer_id = reference_layer_id;
		this.old_config_layer = null;
	}

	async do() {
		super.do();
		const next_layer = app.Layers.find_next(this.reference_layer_id);
		if (!next_layer) {
			throw new Error('Aborted - Next layer to select not found');
		}
		this.old_config_layer = config.layer;
		config.layer = next_layer;

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