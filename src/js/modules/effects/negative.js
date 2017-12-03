import Effects_common_class from './abstract/css.js';

class Effects_negative_class extends Effects_common_class {

	negative() {
		var params = [
			{name: "value", title: "Percentage:", value: 100, range: [0, 100]},
		];
		this.show_dialog('invert', params);
	}

	convert_value(value) {
		var system_value = value / 100;
		return system_value;
	}

}

export default Effects_negative_class;