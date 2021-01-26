/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import config from './../config.js';
import Base_layers_class from './base-layers.js';
import Base_gui_class from './base-gui.js';
import Helper_class from './../libs/helpers.js';
import alertify from './../../../node_modules/alertifyjs/build/alertify.min.js';
import app from '../app.js';

var instance = null;

/**
 * Undo state class. Supports multiple levels undo.
 */
class Base_state_class {

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.Base_layers = new Base_layers_class();
		this.Base_gui = new Base_gui_class();
		this.Helper = new Helper_class();
		this.layers_archive = [];
		this.levels = 3;
		this.levels_optimal = 3;
		this.enabled = true;
		this.action_history = [];
		this.action_history_index = 0;
		this.action_history_max = 50;

		this.set_events();
	}

	set_events() {
		document.addEventListener('keydown', (event) => {
			const key = (event.key || '').toLowerCase();
			if (this.Helper.is_input(event.target))
				return;

			if (key == "z" && (event.ctrlKey == true || event.metaKey)) {
				// Undo
				this.undo();
				event.preventDefault();
			}
			if (key == "y" && (event.ctrlKey == true || event.metaKey)) {
				// Redo
				this.redo();
				event.preventDefault();
			}
		}, false);
	}

	async do_action(action, options = {}) {
		let error_during_free = false;
		try {
			await action.do();
		} catch (error) {
			// Action aborted. This is usually expected behavior as actions throw errors if they shouldn't run.
			return { status: 'aborted', reason: error };
		}
		// Remove all redo actions from history
		if (this.action_history_index < this.action_history.length) {
			const freed_actions = this.action_history.slice(this.action_history_index, this.action_history.length).reverse();
			this.action_history = this.action_history.slice(0, this.action_history_index);
			for (let freed_action of freed_actions) {
				try {
					await freed_action.free();
				} catch (error) {
					error_during_free = true;
				}
			}
		}
		// Add the new action to history
		const last_action = this.action_history[this.action_history.length - 1];
		if (options.merge_with_history && last_action) {
			if (typeof options.merge_with_history === 'string') {
				options.merge_with_history = [options.merge_with_history];
			}
			if (options.merge_with_history.includes(last_action.action_id)) {
				this.action_history[this.action_history.length - 1] = new app.Actions.Bundle_action(
					last_action.action_id,
					last_action.action_description,
					[last_action, action]
				);
			}
		} else {
			this.action_history.push(action);
			if (this.action_history.length > this.action_history_max) {
				let action_to_free = this.action_history.shift();
				try {
					await action_to_free.free();
				} catch (error) {
					error_during_free = true;
				}
			} else {
				this.action_history_index++;
			}
		}

		// Chrome arbitrary method to determine memory usage, but most people use Chrome so...
		if (window.performance && window.performance.memory) {
			if (window.performance.memory.usedJSHeapSize > window.performance.memory.jsHeapSizeLimit * 0.8) {
				this.free(window.performance.memory.jsHeapSizeLimit * 0.2);
			}
		}

		if (error_during_free) {
			alertify.error('A problem occurred while removing undo history. It\'s suggested you save your work and refresh the page in order to free up memory.');
		}
		return { status: 'completed' };
	}

	can_redo() {
		return this.action_history_index < this.action_history.length;
	}

	can_undo() {
		return this.action_history_index > 0;
	}

	async redo_action() {
		if (this.can_redo()) {
			const action = this.action_history[this.action_history_index];
			await action.do();
			this.action_history_index++;
		} else {
			alertify.success('There\'s nothing to redo', 3);
		}
	}

	async undo_action() {
		if (this.can_undo()) {
			this.action_history_index--;
			await this.action_history[this.action_history_index].undo();
		} else {
			alertify.success('There\'s nothing to undo', 3);
		}
	}

	async scrap_last_action() {
		if (this.can_undo()) {
			await this.undo_action();
			this.action_history.pop();
		}
	}

	// Frees history actions up to the specified memory & database size. Starts with undo history, then moves to redo history.
	async free(memory_size = 0, database_size = 0) {
		let total_memory_freed = 0;
		let total_database_freed = 0;
		let has_error = false;
		let free_complete = false;
		while (this.action_history_index > 0) {
			let action = this.action_history.shift();
			total_memory_freed += action.memory_estimate;
			total_database_freed += action.database_estimate;
			try {
				await action.free();
			} catch (error) {
				has_error = true;
			}
			if (total_memory_freed >= memory_size && total_database_freed >= database_size) {
				free_complete = true;
				break;
			}
			this.action_history_index--;
		}
		if (!free_complete) {
			for (let i = this.action_history.length - 1; i >= 0; i--) {
				let action = this.action_history[i];
				total_memory_freed += action.memory_estimate;
				total_database_freed += action.database_estimate;
				try {
					await action.free();
				} catch (error) {
					has_error = true;
				}
				if (total_memory_freed >= memory_size && total_database_freed >= database_size) {
					free_complete = true;
					break;
				}
			}
		}
		if (has_error) {
			alertify.error('A problem occurred while removing undo history. It\'s suggested you save your work and refresh the page in order to free up memory.');
		}
		return {
			total_memory_freed,
			total_database_freed
		}
	}

	save() {
		const message = 'window.State.save() is removed. Use State.do_action() to manage undo history instead.';
		console.warn(message);
		alertify.error(message);
	}

	/**
	 * supports multiple levels undo system
	 */
	undo() {
		this.undo_action();
	}

	/**
	 * supports multiple levels redo system
	 */
	redo() {
		this.redo_action();
	}

}

export default Base_state_class;
