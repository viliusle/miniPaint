/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import config from './../../config.js';
import Base_layers_class from './../base-layers.js';
import Helper_class from './../../libs/helpers.js';
import Layer_rename_class from './../../modules/layer/rename.js';

var template = `
	<span class="trn">Insert:</span>
	<button type="button" class="layer_add" id="insert_layer">+</button>

	<button type="button" class="layers_arrow" title="Move down" id="layer_down">&darr;</button>
	<button type="button" class="layers_arrow" title="Move up" id="layer_up">&uarr;</button>

	<div class="layers_list" id="layers"></div>
`;

/**
 * GUI class responsible for rendering layers on right sidebar
 */
class GUI_layers_class {

	constructor(ctx) {
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
		this.Layer_rename = new Layer_rename_class();
	}

	render_main_layers() {
		document.getElementById('layers_base').innerHTML = template;
		this.render_layers();

		this.set_events();
	}

	set_events() {
		var _this = this;

		document.getElementById('layers_base').addEventListener('click', function (event) {
			var target = event.target;
			if (target.id == 'insert_layer') {
				//new layer
				window.State.save();
				_this.Base_layers.insert();
			}
			else if (target.id == 'layer_up') {
				//move layer up
				window.State.save();
				_this.Base_layers.move(config.layer.id, 1);
			}
			else if (target.id == 'layer_down') {
				//move layer down
				window.State.save();
				_this.Base_layers.move(config.layer.id, -1);
			}
			else if (target.id == 'visibility') {
				//change visibility
				_this.Base_layers.toggle_visibility(target.dataset.id);
			}
			else if (target.id == 'delete') {
				//delete layer
				window.State.save();
				_this.Base_layers.delete(target.dataset.id);
			}
			else if (target.id == 'layer_name') {
				//select layer
				if (target.dataset.id == config.layer.id)
					return;
				_this.Base_layers.select(target.dataset.id);
			}
			else if (target.id == 'delete_filter') {
				//delete filter
				_this.Base_layers.delete_filter(target.dataset.pid, target.dataset.id);
			}
		});

		document.getElementById('layers_base').addEventListener('dblclick', function (event) {
			var target = event.target;
			if (target.id == 'layer_name') {
				//rename layer
				_this.Layer_rename.rename(target.dataset.id);
			}
		});

	}

	/**
	 * renders layers list
	 */
	render_layers() {
		var target_id = 'layers';
		var layers = config.layers.concat().sort(
			//sort function
				(a, b) => b.order - a.order
			);

		document.getElementById(target_id).innerHTML = '';
		var html = '';

		for (var i in layers) {
			var value = layers[i];

			if (value.id == config.layer.id)
				html += '<div class="item active">';
			else
				html += '<div class="item">';
			if (value.visible == true)
				html += '	<span class="visibility visible" id="visibility" data-id="' + value.id + '" title="hide"></span>';
			else
				html += '	<span class="visibility" id="visibility" data-id="' + value.id + '" title="show"></span>';
			html += '	<span class="delete" id="delete" data-id="' + value.id + '" title="delete"></span>';
			html += '	<span class="layer_name" id="layer_name" data-id="' + value.id + '">' + value.name + '</span>';
			html += '	<div class="clear"></div>';
			html += '</div>';

			//show filters
			if (layers[i].filters.length > 0) {
				html += '<div class="filters">';
				for (var j in layers[i].filters) {
					var filter = layers[i].filters[j];
					var title = this.Helper.ucfirst(filter.name);
					title = title.replace(/-/g, ' ');

					html += '<div class="filter">';
					html += '	<span class="delete" id="delete_filter" data-pid="' + layers[i].id + '" data-id="' + filter.id + '" title="delete"></span>';
					html += '	<span class="layer_name" id="filter_name" data-pid="' + layers[i].id + '" data-id="' + filter.id + '">' + title + '</span>';
					html += '	<div class="clear"></div>';
					html += '</div>';
				}
				html += '</div>';
			}
		}

		//register
		document.getElementById(target_id).innerHTML = html;
	}
}

export default GUI_layers_class;
