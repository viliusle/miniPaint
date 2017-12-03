import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';

class Layer_delete_class {

	constructor() {
		this.Base_layers = new Base_layers_class();
	}

	delete() {
		window.State.save();
		this.Base_layers.delete(config.layer.id);
	}

}

export default Layer_delete_class;