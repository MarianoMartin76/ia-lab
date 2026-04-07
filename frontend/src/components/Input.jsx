import { forwardRef, useId } from 'react';

const Input = forwardRef(({ label, error, type = 'text', ...props }, ref) => {
  const id = useId();
  
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        type={type}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
          error 
            ? 'border-red-500 focus:ring-red-200' 
            : 'border-gray-300 focus:ring-blue-200'
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;