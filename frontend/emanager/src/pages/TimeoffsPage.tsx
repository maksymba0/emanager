import React, { useState, useEffect } from 'react';
import { createTimeoff, getEmployees, getEmployeesPublic, getMe, getTimeoffs, updateTimeoff, type EmployeePublic } from '../api/client';
import { getUserRole } from './LoginPage';

// 1. Core Timeoff Interface
export interface Timeoff {
    id: number;
    employee_id: number;
    start_date: string;  // YYYY-MM-DD
    end_date: string;    // YYYY-MM-DD
    reason: string;
    status: string;      // "pending" | "approved" | "rejected"
    reviewed_by: number | null;
    created_at: string;
}

// Extension interface for public data mapping inside the view layer
interface TimeoffWithEmployee extends Timeoff {
    employee_name?: string;
}

export function TimeoffsPage() {
    // Sample state data matching your interface properties
    const [timeoffs, setTimeoffs] = useState<TimeoffWithEmployee[]>([]);
    
    const [employeeRegistry, setEmployeeRegistry] = useState<EmployeePublic[]>([]);
    const role = getUserRole();
    const bAdmin = role === 'admin';
    const bAdmManager = role === 'admin' || role === 'manager';

    useEffect(() => {
        const syncTimeoffDashboard = async () => {
            try {
                // Fetch both resources in parallel from your live server routes
                const [serverTimeoffs, serverEmployees] = await Promise.all([
                    getTimeoffs(),
                    getEmployeesPublic() // Assuming this fetch function is available in your scope
                ]);

                setEmployeeRegistry(serverEmployees);

                // Enrich raw entries with real names before loading into state
                const enriched = serverTimeoffs.map((item : Timeoff) => {
                    const worker = serverEmployees.find(e => e.id === item.employee_id);
                    return {
                        ...item,
                        employee_name: worker ? `${worker.first_name} ${worker.last_name}` : `Worker #${item.employee_id}`
                    };
                });

                setTimeoffs(enriched);
            } catch (error: any) {
                alert(`Failed to hydrate time off list view: ${error.message}`);
            }
        };

        syncTimeoffDashboard();
    }, []); // Fires automatically once upon page entry initialization

    // UI tracking states
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formResult, setFormResult] = useState<{ status: 'success' | 'error' | null; message: string }>({ status: null, message: '' });

    // Request Request Form State
    const [formData, setFormData] = useState({
        employee_id: '',
        start_date: '',
        end_date: '',
        reason: ''
    });

    // Checkbox selection triggers
    const handleSelectRow = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Filter array automatically based on dropdown state selection
    const filteredTimeoffs = statusFilter === 'all'
        ? timeoffs
        : timeoffs.filter(t => t.status === statusFilter);

    const handleSelectAll = () => {
        if (selectedIds.length === filteredTimeoffs.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredTimeoffs.map(t => t.id));
        }
    };

    // Date display string conversion helper
    const formatDisplayDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString.split('T')[0]).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Calculate dynamic vacation duration length days
    const calculateDays = (start: string, end: string) => {
        const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return isNaN(diffDays) ? 0 : diffDays;
    };

    // Opening modal setup layout
    const handleCreateTrigger = () => {
        setFormData({ employee_id: '', start_date: '', end_date: '', reason: '' });
        setFormResult({ status: null, message: '' });
        setIsModalOpen(true);
    };

    // Form creation execution dispatcher hook placeholder
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormResult({ status: null, message: '' });

        if (formData.start_date > formData.end_date) {
            setFormResult({ status: 'error', message: 'Error: End date cannot be before start date.' });
            return;
        }

        const payload: Omit<Timeoff, 'id'> = {
            employee_id: parseInt(formData.employee_id, 10),
            start_date: formData.start_date,
            end_date: formData.end_date,
            reason: formData.reason.trim(),
            status: 'pending',

            // 👇 FIX: Add these two missing fields to complete the schema signature!
            reviewed_by: null,
            created_at: new Date().toISOString()
        };


       try {
        // =========================================================
        // 👉 PLACE YOUR createTimeoff API FETCH CALL HERE
        // =========================================================
        const newlyCreatedRequest = await createTimeoff(payload);

        // Find worker text values to populate local state immediately without refresh triggers
        const worker = employeeRegistry.find(e => e.id === newlyCreatedRequest.employee_id);
        const enrichedNewItem: TimeoffWithEmployee = {
            ...newlyCreatedRequest,
            employee_name: worker ? `${worker.first_name} ${worker.last_name}` : `Worker #${newlyCreatedRequest.employee_id}`
        };

        setTimeoffs(prev => [enrichedNewItem, ...prev]);
        setFormResult({ status: 'success', message: 'Success!' });
        setTimeout(() => setIsModalOpen(false), 1200);

    } catch (error: any) {
        setFormResult({ status: 'error', message: `Submission failed: ${error.message}` });
    }

    };

     

    // Administrative approval pipeline workflow actions
    
    const handleStatusReview = async (newStatus: 'approved' | 'rejected') => {
        // 1. Guard check: Ensure exactly one item is checked in the table
        if (selectedIds.length !== 1) return;

        const targetId = selectedIds[0];

        try {
            // Clear any lingering form result messages from previous actions
            setFormResult({ status: null, message: '' });
            
            const currentItem = timeoffs.find(t => t.id === targetId);
            if (!currentItem) return;

            const isTogglingBack = currentItem.status === newStatus;
            const targetStatus = isTogglingBack ? 'pending' : newStatus;

            const me = getMe();
            // 2. Build the lightweight partial payload for your PATCH request
            const partialDataUpdate = {
                        status: targetStatus,
                        // Clear reviewed_by out to null if moving back to pending, else attach user id
                        reviewed_by: isTogglingBack ? null : ((await me).id || null)
                    };


            // 3. Dispatch the partial patch payload down to your API utility function
            const updatedRequest = await updateTimeoff(targetId, partialDataUpdate);

            // 4. Retain the display employee name from the current row snapshot
            //const currentItem = timeoffs.find(t => t.id === targetId);

            
            const enrichedUpdatedItem: TimeoffWithEmployee = {
                ...updatedRequest,
                employee_name: currentItem?.employee_name
            };

            // 5. Swap the old row out with the verified server response data
            setTimeoffs(prev => prev.map(t => t.id === targetId ? enrichedUpdatedItem : t));

            // 6. Clear checkboxes and alert success
            setSelectedIds([]);
            setFormResult({ status: 'success', message: `Successfully ${newStatus}!` });

        } catch (error: any) {
            console.error("Review procedure submission error:", error);
            setFormResult({
                status: 'error',
                message: `Error: ${error.message || 'Failed to update request status.'}`
            });
        }
    };



    // Selection target tracking to easily disable controls if items are already processed
    const selectedItem = timeoffs.find(t => t.id === selectedIds[0]);
    const isReviewDisabled = selectedIds.length !== 1;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="w-full bg-white rounded-lg shadow border border-gray-200 overflow-hidden">

                {/* ACTION DASHBOARD PANEL HEADER */}
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-gray-800">Time Off Requests</h1>

                        {/* Status Category Dropdown Filtering Selector */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-blue-500 font-medium text-gray-700"
                        >
                            <option value="all">All Request Statuses</option>
                            <option value="pending">⏳ Pending Only</option>
                            <option value="approved">✅ Approved Only</option>
                            <option value="rejected">❌ Rejected Only</option>
                        </select>
                    </div>

                    {/* Action Operations Control Layout Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCreateTrigger}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                        >
                            ➕ Request Time Off
                        </button>

                        {bAdmManager && (<button
                            onClick={() => handleStatusReview('approved')}
                            disabled={isReviewDisabled}
                            className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 border border-transparent px-4 py-2 rounded text-sm font-medium transition-colors disabled:cursor-not-allowed"
                        >
                             Approve
                        </button>)}

                        {bAdmManager && (<button
                            onClick={() => handleStatusReview('rejected')}
                            disabled={isReviewDisabled}
                            className="bg-amber-600 hover:bg-amber-700 text-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 border border-transparent px-4 py-2 rounded text-sm font-medium transition-colors disabled:cursor-not-allowed"
                        >
                             Reject
                        </button>)} 
                    </div>
                </div>

                {/* TIMEOFF LOGS DISPLAY DATA VIEW TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm text-gray-600">
                        <thead className="bg-gray-100 text-gray-700 uppercase text-xs border-b border-gray-200">
                            <tr>
                                <th className="p-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                        checked={filteredTimeoffs.length > 0 && selectedIds.length === filteredTimeoffs.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="p-4 font-semibold">Employee</th>
                                <th className="p-4 font-semibold">Duration Window</th>
                                <th className="p-4 font-semibold">Days Count</th>
                                <th className="p-4 font-semibold">Reason Description</th>
                                <th className="p-4 font-semibold">Status Block</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredTimeoffs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400">
                                        No time off requests found matching requirements.
                                    </td>
                                </tr>
                            ) : (
                                filteredTimeoffs.map((item) => {
                                    const isSelected = selectedIds.includes(item.id);
                                    return (
                                        <tr
                                            key={item.id}
                                            className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                                        >
                                            <td className="p-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectRow(item.id)}
                                                />
                                            </td>
                                            <td className="p-4 font-medium text-gray-900">
                                                <div>{item.employee_name || 'Staff Worker'}</div>
                                                <div className="text-xs text-gray-400 font-mono">ID: #{item.employee_id}</div>
                                            </td>
                                            <td className="p-4 text-gray-700 font-medium text-xs">
                                                {formatDisplayDate(item.start_date)} – {formatDisplayDate(item.end_date)}
                                            </td>
                                            <td className="p-4 font-mono text-gray-600 font-semibold">
                                                {calculateDays(item.start_date, item.end_date)} Days
                                            </td>
                                            <td className="p-4 text-gray-500 max-w-xs truncate" title={item.reason}>
                                                {item.reason}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${item.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                        item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CREATE TIMEOFF SYSTEM MODAL BOX POPUP DIALOG */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-100 flex flex-col">

                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h3 className="text-lg font-bold text-gray-900">File Time Off Request</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 rounded-lg text-xl font-medium leading-none"
                                type="button"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {formResult.status && (
                                <div className={`p-3 rounded-lg text-sm font-semibold border ${formResult.status === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                                    }`}>
                                    {formResult.message}
                                </div>
                            )}

                            {/* Employee ID numeric binding entry */}
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Employee ID *</label>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-blue-500 text-sm"
                                    value={formData.employee_id}
                                    onChange={e => setFormData({ ...formData, employee_id: e.target.value })}
                                />
                            </div>

                            {/* Start and End date entry rows split wrapper grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Start Date *</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-blue-500 text-sm"
                                        value={formData.start_date}
                                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">End Date *</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-blue-500 text-sm"
                                        value={formData.end_date}
                                        onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Long reason description block field validation */}
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Reason / Description *</label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Provide explicit context regarding your absence leave request window..."
                                    className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-blue-500 text-sm resize-none"
                                    value={formData.reason}
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                />
                            </div>

                            {/* Control button actions */}
                            <div className="pt-4 border-t border-gray-200 flex justify-end gap-2 bg-white mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

