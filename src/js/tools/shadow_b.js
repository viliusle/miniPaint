import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';
import Shadow_class from './shadow.js';

class Shadow_b_class extends Shadow_class {

	// Separate classes for template shadows are needed to simplify code
	// because of how the underlying system handles attributes.

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.name = 'shadow';
	}

}
;
export default Shadow_b_class;
