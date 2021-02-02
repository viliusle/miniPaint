import app from './../app.js';
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
		var composition;
		if (config.layer.composition == 'source-atop'){
			composition = 'source-over';
		} else {
			composition = 'source-atop';
		}
		config.need_render = true;

		app.State.do_action(
			new app.Actions.Bundle_action('change_composition', 'Change Composition', [
				new app.Actions.Update_layer_action(config.layer.id, {
					composition: composition
				})
			])
		);
	}

}
;
export default Mask_class;
