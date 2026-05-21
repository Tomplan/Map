const fs = require('fs');
const path = 'src/components/admin/EventSubscriptionsTab.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add toggle logic
const toggleFn = `
  const toggleArrivalStatus = async (subscription) => {
    try {
      const newStatus = !subscription.has_arrived;
      const { error } = await supabase
        .from('event_subscriptions')
        .update({ has_arrived: newStatus })
        .eq('id', subscription.id);
        
      if (error) throw error;
      toastSuccess(newStatus ? 'Company marked as arrived' : 'Company marked as not arrived');
      fetchData(); // Refresh list to get latest
    } catch (err) {
      console.error('Error toggling arrival status:', err);
      toastError('Failed to update arrival status');
    }
  };
`;

if (!content.includes('toggleArrivalStatus')) {
  content = content.replace(/const handleSort = /s, toggleFn + '\n  const handleSort = ');
}

// 2. Add header column
const headerTarget = `<th\n                className="p-2 text-left border-b cursor-pointer hover:bg-gray-200 select-none bg-gray-100"\n                onClick={() => handleSort('company')}`;

const headerReplacement = `
              <th className="p-2 text-center border-b bg-gray-100" rowSpan={3}>Status</th>
              <th
                className="p-2 text-left border-b cursor-pointer hover:bg-gray-200 select-none bg-gray-100"
                onClick={() => handleSort('company')}`;

if (!content.includes('>Status</th>')) {
  // Try dynamic pattern
  content = content.replace(
    /{\/\* Company - with sort \*\/}\s*<th/,
    `{/* Status */}\n              <th className="p-2 text-center border-b bg-gray-100" rowSpan={3}>Status</th>\n              {/* Company - with sort */}\n              <th`,
  );
}

// 3. Add row column in table body
const rowTarget = /<td className="p-2">\s*<div className="font-semibold text-gray-900">/s;

const rowReplacement = `
                    <td className="p-2 text-center">
                      <button
                        data-actions
                        onClick={() => toggleArrivalStatus(subscription)}
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
                    <td className="p-2">
                      <div className="font-semibold text-gray-900">`;

if (!content.includes('toggleArrivalStatus(subscription)')) {
  content = content.replace(
    /<td className="p-2">\s*<div className="font-semibold text-gray-900">/s,
    rowReplacement,
  );
}

// 4. Update colSpan from 14 to 15
content = content.replace(/const colSpan = 14;/g, 'const colSpan = 15;');

fs.writeFileSync(path, content);
console.log('EventSubscriptionsTab updated');
