import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Dialog_class from './../../libs/popup.js';
import Helper_class from './../../libs/helpers.js';

class Image_histogram_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
	}

	histogram() {
		var _this = this;

		var settings = {
			title: 'Histogram',
			on_change: function (params) {
				_this.histogram_onload(params);
			},
			params: [
				{name: "channel", title: "Channel:", values: ["Gray", "Red", "Green", "Blue"], },
				{title: 'Histogram:', function: function () {
						var html = '<canvas style="position:relative;" id="c_h" width="256" height="100"></canvas>';
						return html;
					}},
				{title: "Total pixels:", value: ""},
				{title: "Average:", value: ""},
			],
		};
		this.POP.show(settings);

		this.histogram_onload({});
	}

	histogram_onload(params) {
		//get canvas from layer
		var canvas = this.Base_layers.convert_layer_to_canvas(config.layer.id);
		var ctx = canvas.getContext("2d");
		var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var imgData = img.data;

		var channel = 0;
		if (params.channel == 'Red')
			channel = 1;
		else if (params.channel == 'Green')
			channel = 2;
		else if (params.channel == 'Blue')
			channel = 3;

		var hist_data = [[], [], [], []]; //grey, red, green, blue
		var total = imgData.length / 4;
		var sum = 0;
		var grey;

		for (var i = 0; i < imgData.length; i += 4) {
			//collect grey
			grey = Math.round((imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3);
			sum = sum + imgData[i] + imgData[i + 1] + imgData[i + 2];
			if (hist_data[0][grey] == undefined)
				hist_data[0][grey] = 1;
			else
				hist_data[0][grey]++;

			//collect colors
			for (var c = 0; c < 3; c++) {
				if (c + 1 != channel)
					continue;
				if (hist_data[c + 1][imgData[i + c]] == undefined)
					hist_data[c + 1][imgData[i + c]] = 1;
				else
					hist_data[c + 1][imgData[i + c]]++;
			}
		}

		var c = document.getElementById("c_h").getContext("2d");
		c.rect(0, 0, 256, 100);
		c.fillStyle = "#ffffff";
		c.fill();
		var opacity = 1;

		//draw histogram
		for (var h in hist_data) {
			for (var i = 0; i <= 255; i++) {
				if (h != channel)
					continue;
				if (hist_data[h][i] == 0)
					continue;
				c.beginPath();

				if (h == 0)
					c.strokeStyle = "rgba(64, 64, 64, " + opacity * 2 + ")";
				else if (h == 1)
					c.strokeStyle = "rgba(255, 0, 0, " + opacity + ")";
				else if (h == 2)
					c.strokeStyle = "rgba(0, 255, 0, " + opacity + ")";
				else if (h == 3)
					c.strokeStyle = "rgba(0, 0, 255, " + opacity + ")";

				c.lineWidth = 1;
				c.moveTo(i + 0.5, 100 + 0.5);
				c.lineTo(i + 0.5, 100 - Math.round(hist_data[h][i] * 255 * 100 / total / 6) + 0.5);
				c.stroke();
			}
		}

		document.getElementById("pop_data_totalpixel").innerHTML = this.Helper.number_format(total, 0);
		var average;
		if (total > 0)
			average = Math.round(sum * 10 / total / 3) / 10;
		else
			average = '-';
		document.getElementById("pop_data_average").innerHTML = average;

		canvas.width = 1;
		canvas.height = 1;
	}

}

export default Image_histogram_class;