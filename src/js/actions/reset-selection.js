import app from '../app.js';
import config from '../config.js';
import { Base_action } from './base.js';

export class Reset_selection_action extends Base_action {
	/**
	 * Sets the selection to empty
	 */
	constructor() {
        super('reset_selection', 'Reset Selection');
        this.settings_reference = null;
        this.old_settings_data = null;
	}

	async do() {
        super.do();
        this.settings_reference = app.Layers.Base_selection.find_settings();
        this.old_settings_data = JSON.parse(JSON.stringify(this.settings_reference.data));
        this.settings_reference.data = {
            x: null,
            y: null,
            width: null,
            height: null
        }
		config.need_render = true;
    }

    async undo() {
        super.undo();
        if (this.old_settings_data) {
            for (let prop in this.old_settings_data) {
                this.settings_reference.data[prop] = this.old_settings_data[prop];
            }
        }
        this.settings_reference = null;
        this.old_settings_data = null;
		config.need_render = true;
    }

    free() {
        this.settings_reference = null;
        this.old_settings_data = null;
    }
}