import React, { useContext } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { ThemeContext } from '../context/ThemeContext';
import Icon from './Icon';
import NotificationBell from './NotificationBell.jsx';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { ChevronsLeft } from 'lucide-react';

const Navbar = ({ toggleSidebar, isSidebarCollapsed }) => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="bg-card text-card-foreground p-4 flex justify-between items-center shadow-lg">
      <div className="flex items-center space-x-4">
        <Button onClick={toggleSidebar} variant="ghost" size="icon">
          <ChevronsLeft className={`transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
        </Button>
        <Link to="/dashboard" className="text-2xl font-bold">
          Alea - Agnostic Learning Assistant
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        <NotificationBell />
        <Button onClick={toggleTheme} variant="ghost" size="icon">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="text-yellow-400" />
        </Button>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar>
                <AvatarImage src={user.photoURL} />
                <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate('/profile')}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleSignOut}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
};

export default Navbar;