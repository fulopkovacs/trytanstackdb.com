// Install event
self.addEventListener("install", () => {
  console.log("Service Worker installing");
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating");
  event.waitUntil(clients.claim());
});

// Fetch event - intercept HTTP requests
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Intercept requests to /hello
  if (url.pathname === "/hello") {
    event.respondWith(
      new Response(JSON.stringify({ message: "world" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }
});
