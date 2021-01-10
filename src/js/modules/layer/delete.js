import app from './../../app.js';
import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';

class Layer_delete_class {

	constructor() {
		this.Base_layers = new Base_layers_class();
	}

	delete() {
		app.State.do_action(
			new app.Actions.Delete_layer_action(config.layer.id)
		);
	}

}

export default Layer_delete_class;