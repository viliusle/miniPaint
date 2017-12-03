import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';

class Borders_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = 'borders';
		this.layer = {};
	}

	load() {
		//nothing
	}

	render(ctx, layer) {
		var params = layer.params;
		var size = params.size;
		var width = parseInt(config.WIDTH);
		var height = parseInt(config.HEIGHT);

		ctx.save();

		//set styles
		ctx.strokeStyle = layer.color;
		ctx.lineWidth = size;

		if (params.shadow === true) {
			//with shadow
			ctx.beginPath();
			ctx.shadowColor = layer.color;
			ctx.shadowBlur = size * config.ZOOM;
			ctx.rect(-size / 2, -size / 2, width + size, height + size);
			ctx.stroke();
			ctx.stroke();
			ctx.stroke();
		}
		else {
			ctx.beginPath();
			ctx.rect(0, 0, width, height);
			ctx.stroke();
		}
		ctx.restore();
	}

}
;
export default Borders_class;
