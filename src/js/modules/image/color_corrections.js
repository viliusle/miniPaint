import app from './../../app.js';
import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Dialog_class from './../../libs/popup.js';
import Helper_class from './../../libs/helpers.js';
import ImageFilters_class from './../../libs/imagefilters.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

class Image_colorCorrections_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
		this.ImageFilters = ImageFilters_class;
	}

	color_corrections() {
		var _this = this;

		if (config.layer.type != 'image') {
			alertify.error('This layer must contain an image. Please convert it to raster to apply this tool.');
			return;
		}

		var settings = {
			title: 'Color Corrections',
			preview: true,
			on_change: function (params, canvas_preview, w, h, canvas) {
				//destructive effects
				var img = this.layer_active_small_ctx.getImageData(0, 0, w, h);
				var data = _this.do_corrections(img, params, false);
				canvas_preview.putImageData(data, 0, 0);

				//non-destructive
				canvas_preview.filter = "brightness(" + (1 + (params.param_b / 100)) + ")";
				canvas_preview.filter += " contrast(" + (1 + (params.param_c / 100)) + ")";
				canvas_preview.filter += " saturate(" + (1 + (params.param_s / 100)) + ")";
				canvas_preview.filter += " hue-rotate(" + params.param_h + "deg)";

				canvas_preview.drawImage(canvas, 0, 0);
			},
			params: [
				{name: "param_b", title: "Brightness:", value: "0", range: [-100, 100]},
				{name: "param_c", title: "Contrast:", value: "0", range: [-100, 100]},
				{name: "param_s", title: "Saturation:", value: "0", range: [-100, 100]},
				{name: "param_h", title: "Hue:", value: "0", range: [-180, 180]},
				{},
				{name: "param_l", title: "Luminance:", value: "0", range: [-100, 100]},
				{},
				{name: "param_red", title: "Red channel:", value: "0", range: [-255, 255]},
				{name: "param_green", title: "Green channel:", value: "0", range: [-255, 255]},
				{name: "param_blue", title: "Blue channel:", value: "0", range: [-255, 255]},
			],
			on_finish: function (params) {
				_this.save_changes(params);
			},
		};
		this.POP.show(settings);
	}

	save_changes(params) {

		//get canvas from layer
		var canvas = this.Base_layers.convert_layer_to_canvas(null, true);
		var ctx = canvas.getContext("2d");

		//change data
		var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var data = this.do_corrections(img, params);
		ctx.putImageData(data, 0, 0);

		//save
		app.State.do_action(
			new app.Actions.Update_layer_image_action(canvas)
		);

		//non-destructive filters
		//multiple do_action() + do_corrections() does not work together yet.
		if(params.param_b != 0) {
			var parameters = {value: params.param_b};
			var filter_id = null;
			app.State.do_action(
				new app.Actions.Add_layer_filter_action(null, 'brightness', parameters, filter_id)
			);
		}
		if(params.param_c != 0) {
			var parameters = {value: params.param_c};
			var filter_id = null;
			app.State.do_action(
				new app.Actions.Add_layer_filter_action(null, 'contrast', parameters, filter_id)
			);
		}
		if(params.param_s != 0) {
			var parameters = {value: params.param_s};
			var filter_id = null;
			app.State.do_action(
				new app.Actions.Add_layer_filter_action(null, 'saturate', parameters, filter_id)
			);
		}
		if(params.param_h != 0) {
			var parameters = {value: params.param_h};
			var filter_id = null;
			app.State.do_action(
				new app.Actions.Add_layer_filter_action(null, 'hue-rotate', parameters, filter_id)
			);
		}
	}

	/**
	 * corrections (destructive)
	 *
	 * @param data
	 * @param params
	 * @returns {*}
	 */
	do_corrections(data, params) {
		//luminance
		if(params.param_l != 0) {
			var data = this.ImageFilters.HSLAdjustment(data, 0, 0, params.param_l);
		}

		//RGB corrections
		if(params.param_red != 0 || params.param_green != 0 || params.param_blue != 0) {
			var data = this.ImageFilters.ColorTransformFilter(data, 1, 1, 1, 1,
				params.param_red, params.param_green, params.param_blue, 1);
		}

		return data;
	}

}

export default Image_colorCorrections_class;