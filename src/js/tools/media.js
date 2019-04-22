import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import File_search_media_class from './../modules/file/search.js';

class Media_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Search = new File_search_media_class();
		this.name = 'media';
	}

	load() {
		//nothing
	}

	render(ctx, layer) {
		//nothing
	}

	on_activate() {
		this.Search.search();
	}
}
;
export default Media_class;
