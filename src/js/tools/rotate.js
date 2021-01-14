import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Image_rotate_class from './../modules/image/rotate.js';

class Rotate_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.name = 'rotate';
		this.Image_rotate = new Image_rotate_class();
	}

	load() {
		// nothing
	}

	render(ctx, layer) {
		// nothing
	}

	on_activate() {
		this.Image_rotate.rotate();
	}

}
;
export default Rotate_class;
