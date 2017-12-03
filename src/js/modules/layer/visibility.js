import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';

class Layer_visibility_class {

	constructor() {
		this.Base_layers = new Base_layers_class();
	}

	toggle() {
		window.State.save();
		this.Base_layers.toggle_visibility(config.layer.id);
	}

}

export default Layer_visibility_class;