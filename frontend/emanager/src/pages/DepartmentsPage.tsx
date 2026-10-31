import React, { useEffect, useState } from 'react';
import { createDepartment, deleteDepartments, getDepartments, updateDepartment, type DepartmentWithManager } from '../api/client';
import { getUserRole } from './LoginPage';

// 1. Define Department Interface 

export function DepartmentsPage() {

    const role = getUserRole();
    const canDelete = role === 'admin';
    //const canEdit = role === 'admin' || role === 'manager';
    // Sample state data for departments
    const [departments, setDepartments] = useState<DepartmentWithManager[]>([]);
    const [error, setError] = useState("");
    // UI and Form management states
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDeptId, setEditingDeptId] = useState<number | null>(null);
    const [formResult, setFormResult] = useState<{ status: 'success' | 'error' | null; message: string }>({ status: null, message: '' });
    
    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getDepartments();
                setDepartments(data);
            } catch (err) {
                setError("ERROR: Could not load departments");
            }
        }
        fetchData();
    }, []); 


    // Form fields state
    const [formData, setFormData] = useState({
        name: '',
        manager_id: ''
    });

    // Toggles selection for a single row
    const handleSelectRow = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Toggles selecting/deselecting all rows
    const handleSelectAll = () => {
        if (selectedIds.length === departments.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(departments.map(d => d.id));
        }
    };

    // Open modal for Creating a fresh department
    const handleCreateTrigger = () => {
        setEditingDeptId(null);
        setFormData({ name: '', manager_id: '' });
        setFormResult({ status: null, message: '' });
        setIsModalOpen(true);
    };

    // Open modal for Updating an existing department
    const handleUpdateTrigger = () => {
        const target = departments.find(d => d.id === selectedIds[0]);
        if (target) {
            setEditingDeptId(target.id);
            setFormData({
                name: target.name,
                manager_id: target.manager_id !== null ? target.manager_id.toString() : ''
            });
            setFormResult({ status: null, message: '' });
            setIsModalOpen(true);
        }
    };

    // Bulk Delete Action Handler
    const handleDelete = async () => {
        if (selectedIds.length === 0) return;
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} department(s)?`)) {
            try {
                await deleteDepartments(selectedIds);
                setDepartments(prev => prev.filter(d => !selectedIds.includes(d.id)));
                setSelectedIds([]);
                alert('Department(s) successfully deleted!');
            } catch (error: any) {
                alert(`Error: ${error.message || 'Failed deletion'}`);
            }
        }
    };

    // Combined Create / Save form execution router
    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setFormResult({ status: null, message: '' });

    const payload = {
        name: formData.name.trim(),
        // Force empty form values into real null tokens
        manager_id: formData.manager_id === '' ? null : parseInt(formData.manager_id, 10)
    }; 


        try {
            if (editingDeptId) {
                // --- UPDATE PATH PLACEHOLDER ---
                await updateDepartment(editingDeptId, payload);
                setDepartments(prev => prev.map(d => d.id === editingDeptId ? { ...d, ...payload, manager_name: payload.manager_id ? "Assigned Manager" : null } : d));
                setFormResult({ status: 'success', message: 'Success!' });
                setSelectedIds([]);
            } else {
                // --- CREATE PATH PLACEHOLDER ---
                const created = await createDepartment(payload);
                const mockNewDept: DepartmentWithManager = {
                    id: created.id, // generating a temporary ID mock
                    name: created.name,
                    manager_id: created.manager_id,
                    manager_name: created.manager_id ? "Assigned Manager" : null
                };
                setDepartments(prev => [...prev, mockNewDept]);
                setFormResult({ status: 'success', message: 'Success!' });
            }
            setTimeout(() => setIsModalOpen(false), 1200);
        } catch (error: any) {
            setFormResult({ status: 'error', message: `Error: ${error.message || 'Something went wrong'}` });
        }
    };

    // Calculate changes to dynamically block unnecessary update API evaluations
    const originalSnapshot = departments.find(d => d.id === editingDeptId);
    const isSaveDisabled = !!(
        editingDeptId &&
        originalSnapshot &&
        formData.name.trim() === originalSnapshot.name &&
        (formData.manager_id === '' ? null : parseInt(formData.manager_id, 10)) === originalSnapshot.manager_id
    );

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="w-full bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                
                {/* INTERACTIVE TABLE CONTROL PANEL HEADER */}
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-gray-800">Departments</h1>
                        {selectedIds.length > 0 && (
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                {selectedIds.length} Selected
                            </span>
                        )}
                    </div>
                    
                    {/* Action buttons matching previous layout style rule requirements */}
                    {canDelete && (<div className="flex items-center gap-2">
                        <button
                            onClick={handleCreateTrigger}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                        >
                            Create Department
                        </button>
                        
                        <button
                            onClick={handleUpdateTrigger}
                            disabled={selectedIds.length !== 1}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 border border-transparent px-4 py-2 rounded text-sm font-medium transition-colors disabled:cursor-not-allowed"
                        >
                            Update Details
                        </button>
                        
                        <button
                            onClick={handleDelete}
                            disabled={selectedIds.length === 0}
                            className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 border border-transparent px-4 py-2 rounded text-sm font-medium transition-colors disabled:cursor-not-allowed"
                        >
                            Delete Selected
                        </button>
                    </div>)}
                </div>

                {/* DEPARTMENT DATA VIEW TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm text-gray-600">
                        <thead className="bg-gray-100 text-gray-700 uppercase text-xs border-b border-gray-200">
                            <tr>
                                <th className="p-4 w-12 text-center">
                                    <input 
                                        type="checkbox"
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                        checked={departments.length > 0 && selectedIds.length === departments.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                {canDelete && (<th className="p-4 font-semibold">Department ID</th>)}
                                <th className="p-4 font-semibold">Department Name</th>
                                <th className="p-4 font-semibold">Manager Info</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {departments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-400">
                                        No departments found in the system. {error}
                                    </td>
                                </tr>
                            ) : (
                                departments.map((dept) => {
                                    const isSelected = selectedIds.includes(dept.id);
                                    return (
                                                                                <tr 
                                            key={dept.id} 
                                            className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                                        >
                                            <td className="p-4 text-center">
                                                <input 
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectRow(dept.id)}
                                                />
                                            </td>
                                            {canDelete && (<td className="p-4 font-mono text-gray-500">#{dept.id}</td>)}
                                            <td className="p-4 font-medium text-gray-900">{dept.name}</td>
                                            <td className="p-4">
                                                {dept.manager_id  ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-800 font-medium">{dept.manager_name || 'Assigned'}</span>
                                                        {canDelete && (<span className="text-xs text-gray-400">Manager ID: #{dept.manager_id}</span>)}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">No Manager Assigned</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL INPUT BOX OVERLAY FORM */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-100 flex flex-col">
                        
                        {/* Header Box */}
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingDeptId ? 'Edit Department' : 'Add New Department'}
                            </h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-xl font-medium leading-none"
                                type="button"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Form Area */}
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

                            {/* Department Name Input Field */}
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Department Name *</label>
                                <input 
                                    required 
                                    type="text" 
                                    className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-blue-500 text-sm"
                                    value={formData.name} 
                                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                />
                            </div>

                            {/* Manager ID Optional Input Field */}
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Manager Employee ID (Optional)</label>
                                <input 
                                    type="number" 
                                    min="0" 
                                    placeholder="e.g. 5"
                                    className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-blue-500 text-sm"
                                    value={formData.manager_id} 
                                    onChange={e => setFormData({ ...formData, manager_id: e.target.value })} 
                                />
                            </div>

                            {/* Footer Buttons */}
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
                                    {editingDeptId ? 'Save' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

