import app from '../app.js';
import config from '../config.js';
import { Base_action } from './base.js';

export class Select_layer_action extends Base_action {
	/**
	 * marks layer as selected, active
	 *
	 * @param {int} layer_id
	 */
	constructor(layer_id, ignore_same_selection = false) {
		super('select_layer', 'Select Layer');
		this.reset_selection_action = null;
		this.layer_id = parseInt(layer_id);
		this.ignore_same_selection = ignore_same_selection;
		this.old_layer = null;
	}

	async do() {
		super.do();

		let old_layer = config.layer;
		let new_layer = app.Layers.get_layer(this.layer_id);

		if (old_layer !== new_layer) {
			this.old_layer = old_layer;
			config.layer = new_layer;
		} else if (!this.ignore_same_selection) {
			throw new Error('Aborted - Layer already selected');
		}

		this.reset_selection_action = new app.Actions.Reset_selection_action();
		await this.reset_selection_action.do();

		app.Layers.render();
		app.GUI.GUI_layers.render_layers();
	}

	async undo() {
		super.undo();

		if (this.reset_selection_action) {
			await this.reset_selection_action.undo();
			this.reset_selection_action = null;
		}

		config.layer = this.old_layer;
		this.old_layer = null;

		app.Layers.render();
		app.GUI.GUI_layers.render_layers();
	}

	free() {
		this.old_layer = null;
	}
}