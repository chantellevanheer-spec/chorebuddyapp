import React from 'react';

export default function FeatureCard({ icon, title, description, color }) {
  const Icon = icon;
  return (
    <div className="funky-card p-8 text-center funky-card-hover">
      <div className={`mx-auto w-20 h-20 funky-button ${color} flex items-center justify-center mb-6`}>
        <Icon className="w-10 h-10 text-white" />
      </div>
      <h3 className="header-font text-3xl text-[#2B59C3] mb-4">{title}</h3>
      <p className="body-font-light text-gray-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}