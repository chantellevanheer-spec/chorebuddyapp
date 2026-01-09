
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export default function PlanCard({ plan, onSelectPlan, isCurrentPlan, disabled, billingCycle }) {
  const { name, price, yearlyPrice, features, icon: Icon, color, recommended } = plan;

  const displayPrice = billingCycle === 'yearly' && yearlyPrice ? yearlyPrice / 12 : price;
  const priceSuffix = billingCycle === 'yearly' && yearlyPrice ? '/mo (billed annually)' : '/mo';

  return (
    <div className={`funky-card p-4 md:p-8 text-center relative overflow-hidden border-4 ${color.border}`}>
      {recommended && (
        <div className="bg-[#FF6B35] text-white px-8 md:px-12 text-xs md:text-sm absolute top-0 right-0 header-font transform rotate-45 translate-x-1/4 md:translate-x-1/3 translate-y-2 md:translate-y-1/3">
          Popular
        </div>
      )}
      <div className={`mx-auto w-16 h-16 md:w-20 md:h-20 funky-button ${color.bg} flex items-center justify-center mb-4 md:mb-6`}>
        <Icon className={`w-8 h-8 md:w-10 md:h-10 ${color.icon}`} />
      </div>
      <h3 className="header-font text-2xl md:text-4xl text-[#2B59C3] mb-2">{name}</h3>
      <div className="h-20"> {/* Wrapper to prevent layout shift */}
        {price > 0 ? (
          <>
            <p className="header-font text-3xl md:text-5xl text-[#5E3B85] mb-2">
              ${displayPrice.toFixed(0)}
            </p>
            <p className="body-font-light text-xs md:text-sm text-gray-500 -mt-2">
              {priceSuffix}
            </p>
          </>
        ) : (
          <p className="header-font text-3xl md:text-5xl text-[#5E3B85]">Free</p>
        )}
      </div>

      <ul className="text-left my-4 md:my-6 space-y-2 md:space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 md:gap-3">
            <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="body-font-light text-sm md:text-base text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => onSelectPlan(plan.id)}
        disabled={isCurrentPlan || disabled}
        className={`funky-button w-full py-3 md:py-4 header-font text-lg md:text-xl ${
          isCurrentPlan ? 'bg-gray-300 text-gray-500' : `${color.button} text-white`
        }`}
      >
        {isCurrentPlan ? 'Current Plan' : `Choose ${name}`}
      </Button>
    </div>
  );
}
