class View_fullScreen_class {

	constructor() {}

	/**
	 * toggle full-screen
	 */
	fs() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
		}
		else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			}
		}
	}
}

export default View_fullScreen_class;
