import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';
import bandwidthService from '../services/bandwidthService';
import projectService from '../services/projectService';
import { Plus, Trash2, ArrowLeft, AlertCircle } from 'lucide-react';

const CreateBandwidthReport = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useTeam();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [existingReports, setExistingReports] = useState([]);

  // Current month and year
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  // Form data
  const [hasBandwidth, setHasBandwidth] = useState(true);
  const [availablePercentage, setAvailablePercentage] = useState(100);
  const [allocations, setAllocations] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, [teamId]);

  const isTeamAdmin = isAdmin();

  useEffect(() => {
    fetchExistingReports();
  }, [teamId, isTeamAdmin]);

  const fetchProjects = async () => {
    try {
      const response = await projectService.getProjects(teamId);
      if (response.success) {
        setProjects(response.data);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const fetchExistingReports = async () => {
    if (isTeamAdmin) return;
    try {
      const response = await bandwidthService.getMyReports(teamId);
      const reportsData = Array.isArray(response)
        ? response
        : (response?.data || response?.reports || []);
      setExistingReports(reportsData);
    } catch (err) {
      console.error('Error fetching bandwidth reports:', err);
    }
  };

  const addAllocation = () => {
    setAllocations([
      ...allocations,
      {
        project: ''
      }
    ]);
  };

  const updateAllocation = (index, field, value) => {
    const updated = [...allocations];
    updated[index][field] = value;
    setAllocations(updated);
  };

  const removeAllocation = (index) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const isOverAllocated = () => {
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (allocations.length === 0) {
      setError('Please add at least one project allocation');
      return;
    }

    if (!isTeamAdmin) {
      const duplicate = existingReports.some(
        (report) => report.month === month && report.year === year
      );
      if (duplicate) {
        setError('You already submitted a bandwidth report for this month');
        return;
      }
    }

    if (hasBandwidth) {
      const percentage = Number(availablePercentage);
      if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
        setError('Enter available bandwidth percentage (1-100)');
        return;
      }
    }

    try {
      setLoading(true);

      const reportData = {
        month,
        year,
        totalWorkingDays: 100,
        availableDays: hasBandwidth ? Number(availablePercentage) : 0,
        allocations: allocations
          .filter(a => a.project)
          .map(a => ({
            project: a.project,
            allocatedPercentage: 0,
            allocatedDays: 0
          })),
        plannedLeave: [],
        notes: ''
      };

      await bandwidthService.createReport(teamId, reportData);

      alert('Report saved successfully');

      navigate(`/teams/${teamId}/bandwidth`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthNum) => {
    const date = new Date(2000, monthNum - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={`/teams/${teamId}/bandwidth`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create Bandwidth Report</h1>
          <p className="text-gray-600 mt-2">Submit your monthly availability and project allocations</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-900 font-medium">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Period Selection */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Period</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="input-field"
                  required
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {getMonthName(i + 1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="input-field"
                  min={2020}
                  max={2030}
                  required
                />
              </div>
            </div>
          </div>

          {/* Bandwidth */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Bandwidth Availability</h2>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="hasBandwidth"
                  value="yes"
                  checked={hasBandwidth === true}
                  onChange={() => {
                    setHasBandwidth(true);
                    if (availablePercentage <= 0) setAvailablePercentage(100);
                  }}
                  className="text-blue-600 focus:ring-blue-500"
                />
                Yes, I have bandwidth
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="hasBandwidth"
                  value="no"
                  checked={hasBandwidth === false}
                  onChange={() => {
                    setHasBandwidth(false);
                    setAvailablePercentage(0);
                  }}
                  className="text-blue-600 focus:ring-blue-500"
                />
                No bandwidth available
              </label>
            </div>
            {hasBandwidth && (
              <div className="mt-4 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available bandwidth (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={availablePercentage}
                  onChange={(e) => setAvailablePercentage(e.target.value === '' ? '' : Number(e.target.value))}
                  className="input-field"
                />
              </div>
            )}
          </div>

          {/* Project Allocations */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Project Allocations</h2>
              <button
                type="button"
                onClick={addAllocation}
                className="btn-secondary inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Allocation
              </button>
            </div>

            {allocations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No allocations yet. Click "Add Allocation" to start.
              </p>
            ) : (
              <div className="space-y-4">
                {allocations.map((allocation, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Project
                        </label>
                        <select
                          value={allocation.project}
                          onChange={(e) => updateAllocation(index, 'project', e.target.value)}
                          className="input-field"
                          required
                        >
                          <option value="">Select project</option>
                          {projects.map((project) => (
                            <option key={project._id} value={project._id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeAllocation(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Allocation Summary */}
            {allocations.length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Projects selected:</span>
                  <span className="font-bold text-blue-600">
                    {allocations.length}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 btn-primary px-6 py-3"
              disabled={loading || isOverAllocated()}
            >
              {loading ? 'Saving...' : 'Save Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBandwidthReport;
