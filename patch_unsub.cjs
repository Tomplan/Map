const fs = require('fs');
let code = fs.readFileSync('src/hooks/useEventSubscriptions.js', 'utf-8');
code = code.replace(
  /.delete\(\)\s*\.eq\('id', subscriptionId\);/s,
  `.delete({ count: 'exact' })\n        .eq('id', subscriptionId);\n\n      if (count !== undefined && count === 0) throw new Error('Failed to delete - row not found or blocked by RLS');`
);
fs.writeFileSync('src/hooks/useEventSubscriptions.js', code);
