import app from './../../app.js';
import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';

class Layer_move_class {

	constructor() {
		this.Base_layers = new Base_layers_class();
	}

	up() {
		app.State.do_action(
			new app.Actions.Reorder_layer_action(config.layer.id, 1)
		);
	}

	down() {
		app.State.do_action(
			new app.Actions.Reorder_layer_action(config.layer.id, -1)
		);
	}
}

export default Layer_move_class;
