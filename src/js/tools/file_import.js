import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';
import File_open_class from './../modules/file/open.js';

class File_import_class extends Base_tools_class {
	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.File_open = new File_open_class();
		this.name = 'file_import';

	}

	load() {
		// nothing
	}

	render(ctx, layer) {
		// nothing
	}

	on_activate() {
		this.File_open.open_file();
	}
};
export default File_import_class;