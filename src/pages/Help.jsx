
import React from 'react';
import { LifeBuoy, BookOpen, Lightbulb, Mail } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger } from
"@/components/ui/accordion";
import { Button } from '@/components/ui/button';

const faqs = [
{
  question: "How do I add a new family member?",
  answer: "Navigate to the 'Family' page from the sidebar menu. Click the 'Add Person' button, fill in their details (name, role, avatar color), and click 'Add Person' to save."
},
{
  question: "How does ChoreAI assignment work?",
  answer: "On the Dashboard, click the 'Assign Chores' button. Our ChoreAI (a feature on Basic and Premium plans) analyzes all your created chores, their difficulty, and your family members to create a fair and balanced schedule for the week. If you're on the Free plan, you will be prompted to upgrade to use this feature."
},
{
  question: "Can I customize the rewards in the Store?",
  answer: "Yes! Customizing the Rewards Store is a Premium feature. On the 'Store' page, you'll find an 'Admin Controls' section where you can add new reward items with custom names, point costs, and icons."
},
{
  question: "How are points calculated?",
  answer: "Points are awarded automatically when a chore is marked as complete. The standard point values are: Easy (10 points), Medium (20 points), and Hard (30 points). Points are deducted when a reward is redeemed from the store."
},
{
  question: "How do I change my subscription plan?",
  answer: "You can upgrade or manage your subscription at any time by visiting the 'Pricing' page, which can be accessed from the 'Upgrade' button in the sidebar. Select the plan you want and follow the prompts."
},
{
  question: "What happens if I have an issue with the app?",
  answer: "If you encounter any bugs or have issues, please reach out to our support team via the contact methods listed at the bottom of this page. We're here to help!"
}];


export default function Help() {
  return (
    <div className="mx-32 pb-32 space-y-8 lg:pb-8">
      {/* Header */}
      <div className="funky-card p-6 md:p-8">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="funky-button w-16 h-16 md:w-20 md:h-20 bg-[#2B59C3] flex items-center justify-center">
            <LifeBuoy className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <div>
            <h1 className="header-font text-4xl md:text-5xl text-[#2B59C3]">Help & Support</h1>
            <p className="body-font-light text-gray-600 mt-2">Find answers and get help with Chore Pals.</p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="funky-card p-8">
        <div className="flex items-center gap-4 mb-6">
          <BookOpen className="w-8 h-8 text-[#FF6B35]" />
          <h2 className="header-font text-3xl text-[#2B59C3]">Frequently Asked Questions</h2>
        </div>
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) =>
          <AccordionItem key={index} value={`item-${index}`} className="funky-card p-4 border-2 border-[#C3B1E1]">
              <AccordionTrigger className="header-font text-xl text-left text-[#2B59C3] hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="body-font-light text-gray-700 pt-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
      
      {/* Tips Section */}
      <div className="funky-card p-8 bg-blue-50 border-4 border-blue-200">
         <div className="flex items-center gap-4 mb-6">
          <Lightbulb className="w-8 h-8 text-yellow-500" />
          <h2 className="header-font text-3xl text-[#2B59C3]">Top Tips for Success</h2>
        </div>
        <ul className="list-disc pl-6 space-y-3 body-font-light text-gray-700">
            <li><strong>Be Consistent:</strong> Run the chore assignments every week to build a routine.</li>
            <li><strong>Get Creative with Rewards:</strong> Mix tangible treats (like ice cream) with privileges (like extra screen time) to keep things exciting.</li>
            <li><strong>Involve the Whole Family:</strong> Let everyone have a say in creating chores and rewards to increase buy-in.</li>
            <li><strong>Review Progress Together:</strong> Check the Schedule and Dashboard as a family to celebrate completed work and see what's left.</li>
        </ul>
      </div>

      {/* Contact Section */}
      <div className="funky-card p-8">
        <div className="flex items-center gap-4 mb-6">
          <Mail className="w-8 h-8 text-[#5E3B85]" />
          <h2 className="header-font text-3xl text-[#2B59C3]">Still Need Help?</h2>
        </div>
        <p className="body-font-light text-gray-700 mb-6">
          If you couldn't find the answer you were looking for, please don't hesitate to reach out to our friendly support team.
        </p>
        <a href="mailto:support@chorepals.app">
            <Button className="funky-button bg-[#FF6B35] text-white header-font text-xl px-8 py-6">
                Contact Support
            </Button>
        </a>
      </div>
    </div>);

}
