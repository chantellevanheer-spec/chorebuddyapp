
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export default function PlanCard({ plan, onSelectPlan, isCurrentPlan, disabled, billingCycle }) {
  const { name, price, yearlyPrice, features, icon: Icon, color, recommended } = plan;

  const displayPrice = billingCycle === 'yearly' && yearlyPrice ? yearlyPrice / 12 : price;
  const priceSuffix = billingCycle === 'yearly' && yearlyPrice ? '/mo (billed annually)' : '/mo';

  return (
    <div className={`funky-card p-4 md:p-6 text-center relative overflow-hidden border-4 ${color.border} flex flex-col`}>
      {recommended && (
        <div className="bg-[#FF6B35] text-white px-8 md:px-12 text-xs md:text-sm absolute top-0 right-0 header-font transform rotate-45 translate-x-1/4 md:translate-x-1/3 translate-y-2 md:translate-y-1/3">
          Popular
        </div>
      )}
      <div className={`mx-auto w-14 h-14 md:w-16 md:h-16 funky-button ${color.bg} flex items-center justify-center mb-3 md:mb-4`}>
        <Icon className={`w-7 h-7 md:w-8 md:h-8 ${color.icon}`} />
      </div>
      <h3 className="header-font text-2xl md:text-3xl text-[#2B59C3] mb-2">{name}</h3>
      <div className="h-16 md:h-20">
        {price > 0 ? (
          <>
            <p className="header-font text-3xl md:text-4xl text-[#5E3B85] mb-1">
              ${displayPrice.toFixed(0)}
            </p>
            <p className="body-font-light text-xs md:text-sm text-gray-500 -mt-1">
              {priceSuffix}
            </p>
          </>
        ) : (
          <p className="header-font text-3xl md:text-4xl text-[#5E3B85]">Free</p>
        )}
      </div>

      <ul className="text-left my-3 md:my-4 space-y-2 md:space-y-3 flex-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="body-font-light text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => onSelectPlan(plan.id)}
        disabled={isCurrentPlan || disabled}
        className={`funky-button w-full py-3 header-font text-base md:text-lg mt-auto ${
          isCurrentPlan ? 'bg-gray-300 text-gray-500' : `${color.button} text-white`
        }`}
      >
        {isCurrentPlan ? 'Current Plan' : `Choose ${name}`}
      </Button>
    </div>
  );
}
