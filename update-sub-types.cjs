const fs = require('fs');

const path = 'src/components/admin/EventSubscriptionsTab.jsx';
let content = fs.readFileSync(path, 'utf8');

// Inside SubscriptionRow component, add the toggle
content = content.replace(
  /<td>\s*\{renderContactDetails\(\)\}\s*<\/td>/,
  `<td>\n                {renderContactDetails()}\n            </td>\n            <td>\n                <div className="flex items-center gap-2">\n                    <button\n                        onClick={async () => {\n                            try {\n                                const { error } = await supabase\n                                    .from('event_subscriptions')\n                                    .update({ has_arrived: !sub.has_arrived })\n                                    .eq('id', sub.id);\n                                if (error) throw error;\n                            } catch (err) {\n                                console.error("Error updating arrival status:", err);\n                                alert("Failed to update arrival status.");\n                            }\n                        }}\n                        className={\`px-3 py-1 rounded text-sm font-medium transition-colors \${sub.has_arrived ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'}\`}\n                    >\n                        {sub.has_arrived ? '✓ Arrived' : 'Not Arrived'}\n                    </button>\n                </div>\n            </td>`,
);

// Add the column header
content = content.replace(
  /<th>Contact<\/th>/,
  `<th>Contact</th>\n                                <th>Status</th>`,
);

fs.writeFileSync(path, content);
console.log('Subscriptions list updated UI');
