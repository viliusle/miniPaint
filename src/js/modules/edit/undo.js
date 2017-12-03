import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';
import Base_state_class from './../../core/base-state.js';

class Edit_undo_class {

	constructor() {
		this.Base_state = new Base_state_class();
	}

	undo() {
		this.Base_state.undo();
	}
}

export default Edit_undo_class;
