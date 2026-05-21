# Scaling & App Limitations Memo (5,000 Expected Visitors)

**Date:** May 19, 2026  
**Topic:** Scalability bottlenecks resulting from fetching and caching entire map assets offline automatically, and real-time database connection limits at scale.

This memo details three major architectural bottlenecks that occur when serving ~5,000 concurrent event visitors, how the mechanics work under the hood, and strategies to mitigate them.

---

## 1. Supabase Bandwidth (Egress Limits)

**The Mechanics**  
Whenever a user opens your app, their browser requests data from Supabase. This data is divided into two categories:

1. **Database Queries:** Fetching the list of exhibitors, markers, and event settings (JSON data).
2. **Storage:** Downloading the company logos (`-128.webp` files).

"Egress" is the industry term for data _leaving_ the server. Supabase tracks every megabyte that leaves their servers and goes to your users' phones.

**The Math at Scale**

- If your raw database JSON is `500 KB` and you have 200 logos at `10 KB` each (`2,000 KB` or 2 MB), the total payload is **~2.5 MB per user**.
- **5,000 visitors × 2.5 MB = 12.5 Gigabytes (GB)** of egress data.

**The Threat**  
The Supabase **Free Plan** has a hard limit of **5 GB of egress per month**.
If you hit 5.01 GB, Supabase doesn't just throttle you—they automatically pause your project to prevent infinite cloud hosting bills. Your database shuts down, API requests fail, images return `404 Not Found`, and the app breaks for everyone.

**The Solution**

1. **Upgrade to the Pro Plan ($25/mo):** This raises your egress limit from 5 GB to 250 GB. You can safely handle ~100,000 visitors with this allowance. You only need to pay this for the month the event is live.
2. **Service Worker Caching (Implemented):** Because we employ aggressive offline caching via the Service Worker, a single visitor who opens the app 10 times over the weekend will only download that 2.5 MB _once_. Without the Service Worker, 5,000 visitors opening the app 10 times each would cost you **125 GB** in bandwidth!

---

## 2. Supabase Realtime (Concurrent WebSocket Limits)

**The Mechanics**  
Right now, your app uses Supabase Realtime. When a device loads the map, it doesn't just ask the database "where are the markers?" once. It opens a persistent, always-listening connection called a **WebSocket**.
Because the socket stays open, if an admin moves a marker on their laptop, the database streams that change down the WebSocket, and the marker magically moves on the visitor's phone instantly.

**The Threat**  
Maintaining thousands of open, live WebSockets requires massive server memory.

- **Free Plan limit:** 200 concurrent active connections.
- **Pro Plan limit:** 500 concurrent active connections.

If you have 5,000 visitors at the venue, it is highly likely that more than 500 people will have the map open on their phone at the _exact same second_.
When visitor #501 opens the app, Supabase will reject their WebSocket connection. The app will likely throw a red console error, fail to get the marker data, or enter an infinite "reconnecting" loop that drains the user's phone battery and makes the app lag.

**The Solution**  
Public visitors walking around the event **do not need** to see booths moving in real-time.

- **Restructure the Data Fetching:** Modify the app so that `admin` users connect to Supabase Realtime, but `public` visitors perform a standard one-time `fetch()` on page load.
- Standard `fetch()` requests close immediately after they finish downloading, meaning you can have thousands of users hitting the database without accumulating active WebSocket connections and hitting the concurrency limit.

---

## 3. Map Tile Provider Rate Limits & Fair Use

**The Mechanics**  
Your map is made of tiny square images called "tiles" (e.g., Carto Voyager or Esri layers). These base maps are provided by external companies for free under "Fair Use" policies.

To cache an entire map invisibly, we would write a background script that loops through the coordinates and downloads every possible tile (zoom levels 14 through 19). Because each zoom level is a grid, the number of tiles multiplies by 4 every time you zoom in. Level 19 alone might be 1,024 tiles.

**The Threat**  
If 5,000 visitors walk into the venue, connect to the event Wi-Fi, open the app, and their phones instantly try to download 1,500 tiles in the background... that is **7.5 million rapid-fire requests** hitting Carto's servers from a single location in a short time.
To Carto's automated security systems, this looks exactly like a **DDoS (Distributed Denial of Service) attack**.
Their firewall will trigger, and they will block either the Venue's Wi-Fi IP address or your app's web domain. The map will stop loading entirely for everyone, showing gray background grids instead of the map.

**The Solution**

1. **Rely on Natural Caching:** The Service Worker natively caches tiles _as the user looks at them_. That is safe and natural behavior that won't trigger DDoS protections.
2. **Limit Prefetching:** If you must prefetch to ensure baseline offline support, only pre-fetch high-level zooms (e.g., zoom levels 14 to 16). That might only be ~20 tiles per user (~100,000 requests total, distributed). Leave the ultra-deep zoom levels (17-19) strictly for when a user naturally pinches their fingers to zoom in, at which point the Service Worker fetches and caches them normally.
