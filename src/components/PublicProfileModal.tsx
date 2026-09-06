import React, { useState } from 'react';
import { getProfileData } from '../lib/profileService';
import { getGyms } from '../lib/batchBoulderService';
import { getAthletePerformanceReport } from '../lib/performanceService';
import { ProfileKPIsBar } from './ProfileKPIsBar';
import { GradeDistributionChart } from './GradeDistributionChart';
import { AthletePerformanceView } from './AthletePerformanceView';
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
  const performanceReport = getAthletePerformanceReport(userId, selectedGymId);
  const { profile, kpis, gradeDistribution } = profileData;

  const formattedDate = new Date(profile.createdAt).toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200" data-testid="public-profile-modal">
      <div className="w-full max-w-2xl bg-[#1E1E1E] border border-[#333333] rounded-none overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-[#333333] bg-[#1E1E1E] flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar - SPEC-005: 0px square avatar */}
            <div className="w-14 h-14 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center overflow-hidden shrink-0">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.nickname} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-mono font-bold text-[#F5F0E8]">
                  {profile.nickname.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
                  {profile.nickname}
                </h2>
                <span className="px-2 py-0.5 rounded-none text-[10px] font-mono uppercase bg-[#2A2A2A] border border-[#333333] text-[#A89F91]">
                  Kletterer
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono text-[#A89F91] mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-[#C9A96E]" />
                <span>Mitglied seit {formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Close Button (No Settings Gear - AC-6) */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-[2px] text-[#6B6358] hover:text-[#E8E0D4] hover:bg-[#2A2A2A] transition"
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
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#A89F91]">
              <MapPin className="w-3.5 h-3.5 text-[#C9A96E]" />
              <span className="font-bold text-[#E8E0D4]">Hallen-Filter:</span>
            </div>
            <select
              value={selectedGymId}
              onChange={e => setSelectedGymId(e.target.value)}
              className="px-3 py-1.5 rounded-none bg-[#121212] border border-[#333333] text-xs font-mono text-[#E8E0D4] focus:outline-none focus:border-[#C9A96E] cursor-pointer"
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

          {/* Public Athlete Performance Radar (SPEC-008 AC-8) */}
          {performanceReport.isUnlocked && (
            <div className="pt-2">
              <AthletePerformanceView report={performanceReport} isPublicView={true} />
            </div>
          )}

          {/* Notice: Logbook is strictly private and hidden here (AC-6) */}
          <div className="p-3 rounded-none bg-[#121212] border border-[#333333] text-center text-xs font-mono text-[#6B6358]">
            🔒 Das persönliche Logbuch dieses Kletterers ist privat.
          </div>
        </div>
      </div>
    </div>
  );
};
