import app from '../app.js';
import config from '../config.js';
import { Base_action } from './base.js';
import Tools_settings_class from './../modules/tools/settings.js';

export class Autoresize_canvas_action extends Base_action {
	/**
	 * autoresize canvas to layer size, based on dimensions, up - always, if 1 layer - down.
	 *
	 * @param {int} width
	 * @param {int} height
	 * @param {int} layer_id
	 * @param {boolean} can_automate
	 */
	constructor(width, height, layer_id, can_automate = true, ignore_same_size = false) {
		super('autoresize_canvas', 'Auto-resize Canvas');
		this.Tools_settings = new Tools_settings_class();
		this.width = width;
		this.height = height;
		this.layer_id = layer_id;
		this.can_automate = can_automate;
		this.ignore_same_size = ignore_same_size;
		this.old_config_width = null;
		this.old_config_height = null;
	}

	async do() {
		super.do();
		const width = this.width;
		const height = this.height;
		const can_automate = this.can_automate;
		let need_fit = false;
		let new_config_width = config.WIDTH;
		let new_config_height = config.HEIGHT;
		var enable_autoresize = this.Tools_settings.get_setting('enable_autoresize');

		if(enable_autoresize == false){
			return;
		}

		// Resize up
		if (width > new_config_width || height > new_config_height) {
			const wrapper = document.getElementById('main_wrapper');
			const page_w = wrapper.clientWidth;
			const page_h = wrapper.clientHeight;

			if (width > page_w || height > page_h) {
				need_fit = true;
			}
			if (width > new_config_width)
				new_config_width = parseInt(width);
			if (height > new_config_height)
				new_config_height = parseInt(height);
		}

		// Resize down
		if (config.layers.length == 1 && can_automate !== false) {
			if (width < new_config_width)
				new_config_width = parseInt(width);
			if (height < new_config_height)
				new_config_height = parseInt(height);
		}

		if (new_config_width !== config.WIDTH || new_config_height !== height) {
			this.old_config_width = config.WIDTH;
			this.old_config_height = config.HEIGHT;
			config.WIDTH = new_config_width;
			config.HEIGHT = new_config_height;
			app.GUI.prepare_canvas();
		} else if (!this.ignore_same_size) {
			throw new Error('Aborted - Resize not necessary')
		}

		// Fit zoom when after short pause
		// @todo - remove setTimeout
		if (need_fit == true) {
			await new Promise((resolve) => {
				window.setTimeout(() => {
					app.GUI.GUI_preview.zoom_auto();
					resolve();
				}, 100);
			});
		}
	}

	async undo() {
		super.undo();
		if (this.old_config_width != null) {
			config.WIDTH = this.old_config_width;
		}
		if (this.old_config_height != null) {
			config.HEIGHT = this.old_config_height;
		}
		if (this.old_config_width != null || this.old_config_height != null) {
			app.GUI.prepare_canvas();
		}
		this.old_config_width = null;
		this.old_config_height = null;
	}
}