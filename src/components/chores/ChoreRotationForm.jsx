import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, X, RotateCw } from "lucide-react";
import { useData } from '../contexts/DataContext';

export default function ChoreRotationForm({ formData, setFormData }) {
  const { people } = useData();

  const handleRotationToggle = (checked) => {
    setFormData({
      ...formData,
      manual_rotation_enabled: checked,
      auto_assign: !checked, // When rotation is enabled, disable auto-assign
      rotation_frequency: checked ? (formData.rotation_frequency || 'weekly') : undefined,
      rotation_person_order: checked ? (formData.rotation_person_order || []) : undefined,
      rotation_current_index: 0
    });
  };

  const handleAddPerson = (personId) => {
    if (!formData.rotation_person_order?.includes(personId)) {
      setFormData({
        ...formData,
        rotation_person_order: [...(formData.rotation_person_order || []), personId]
      });
    }
  };

  const handleRemovePerson = (personId) => {
    setFormData({
      ...formData,
      rotation_person_order: formData.rotation_person_order?.filter(id => id !== personId) || []
    });
  };

  const handleMoveUp = (index) => {
    if (index > 0) {
      const newOrder = [...(formData.rotation_person_order || [])];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      setFormData({ ...formData, rotation_person_order: newOrder });
    }
  };

  const handleMoveDown = (index) => {
    const order = formData.rotation_person_order || [];
    if (index < order.length - 1) {
      const newOrder = [...order];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setFormData({ ...formData, rotation_person_order: newOrder });
    }
  };

  const getPersonName = (personId) => {
    const person = people.find(p => p.id === personId);
    return person?.name || 'Unknown';
  };

  const availablePeople = people.filter(p => 
    !formData.rotation_person_order?.includes(p.id)
  );

  return (
    <div className="space-y-4 p-4 funky-card border-2 border-[#2B59C3] bg-blue-50">
      <div className="flex items-center gap-3 mb-4">
        <RotateCw className="w-6 h-6 text-[#2B59C3]" />
        <h3 className="header-font text-xl text-[#2B59C3]">🔄 Manual Rotation</h3>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox
          id="manual_rotation"
          checked={formData.manual_rotation_enabled || false}
          onCheckedChange={handleRotationToggle}
          className="border-2 border-[#2B59C3] mt-1"
        />
        <div>
          <Label htmlFor="manual_rotation" className="body-font text-base text-[#5E3B85]">
            Enable manual rotation for this chore
          </Label>
          <p className="body-font-light text-sm text-gray-600 mt-1">
            Override ChoreAI and automatically rotate this chore among specific people
          </p>
        </div>
      </div>

      {formData.manual_rotation_enabled && (
        <div className="space-y-4 mt-4 pl-6 border-l-4 border-[#2B59C3]">
          <div>
            <label className="body-font text-base text-[#5E3B85] mb-2 block">
              Rotation Frequency
            </label>
            <Select 
              value={formData.rotation_frequency || 'weekly'} 
              onValueChange={(value) => setFormData({ ...formData, rotation_frequency: value })}
            >
              <SelectTrigger className="funky-button border-2 border-[#2B59C3] body-font bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Every Week</SelectItem>
                <SelectItem value="bi_weekly">Every 2 Weeks</SelectItem>
                <SelectItem value="monthly">Every Month</SelectItem>
              </SelectContent>
            </Select>
            <p className="body-font-light text-xs text-gray-600 mt-1">
              The chore will automatically rotate to the next person based on this schedule
            </p>
          </div>

          <div>
            <label className="body-font text-base text-[#5E3B85] mb-2 block">
              Rotation Order ({formData.rotation_person_order?.length || 0} people)
            </label>
            
            {/* Current rotation list */}
            {formData.rotation_person_order && formData.rotation_person_order.length > 0 ? (
              <div className="space-y-2 mb-3">
                {formData.rotation_person_order.map((personId, index) => (
                  <div 
                    key={personId} 
                    className="funky-button flex items-center justify-between p-3 bg-white border-2 border-[#2B59C3]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="funky-button w-8 h-8 bg-[#2B59C3] text-white flex items-center justify-center text-sm header-font">
                        {index + 1}
                      </span>
                      <span className="body-font text-[#5E3B85]">{getPersonName(personId)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="h-8 w-8"
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === formData.rotation_person_order.length - 1}
                        className="h-8 w-8"
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemovePerson(personId)}
                        className="h-8 w-8 hover:bg-red-100"
                        title="Remove"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="body-font-light text-sm text-gray-600 mb-3 p-3 bg-white rounded-lg border-2 border-dashed border-gray-300">
                No people in rotation yet. Add people below to start the rotation.
              </p>
            )}

            {/* Add person selector */}
            {availablePeople.length > 0 && (
              <div className="flex gap-2">
                <Select onValueChange={handleAddPerson}>
                  <SelectTrigger className="funky-button border-2 border-[#2B59C3] body-font bg-white">
                    <SelectValue placeholder="Add person to rotation..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePeople.map(person => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {availablePeople.length === 0 && formData.rotation_person_order?.length > 0 && (
              <p className="body-font-light text-xs text-green-600 mt-2">
                ✓ All family members are included in the rotation
              </p>
            )}
          </div>

          <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-3">
            <p className="body-font-light text-xs text-blue-800">
              💡 <strong>How it works:</strong> When you assign chores, this task will automatically go to the next person in the rotation. The rotation advances each time based on your frequency setting.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}