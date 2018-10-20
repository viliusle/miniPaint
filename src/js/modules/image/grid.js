import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';
import Base_gui_class from './../../core/base-gui.js';

var instance = null;

class Image_grid_class {

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.POP = new Dialog_class();
		this.GUI = new Base_gui_class();

		this.set_events();
	}

	set_events() {
		var _this = this;

		document.addEventListener('keydown', function (event) {
			var code = event.keyCode;
			if (event.target.type == 'text' || event.target.tagName == 'INPUT' || event.target.type == 'textarea')
				return;

			if (code == 71 && event.ctrlKey != true && event.metaKey != true) {
				//G - grid
				_this.toggle_grid({visible: !_this.GUI.grid});
				event.preventDefault();
			}
		}, false);
	}

	grid() {
		var _this = this;

		var settings = {
			title: 'Grid',
			params: [
				{name: "visible", title: "Visible:", value: this.GUI.grid},
			],
			on_finish: function (params) {
				_this.toggle_grid(params);
			},
		};
		this.POP.show(settings);
	}

	toggle_grid(params) {
		if (params.visible == true) {
			this.GUI.grid = true;
		}
		else {
			this.GUI.grid = false;
		}
		config.need_render = true;
	}

}

export default Image_grid_class;