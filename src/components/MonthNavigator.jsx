import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { format, addMonths, subMonths } from 'date-fns';
import es from 'date-fns/locale/es';

export default function MonthNavigator({ currentDate, setCurrentDate }) {

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <button 
        onClick={handlePrevMonth} 
        className="btn btn-ghost btn-circle"
        aria-label="Mes anterior"
      >
        <ChevronLeftIcon className="h-6 w-6" />
      </button>
      
      <div className="text-center w-48">
        <h2 className="text-xl md:text-2xl font-bold capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h2>
        <button 
          onClick={() => setCurrentDate(new Date())}
          className="text-sm text-blue-600 hover:underline"
        >
          Hoy
        </button>
      </div>

      <button 
        onClick={handleNextMonth} 
        className="btn btn-ghost btn-circle"
        aria-label="Mes siguiente"
      >
        <ChevronRightIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
