
import React, { useState, useMemo, useEffect } from 'react';
import { Complaint } from '../../types';
import { ISSUE_TYPES, WARD_NUMBERS, STATUS_COLORS } from '../../constants';
import Swal from 'sweetalert2';

interface CommunityGrievancesProps {
    complaints: Complaint[];
    loading?: boolean;
}

const CommunityGrievances: React.FC<CommunityGrievancesProps> = ({ complaints, loading = false }) => {
    const [wardFilter, setWardFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [issueTypeFilter, setIssueTypeFilter] = useState<string>('all');
    const [upvoting, setUpvoting] = useState<string | null>(null);
    // Keep a local copy so we can update UI without full page reload
    const [localComplaints, setLocalComplaints] = useState<Complaint[]>(complaints || []);

    useEffect(() => {
        setLocalComplaints(complaints || []);
    }, [complaints]);

    const handleUpvote = async (grievanceId: string) => {
        setUpvoting(grievanceId);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/grievances/${grievanceId}/upvote`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (response.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Upvoted!',
                    text: `Grievance upvoted successfully. Total upvotes: ${data.upvoteCount}`,
                    timer: 2000,
                    showConfirmButton: false
                });
                // Update local state so counts change without a full reload
                setLocalComplaints(prev => {
                    // Find the clicked grievance to determine its group key
                    const clicked = prev.find(c => c.id === grievanceId);
                    const groupKey = clicked?.duplicateGroupId || clicked?.id;
                    if (!groupKey) return prev;
                    return prev.map(c => {
                        const sameGroup = (c.duplicateGroupId || c.id) === groupKey;
                        if (!sameGroup) return c;
                        return {
                            ...c,
                            duplicateCount: typeof data.upvoteCount === 'number' ? data.upvoteCount : ((c.duplicateCount || 1) + 1),
                            priorityScore: typeof data.priorityScore === 'number' ? data.priorityScore : c.priorityScore
                        } as Complaint;
                    });
                });
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.message || 'Failed to upvote grievance'
                });
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to upvote grievance'
            });
        } finally {
            setUpvoting(null);
        }
    };

    const filteredComplaints = useMemo(() => {
        return localComplaints.filter(c => {
            const wardMatch = wardFilter === 'all' || c.ward === Number(wardFilter);
            const priorityMatch = priorityFilter === 'all' || c.priorityScore === Number(priorityFilter);
            const issueTypeMatch = issueTypeFilter === 'all' || c.issueType === issueTypeFilter;
            return wardMatch && priorityMatch && issueTypeMatch;
        });
    }, [localComplaints, wardFilter, priorityFilter, issueTypeFilter]);

    // Group duplicates by duplicateGroupId, falling back to individual id
    const grouped = useMemo(() => {
        const map = new Map<string, { head: Complaint; items: Complaint[]; count: number }>();
        for (const c of filteredComplaints) {
            const key = c.duplicateGroupId || c.id;
            if (!map.has(key)) {
                map.set(key, { head: c, items: [c], count: c.duplicateCount || 1 });
            } else {
                const g = map.get(key)!;
                g.items.push(c);
                g.count = Math.max(g.count, c.duplicateCount || g.items.length);
            }
        }
        // sort by priorityScore desc, then by count desc, then newest
        return Array.from(map.values()).sort((a,b) => (b.head.priorityScore - a.head.priorityScore) || (b.count - a.count) || (new Date(b.head.createdAt).getTime() - new Date(a.head.createdAt).getTime()));
    }, [filteredComplaints]);

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
                        {grouped.length > 0 ? grouped.map(group => (
                        <li key={group.head.duplicateGroupId || group.head.id} className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                 <div className="flex items-start space-x-4 flex-grow">
                                    <img src={group.head.imageURL} alt={group.head.issueType} className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover shadow-md"/>
                                    <div className="flex-grow">
                                        <p className="text-sm font-semibold text-blue-600">{group.head.issueType} - Ward {group.head.ward}</p>
                                        <p className="text-lg font-bold text-gray-800">{group.head.description}</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Priority: {group.head.priorityScore}/5 | Credibility: {typeof group.head.credibilityScore === 'number' ? `${(group.head.credibilityScore*100).toFixed(0)}%` : '—'} | Reports: {group.count} | Submitted: {new Date(group.head.createdAt).toLocaleDateString()}
                                        </p>
                                        {!!(group.head.flags && group.head.flags.length) && (
                                            <p className="text-xs text-red-600 mt-1">
                                                <i className="fas fa-flag mr-1"></i>
                                                {group.head.flags.join(', ')}
                                            </p>
                                        )}
                                        {group.head.location && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                <i className="fas fa-map-marker-alt mr-1"></i>
                                                {group.head.location?.address ? 
                                                    `${group.head.location.address} (${group.head.location?.lat?.toFixed?.(6)}, ${group.head.location?.lng?.toFixed?.(6)})` :
                                                    `${group.head.location?.lat?.toFixed?.(6)}, ${group.head.location?.lng?.toFixed?.(6)}`
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-shrink-0 self-center sm:self-auto">
                                    <div className="flex items-center gap-2 mb-2 justify-end">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                            <i className="fas fa-arrow-up mr-1"></i>{group.count} upvotes
                                        </span>
                                        <button
                                            onClick={() => handleUpvote(group.head.id)}
                                            disabled={upvoting === group.head.id}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {upvoting === group.head.id ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                                                    Upvoting...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-thumbs-up mr-1"></i>
                                                    Upvote
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${STATUS_COLORS[group.head.status]}`}>{group.head.status}</span>
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
