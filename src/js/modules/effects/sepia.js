import Effects_common_class from './abstract/css.js';

class Effects_sepia_class extends Effects_common_class {

	sepia() {
		var params = [
			{name: "value", title: "Percentage:", value: 60, range: [0, 100]},
		];
		this.show_dialog('sepia', params);
	}

	convert_value(value) {
		var system_value = value / 100;

		return system_value;
	}

}

export default Effects_sepia_class;