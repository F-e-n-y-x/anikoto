'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ClearHistoryDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ClearHistoryDialog({ isOpen, onConfirm, onClose }: ClearHistoryDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#181818] border border-[#262626] max-w-sm w-full p-5 rounded-2xs space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Clear Watch History?</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed">
          Are you sure you want to clear your entire watch history? This action cannot be undone.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white bg-[#121212] border border-[#2a2a2a] rounded-2xs"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xs flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface RemoveItemDialogProps {
  isOpen: boolean;
  title?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function RemoveItemDialog({ isOpen, title, onConfirm, onClose }: RemoveItemDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#181818] border border-[#262626] max-w-sm w-full p-5 rounded-2xs space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
            <Trash2 className="w-4 h-4" />
            <span>Remove Entry?</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed">
          Remove &quot;{title || 'this entry'}&quot; from your watch history?
        </p>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white bg-[#121212] border border-[#2a2a2a] rounded-2xs"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xs"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
