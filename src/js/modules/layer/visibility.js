import app from './../../app.js';
import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';

class Layer_visibility_class {

	constructor() {
		this.Base_layers = new Base_layers_class();
	}

	toggle() {
		app.State.do_action(
			new app.Actions.Toggle_layer_visibility_action(config.layer.id)
		);
	}

}

export default Layer_visibility_class;