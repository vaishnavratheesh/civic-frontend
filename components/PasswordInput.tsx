import React, { useState } from 'react';

interface PasswordInputProps {
  id: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  success?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder = "Enter password",
  label,
  error,
  success,
  required = false,
  className = "",
  disabled = false
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`shadow-sm appearance-none border rounded-lg w-full py-3 pr-12 pl-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 transition-all duration-200 ${
            error
              ? 'border-red-500 focus:ring-red-500 bg-red-50'
              : success
              ? 'border-green-500 focus:ring-green-500 bg-green-50'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          disabled={disabled}
          className={`absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200 ${
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
          tabIndex={-1}
        >
          {showPassword ? (
            <i className="fas fa-eye-slash text-lg"></i>
          ) : (
            <i className="fas fa-eye text-lg"></i>
          )}
        </button>
      </div>
      {error && (
        <p className="text-red-500 text-xs italic mt-1">
          <i className="fas fa-exclamation-circle mr-1"></i>
          {error}
        </p>
      )}
      {success && !error && (
        <p className="text-green-600 text-xs italic mt-1">
          <i className="fas fa-check-circle mr-1"></i>
          {success}
        </p>
      )}
    </div>
  );
};

export default PasswordInput; 