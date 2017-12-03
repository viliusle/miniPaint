import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';

class Layer_clear_class {

	constructor() {
		this.Base_layers = new Base_layers_class();
	}

	clear() {
		window.State.save();

		if (config.layer.type == 'image') {
			//clean image
			config.layer.link = null;
		}

		for (var i in config.layer) {
			//remove private attributes
			if (i[0] == '_')
				delete config.layer[i];
		}

		config.layer.x = 0;
		config.layer.y = 0;
		config.layer.width = 0;
		config.layer.height = 0;
		config.layer.visible = true;
		config.layer.opacity = 100;
		config.layer.composition = null;
		config.layer.rotate = 0;
		config.layer.data = null;
		config.layer.params = {};
		config.layer.status = null;
		config.layer.render_function = null;
		config.layer.type = null;

		config.need_render = true;
	}

}

export default Layer_clear_class;