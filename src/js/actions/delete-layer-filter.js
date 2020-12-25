import app from './../app.js';
import config from './../config.js';
import { Base_action } from './base.js';

export class Delete_layer_filter_action extends Base_action {
	/**
	 * delete live filter
	 *
	 * @param {int} layer_id
	 * @param {string} filter_id
	 */
	constructor(layer_id, filter_id) {
		super('delete_layer_filter', 'Delete Layer Filter');
		if (layer_id == null)
			layer_id = config.layer.id;
		this.layer_id = parseInt(layer_id);
		this.filter_id = filter_id;
		this.reference_layer = null;
		this.filter_remove_index = null;
		this.old_filter = null;
	}

	async do() {
		super.do();
		this.reference_layer = app.Layers.get_layer(this.layer_id);
		if (!this.reference_layer) {
			throw new Error('Aborted - layer with specified id doesn\'t exist');
		}
		this.old_filter = null;
		for (let i in this.reference_layer.filters) {
			if (this.reference_layer.filters[i].id == this.filter_id) {
				this.filter_remove_index = i;
				this.old_filter = this.reference_layer.filters.splice(i, 1)[0];
				break;
			}
		}
		if (!this.old_filter) {
			throw new Error('Aborted - filter with specified id doesn\'t exist in layer');
		}
		config.need_render = true;
		app.GUI.GUI_layers.render_layers();
	}

	async undo() {
		super.undo();
		if (this.reference_layer && this.old_filter) {
			this.reference_layer.filters.splice(this.filter_remove_index, 0, this.old_filter);
		}
		this.reference_layer = null;
		this.old_filter = null;
		this.filter_remove_index = null;
		config.need_render = true;
		app.GUI.GUI_layers.render_layers();
	}

	free() {
		this.reference_layer = null;
		this.old_filter = null;
	}
}