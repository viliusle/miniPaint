import Effects_common_class from './abstract/css.js';

class Effects_saturate_class extends Effects_common_class {

	saturate() {
		var params = [
			{name: "value", title: "Percentage:", value: -50, range: [-100, 100]},
		];
		this.show_dialog('saturate', params);
	}

	convert_value(value) {
		var system_value;
		if (value > 0) {
			system_value = value / 100 + 1;
		}
		else if (value < 0) {
			system_value = value / 100 + 1;
		}
		else {
			system_value = 1;
		}

		return system_value;
	}

}

export default Effects_saturate_class;