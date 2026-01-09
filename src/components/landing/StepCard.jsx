import React from 'react';

export default function StepCard({ number, title, description, color }) {
  return (
    <div className="funky-card p-8 border-4 funky-card-hover" style={{ borderColor: color }}>
      <div className="flex items-center gap-6 mb-4">
        <div className="funky-button w-16 h-16 flex-shrink-0 flex items-center justify-center text-white header-font text-4xl" style={{ backgroundColor: color }}>
          {number}
        </div>
        <h3 className="header-font text-3xl text-[#2B59C3]">{title}</h3>
      </div>
      <p className="body-font-light text-gray-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}