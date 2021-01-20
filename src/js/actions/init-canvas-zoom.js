import app from '../app.js';
import config from '../config.js';
import zoomView from '../libs/zoomView.js';
import { Base_action } from './base.js';

export class Init_canvas_zoom_action extends Base_action {
	/**
	 * Resets the canvas
	 */
	constructor() {
		super('init_canvas_zoom', 'Initialize Canvas Zoom');
		this.old_bounds = null;
		this.old_context = null;
		this.old_stable_dimensions = null;
	}

	async do() {
		super.do();
		this.old_bounds = zoomView.getBounds();
		this.old_context = zoomView.getContext();
		this.old_stable_dimensions = app.Layers.stable_dimensions;
		zoomView.setBounds(0, 0, config.WIDTH, config.HEIGHT);
		zoomView.setContext(app.Layers.ctx);
		app.Layers.stable_dimensions = [
			config.WIDTH,
			config.HEIGHT
		];
	}

	async undo() {
		super.undo();
		zoomView.setBounds(this.old_bounds.top, this.old_bounds.left, this.old_bounds.right, this.old_bounds.bottom);
		zoomView.setContext(this.old_context);
		app.Layers.stable_dimensions = this.old_stable_dimensions;
		this.old_bounds = null;
		this.old_context = null;
		this.old_stable_dimensions = null;
	}

	free() {
		this.old_bounds = null;
		this.old_context = null;
		this.old_stable_dimensions = null;
	}
}