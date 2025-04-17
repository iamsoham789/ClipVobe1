
import React from 'react';
import { LogOut, X } from 'lucide-react';
import { Button } from '../ui/button';

interface ProfileModalProps {
  user: { name: string; email: string } | null;
  showProfile: boolean;
  setShowProfile: (show: boolean) => void;
  handleLogout: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ 
  user, 
  showProfile, 
  setShowProfile, 
  handleLogout 
}) => {
  if (!showProfile || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowProfile(false)}>
      <div className="glass-card max-w-md w-full rounded-xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Your Profile</h2>
          <button 
            onClick={() => setShowProfile(false)}
            className="text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-clipvobe-cyan/20 flex items-center justify-center text-clipvobe-cyan text-xl">
            {user.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{user.name}</h3>
            <p className="text-gray-400">{user.email}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-800 rounded-lg">
            <h4 className="text-white font-medium mb-2">Subscription Plan</h4>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Pro Creator</span>
              <Button variant="red" size="sm">Upgrade</Button>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">API Requests</span>
                <span className="text-gray-300">125 / 200</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="bg-red-600 h-full rounded-full" style={{ width: '62.5%' }}></div>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="w-full"
          >
            <LogOut size={16} className="mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
