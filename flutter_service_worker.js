'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "assets/AssetManifest.json": "78c5cd34453a663d4a3adfca0b51221b",
"assets/assets/Bob.flr": "5732ebbced549bce28168a0dc2ba93cc",
"assets/assets/frame.flr": "07dfe2193381c449b98c312a013118d5",
"assets/assets/frames.flr": "68d3ae3d1fcf2658b3c5a918d322754c",
"assets/assets/intro.flr": "3ec5cd241c72ef914a76be34056fa23e",
"assets/assets/Led.flr": "ff09c30ca92109871058a295ce1e594d",
"assets/assets/option.flr": "68ed26953bce3045335d2d8bc9bf9c6c",
"assets/assets/parallax0.png": "bac00e42cc8bf06df9d05485095469da",
"assets/assets/parallax1.png": "95044d146ce7064a1e7de6feeb221a47",
"assets/assets/parallax2.png": "ef2bd2cdbfa5dc60c8ebf6f05dd292c4",
"assets/assets/parallax3.png": "2c1791eb9f8c8abd3b32bd78e25b1735",
"assets/assets/parallax4.png": "85af35fc3d60d06c95e014b2d28e9064",
"assets/assets/parallax5.png": "22944f56a35ee5d3ae67bad3ca8188b9",
"assets/assets/parallax6.png": "62e88f1523433e6858111393766fcbb7",
"assets/assets/parallax7.png": "9aadff21aad1be958be0199d07ea03d9",
"assets/assets/parallax8.png": "a1124ff21bbefb8a1c63fdd525891a80",
"assets/assets/partikel.flr": "5564910df19836be8ff1f70dab9f25f0",
"assets/assets/pp.flr": "2645f06ab6bfb84bdeda4494bcfe0486",
"assets/assets/pp.jpg": "485df18d0c0933617586ee53d03ba924",
"assets/assets/ppt.flr": "1f7b62aba25aaa7072db45378c17375b",
"assets/assets/Trim.flr": "731a55451236c52e5be6dbd71ce158a8",
"assets/assets/uzix.flr": "7500e104220f6690d4a3ef44d2fbf646",
"assets/FontManifest.json": "01700ba55b08a6141f33e168c4a6c22f",
"assets/fonts/MaterialIcons-Regular.ttf": "56d3ffdef7a25659eab6a68a3fbfaf16",
"assets/LICENSE": "7eba2adcc030d19816a572b8e43d795a",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "115e937bb829a890521f72d2e664b632",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"index.html": "9ee6ab9fed7aaeb93de72fc59dfd1473",
"/": "9ee6ab9fed7aaeb93de72fc59dfd1473",
"main.dart.js": "97cc51df9fbd43b00770c5d3a6a7f55e",
"manifest.json": "fd810f7e713bc9aa460e94ac22616723",
"pp.jpg": "485df18d0c0933617586ee53d03ba924"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "main.dart.js",
"/",
"index.html",
"assets/LICENSE",
"assets/AssetManifest.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(CORE);
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');

      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }

      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // If the URL is not the the RESOURCE list, skip the cache.
  if (!RESOURCES[key]) {
    return event.respondWith(fetch(event.request));
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

