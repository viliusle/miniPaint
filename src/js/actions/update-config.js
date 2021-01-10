import app from './../app.js';
import config from './../config.js';
import { Base_action } from './base.js';

export class Update_config_action extends Base_action {
	/**
	 * Updates the app config with the provided settings
	 *
	 * @param {object} settings 
	 */
	constructor(settings) {
		super('update_config', 'Update Config');
		this.settings = settings;
		this.old_settings = {};
	}

	async do() {
		super.do();
		for (let i in this.settings) {
			this.old_settings[i] = config[i];
			config[i] = this.settings[i];
		}
	}

	async undo() {
		super.undo();
		for (let i in this.old_settings) {
			config[i] = this.old_settings[i];
		}
		this.old_settings = {};
	}

	free() {
		this.settings = null;
		this.old_settings = null;
	}
}