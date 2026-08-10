import React, { useRef } from 'react';
import { User, Upload, X, Trash2, Camera } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileImage: string | null;
  onUpdateProfileImage: (image: string | null) => void;
  profileName: string;
  onUpdateProfileName: (name: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profileImage,
  onUpdateProfileImage,
  profileName,
  onUpdateProfileName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          onUpdateProfileImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 p-6 flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-transform active:scale-95 cursor-pointer"
          title="Close Profile"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-black text-amber-400 mb-6 flex items-center gap-2">
          <User className="w-5 h-5" />
          Player Profile
        </h2>

        {/* Circular Avatar Container */}
        <div className="relative mb-5 group">
          <div className="w-28 h-28 rounded-full border-4 border-amber-400/80 shadow-xl overflow-hidden bg-slate-800 flex items-center justify-center">
            {profileImage ? (
              <img src={profileImage} alt="Profile Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-14 h-14 text-slate-500" />
            )}
          </div>

          {/* Quick Camera Overlay Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-full shadow-lg transition-transform active:scale-90 cursor-pointer"
            title="Upload Profile Image"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Player Name Field */}
        <div className="w-full mb-6">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 text-left">
            Player Name
          </label>
          <input
            type="text"
            value={profileName}
            onChange={(e) => onUpdateProfileName(e.target.value)}
            placeholder="Enter your name"
            maxLength={18}
            className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        {/* Upload / Remove Actions */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Profile Image</span>
          </button>

          {profileImage && (
            <button
              type="button"
              onClick={() => onUpdateProfileImage(null)}
              className="w-full py-2 bg-slate-800 hover:bg-rose-950/60 text-rose-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700/60 hover:border-rose-800 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Photo</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs mt-1 transition-transform active:scale-95 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
