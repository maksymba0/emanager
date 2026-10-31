import React, { useEffect, useState } from 'react';
import { createShift, deleteShift, getEmployeesPublic, getShifts, updateShift, type EmployeePublic } from '../api/client';
import { getUserRole } from './LoginPage';

// 1. Shift Interface
export interface Shift {
    id: number;
    employee_id: number; // Added to match your database comment layout
    shift_date: string;  // YYYY-MM-DD
    start_time: string;  // HH:MM
    end_time: string;    // HH:MM
    notes: string | null;
}

 
// Extension to display worker info in the table view
interface ShiftWithEmployee extends Shift {
    employee_name?: string;
}

export function ShiftsPage() {

    // Controls the sub-modal employee lookup window visibility
    const [isEmployeePickerOpen, setIsEmployeePickerOpen] = useState(false);
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');

    // 1. Update state declaration to accept the fetched public array profiles
    const [employeeRegistry, setEmployeeRegistry] = useState<EmployeePublic[]>([]);

    
    const role = getUserRole();
    const bAdmin = role === 'admin';
    const bAdmManager = role === 'admin' || role === 'manager';

    // 2. Fetch the data right when the Shift component is loaded into view
    useEffect(() => {
        const loadEmployeeLookupList = async () => {
            try {
                const data = await getEmployeesPublic();
                setEmployeeRegistry(data); // Safely sets safe metadata profile rows
            } catch (error: any) {
                console.error("Lookup loader crash error exception:", error);
            }
        };
        
        loadEmployeeLookupList();
    }, []); // Empty array ensures this only queries once per component initialization

    // Sample state data for demonstration
    const [shifts, setShifts] = useState<ShiftWithEmployee[]>([]);

    // UI Panel Tracking States
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShiftId, setEditingShiftId] = useState<number | null>(null);
    const [dateFilter, setDateFilter] = useState<string>(''); // Empty string shows all dates
    const [formResult, setFormResult] = useState<{ status: 'success' | 'error' | null; message: string }>({ status: null, message: '' });

    // Core Form Fields State
    const [formData, setFormData] = useState({
        employee_id: '',
        shift_date: '',
        start_time: '',
        end_time: '',
        notes: ''
    });

    // Converts "2026-10-13T00:00:00" to "Oct 13, 2026"
    const formatTableDate = (dateString: string) => {
        if (!dateString) return '-';
        
        // Split on 'T' in case it's an ISO timestamp to prevent timezone shifting issues
        const datePart = dateString.split('T')[0]; 
        const dateObj = new Date(datePart);

        // If parsing fails fallback gracefully
        if (isNaN(dateObj.getTime())) return dateString;

        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };


    useEffect(() => {
        const fetchAndCombineData = async () => {
            try {
                // 1. Fetch both datasets from the server in parallel
                const [serverShifts] = await Promise.all([
                    getShifts()
                ]);
                const serverEmployees = await getEmployeesPublic();
                console.log(serverEmployees);
                // 2. Save the raw employee list for your popup selection search picker modal
                setEmployeeRegistry(serverEmployees);

                // 3. Map over the shifts and attach the corresponding worker's name
                const combinedShifts: ShiftWithEmployee[] = serverShifts.map((shift : Shift) => 
                    {
                    // Find matching employee in the newly fetched registry list
                    const matchedWorker = serverEmployees.find(emp => emp.id === shift.employee_id);

                    return {
                        ...shift,
                        // If found, format full name, otherwise provide a clear fallback
                        employee_name: matchedWorker
                            ? `${matchedWorker.first_name} ${matchedWorker.last_name}`
                            : `Worker #${shift.employee_id}`
                    };
                });

                // 4. Hydrate your table view state with the enriched data models
                setShifts(combinedShifts); 

            } catch (error: any) {
                alert(`Failed to synchronize scheduling data dashboard: ${error.message}`);
            }
        };

        fetchAndCombineData();
        
    }, [dateFilter]); // Automatically refreshes structural table logs when date filter conditions change
    



    // Toggle logic for selection checkboxes
    const handleSelectRow = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Derived State: filter records automatically on the fly
    const filteredShifts = (dateFilter 
        ? shifts.filter(s => s.shift_date === dateFilter) 
        : shifts)
        .sort((a, b) => b.shift_date.localeCompare(a.shift_date));



    const handleSelectAll = () => {
        if (selectedIds.length === filteredShifts.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredShifts.map(s => s.id));
        }
    };

    // Modal triggers
    const handleCreateTrigger = () => {
        setEditingShiftId(null);
        setFormData({ employee_id: '', shift_date: '', start_time: '', end_time: '', notes: '' });
        setFormResult({ status: null, message: '' });
        setIsModalOpen(true);
    };

    const handleUpdateTrigger = () => {
        const target = shifts.find(s => s.id === selectedIds[0]);
        console.log(target);
        if (target) {
            setEditingShiftId(target.id);
            setFormData({
                employee_id: target.employee_id.toString(),
                shift_date: target.shift_date.split("T")[0] ,
                start_time: target.start_time.substring(0, 5), // Trims seconds if returned from DB
                end_time: target.end_time.substring(0, 5),
                notes: target.notes || ''
            });
            setFormResult({ status: null, message: '' });
            setIsModalOpen(true);
        }
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) return;
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} shift(s)?`)) {
 
            try { 
            await deleteShift(selectedIds);  

            // Safely clear deleted indexes from the user interface
            setShifts(prev => prev.filter(s => !selectedIds.includes(s.id)));
            setSelectedIds([]);
            alert('Shifts successfully deleted from database!');

        } catch (error: any) {
            alert(`Deletion failed: ${error.message || 'Something went wrong.'}`);
        }
        }
    };

    // Validation & Dispatch submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormResult({ status: null, message: '' });

        // Time sanity guard check: Stop creation if times are upside down
        if (formData.start_time >= formData.end_time) {
            setFormResult({ status: 'error', message: 'Error: End time must be later than start time.' });
            return;
        }

        const payload = {
            employee_id: parseInt(formData.employee_id, 10),
            shift_date: formData.shift_date, // Assumes a standard YYYY-MM-DD string
            
            // 👉 CRUCIAL FIX: Ensure time strings include seconds (HH:MM:00) so Python parses them natively
            start_time: formData.start_time.length === 5 ? `${formData.start_time}:00` : formData.start_time,
            end_time: formData.end_time.length === 5 ? `${formData.end_time}:00` : formData.end_time,
            
            notes: formData.notes.trim() === '' ? null : formData.notes.trim()
        };


        try {
            if (editingShiftId) {
                // Update local list mockup state
                const updatedShift = await updateShift(editingShiftId, payload);


                setShifts(prev => prev.map(s => s.id === editingShiftId ? updatedShift : s));
                setFormResult({ status: 'success', message: 'Success!' });
                setSelectedIds([]);
            } else {
                // Create local item mockup state
                const newShift = await createShift(payload);
                // 2. Look up the employee's name from your local state registry cache
                const matchedEmployee = employeeRegistry.find(emp => emp.id === newShift.employee_id);
                
                // 3. Enrich the server's response object with the full name string
                const enrichedNewShift: ShiftWithEmployee = {
                    ...newShift,
                    employee_name: matchedEmployee 
                        ? `${matchedEmployee.first_name} ${matchedEmployee.last_name}`
                        : `Worker #${newShift.employee_id}` // Fallback layout string if not matched
                };
                
                // 4. Update your local table tracking state array instantly
                setShifts(prev => [...prev, enrichedNewShift]);
                setFormResult({ status: 'success', message: 'Success!' });
            }
            setTimeout(() => setIsModalOpen(false), 1200);
        } catch (error: any) {
            setFormResult({ status: 'error', message: `Error: ${error.message || 'Submission failed'}` });
        }
    };

    // Calculate if data changed to preserve API resource limits
    const originalSnapshot = shifts.find(s => s.id === editingShiftId);
    const isSaveDisabled = !!(
        editingShiftId &&
        originalSnapshot &&
        formData.employee_id === originalSnapshot.employee_id.toString() &&
        formData.shift_date === originalSnapshot.shift_date &&
        formData.start_time === originalSnapshot.start_time.substring(0, 5) &&
        formData.end_time === originalSnapshot.end_time.substring(0, 5) &&
        formData.notes === (originalSnapshot.notes || '')
    );

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="w-full bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                
                {/* TABLE HEADER ACTIONS & CONTROLS */}
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-800">Shifts Schedule</h1>
                        
                        {/* Interactive Date Filter Element */}
                        <div className="flex items-center gap-1.5 text-sm">
                            <span className="text-gray-500 font-medium">Filter Date:</span>
                            <input 
                                type="date" 
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-blue-500"
                            />
                            {dateFilter && (
                                <button onClick={() => setDateFilter('')} className="text-xs text-red-500 hover:underline ml-1">
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {/* Control Buttons Area */}
                    {bAdmManager && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCreateTrigger}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                        >
                            ➕ Add Shift
                        </button>
                        
                        <button
                            onClick={handleUpdateTrigger}
                            disabled={selectedIds.length !== 1}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 border border-transparent px-4 py-2 rounded text-sm font-medium transition-colors disabled:cursor-not-allowed"
                        >
                            ✏️ Update Details
                        </button>
                        
                        <button
                            onClick={handleDelete}
                            disabled={selectedIds.length === 0}
                            className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 border border-transparent px-4 py-2 rounded text-sm font-medium transition-colors disabled:cursor-not-allowed"
                        >
                            🗑️ Delete Selected
                        </button>
                    </div>)}
                </div>

                {/* THE SHIFTS DATA TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm text-gray-600">
                        <thead className="bg-gray-100 text-gray-700 uppercase text-xs border-b border-gray-200">
                            <tr>
                                <th className="p-4 w-12 text-center">
                                    <input 
                                        type="checkbox"
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                        checked={filteredShifts.length > 0 && selectedIds.length === filteredShifts.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                {bAdmManager && (<th className="p-4 font-semibold">ID</th>)}
                                <th className="p-4 font-semibold">Employee</th>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Time Window</th>
                                <th className="p-4 font-semibold">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredShifts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400">
                                        No scheduled shifts found for this selection.
                                    </td>
                                </tr>
                            ) : (
                                filteredShifts.map((shift) => {
                                    const isSelected = selectedIds.includes(shift.id);
                                    return (
                                        <tr 
                                            key={shift.id} 
                                            className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                                        >
                                            <td className="p-4 text-center">
                                                <input 
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectRow(shift.id)}
                                                />
                                            </td>
                                            {bAdmManager && (<td className="p-4 font-medium text-gray-900">
                                                <div className="text-xs text-gray-800 font-medium">ID: #{shift.id}</div>
                                            </td>)}
                                            <td className="p-4 font-medium text-gray-900">
                                                <div>{shift.employee_name || 'Assigned Worker'}</div>
                                                <div className="text-xs text-gray-400 font-mono">ID: #{shift.employee_id}</div>
                                            </td>
                                            {/* AFTER: Beautiful formatted date column */}
                                            <td className="p-4 font-medium text-gray-700">
                                                {formatTableDate(shift.shift_date)}
                                            </td>
                                            <td className="p-4 font-mono text-xs">
                                                <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded border border-slate-200">
                                                    {shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-500 max-w-xs truncate" title={shift.notes || ''}>
                                                {shift.notes || <span className="text-gray-300 italic">None</span>}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* POPUP MODAL INPUT DIALOG FORM */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-100 flex flex-col">
                        
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingShiftId ? 'Edit Shift Schedule' : 'Schedule New Shift'}
                            </h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg text-xl font-medium leading-none"
                                type="button"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {formResult.status && (
                                <div className={`p-3 rounded-lg text-sm font-semibold border ${
                                    formResult.status === 'success' 
                                        ? 'bg-green-50 border-green-200 text-green-800' 
                                        : 'bg-red-50 border-red-200 text-red-800'
                                }`}>
                                    {formResult.message}
                                </div>
                            )}

                            {/* Employee Selector Field Wrapper */}
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Assigned Employee *</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 px-3 py-2 border rounded border-gray-300 bg-gray-50 text-sm font-medium text-gray-700 min-h-[38px] flex items-center">
                                        {formData.employee_id ? (
                                            (() => {
                                                const emp = employeeRegistry.find(e => e.id.toString() === formData.employee_id);
                                                return emp ? `${emp.first_name} ${emp.last_name} (ID: #${emp.id})` : `ID: #${formData.employee_id}`;
                                            })()
                                        ) : (
                                            <span className="text-gray-400 italic">No worker selected</span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEmployeeSearchQuery('');
                                            setIsEmployeePickerOpen(true);
                                        }}
                                        className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded transition-colors"
                                    >
                                        Search List
                                    </button>
                                </div>
                                {/* Hidden hidden element ensuring HTML5 native validation remains intact on submit requests */}
                                <input required type="hidden" value={formData.employee_id} />
                            </div>


                           {/* Date Field */}
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Shift Date *</label>
                                <input 
                                    required 
                                    type="date" 
                                    className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-blue-500 text-sm"
                                    value={formData.shift_date} 
                                    onChange={e => setFormData({ ...formData, shift_date: e.target.value })} 
                                />
                            </div>

                            {/* Start and End Time input layouts */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Start Time *</label>
                                    <input 
                                        required 
                                        type="time" 
                                        className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-blue-500 text-sm"
                                        value={formData.start_time} 
                                        onChange={e => setFormData({ ...formData, start_time: e.target.value })} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">End Time *</label>
                                    <input 
                                        required 
                                        type="time" 
                                        className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-blue-500 text-sm"
                                        value={formData.end_time} 
                                        onChange={e => setFormData({ ...formData, end_time: e.target.value })} 
                                    />
                                </div>
                            </div>

                            {/* Description Notes Block restricted to VARCHAR(30) database limits */}
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Notes (Max 30 characters)</label>
                                <input 
                                    type="text" 
                                    maxLength={30}
                                    placeholder="e.g. Lunch shift coverage"
                                    className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-blue-500 text-sm"
                                    value={formData.notes} 
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })} 
                                />
                            </div>

                            {/* Control triggers */}
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
                                    disabled={isSaveDisabled}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editingShiftId ? 'Save' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* INNER EMPLOYEE SEARCH PICKER DIALOG */}
            {isEmployeePickerOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col max-h-[70vh]">
                        
                        {/* Header Box */}
                        <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h4 className="text-sm font-bold text-gray-900">Select Employee</h4>
                            <button 
                                type="button" 
                                onClick={() => setIsEmployeePickerOpen(false)}
                                className="text-gray-400 hover:text-gray-600 font-bold text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Live Filtering Search Input Box */}
                        <div className="p-3 border-b border-gray-100 bg-white">
                            <input
                                type="text"
                                placeholder="Type name to filter..."
                                value={employeeSearchQuery}
                                onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                                className="w-full px-3 py-1.5 border rounded border-gray-300 focus:outline-blue-500 text-sm"
                                autoFocus
                            />
                        </div>

                        {/* Scrollable Result Item Row Queue */}
                        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 bg-white">
                            {(() => {
                                const filtered = employeeRegistry.filter(emp =>
                                    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(employeeSearchQuery.toLowerCase())
                                );

                                if (filtered.length === 0) {
                                    return <div className="p-6 text-center text-xs text-gray-400 italic">No employees match criteria</div>;
                                }

                                return filtered.map((emp) => (
                                    <div
                                        key={emp.id}
                                        onClick={() => {
                                            setFormData({ ...formData, employee_id: emp.id.toString() });
                                            setIsEmployeePickerOpen(false);
                                        }}
                                        className="p-3 hover:bg-blue-50 cursor-pointer transition-colors flex justify-between items-center group"
                                    >
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">
                                                {emp.first_name} {emp.last_name}
                                            </div>
                                            <div className="text-xs text-gray-400">{emp.position}</div>
                                        </div>
                                        <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-medium">
                                            #{emp.id}
                                        </span>
                                    </div>
                                ));
                            })()}
                        </div>

                        {/* Cancel Footer button */}
                        <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsEmployeePickerOpen(false)}
                                className="px-3 py-1.5 bg-white border rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Close Window
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
        
    );
}


