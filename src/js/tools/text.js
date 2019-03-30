import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';
import Helper_class from './../libs/helpers.js';
import Dialog_class from './../libs/popup.js';

class Text_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
		this.POP = new Dialog_class();
		this.ctx = ctx;
		this.name = 'text';
		this.layer = {};
	}

	dragStart(event) {
		var _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mousedown(event);
	}

	dragMove(event) {
		var _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mousemove(event);
	}

	dragEnd(event) {
		var _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mouseup(event);
	}

	load() {
		var _this = this;

		//mouse events
		document.addEventListener('mousedown', function (event) {
			_this.dragStart(event);
		});
		document.addEventListener('mousemove', function (event) {
			_this.dragMove(event);
		});
		document.addEventListener('mouseup', function (event) {
			_this.dragEnd(event);
		});

		// collect touch events
		document.addEventListener('touchstart', function (event) {
			_this.dragStart(event);
		});
		document.addEventListener('touchmove', function (event) {
			_this.dragMove(event);
		});
		document.addEventListener('touchend', function (event) {
			_this.dragEnd(event);
		});
	}

	mousedown(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.valid == false || mouse.click_valid == false)
			return;

		window.State.save();

		//register new object - current layer is not ours or params changed
		this.layer = {
			type: this.name,
			params: this.clone(this.getParams()),
			render_function: [this.name, 'render'],
			x: mouse.x,
			y: mouse.y,
			rotate: null,
			is_vector: true,
		};
		this.Base_layers.insert(this.layer);
	}

	mousemove(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.is_drag == false)
			return;
		if (mouse.valid == false || mouse.click_valid == false) {
			return;
		}

		var width = mouse.x - this.layer.x;
		var height = mouse.y - this.layer.y;

		//more data
		config.layer.width = width;
		config.layer.height = height;
		this.Base_layers.render();
	}

	mouseup(e) {
		var mouse = this.get_mouse_info(e);
		var params = this.getParams();
		if (mouse.valid == false || mouse.click_valid == false) {
			return;
		}

		var width = mouse.x - this.layer.x;
		var height = mouse.y - this.layer.y;

		if (width == 0 && height == 0) {
			//same coordinates - cancel
			width = config.WIDTH - this.layer.x - Math.round(config.WIDTH / 50);
			height = params.size;
		}
		width = Math.max(width, params.size * 0.5 * 12);
		height = Math.max(height, params.size);
		//more data
		config.layer.width = width;
		config.layer.height = height;
		this.Base_layers.render();

		//ask for text
		var settings = {
			title: 'Edit text',
			params: [
				{name: "text", title: "Text:", value: "Text example", type: "textarea"},
			],
			on_finish: function (params) {
				if (config.layer.type == 'text' && params.text != '') {
					config.layer.params.text = params.text;
					config.need_render = true;
				}
			},
		};
		this.POP.show(settings);
	}
	
	getLines(ctx, text, maxWidth) {
		var words = text.split(" ");
		var lines = [];
		var currentLine = words[0];

		for (var i = 1; i < words.length; i++) {
			var word = words[i];
			var width = ctx.measureText(currentLine + " " + word).width;
			if (width < maxWidth) {
				currentLine += " " + word;
			} else {
				lines.push(currentLine);
				currentLine = word;
			}
		}
		lines.push(currentLine);
		
		return lines;
	}

	render(ctx, layer) {
		if (layer.width == 0 && layer.height == 0)
			return;
		var params = layer.params;

		var font = params.family.value;
		var text = params.text;
		var size = params.size;
		var line_height = size;
		if (params.text == undefined) {
			params.text = "Text example";
			text = "Text example";
		}
		
		//set styles
		if (params.bold && params.italic)
			ctx.font = "Bold Italic " + size + "px " + font;
		else if (params.bold)
			ctx.font = "Bold " + size + "px " + font;
		else if (params.italic)
			ctx.font = "Italic " + size + "px " + font;
		else
			ctx.font = "Normal " + size + "px " + font;
		ctx.fillStyle = layer.color;
		ctx.strokeStyle = layer.color;
		ctx.lineWidth = params.stroke_size;
		
		var paragraphs = text.split("\n");
		var offset_y = 0;
		for(var i in paragraphs){
			var block_test = paragraphs[i];
			var lines = this.getLines(ctx, block_test, layer.width);
			for (var j in lines) {
				offset_y += line_height;
				this.render_text_line(ctx, layer, lines[j], offset_y);
			}
		}
	}
	
	render_text_line(ctx, layer, text, offset_y) {
		var params = layer.params;
		var stroke = params.stroke;
		var align = params.align.value.toLowerCase();
		var text_width = ctx.measureText(text).width;
		
		//tabs
		text = text.replace(/\t/g, '      ');
		
		var start_x = layer.x;
		if (align == 'right') {
			start_x = layer.x + layer.width - text_width;
		}
		else if (align == 'center') {
			start_x = layer.x + Math.round(layer.width / 2) - Math.round(text_width / 2);
		}

		if (stroke == false)
			ctx.fillText(text, start_x, layer.y + offset_y);
		else
			ctx.strokeText(text, start_x, layer.y + offset_y);
	}
	
}

export default Text_class;
