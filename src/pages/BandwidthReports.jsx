import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTeam } from '../context/TeamContext';
import { Plus, Calendar } from 'lucide-react';
import bandwidthService from '../services/bandwidthService';
import BandwidthReportForm from '../components/bandwidth/BandwidthReportForm';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';

const BandwidthReports = () => {
  const navigate = useNavigate();
  const { currentTeam, isAdmin } = useTeam();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, report: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const isTeamAdmin = isAdmin();

  useEffect(() => {
    if (currentTeam) {
      fetchReports();
    }
  }, [currentTeam, isTeamAdmin]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = isTeamAdmin
        ? await bandwidthService.getAllReports(currentTeam._id)
        : await bandwidthService.getMyReports(currentTeam._id);
      const reportsData = Array.isArray(response)
        ? response
        : (response?.data || response?.reports || []);
      setReports(reportsData);
    } catch (error) {
      toast.error('Error loading reports');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async (reportData) => {
    try {
      await bandwidthService.createReport(currentTeam._id, reportData);
      toast.success('Report created successfully!');
      setShowCreateModal(false);
      await fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating report');
      throw error;
    }
  };

  const handleUpdateReport = async (reportData) => {
    try {
      await bandwidthService.updateReport(currentTeam._id, editingReport._id, reportData);
      toast.success('Report updated successfully!');
      setEditingReport(null);
      await fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating report');
      throw error;
    }
  };

  const formatPeriodForDelete = (month, year) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[month - 1]} ${year}`;
  };

  const openDeleteModal = (report) => {
    setDeleteModal({ isOpen: true, report });
  };

  const handleDeleteReport = async () => {
    setIsDeleting(true);
    try {
      await bandwidthService.deleteReport(currentTeam._id, deleteModal.report._id);
      toast.success('Report deleted successfully!');
      await fetchReports();
      setDeleteModal({ isOpen: false, report: null });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting report');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatPeriod = (month, year) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[month - 1]} ${year}`;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const getAvailableBandwidth = (report) => {
    if (typeof report?.availableBandwidth === 'number') return report.availableBandwidth;
    if (report?.totalWorkingDays && report?.availableDays != null) {
      return Math.round((report.availableDays / report.totalWorkingDays) * 100);
    }
    if (report?.availableDays != null) return Math.round(report.availableDays);
    return 0;
  };

  const hasBandwidth = (report) => getAvailableBandwidth(report) > 0;

  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [reports]);

  const monthFilteredReports = useMemo(() => {
    if (selectedMonth === 'all') return sortedReports;
    return sortedReports.filter((report) => report.month === Number(selectedMonth));
  }, [selectedMonth, sortedReports]);

  const adminRows = useMemo(() => {
    if (!isTeamAdmin) return [];
    return monthFilteredReports.flatMap((report) => {
      const allocations = report.allocations && report.allocations.length > 0
        ? report.allocations
        : [null];
      return allocations.map((allocation) => ({ report, allocation }));
    });
  }, [isTeamAdmin, monthFilteredReports]);

  const filteredAdminRows = useMemo(() => {
    if (!isTeamAdmin) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return adminRows;
    return adminRows.filter(({ report, allocation }) => {
      const userName = report.user?.name || '';
      const userEmail = report.user?.email || '';
      const projectName = allocation?.project?.name || '';
      const period = formatPeriod(report.month, report.year);
      const bandwidthLabel = hasBandwidth(report) ? 'yes' : 'no';
      const haystack = `${userName} ${userEmail} ${projectName} ${period} ${report.month}/${report.year} ${bandwidthLabel}`;
      return haystack.toLowerCase().includes(term);
    });
  }, [adminRows, isTeamAdmin, searchTerm]);

  const adminSummary = useMemo(() => {
    if (!isTeamAdmin) return null;
    const uniqueUsers = new Set(monthFilteredReports.map((report) => report.user?._id || report.user));
    return {
      totalReports: monthFilteredReports.length,
      totalMembers: uniqueUsers.size
    };
  }, [isTeamAdmin, monthFilteredReports]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bandwidth Reports</h1>
            <p className="mt-2 text-gray-600">
              {isTeamAdmin
                ? 'Review team bandwidth submissions'
                : 'Submit your monthly bandwidth and project allocations'}
            </p>
          </div>
          {!isTeamAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Plus className="w-5 h-5 mr-2" />
              New Report
            </button>
          )}
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Months</option>
            {monthNames.map((month, index) => (
              <option key={index + 1} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>

        {isTeamAdmin ? (
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-gray-900">All Submissions</h2>
              {adminSummary && (
                <div className="text-sm text-gray-600">
                  Members with bandwidth: <span className="font-semibold text-gray-900">{adminSummary.totalMembers}</span>
                </div>
              )}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by user, project, month, or bandwidth"
                className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {filteredAdminRows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Available Bandwidth
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAdminRows.map(({ report, allocation }, index) => (
                      <tr key={`${report._id}-${allocation?._id || index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="font-medium">{report.user?.name || 'Unknown User'}</div>
                          <div className="text-xs text-gray-500">{report.user?.email || ''}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatPeriod(report.month, report.year)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {allocation?.project?.name || 'Unassigned'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {hasBandwidth(report)
                            ? `${getAvailableBandwidth(report)}%`
                            : 'No (0%)'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No bandwidth submissions found</p>
              </div>
            )}
          </div>
        ) : monthFilteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {monthFilteredReports.map(report => (
              <div
                key={report._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {formatPeriod(report.month, report.year)}
                      </h3>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Available Bandwidth:</span>
                      <span className="font-medium text-gray-900">
                        {hasBandwidth(report)
                          ? `${getAvailableBandwidth(report)}%`
                          : 'No (0%)'}
                      </span>
                    </div>
                  </div>

                  {/* Allocations */}
                  {report.allocations && report.allocations.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Project Allocations</p>
                      <div className="space-y-2">
                        {report.allocations.map((allocation, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-900">
                              {allocation.project?.name || 'Unknown Project'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Progress Bar removed for simplified bandwidth */}

                  {/* Actions */}
                  <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingReport(report)}
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal(report)}
                    className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-200">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first bandwidth report to share your availability
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Report
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingReport) && (
        <BandwidthReportForm
          report={editingReport}
          onClose={() => {
            setShowCreateModal(false);
            setEditingReport(null);
          }}
          onSubmit={editingReport ? handleUpdateReport : handleCreateReport}
          existingReports={reports}
          enforceUniqueMonth={!isTeamAdmin}
        />
      )}

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, report: null })}
        onConfirm={handleDeleteReport}
        itemName={deleteModal.report ? formatPeriodForDelete(deleteModal.report.month, deleteModal.report.year) : ''}
        itemType="bandwidth report"
        loading={isDeleting}
      />
    </div>
  );
};

export default BandwidthReports;
