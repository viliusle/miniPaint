import Effects_common_class from '../abstract/css.js';

class Effects_invert_class extends Effects_common_class {

	invert() {
		var params = [
			{name: "value", title: "Percentage:", value: 100, range: [0, 100]},
		];
		this.show_dialog('invert', params);
	}

	convert_value(value) {
		var system_value = value / 100;
		return system_value;
	}

	demo(canvas_id, canvas_thumb){
		var canvas = document.getElementById(canvas_id);
		var ctx = canvas.getContext("2d");

		//draw
		var size = this.convert_value(100, null, 'preview');
		ctx.filter = "invert("+size+")";
		ctx.drawImage(canvas_thumb, 0, 0);
		ctx.filter = 'none';
	}

	render_pre(ctx, data) {
		var value = this.convert_value(data.params.value, data.params, 'save');
		var filter = 'invert(' + value + ')';

		if(ctx.filter == 'none')
			ctx.filter = filter;
		else
			ctx.filter += ' ' + filter;
	}

	render_post(ctx, data){
		ctx.filter = 'none';
	}

}

export default Effects_invert_class;