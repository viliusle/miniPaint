
//IMPORTANT - this file is not used !!!


// use a cacheName for cache versioning
var cacheName = 'v1:static';

// during the install phase you usually want to cache static assets
self.addEventListener('install', function(e) {
	// once the SW is installed, go ahead and fetch the resources to make this work offline
	e.waitUntil(
		caches.open(cacheName).then(function(cache) {
			return cache.addAll([
				'./',
				'./dist/bundle.js',
				'./images/favicon.png',
				'./images/logo.svg',
				'./images/logo-colors.png',
				'./images/icons/animation.svg',
				'./images/icons/blur.svg',
				'./images/icons/bold.svg',
				'./images/icons/brush.svg',
				'./images/icons/bulge_pinch.svg',
				'./images/icons/clone.svg',
				'./images/icons/crop.svg',
				'./images/icons/delete.svg',
				'./images/icons/desaturate.svg',
				'./images/icons/erase.svg',
				'./images/icons/external.png',
				'./images/icons/fill.svg',
				'./images/icons/gradient.png',
				'./images/icons/grid.png',
				'./images/icons/italic.svg',
				'./images/icons/magic_erase.svg',
				'./images/icons/media.svg',
				'./images/icons/menu.svg',
				'./images/icons/pencil.svg',
				'./images/icons/pick_color.svg',
				'./images/icons/refresh.svg',
				'./images/icons/select.svg',
				'./images/icons/selection.svg',
				'./images/icons/shape.svg',
				'./images/icons/sharpen.svg',
				'./images/icons/strikethrough.svg',
				'./images/icons/text.svg',
				'./images/icons/underline.svg',
				'./images/icons/view.svg'
			]).then(function() {
				self.skipWaiting();
			});
		})
	);
});

// when the browser fetches a url
self.addEventListener('fetch', function(event) {
	// either respond with the cached object or go ahead and fetch the actual url
	event.respondWith(
		caches.match(event.request).then(function(response) {
			if (response) {
				// retrieve from cache
				return response;
			}
			// fetch as normal
			return fetch(event.request);
		})
	);
});
