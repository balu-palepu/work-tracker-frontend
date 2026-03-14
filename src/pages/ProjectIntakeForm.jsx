import { FileText, ShieldOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';

const ProjectIntakeForm = () => {
  const { isAdmin, isSME, teamMembership } = useTeam();
  const navigate = useNavigate();

  const isManager = teamMembership?.role === 'Manager';
  const hasAccess = isAdmin() || isManager || isSME();

  if (!hasAccess) {
    return (
      <div className="min-h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ShieldOff className="w-6 h-6 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Access Restricted</h2>
          <p className="text-sm text-gray-500 mb-4">This page is only available to Admins, Managers, and SMEs.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-8 py-10 border-b border-gray-100 bg-gradient-to-br from-slate-50 to-gray-100">
            <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center mb-5">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Project Intake Form</h1>
            <p className="mt-2 text-gray-600">This page is still under development.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectIntakeForm;
