import React from 'react';
import { MdPrint } from 'react-icons/md';

export default function PrintButton({ mapInstance }) {
  // Handler for print
  const handlePrint = () => {
    if (window.L && mapInstance && mapInstance.printControl) {
      mapInstance.printControl.printMap();
    } else {
      window.print(); // fallback: print the page
    }
  };

  return (
    <button
      onClick={handlePrint}
      className="bg-white rounded-full shadow p-2 mb-2 flex items-center justify-center"
      aria-label="Print map"
      title="Print map"
      type="button"
    >
      <MdPrint size={24} color="#1976d2" />
    </button>
  );
}
