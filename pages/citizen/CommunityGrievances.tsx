
import React, { useState, useMemo } from 'react';
import { Complaint } from '../../types';
import { ISSUE_TYPES, WARD_NUMBERS, STATUS_COLORS } from '../../constants';

interface CommunityGrievancesProps {
    complaints: Complaint[];
    loading?: boolean;
}

const CommunityGrievances: React.FC<CommunityGrievancesProps> = ({ complaints, loading = false }) => {
    const [wardFilter, setWardFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [issueTypeFilter, setIssueTypeFilter] = useState<string>('all');

    const filteredComplaints = useMemo(() => {
        return complaints.filter(c => {
            const wardMatch = wardFilter === 'all' || c.ward === Number(wardFilter);
            const priorityMatch = priorityFilter === 'all' || c.priorityScore === Number(priorityFilter);
            const issueTypeMatch = issueTypeFilter === 'all' || c.issueType === issueTypeFilter;
            return wardMatch && priorityMatch && issueTypeMatch;
        });
    }, [complaints, wardFilter, priorityFilter, issueTypeFilter]);

    const resetFilters = () => {
        setWardFilter('all');
        setPriorityFilter('all');
        setIssueTypeFilter('all');
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg animate-fade-in">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Community Grievances</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-wrap items-center gap-4 border border-gray-200">
                <div className="flex-grow min-w-[150px]">
                    <label htmlFor="ward-filter" className="text-sm font-medium text-gray-700">Ward</label>
                    <select id="ward-filter" value={wardFilter} onChange={e => setWardFilter(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                        <option value="all">All Wards</option>
                        {WARD_NUMBERS.map(w => <option key={w} value={w}>Ward {w}</option>)}
                    </select>
                </div>
                 <div className="flex-grow min-w-[150px]">
                    <label htmlFor="priority-filter" className="text-sm font-medium text-gray-700">Priority</label>
                    <select id="priority-filter" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                        <option value="all">All Priorities</option>
                        {[5, 4, 3, 2, 1].map(p => <option key={p} value={p}>Priority {p}</option>)}
                    </select>
                </div>
                 <div className="flex-grow min-w-[150px]">
                    <label htmlFor="issue-type-filter" className="text-sm font-medium text-gray-700">Issue Type</label>
                    <select id="issue-type-filter" value={issueTypeFilter} onChange={e => setIssueTypeFilter(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                        <option value="all">All Types</option>
                        {ISSUE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div className="self-end pt-5">
                     <button onClick={resetFilters} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md h-[42px]">
                        Reset
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl">
                {loading ? (
                    <div className="p-6 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-500">Loading grievances...</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {filteredComplaints.length > 0 ? filteredComplaints.map(c => (
                        <li key={c.id} className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                 <div className="flex items-start space-x-4 flex-grow">
                                    <img src={c.imageURL} alt={c.issueType} className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover shadow-md"/>
                                    <div className="flex-grow">
                                        <p className="text-sm font-semibold text-blue-600">{c.issueType} - Ward {c.ward}</p>
                                        <p className="text-lg font-bold text-gray-800">{c.description}</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Priority: {c.priorityScore}/5 | By: {c.userName} | Submitted: {new Date(c.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 self-center sm:self-auto">
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                                </div>
                            </div>
                        </li>
                        )) : (
                            <p className="p-6 text-center text-gray-500">No grievances match the current filters.</p>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default CommunityGrievances;
