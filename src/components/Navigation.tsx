import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Activity, Home, Upload, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white shadow-lg border-b border-green-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-green-600" />
            <h1 className="text-xl font-bold text-gray-800">
              Nutrição <span className="text-green-600">Gabriela Feijó</span>
            </h1>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex space-x-6">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive('/')
                  ? 'bg-green-100 text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/patients"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive('/patients')
                  ? 'bg-green-100 text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Pacientes</span>
            </Link>

            <Link
              to="/import-csv"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive('/import-csv')
                  ? 'bg-green-100 text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <Upload className="h-4 w-4" />
              <span>Importar CSV</span>
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir menu">
                  <Menu className="h-6 w-6 text-gray-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <div className="p-4 border-b">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-6 w-6 text-green-600" />
                    <span className="font-semibold">Gabriela Feijó</span>
                  </div>
                </div>
                <nav className="flex flex-col p-2">
                  <Link
                    to="/"
                    className={`flex items-center space-x-3 px-4 py-3 rounded-md text-base ${
                      isActive('/')
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                    }`}
                  >
                    <Home className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/patients"
                    className={`flex items-center space-x-3 px-4 py-3 rounded-md text-base ${
                      isActive('/patients')
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                    }`}
                  >
                    <Users className="h-5 w-5" />
                    <span>Pacientes</span>
                  </Link>
                  <Link
                    to="/import-csv"
                    className={`flex items-center space-x-3 px-4 py-3 rounded-md text-base ${
                      isActive('/import-csv')
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                    }`}
                  >
                    <Upload className="h-5 w-5" />
                    <span>Importar CSV</span>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
