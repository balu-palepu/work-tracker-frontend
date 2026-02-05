import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTeam } from '../../context/TeamContext';
import { ChevronDown, Check, Users, Plus } from 'lucide-react';

const TeamSwitcher = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTeam, teams, selectTeam } = useTeam();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTeamSwitch = async (teamId) => {
    if (teamId === currentTeam?._id) {
      setIsOpen(false);
      return;
    }

    try {
      await selectTeam(teamId);
      setIsOpen(false);

      const { pathname, search, hash } = location;
      if (pathname.startsWith('/teams/')) {
        const nextPath = pathname.replace(/\/teams\/[^/]+/, `/teams/${teamId}`);
        navigate(`${nextPath}${search}${hash}`);
      }
    } catch (error) {
      console.error('Error switching team:', error);
    }
  };

  const handleViewAllTeams = () => {
    setIsOpen(false);
    navigate('/teams');
  };

  if (!currentTeam) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {currentTeam.logo ? (
          <img
            src={currentTeam.logo}
            alt={currentTeam.name}
            className="w-6 h-6 rounded object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
        )}
        <span className="font-medium text-gray-900 hidden sm:inline">
          {currentTeam.name}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-3 py-2 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase">Your Teams</p>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {teams.map((team) => (
              <button
                key={team._id}
                onClick={() => handleTeamSwitch(team._id)}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  {team.logo ? (
                    <img
                      src={team.logo}
                      alt={team.name}
                      className="w-6 h-6 rounded object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{team.name}</p>
                    <p className="text-xs text-gray-500">{team.userRole}</p>
                  </div>
                </div>
                {team._id === currentTeam._id && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 mt-2 pt-2">
            <button
              onClick={handleViewAllTeams}
              className="w-full px-3 py-2 flex items-center space-x-2 hover:bg-gray-50 transition-colors text-left"
            >
              <Plus className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">View all teams</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSwitcher;
