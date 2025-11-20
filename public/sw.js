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
    // } else if (url.pathname === "/api") {
    //   event.respondWith(handleFetch(event));
    // }
  } else if (url.pathname.startsWith("/api")) {
    event.respondWith(handleFetch(event));
    // event.respondWith(
    //   new Response(
    //     JSON.stringify({
    //       pathname: url.pathname,
    //       'url.pathname === "/api"': url.pathname === "/api",
    //     }),
    //     {
    //       status: 200,
    //       headers: { "Content-Type": "application/json" },
    //     },
    //   ),
    // );
  }
});

async function handleFetch(event) {
  const req = event.request;
  const url = new URL(req.url);

  // Read body if method is POST/PUT etc.
  let requestBody = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    // Clone request to read the body
    const clone = req.clone();
    try {
      requestBody = await clone.json();
    } catch {
      requestBody = await clone.text();
    }
  }

  // Create a MessageChannel for response communication
  const msgChannel = new MessageChannel();

  // Send message to main thread with one port of MessageChannel
  const client = await self.clients.get(event.clientId);
  if (!client) {
    return fetch(event.request); // fallback to network if no client
  }

  client.postMessage(
    {
      type: "PROCESS_REQUEST",
      /*
        `Request` objects are not directly transferable,
        so we'll have to reconstruct the requests on the main
        thread.
      */
      body: {
        requestBody,
        method: req.method,
        pathname: url.pathname,
      },
    },
    [msgChannel.port2],
  );

  // Promise to wait for response from main thread
  const responseData = await new Promise((resolve) => {
    msgChannel.port1.onmessage = (event) => {
      resolve(event.data.result);
    };
  });

  // TODO: Handle errors

  // Respond with the result as JSON
  return new Response(JSON.stringify(responseData.body), {
    status: responseData.status,
    headers: { "Content-Type": "application/json" },
  });
}
