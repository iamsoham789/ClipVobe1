
import React from 'react';
import { 
  Menu,  Search
} from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

import { User } from '@supabase/supabase-js';

interface TopBarProps {
  toggleSidebar: () => void;
  showProfile: boolean;
  setShowProfile: (show: boolean) => void;


  user: User | null;
}

const TopBar: React.FC<TopBarProps> = ({ 
  toggleSidebar, 
  showProfile, 
  setShowProfile, 
  user 
}) => {
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-white mr-4 p-1 rounded hover:bg-gray-800"
        >
          <Menu size={20} />
        </button>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="bg-gray-800 text-white py-1.5 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-clipvobe-cyan w-64"
          />
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button 
          variant="secondary" 
          onClick={() => navigate('/pricing')}
          className="bg-clipvobe-cyan hover:bg-clipvobe-cyan/90 text-black"
        >
          Upgrade



        </Button>
        
        {user && (
          <button 
            className="flex items-center space-x-2 text-gray-400 hover:text-white pr-2 pl-1 py-1 rounded hover:bg-gray-800" 
            onClick={() => setShowProfile(!showProfile)}
          >
            <div className="w-8 h-8 rounded-full bg-clipvobe-cyan flex items-center justify-center text-black font-medium">







              {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0)}            </div>
          </button>
        )}
      </div>
    </header>
  );
};

export default TopBar;
