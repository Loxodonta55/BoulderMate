import React, { useState } from 'react';
import { getProfileData } from '../lib/profileService';
import { getGyms } from '../lib/batchBoulderService';
import { ProfileKPIsBar } from './ProfileKPIsBar';
import { GradeDistributionChart } from './GradeDistributionChart';
import { X, Calendar, MapPin } from 'lucide-react';

interface PublicProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({
  userId,
  isOpen,
  onClose,
}) => {
  const [selectedGymId, setSelectedGymId] = useState<string>('all');

  if (!isOpen) return null;

  const gyms = getGyms();
  const profileData = getProfileData(userId, selectedGymId);
  const { profile, kpis, gradeDistribution } = profileData;

  const formattedDate = new Date(profile.createdAt).toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#121110]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200" data-testid="public-profile-modal">
      <div className="w-full max-w-2xl bg-[#181614] border border-[#38332e] rounded-2xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-[#38332e] bg-[#141210] flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-[#221f1c] border-2 border-[#d97706]/60 flex items-center justify-center overflow-hidden shadow-lg shrink-0">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.nickname} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-headline font-bold text-[#f59e0b]">
                  {profile.nickname.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-headline uppercase tracking-wider text-[#f4efe6]">
                  {profile.nickname}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#221f1c] border border-[#38332e] text-[#a89f91]">
                  Kletterer
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono text-[#a89f91] mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-[#d97706]" />
                <span>Mitglied seit {formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Close Button (No Settings Gear - AC-6) */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#78716c] hover:text-[#f4efe6] hover:bg-[#221f1c] transition"
            aria-label="Schließen"
            data-testid="btn-close-public-profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Hallenfilter (AC-4) */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#a89f91]">
              <MapPin className="w-3.5 h-3.5 text-[#d97706]" />
              <span>Hallen-Filter:</span>
            </div>
            <select
              value={selectedGymId}
              onChange={e => setSelectedGymId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#121110] border border-[#38332e] text-xs font-mono text-[#f4efe6] focus:outline-none focus:border-[#d97706] cursor-pointer"
              data-testid="select-gym-filter-public"
            >
              <option value="all">Alle Hallen (Gesamt)</option>
              {gyms.map(gym => (
                <option key={gym.id} value={gym.id}>
                  {gym.name}
                </option>
              ))}
            </select>
          </div>

          {/* KPIs Bar (AC-2) */}
          <ProfileKPIsBar kpis={kpis} />

          {/* Grade Distribution Bar Chart (AC-3, AC-8) */}
          <GradeDistributionChart distribution={gradeDistribution} />

          {/* Notice: Logbook is strictly private and hidden here (AC-6) */}
          <div className="p-3 rounded-xl bg-[#121110] border border-[#2a2622] text-center text-xs font-mono text-[#78716c]">
            🔒 Das persönliche Logbuch dieses Kletterers ist privat.
          </div>
        </div>
      </div>
    </div>
  );
};
