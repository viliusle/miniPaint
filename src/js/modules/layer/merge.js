import app from './../../app.js';
import config from './../../config.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';
import Base_layers_class from './../../core/base-layers.js';

class Layer_merge_class {

	constructor() {
		this.Base_layers = new Base_layers_class();
	}

	merge() {
		if (this.Base_layers.find_previous(config.layer.id) == null) {
			alertify.error('There are no layers behind.');
			return false;
		}

		//create tmp canvas
		var canvas = document.createElement('canvas');
		canvas.width = config.WIDTH;
		canvas.height = config.HEIGHT;
		var ctx = canvas.getContext("2d");

		//first layer
		var previous_layer = this.Base_layers.find_previous(config.layer.id);
		var previous_id = previous_layer.id;
		ctx.globalAlpha = previous_layer.opacity / 100;
		ctx.globalCompositeOperation = previous_layer.composition;
		this.Base_layers.render_object(ctx, previous_layer);

		//second layer
		var current_id = config.layer.id;
		var current_order = config.layer.order;
		ctx.globalAlpha = config.layer.opacity / 100;
		ctx.globalCompositeOperation = config.layer.composition;
		this.Base_layers.render_object(ctx, config.layer);

		//create requested layer
		var params = [];
		params.type = 'image';
		params.name = config.layer.name + ' + merged';
		params.order = current_order;
		params.data = canvas.toDataURL("image/png");
		app.State.do_action(
			new app.Actions.Bundle_action('merge_layers', 'Merge Layers', [
				new app.Actions.Insert_layer_action(params),
				new app.Actions.Delete_layer_action(current_id),
				new app.Actions.Delete_layer_action(previous_id)
			])
		);

		//free canvas data
		canvas.width = 1;
		canvas.height = 1;
	}

}

export default Layer_merge_class;