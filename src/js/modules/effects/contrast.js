import Effects_common_class from './abstract/css.js';

class Effects_contrast_class extends Effects_common_class {

	contrast() {
		var params = [
			{name: "value", title: "Percentage:", value: 40, range: [-100, 100]},
		];
		this.show_dialog('contrast', params);
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

export default Effects_contrast_class;