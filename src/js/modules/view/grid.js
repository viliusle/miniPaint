import config from './../../config.js';
import Helper_class from './../../libs/helpers.js';
import Base_gui_class from './../../core/base-gui.js';

var instance = null;

class View_grid_class {

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.GUI = new Base_gui_class();
		this.Helper = new Helper_class();

		this.set_events();
	}

	set_events() {
		document.addEventListener('keydown', (event) => {
			var code = event.keyCode;
			if (this.Helper.is_input(event.target))
				return;

			if (code == 71 && event.ctrlKey != true && event.metaKey != true) {
				//G - grid
				this.grid({visible: !this.GUI.grid});
				event.preventDefault();
			}
		}, false);
	}

	grid() {
		if (this.GUI.grid == false) {
			this.GUI.grid = true;
		}
		else {
			this.GUI.grid = false;
		}
		config.need_render = true;
	}

}

export default View_grid_class;