const fs = require('fs');

// src/hooks/useEventMarkers.js
const file1 = 'src/hooks/useEventMarkers.js';
let content1 = fs.readFileSync(file1, 'utf8');

// Add to adminData inside processMarker
content1 = content1.replace(
  'notes: subscription.notes,',
  'notes: subscription.notes,\n                  sub_has_arrived: subscription.has_arrived,'
);

// Add listener inside useEffect
const eventListener1 = `
    function handleAdminSubscriptionChange() {
      loadMarkers(true);
    }
    window.addEventListener('admin_subscription_changed', handleAdminSubscriptionChange);
`;
content1 = content1.replace(
  "document.addEventListener('visibilitychange', handleVisibilityChange);",
  "document.addEventListener('visibilitychange', handleVisibilityChange);\n" + eventListener1
);

// Clean up listener
const cleanup1 = `
      window.removeEventListener('admin_subscription_changed', handleAdminSubscriptionChange);
`;
content1 = content1.replace(
  "window.removeEventListener('offline', handleOffline);",
  "window.removeEventListener('offline', handleOffline);\n" + cleanup1
);

fs.writeFileSync(file1, content1);

// src/components/EventClusterMarkers.jsx
const file2 = 'src/components/EventClusterMarkers.jsx';
let content2 = fs.readFileSync(file2, 'utf8');

// Add sub_has_arrived to cache key
content2 = content2.replace(
  '${defaultsKey}-${assignmentCount}`;',
  '${defaultsKey}-${assignmentCount}-${marker.sub_has_arrived ? "arrived" : "not-arrived"}`;'
);

fs.writeFileSync(file2, content2);
console.log("Done");
