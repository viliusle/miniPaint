import Base_search_class from './../../core/base-search.js';

class Tools_search_class {

	constructor() {
		this.Base_search = new Base_search_class();
	}

	search() {
		this.Base_search.search();
	}

}

export default Tools_search_class;