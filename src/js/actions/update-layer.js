import app from './../app.js';
import config from './../config.js';
import { Base_action } from './base.js';

export class Update_layer_action extends Base_action {
	/**
	 * Updates an existing layer with the provided settings
	 * WARNING: If passing objects or arrays into settings, make sure these are new or cloned objects, and not a modified existing object!
	 *
	 * @param {string} layer_id
	 * @param {object} settings 
	 */
	constructor(layer_id, settings) {
		super('update_layer', 'Update Layer');
		this.layer_id = layer_id;
		this.settings = settings;
		this.reference_layer = null;
		this.old_settings = {};
	}

	async do() {
		super.do();
		this.reference_layer = app.Layers.get_layer(this.layer_id);
		if (!this.reference_layer) {
			throw new Error('Aborted - layer with specified id doesn\'t exist');
		}
		for (let i in this.settings) {
			if (i == 'id')
				continue;
			if (i == 'order')
				continue;
			this.old_settings[i] = this.reference_layer[i];
			this.reference_layer[i] = this.settings[i];
		}
		if (this.reference_layer.type === 'text') {
			this.reference_layer._needs_update_data = true;
		}
		if (this.settings.params || this.settings.width || this.settings.height) {
			config.need_render_changed_params = true;
		}
		config.need_render = true;
	}

	async undo() {
		super.undo();
		if (this.reference_layer) {
			for (let i in this.old_settings) {
				this.reference_layer[i] = this.old_settings[i];
			}
			if (this.reference_layer.type === 'text') {
				this.reference_layer._needs_update_data = true;
			}
			if (this.old_settings.params || this.old_settings.width || this.old_settings.height) {
				config.need_render_changed_params = true;
			}
			this.old_settings = {};
		}
		this.reference_layer = null;
		config.need_render = true;
	}

	free() {
		this.settings = null;
		this.old_settings = null;
		this.reference_layer = null;
	}
}