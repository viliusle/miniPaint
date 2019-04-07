import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Base_gui_class from './../../core/base-gui.js';
import Dialog_class from './../../libs/popup.js';
import Helper_class from './../../libs/helpers.js';
import Clipboard_class from './../../libs/clipboard.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';
import EXIF from './../../../../node_modules/exif-js/exif.js';

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
	}

	on_paste(data, width, height) {
		var new_layer = {
			name: 'Paste',
			type: 'image',
			data: data,
		};
		this.Base_layers.insert(new_layer);
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
				this.Base_layers.insert(new_layer);
				_this.Base_layers.autoresize(width, height);
				
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
				window.State.save();
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
			_this.Base_layers.insert(new_layer);
			_this.Base_layers.autoresize(img.width, img.height);
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
				window.State.save();
				_this.file_open_url_handler(params);
			},
		};
		this.POP.show(settings);
	}

	open_handler(e) {
		var _this = this;
		var files = e.target.files;

		window.State.save();
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
					};
					_this.Base_layers.insert(new_layer);
					_this.extract_exif(this.file);
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
			_this.Base_layers.insert(new_layer);
			_this.Base_layers.autoresize(img.width, img.height);
		};
		img.onerror = function (ex) {
			alertify.error('Sorry, image could not be loaded. Try copy image and paste it.');
		};
		img.src = url;
	}

	load_json(data) {
		var json;
		if(typeof data == 'string')
			json = JSON.parse(data);
		else
			json = data;
		if (json.info.version == undefined) {
			json.info.version = "3";
		}
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

		//set attributes
		config.ZOOM = 1;
		config.WIDTH = parseInt(json.info.width);
		config.HEIGHT = parseInt(json.info.height);
		this.Base_layers.reset_layers();
		this.Base_gui.prepare_canvas();

		for (var i in json.layers) {
			var value = json.layers[i];

			if (value.type == 'image') {
				//add image data
				value.link = null;
				for (var j in json.data) {
					if (json.data[j].id == value.id) {
						value.data = json.data[j].data;
					}
				}
			}

			this.Base_layers.insert(value, false);
		}
		if(json.info.layer_active != undefined) {
			this.Base_layers.select(json.info.layer_active);
		}
	}

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

		//save
		config.layer._exif = exif_data;
	}
}

export default File_open_class;

