import config from './../../config.js';
import Base_tools_class from './../../core/base-tools.js';
import Dialog_class from './../../libs/popup.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

class Effects_browser_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.POP = new Dialog_class();
		this.preview_width = 150;
		this.preview_height = 120;
	}

	async browser() {
		var _this = this;
		var html = '';

		if (config.layer.type != 'image') {
			alertify.error('This layer must contain an image. Please convert it to raster to apply this tool.');
			return;
		}

		var data = this.get_effects_list();

		for (var i in data) {
			var title = data[i].title;

			html += '<div class="item">';
			html += '	<canvas id="c_' + data[i].key + '" width="' + this.preview_width + '" height="'
				+ this.preview_height + '" class="effectsPreview" data-key="'
				+ data[i].key + '"></canvas>';
			html += '<div class="preview-item-title">' + title + '</div>';
			html += '</div>';
		}
		for (var i = 0; i < 4; i++) {
			html += '<div class="item"></div>';
		}

		var settings = {
			title: 'Effects browser',
			className: 'wide',
			on_load: function (params, popup) {
				var node = document.createElement("div");
				node.classList.add('flex-container');
				node.innerHTML = html;
				popup.el.querySelector('.dialog_content').appendChild(node);
				//events
				var targets = popup.el.querySelectorAll('.item canvas');
				for (var i = 0; i < targets.length; i++) {
					targets[i].addEventListener('click', function (event) {
						//we have click
						var key = this.dataset.key;
						for (var i in data) {
							if(data[i].key == key){
								var function_name = _this.get_function_from_path(key);
								_this.POP.hide();
								data[i].object[function_name]();
							}
						}
					});
				}
			},
		};
		this.POP.show(settings);

		//sleep, lets wait till DOM is finished
		await new Promise(r => setTimeout(r, 10));

		//generate thumb
		var active_image = this.Base_layers.convert_layer_to_canvas();

		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext("2d");
		canvas.width = this.preview_width;
		canvas.height = this.preview_height;

		ctx.scale(this.preview_width / active_image.width, this.preview_height / active_image.height);
		ctx.drawImage(active_image, 0, 0);
		ctx.scale(1, 1);

		//draw demo thumbs
		for (var i in data) {
			var title = data[i].title;
			var function_name = 'demo';
			if(typeof data[i].object[function_name] == "undefined")
				continue;
			data[i].object[function_name]('c_'+data[i].key, canvas);
		}
	}

	get_effects_list() {
		var list = [];

		for (var i in this.Base_gui.modules) {
			if (i.indexOf("effects") == -1 || i.indexOf("abstract") > -1 || i.indexOf("browser") > -1)
				continue;

			list.push({
				title: this.get_filter_title(i),
				key: i,
				object: this.Base_gui.modules[i],
			});
		}

		list.sort(function(a, b) {
			var nameA = a.title.toUpperCase();
			var nameB = b.title.toUpperCase();
			if (nameA < nameB) return -1;
			if (nameA > nameB) return 1;
			return 0;
		});

		return list;
	}

	get_filter_title(key) {
		var parts = key.split("/");
		var title = parts[parts.length - 1];

		//exceptions
		if (title == 'negative')
			title = 'invert';

		title = title.replace(/_/g, ' ');
		title = title.charAt(0).toUpperCase() + title.slice(1); //make first letter uppercase

		return title;
	}

	get_function_from_path(path){
		var parts = path.split("/");
		var result = parts[parts.length - 1];
		result = result.replace(/-/, '_');

		return result;
	}
}

export default Effects_browser_class;
