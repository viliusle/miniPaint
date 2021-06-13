import app from './../app.js';
import config from './../config.js';
import { Base_action } from './base.js';

export class Add_layer_filter_action extends Base_action {
	/**
	 * register new live filter
	 *
	 * @param {int} layer_id
	 * @param {string} name
	 * @param {object} params
	 */
	constructor(layer_id, name, params, filter_id) {
		super('add_layer_filter', 'Add Layer Filter');
		if (layer_id == null)
			layer_id = config.layer.id;
		this.layer_id = parseInt(layer_id);
		this.name = name;
		this.params = params;
		this.filter_id = filter_id;
		this.reference_layer = null;
	}

	async do() {
		super.do();
		this.reference_layer = app.Layers.get_layer(this.layer_id);
		if (!this.reference_layer) {
			throw new Error('Aborted - layer with specified id doesn\'t exist');
		}
		var filter = {
			id: this.filter_id,
			name: this.name,
			params: this.params,
		};
		if(this.filter_id) {
			//update
			for(var i in this.reference_layer.filters) {
				if(this.reference_layer.filters[i].id == this.filter_id){
					this.reference_layer.filters[i] = filter;
					break;
				}
			}
		}
		else{
			//insert
			filter.id = Math.floor(Math.random() * 999999999) + 1; // A good UUID library would
			this.reference_layer.filters.push(filter);
		}
		config.need_render = true;
		app.GUI.GUI_layers.render_layers();
	}

	async undo() {
		super.undo();
		if (this.reference_layer) {
			this.reference_layer.filters.pop();
			this.reference_layer = null;
		}
		config.need_render = true;
		app.GUI.GUI_layers.render_layers();
	}

	free() {
		this.reference_layer = null;
		this.params = null;
	}
}