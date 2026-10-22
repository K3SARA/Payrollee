import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Building,
  CreditCard,
  FileCheck,
  CheckCircle2,
  X,
  Sparkles,
  ArrowUpDown,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { apiFetch, formatLKR, formatDate } from '../api';

export default function EmployeeDirectory({ onViewPayslip }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [sortBy, setSortBy] = useState('employeeNumber');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [bannerMsg, setBannerMsg] = useState('');

  // Form states
  const initialForm = {
    email: '',
    password: 'password123',
    firstName: '',
    lastName: '',
    designation: '',
    department: 'Engineering',
    baseSalary: 250000,
    nicNumber: '',
    taxIdentificationNumber: '',
    bankName: 'Commercial Bank of Ceylon',
    bankBranch: 'Colombo Fort',
    accountNumber: '',
    phone: '',
    address: '',
    avatarUrl: ''
  };
  const [formData, setFormData] = useState(initialForm);

  async function loadEmployees() {
    setLoading(true);
    try {
      let query = `?sortBy=${sortBy}&sortOrder=${sortOrder}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (department !== 'ALL') query += `&department=${encodeURIComponent(department)}`;

      const res = await apiFetch(`/employees${query}`);
      if (res.success) {
        setEmployees(res.data);
      }
    } catch (err) {
      console.error('Failed to load employees', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, [department, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadEmployees();
  };

  const openAdd = () => {
    setFormData(initialForm);
    setShowAddModal(true);
  };

  const openEdit = (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      firstName: emp.firstName,
      lastName: emp.lastName,
      designation: emp.designation,
      department: emp.department,
      baseSalary: emp.baseSalary,
      nicNumber: emp.nicNumber,
      taxIdentificationNumber: emp.taxIdentificationNumber,
      bankName: emp.bankName,
      bankBranch: emp.bankBranch,
      accountNumber: emp.accountNumber,
      phone: emp.phone || '',
      address: emp.address || '',
      avatarUrl: emp.avatarUrl || '',
      employmentStatus: emp.employmentStatus
    });
    setShowEditModal(true);
  };

  const openDetail = (emp) => {
    setSelectedEmployee(emp);
    setShowDetailModal(true);
  };

  async function handleCreate(e) {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await apiFetch('/employees', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      if (res.success) {
        setShowAddModal(false);
        setBannerMsg(`Employee ${res.data.firstName} ${res.data.lastName} registered successfully.`);
        setTimeout(() => setBannerMsg(''), 4000);
        loadEmployees();
      }
    } catch (err) {
      alert(err.message || 'Failed to create employee');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await apiFetch(`/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      if (res.success) {
        setShowEditModal(false);
        setBannerMsg(`Profile for ${res.data.firstName} updated successfully.`);
        setTimeout(() => setBannerMsg(''), 4000);
        loadEmployees();
      }
    } catch (err) {
      alert(err.message || 'Failed to update employee');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(id) {
    setActionLoading(true);
    try {
      const res = await apiFetch(`/employees/${id}`, {
        method: 'DELETE'
      });
      if (res.success) {
        setDeleteTarget(null);
        setBannerMsg('Employee record removed successfully.');
        setTimeout(() => setBannerMsg(''), 4000);
        loadEmployees();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete employee');
    } finally {
      setActionLoading(false);
    }
  }

  const departmentsList = ['ALL', 'Engineering', 'Human Resources', 'Finance', 'Design', 'Operations'];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Banner Message */}
      {bannerMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{bannerMsg}</span>
        </div>
      )}

      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Staff Directory & Employee Profiles</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage employee master data, statutory tax IDs (TIN & NIC), base salaries, and bank accounts.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 flex items-center space-x-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Employee</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, employee ID, NIC, or TIN..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </form>

        {/* Department Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
          {departmentsList.map((dept) => (
            <button
              key={dept}
              onClick={() => setDepartment(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                department === dept
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Data Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading employees database...
          </div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No employees found matching the filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Department & Role</th>
                  <th className="px-5 py-3.5">NIC & TIN Numbers</th>
                  <th className="px-5 py-3.5">Monthly Base (LKR)</th>
                  <th className="px-5 py-3.5">Disbursement Bank</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Employee Identity */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <img
                          src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                          alt={emp.firstName}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                            <span>{emp.firstName} {emp.lastName}</span>
                            <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-semibold">
                              {emp.employeeNumber}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">{emp.user?.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department & Role */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">{emp.designation}</div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{emp.department}</span>
                      </div>
                    </td>

                    {/* NIC & TIN */}
                    <td className="px-5 py-3.5">
                      <div className="text-slate-800 font-mono text-[11px]">NIC: {emp.nicNumber}</div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">TIN: {emp.taxIdentificationNumber}</div>
                    </td>

                    {/* Base Salary */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{formatLKR(emp.baseSalary)}</div>
                      <div className="text-[10px] text-slate-400">Monthly Contractual</div>
                    </td>

                    {/* Bank Account */}
                    <td className="px-5 py-3.5">
                      <div className="text-slate-800 font-medium">{emp.bankName}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        A/C: ****{emp.accountNumber?.slice(-4) || '----'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        emp.employmentStatus === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {emp.employmentStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openDetail(emp)}
                          title="View Profile Details"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(emp)}
                          title="Edit Employee"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(emp)}
                          title="Delete Employee"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Add New Employee */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Register New Employee (Sri Lanka Payroll)</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">First Name *</label>
                  <input
                    required
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    placeholder="e.g. Kasun"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Last Name *</label>
                  <input
                    required
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    placeholder="e.g. Perera"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Work Email (Login ID) *</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    placeholder="name@payrolleey.lk"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Temporary Password</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Job Title / Designation *</label>
                  <input
                    required
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Department *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                    <option value="Design">Design</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
                <div className="font-bold text-blue-900 text-[11px] uppercase tracking-wider">
                  Sri Lanka Statutory Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700">Base Salary (LKR) *</label>
                    <input
                      required
                      type="number"
                      step="1000"
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">NIC Number *</label>
                    <input
                      required
                      type="text"
                      value={formData.nicNumber}
                      onChange={(e) => setFormData({ ...formData, nicNumber: e.target.value })}
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg font-mono"
                      placeholder="199012345678"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Tax Identification (TIN) *</label>
                    <input
                      required
                      type="text"
                      value={formData.taxIdentificationNumber}
                      onChange={(e) => setFormData({ ...formData, taxIdentificationNumber: e.target.value })}
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg font-mono"
                      placeholder="TIN-100234567"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Branch Name</label>
                  <input
                    type="text"
                    value={formData.bankBranch}
                    onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Account Number</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    placeholder="8001045920"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    placeholder="+94 77 123 4567"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Residential Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    placeholder="Colombo, Sri Lanka"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md flex items-center space-x-1"
                >
                  {actionLoading ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Employee */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 bg-gradient-to-r from-indigo-700 to-purple-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center space-x-2">
                <Edit2 className="w-5 h-5" />
                <span>Modify Profile: {selectedEmployee.firstName} {selectedEmployee.lastName} ({selectedEmployee.employeeNumber})</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                    <option value="Design">Design</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Compensation & Tax Configuration
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700">Monthly Base (LKR)</label>
                    <input
                      type="number"
                      step="1000"
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">NIC Number</label>
                    <input
                      type="text"
                      value={formData.nicNumber}
                      onChange={(e) => setFormData({ ...formData, nicNumber: e.target.value })}
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">TIN Number</label>
                    <input
                      type="text"
                      value={formData.taxIdentificationNumber}
                      onChange={(e) => setFormData({ ...formData, taxIdentificationNumber: e.target.value })}
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Branch Name</label>
                  <input
                    type="text"
                    value={formData.bankBranch}
                    onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Account Number</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-md flex items-center space-x-1"
                >
                  {actionLoading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Employee Details Slide-out / Modal */}
      {showDetailModal && selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={selectedEmployee.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                  alt={selectedEmployee.firstName}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-400"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 font-mono font-semibold">
                      {selectedEmployee.employeeNumber}
                    </span>
                    <span className="text-xs text-slate-300">{selectedEmployee.department}</span>
                  </div>
                  <h3 className="text-xl font-bold mt-1">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedEmployee.designation}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-white/80 hover:text-white p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-700">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Base Salary</div>
                  <div className="text-base font-bold text-slate-900 mt-1">{formatLKR(selectedEmployee.baseSalary)}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">NIC Number</div>
                  <div className="text-xs font-mono font-semibold text-slate-800 mt-1">{selectedEmployee.nicNumber}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Sri Lanka TIN</div>
                  <div className="text-xs font-mono font-semibold text-slate-800 mt-1">{selectedEmployee.taxIdentificationNumber}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Join Date</div>
                  <div className="text-xs font-semibold text-slate-800 mt-1">{formatDate(selectedEmployee.joinDate)}</div>
                </div>
              </div>

              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2">
                <div className="font-bold text-blue-900 text-xs flex items-center space-x-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Salary Remittance Banking Coordinates</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>Bank: <strong className="text-slate-900">{selectedEmployee.bankName}</strong></div>
                  <div>Branch: <strong className="text-slate-900">{selectedEmployee.bankBranch}</strong></div>
                  <div>Account: <strong className="text-slate-900 font-mono">{selectedEmployee.accountNumber}</strong></div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 text-xs">Contact & Residence</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Phone: <span className="text-slate-700 font-medium">{selectedEmployee.phone || 'Not provided'}</span></div>
                  <div>Address: <span className="text-slate-700 font-medium">{selectedEmployee.address || 'Not provided'}</span></div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-200">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Delete Employee Record?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove <strong>{deleteTarget.firstName} {deleteTarget.lastName}</strong> ({deleteTarget.employeeNumber})? This will also remove their user account and associated history.
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleDelete(deleteTarget.id)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-md"
              >
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
