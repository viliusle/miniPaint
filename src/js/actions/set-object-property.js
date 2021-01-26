import app from './../app.js';
import config from './../config.js';
import { Base_action } from './base.js';

export class Set_object_property_action extends Base_action {
	/**
	 * Sets a generic object property. I recommend against using this as it's generally a hack for edge cases.
	 *
	 * @param {string} layer_id
	 * @param {object} settings 
	 */
	constructor(object, property_name, value) {
		super('set_object_property', 'Set Object Property');
		this.object = object;
		this.property_name = property_name;
		this.value = value;
		this.old_value = null;
	}

	async do() {
		super.do();
		this.old_value = this.object[this.property_name];
		this.object[this.property_name] = this.value;
	}

	async undo() {
		super.undo();
		this.object[this.property_name] = this.old_value;
		this.old_value = null;
	}

	free() {
		this.object = null;
	}
}