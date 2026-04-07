import { forwardRef, useId } from 'react';

const Select = forwardRef(({ label, error, options = [], placeholder, ...props }, ref) => {
  const id = useId();
  
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
          error 
            ? 'border-red-500 focus:ring-red-200' 
            : 'border-gray-300 focus:ring-blue-200'
        }`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;