# STILL Photo Archive

A React photo gallery assignment built with Vite and Tailwind CSS. It fetches 30 photographs from the Picsum Photos API, filters by the returned author name, and saves favourites in the browser. Gallery positions are labeled 1–30; photographer credits stay exactly as provided by Picsum.

## Start the app on macOS

Double-click `Start Still.command`. It starts the local Vite server and opens the app in your browser at `http://127.0.0.1:5173/`. Keep the Terminal window open while using the app; closing it stops the local server. Do not open `index.html` directly from Finder, because this app needs Vite to serve its React modules and styles.

If the browser shows a Vite error after dependencies have been changed, stop the previous server with Control+C in its Terminal window, then double-click `Start Still.command` again. The server uses a fixed local address so the app does not silently move to another port.

## Start from Terminal

```sh
npm install
npm run dev
```

## Build and test

```sh
npm run build
npm test
```

The gallery uses the assignment's Picsum endpoint: `https://picsum.photos/v2/list?limit=30`.
