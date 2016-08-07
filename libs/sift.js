/**
 * SIFT: scale-invariant-feature-transform, keypoints
 * 
 * @author ViliusL
 */

/* global HELPER, IMAGE, ImageFilters, LAYER, canvas_active */

var SIFT = new SIFT_CLASS();

function SIFT_CLASS() {
	/**
	 * contrast check, smaller - more points, better accuracy, but slower
	 */
	var avg_offset = 50;
	
	/**
	 * how much pixels to check for each side to get average
	 */
	var avg_step = 4;

	//generate key points for image
	this.generate_keypoints = function (canvas, show_points) {
		var W = canvas.width;
		var H = canvas.height;
		HELPER.timer_init();

		//check whitespace
		var trim_details = IMAGE.trim_info(canvas);
		W = W - trim_details.left - trim_details.right;
		H = H - trim_details.top - trim_details.bottom;
		//make copy
		var clone = document.createElement("canvas");
		clone.width = W;
		clone.height = H;
		var ctx = clone.getContext("2d");
		ctx.drawImage(canvas, -trim_details.left, -trim_details.top, canvas.width, canvas.height);

		//greyscale
		var imageData = ctx.getImageData(0, 0, W, H);
		var filtered = ImageFilters.GrayScale(imageData); //add effect
		ctx.putImageData(filtered, 0, 0);

		//make few copies and blur each
		var n = 5;
		var copies = [];
		for (var i = 0; i < n; i++) {
			var tmp_canvas = document.createElement("canvas");
			tmp_canvas.width = W;
			tmp_canvas.height = H;
			var ctx_i = tmp_canvas.getContext("2d");
			ctx_i.drawImage(clone, 0, 0);

			//gausian blur
			var imageData = ctx_i.getImageData(0, 0, W, H);
			var filtered = ImageFilters.GaussianBlur(imageData, i + 0.5); //add effect
			ctx_i.putImageData(filtered, 0, 0);

			copies.push(tmp_canvas);
		}

		//find extreme points
		var points = [];
		var n0 = avg_step * 2 + 1;
		for (var c = 1; c < copies.length - 1; c++) {
			var imageData = copies[c].getContext("2d").getImageData(0, 0, W, H).data;
			var imageData0 = copies[c - 1].getContext("2d").getImageData(0, 0, W, H).data;
			var imageData2 = copies[c + 1].getContext("2d").getImageData(0, 0, W, H).data;
			for (var j = avg_step; j < H - avg_step; j++) {
				for (var i = avg_step; i < W - avg_step; i++) {
					var x = (i + j * W) * 4;
					if (imageData[x + 3] == 0)
						continue; //transparent
					if (imageData[x] < imageData[x - 4] || imageData[x] < imageData[x + 4] || imageData[x] > imageData[x - 4] || imageData[x] > imageData[x + 4]) {
						var x_pre = (i + (j - 1) * W) * 4;
						var x_post = (i + (j + 1) * W) * 4;
						//calc average
						var area_average = 0;
						for (var l = -avg_step; l <= avg_step; l++) {
							var avgi = (i + (j - l) * W) * 4;
							for (var a = -avg_step; a <= avg_step; a++) {
								area_average += imageData[avgi + 4 * a];
							}
						}
						area_average = area_average / (n0 * n0);
						//max
						if (imageData[x] + avg_offset < area_average) {
							var min = Math.min(imageData[x_pre - 4], imageData[x_pre], imageData[x_pre + 4], imageData[x - 4], imageData[x + 4], imageData[x_post - 4], imageData[x_post], imageData[x_post + 4]);
							if (imageData[x] <= min) {
								var min0 = Math.min(imageData0[x_pre - 4], imageData0[x_pre], imageData0[x_pre + 4], imageData0[x - 4], imageData0[x + 4], imageData0[x_post - 4], imageData0[x_post], imageData0[x_post + 4]);
								if (imageData[x] <= min0) {
									var min2 = Math.min(imageData2[x_pre - 4], imageData2[x_pre], imageData2[x_pre + 4], imageData2[x - 4], imageData2[x + 4], imageData2[x_post - 4], imageData2[x_post], imageData2[x_post + 4]);
									if (imageData[x] <= min2)
										points.push({
											x: i + trim_details.left,
											y: j + trim_details.top,
											w: Math.round(area_average - imageData[x] - avg_offset)
										});
								}
							}
							continue;
						}
						//min
						if (imageData[x] - avg_offset > area_average) {
							var max = Math.max(imageData[x_pre - 4], imageData[x_pre], imageData[x_pre + 4], imageData[x - 4], imageData[x + 4], imageData[x_post - 4], imageData[x_post], imageData[x_post + 4]);
							if (imageData[x] >= max) {
								var max0 = Math.max(imageData0[x_pre - 4], imageData0[x_pre], imageData0[x_pre + 4], imageData0[x - 4], imageData0[x + 4], imageData0[x_post - 4], imageData0[x_post], imageData0[x_post + 4]);
								if (imageData[x] >= max0) {
									var max2 = Math.max(imageData2[x_pre - 4], imageData2[x_pre], imageData2[x_pre + 4], imageData2[x - 4], imageData2[x + 4], imageData2[x_post - 4], imageData2[x_post], imageData2[x_post + 4]);
									if (imageData[x] >= max2){
										points.push({
											x: i + trim_details.left,
											y: j + trim_details.top,
											w: Math.round(imageData[x] - area_average - avg_offset)
										});
									}
								}
							}
						}
					}
				}
			}
		}
		//make unique
		for (var i = 0; i < points.length; i++) {
			for (var j = 0; j < points.length; j++) {
				if (i != j && points[i].x == points[j].x && points[i].y == points[j].y) {
					points.splice(i, 1);
					i--;
					break;
				}
			}
		}

		//show points?
		if (show_points === true) {
			var time = HELPER.timer('', true);
			console.log('key points: ' + points.length + ", " + time);
			LAYER.layer_add();

			var size = 3;
			canvas_active().fillStyle = "#ff0000";
			for (var i in points) {
				var point = points[i];
				canvas_active().beginPath();
				canvas_active().rect(point.x - Math.floor(size / 2) + 1, point.y - Math.floor(size / 2) + 1, size, size);
				canvas_active().fill();
			}
		}
		else {
			//sort by weights 
			points.sort(function (a, b) {
				return parseFloat(b.w) - parseFloat(a.w);
			});
			return {
				points: points,
				trim_details: trim_details
			};
		}
	};
	
	//returns average value of requested area from greyscale image
	//area = {x, y, w, h}
	this.get_area_average = function (area, imageData, i, j, size) {
		var imgData = imageData.data;
		var sum = 0;
		var n = 0;
		size = size / 100; //prepare to use 1-100% values
		var stop_x = i + Math.round(size * area.x) + Math.round(size * area.w);
		var stop_y = j + Math.round(size * area.y) + Math.round(size * area.h);
		var img_width4 = imageData.width * 4;
		var k0, k;
		for (var y = j + Math.round(size * area.y); y < stop_y; y++) {
			k0 = y * img_width4;
			for (var x = i + Math.round(size * area.x); x < stop_x; x++) {
				k = k0 + (x * 4);
				sum = sum + imgData[k];
				n++;
			}
		}
		return Math.round(sum / n);
	};
}
