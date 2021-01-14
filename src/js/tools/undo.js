import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';
import Base_state_class from './../core/base-state.js';

class Undo_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.name = 'undo';
		this.Base_state = new Base_state_class();
	}

	load() {
		// nothing
	}

	render(ctx, layer) {
		// nothing
	}

	on_activate() {
		this.Base_state.undo();
	}

}
;
export default Undo_class;
