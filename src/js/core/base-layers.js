/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import config from './../config.js';
import Base_gui_class from './base-gui.js';
import Base_selection_class from './base-selection.js';
import Base_state_class from './base-state.js';
import Image_trim_class from './../modules/image/trim.js';
import zoomView from './../libs/zoomView.js';
import Helper_class from './../libs/helpers.js';
import alertify from './../../../node_modules/alertifyjs/build/alertify.min.js';

var instance = null;

/**
 * Layers class - manages layers. Each layer is object with various types. Keys:
 * - id (int)
 * - link (image)
 * - parent_id (int)
 * - name (string)
 * - type (string)
 * - x (int)
 * - y (int)
 * - width (int)
 * - height (int)
 * - width_original (int)
 * - height_original (int)
 * - visible (bool)
 * - is_vector (bool)
 * - opacity (0-100)
 * - order (int)
 * - composition (string)
 * - rotate (int) 0-359
 * - data (various data here)
 * - params (object)
 * - color {hex}
 * - status (string)
 * - filters (array)
 * - render_function (function)
 */
class Base_layers_class {

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.Base_gui = new Base_gui_class();
		this.Helper = new Helper_class();
		this.Image_trim = new Image_trim_class();
		this.Base_state = new Base_state_class();

		this.canvas = document.getElementById('canvas_minipaint');
		this.ctx = document.getElementById('canvas_minipaint').getContext("2d");
		this.ctx_preview = document.getElementById('canvas_preview').getContext("2d");
		this.last_zoom = 1;
		this.zoomView = zoomView;
		this.auto_increment = 1;
		this.stable_dimensions = [];
		this.tempCanvas = document.createElement('canvas');
	}

	/**
	 * do preparation on start
	 */
	init() {
		this.init_zoom_lib();
		this.insert({});

		var sel_config = {
			enable_background: false,
			enable_borders: true,
			enable_controls: false,
			data_function: function () {
				return config.layer;
			},
		};
		this.Base_selection = new Base_selection_class(this.ctx, sel_config, 'main');

		this.render(true);
	}

	init_zoom_lib() {
		zoomView.setBounds(0, 0, config.WIDTH, config.HEIGHT);
		zoomView.setContext(this.ctx);
		this.stable_dimensions = [
			config.WIDTH,
			config.HEIGHT
		];
	}

	pre_render() {
		this.ctx.save();
		zoomView.canvasDefault();
		this.ctx.clearRect(0, 0, config.WIDTH * config.ZOOM, config.HEIGHT * config.ZOOM);
	}

	after_render() {
		config.need_render = false;
		this.ctx.restore();
		zoomView.canvasDefault();
	}

	/**
	 * renders all layers objects on main canvas
	 *
	 * @param {bool} force
	 */
	render(force) {
		var _this = this;
		if (force !== true) {
			//request render and exit
			config.need_render = true;
			return;
		}

		if (this.stable_dimensions[0] != config.WIDTH || this.stable_dimensions[1] != config.HEIGHT) {
			//dimensions changed - re-init zoom lib
			this.init_zoom_lib();
		}

		if (config.need_render == true) {

			if (this.last_zoom != config.ZOOM) {
				//change zoom
				zoomView.scaleAt(
					this.Base_gui.GUI_preview.zoom_data.x,
					this.Base_gui.GUI_preview.zoom_data.y,
					config.ZOOM / this.last_zoom
					);
			}
			else if (this.Base_gui.GUI_preview.zoom_data.move_pos != null) {
				//move visible window
				var pos = this.Base_gui.GUI_preview.zoom_data.move_pos;
				var pos_global = zoomView.toScreen(pos);
				zoomView.move(-pos_global.x, -pos_global.y);
				this.Base_gui.GUI_preview.zoom_data.move_pos = null;
			}

			//prepare
			this.pre_render();

			//take data
			var layers_sorted = this.get_sorted_layers();

			zoomView.apply();

			//render main canvas
			for (var i = layers_sorted.length - 1; i >= 0; i--) {
				var value = layers_sorted[i];
				this.ctx.globalAlpha = value.opacity / 100;
				this.ctx.globalCompositeOperation = value.composition;

				this.render_object(this.ctx, value);
			}

			//grid
			this.Base_gui.draw_grid(this.ctx);

			//render selected object controls
			this.Base_selection.draw_selection();

			//render preview
			this.render_preview(layers_sorted);

			//reset
			this.after_render();
			this.last_zoom = config.ZOOM;

			this.Base_gui.GUI_details.render_details();
		}

		requestAnimationFrame(function () {
			_this.render(force);
		});
	}

	render_preview(layers) {
		var w = this.Base_gui.GUI_preview.PREVIEW_SIZE.w;
		var h = this.Base_gui.GUI_preview.PREVIEW_SIZE.h;

		this.ctx_preview.save();
		this.ctx_preview.clearRect(0, 0, w, h);

		//prepare scale
		this.ctx_preview.scale(w / config.WIDTH, h / config.HEIGHT);

		for (var i = layers.length - 1; i >= 0; i--) {
			var value = layers[i];

			if (value.visible == false) {
				//not visible
				continue;
			}
			if (value.type == null) {
				//empty type
				continue;
			}

			this.ctx_preview.globalAlpha = value.opacity / 100;
			this.ctx_preview.globalCompositeOperation = value.composition;

			this.render_object(this.ctx_preview, value);
		}

		this.ctx_preview.restore();
		this.Base_gui.GUI_preview.render_preview_active_zone();
	}

	/**
	 * export current 1ayers to given canvas
	 *
	 * @param {canvas.context} ctx
	 * @param {object} object
	 */
	render_object(ctx, object) {
		if (object.visible == false || object.type == null)
			return;

		//apply filters
		var filter_code = '';
		for (var i in object.filters) {
			var filter = object.filters[i];

			if (filter_code != '')
				filter_code += ' ';
			filter_code += filter.name + "(" + filter.params.value + ")";
		}
		if (filter_code != '')
			ctx.filter = filter_code;
		else
			ctx.filter = 'none';

		//example with canvas object - other types should overwrite this method
		if (object.type == 'image') {
			//image - default behavior
			var rotateSupport = true;
			if (rotateSupport == false) {
				if (object.link_canvas != undefined && object.link_canvas != null) {
					//we have draft canvas - use it
					ctx.drawImage(object.link_canvas, object.x, object.y, object.width, object.height);
				}
				else {
					ctx.drawImage(object.link, object.x, object.y, object.width, object.height);
				}
			}
			else {
				ctx.save();

				ctx.translate(object.x + object.width / 2, object.y + object.height / 2);
				ctx.rotate(object.rotate * Math.PI / 180);
				if (object.link_canvas != undefined && object.link_canvas != null) {
					//we have draft canvas - use it
					ctx.drawImage(object.link_canvas, -object.width / 2, -object.height / 2,
						object.width, object.height);
				}
				else {
					ctx.drawImage(object.link, -object.width / 2, -object.height / 2,
						object.width, object.height);
				}

				ctx.restore();
			}
		}
		else {
			//call render function from other module
			var render_class = object.render_function[0];
			var render_function = object.render_function[1];

			this.Base_gui.GUI_tools.tools_modules[render_class][render_function](ctx, object);
		}
		ctx.filter = 'none';
	}

	/**
	 * creates new layer
	 *
	 * @param {array} settings
	 * @param {boolean} can_automate
	 */
	async insert(settings, can_automate = true) {
		var _this = this;

		return new Promise(function(resolve, reject) {
			var resolvable = false;
			var need_autoresize = false;

			//default data
			var layer = {
				id: _this.auto_increment,
				parent_id: 0,
				name: _this.Helper.ucfirst(config.TOOL.name) + ' #' + _this.auto_increment,
				type: null,
				link: null,
				x: 0,
				y: 0,
				width: 0,
				width_original: null,
				height: 0,
				height_original: null,
				visible: true,
				is_vector: false,
				opacity: 100,
				order: _this.auto_increment,
				composition: 'source-over',
				rotate: 0,
				data: null,
				params: {},
				status: null,
				color: config.COLOR,
				filters: [],
				render_function: null,
			};

			//build data
			for (var i in settings) {
				if (typeof layer[i] == "undefined") {
					alertify.error('Error: wrong key: ' + i);
					continue;
				}
				layer[i] = settings[i];
			}

			//prepare image
			if (layer.type == 'image') {
				
				if(layer.name.toLowerCase().indexOf('.svg') == layer.name.length - 4){
					//we have svg
					layer.is_vector = true;
				}

				if (config.layers.length == 1 && config.layer.width == 0
					&& config.layer.height == 0 && config.layer.data == null) {
					//remove first empty layer?
					_this.delete(config.layer.id, true);
				}

				if (layer.link == null) {
					if (typeof layer.data == 'object') {
						//load actual image
						if (layer.width == 0)
							layer.width = layer.data.width;
						if (layer.height == 0)
							layer.height = layer.data.height;
						layer.link = layer.data.cloneNode(true);
						layer.link.onload = function () {
							config.need_render = true;
						};
						layer.data = null;
						need_autoresize = true;
					}
					else if (typeof layer.data == 'string') {
						//try loading as imageData
						resolvable = true;
						layer.link = new Image();
						layer.link.onload = function () {
							//update dimensions
							if (layer.width == 0)
								layer.width = layer.link.width;
							if (layer.height == 0)
								layer.height = layer.link.height;
							if (layer.width_original == null)
								layer.width_original = layer.width;
							if (layer.height_original == null)
								layer.height_original = layer.height;
							//free data

							layer.data = null;
							_this.autoresize(layer.width, layer.height, layer.id, can_automate);
							_this.render();
							layer.link.onload = function () {
								config.need_render = true;
							};
							resolve(true);
						};
						layer.link.src = layer.data;
					}
					else {
						alertify.error('Error: can not load image.');
					}
				}
			}

			if (settings != undefined && config.layers.length > 0
				&& config.layer.width == 0 && config.layer.height == 0
				&& config.layer.data == null && layer.type != 'image' && can_automate !== false) {
				//update existing layer, because its empty
				for (var i in layer) {
					if (i == 'id')
						continue;
					if (i == 'name')
						continue;
					if (i == 'order')
						continue;
					config.layer[i] = layer[i];
				}
			}
			else {
				//create new layer
				config.layers.push(layer);
				config.layer = _this.get_layer(layer.id);
				_this.auto_increment++;

				if (config.layer == null) {
					config.layer = config.layers[0];
				}
			}

			if (layer.id >= _this.auto_increment)
				_this.auto_increment = layer.id + 1;

			if (need_autoresize == true) {
				_this.autoresize(config.layer.width, config.layer.height);
			}

			_this.render();
			_this.Base_gui.GUI_layers.render_layers();
			if(resolvable == false){
				resolve(true);
			}
		});
	}

	/**
	 * autoresize layer, based on dimensions, up - always, if 1 layer - down.
	 *
	 * @param {int} width
	 * @param {int} height
	 * @param {int} layer_id
	 * @param {boolean} can_automate
	 */
	autoresize(width, height, layer_id, can_automate = true) {
		var _this = this;
		var need_fit = false;

		if (layer_id == undefined)
			layer_id = config.layer;

		//resize up
		if (width > config.WIDTH || height > config.HEIGHT) {

			var wrapper = document.getElementById('main_wrapper');
			var page_w = wrapper.clientWidth;
			var page_h = wrapper.clientHeight;

			if (width > page_w || height > page_h) {
				need_fit = true;
			}
			if (width > config.WIDTH)
				config.WIDTH = parseInt(width);
			if (height > config.HEIGHT)
				config.HEIGHT = parseInt(height);
		}

		//resize down
		if (config.layers.length == 1 && can_automate !== false) {
			if (width < config.WIDTH)
				config.WIDTH = parseInt(width);
			if (height < config.HEIGHT)
				config.HEIGHT = parseInt(height);
		}

		this.Base_gui.prepare_canvas();

		//fit zoom when after short pause
		//@todo - remove setTimeout
		if (need_fit == true) {
			var internal = window.setTimeout(myCallback, 100);
			function myCallback() {
				_this.Base_gui.GUI_preview.zoom_auto();
			}
		}
	}

	/**
	 * returns layer
	 *
	 * @param {int} id
	 * @returns {object}
	 */
	get_layer(id) {
		if(id == undefined){
			id = config.layer.id;
		}
		for (var i in config.layers) {
			if (config.layers[i].id == id) {
				return config.layers[i];
			}
		}
		alertify.error('Error: can not find layer with id:' + id);
		return null;
	}

	/**
	 * removes layer
	 *
	 * @param {int} id
	 * @param {boolean} force - Force to delete first layer?
	 */
	delete(id, force) {
		id = parseInt(id);
		if (config.layers.length == 1 && (force == undefined || force == false)) {
			//only 1 layer left
			if (config.layer.type == null) {
				//STOP
				return;
			}
			else {
				//delete it, but before that - create new empty layer
				this.insert();
			}
		}

		if (config.layer.id == id) {
			//select previous layer
			config.layer = this.find_next(id);
			if (config.layer == null)
				config.layer = this.find_previous(id);
		}

		for (var i in config.layers) {
			if (config.layers[i].id == id) {
				//delete

				if (config.layers[i].type == 'image') {
					//clean image
					config.layers[i].link = null;
				}

				config.layers.splice(i, 1);
			}
		}

		this.render();
		this.Base_gui.GUI_layers.render_layers();
	}

	/*
	 * removes all layers
	 */
	reset_layers(auto_insert) {
		for (var i = config.layers.length - 1; i >= 0; i--) {
			this.delete(config.layers[i].id, true);
		}
		this.auto_increment = 1;

		if (auto_insert != undefined && auto_insert === true) {
			var settings = {};
			this.insert(settings);
		}

		this.render();
		this.Base_gui.GUI_layers.render_layers();
	}

	/**
	 * toggle layer visibility
	 *
	 * @param {int} id
	 */
	toggle_visibility(id) {
		id = parseInt(id);
		var link = this.get_layer(id);

		if (link.visible == false)
			link.visible = true;
		else
			link.visible = false;

		this.render();
		this.Base_gui.GUI_layers.render_layers();
	}

	/*
	 * renew layers HTML
	 */
	refresh_gui() {
		this.Base_gui.GUI_layers.render_layers();
	}

	/**
	 * marks layer as selected, active
	 *
	 * @param {int} id
	 */
	select(id) {
		id = parseInt(id);
		config.layer = this.get_layer(id);
		this.Base_selection.reset_selection();

		this.render();
		this.Base_gui.GUI_layers.render_layers();
	}

	/**
	 * change layer opacity
	 *
	 * @param {int} id
	 * @param {int} value 0-100
	 */
	set_opacity(id, value) {
		id = parseInt(id);
		value = parseInt(value);
		if (value < 0 || value > 100) {
			//reset
			value = 100;
		}
		var link = this.get_layer(id);

		link.opacity = value;
	}

	/**
	 * clear layer data
	 *
	 * @param {int} id
	 */
	layer_clear(id) {
		id = parseInt(id);
		var link = this.get_layer(id);

		link.data = null;
		link.x = 0;
		link.y = 0;
		link.width = 0;
		link.height = 0;
	}

	/**
	 * move layer up or down
	 *
	 * @param {int} id
	 * @param {int} direction
	 */
	move(id, direction) {
		id = parseInt(id);
		var link = this.get_layer(id);

		if (direction < 0) {
			var target = this.find_previous(id);
		}
		else {
			var target = this.find_next(id);
		}
		if (target != null) {
			var current_order = link.order;
			link.order = target.order;
			target.order = current_order;
		}

		this.render();
		this.Base_gui.GUI_layers.render_layers();
	}

	/**
	 * clone and sort.
	 */
	get_sorted_layers() {
		return config.layers.concat().sort(
			//sort function
				(a, b) => b.order - a.order
			);
	}

	/**
	 * checks if layer empty
	 *
	 * @param {int} id
	 * @returns {Boolean}
	 */
	is_layer_empty(id) {
		var link = this.get_layer(id);

		if (link.width == 0 && link.height == 0 && link.data == null) {
			return true;
		}

		return false;
	}

	/**
	 * find next layer
	 *
	 * @param {int} id layer id
	 * @returns {layer|null}
	 */
	find_next(id) {
		id = parseInt(id);
		var link = this.get_layer(id);
		var layers_sorted = this.get_sorted_layers();

		var last = null;
		for (var i = layers_sorted.length - 1; i >= 0; i--) {
			var value = layers_sorted[i];

			if (last != null && last.id == link.id) {
				return value;
			}
			last = value;
		}

		return null;
	}

	/**
	 * find previous layer
	 *
	 * @param {int} id layer id
	 * @returns {layer|null}
	 */
	find_previous(id) {
		id = parseInt(id);
		var link = this.get_layer(id);
		var layers_sorted = this.get_sorted_layers();

		var last = null;
		for (var i in layers_sorted) {
			var value = layers_sorted[i];

			if (last != null && last.id == link.id) {
				return value;
			}
			last = value;
		}

		return null;
	}

	/**
	 * returns global position, for example if canvas is zoomed, it will convert relative mouse position to absolute at 100% zoom.
	 *
	 * @param {int} x
	 * @param {int} y
	 * @returns {object} keys: x, y
	 */
	get_world_coords(x, y) {
		return zoomView.toWorld(x, y);
	}

	/**
	 * register new live filter
	 *
	 * @param {int} layer_id
	 * @param {string} name
	 * @param {object} params
	 */
	add_filter(layer_id, name, params) {
		if (layer_id == null)
			layer_id = config.layer.id;
		var link = this.get_layer(layer_id);
		var filter = {
			id: this.Helper.getRandomInt(1, 999999999),
			name: name,
			params: params,
		};
		link.filters.push(filter);

		config.need_render = true;
		this.Base_gui.GUI_layers.render_layers();
	}

	/**
	 * delete live filter
	 *
	 * @param {int} layer_id
	 * @param {string} filter_id
	 */
	delete_filter(layer_id, filter_id) {
		if (layer_id == null)
			layer_id = config.layer.id;
		var link = this.get_layer(layer_id);

		for (var i in link.filters) {
			if (link.filters[i].id == filter_id) {
				link.filters.splice(i, 1);
			}
		}

		config.need_render = true;
		this.Base_gui.GUI_layers.render_layers();
	}

	/**
	 * exports all layers to canvas for saving
	 *
	 * @param {canvas.context} ctx
	 * @param {int} layer_id Optional
	 */
	convert_layers_to_canvas(ctx, layer_id) {
		var layers_sorted = this.get_sorted_layers();
		for (var i = layers_sorted.length - 1; i >= 0; i--) {
			var value = layers_sorted[i];

			if (value.visible == false || value.type == null) {
				continue;
			}
			if (layer_id != undefined && value.id != layer_id) {
				continue;
			}

			ctx.globalAlpha = value.opacity / 100;
			ctx.globalCompositeOperation = value.composition;

			this.render_object(ctx, value);
		}
	}
	/**
	 * exports (active) layer to canvas for saving
	 *
	 * @param {int} layer_id or current layer by default
	 * @param {boolean} actual_area used for resized image. Default is false.
	 * @param {boolean} can_trim default is true
	 * @returns {canvas}
	 */
	convert_layer_to_canvas(layer_id, actual_area = false, can_trim) {
		if(actual_area == null)
			actual_area = false;
		if (layer_id == null)
			layer_id = config.layer.id;
		var link = this.get_layer(layer_id);
		var offset_x = 0;
		var offset_y = 0;

		//create tmp canvas
		var canvas = document.createElement('canvas');
		if (actual_area === true && link.type == 'image') {
			canvas.width = link.width_original;
			canvas.height = link.height_original;
			can_trim = false;
		}
		else {
			canvas.width = Math.max(link.width, config.WIDTH);
			canvas.height = Math.max(link.height, config.HEIGHT);
		}

		//add data
		if (actual_area === true && link.type == 'image') {
			canvas.getContext("2d").drawImage(link.link, 0, 0);
		}
		else {
			this.render_object(canvas.getContext("2d"), link);
		}

		//trim
		if ((can_trim == true || can_trim == undefined) && link.type != null) {
			var trim_info = this.Image_trim.get_trim_info(layer_id);
			if (trim_info.left > 0 || trim_info.top > 0 || trim_info.right > 0 || trim_info.bottom > 0) {
				offset_x = trim_info.left;
				offset_y = trim_info.top;

				var w = canvas.width - trim_info.left - trim_info.right;
				var h = canvas.height - trim_info.top - trim_info.bottom;
				if(w > 1 && h > 1) {
					this.Helper.change_canvas_size(canvas, w, h, offset_x, offset_y);
				}
			}
		}

		canvas.dataset.x = offset_x;
		canvas.dataset.y = offset_y;

		return canvas;
	}

	/**
	 * updates layer image data
	 *
	 * @param {canvas} canvas
	 * @param {int} layer_id (optional)
	 */
	update_layer_image(canvas, layer_id) {
		if (layer_id == null)
			layer_id = config.layer.id;
		var link = this.get_layer(layer_id);

		if (link.type != 'image'){
			alertify.error('Error: layer must be image.');
			return null;
		}

		if(this.Helper.is_edge_or_ie() == false){
			//update image using blob (faster)
			canvas.toBlob(function (blob) {
				link.link.src = window.URL.createObjectURL(blob);
				config.need_render = true;
			}, 'image/png');
		}
		else{
			//slow way for IE, Edge
			link.link.src = canvas.toDataURL();
		}

		config.need_render = true;
	}

	/**
	 * returns canvas dimensions.
	 *
	 * @returns {object}
	 */
	get_dimensions() {
		return {
			width: config.WIDTH,
			height: config.HEIGHT,
		};
	}

}

export default Base_layers_class;
