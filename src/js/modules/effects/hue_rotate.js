import Effects_common_class from './abstract/css.js';

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

}

export default Effects_hueRotate_class;