import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';

class Mask_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.name = 'mask';
	}

	load() {
		// nothing
	}

	render(ctx, layer) {
		// nothing
	}

	on_activate() {
		window.State.save();
		if (config.layer.composition == 'source-atop'){
			config.layer.composition = 'source-over';
		} else {
			config.layer.composition = 'source-atop';
		}
		config.need_render = true;
	}

}
;
export default Mask_class;
