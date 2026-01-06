import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import activityService from '../services/activityService';
import { Calendar, Clock, Users, CheckCircle } from 'lucide-react';

const History = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await activityService.getActivities({ limit: 30 });
      setActivities(response.data || []);
    } catch (error) {
      toast.error('Error loading activities');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      blocked: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Activity History</h1>
        <p className="text-gray-600 mt-1">View your past work activities</p>
      </div>

      {activities.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No activities recorded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity List */}
          <div className="lg:col-span-1 space-y-3">
            {activities.map((activity) => (
              <div
                key={activity._id}
                onClick={() => setSelectedActivity(activity)}
                className={`card cursor-pointer transition-all hover:shadow-md ${
                  selectedActivity?._id === activity._id ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {format(new Date(activity.date), 'MMM d, yyyy')}
                  </h3>
                  <span className="text-sm font-medium text-primary-600">
                    {activity.totalWorkHours}h
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{activity.meetings.length} meetings</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>{activity.tasks.length} tasks</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Activity Details */}
          <div className="lg:col-span-2">
            {selectedActivity ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {format(new Date(selectedActivity.date), 'EEEE, MMMM d, yyyy')}
                  </h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{selectedActivity.totalWorkHours} hours</span>
                    </div>
                    <span>•</span>
                    <span>Productivity: {selectedActivity.productivity}/10</span>
                    <span>•</span>
                    <span>Mood: {selectedActivity.mood}</span>
                  </div>
                </div>

                {/* Meetings */}
                {selectedActivity.meetings.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Users className="h-5 w-5 text-primary-600" />
                      <span>Meetings ({selectedActivity.meetings.length})</span>
                    </h3>
                    <div className="space-y-4">
                      {selectedActivity.meetings.map((meeting, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900">{meeting.title}</h4>
                            <span className="text-sm text-gray-600">{meeting.duration} min</span>
                          </div>
                          {meeting.summary && (
                            <p className="text-gray-600 text-sm">{meeting.summary}</p>
                          )}
                          {/* {meeting.isConfidential && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-2">
                              Confidential
                            </span>
                          )} */}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tasks */}
                {selectedActivity.tasks.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-primary-600" />
                      <span>Tasks ({selectedActivity.tasks.length})</span>
                    </h3>
                    <div className="space-y-4">
                      {selectedActivity.tasks.map((task, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900">{task.title}</h4>
                            <span className="text-sm text-gray-600">{task.timeSpent} min</span>
                          </div>
                          {task.description && (
                            <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <span className={`badge ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                            <span className={`badge ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className="badge badge-info">{task.category}</span>
                            {/* {task.isConfidential && (
                              <span className="badge" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
                                Confidential
                              </span>
                            )} */}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extra Activities */}
                {selectedActivity.extraActivities.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Extra Activities ({selectedActivity.extraActivities.length})
                    </h3>
                    <div className="space-y-4">
                      {selectedActivity.extraActivities.map((extra, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900">{extra.title}</h4>
                            <span className="text-sm text-gray-600">{extra.duration} min</span>
                          </div>
                          {extra.description && (
                            <p className="text-gray-600 text-sm mb-2">{extra.description}</p>
                          )}
                          <span className="badge badge-info">{extra.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedActivity.notes && (
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedActivity.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="card text-center py-12">
                <p className="text-gray-600">Select an activity to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
