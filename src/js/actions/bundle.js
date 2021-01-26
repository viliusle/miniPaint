import config from '../config.js';
import { Base_action } from './base.js';

export class Bundle_action extends Base_action {
	/**
	 * Groups multiple actions together in the undo/redo history, runs them all at once.
	 */
	constructor(bundle_id, bundle_name, actions_to_do) {
		super(bundle_id, bundle_name);
		this.actions_to_do = actions_to_do;
	}

	async do() {
		super.do();
		let error = null;
		let i = 0;
		this.memory_estimate = 0;
		this.database_estimate = 0;
		for (i = 0; i < this.actions_to_do.length; i++) {
			try {
				await this.actions_to_do[i].do();
				this.memory_estimate += this.actions_to_do[i].memory_estimate;
				this.database_estimate += this.actions_to_do[i].database_estimate;
			} catch (e) {
				error = e;
				break;
			}
		}
		// One of the actions aborted, undo all previous actions.
		if (error) {
			for (i--; i >= 0; i--) {
				await this.actions_to_do[i].undo();
			}
			throw error;
		}
		config.need_render = true;
	}

	async undo() {
		super.undo();
		this.memory_estimate = 0;
		this.database_estimate = 0;
		for (let i = this.actions_to_do.length - 1; i >= 0; i--) {
			await this.actions_to_do[i].undo();
			this.memory_estimate += this.actions_to_do[i].memory_estimate;
			this.database_estimate += this.actions_to_do[i].database_estimate;
		}
		config.need_render = true;
	}

	free() {
		if (this.actions_to_do) {
			for (let action of this.actions_to_do) {
				action.free();
			}
			this.actions_to_do = null;
		}
	}
}