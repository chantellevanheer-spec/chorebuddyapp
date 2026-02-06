
import React from 'react';
import { Shield, Lock, Eye, Cookie, FileText } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger } from
"@/components/ui/accordion";

export default function Privacy() {
  return (
    <div className="mx-4 md:mx-8 lg:mx-24 pb-40 space-y-8 lg:pb-8">
      {/* Header */}
      <div className="funky-card p-6 md:p-8">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="funky-button w-16 h-16 md:w-20 md:h-20 bg-[#5E3B85] flex items-center justify-center">
            <Shield className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <div>
            <h1 className="header-font text-4xl md:text-5xl text-[#2B59C3]">Legal Hub</h1>
            <p className="body-font-light text-gray-600 mt-2">Privacy Policy, Terms of Service, and more.</p>
          </div>
        </div>
      </div>

      {/* Legal Documents Overview */}
      <div className="funky-card p-8">
        <h2 className="header-font text-3xl text-[#2B59C3] mb-6">Our Commitment to You</h2>
        <div className="space-y-4 body-font-light text-gray-700 leading-relaxed">
          <p>
            Welcome to the ChoreBuddy Legal Hub. We are committed to protecting your privacy and being transparent about how we operate. Here you can find important legal documents that govern your use of our service.
          </p>
          <p>
            <strong>Last updated:</strong> February 6, 2026
          </p>
        </div>
      </div>

      {/* Detailed Information Accordion */}
      <div className="funky-card p-8">
        <Accordion type="multiple" className="w-full space-y-4">
          
          <AccordionItem value="privacy-policy" className="funky-card p-4 border-2 border-[#C3B1E1]">
            <AccordionTrigger className="header-font text-xl text-[#2B59C3] hover:no-underline">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5" /> Privacy Policy
              </div>
            </AccordionTrigger>
            <AccordionContent className="body-font-light text-gray-700 space-y-3 mt-4">
               <p><strong>What Data We Collect:</strong> We collect your name, email, family member details, chore data, and app usage information to provide and improve the ChoreBuddy service.</p>
              <p><strong>How We Use Your Data:</strong> Your data is used to deliver app functionality (like assigning chores), provide support, and enhance our services. <strong>We do not sell your personal data to third parties.</strong></p>
               <p><strong>Third Parties:</strong> We use trusted services like Base44 for our backend infrastructure and Google for authentication. These services adhere to strict data protection standards.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="terms-of-service" className="funky-card p-4 border-2 border-[#C3B1E1]">
            <AccordionTrigger className="header-font text-xl text-[#2B59C3] hover:no-underline">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" /> Terms of Service
              </div>
            </AccordionTrigger>
            <AccordionContent className="body-font-light text-gray-700 space-y-3 mt-4">
              <p><strong>User Accounts:</strong> You are responsible for maintaining the confidentiality of your account. You must be of the legal age to form a binding contract to create an account.</p>
              <p><strong>Subscriptions:</strong> Plans are billed on a recurring basis (monthly or yearly). You can cancel your subscription at any time from your account settings, with the cancellation taking effect at the end of the current billing period.</p>
              <p><strong>User Conduct:</strong> You agree not to use the service for any illegal or unauthorized purpose. You are responsible for all content you post.</p>
              <p><strong>Termination:</strong> We reserve the right to suspend or terminate your account if you violate these terms.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="cookie-policy" className="funky-card p-4 border-2 border-[#C3B1E1]">
            <AccordionTrigger className="header-font text-xl text-[#2B59C3] hover:no-underline">
              <div className="flex items-center gap-3">
                <Cookie className="w-5 h-5" /> Cookie Policy
              </div>
            </AccordionTrigger>
            <AccordionContent className="body-font-light text-gray-700 space-y-3 mt-4">
              <p><strong>What are cookies?</strong> Cookies are small text files stored on your device that help our app function correctly and improve your experience.</p>
              <p><strong>Essential Cookies:</strong> We use essential cookies for core functionalities like keeping you logged in and securing your session. These are required for the app to work.</p>
              <p><strong>Functional Cookies:</strong> We use functional cookies to remember your preferences (like notification settings) so you don't have to set them on every visit.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="your-rights" className="funky-card p-4 border-2 border-[#C3B1E1]">
            <AccordionTrigger className="header-font text-xl text-[#2B59C3] hover:no-underline">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5" /> Your Data Rights
              </div>
            </AccordionTrigger>
            <AccordionContent className="body-font-light text-gray-700 space-y-3 mt-4">
              <p>You have the right to access, correct, or request the deletion of your personal data. To exercise these rights, please contact us at the email address below.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Contact Information */}
      <div className="funky-card p-8 bg-[#C3B1E1]/10 border-4 border-[#C3B1E1]">
        <h2 className="header-font text-2xl text-[#2B59C3] mb-4">Contact Us</h2>
        <p className="body-font-light text-gray-700 mb-4">
          For any questions about these policies, please contact our legal team.
        </p>
        <p>Email: <a href="mailto:legal@chorebuddyapp.com" className="text-[#2B59C3] hover:underline">legal@chorebuddyapp.com</a></p>
      </div>
    </div>
  );
}
