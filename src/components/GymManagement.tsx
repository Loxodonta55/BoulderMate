import React, { useState, useEffect } from 'react';
import { Gym, Sector } from '../types/gym';
import {
  searchGymsWithSectors,
  createGym,
  getGradeScales,
  CURRENT_USER,
  isGymAdmin
} from '../lib/gymStorage';
import { GradeScaleConfig } from './GradeScaleConfig';
import { SectorManager } from './SectorManager';
import { Building2, Search, Plus, MapPin, Globe, Shield, X, Sparkles } from 'lucide-react';

export const GymManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gymsWithSectors, setGymsWithSectors] = useState<Array<Gym & { sectors: Array<Sector & { active_boulder_count: number }> }>>([]);
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sectors' | 'grading'>('sectors');
  const [isCreatingGym, setIsCreatingGym] = useState(false);

  // New gym form state
  const [newGymName, setNewGymName] = useState('');
  const [newGymCity, setNewGymCity] = useState('');
  const [newGymAddress, setNewGymAddress] = useState('');
  const [newGymWebsite, setNewGymWebsite] = useState('');
  const [newGymLogo, setNewGymLogo] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const refreshData = () => {
    const list = searchGymsWithSectors(searchQuery);
    setGymsWithSectors(list);
    if (!selectedGymId && list.length > 0) {
      setSelectedGymId(list[0].id);
    }
  };

  useEffect(() => {
    refreshData();
  }, [searchQuery]);

  const handleCreateGymSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateError(null);
      const created = createGym({
        name: newGymName,
        city: newGymCity || undefined,
        address: newGymAddress || undefined,
        website: newGymWebsite || undefined,
        logo_url: newGymLogo || undefined
      });
      setIsCreatingGym(false);
      setNewGymName('');
      setNewGymCity('');
      setNewGymAddress('');
      setNewGymWebsite('');
      setNewGymLogo('');
      setSelectedGymId(created.id);
      refreshData();
    } catch (err: any) {
      setCreateError(err.message || 'Fehler beim Anlegen der Halle.');
    }
  };

  const selectedGym = gymsWithSectors.find(g => g.id === selectedGymId);
  const isAdmin = selectedGym ? isGymAdmin(selectedGym.id, CURRENT_USER.id) : false;
  const gradeScales = selectedGym ? getGradeScales(selectedGym.id) : [];

  return (
    <div className="space-y-6">
      {/* Top Bar: Search & Create Gym */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Boulderhalle suchen (Name, Stadt)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Create Gym Action */}
        <button
          onClick={() => setIsCreatingGym(true)}
          className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs md:text-sm rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Halle registrieren</span>
        </button>
      </div>

      {/* Gym Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {gymsWithSectors.map((gym) => {
          const isSelected = gym.id === selectedGymId;
          const userIsAdmin = isGymAdmin(gym.id, CURRENT_USER.id);
          const totalActiveBoulders = gym.sectors.reduce((acc, s) => acc + s.active_boulder_count, 0);

          return (
            <button
              key={gym.id}
              onClick={() => setSelectedGymId(gym.id)}
              className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/40'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-slate-100">{gym.name}</h4>
                  {userIsAdmin && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Shield className="w-2.5 h-2.5" /> Admin
                    </span>
                  )}
                </div>
                {gym.city && (
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {gym.city} {gym.address ? `· ${gym.address}` : ''}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 mt-3 border-t border-slate-900">
                <span>{gym.sectors.length} Sektoren</span>
                <span className="font-semibold text-emerald-400">{totalActiveBoulders} aktive Boulder</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Gym Detail Workspace */}
      {selectedGym ? (
        <div className="space-y-4">
          {/* Gym Header Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0">
                {selectedGym.logo_url ? (
                  <img src={selectedGym.logo_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <Building2 className="w-6 h-6 text-emerald-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-100">{selectedGym.name}</h2>
                  {isAdmin && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Hallen-Administrator
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                  {selectedGym.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {selectedGym.city} {selectedGym.address && `(${selectedGym.address})`}
                    </span>
                  )}
                  {selectedGym.website && (
                    <a
                      href={selectedGym.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-emerald-400 hover:underline"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* View Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0 self-start md:self-auto">
              <button
                onClick={() => setActiveTab('sectors')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'sectors' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sektoren ({selectedGym.sectors.length})
              </button>
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('grading')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                    activeTab === 'grading' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Farbsystem & Grading ({gradeScales.length})
                </button>
              )}
            </div>
          </div>

          {/* Active Tab View */}
          {activeTab === 'sectors' ? (
            <SectorManager
              gymId={selectedGym.id}
              userId={CURRENT_USER.id}
              isAdmin={isAdmin}
              sectors={selectedGym.sectors}
              onRefresh={refreshData}
            />
          ) : (
            <GradeScaleConfig
              gymId={selectedGym.id}
              userId={CURRENT_USER.id}
              initialScales={gradeScales}
              onSaved={refreshData}
            />
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
          <Building2 className="w-10 h-10 mx-auto text-slate-600" />
          <div className="text-sm font-semibold">Keine Boulderhalle registriert</div>
          <div className="text-xs text-slate-500">Registriere jetzt deine Halle, um Sektoren und Farbsysteme zu verwalten.</div>
        </div>
      )}

      {/* Modal: Neue Halle anlegen (AC-1) */}
      {isCreatingGym && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-slate-100">Neue Boulderhalle registrieren</h3>
              </div>
              <button
                onClick={() => setIsCreatingGym(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mx-5 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateGymSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Hallenname <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Minimum Bouldern Zürich"
                  value={newGymName}
                  onChange={(e) => setNewGymName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Stadt</label>
                  <input
                    type="text"
                    placeholder="z.B. Zürich"
                    value={newGymCity}
                    onChange={(e) => setNewGymCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Adresse</label>
                  <input
                    type="text"
                    placeholder="z.B. Flüelastrasse 31"
                    value={newGymAddress}
                    onChange={(e) => setNewGymAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Website URL</label>
                <input
                  type="url"
                  placeholder="https://minimum.ch"
                  value={newGymWebsite}
                  onChange={(e) => setNewGymWebsite(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Logo URL</label>
                <input
                  type="url"
                  placeholder="https://.../logo.png"
                  value={newGymLogo}
                  onChange={(e) => setNewGymLogo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Als Ersteller erhältst du automatisch die Administrator-Rolle für diese Halle.</span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingGym(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-700"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md"
                >
                  Halle anlegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
