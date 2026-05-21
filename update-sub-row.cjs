const fs = require('fs');
const content = fs.readFileSync('src/components/admin/EventSubscriptionsTab.jsx', 'utf8');

const newContent = content.replace(
  /{\/\* Company name with logo \*\/}/,
  `{/* Arrival Status */}
                      <td className="p-2 text-center">
                        <button
                          data-actions
                          onClick={(e) => { e.stopPropagation(); toggleArrivalStatus(subscription); }}
                          className={\`px-2 py-1 text-xs font-bold rounded-full \${
                            subscription.has_arrived 
                              ? 'bg-green-100 text-green-800 hover:bg-red-100 hover:text-red-800' 
                              : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-800'
                          }\`}
                          title={subscription.has_arrived ? 'Mark as Not Arrived' : 'Mark as Arrived'}
                        >
                          {subscription.has_arrived ? '✓ Arrived' : 'Not Arrived'}
                        </button>
                      </td>

                      {/* Company name with logo */}`,
);

fs.writeFileSync('src/components/admin/EventSubscriptionsTab.jsx', newContent);
