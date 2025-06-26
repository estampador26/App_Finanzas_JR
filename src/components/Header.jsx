import React from 'react';

const Header = ({ title, subtitle, children }) => {
  return (
    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-base text-gray-500">
            {subtitle}
          </p>
        )}
      </div>
      {children && <div>{children}</div>}
    </div>
  );
};

export default Header;
