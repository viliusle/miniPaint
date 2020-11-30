import Effects_common_class from '../abstract/css.js';

class Effects_hueRotate_class extends Effects_common_class {

	hue_rotate() {
		var params = [
			{name: "value", title: "Degree:", value: 90, range: [0, 360]},
		];
		this.show_dialog('hue-rotate', params);
	}

	convert_value(value) {
		return value + 'deg';
	}

	demo(canvas_id, canvas_thumb){
		var canvas = document.getElementById(canvas_id);
		var ctx = canvas.getContext("2d");

		//draw
		var size = this.convert_value(90, null, 'preview');
		ctx.filter = "hue-rotate("+size+")";
		ctx.drawImage(canvas_thumb, 0, 0);
		ctx.filter = 'none';
	}

	render_pre(ctx, data) {
		var value = this.convert_value(data.params.value, data.params, 'save');
		var filter = 'hue-rotate(' + value + ')';

		if(ctx.filter == 'none')
			ctx.filter = filter;
		else
			ctx.filter += ' ' + filter;
	}

	render_post(ctx, data){
		ctx.filter = 'none';
	}

}

export default Effects_hueRotate_class;