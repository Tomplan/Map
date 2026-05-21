import { dataConfigs } from './src/config/dataConfigs.js';

const rowA = dataConfigs.event_subscriptions.transformImport(
  { 'Company Name': 'ACME', 'Event Year': '2026', 'Arrived': 'yes' },
  { 'acme': 7 },
  2026
);

const rowB = dataConfigs.event_subscriptions.transformImport(
  { 'Company Name': 'ACME', 'Event Year': '2026', 'Arrived': '0' },
  { 'acme': 7 },
  2026
);

console.log(JSON.stringify({ rowA, rowB }));
