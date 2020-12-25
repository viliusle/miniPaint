import app from './../app.js';
import config from './../config.js';
import { Base_action } from './base.js';

export class Delete_layer_settings_action extends Base_action {
	/**
	 * Deletes the specified settings in a layer
	 *
	 * @param {int} layer_id
	 * @param {array} setting_names 
	 */
	constructor(layer_id, setting_names) {
		super('delete_layer_settings', 'Delete Layer Settings');
		this.layer_id = parseInt(layer_id);
		this.setting_names = setting_names;
		this.reference_layer = null;
		this.old_settings = {};
	}

	async do() {
		super.do();
		this.reference_layer = app.Layers.get_layer(this.layer_id);
		if (!this.reference_layer) {
			throw new Error('Aborted - layer with specified id doesn\'t exist');
		}
		for (let name in this.setting_names) {
			this.old_settings[name] = this.reference_layer[name];
			delete this.reference_layer[name];
		}
		config.need_render = true;
	}

	async undo() {
		super.undo();
		if (this.reference_layer) {
			for (let i in this.old_settings) {
				this.reference_layer[i] = this.old_settings[i];
			}
			this.old_settings = {};
		}
		this.reference_layer = null;
		config.need_render = true;
	}

	free() {
		this.setting_names = null;
		this.reference_layer = null;
		this.old_settings = null;
	}
}