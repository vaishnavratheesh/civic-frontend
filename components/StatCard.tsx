
import React from 'react';

interface StatCardProps {
  icon: string;
  title: string;
  value: string | number;
  color: string;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  title, 
  value, 
  color, 
  trend, 
  trendUp, 
  subtitle 
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${color}`}>
          <i className={`fas ${icon} text-2xl text-white`}></i>
        </div>
        {trend && (
          <div className={`flex items-center text-sm font-medium ${
            trendUp ? 'text-green-600' : 'text-red-600'
          }`}>
            <i className={`fas ${trendUp ? 'fa-arrow-up' : 'fa-arrow-down'} mr-1`}></i>
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
        {subtitle && (
          <p className="text-gray-400 text-xs">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
