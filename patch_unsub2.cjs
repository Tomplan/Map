const fs = require('fs');
let code = fs.readFileSync('src/hooks/useEventSubscriptions.js', 'utf-8');
code = code.replace(
  /const { error: deleteError } = await supabase/s,
  `const { error: deleteError, count } = await supabase`
);
fs.writeFileSync('src/hooks/useEventSubscriptions.js', code);
