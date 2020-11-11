import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';

class Layer_clear_class {

	constructor() {
		this.Base_layers = new Base_layers_class();
	}

	clear() {
		window.State.save();

		this.Base_layers.layer_clear(config.layer.id);
	}

}

export default Layer_clear_class;