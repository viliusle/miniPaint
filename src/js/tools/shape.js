import app from './../app.js';
import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';
import Dialog_class from './../libs/popup.js';
import GUI_tools_class from './../core/gui/gui-tools.js';

var instance = null;

class Shape_class extends Base_tools_class {

	constructor(ctx) {
		super();

		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.Base_layers = new Base_layers_class();
		this.GUI_tools = new GUI_tools_class();
		this.POP = new Dialog_class();
		this.ctx = ctx;
		this.name = 'shape';
		this.layer = {};
		this.preview_width = 150;
		this.preview_height = 120;

		this.set_events();
	}

	set_events() {
		document.addEventListener('keydown', (event) => {
			var code = event.keyCode;
			if (this.Helper.is_input(event.target))
				return;

			if (code == 72) {
				//H
				this.show_shapes();
			}
		}, false);
	}

	load() {

	}

	on_activate() {
		this.show_shapes();
	}

	async show_shapes(){
		var _this = this;
		var html = '';

		var data = this.get_shapes();

		for (var i in data) {
			html += '<div class="item">';
			html += '	<canvas id="c_' + data[i].key + '" width="' + this.preview_width + '" height="'
				+ this.preview_height + '" class="effectsPreview" data-key="'
				+ data[i].key + '"></canvas>';
			html += '<div class="preview-item-title">' + data[i].title + '</div>';
			html += '</div>';
		}
		for (var i = 0; i < 4; i++) {
			html += '<div class="item"></div>';
		}

		var settings = {
			title: 'Shapes',
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
						_this.GUI_tools.activate_tool(this.dataset.key);
						_this.POP.hide();
					});
				}
			},
		};
		this.POP.show(settings);

		//sleep, lets wait till DOM is finished
		await new Promise(r => setTimeout(r, 10));

		//draw demo thumbs
		for (var i in data) {
			var function_name = 'demo';
			var canvas = document.getElementById('c_'+data[i].key);
			var ctx = canvas.getContext("2d");

			if(typeof data[i].object[function_name] == "undefined")
				continue;

			data[i].object[function_name](ctx, 20, 20, this.preview_width - 40, this.preview_height - 40, null);
		}
	}

	render(ctx, layer) {

	}

	get_shapes(){
		var list = [];

		for (var i in this.Base_gui.GUI_tools.tools_modules) {
			var object = this.Base_gui.GUI_tools.tools_modules[i];
			if (object.full_key.indexOf("shapes/") == -1 )
				continue;

			list.push(object);
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

}

export default Shape_class;
