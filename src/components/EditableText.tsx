import React, { useState, useCallback, useEffect } from 'react';

interface EditableTextProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  inputClassName?: string;
  isEditing?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
  allowClickToEdit?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = ({ 
  value, 
  onSave, 
  className = "", 
  inputClassName = "",
  isEditing: controlledIsEditing,
  onEditingChange,
  allowClickToEdit = true
}) => {
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const isEditing = controlledIsEditing !== undefined ? controlledIsEditing : internalIsEditing;
  const setIsEditing = useCallback((val: boolean) => {
    if (onEditingChange) onEditingChange(val);
    setInternalIsEditing(val);
  }, [onEditingChange]);

  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = useCallback(() => {
    if (tempValue.trim() && tempValue !== value) {
      onSave(tempValue.trim());
    } else {
      setTempValue(value);
    }
    setIsEditing(false);
  }, [tempValue, value, onSave, setIsEditing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setTempValue(value);
      setIsEditing(false);
    }
  }, [handleSave, value, setIsEditing]);

  if (isEditing) {
    return (
      <input
        autoFocus
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`w-full font-bold outline-none ring-0 focus:ring-0 bg-white border-2 border-blue-500 px-2 py-0.5 rounded-lg shadow-sm ${className} ${inputClassName}`}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <div
      onClick={(e) => {
        if (!allowClickToEdit) return;
        e.stopPropagation();
        setIsEditing(true);
      }}
      className={`w-full font-bold px-2 py-0.5 border-2 border-transparent ${allowClickToEdit ? 'cursor-pointer hover:text-blue-600' : ''} ${className}`}
    >
      {value}
    </div>
  );
};
