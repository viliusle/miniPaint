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

	load() {
		var _this = this;

		//events
		document.addEventListener('mousedown', function (e) {
			if (config.TOOL.name != _this.name)
				return;
			_this.mousedown(e);
		});
		document.addEventListener('mousemove', function (e) {
			if (config.TOOL.name != _this.name)
				return;
			_this.mousemove(e);
		});
		document.addEventListener('mouseup', function (e) {
			if (config.TOOL.name != _this.name)
				return;
			_this.mouseup(e);
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
				{name: "text", title: "Text:", value: "Text example"},
			],
			on_finish: function (params) {
				if(config.layer.type == 'text' && params.text != ''){
					config.layer.params.text = params.text;
					config.need_render = true;
				}
			},
		};
		this.POP.show(settings);			
	}

	render(ctx, layer) {
		if (layer.width == 0 && layer.height == 0)
			return;
		var params = layer.params;

		var text = params.text;
		if (params.text == undefined) {
			params.text = "Text example";
			text = "Text example";
		}
		var size = params.size;
		var font = params.family.value;
		var stroke = params.stroke;
		var bold = params.bold;
		var italic = params.italic;
		var stroke_size = params.stroke_size;
		var align = params.align.value.toLowerCase();

		if (bold && italic)
			ctx.font = "Bold Italic " + size + "px " + font;
		else if (bold)
			ctx.font = "Bold " + size + "px " + font;
		else if (italic)
			ctx.font = "Italic " + size + "px " + font;
		else
			ctx.font = "Normal " + size + "px " + font;

		//main text
		ctx.textAlign = align;
		ctx.textBaseline = 'top';
		ctx.fillStyle = layer.color;
		ctx.strokeStyle = layer.color;
		ctx.lineWidth = stroke_size;

		var start_x = layer.x;
		if (align == 'right') {
			start_x = layer.x + layer.width;
		}
		else if (align == 'center') {
			start_x = layer.x + Math.round(layer.width / 2);
		}

		if (stroke == false)
			ctx.fillText(text, start_x, layer.y);
		else
			ctx.strokeText(text, start_x, layer.y);
	}

}

export default Text_class;
