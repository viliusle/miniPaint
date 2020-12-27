import app from '../app.js';
import config from '../config.js';
import { Base_action } from './base.js';

export class Reset_layers_action extends Base_action {
	/*
	 * removes all layers
	 */
	constructor(auto_insert) {
		super('reset_layers', 'Reset Layers');
		this.auto_insert = auto_insert;
		this.previous_auto_increment = null;
		this.delete_actions = null;
		this.insert_action = null;
	}
	async do() {
		super.do();
		const auto_insert = this.auto_insert;
		this.previous_auto_increment = app.Layers.auto_increment;

		this.delete_actions = [];
		for (let i = config.layers.length - 1; i >= 0; i--) {
			const delete_action = new app.Actions.Delete_layer_action(config.layers[i].id, true);
			await delete_action.do();
			this.delete_actions.push(delete_action);
		}
		app.Layers.auto_increment = 1;

		if (auto_insert != undefined && auto_insert === true) {
			const settings = {};
			this.insert_action = new app.Actions.Insert_layer_action(settings);
			await this.insert_action.do();
		}

		app.Layers.render();
		app.GUI.GUI_layers.render_layers();
	}
	async undo() {
		super.undo();
		if (this.insert_action) {
			await this.insert_action.undo();
			this.insert_action.free();
			this.insert_action = null;
		}
		for (let i = this.delete_actions.length - 1; i >= 0; i--) {
			await this.delete_actions[i].undo();
			this.delete_actions[i].free();
		}
		app.Layers.auto_increment = this.previous_auto_increment;

		app.Layers.render();
		app.GUI.GUI_layers.render_layers();
	}
	free() {
		if (this.insert_action) {
			this.insert_action.free();
			this.insert_action = null;
		}
		if (this.delete_actions) {
			for (let action of this.delete_actions) {
				action.free();
			}
			this.delete_actions = null;
		}
	}
}