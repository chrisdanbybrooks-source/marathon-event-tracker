const CACHE_NAME = "marathon-event-manager-v3.3";
const TILE_CACHE = "osm-tiles-v1";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./manifest.json",

    "./assets/chart.min.js",
    "./assets/leaflet.js",
    "./assets/leaflet.css",
    "./assets/gpx.min.js",

    "./icons/icon-192.png",
    "./icons/icon-512.png",

    "./screenshots/dashboard.png",
    "./screenshots/activities.png"
];

/*
========================================
Install
========================================
*/
self.addEventListener(
    "install",
    event => {

        event.waitUntil(
            caches
                .open(CACHE_NAME)
                .then(cache =>
                    cache.addAll(FILES_TO_CACHE)
                )
        );

        self.skipWaiting();
    }
);

/*
========================================
Activate
========================================
*/
self.addEventListener(
    "activate",
    event => {

        const validCaches = [
            CACHE_NAME,
            TILE_CACHE
        ];

        event.waitUntil(
            caches.keys()
                .then(keys =>
                    Promise.all(
                        keys.map(key => {

                            if (
                                !validCaches.includes(key)
                            ) {
                                return caches.delete(key);
                            }

                        })
                    )
                )
        );

        self.clients.claim();
    }
);

/*
========================================
Tile Cache Cleanup
========================================
*/
async function trimTileCache(
    maxItems = 500
) {

    const cache =
        await caches.open(TILE_CACHE);

    const keys =
        await cache.keys();

    const excess =
        keys.length - maxItems;

    if (excess <= 0) {
        return;
    }

    const removals =
        keys.slice(0, excess);

    await Promise.all(
        removals.map(key =>
            cache.delete(key)
        )
    );
}

/*
========================================
Fetch
========================================
*/
self.addEventListener(
    "fetch",
    event => {

        /*
        Ignore non-GET requests
        */
        if (
            event.request.method !== "GET"
        ) {
            return;
        }

        const url =
            new URL(event.request.url);

        /*
        ========================================
        OpenStreetMap Tile Requests
        ========================================
        */
        const isMapTile =
            [
                "a.tile.openstreetmap.org",
                "b.tile.openstreetmap.org",
                "c.tile.openstreetmap.org",
                "tile.openstreetmap.org"
            ].includes(
                url.hostname
            );

        if (isMapTile) {

            event.respondWith(

                caches.open(TILE_CACHE)
                    .then(async cache => {

                        const cached =
                            await cache.match(
                                event.request
                            );

                        if (cached) {
                            return cached;
                        }

                        try {

                            const networkResponse =
                                await fetch(
                                    event.request
                                );

                            if (
                                networkResponse &&
                                networkResponse.ok
                            ) {

                                await cache.put(
                                    event.request,
                                    networkResponse.clone()
                                );

                                event.waitUntil(
                                    trimTileCache(500)
                                );

                            }

                            return networkResponse;

                        }
                        catch (error) {

                            console.warn(
                                "Tile fetch failed:",
                                error
                            );

                            return (
                                cached ||
                                Response.error()
                            );
                        }

                    })

            );

            return;
        }

        /*
        ========================================
        Application Shell
        Cache First
        ========================================
        */
        event.respondWith(

            caches.match(
                event.request
            )
            .then(cached => {

                if (cached) {
                    return cached;
                }

                return fetch(
                    event.request
                );

            })
            .catch(() =>
                Response.error()
            )

        );

    }
);