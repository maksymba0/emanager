import React, { useEffect, useState } from 'react';
import { createEmployee, deleteEmployeesAPI, getEmployees, updateEmployee } from '../api/client';
import { getUserRole } from './LoginPage';

// 1. Your Interface
export interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string | null;
    role: string;
    position: string | null;
    hourly_rate: number | null;
    is_active: boolean;
    created_at: string;
    department_id: number | null;
}


// 2. Exported EmployeePage Function

export function EmployeesPage() {


    const role = getUserRole();
    const canDelete = role === 'admin';
    const canEdit = role === 'admin' || role === 'manager';


    const [employees, setEmployees] = useState<Employee[]>([]);
    //const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    // Tracks whether we are editing an existing employee (null means we are creating a new one)
    const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
    const [showOnlyActive, setShowOnlyActive] = useState<boolean>(false);



    const filteredEmployees = showOnlyActive 
    ? employees.filter(emp => emp.is_active) 
    : employees;

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getEmployees();
                setEmployees(data);
            } catch (err) {
                setError("Could not load employees");
            }
        }
        fetchData();
    }, []); 

        // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState("");
    const [formResult, setFormResult] = useState<{ status: 'success' | 'error' | null; message: string }>({ status: null, message: '' });

    // Form fields state
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone_number: '',
        password: '',
        email: '',
        role: 'employee', // Default value
        position: '',
        hourly_rate: '',
        department_id: ''
    });

    const original = filteredEmployees.find(emp => emp.id === editingEmployeeId);
    // Explicitly cast the evaluation block into a strict boolean
    const isSaveDisabled = !!(
        editingEmployeeId && 
        original && 
        formData.first_name.trim() === original.first_name.trim() &&
        formData.last_name.trim() === original.last_name.trim() &&
        formData.email.trim() === original.email.trim() &&
        formData.role === original.role &&
        (formData.phone_number.trim() === '' ? null : formData.phone_number.trim()) === original.phone_number &&
        (formData.position.trim() === '' ? null : formData.position.trim()) === original.position &&
        (formData.hourly_rate === '' ? null : parseFloat(formData.hourly_rate)) === original.hourly_rate &&
        (formData.department_id === '' ? null : parseInt(formData.department_id, 10)) === original.department_id &&
        formData.password.trim() === ''
    );



    // Keep track of selected row IDs
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Toggles selection for a single row
    const handleSelectRow = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Toggles selecting/deselecting all visible rows
    const handleSelectAll = () => {
        if (selectedIds.length === filteredEmployees.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredEmployees.map(emp => emp.id));
        }
    };

    // Header Actions Loggers (Replace with your own form modals or API endpoints)
    const handleCreate = () => {
        // Reset form fields and previous status messages
        setFormData({
            first_name: '',
            last_name: '',
            phone_number: '',
            password: '',
            email: '',
            role: 'employee',
            position: '',
            hourly_rate: '',
            department_id: ''
        });
        setFormResult({ status: null, message: '' });
        setModalType("create");
        setIsModalOpen(true); // Open the modal window
    };

    const handleUpdate = () => {
        // Find the single employee object matching the checked row ID
        const targetEmployee = employees.find(e => e.id === selectedIds[0]);
        
        if (targetEmployee) {
            setEditingEmployeeId(targetEmployee.id); // Save the ID to signify we are editing
            setFormResult({ status: null, message: '' });
            
            // Populate form state fields with the employee's existing values
            setFormData({
                first_name: targetEmployee.first_name,
                last_name: targetEmployee.last_name,
                email: targetEmployee.email,
                password: '', // Keep password blank unless they explicitly want to change it
                role: targetEmployee.role,
                phone_number: targetEmployee.phone_number || '',
                position: targetEmployee.position || '',
                hourly_rate: targetEmployee.hourly_rate !== null ? targetEmployee.hourly_rate.toString() : '',
                department_id: targetEmployee.department_id !== null ? targetEmployee.department_id.toString() : ''
            });
            
            setIsModalOpen(true); // Pop open the modal frame
            setModalType("update");
        }
    };

    const handleView = () => {
        const targetEmployee = employees.find(e => e.id === selectedIds[0]);
        if (targetEmployee) {
            console.log("Viewing profile details for:", targetEmployee);
            alert(`Employee Profile Details:\nName: ${targetEmployee.first_name} ${targetEmployee.last_name}\nRole: ${targetEmployee.role}\nPosition: ${targetEmployee.position || 'N/A'}`);
        }
    };
 
    const handleDelete = async () => {
        // 1. Guard check to stop code execution if nothing is selected
        if (selectedIds.length === 0) return;

        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} employee(s)?`)) {
            try {
                // 2. Clear any lingering messages
                setFormResult({ status: null, message: '' });

                // 3. Dispatch array to server
                await deleteEmployeesAPI(selectedIds);

                // 4. Instantly remove deleted items from the local state list UI
                setEmployees(prev => prev.filter(emp => !selectedIds.includes(emp.id)));
                
                // 5. Clear table selection checkboxes
                setSelectedIds([]);
                
                // 6. Provide status notification feedback 
                alert('Employees successfully deleted!');

            } catch (error: any) {
                alert(`Error: ${error.message || 'Something went wrong while deleting.'}`);
                setFormResult({ 
                    status: 'error', 
                    message: `Error: ${error.message || 'Failed deletion'}` 
                });
            }
        }
    };


    
    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setFormResult({ status: null, message: '' });

        // 1. Properly format types and clear empty string inputs
        const payload = {
            first_name: formData.first_name,
            last_name: formData.last_name,
            password: formData.password,
            email: formData.email,
            role: formData.role, // "employee" | "manager" | "admin"
            phone_number: formData.phone_number.trim() === '' ? null : formData.phone_number,
            position: formData.position.trim() === '' ? null : formData.position,
            hourly_rate: formData.hourly_rate === '' ? null : parseFloat(formData.hourly_rate),
            department_id: formData.department_id === '' ? null : parseInt(formData.department_id, 10)
        };
         

        try {
            if (editingEmployeeId) {
            // --- UPDATE PATH ---
            const updatedEmployee = await updateEmployee(editingEmployeeId, payload);
            
            // Swap out the updated record in your frontend data state array
            setEmployees(prev => prev.map(emp => emp.id === editingEmployeeId ? updatedEmployee : emp));
            setFormResult({ status: 'success', message: 'Success!' });
            setSelectedIds([]); // Clear selections
            
        } else {
            // --- CREATE PATH ---
            const newEmployee = await createEmployee(payload);
            setEmployees(prev => [...prev, newEmployee]);
            setFormResult({ status: 'success', message: 'Success!' });
             
        }
        setTimeout(() => setIsModalOpen(false), 1500);

        } catch (error: any) {
            setFormResult({ status: 'error', message: `Error: ${error.message || 'Something went wrong'}` });
        }
        setEditingEmployeeId(null);
    };


    // Format utility helpers
    const formatCurrency = (amount: number | null) => {
        if (amount === null) return '-';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

        return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="w-full bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                
                {/* INTERACTIVE TABLE HEADER CONTROL PANEL */}
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-gray-800">Employee Management</h1>
                        {selectedIds.length > 0 && (
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                {selectedIds.length} Selected
                            </span>
                        )}
                    </div>
                 
                    {/* Action buttons with disabled handlers */}
                    <div className="flex items-center gap-2">
                        {/* Put this inside your table header action buttons area */}
                        {/* Active Status Toggle Checkbox Filter */}
                <label className="flex items-center gap-2 cursor-pointer select-none bg-white hover:bg-gray-50 border border-gray-300 px-3 py-2 rounded text-sm font-medium text-gray-700 transition-colors">
                    <input 
                        type="checkbox" 
                        checked={showOnlyActive} 
                        onChange={(e) => setShowOnlyActive(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Show Active Only</span>
                </label>
                        {canEdit && (<button
                            onClick={handleCreate}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                        >
                             Create Employee
                        </button>)}

                        {canEdit && (<button
                            onClick={handleUpdate}
                            disabled={selectedIds.length !== 1}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 border border-transparent px-4 py-2 rounded text-sm font-medium transition-colors disabled:cursor-not-allowed"
                        >
                             Update Details
                        </button>)}
                        <button
                            onClick={handleView}
                            disabled={selectedIds.length !== 1}
                            className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                             Display Details
                        </button>
                        
                        {canDelete && (<button
                            onClick={handleDelete}
                            disabled={selectedIds.length === 0}
                            className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 border border-transparent px-4 py-2 rounded text-sm font-medium transition-colors disabled:cursor-not-allowed"
                        >
                             Delete Selected
                        </button>)}
                    </div>
                </div>

                {/* THE EMPLOYEE DATA TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm text-gray-600">
                        <thead className="bg-gray-100 text-gray-700 uppercase text-xs border-b border-gray-200">
                            <tr>
                                {/* Bulk Selection Checkbox */}
                                <th className="p-4 w-12 text-center">
                                    <input 
                                        type="checkbox"
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                        checked={filteredEmployees.length > 0 && selectedIds.length === filteredEmployees.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                {canDelete && 
                                (<th className="p-4 font-semibold">ID</th>)
                                }
                                <th className="p-4 font-semibold">Name</th>
                                <th className="p-4 font-semibold">Email</th>
                                <th className="p-4 font-semibold">Phone</th>
                                <th className="p-4 font-semibold">Role / Position</th>
                                {canEdit && (<th className="p-4 font-semibold">Hourly Rate</th>)}
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Joined Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-400">
                                        No employees found in the system. {error === "" ? <label></label> : `ERROR: (${error})`}
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((employee) => {
                                    const isSelected = selectedIds.includes(employee.id);
                                    return (
                                        <tr 
                                            key={employee.id} 
                                            className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                                        >
                                            {/* Row Checkbox targeting specific elements */}
                                            <td className="p-4 text-center">
                                                <input 
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectRow(employee.id)}
                                                />
                                            </td>
                                            {canDelete && (<td className="p-4 font-medium text-gray-900">
                                                {employee.id}
                                            </td>)}
                                            <td className="p-4 font-medium text-gray-900">
                                                {employee.first_name} {employee.last_name}
                                            </td>
                                            <td className="p-4">{employee.email}</td>
                                            <td className="p-4 text-gray-500">{employee.phone_number || '-'}</td>
                                            <td className="p-4">
                                                <div className="font-medium text-gray-800">{employee.position || '-'}</div>
                                                <div className="text-xs text-gray-400 capitalize">{employee.role}</div>
                                            </td>
                                            {canEdit && (<td className="p-4 font-mono">{formatCurrency(employee.hourly_rate)}</td>)}
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    employee.is_active 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {employee.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-500">{formatDate(employee.created_at)}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* CREATE EMPLOYEE MODAL DIALOG BOX */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
                        
                        {/* Header with Title and "X" Close Cross Button */}
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h3 className="text-lg font-bold text-gray-900">{modalType === "update" ? 'Edit Employee Details' : 'Add New Employee'}</h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-xl font-medium leading-none"
                                type="button"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Scrollable Form Content */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                            
                            {/* Result Message Container (Top of form body) */}
                            {formResult.status && (
                                <div className={`p-3 rounded-lg text-sm font-semibold border ${
                                    formResult.status === 'success' 
                                        ? 'bg-green-50 border-green-200 text-green-800' 
                                        : 'bg-red-50 border-red-200 text-red-800'
                                }`}>
                                    {formResult.message}
                                </div>
                            )}

                            {/* Grid layout for First Name & Last Name */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">First Name *</label>
                                    <input required type="text" className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-blue-500 text-sm"
                                        value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Last Name *</label>
                                    <input required type="text" className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-blue-500 text-sm"
                                        value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                                </div>
                            </div>

                            {/* Email Address Input */}
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Email Address *</label>
                                <input required type="email" className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-blue-500 text-sm"
                                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>

                            {/* Password Input */}
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Password *</label>
                                <input required={!editingEmployeeId} type="password" className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-blue-500 text-sm"
                                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                            </div>

                            {/* Role Dropdown Selection */}
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Role *</label>
                                <select className="w-full px-3 py-2 border rounded border-gray-300 bg-white focus:outline-blue-500 text-sm"
                                    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                    <option value="employee">Employee</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            {/* Phone Number Input */}
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Phone Number (Optional)</label>
                                <input type="text" className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-blue-500 text-sm" placeholder="e.g. +15551234567"
                                    value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
                            </div>

                            {/* Position Title Input */}
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Position / Job Title (Optional)</label>
                                <input type="text" className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-blue-500 text-sm" placeholder="e.g. Lead Designer"
                                    value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
                            </div>

                            {/* Hourly Rate & Department Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Hourly Rate (\$) (Optional)</label>
                                    <input type="number" step="0.01" min="0" className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-blue-500 text-sm"
                                        value={formData.hourly_rate} onChange={e => setFormData({...formData, hourly_rate: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Department ID (Optional)</label>
                                    <input type="number" min="0" className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-blue-500 text-sm"
                                        value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})} />
                                </div>
                            </div>

                            {/* Action Buttons Footer inside the Form */}
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
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors disabled:bg-blue-900" 
                                    disabled={isSaveDisabled}
                                >
                                    {modalType === "create"? 'Create' : 'Update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
