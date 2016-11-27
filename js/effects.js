/* global POP, MAIN, VINTAGE, ImageFilters, fx_filter, VINTAGE, fx, HELPER, EVENTS, EDIT, GUI */
/* global WIDTH, HEIGHT, canvas_active, canvas_front */

var EFFECTS = new EFFECTS_CLASS();

/** 
 * manages effects
 * 
 * @author ViliusL
 */
function EFFECTS_CLASS() {
	
	this.FILTERS_LIST = [
		{title: 'Black and White',	name: 'effects_bw' },
		{title: 'Blur-Box',		name: 'effects_BoxBlur' },
		{title: 'Blur-Gaussian',	name: 'effects_GaussianBlur' },
		{title: 'Blur-Stack',		name: 'effects_StackBlur' },
		{title: 'Blur-Zoom',		name: 'effects_zoomblur' },
		{title: 'Bulge/Pinch',		name: 'effects_bulge_pinch' },
		{title: 'Colorize',		name: 'effects_colorize' },
		{title: 'Denoise',		name: 'effects_denoise' },
		{title: 'Desaturate',		name: 'effects_Desaturate' },
		{title: 'Dither',			name: 'effects_Dither' },
		{title: 'Dot Screen',		name: 'effects_dot_screen' },
		{title: 'Edge',			name: 'effects_Edge' },
		{title: 'Emboss',			name: 'effects_Emboss' },
		{title: 'Enrich',			name: 'effects_Enrich' },
		{title: 'Grains',			name: 'effects_Grains' },
		{title: 'Heatmap',		name: 'effects_heatmap' },
		{title: 'JPG Compression',	name: 'effects_jpg_vintage' },
		{title: 'Mosaic',			name: 'effects_Mosaic' },
		{title: 'Oil',			name: 'effects_Oil' },
		{title: 'Perspective',		name: 'effects_perspective' },
		{title: 'Sepia',			name: 'effects_Sepia' },
		{title: 'Sharpen',		name: 'effects_Sharpen' },
		{title: 'Solarize',		name: 'effects_Solarize' },
		{title: 'Tilt Shift',		name: 'effects_tilt_shift' },
		{title: 'Vignette',		name: 'effects_vignette' },
		{title: 'Vibrance',		name: 'effects_vibrance' },
		{title: 'Vintage',		name: 'effects_vintage' },
		];
		
	var fx_filter = false;

	this.load_fx = function (){
		//load FX lib
		if(fx_filter == false){
			fx_filter = fx.canvas();
		}		
	};

	this.effects_bw = function () {
		var default_level = this.thresholding('otsu', canvas_active(), WIDTH, HEIGHT, true);
		POP.add({name: "param1", title: "Level:", value: default_level, range: [0, 255]});
		POP.add({name: "param2", title: "Dithering:", values: ['No', 'Yes'], onchange: "EFFECTS.effects_bw_onchange()"});
		POP.effects = true;
		POP.show('Black and White',
			function (user_response) {
				EDIT.save_state();
				var param1 = parseInt(user_response.param1);
				var param2 = false;
				if (user_response.param2 == 'Yes')
					param2 = true;

				EFFECTS.effect_bw(canvas_active(), WIDTH, HEIGHT, param1, param2);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var param1 = parseInt(user_response.param1);
				var param2 = false;
				if (user_response.param2 == 'Yes')
					param2 = true;

				EFFECTS.effect_bw(canvas_preview, w, h, param1, param2);
			}
		);
	};

	this.effects_bw_onchange = function () {
		var levels = document.getElementById("pop_data_param1");
		var dithering_no = document.getElementById("pop_data_param2_poptmp0");
		var dithering_yes = document.getElementById("pop_data_param2_poptmp1");

		if (dithering_no.checked == true)
			levels.disabled = false;
		else if (dithering_yes.checked == true)
			levels.disabled = true;

		POP.view();
	};

	this.effects_BoxBlur = function () {
		POP.add({name: "param1", title: "H Radius:", value: "3", range: [1, 20]});
		POP.add({name: "param2", title: "V Radius:", value: "3", range: [1, 20]});
		POP.add({name: "param3", title: "Quality:", value: "2", range: [1, 10]});
		POP.effects = true;
		POP.show('Blur-Box',
			function (user_response) {
				EDIT.save_state();
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var param3 = parseInt(user_response.param3);

				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.BoxBlur(imageData, param1, param2, param3);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var param3 = parseInt(user_response.param3);
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.BoxBlur(imageData, param1, param2, param3);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
			}
		);
	};

	this.effects_GaussianBlur = function () {
		POP.add({name: "param1", title: "Strength:", value: "2", range: [1, 4], step: 0.1});
		POP.effects = true;
		POP.show('Blur-Gaussian',
			function (user_response) {
				EDIT.save_state();
				var param1 = parseFloat(user_response.param1);

				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.GaussianBlur(imageData, param1);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var param1 = parseFloat(user_response.param1);

				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.GaussianBlur(imageData, param1);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
			}
		);
	};

	this.effects_StackBlur = function () {
		POP.add({name: "param1", title: "Radius:", value: "6", range: [1, 40]});
		POP.effects = true;
		POP.show('Blur-Stack',
			function (user_response) {
				EDIT.save_state();
				var param1 = parseInt(user_response.param1);

				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.StackBlur(imageData, param1);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var param1 = parseInt(user_response.param1);
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.StackBlur(imageData, param1);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
			}
		);
	};

	this.effects_zoomblur = function () {
		this.load_fx();
		
		POP.add({name: "param1", title: "Strength:", value: "0.3", range: [0, 1], step: 0.01});
		POP.add({name: "param2", title: "Center x:", value: Math.round(WIDTH / 2), range: [0, WIDTH]});
		POP.add({name: "param3", title: "Center y:", value: Math.round(HEIGHT / 2), range: [0, HEIGHT]});
		POP.effects = true;
		POP.show('Blur-Zoom',
			function (user_response) {
				EDIT.save_state();
				var param1 = parseFloat(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var param3 = parseInt(user_response.param3);

				var texture = fx_filter.texture(canvas_active(true));
				fx_filter.draw(texture).zoomBlur(param2, param3, param1).update();	//effect
				canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
				canvas_active().drawImage(fx_filter, 0, 0);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var param1 = parseFloat(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var param3 = parseInt(user_response.param3);

				//recalc param by size
				param2 = param2 / WIDTH * w;
				param3 = param3 / HEIGHT * h;

				var texture = fx_filter.texture(canvas_preview.getImageData(0, 0, w, h));
				fx_filter.draw(texture).zoomBlur(param2, param3, param1).update();	//effect
				canvas_preview.drawImage(fx_filter, 0, 0);

				//draw circle
				canvas_preview.beginPath();
				canvas_preview.strokeStyle = "#ff0000";
				canvas_preview.lineWidth = 1;
				canvas_preview.beginPath();
				canvas_preview.arc(param2, param3, 5, 0, Math.PI * 2, true);
				canvas_preview.stroke();
			}
		);
	};

	this.effects_bulge_pinch = function () {
		this.load_fx();
		
		POP.add({name: "param1", title: "Strength:", value: 1, range: [-1, 1], step: 0.1});
		var default_value = Math.min(WIDTH, HEIGHT);
		default_value = Math.round(default_value / 2);
		POP.add({name: "param2", title: "Radius:", value: default_value, range: [0, 600]});
		POP.effects = true;
		POP.show('Bulge/Pinch',
			function (user_response) {
				EDIT.save_state();
				var param1 = parseFloat(user_response.param1);
				var param2 = parseInt(user_response.param2);

				var texture = fx_filter.texture(canvas_active(true));
				fx_filter.draw(texture).bulgePinch(Math.round(WIDTH / 2), Math.round(HEIGHT / 2), param2, param1).update();	//effect
				canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
				canvas_active().drawImage(fx_filter, 0, 0);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var param1 = parseFloat(user_response.param1);
				var param2 = parseInt(user_response.param2);

				//recalc param by size
				param2 = param2 / Math.min(WIDTH, HEIGHT) * Math.min(w, h);

				var texture = fx_filter.texture(canvas_preview.getImageData(0, 0, w, h));
				fx_filter.draw(texture).bulgePinch(Math.round(w / 2), Math.round(h / 2), param2, param1).update();	//effect
				canvas_preview.drawImage(fx_filter, 0, 0);
			}
		);
	};

	this.effects_colorize = function () {
		var _this = this;
		var colorize_data;

		POP.add({name: "param1", title: "Power:", value: "3", range: [1, 10]});
		POP.add({name: "param2", title: "Limit:", value: "30", range: [10, 200]});
		POP.preview_in_main = true;
		POP.effects = true;
		POP.show('Auto colorize',
			function (user_response) {
				EDIT.save_state();
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);

				_this.colorize(canvas_active(), WIDTH, HEIGHT, param1, param2, colorize_data);
				GUI.zoom();
				canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			},
			function (user_response) {
				POP.preview_in_main = true;
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);

				colorize_data = _this.colorize(false, WIDTH, HEIGHT, param1, param2, true);
				canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
				canvas_front.drawImage(canvas_active(true), 0, 0);
				_this.colorize(canvas_front, WIDTH, HEIGHT, param1, param2, colorize_data);
			}
		);
	};

	this.effects_denoise = function () {
		this.load_fx();
		
		POP.add({name: "param1", title: "Exponent:", value: "20", range: [0, 50]});
		POP.effects = true;
		POP.show('Denoise',
			function (user_response) {
				EDIT.save_state();
				var param1 = parseFloat(user_response.param1);

				var texture = fx_filter.texture(canvas_active(true));
				fx_filter.draw(texture).denoise(param1).update();	//effect
				canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
				canvas_active().drawImage(fx_filter, 0, 0);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var param1 = parseFloat(user_response.param1);

				var texture = fx_filter.texture(canvas_preview.getImageData(0, 0, w, h));
				fx_filter.draw(texture).denoise(param1).update();	//effect
				canvas_preview.drawImage(fx_filter, 0, 0);
			}
		);
	};

	this.effects_Desaturate = function () {
		POP.effects = true;
		POP.show('Desaturate',
			function (user_response) {
				EDIT.save_state();
				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Desaturate(imageData);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Desaturate(imageData);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
			}
		);
	};

	this.effects_Dither = function () {
		POP.add({name: "param1", title: "Levels:", value: "8", range: [2, 32]});
		POP.effects = true;
		POP.show('Dither',
			function (user_response) {
				EDIT.save_state();
				var param1 = parseInt(user_response.param1);

				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Dither(imageData, param1);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var param1 = parseInt(user_response.param1);
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Dither(imageData, param1);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
			}
		);
	};

	this.effects_dot_screen = function () {
		this.load_fx();
		
		POP.add({name: "param2", title: "Size:", value: "3", range: [1, 20]});
		POP.effects = true;
		POP.show('Dot Screen',
			function (user_response) {
				EDIT.save_state();
				var param2 = parseInt(user_response.param2);

				var texture = fx_filter.texture(canvas_active(true));
				fx_filter.draw(texture).dotScreen(Math.round(WIDTH / 2), Math.round(HEIGHT / 2), 0, param2).update();	//effect
				canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
				canvas_active().drawImage(fx_filter, 0, 0);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var param2 = parseInt(user_response.param2);

				var texture = fx_filter.texture(canvas_preview.getImageData(0, 0, w, h));
				fx_filter.draw(texture).dotScreen(Math.round(w / 2), Math.round(h / 2), 0, param2).update();	//effect
				canvas_preview.drawImage(fx_filter, 0, 0);
			}
		);
	};

	this.effects_Edge = function () {
		POP.effects = true;
		POP.show('Edge',
			function (user_response) {
				EDIT.save_state();
				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Edge(imageData);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Edge(imageData);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
			}
		);
	};

	this.effects_Emboss = function () {
		POP.effects = true;
		POP.show('Emboss',
			function (user_response) {
				EDIT.save_state();
				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Emboss(imageData);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Emboss(imageData);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
			}
		);
	};

	this.effects_Enrich = function () {
		POP.effects = true;
		POP.show('Enrich',
			function (user_response) {
				EDIT.save_state();
				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Enrich(imageData);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Enrich(imageData);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
			}
		);
	};

	this.effects_Grains = function () {
		var _this = this;
		POP.effects = true;
		POP.add({name: "param1", title: "Level:", value: "30", range: [0, 50]});
		POP.show('Grains',
			function (user_response) {
				var param1 = parseInt(user_response.param1);
				EDIT.save_state();
				_this.grains_effect(canvas_active(), WIDTH, HEIGHT, param1);
			},
			function (user_response, canvas_preview, w, h) {
				var param1 = parseInt(user_response.param1);
				_this.grains_effect(canvas_preview, w, h, param1);
			}
		);
	};

	this.effects_heatmap = function () {
		var _this = this;
		POP.effects = true;
		POP.show('Heatmap',
			function (user_response) {
				EDIT.save_state();
				_this.heatmap_effect(canvas_active(), WIDTH, HEIGHT);
			},
			function (user_response, canvas_preview, w, h) {
				_this.heatmap_effect(canvas_preview, w, h);
			}
		);
	};

	//ages photo saving it to jpg many times
	this.effects_jpg_vintage = function () {
		POP.add({name: "param1", title: "Quality:", value: 80, range: [1, 100]});
		POP.effects = true;
		POP.show('JPG Compression',
			function (user_response) {
				EDIT.save_state();
				var quality = parseInt(user_response.param1);
				if (quality > 100 || quality < 1 || isNaN(quality) == true)
					quality = 80;
				quality = quality / 100;
				var data = canvas_active(true).toDataURL('image/jpeg', quality);
				var img = new Image;
				img.onload = function () {
					canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
					canvas_active().drawImage(img, 0, 0);
				};
				img.src = data;
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var quality = parseInt(user_response.param1);
				if (quality > 100 || quality < 1 || isNaN(quality) == true)
					quality = 80;
				quality = quality / 100;
				var element = document.getElementById("pop_post");
				var data = element.toDataURL('image/jpeg', quality);
				var img = new Image;
				img.onload = function () {
					canvas_preview.clearRect(0, 0, w, h);
					canvas_preview.drawImage(img, 0, 0);
				};
				img.src = data;
			}
		);
	};

	this.effects_Mosaic = function () {
		POP.add({name: "param1", title: "Size:", value: "10", range: [1, 100]});
		POP.effects = true;
		POP.show('Mosaic',
			function (user_response) {
				EDIT.save_state();
				var param1 = parseInt(user_response.param1);

				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Mosaic(imageData, param1);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var param1 = parseInt(user_response.param1);
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Mosaic(imageData, param1);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
			}
		);
	};

	this.effects_Oil = function () {
		POP.add({name: "param1", title: "Range:", value: "2", range: [1, 5]});
		POP.add({name: "param2", title: "Levels:", value: "32", range: [1, 256]});
		POP.effects = true;
		POP.show('Oil',
			function (user_response) {
				EDIT.save_state();
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);

				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Oil(imageData, param1, param2);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Oil(imageData, param1, param2);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
			}
		);
	};

	this.effects_perspective = function () {
		this.load_fx();
		
		POP.add({name: "param1", title: "X1:", value: WIDTH / 4, range: [0, WIDTH]});
		POP.add({name: "param2", title: "Y1:", value: HEIGHT / 4, range: [0, HEIGHT]});
		POP.add({name: "param3", title: "X2:", value: WIDTH * 3 / 4, range: [0, WIDTH]});
		POP.add({name: "param4", title: "Y2:", value: HEIGHT / 4, range: [0, HEIGHT]});
		POP.add({name: "param5", title: "X3:", value: WIDTH * 3 / 4, range: [0, WIDTH]});
		POP.add({name: "param6", title: "Y3:", value: HEIGHT * 3 / 4, range: [0, HEIGHT]});
		POP.add({name: "param7", title: "X4:", value: WIDTH / 4, range: [0, WIDTH]});
		POP.add({name: "param8", title: "Y4:", value: HEIGHT * 3 / 4, range: [0, HEIGHT]});
		POP.preview_in_main = true;
		POP.effects = true;
		POP.show('Perspective',
			function (user_response) {
				EDIT.save_state();
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var param3 = parseInt(user_response.param3);
				var param4 = parseInt(user_response.param4);
				var param5 = parseInt(user_response.param5);
				var param6 = parseInt(user_response.param6);
				var param7 = parseInt(user_response.param7);
				var param8 = parseInt(user_response.param8);

				var texture = fx_filter.texture(canvas_active(true));
				fx_filter.draw(texture).perspective([WIDTH / 4, HEIGHT / 4, WIDTH * 3 / 4, HEIGHT / 4, WIDTH * 3 / 4, HEIGHT * 3 / 4, WIDTH / 4, HEIGHT * 3 / 4], [param1, param2, param3, param4, param5, param6, param7, param8]).update();	//effect
				canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
				canvas_active().drawImage(fx_filter, 0, 0);
				GUI.zoom();
			},
			function (user_response) {
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var param3 = parseInt(user_response.param3);
				var param4 = parseInt(user_response.param4);
				var param5 = parseInt(user_response.param5);
				var param6 = parseInt(user_response.param6);
				var param7 = parseInt(user_response.param7);
				var param8 = parseInt(user_response.param8);

				canvas_front.rect(0, 0, WIDTH, HEIGHT);
				canvas_front.fillStyle = "#ffffff";
				canvas_front.fill();

				var texture = fx_filter.texture(canvas_active(true));
				fx_filter.draw(texture).perspective([WIDTH / 4, HEIGHT / 4, WIDTH * 3 / 4, HEIGHT / 4, WIDTH * 3 / 4, HEIGHT * 3 / 4, WIDTH / 4, HEIGHT * 3 / 4], [param1, param2, param3, param4, param5, param6, param7, param8]).update();	//effect
				canvas_front.drawImage(fx_filter, 0, 0);

				pers_square(param1, param2);
				pers_square(param3, param4);
				pers_square(param5, param6);
				pers_square(param7, param8);
			}
		);

		function pers_square(x, y) {
			canvas_front.beginPath();
			canvas_front.rect(x - round(EVENTS.sr_size / 2), y - round(EVENTS.sr_size / 2), EVENTS.sr_size, EVENTS.sr_size);
			canvas_front.fillStyle = "#0000c8";
			canvas_front.fill();
		}
	};

	this.effects_Sepia = function () {
		POP.effects = true;
		POP.show('Sepia',
			function (user_response) {
				EDIT.save_state();
				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Sepia(imageData);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
			},
			function (user_response, canvas_preview, w, h) {
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Sepia(imageData);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
			}
		);
	};

	this.effects_Sharpen = function () {
		POP.add({name: "param1", title: "Factor:", value: "3", range: [1, 10], step: 0.1});
		POP.effects = true;
		POP.show('Sharpen',
			function (user_response) {
				EDIT.save_state();
				var param1 = parseFloat(user_response.param1);
				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Sharpen(imageData, param1);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var param1 = parseFloat(user_response.param1);
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Sharpen(imageData, param1);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
			}
		);
	};

	this.effects_Solarize = function () {
		POP.effects = true;
		POP.show('Solarize',
			function (user_response) {
				EDIT.save_state();
				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Solarize(imageData);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
			},
			function (user_response, canvas_preview, w, h) {
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Solarize(imageData);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
			}
		);
	};

	this.effects_tilt_shift = function () {
		this.load_fx();
		
		//extra
		POP.add({name: "param7", title: "Saturation:", value: "3", range: [0, 100]});
		POP.add({name: "param8", title: "Sharpen:", value: "1", range: [1, 10]});
		//main
		POP.add({name: "param1", title: "Blur Radius:", value: "15", range: [0, 50]});
		POP.add({name: "param2", title: "Gradient Radius:", value: "200", range: [0, 400]});
		//startX, startY, endX, endY
		POP.add({name: "param3", title: "X start:", value: "0", range: [0, WIDTH]});
		POP.add({name: "param4", title: "Y start:", value: Math.round(HEIGHT / 2), range: [0, HEIGHT]});
		POP.add({name: "param5", title: "X end:", value: WIDTH, range: [0, WIDTH]});
		POP.add({name: "param6", title: "Y end:", value: Math.round(HEIGHT / 2), range: [0, HEIGHT]});
		POP.effects = true;
		POP.show('Tilt Shift',
			function (user_response) {
				EDIT.save_state();
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var param3 = parseInt(user_response.param3);
				var param4 = parseInt(user_response.param4);
				var param5 = parseInt(user_response.param5);
				var param6 = parseInt(user_response.param6);
				var param7 = parseInt(user_response.param7);
				var param8 = parseInt(user_response.param8);

				//main effect
				var texture = fx_filter.texture(canvas_active(true));
				fx_filter.draw(texture).tiltShift(param3, param4, param5, param6, param1, param2).update();	//effect
				canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
				canvas_active().drawImage(fx_filter, 0, 0);

				//saturation
				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.HSLAdjustment(imageData, 0, param7, 0);
				canvas_active().putImageData(filtered, 0, 0);

				//sharpen
				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Sharpen(imageData, param8);
				canvas_active().putImageData(filtered, 0, 0);

				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var param3 = parseInt(user_response.param3);
				var param4 = parseInt(user_response.param4);
				var param5 = parseInt(user_response.param5);
				var param6 = parseInt(user_response.param6);
				var param7 = parseInt(user_response.param7);
				var param8 = parseInt(user_response.param8);

				//recalc param by size
				var param3 = param3 / WIDTH * w;
				var param4 = param4 / HEIGHT * h;
				var param5 = param5 / WIDTH * w;
				var param6 = param6 / HEIGHT * h;

				//main effect
				var texture = fx_filter.texture(canvas_preview.getImageData(0, 0, w, h));
				fx_filter.draw(texture).tiltShift(param3, param4, param5, param6, param1, param2).update();	//effect
				canvas_preview.drawImage(fx_filter, 0, 0);

				//saturation
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.HSLAdjustment(imageData, 0, param7, 0);
				canvas_preview.putImageData(filtered, 0, 0);

				//sharpen
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Sharpen(imageData, param8);
				canvas_preview.putImageData(filtered, 0, 0);

				//draw line
				canvas_preview.beginPath();
				canvas_preview.strokeStyle = "#ff0000";
				canvas_preview.lineWidth = 1;
				canvas_preview.moveTo(param3 + 0.5, param4 + 0.5);
				canvas_preview.lineTo(param5 + 0.5, param6 + 0.5);
				canvas_preview.stroke();
			}
		);
	};

	this.effects_vignette = function () {
		this.load_fx();
		
		POP.add({name: "param1", title: "Size:", value: "0.5", range: [0, 1], step: 0.01});
		POP.add({name: "param2", title: "Amount:", value: "0.5", range: [0, 1], step: 0.01});
		POP.effects = true;
		POP.show('Vignette',
			function (user_response) {
				EDIT.save_state();
				var param1 = parseFloat(user_response.param1);
				var param2 = parseFloat(user_response.param2);

				var texture = fx_filter.texture(canvas_active(true));
				fx_filter.draw(texture).vignette(param1, param2).update();	//effect
				canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
				canvas_active().drawImage(fx_filter, 0, 0);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var param1 = parseFloat(user_response.param1);
				var param2 = parseFloat(user_response.param2);

				var texture = fx_filter.texture(canvas_preview.getImageData(0, 0, w, h));
				fx_filter.draw(texture).vignette(param1, param2).update();	//effect
				canvas_preview.drawImage(fx_filter, 0, 0);
			}
		);
	};
	this.effects_vibrance = function () {
		this.load_fx();
		
		POP.add({name: "level", title: "Level:", value: "0.5", range: [-1, 1], step: 0.01});
		POP.effects = true;
		POP.show('Vignette',
			function (user_response) {
				EDIT.save_state();
				var level = parseFloat(user_response.level);

				var texture = fx_filter.texture(canvas_active(true));
				fx_filter.draw(texture).vibrance(level).update();	//effect
				canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
				canvas_active().drawImage(fx_filter, 0, 0);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var level = parseFloat(user_response.level);

				var texture = fx_filter.texture(canvas_preview.getImageData(0, 0, w, h));
				fx_filter.draw(texture).vibrance(level).update();	//effect
				canvas_preview.drawImage(fx_filter, 0, 0);
			}
		);
	};

	this.effects_vintage = function () {
		POP.add({name: "red_offset", title: "Color adjust:", value: "70", range: [0, 200]});
		POP.add({name: "contrast", title: "Contrast:", value: "15", range: [0, 50]});
		POP.add({name: "blur", title: "Blur:", value: "0", range: [0, 2], step: 0.1});
		POP.add({name: "light_leak", title: "Light leak:", value: "90", range: [0, 150]});
		POP.add({name: "de_saturation", title: "Desaturation:", value: "40", range: [0, 100]});
		POP.add({name: "exposure", title: "Exposure level:", value: "80", range: [0, 150]});
		POP.add({name: "grains", title: "Grains level:", value: "20", range: [0, 50]});
		POP.add({name: "big_grains", title: "Big grains level:", value: "20", range: [0, 50]});
		POP.add({name: "vignette1", title: "Vignette size:", value: "0.3", range: [0, 0.5], step: 0.01});
		POP.add({name: "vignette2", title: "Vignette amount:", value: "0.5", range: [0, 0.7], step: 0.01});
		POP.add({name: "dust_level", title: "Dusts level:", value: "70", range: [0, 100]});
		POP.effects = true;
		POP.show('Vintage',
			function (user_response) {
				EDIT.save_state();
				var red_offset = parseInt(user_response.red_offset);
				var contrast = parseInt(user_response.contrast);
				var blur = parseFloat(user_response.blur);
				var light_leak = parseInt(user_response.light_leak);
				var de_saturation = parseInt(user_response.de_saturation);
				var exposure = parseInt(user_response.exposure);
				var grains = parseInt(user_response.grains);
				var big_grains = parseInt(user_response.big_grains);
				var vignette1 = parseFloat(user_response.vignette1);
				var vignette2 = parseFloat(user_response.vignette2);
				var dust_level = parseInt(user_response.dust_level);

				VINTAGE.adjust_color(canvas_active(), WIDTH, HEIGHT, red_offset);
				VINTAGE.lower_contrast(canvas_active(), WIDTH, HEIGHT, contrast);
				VINTAGE.blur(canvas_active(), WIDTH, HEIGHT, blur);
				VINTAGE.light_leak(canvas_active(), WIDTH, HEIGHT, light_leak);
				VINTAGE.chemicals(canvas_active(), WIDTH, HEIGHT, de_saturation);
				VINTAGE.exposure(canvas_active(), WIDTH, HEIGHT, exposure);
				VINTAGE.grains(canvas_active(), WIDTH, HEIGHT, grains);
				VINTAGE.grains_big(canvas_active(), WIDTH, HEIGHT, big_grains);
				VINTAGE.optics(canvas_active(), WIDTH, HEIGHT, vignette1, vignette2);
				VINTAGE.dusts(canvas_active(), WIDTH, HEIGHT, dust_level);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var red_offset = parseInt(user_response.red_offset);
				var contrast = parseInt(user_response.contrast);
				var blur = parseFloat(user_response.blur);
				var light_leak = parseInt(user_response.light_leak);
				var de_saturation = parseInt(user_response.de_saturation);
				var exposure = parseInt(user_response.exposure);
				var grains = parseInt(user_response.grains);
				var big_grains = parseInt(user_response.big_grains);
				var vignette1 = parseFloat(user_response.vignette1);
				var vignette2 = parseFloat(user_response.vignette2);
				var dust_level = parseInt(user_response.dust_level);

				VINTAGE.adjust_color(canvas_preview, w, h, red_offset);
				VINTAGE.lower_contrast(canvas_preview, w, h, contrast);
				VINTAGE.blur(canvas_preview, w, h, blur);
				VINTAGE.light_leak(canvas_preview, w, h, light_leak);
				VINTAGE.chemicals(canvas_preview, w, h, de_saturation);
				VINTAGE.exposure(canvas_preview, w, h, exposure);
				VINTAGE.grains(canvas_preview, w, h, grains);
				VINTAGE.grains_big(canvas_preview, w, h, big_grains);
				VINTAGE.optics(canvas_preview, w, h, vignette1, vignette2);
				VINTAGE.dusts(canvas_preview, w, h, dust_level);
			}
		);
	};

	this.effect_bw = function (context, W, H, level, dithering) {
		var img = context.getImageData(0, 0, W, H);
		var imgData = img.data;
		var grey, c, quant_error, m;
		if (dithering !== true) {
			//no differing
			for (var i = 0; i < imgData.length; i += 4) {
				if (imgData[i + 3] == 0)
					continue;	//transparent
				grey = Math.round(0.2126 * imgData[i] + 0.7152 * imgData[i + 1] + 0.0722 * imgData[i + 2]);
				if (grey <= level)
					c = 0;
				else
					c = 255;
				imgData[i] = c;
				imgData[i + 1] = c;
				imgData[i + 2] = c;
			}
		}
		else {
			//Floyd–Steinberg dithering
			canvas_front.clearRect(0, 0, W, H); //temp canvas for storing pixel data shifts
			var img2 = canvas_front.getImageData(0, 0, W, H);
			var imgData2 = img2.data;
			for (var j = 0; j < H; j++) {
				for (var i = 0; i < W; i++) {
					var k = ((j * (W * 4)) + (i * 4));
					if (imgData[k + 3] == 0)
						continue;	//transparent

					grey = Math.round(0.2126 * imgData[k] + 0.7152 * imgData[k + 1] + 0.0722 * imgData[k + 2]);
					grey = grey + imgData2[k]; //add data shft from previous iterations
					c = Math.floor(grey / 256);
					if (c == 1)
						c = 255;
					imgData[k] = c;
					imgData[k + 1] = c;
					imgData[k + 2] = c;
					quant_error = grey - c;
					if (i + 1 < W) {
						m = k + 4;
						imgData2[m] += Math.round(quant_error * 7 / 16);
					}
					if (i - 1 > 0 && j + 1 < H) {
						m = k - 4 + W * 4;
						imgData2[m] += Math.round(quant_error * 3 / 16);
					}
					if (j + 1 < H) {
						m = k + W * 4;
						imgData2[m] += Math.round(quant_error * 5 / 16);
					}
					if (i + 1 < W && j + 1 < H) {
						m = k + 4 + W * 4;
						imgData2[m] += Math.round(quant_error * 1 / 16);
					}
				}
			}
		}
		context.putImageData(img, 0, 0);
	};

	//converts greyscale images to colored
	this.colorize = function (context, W, H, rand_power, max_gap, manual_colors) {
		if (manual_colors == undefined || manual_colors === true) {
			var colors = [];
			for (var x = 0; x < 3; x++) {
				colors[x] = [];
				var pre = HELPER.getRandomInt(-1 * rand_power, rand_power);
				for (var i = 0; i <= 255; i++) {
					colors[x][i] = HELPER.getRandomInt(pre - rand_power, pre + rand_power);

					if (colors[x][i] < -1 * max_gap)
						colors[x][i] += 10;
					else if (colors[x][i] > max_gap)
						colors[x][i] -= 10;

					pre = colors[x][i];
				}
			}
			if (manual_colors === true)
				return colors;
		}
		else {
			var colors = manual_colors;
		}

		var img = context.getImageData(0, 0, W, H);

		//colorize
		var imgData = img.data;
		for (var i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent
			for (var c = 0; c < 3; c++) {
				var x = i + c;
				imgData[x] += colors[c][imgData[x]];
				if (imgData[x] > 255)
					imgData[x] = 255;
				if (imgData[x] < 0)
					imgData[x] = 0;
			}
		}
		context.putImageData(img, 0, 0);
		return false;
	};
	
	this.heatmap_effect = function (context, W, H) {
		var img = context.getImageData(0, 0, W, H);
		var imgData = img.data;
		var grey, RGB;
		for (var i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent
			grey = Math.round(0.2126 * imgData[i] + 0.7152 * imgData[i + 1] + 0.0722 * imgData[i + 2]);
			RGB = this.color2heat(grey);
			imgData[i] = RGB.R;
			imgData[i + 1] = RGB.G;
			imgData[i + 2] = RGB.B;
		}
		context.putImageData(img, 0, 0);
	};
	
	this.color2heat = function (value) {
		var RGB = {R: 0, G: 0, B: 0};
		value = value / 255;
		if (0 <= value && value <= 1 / 8) {
			RGB.R = 0;
			RGB.G = 0;
			RGB.B = 4 * value + .5; // .5 - 1 // b = 1/2
		}
		else if (1 / 8 < value && value <= 3 / 8) {
			RGB.R = 0;
			RGB.G = 4 * value - .5; // 0 - 1 // b = - 1/2
			RGB.B = 1; // small fix
		}
		else if (3 / 8 < value && value <= 5 / 8) {
			RGB.R = 4 * value - 1.5; // 0 - 1 // b = - 3/2
			RGB.G = 1;
			RGB.B = -4 * value + 2.5; // 1 - 0 // b = 5/2
		}
		else if (5 / 8 < value && value <= 7 / 8) {
			RGB.R = 1;
			RGB.G = -4 * value + 3.5; // 1 - 0 // b = 7/2
			RGB.B = 0;
		}
		else if (7 / 8 < value && value <= 1) {
			RGB.R = -4 * value + 4.5; // 1 - .5 // b = 9/2
			RGB.G = 0;
			RGB.B = 0;
		}
		else { 
			// should never happen - value > 1
			RGB.R = .5;
			RGB.G = 0;
			RGB.B = 0;
		}
		// scale for hex conversion
		RGB.R *= 255;
		RGB.G *= 255;
		RGB.B *= 255;

		RGB.R = Math.round(RGB.R);
		RGB.G = Math.round(RGB.G);
		RGB.B = Math.round(RGB.B);

		return RGB;
	};
	
	//method = otsu
	this.thresholding = function (method, ctx, W, H, only_level) {
		var img = ctx.getImageData(0, 0, W, H);
		var imgData = img.data;
		var hist_data = [];
		var grey;
		for (var i = 0; i <= 255; i++)
			hist_data[i] = 0;
		for (var i = 0; i < imgData.length; i += 4) {
			grey = Math.round(0.2126 * imgData[i] + 0.7152 * imgData[i + 1] + 0.0722 * imgData[i + 2]);
			hist_data[grey]++;
		}
		var level;
		if (method == 'otsu')
			level = this.otsu(hist_data, W * H);
		else
			alert('ERROR: unknown method in EFFECTS.thresholding().');
		if (only_level === true)
			return level;
		var c;
		for (var i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent
			grey = Math.round(0.2126 * imgData[i] + 0.7152 * imgData[i + 1] + 0.0722 * imgData[i + 2]);
			if (grey < level)
				c = 0;
			else
				c = 255;
			imgData[i] = c;
			imgData[i + 1] = c;
			imgData[i + 2] = c;
		}
		ctx.putImageData(img, 0, 0);
	};
	
	//http://en.wikipedia.org/wiki/Otsu%27s_Method
	this.otsu = function (histogram, total) {
		var sum = 0;
		for (var i = 1; i < 256; ++i)
			sum += i * histogram[i];
		var mB, mF, between;
		var sumB = 0;
		var wB = 0;
		var wF = 0;
		var max = 0;
		var threshold = 0;
		for (var i = 0; i < 256; ++i) {
			wB += histogram[i];
			if (wB == 0)
				continue;
			wF = total - wB;
			if (wF == 0)
				break;
			sumB += i * histogram[i];
			mB = sumB / wB;
			mF = (sum - sumB) / wF;
			between = wB * wF * Math.pow(mB - mF, 2);
			if (between > max) {
				max = between;
				threshold = i;
			}
		}
		return threshold;
	};
	
	this.grains_effect = function (context, W, H, level) {
		if (level == 0)
			return context;
		var img = context.getImageData(0, 0, W, H);
		var imgData = img.data;
		for (var j = 0; j < H; j++) {
			for (var i = 0; i < W; i++) {
				var x = (i + j * W) * 4;
				if (imgData[x + 3] == 0)
					continue;	//transparent
				//increase it's lightness
				var delta = HELPER.getRandomInt(0, level);
				if (delta == 0)
					continue;

				if (imgData[x] - delta < 0)
					imgData[x] = -(imgData[x] - delta);
				else
					imgData[x] = imgData[x] - delta;
				if (imgData[x + 1] - delta < 0)
					imgData[x + 1] = -(imgData[x + 1] - delta);
				else
					imgData[x + 1] = imgData[x + 1] - delta;
				if (imgData[x + 2] - delta < 0)
					imgData[x + 2] = -(imgData[x + 2] - delta);
				else
					imgData[x + 2] = imgData[x + 2] - delta;
			}
		}
		context.putImageData(img, 0, 0);
	};
}