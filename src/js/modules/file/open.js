import app from './../../app.js';
import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Base_gui_class from './../../core/base-gui.js';
import Dialog_class from './../../libs/popup.js';
import Helper_class from './../../libs/helpers.js';
import Clipboard_class from './../../libs/clipboard.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';
import EXIF from './../../../../node_modules/exif-js/exif.js';
import GUI_tools_class from "../../core/gui/gui-tools";

var instance = null;

/** 
 * manages files / open
 * 
 * @author ViliusL
 */
class File_open_class {

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		var _this = this;
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Base_gui = new Base_gui_class();
		this.Helper = new Helper_class();
		this.GUI_tools = new GUI_tools_class();

		//clipboard class
		this.Clipboard_class = new Clipboard_class(function (data, w, h) {
			_this.on_paste(data, w, h);
		});

		this.events();

		this.maybe_file_open_url_handler();
	}

	events() {
		var _this = this;

		window.ondrop = function (e) {
			//drop
			e.preventDefault();
			_this.open_handler(e);
		};
		window.ondragover = function (e) {
			e.preventDefault();
		};
		document.addEventListener('keydown', (event) => {
			var code = event.key.toLowerCase();
			if (this.Helper.is_input(event.target))
				return;

			if (code == "o") {
				//open
				this.open_file();
				event.preventDefault();
			}
		}, false);
	}

	on_paste(data, width, height) {
		var new_layer = {
			name: 'Paste',
			type: 'image',
			data: data,
		};
		app.State.do_action(
			new app.Actions.Insert_layer_action(new_layer)
		);
	}

	open_file() {
		var _this = this;

		alertify.success('You can also drag and drop items into browser.');

		document.getElementById("tmp").innerHTML = '';
		var a = document.createElement('input');
		a.setAttribute("id", "file_open");
		a.type = 'file';
		a.multiple = 'multiple';
		document.getElementById("tmp").appendChild(a);
		document.getElementById('file_open').addEventListener('change', function (e) {
			_this.open_handler(e);
		}, false);

		//force click
		document.querySelector('#file_open').click();
	}
	
	open_webcam(){
		var _this = this;
		var video = document.createElement('video');
		video.autoplay = true;
		video.style.maxWidth = '100%';
		var track = null;
		
		function handleSuccess(stream) {	
			track = stream.getTracks()[0];
			video.srcObject = stream;	
		}

		function handleError(error) {
			alertify.error('Sorry, cold not load getUserMedia() data: ' + error);
		}
		
		var settings = {
			title: 'Webcam',
			params: [
				{title: "Stream:", html: '<div id="webcam_container"></div>'},
			],
			on_load: function(params){
				document.getElementById('webcam_container').appendChild(video);
			},
			on_finish: function(params){
				//capture data
				var width = video.videoWidth;
				var height = video.videoHeight;
				
				var tmpCanvas = document.createElement('canvas');
				var tmpCanvasCtx = tmpCanvas.getContext("2d");
				tmpCanvas.width = width;
				tmpCanvas.height = height;
				tmpCanvasCtx.drawImage(video, 0, 0);
				
				//create requested layer
				var new_layer = {
					name: "Webcam #" + _this.Base_layers.auto_increment,
					type: 'image',
					data: tmpCanvas.toDataURL("image/png"),
					width: width,
					height: height,
					width_original: width,
					height_original: height,
				};
				app.State.do_action(
					new app.Actions.Bundle_action('open_file_webcam', 'Open File Webcam', [
						new app.Actions.Insert_layer_action(new_layer),
						new app.Actions.Autoresize_canvas_action(width, height, null, true, true)
					])
				);
				
				//destroy
				if(track != null){
					track.stop();
				}
				video.pause();
				video.src = "";
				video.load();
			},
			on_cancel: function(params){
				if(track != null){
					track.stop();
				}
				video.pause();
				video.src = "";
				video.load();
			},
		};
		this.POP.show(settings);
		
		navigator.mediaDevices.getUserMedia({audio: false, video: true})
			.then(handleSuccess)
			.catch(handleError);
	}

	open_dir() {
		var _this = this;

		document.getElementById("tmp").innerHTML = '';
		var a = document.createElement('input');
		a.setAttribute("id", "file_open_dir");
		a.type = 'file';
		a.webkitdirectory = 'webkitdirectory';
		document.getElementById("tmp").appendChild(a);
		document.getElementById('file_open_dir').addEventListener('change', function (e) {
			_this.open_handler(e);
		}, false);

		//force click
		document.querySelector('#file_open_dir').click();
	}

	/**
	 * opens data URLs, like: "data:image/png;base64,xxxxxx"
	 * 
	 * data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAG0lEQVQYV2N89+7df0FBQQbG/////3///j0DAF9wCsg9spQfAAAAAElFTkSuQmCC
	 */
	open_data_url() {
		var _this = this;

		var settings = {
			title: 'Open data URL',
			params: [
				{name: "data", title: "Data URL:", type: "textarea", value: ""},
			],
			on_finish: function (params) {
				_this.file_open_data_url_handler(params.data);
			},
		};
		this.POP.show(settings);
	}

	file_open_data_url_handler(data) {
		var _this = this;
		if (data == '')
			return;

		var img = new Image();
		img.crossOrigin = "Anonymous";
		img.onload = function () {
			var new_layer = {
				name: "Data URL",
				type: 'image',
				link: img,
				width: img.width,
				height: img.height,
				width_original: img.width,
				height_original: img.height,
			};
			app.State.do_action(
				new app.Actions.Bundle_action('open_file_data_url', 'Open File Data URL', [
					new app.Actions.Insert_layer_action(new_layer),
					new app.Actions.Autoresize_canvas_action(img.width, img.height, null, true, true)
				])
			);
			img.onload = function () {
				config.need_render = true;
			};
		};
		img.onerror = function (ex) {
			alertify.error('Sorry, image could not be loaded. Try copy image and paste it.');
		};
		img.src = data;
	}

	open_url() {
		var _this = this;

		var settings = {
			title: 'Open URL',
			params: [
				{name: "url", title: "URL:", value: ""},
			],
			on_finish: function (params) {
				_this.file_open_url_handler(params);
			},
		};
		this.POP.show(settings);
	}

	open_handler(e) {
		var _this = this;
		var files = e.target.files;

		var auto_increment = this.Base_layers.auto_increment;

		if (files == undefined) {
			//drag and drop
			files = e.dataTransfer.files;
		}

		//sort
		var orders = [];
		for (var i = 0, f; i < files.length; i++) {
			orders.push(files[i].name);
		}
		orders.sort();
		var order_map = [];
		for (var i in orders) {
			order_map[orders[i]] = parseInt(i);
		}

		for (var i = 0, f; i < files.length; i++) {
			f = files[i];
			if (!f.type.match('image.*') && !f.name.match('.json')) {
				alertify.error('Wrong file type, must be image or json.');
				continue;
			}
			if (files.length == 1)
				this.SAVE_NAME = f.name.split('.')[f.name.split('.').length - 2];

			var FR = new FileReader();
			FR.file = files[i];

			FR.onload = function (event) {
				if (this.file.type.match('image.*')) {
					var order = auto_increment + order_map[this.file.name];
					//image
					var new_layer = {
						name: this.file.name,
						type: 'image',
						data: event.target.result,
						order: order,
						_exif: _this.extract_exif(this.file)
					};
					app.State.do_action(
						new app.Actions.Bundle_action('open_image', 'Open Image', [
							new app.Actions.Insert_layer_action(new_layer)
						])
					);
				}
				else {
					//json
					var response = _this.load_json(event.target.result);
					if (response === true) {
						return false;
					}
				}
			};
			if (f.type == "text/plain")
				FR.readAsText(f);
			else if (f.name.match('.json'))
				FR.readAsText(f);
			else
				FR.readAsDataURL(f);
		}
	}
	
	open_template_test(){
		var _this = this;

		this.Base_layers.debug_rendering = true;
		
		window.fetch("images/test-collection.json").then(function(response) {
			return response.json();
		}).then(function(json) {
			_this.load_json(json, false);
		}).catch(function(ex) {
			alertify.error('Sorry, image could not be loaded.');
		});
	}

	/**
	 * check if url has url params, for example: https://viliusle.github.io/miniPaint/?image=http://i.imgur.com/ATda8Ae.jpg
	 */
	maybe_file_open_url_handler() {
		var _this = this;
		var url_params = this.Helper.get_url_parameters();
		
		if (url_params.image != undefined) {
			//found params - try to load it
			if(url_params.image.toLowerCase().indexOf('.json') == url_params.image.length - 5){
				//load json
				window.fetch(url_params.image).then(function(response) {
					return response.json();
				}).then(function(json) {
					_this.load_json(json, false);
				}).catch(function(ex) {
					alertify.error('Sorry, image could not be loaded.');
				});
			}
			else{
				//load image
				var data = {
					url: url_params.image,
				};
				this.file_open_url_handler(data);
			}
		}
	}

	//handler for open url. Example url: http://i.imgur.com/ATda8Ae.jpg
	file_open_url_handler(user_response) {
		var _this = this;
		var url = user_response.url;
		if (url == '')
			return;

		var layer_name = url.replace(/^.*[\\\/]/, '');

		console.log
		var img = new Image();
		img.crossOrigin = "Anonymous";
		img.onload = function () {
			var new_layer = {
				name: layer_name,
				type: 'image',
				link: img,
				width: img.width,
				height: img.height,
				width_original: img.width,
				height_original: img.height,
			};
			img.onload = function () {
				config.need_render = true;
			};
			app.State.do_action(
				new app.Actions.Bundle_action('open_file_url', 'Open File URL', [
					new app.Actions.Insert_layer_action(new_layer),
					new app.Actions.Autoresize_canvas_action(img.width, img.height, null, true, true)
				])
			);
		};
		img.onerror = function (ex) {
			alertify.error('Sorry, image could not be loaded. Try copy image and paste it.');
		};
		img.src = url;
	}

	async load_json(data) {
		var json;
		if(typeof data == 'string')
			json = JSON.parse(data);
		else
			json = data;
		if (json.info.version == undefined) {
			json.info.version = "3";
		}

		//migration
		if (json.info.version < "4") {
			//convert from v3 to v4
			for (var i in json.layers) {
				//layers data
				json.layers[i].id = (parseInt(i) + 1);
				json.layers[i].opacity = json.layers[i].opacity * 100 || 100;
				json.layers[i].type = "image";
				json.layers[i].width = json.info.width;
				json.layers[i].height = json.info.height;
				json.layers[i].visible = (json.layers[i].visible == true); //convert to boolean
				delete json.layers[i].title;
			}
			json.data = [];
			for (var i in json.image_data) {
				//image data
				var new_id = null;
				for (var j in json.layers) {
					if (json.layers[j].name == json.image_data[i].name) {
						new_id = json.layers[j].id;
					}
				}
				if (new_id == null)
					continue;
				json.data.push(
					{
						id: new_id,
						data: json.image_data[i].data,
					}
				);
			}
		}
		if(json.info.version < "4.5.0"){
			//migrate "rectangle", "circle" and "line" types to "shape"
			for (var i in json.layers) {
				var old_type = json.layers[i].type;

				if(old_type == 'line' && json.layers[i].params.type.value == "Arrow"){
					//migrate line (type=arrow) to arrow.
					json.layers[i].type = 'arrow';
					delete json.layers[i].params.type;
					json.layers[i].render_function = ["arrow", "render"];
				}
				if(old_type == 'rectangle' || old_type == 'circle'){
					//migrate params
					json.layers[i].params.border_size = json.layers[i].params.size;
					delete json.layers[i].params.size;

					if(json.layers[i].params.fill == true){
						json.layers[i].params.border = false;
					}
					else{
						json.layers[i].params.border = true;
					}
					json.layers[i].params.border_color = json.layers[i].color;
					json.layers[i].params.fill_color = json.layers[i].color;

					json.layers[i].color = null;
				}
				if(old_type == 'circle'){
					//rename circle to ellipse
					json.layers[i].type = 'ellipse';
					json.layers[i].render_function = ["ellipse", "render"];
				}
			}
		}

		const actions = [];

		//set attributes
		actions.push(
			new app.Actions.Prepare_canvas_action('undo'),
			new app.Actions.Update_config_action({
				ZOOM: 1,
				WIDTH: parseInt(json.info.width),
				HEIGHT: parseInt(json.info.height)
			}),
			new app.Actions.Reset_layers_action(),
			new app.Actions.Prepare_canvas_action('do'),
		);

		var max_id_order = 0;
		for (var i in json.layers) {
			var value = json.layers[i];

			if(value.id > max_id_order)
				max_id_order = value.id;
			if(typeof value.order != undefined && value.order > max_id_order)
				max_id_order = value.order;

			if (value.type == 'image') {
				//add image data
				value.link = null;
				for (var j in json.data) {
					if (json.data[j].id == value.id) {
						value.data = json.data[j].data;
					}
				}
			}
			actions.push(
				new app.Actions.Insert_layer_action(value, false)
			);
		}
		if (json.info.layer_active != undefined) {
			actions.push(
				new app.Actions.Select_layer_action(json.info.layer_active, true)
			);
		}
		actions.push(
			new app.Actions.Set_object_property_action(this.Base_layers, 'auto_increment', max_id_order + 1)
		);
		await app.State.do_action(
			new app.Actions.Bundle_action('open_json_file', 'Open JSON File', actions)
		);
	}

	/**
	 * Returns an action that saves the exif data of the provided object to the current layer
	 */
	extract_exif(object) {
		var exif_data = {
			general: [],
			exif: [],
		};

		//exif data
		EXIF.getData(object, function () {
			exif_data.exif = this.exifdata;
			delete this.exifdata.thumbnail;
		});

		//general
		if (object.name != undefined)
			exif_data.general.Name = object.name;
		if (object.size != undefined)
			exif_data.general.Size = this.Helper.number_format(object.size / 1000, 2) + ' KB';
		if (object.type != undefined)
			exif_data.general.Type = object.type;
		if (object.lastModified != undefined)
			exif_data.general['Last modified'] = this.Helper.format_time(object.lastModified);

		return exif_data;
	}

	search(){
		this.GUI_tools.activate_tool('media');
	}
}

export default File_open_class;

