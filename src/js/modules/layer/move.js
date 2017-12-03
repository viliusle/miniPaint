import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';

class Layer_move_class {

	constructor() {
		this.Base_layers = new Base_layers_class();
	}

	up() {
		window.State.save();
		this.Base_layers.move(config.layer.id, 1);
	}

	down() {
		window.State.save();
		this.Base_layers.move(config.layer.id, -1);
	}
}

export default Layer_move_class;
