import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { BookOpen, Download, Users, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const AGE_GROUP_LABELS = {
  preschool: '👶 Ages 3-5',
  elementary: '🎒 Ages 6-11', 
  teen: '🎓 Ages 12+',
  adult: '👤 Adults',
  all: '👨‍👩‍👧‍👦 All Ages'
};

const CATEGORY_COLORS = {
  quick_start: 'bg-green-100 border-green-400 text-green-800',
  deep_clean: 'bg-blue-100 border-blue-400 text-blue-800',
  outdoor: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  seasonal: 'bg-orange-100 border-orange-400 text-orange-800',
  custom: 'bg-purple-100 border-purple-400 text-purple-800'
};

export default function TemplateLibrary({ onApplyTemplate }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['chore-templates'],
    queryFn: () => base44.entities.ChoreTemplate.list('name')
  });

  const handleApplyTemplate = async (template) => {
    try {
      await onApplyTemplate(template.chores);
      toast.success(`Applied "${template.name}" template!`);
    } catch (error) {
      toast.error('Failed to apply template');
    }
  };

  const publicTemplates = templates.filter(t => t.is_public);
  const customTemplates = templates.filter(t => !t.is_public);

  if (isLoading) {
    return <div className="body-font-light text-gray-500 text-center py-8">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Public Templates */}
      {publicTemplates.length > 0 && (
        <div>
          <h3 className="header-font text-2xl text-[#2B59C3] mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Built-in Templates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publicTemplates.map((template) => (
              <motion.div
                key={template.id}
                whileHover={{ scale: 1.02 }}
                className={`funky-card p-6 border-3 ${CATEGORY_COLORS[template.category] || CATEGORY_COLORS.custom}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="body-font text-lg mb-1">{template.name}</h4>
                    <p className="body-font-light text-sm text-gray-600 mb-2">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="funky-button px-2 py-1 bg-white border-2">
                        {AGE_GROUP_LABELS[template.age_group]}
                      </span>
                      <span className="flex items-center gap-1 text-gray-600">
                        <Users className="w-3 h-3" />
                        {template.chores?.length || 0} chores
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleApplyTemplate(template)}
                  className="w-full funky-button bg-[#2B59C3] text-white mt-3"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Use This Template
                </Button>

                {/* Preview chores */}
                {selectedTemplate === template.id && (
                  <div className="mt-4 pt-4 border-t-2 border-dashed space-y-2">
                    {template.chores.map((chore, idx) => (
                      <div key={idx} className="text-xs bg-white/50 p-2 rounded">
                        <span className="body-font">{chore.title}</span>
                        <span className="body-font-light text-gray-500 ml-2">
                          ({chore.estimated_time}min)
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setSelectedTemplate(
                    selectedTemplate === template.id ? null : template.id
                  )}
                  className="w-full text-center mt-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  {selectedTemplate === template.id ? 'Hide' : 'Preview'} chores
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Templates */}
      {customTemplates.length > 0 && (
        <div>
          <h3 className="header-font text-2xl text-[#5E3B85] mb-4">
            Your Custom Templates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customTemplates.map((template) => (
              <div
                key={template.id}
                className="funky-card p-6 bg-purple-50 border-2 border-purple-300"
              >
                <h4 className="body-font text-lg mb-2">{template.name}</h4>
                <p className="body-font-light text-sm text-gray-600 mb-3">
                  {template.chores?.length || 0} chores
                </p>
                <Button
                  onClick={() => handleApplyTemplate(template)}
                  className="w-full funky-button bg-purple-500 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {publicTemplates.length === 0 && customTemplates.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="body-font text-gray-500">No templates available</p>
        </div>
      )}
    </div>
  );
}