
import React from 'react';

interface StatCardProps {
  icon: string;
  title: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-6 transform hover:scale-105 transition-transform duration-300">
      <div className={`p-4 rounded-full ${color}`}>
        <i className={`fas ${icon} text-3xl text-white`}></i>
      </div>
      <div>
        <p className="text-gray-500 font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
