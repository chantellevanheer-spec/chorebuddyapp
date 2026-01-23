import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookTemplate, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function TemplateManager({ chores, onLoadTemplate, onDeleteTemplate, isTemplate, templateName, setIsTemplate, setTemplateName }) {
  const [showTemplates, setShowTemplates] = useState(false);
  
  const templates = chores.filter(c => c.is_template);

  const handleLoadTemplate = (template) => {
    const templateData = { ...template };
    delete templateData.id;
    delete templateData.created_date;
    delete templateData.updated_date;
    delete templateData.created_by;
    templateData.is_template = false;
    templateData.template_name = "";
    
    onLoadTemplate(templateData);
    setShowTemplates(false);
    toast.success(`Loaded template: ${template.template_name}`);
  };

  return (
    <div className="space-y-4 p-4 funky-card border-2 border-[#2B59C3] bg-blue-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookTemplate className="w-5 h-5 text-[#2B59C3]" />
          <h3 className="header-font text-xl text-[#2B59C3]">Chore Templates</h3>
        </div>
        {templates.length > 0 && (
          <Button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="funky-button bg-white text-[#2B59C3] border-2 border-[#2B59C3] px-3 py-1 text-sm"
          >
            {showTemplates ? 'Hide' : 'Show'} Templates ({templates.length})
          </Button>
        )}
      </div>

      {showTemplates && templates.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="body-font-light text-sm text-gray-700">Click to load a template:</p>
          {templates.map((template) => (
            <div key={template.id} className="flex items-center gap-2 funky-card p-3 border-2 border-[#2B59C3] bg-white">
              <Copy className="w-4 h-4 text-[#2B59C3]" />
              <span className="body-font text-sm flex-1">{template.template_name}</span>
              <Button
                type="button"
                size="sm"
                onClick={() => handleLoadTemplate(template)}
                className="funky-button bg-[#2B59C3] text-white px-3 py-1 text-xs"
              >
                Load
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => onDeleteTemplate(template.id)}
                className="h-8 w-8 hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 pt-3 border-t border-[#2B59C3]">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isTemplate}
            onChange={(e) => setIsTemplate(e.target.checked)}
            className="w-4 h-4 border-2 border-[#2B59C3] rounded"
          />
          <span className="body-font text-sm text-[#2B59C3]">
            💾 Save this as a reusable template
          </span>
        </label>
        
        {isTemplate && (
          <Input
            placeholder="Template name (e.g., 'Weekly Kitchen Clean')"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="funky-button border-2 border-[#2B59C3] body-font bg-white"
          />
        )}
      </div>

      {templates.length === 0 && (
        <p className="body-font-light text-xs text-gray-600">
          💡 Save chores as templates to quickly create similar chores later
        </p>
      )}
    </div>
  );
}