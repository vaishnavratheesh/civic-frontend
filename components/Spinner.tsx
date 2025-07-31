
import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    message?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', message }) => {
    const sizeClasses = {
        sm: 'h-6 w-6 border-2',
        md: 'h-12 w-12 border-4',
        lg: 'h-24 w-24 border-8',
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <div
                className={`animate-spin rounded-full ${sizeClasses[size]} border-blue-500 border-t-transparent`}
            ></div>
            {message && <p className="text-lg text-gray-600 font-semibold">{message}</p>}
        </div>
    );
};

export default Spinner;
