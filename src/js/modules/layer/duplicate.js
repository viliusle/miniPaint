import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';

var instance = null;

class Layer_duplicate_class {

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.Base_layers = new Base_layers_class();

		this.set_events();
	}

	set_events() {
		var _this = this;

		document.addEventListener('keydown', function (event) {
			var code = event.keyCode;
			if (event.target.type == 'text' || event.target.tagName == 'INPUT' || event.target.type == 'textarea')
				return;

			if (code == 68) {
				//D - duplicate
				_this.duplicate();
				event.preventDefault();
			}
		}, false);
	}

	duplicate() {
		window.State.save();

		var params = JSON.parse(JSON.stringify(config.layer));
		delete params.id;
		delete params.order;
		params.name = "Copy: " + params.name;
		if(params.x != 0 || params.y != 0 || params.width != config.WIDTH || params.height != config.HEIGHT){
			params.x += 10;
			params.y += 10;
		}

		for (var i in params) {
			//remove private attributes
			if (i[0] == '_')
				delete params[i];
		}

		if (params.type == 'image') {
			//image
			params.link = config.layer.link.cloneNode(true);
		}

		this.Base_layers.insert(params);
	}

}

export default Layer_duplicate_class;