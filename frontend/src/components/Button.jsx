const Button = ({ 
  children, 
  variant = 'primary', 
  type = 'button', 
  disabled = false,
  className = '',
  ...props 
}) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-200',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-200'
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed';

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${disabled ? disabledClasses : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;