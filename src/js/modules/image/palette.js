import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import colorThief_class from './../../libs/color-thief.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';
import Dialog_class from './../../libs/popup.js';
import Helper_class from './../../libs/helpers.js';

class Image_color_class {

	constructor() {
		this.Base_layers = new Base_layers_class();
		this.alertify = new colorThief_class();
		this.POP = new Dialog_class();
		this.Helper = new Helper_class();
	}

	palette() {
		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}
		var palette = this.alertify.getPalette(config.layer.link);
		var dominant = this.alertify.getColor(config.layer.link);
		dominant = this.Helper.rgbToHex(dominant[0], dominant[1], dominant[2]);

		var settings = {
			title: 'Palette',
			params: [
				{title: "Dominant color:", html: this.generate_color_box(dominant, 200)},
			],
		};
		for (var i in palette) {
			var rgb = this.Helper.rgbToHex(palette[i][0], palette[i][1], palette[i][2]);
			i = parseInt(i);
			settings.params.push(
				{title: "Color #" + (i + 1) + ":", html: this.generate_color_box(rgb, 100)}
			);
		}
		this.POP.show(settings);
	}

	generate_color_box(color, width) {
		var html = '';

		html += '<input style="width:100px;margin-right:10px;" type="text" value="' + color + '" />';
		html += '<span style="display:inline-block;width:' + width + 'px;height:21px;margin-bottom:-6px;border:1px solid black;background-color:' + color + '"></span>';

		return html;
	}

}

export default Image_color_class;
