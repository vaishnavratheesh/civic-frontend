
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import { ForecastData } from '../../types';

const mockForecastData: ForecastData[] = [
  { ward: 1, date: '2023-11-01', complaintCount: 5, predictedCount: 7 },
  { ward: 2, date: '2023-11-01', complaintCount: 8, predictedCount: 6 },
  { ward: 3, date: '2023-11-01', complaintCount: 3, predictedCount: 4 },
  { ward: 4, date: '2023-11-01', complaintCount: 12, predictedCount: 10 },
  { ward: 5, date: '2023-11-01', complaintCount: 7, predictedCount: 9 },
];

const AdminDashboard: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <main className="container mx-auto p-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Admin Overview</h2>
                
                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard icon="fa-clipboard-list" title="Total Complaints Today" value="132" color="bg-blue-500" />
                    <StatCard icon="fa-check-circle" title="Resolved Today" value="45" color="bg-green-500" />
                    <StatCard icon="fa-hourglass-half" title="Pending" value="87" color="bg-yellow-500" />
                    <StatCard icon="fa-users" title="Active Officers" value="12" color="bg-indigo-500" />
                </div>

                {/* Forecast Chart */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Complaint Forecast (Next 7 Days)</h3>
                     <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <BarChart
                                data={mockForecastData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="ward" label={{ value: 'Ward Number', position: 'insideBottom', offset: -5 }}/>
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="complaintCount" name="Actual (Last Week)" fill="#8884d8" />
                                <Bar dataKey="predictedCount" name="Predicted (Next Week)" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
