import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, Clock, Smile, Activity, ShieldCheck, List, FileText, PieChart, TrendingUp, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { toast } from 'react-toastify';
import activityService from '../services/activityService';
import reportService from '../services/reportService';
import { useTeam } from '../context/TeamContext';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';
import DownloadReportButton from '../components/shared/DownloadReportButton';

const Dashboard = () => {
  const { currentTeam } = useTeam();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // FIXED: Separate state for selected date
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [activity, setActivity] = useState({
    date: new Date().toISOString().split('T')[0],
    meetings: [],
    tasks: [],
    extraActivities: [],
    mood: 'neutral',
    productivity: 5,
    notes: ''
  });

  const [modal, setModal] = useState({ isOpen: false, type: '', index: null, data: {} });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: '', index: null, item: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // FIXED: Watch selectedDate instead of activity.date
  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // API CALL: Fetch using selectedDate
      const response = await activityService.getActivityByDate(selectedDate);
      if (response.data) {
        setActivity(response.data);
      } else {
        // FIXED: Use selectedDate, not current date
        setActivity({
          date: selectedDate,
          meetings: [],
          tasks: [],
          extraActivities: [],
          notes: '',
          mood: 'neutral',
          productivity: 5
        });
      }
    } catch (error) {
      toast.error('Error fetching data');
      // FIXED: On error, still preserve selected date
      setActivity({
        date: selectedDate,
        meetings: [],
        tasks: [],
        extraActivities: [],
        notes: '',
        mood: 'neutral',
        productivity: 5
      });
    } finally {
      setLoading(false);
    }
  };

  const formatUIDuration = (mins) => {
    if (!mins) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}hr ${m}m` : `${m}m`;
  };

  const syncWithBackend = async (updatedActivity) => {
    try {
      // API CALLS: Update or create activity
      if (updatedActivity._id) {
        await activityService.updateActivity(updatedActivity._id, updatedActivity);
      } else {
        const res = await activityService.createActivity(updatedActivity);
        setActivity(prev => ({ ...prev, _id: res.data._id }));
      }
    } catch (err) {
      toast.error('Sync failed');
    }
  };

  const openModal = (type, index = null) => {
    let initialData = {
      title: '', 
      durationValue: '30',
      summary: '', 
      description: '',
      status: 'pending',
      priority: 'medium',
      category: 'development',
      type: 'break'
    };
    
    if (index !== null) {
      const list = type === 'extra' ? 'extraActivities' : `${type}s`;
      const item = activity[list][index];
      const dur = type === 'task' ? item.timeSpent : item.duration;
      const normalizedStatus =
        item?.status === 'inprogress' ? 'in-progress' : item?.status;
      initialData = { ...item, status: normalizedStatus, durationValue: dur?.toString() || '30' };
    }
    setModal({ isOpen: true, type, index, data: initialData });
  };

  const handleModalSave = async () => {
    const listName = modal.type === 'extra' ? 'extraActivities' : `${modal.type}s`;
    const durationKey = modal.type === 'task' ? 'timeSpent' : 'duration';
    const mins = parseInt(modal.data.durationValue);

    // FIXED: Use selectedDate instead of activity.date
    const entryDate = new Date(selectedDate + 'T00:00:00');

    const normalizedStatus =
      modal.type === 'task' && modal.data?.status === 'inprogress'
        ? 'in-progress'
        : modal.data?.status;

    const entryData = { 
      ...modal.data,
      status: normalizedStatus,
      [durationKey]: mins,
      isConfidential: true,
      startTime: entryDate, 
      endTime: new Date(entryDate.getTime() + mins * 60000),
      createdAt: modal.index !== null ? modal.data.createdAt : new Date()
    };

    const newList = [...activity[listName]];
    if (modal.index !== null) newList[modal.index] = entryData;
    else newList.push(entryData);

    // FIXED: Ensure date is set to selectedDate
    const updatedActivity = { ...activity, [listName]: newList, date: selectedDate };
    setActivity(updatedActivity);
    setModal({ isOpen: false, type: '', index: null, data: {} });
    await syncWithBackend(updatedActivity);
  };

  const openDeleteModal = (type, index) => {
    const listName = type === 'extra' ? 'extraActivities' : `${type}s`;
    const item = activity[listName][index];
    setDeleteModal({ isOpen: true, type, index, item });
  };

  const handleDelete = async () => {
    const { type, index } = deleteModal;
    setIsDeleting(true);
    try {
      const listName = type === 'extra' ? 'extraActivities' : `${type}s`;
      const newList = activity[listName].filter((_, i) => i !== index);
      const updatedActivity = { ...activity, [listName]: newList };
      setActivity(updatedActivity);
      await syncWithBackend(updatedActivity);
      toast.success('Entry deleted successfully');
      setDeleteModal({ isOpen: false, type: '', index: null, item: null });
    } catch (error) {
      toast.error('Failed to delete entry');
    } finally {
      setIsDeleting(false);
    }
  };

  const meetMins = activity.meetings.reduce((acc, i) => acc + (i.duration || 0), 0);
  const taskMins = activity.tasks.reduce((acc, i) => acc + (i.timeSpent || 0), 0);
  const extraMins = activity.extraActivities.reduce((acc, i) => acc + (i.duration || 0), 0);
  const totalHoursNum = (meetMins + taskMins + extraMins) / 60;

  const getSummaryColor = (hrs) => {
    if (hrs >= 7) return 'bg-green-50 text-green-700 border-green-100';
    if (hrs >= 4) return 'bg-yellow-50 text-yellow-700 border-yellow-100';
    return 'bg-red-50 text-red-700 border-red-100';
  };

  // Show actual selected date, not "Today" text
  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const toDateInput = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = `${dateObj.getMonth() + 1}`.padStart(2, '0');
    const day = `${dateObj.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const changeSelectedDateBy = (offsetDays) => {
    const base = new Date(`${selectedDate}T00:00:00`);
    base.setDate(base.getDate() + offsetDays);
    setSelectedDate(toDateInput(base));
  };

  const todayDate = toDateInput(new Date());

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      {/* HEADER SECTION - DATE HANDLING */}
      <div className="mb-8 flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="bg-blue-50 p-2 rounded-lg">
            <Calendar className="text-blue-600" size={24} />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Viewing Activities For</label>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-800">
                {formatDateDisplay(selectedDate)}
              </span>
              <input 
                type="date" 
                className="text-sm border border-gray-200 rounded-lg px-3 py-1 cursor-pointer text-gray-600 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  if (newDate) {
                    setSelectedDate(newDate);
                  }
                }} 
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          <button
            onClick={() => changeSelectedDateBy(-1)}
            className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg flex gap-2"
          >
            <ChevronsLeft className="h-5 w-5" /> Previous
          </button>
          <button
            onClick={() => setSelectedDate(todayDate)}
            className="px-4 py-2 text-sm font-medium bg-black text-white hover:bg-gray-800 rounded-lg"
          >
            Today
          </button>
          <button
            onClick={() => changeSelectedDateBy(1)}
            className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg flex gap-2"
          >
            Next <ChevronsRight className="h-5 w-5" />
          </button>

          {currentTeam && (
            <div className="ml-2 border-l border-gray-200 pl-2">
              <DownloadReportButton
                label="Download"
                variant="secondary"
                disabled={downloading}
                options={[
                  {
                    key: 'today',
                    label: 'Current Day',
                    description: `Activity for ${new Date(selectedDate).toLocaleDateString()}`,
                    action: async () => {
                      setDownloading(true);
                      try {
                        await reportService.downloadMyActivity(currentTeam._id, {
                          startDate: selectedDate,
                          endDate: selectedDate
                        });
                      } finally {
                        setDownloading(false);
                      }
                    }
                  },
                  {
                    key: 'week',
                    label: 'This Week',
                    description: 'Activity for the current week',
                    action: async () => {
                      setDownloading(true);
                      try {
                        const today = new Date();
                        const startOfWeek = new Date(today);
                        startOfWeek.setDate(today.getDate() - today.getDay());
                        const endOfWeek = new Date(startOfWeek);
                        endOfWeek.setDate(startOfWeek.getDate() + 6);
                        await reportService.downloadMyActivity(currentTeam._id, {
                          startDate: startOfWeek.toISOString().split('T')[0],
                          endDate: endOfWeek.toISOString().split('T')[0]
                        });
                      } finally {
                        setDownloading(false);
                      }
                    }
                  },
                  {
                    key: 'month',
                    label: 'This Month',
                    description: 'Activity for the current month',
                    action: async () => {
                      setDownloading(true);
                      try {
                        const today = new Date();
                        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                        await reportService.downloadMyActivity(currentTeam._id, {
                          startDate: startOfMonth.toISOString().split('T')[0],
                          endDate: endOfMonth.toISOString().split('T')[0]
                        });
                      } finally {
                        setDownloading(false);
                      }
                    }
                  },
                  {
                    key: 'year',
                    label: 'This Year',
                    description: 'Activity for the current year',
                    action: async () => {
                      setDownloading(true);
                      try {
                        const today = new Date();
                        const startOfYear = new Date(today.getFullYear(), 0, 1);
                        await reportService.downloadMyActivity(currentTeam._id, {
                          startDate: startOfYear.toISOString().split('T')[0],
                          endDate: today.toISOString().split('T')[0]
                        });
                      } finally {
                        setDownloading(false);
                      }
                    }
                  }
                ]}
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            {['meeting', 'task', 'extra'].map((type) => {
              const list = type === 'extra' ? activity.extraActivities : activity[`${type}s`];
              const durationKey = type === 'task' ? 'timeSpent' : 'duration';
              return (
                <div key={type} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 capitalize flex items-center gap-2">
                      <List size={18} /> {type === 'extra' ? 'Extra Activities' : `${type}s`}
                    </h3>
                    <button onClick={() => openModal(type)} className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700">
                      + Add {type}
                    </button>
                  </div>
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-gray-100">
                      {list.length > 0 ? list.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 group">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                              {item.title} {item.isConfidential && <ShieldCheck size={12} className="text-blue-500" />}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {item.summary || item.description || <span className="italic text-gray-300">No details provided</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">
                            {formatUIDuration(item[durationKey])}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => openModal(type, idx)} className="p-2 text-gray-400 hover:text-blue-600"><Edit size={18} /></button>
                              <button onClick={() => openDeleteModal(type, idx)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-400 italic">No {type}s added yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-700"><PieChart size={20} className="text-blue-500" /> Time Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-medium"><span className="text-gray-500">Meetings</span><span className="text-gray-800">{formatUIDuration(meetMins)}</span></div>
                <div className="flex justify-between text-xs font-medium"><span className="text-gray-500">Tasks</span><span className="text-gray-800">{formatUIDuration(taskMins)}</span></div>
                <div className="flex justify-between text-xs font-medium"><span className="text-gray-500">Extras</span><span className="text-gray-800">{formatUIDuration(extraMins)}</span></div>
                <div className={`mt-4 text-center py-4 rounded-xl border-2 ${getSummaryColor(totalHoursNum)}`}>
                  <p className="text-3xl font-black">{totalHoursNum.toFixed(1)}</p>
                  <p className="text-[10px] font-bold uppercase">Total Hours</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-700"><Smile size={20} className="text-orange-500" /> Mood & Focus</h3>
              <select className="w-full border-gray-100 bg-gray-50 rounded-lg p-2 text-sm mb-4 outline-none" value={activity.mood} onChange={(e) => {const u = {...activity, mood: e.target.value, date: selectedDate}; setActivity(u); syncWithBackend(u);}}>
                <option value="excellent">Excellent </option><option value="good">Good</option><option value="neutral">Neutral </option><option value="tired">Tired </option><option value="stressed">Stressed</option>
              </select>
              <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Productivity</label><span className="text-xs font-bold text-blue-600">{activity.productivity}/10</span></div>
              <input type="range" min="1" max="10" className="w-full h-1.5 bg-blue-100 rounded-lg appearance-none cursor-pointer" value={activity.productivity} onChange={(e) => setActivity({...activity, productivity: parseInt(e.target.value)})} onMouseUp={() => syncWithBackend({...activity, date: selectedDate})} />
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-700"><FileText size={20} className="text-gray-400" /> Daily Notes</h3>
              <textarea className="w-full border-none bg-gray-50 rounded-xl p-3 text-sm h-32 outline-none focus:ring-1 focus:ring-blue-500 resize-none" placeholder="Enter Daily notes" value={activity.notes} onChange={(e) => setActivity({...activity, notes: e.target.value})} onBlur={() => syncWithBackend({...activity, date: selectedDate})} />
            </div>
          </div>
        </div>
      )}

      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800 capitalize">
                {modal.index !== null ? 'Edit' : 'Add'} {modal.type === 'extra' ? 'Extra Activity' : modal.type}
              </h2>
              <button onClick={() => setModal({isOpen: false, type: '', index: null, data: {}})} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            
            <div className="p-8 space-y-5 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Title</label>
                <input className="w-full border-gray-100 bg-gray-50 rounded-lg p-3 font-semibold outline-none focus:ring-1 focus:ring-blue-500" value={modal.data.title} onChange={e => setModal({...modal, data: {...modal.data, title: e.target.value}})} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                  {modal.type === 'task' ? 'Time Spent' : 'Duration'}
                </label>
                <select className="w-full border-gray-100 bg-gray-50 rounded-lg p-3 outline-none focus:ring-1 focus:ring-blue-500" value={modal.data.durationValue} onChange={e => setModal({...modal, data: {...modal.data, durationValue: e.target.value}})}>
                  {[5,10,15,20,25,30,45,60,90,120,180,240,300,360,420,480].map(m => (
                    <option key={m} value={m}>{m} minutes {m >= 60 && `(${formatUIDuration(m)})`}</option>
                  ))}
                </select>
              </div>

              {modal.type === 'task' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Status</label>
                      <select className="w-full border-gray-100 bg-gray-50 rounded-lg p-2 text-sm outline-none" value={modal.data.status} onChange={e => setModal({...modal, data: {...modal.data, status: e.target.value}})}>
                        <option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Priority</label>
                      <select className="w-full border-gray-100 bg-gray-50 rounded-lg p-2 text-sm outline-none" value={modal.data.priority} onChange={e => setModal({...modal, data: {...modal.data, priority: e.target.value}})}>
                        <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Category</label>
                    <select className="w-full border-gray-100 bg-gray-50 rounded-lg p-2 text-sm outline-none" value={modal.data.category} onChange={e => setModal({...modal, data: {...modal.data, category: e.target.value}})}>
                      <option value="development">Development</option><option value="testing">Testing</option><option value="deployment">Deployment</option><option value="documentation">Documentation</option><option value="other">Other</option>
                    </select>
                  </div>
                </>
              )}

              {modal.type === 'extra' && (
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Activity Type</label>
                  <select className="w-full border-gray-100 bg-gray-50 rounded-lg p-2 text-sm outline-none" value={modal.data.type} onChange={e => setModal({...modal, data: {...modal.data, type: e.target.value}})}>
                    <option value="break">Break</option><option value="training">Training</option><option value="learning">Learning</option><option value="other">Other</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Description</label>
                <textarea className="w-full border-gray-100 bg-gray-50 rounded-lg p-3 h-24 outline-none focus:ring-1 focus:ring-blue-500 resize-none" value={modal.data.summary || modal.data.description || ''} onChange={e => {
                  const f = modal.type === 'meeting' ? 'summary' : 'description';
                  setModal({...modal, data: {...modal.data, [f]: e.target.value}});
                }} />
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setModal({isOpen: false, type: '', index: null, data: {}})} className="px-6 py-2 text-gray-500 font-bold hover:text-gray-700">Cancel</button>
              <button onClick={handleModalSave} className="bg-blue-600 text-white font-bold px-8 py-2 rounded-xl shadow-lg hover:bg-blue-700">Save Entry</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: '', index: null, item: null })}
        onConfirm={handleDelete}
        itemName={deleteModal.item?.title || 'this entry'}
        itemType={deleteModal.type === 'extra' ? 'activity' : deleteModal.type}
        loading={isDeleting}
      />
    </div>
  );
};

export default Dashboard;
