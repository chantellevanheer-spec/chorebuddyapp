import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

export default function SubTaskManager({ subTasks, setSubTasks }) {
  const [newSubTask, setNewSubTask] = useState("");

  const addSubTask = () => {
    if (!newSubTask.trim()) return;
    
    const newTask = {
      id: Date.now().toString(),
      title: newSubTask.trim(),
      completed: false
    };
    
    setSubTasks([...(subTasks || []), newTask]);
    setNewSubTask("");
  };

  const removeSubTask = (id) => {
    setSubTasks((subTasks || []).filter(task => task.id !== id));
  };

  return (
    <div className="space-y-3">
      <label className="body-font text-base text-[#5E3B85] block">
        Sub-Tasks (Optional)
      </label>
      <p className="body-font-light text-sm text-gray-600">
        Break down complex chores into smaller steps
      </p>
      
      <div className="space-y-2">
        {(subTasks || []).map((task) => (
          <div key={task.id} className="flex items-center gap-2 funky-card p-3 border-2 border-gray-300">
            <span className="body-font text-sm flex-1">{task.title}</span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => removeSubTask(task.id)}
              className="h-8 w-8 hover:bg-red-100"
            >
              <X className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add a sub-task..."
          value={newSubTask}
          onChange={(e) => setNewSubTask(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addSubTask();
            }
          }}
          className="funky-button border-2 border-[#5E3B85] body-font bg-white"
        />
        <Button
          type="button"
          onClick={addSubTask}
          className="funky-button bg-[#C3B1E1] text-white px-4"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}