import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTeam } from '../../context/TeamContext';
import projectService from '../../services/projectService';
import BaseModal from '../shared/BaseModal';

const BandwidthReportForm = ({
  report = null,
  onClose,
  onSubmit,
  existingReports = [],
  enforceUniqueMonth = false
}) => {
  const { currentTeam } = useTeam();
  const [projects, setProjects] = useState([]);
  const now = new Date();
  const getTotalAllocatedBandwidth = (sourceReport) => {
    if (!sourceReport?.allocations?.length) return 0;

    const percentageTotal = sourceReport.allocations.reduce(
      (sum, allocation) => sum + (Number(allocation.allocatedPercentage) || 0),
      0
    );
    if (percentageTotal > 0) {
      return Math.min(100, Math.max(0, Math.round(percentageTotal)));
    }

    const allocatedDays = sourceReport.allocations.reduce(
      (sum, allocation) => sum + (Number(allocation.allocatedDays) || 0),
      0
    );
    if (sourceReport.totalWorkingDays && allocatedDays > 0) {
      return Math.min(
        100,
        Math.max(0, Math.round((allocatedDays / sourceReport.totalWorkingDays) * 100))
      );
    }

    return 0;
  };

  const getAvailableBandwidth = (sourceReport) => {
    if (!sourceReport) return 100;
    if (typeof sourceReport.availableBandwidth === 'number') {
      return Math.min(100, Math.max(0, Math.round(sourceReport.availableBandwidth)));
    }

    const totalAllocatedBandwidth = getTotalAllocatedBandwidth(sourceReport);

    if (sourceReport.totalWorkingDays && sourceReport.availableDays != null) {
      const availablePercentage = Math.round(
        (Number(sourceReport.availableDays) / sourceReport.totalWorkingDays) * 100
      );
      return Math.min(100, Math.max(0, availablePercentage - totalAllocatedBandwidth));
    }

    if (sourceReport.availableDays != null) {
      return Math.min(
        100,
        Math.max(0, Math.round(Number(sourceReport.availableDays) - totalAllocatedBandwidth))
      );
    }

    return Math.max(0, 100 - totalAllocatedBandwidth);
  };

  const normalizeAllocations = (sourceReport) => {
    if (!sourceReport?.allocations) return [];
    return sourceReport.allocations.map((allocation) => {
      return {
        project: allocation.project?._id || allocation.project || ''
      };
    });
  };

  const buildFormData = (sourceReport) => {
    const initialAvailableBandwidth = getAvailableBandwidth(sourceReport);
    const initialHasBandwidth = initialAvailableBandwidth > 0;

    return {
      month: sourceReport?.month || now.getMonth() + 1,
      year: sourceReport?.year || now.getFullYear(),
      hasBandwidth: initialHasBandwidth,
      availablePercentage: initialHasBandwidth ? initialAvailableBandwidth : 0,
      allocations: normalizeAllocations(sourceReport)
    };
  };

  const [formData, setFormData] = useState(() => buildFormData(report));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (currentTeam) {
      fetchProjects();
    }
  }, [currentTeam]);

  useEffect(() => {
    setFormData(buildFormData(report));
    setErrors({});
  }, [report]);

  const fetchProjects = async () => {
    try {
      const response = await projectService.getProjects(currentTeam._id);
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (formData.hasBandwidth) {
      const percentage = Number(formData.availablePercentage);
      if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
        newErrors.availablePercentage = 'Enter available bandwidth percentage (1-100)';
      }
    }

    if (formData.allocations.length === 0) {
      newErrors.allocations = 'Add at least one project allocation';
    }

    if (enforceUniqueMonth && !report) {
      const duplicate = existingReports.some(
        (existing) => existing.month === formData.month && existing.year === formData.year
      );
      if (duplicate) {
        newErrors.period = 'You already submitted a bandwidth report for this month';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    const availableBandwidth = formData.hasBandwidth
      ? Math.min(100, Math.max(1, Number(formData.availablePercentage)))
      : 0;
    const normalizedAllocations = formData.allocations
      .filter((allocation) => allocation.project)
      .map((allocation) => ({
        project: allocation.project,
        allocatedPercentage: 0,
        allocatedDays: 0
      }));

    onSubmit({
      month: formData.month,
      year: formData.year,
      totalWorkingDays: 100,
      availableDays: availableBandwidth,
      allocations: normalizedAllocations,
      plannedLeave: [],
      notes: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['month', 'year'].includes(name)
        ? parseInt(value) || 0
        : name === 'availablePercentage'
          ? value === '' ? '' : Number(value)
          : value
    }));

    if (errors[name] || (errors.period && (name === 'month' || name === 'year'))) {
      setErrors(prev => ({ ...prev, [name]: '', period: '' }));
    }
  };

  const addAllocation = () => {
    setFormData(prev => ({
      ...prev,
      allocations: [
        ...prev.allocations,
        { project: '' }
      ]
    }));
  };

  const removeAllocation = (index) => {
    setFormData(prev => ({
      ...prev,
      allocations: prev.allocations.filter((_, i) => i !== index)
    }));
  };

  const updateAllocation = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      allocations: prev.allocations.map((alloc, i) =>
        i === index
          ? { ...alloc, [field]: value }
          : alloc
      )
    }));

    if (errors.allocations) {
      setErrors(prev => ({ ...prev, allocations: '' }));
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={`${report ? 'Edit' : 'Create'} Bandwidth Report`}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-6">
          {/* Period Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month *
              </label>
              <select
                name="month"
                value={formData.month}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!!report}
              >
                {monthNames.map((month, index) => (
                  <option key={index + 1} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year *
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="2020"
                max="2030"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!!report}
              />
            </div>
          </div>
          {errors.period && (
            <p className="text-sm text-red-600">{errors.period}</p>
          )}

          {/* Bandwidth Availability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Do you have any bandwidth this month?
            </label>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="hasBandwidth"
                  value="yes"
                  checked={formData.hasBandwidth === true}
                  onChange={() => setFormData(prev => ({
                    ...prev,
                    hasBandwidth: true,
                    availablePercentage: prev.availablePercentage > 0 ? prev.availablePercentage : 100
                  }))}
                  className="text-blue-600 focus:ring-blue-500"
                />
                Yes
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="hasBandwidth"
                  value="no"
                  checked={formData.hasBandwidth === false}
                  onChange={() => setFormData(prev => ({
                    ...prev,
                    hasBandwidth: false,
                    availablePercentage: 0
                  }))}
                  className="text-blue-600 focus:ring-blue-500"
                />
                No
              </label>
            </div>
            {formData.hasBandwidth && (
              <div className="mt-4 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available bandwidth (%) *
                </label>
                <input
                  type="number"
                  name="availablePercentage"
                  min="1"
                  max="100"
                  value={formData.availablePercentage}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.availablePercentage && (
                  <p className="mt-1 text-sm text-red-600">{errors.availablePercentage}</p>
                )}
              </div>
            )}
          </div>

          {/* Project Allocations */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Project Allocations
              </label>
              <button
                type="button"
                onClick={addAllocation}
                className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </button>
            </div>

            {formData.allocations.map((allocation, index) => (
              <div key={index} className="flex gap-3 mb-3">
                <select
                  value={allocation.project}
                  onChange={(e) => updateAllocation(index, 'project', e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>{project.name}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => removeAllocation(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}

            {errors.allocations && (
              <p className="mt-1 text-sm text-red-600">{errors.allocations}</p>
            )}

          </div>

        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {report ? 'Update Report' : 'Create Report'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export default BandwidthReportForm;
