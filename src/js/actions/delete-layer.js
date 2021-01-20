import config from '../config.js';
import app from './../app.js';
import { Base_action } from './base.js';

export class Delete_layer_action extends Base_action {
	/**
	 * removes layer
	 *
	 * @param {int} id
	 * @param {boolean} force - Force to delete first layer?
	 */
	constructor(layer_id, force) {
		super('delete_layer', 'Delete Layer');
		this.layer_id = parseInt(layer_id);
		this.force = force || false;
		this.insert_layer_action = null;
		this.select_layer_action = null;
		this.delete_index = null;
		this.deleted_layer = null;
	}

	async do() {
		super.do();
		const id = this.layer_id;
		const force = this.force;

		// Determine if there is a layer to delete, abort if not
		for (var i in config.layers) {
			if (config.layers[i].id == id) {
				this.delete_index = i;
			}
		}
		if (this.delete_index === null) {
			throw new Error('Aborted - Layer to delete not found');
		}

		if (config.layers.length == 1 && (force == undefined || force == false)) {
			// Only 1 layer left
			if (config.layer.type == null) {
				//STOP
				throw new Error('Aborted - Will not delete last layer');
			}
			else {
				// Delete it, but before that - create new empty layer
				this.insert_layer_action = new app.Actions.Insert_layer_action();
				this.insert_layer_action.do();
			}
		}

		if (config.layers.length > 1 && config.layer.id == id) {
			// Select next or previous layer
			try {
				const select_action = new app.Actions.Select_next_layer_action(id);
				await select_action.do();
				this.select_layer_action = select_action;
			} catch (error) {
				const select_action = new app.Actions.Select_previous_layer_action(id);
				await select_action.do();
				this.select_layer_action = select_action;
			}
		}

		// Remove layer from list
		this.deleted_layer = config.layers.splice(this.delete_index, 1)[0];

		// Estimate memory
		if (this.deleted_layer.link && this.deleted_layer.link.src && typeof this.deleted_layer.link.src === 'string') {
			this.memory_estimate = new Blob([this.deleted_layer.link.src]).size;
		}

		app.Layers.render();
		app.GUI.GUI_layers.render_layers();
	}

	async undo() {
		super.undo();
		if (this.deleted_layer) {
			config.layers.splice(this.delete_index, 0, this.deleted_layer);
			this.delete_index = null;
			this.deleted_layer = null;
		}
		if (this.select_layer_action) {
			await this.select_layer_action.undo();
			this.select_layer_action.free();
			this.select_layer_action = null;
		}
		if (this.insert_layer_action) {
			await this.insert_layer_action.undo();
			this.insert_layer_action.free();
			this.insert_layer_action = null;
		}

		// Estimate memory
		this.memory_estimate = 0;

		app.Layers.render();
		app.GUI.GUI_layers.render_layers();
	}

	free() {
		if (this.deleted_layer) {
			delete this.deleted_layer.link;
			delete this.deleted_layer.data;
		}
		if (this.insert_layer_action) {
			this.insert_layer_action.free();
			this.insert_layer_action = null;
		}
		if (this.select_layer_action) {
			this.select_layer_action.free();
			this.select_layer_action = null;
		}
		this.deleted_layer = null;
	}
}