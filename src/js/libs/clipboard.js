/**
 * image pasting into canvas
 * 
 * @param {string} canvas_id - canvas id
 * @param {boolean} autoresize - if canvas will be resized
 */
class Clipboard_class {

	constructor(on_paste) {
		var _self = this;

		this.on_paste = on_paste;
		this.ctrl_pressed = false;
		this.command_pressed = false;
		this.pasteCatcher;
		this.paste_mode;

		//handlers
		document.addEventListener('keydown', function (e) {
			_self.on_keyboard_action(e);
		}, false); //firefox fix
		document.addEventListener('keyup', function (e) {
			_self.on_keyboardup_action(e);
		}, false); //firefox fix
		document.addEventListener('paste', function (e) {
			_self.paste_auto(e);
		}, false); //official paste handler

		this.init();
	}

	//constructor - prepare
	init() {
		var _self = this;

		//if using auto
		if (window.Clipboard)
			return true;

		this.pasteCatcher = document.createElement("div");
		this.pasteCatcher.setAttribute("id", "paste_ff");
		this.pasteCatcher.setAttribute("contenteditable", "");
		this.pasteCatcher.style.cssText = 'opacity:0;position:fixed;top:0px;left:0px;';
		this.pasteCatcher.style.marginLeft = "-20px";
		this.pasteCatcher.style.width = "10px";
		document.body.appendChild(this.pasteCatcher);

		// create an observer instance
		var observer = new MutationObserver(function (mutations) {
			mutations.forEach(function (mutation) {
				if (this.paste_mode == 'auto' || this.ctrl_pressed == false || mutation.type != 'childList')
					return true;

				//if paste handle failed - capture pasted object manually
				if (mutation.addedNodes.length == 1) {
					if (mutation.addedNodes[0].src != undefined) {
						//image
						_self.paste_createImage(mutation.addedNodes[0].src);
					}
					//register cleanup after some time.
					setTimeout(function () {
						this.pasteCatcher.innerHTML = '';
					}, 20);
				}
			});
		});
		var target = document.getElementById('paste_ff');
		var config = {attributes: true, childList: true, characterData: true};
		observer.observe(target, config);
	}
	;
		//default paste action
		paste_auto(e) {
		if (e.target.type == 'text')
			return;
		if (e.target.tagName.toUpperCase() == 'INPUT')
			return;
		if (e.target.tagName.toUpperCase() == 'TEXTAREA')
			return;

		this.paste_mode = '';
		if (!window.Clipboard) {
			this.pasteCatcher.innerHTML = '';
		}
		if (e.clipboardData) {
			var items = e.clipboardData.items;
			if (items) {
				this.paste_mode = 'auto';
				//access data directly
				for (var i = 0; i < items.length; i++) {
					if (items[i].type.indexOf("image") !== -1) {
						//image
						var blob = items[i].getAsFile();
						var URLObj = window.URL || window.webkitURL;
						var source = URLObj.createObjectURL(blob);
						this.paste_createImage(source);
					}
				}
				e.preventDefault();
			}
			else {
				//wait for DOMSubtreeModified event
				//https://bugzilla.mozilla.org/show_bug.cgi?id=891247
			}
		}
	}

	//on keyboard press
	on_keyboard_action(event) {
		var k = event.keyCode;
		//ctrl
		if (k == 17 || event.metaKey || event.ctrlKey) {
			if (this.ctrl_pressed == false)
				this.ctrl_pressed = true;
		}
		//v
		if (k == 86) {
			if (document.activeElement != undefined && document.activeElement.type == 'text') {
				//let user paste into some input
				return false;
			}

			if (this.ctrl_pressed == true && !window.Clipboard)
				this.pasteCatcher.focus();
		}
	}

	//on kaybord release
	on_keyboardup_action(event) {
		//ctrl
		if (event.ctrlKey == false && this.ctrl_pressed == true) {
			this.ctrl_pressed = false;
		}
		//command
		else if (event.metaKey == false && this.command_pressed == true) {
			this.command_pressed = false;
			this.ctrl_pressed = false;
		}
	}

	//draw image
	paste_createImage(source) {
		var pastedImage = new Image();
		var _this = this;

		pastedImage.onload = function () {
			_this.on_paste(source, pastedImage.width, pastedImage.height);
		};
		pastedImage.src = source;
	}
}

export default Clipboard_class;