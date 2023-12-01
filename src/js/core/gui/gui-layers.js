/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import app from './../../app.js';
import config from './../../config.js';
import Base_layers_class from './../base-layers.js';
import Helper_class from './../../libs/helpers.js';
import Layer_rename_class from './../../modules/layer/rename.js';
import Effects_browser_class from './../../modules/effects/browser.js';
import Layer_duplicate_class from './../../modules/layer/duplicate.js';
import Layer_raster_class from './../../modules/layer/raster.js';
import Tools_translate_class from './../../modules/tools/translate.js';

var template = `
	<button type="button" class="layer_add trn" id="insert_layer" title="Insert new layer">+</button>
	<button type="button" class="layer_duplicate trn" id="layer_duplicate" title="Duplicate layer">D</button>
	<button type="button" class="layer_raster trn" id="layer_raster" title="Convert layer to raster">R</button>

	<button type="button" class="layers_arrow trn" title="Move layer down" id="layer_down">&darr;</button>
	<button type="button" class="layers_arrow trn" title="Move layer up" id="layer_up">&uarr;</button>

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
		this.Effects_browser = new Effects_browser_class();
		this.Layer_duplicate = new Layer_duplicate_class();
		this.Layer_raster = new Layer_raster_class();
		this.Tools_translate = new Tools_translate_class();
	}

	render_main_layers() {
		document.getElementById('layers_base').innerHTML = template;
		if (config.LANG != 'en') {
			this.Tools_translate.translate(config.LANG, document.getElementById('layers_base'));
		}
		this.render_layers();
		this.set_events();
	}

	set_events() {
		var _this = this;

		document.getElementById('layers_base').addEventListener('click', function (event) {
			var target = event.target;
			if (target.id == 'insert_layer') {
				//new layer
				app.State.do_action(
					new app.Actions.Insert_layer_action()
				);
			}
			else if (target.id == 'layer_duplicate') {
				//duplicate
				_this.Layer_duplicate.duplicate();
			}
			else if (target.id == 'layer_raster') {
				//raster
				_this.Layer_raster.raster();
			}
			else if (target.id == 'layer_up') {
				//move layer up
				app.State.do_action(
					new app.Actions.Reorder_layer_action(config.layer.id, 1)
				);
			}
			else if (target.id == 'layer_down') {
				//move layer down
				app.State.do_action(
					new app.Actions.Reorder_layer_action(config.layer.id, -1)
				);
			}
			else if (target.id == 'visibility') {
				//change visibility
				return app.State.do_action(
					new app.Actions.Toggle_layer_visibility_action(target.dataset.id)
				);
			}
			else if (target.id == 'delete') {
				//delete layer
				app.State.do_action(
					new app.Actions.Delete_layer_action(target.dataset.id)
				);
			}
			else if (target.id == 'layer_name') {
				//select layer
				if (target.dataset.id == config.layer.id)
					return;
				app.State.do_action(
					new app.Actions.Select_layer_action(target.dataset.id)
				);
			}
			else if (target.id == 'delete_filter') {
				//delete filter
				app.State.do_action(
					new app.Actions.Delete_layer_filter_action(target.dataset.pid, target.dataset.id)
				);
			}
			else if (target.id == 'filter_name') {
				//edit filter
				var effects = _this.Effects_browser.get_effects_list();
				var key = target.dataset.filter.toLowerCase();
				for (var i in effects) {
					if(effects[i].title.toLowerCase() == key){
						_this.Base_layers.select(target.dataset.pid);
						var function_name = _this.Effects_browser.get_function_from_path(key);
						effects[i].object[function_name](target.dataset.id);
					}
				}
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
		
		if (config.layer) {
			for (var i in layers) {
				var value = layers[i];
				var class_extra = '';
				if(value.composition === 'source-atop'){
					class_extra += ' shorter';
				}
				if (value.id == config.layer.id){
					class_extra += ' active';
				}

				html += '<div class="item ' + class_extra + '">';
				if (value.visible == true)
					html += '	<button class="visibility visible trn" id="visibility" data-id="' + value.id + '" title="Hide"></button>';
				else
					html += '	<button class="visibility trn" id="visibility" data-id="' + value.id + '" title="Show"></button>';
				html += '	<button class="delete trn" id="delete" data-id="' + value.id + '" title="Delete"></button>';
				
				if(value.composition === 'source-atop'){
					html += '	<button class="arrow_down" data-id="' + value.id + '" ></button>';
				}

				var layer_title = this.Helper.escapeHtml(value.name);
				
				html += '	<button class="layer_name" id="layer_name" data-id="' + value.id + '">' + layer_title + '</button>';
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
						html += '	<span class="layer_name" id="filter_name" data-pid="' + layers[i].id + '" data-id="' + filter.id + '" data-filter="' + filter.name + '">' + title + '</span>';
						html += '	<div class="clear"></div>';
						html += '</div>';
					}
					html += '</div>';
				}
			}
		}

		//register
		document.getElementById(target_id).innerHTML = html;
		if (config.LANG != 'en') {
			this.Tools_translate.translate(config.LANG, document.getElementById(target_id));
		}
	}
}

export default GUI_layers_class;
