import React from 'react';

/**
 * Generic numeric array input for any array-based field.
 * @param {Array<number>} value - The current array value.
 * @param {Function} onChange - Called with new array on blur/change.
 * @param {Array<string>} labels - Optional labels/placeholders for each input.
 * @param {number} length - Number of inputs (default: value.length or 2)
 */
export default function NumericArrayInputs({ value = [], onChange, labels = [], length }) {
  const inputCount = length || value.length || 2;
  const [inputs, setInputs] = React.useState(
    Array.from({ length: inputCount }, (_, i) => value[i]?.toString() ?? '')
  );

  React.useEffect(() => {
    setInputs(Array.from({ length: inputCount }, (_, i) => value[i]?.toString() ?? ''));
  }, [value, inputCount]);

  function handleInput(idx, str) {
    const newInputs = [...inputs];
    newInputs[idx] = str;
    setInputs(newInputs);
  }

  function handleBlur() {
    const arr = inputs.map(v => v === '' ? 0 : Number(v));
    onChange(arr);
  }

  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {Array.from({ length: inputCount }).map((_, i) => (
        <input
          key={i}
          type="number"
          step="any"
          value={inputs[i]}
          onChange={e => handleInput(i, e.target.value)}
          onBlur={handleBlur}
          className="w-1/2 bg-white border rounded px-2 py-1"
          placeholder={labels[i] || `Value ${i + 1}`}
          style={{ width: `${100 / inputCount}%` }}
        />
      ))}
    </div>
  );
}
