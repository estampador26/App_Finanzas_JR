import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { FiBell, FiUser } from 'react-icons/fi';
import { FaTachometerAlt, FaCalendarAlt, FaSyncAlt, FaDollarSign, FaTags, FaDatabase, FaArrowCircleDown, FaBars, FaTimes, FaSignOutAlt, FaCog } from 'react-icons/fa';

export default function Layout({ children }) {
  const [user] = useAuthState(auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [avatarError, setAvatarError] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: FaTachometerAlt },
    { name: 'Calendario', href: '/calendario', icon: FaCalendarAlt },
    { name: 'Pagos Recurrentes', href: '/pagos-recurrentes', icon: FaSyncAlt },
    { name: 'Ingresos', href: '/ingresos', icon: FaDollarSign },
    { name: 'Egresos', href: '/egresos', icon: FaArrowCircleDown },
    { name: 'Categorías', href: '/categorias', icon: FaTags },
    { name: 'Gestión de Datos', href: '/gestion-de-datos', icon: FaDatabase },
  ];

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium btn-hover-scale ${
      isActive
        ? 'bg-primary text-white'
        : 'text-neutral-300 hover:bg-primary-dark hover:text-white'
    }`;

  const mobileLinkClasses = ({ isActive }) =>
    `block px-3 py-2 rounded-md text-base font-medium btn-hover-scale ${
      isActive
        ? 'bg-primary text-white'
        : 'text-neutral-500 hover:bg-neutral-100 hover:text-primary'
    }`;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  const handleLogout = () => {
    signOut(auth).catch((error) => {
      console.error('Error signing out: ', error);
    });
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-2xl font-bold text-primary-500">FinanzasJR</Link>
              </div>
              {/* Desktop Navigation */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) => linkClasses(isActive)}
                  >
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Right side icons & Profile Dropdown (Desktop) */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <button type="button" className="p-1 rounded-full text-neutral-500 hover:text-primary focus:outline-none">
                <span className="sr-only">View notifications</span>
                <FiBell className="h-6 w-6" />
              </button>

              {/* Profile dropdown */}
              {user && (
                <div className="ml-3 relative" ref={menuRef}>
                  <div>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} type="button" className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" id="user-menu-button" aria-expanded="false" aria-haspopup="true">
                      <span className="sr-only">Open user menu</span>
                      <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden">
                        {(user.photoURL && !avatarError) ? (
                            <img 
                                className="h-full w-full object-cover" 
                                src={user.photoURL} 
                                alt="User profile" 
                                onError={() => setAvatarError(true)}
                            />
                        ) : (
                            <FiUser className="h-5 w-5 text-neutral-500" />
                        )}
                      </div>
                    </button>
                  </div>
                  {isMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabIndex="-1">
                      <Link to="/ajustes" className="w-full text-left block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100" role="menuitem" tabIndex="-1">
                        Ajustes
                      </Link>
                      <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100" role="menuitem" tabIndex="-1">
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="-mr-2 flex sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-neutral-500 hover:text-primary hover:bg-neutral-100 focus:outline-none"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <FaTimes className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <FaBars className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state. */}
        {isMobileMenuOpen && user && (
          <div className="sm:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => mobileLinkClasses(isActive)}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-neutral-200">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden">
                    {(user.photoURL && !avatarError) ? (
                        <img 
                            className="h-full w-full object-cover" 
                            src={user.photoURL} 
                            alt="User profile" 
                            onError={() => setAvatarError(true)}
                        />
                    ) : (
                        <FiUser className="h-6 w-6 text-neutral-500" />
                    )}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium leading-none text-neutral-800">{user.displayName}</div>
                  <div className="text-sm font-medium leading-none text-neutral-500">{user.email}</div>
                </div>
                <button
                  type="button"
                  className="ml-auto bg-white flex-shrink-0 p-1 rounded-full text-neutral-500 hover:text-primary focus:outline-none"
                >
                  <span className="sr-only">View notifications</span>
                  <FiBell className="h-6 w-6" />
                </button>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-neutral-600 hover:bg-neutral-100 hover:text-primary"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
