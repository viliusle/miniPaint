/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import config from './../config.js';
import Base_layers_class from './base-layers.js';
import Base_gui_class from './base-gui.js';
import alertify from './../../../node_modules/alertifyjs/build/alertify.min.js';

var instance = null;

/**
 * Undo state class. Supports multiple levels undo.
 */
class Base_state_class {

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.Base_layers = new Base_layers_class();
		this.Base_gui = new Base_gui_class();
		this.layers_archive = [];
		this.levels = 3;
		this.levels_optimal = 3;
		this.enabled = true;

		this.set_events();
	}

	set_events() {
		var _this = this;

		document.addEventListener('keydown', function (event) {
			var code = event.keyCode;
			if (event.target.type == 'text' || event.target.tagName == 'INPUT' || event.target.type == 'textarea')
				return;

			if (code == 90 && (event.ctrlKey == true || event.metaKey)) {
				//undo
				_this.undo();
				event.preventDefault();
			}
		}, false);
	}

	save() {

		this.optimize();

		if (this.enabled == false) {
			return;
		}

		//move previous
		this.layers_archive.unshift(null);
		if (this.layers_archive.length > this.levels) {
			//remove element, that is too far in history - saving memory here
			this.layers_archive.splice(-1, 1);
		}

		//general
		this.layers_archive[0] = {
			width: config.WIDTH,
			height: config.HEIGHT,
			layer_active: config.layer.id,
		};

		//layers
		this.layers_archive[0].layers = [];
		for (var i in config.layers) {
			var layer = {};
			for (var j in config.layers[i]) {
				if (j[0] == '_' || j == 'link_canvas') {
					//private data
					continue;
				}

				layer[j] = config.layers[i][j];
			}
			layer = JSON.parse(JSON.stringify(layer));
			this.layers_archive[0].layers.push(layer);
		}

		//image data
		this.layers_archive[0].data = [];
		for (var i in config.layers) {
			if (config.layers[i].type != 'image')
				continue;

			this.layers_archive[0].data.push(
				{
					id: config.layers[i].id,
					data: config.layers[i].link.cloneNode(true), //@todo - optimize, avoid duplicating data
				}
			);
		}
	}

	/**
	 * supports multiple levels undo system
	 */
	undo() {
		if (this.enabled == false || this.layers_archive[0] == undefined) {
			//not saved yet
			alertify.error('Undo is not available.');
			return false;
		}

		var data = this.layers_archive[0];

		//set attributes
		if (config.WIDTH != parseInt(data.width) || config.HEIGHT != parseInt(data.height)) {
			config.WIDTH = parseInt(data.width);
			config.HEIGHT = parseInt(data.height);
			this.Base_gui.prepare_canvas();
		}
		this.Base_layers.reset_layers();

		for (var i in data.layers) {
			var value = data.layers[i];

			if (value.type == 'image') {
				//add image data
				value.link = null;
				for (var j in data.data) {
					if (data.data[j].id == value.id) {
						value.data = data.data[j].data;
					}
				}
			}

			this.Base_layers.insert(value, false);
		}

		if (config.WIDTH != parseInt(data.width) || config.HEIGHT != parseInt(data.height)) {
			config.WIDTH = parseInt(data.width);
			config.HEIGHT = parseInt(data.height);
			this.Base_gui.prepare_canvas();
		}

		this.Base_layers.select(data.layer_active);
		this.layers_archive.shift(); //remove used state
	}

	/**
	 * try save, optimize memory, find optimal undo level count.
	 */
	optimize() {
		var megapixels = config.WIDTH * config.HEIGHT / 1024 / 1024;
		var images = 0;
		for (var i in config.layers) {
			if (config.layers[i].type == 'image') {
				images++;
			}
		}
		var total_megapixels = megapixels * images;

		if (total_megapixels > 100) {
			//high dimensions - undo disabled
			if (this.enabled == true)
				alertify.warning('Undo disabled.');
			this.enabled = false;
			this.layers_archive = [];
		}
		else {
			//enabled
			if (this.enabled == false)
				alertify.success('Undo enabled.');
			this.enabled = true;

			if (total_megapixels > 50) {
				//1 undo level
				if (this.levels > 1)
					alertify.warning('Undo levels changed to 1.');
				this.levels = 1;
				this.layers_archive = [
					this.layers_archive[0],
				];
			}
			else {
				//OK
				if (this.levels == 1)
					alertify.success('Undo levels restored to ' + this.levels);
				this.levels = this.levels_optimal;
			}
		}
	}

}

export default Base_state_class;
