import config from "../../config";
import Base_layers_class from './../../core/base-layers.js';
import File_save_class from './../file/save.js';
import Helper_class from './../../libs/helpers.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

var instance = null;

class Copy_class {

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
		this.File_save = new File_save_class();

		//events
		document.addEventListener('keydown', (event) => {
			var code = event.key.toLowerCase();
			var ctrlDown = event.ctrlKey || event.metaKey;
			if (this.Helper.is_input(event.target))
				return;

			if (code == "c" && ctrlDown == true) {
				//copy to clipboard
				this.copy_to_clipboard();
			}
		}, false);
	}

	async copy_to_clipboard(){
		var _this = this;

		const canWriteToClipboard = await this.askWritePermission();
		if (canWriteToClipboard) {

			//get data - current layer
			var canvas = this.Base_layers.convert_layer_to_canvas();
			var ctx = canvas.getContext("2d");

			if (config.TRANSPARENCY == false) {
				//add white background
				ctx.globalCompositeOperation = 'destination-over';
				this.File_save.fillCanvasBackground(ctx, '#ffffff');
				ctx.globalCompositeOperation = 'source-over';
			}

			//save using lib
			canvas.toBlob(function (blob) {
				_this.setToClipboard(blob);
			});
		}
		else{
			alertify.error('Missing permissions to write to Clipboard.cc');
		}
	}

	async setToClipboard(blob) {
		const data = [new ClipboardItem({ [blob.type]: blob })];
		await navigator.clipboard.write(data);
	}

	async askWritePermission() {
		try {
			// The clipboard-write permission is granted automatically to pages
			// when they are the active tab. So it's not required, but it's more safe.
			const { state } = await navigator.permissions.query({ name: 'clipboard-write' })
			return state === 'granted';
		}
		catch (error) {
			// Browser compatibility / Security error (ONLY HTTPS) ...
			return false;
		}
	}
}

export default Copy_class;
