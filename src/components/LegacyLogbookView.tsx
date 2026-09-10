import React, { useState, useMemo } from 'react';
import { Boulder, BoulderInput, BoulderFilterOptions } from '../types/boulder';
import {
  createBoulder,
  updateBoulder,
  deleteBoulder,
  filterAndSortBoulders,
  computeStats,
} from '../lib/storage';
import { BoulderStatsBar } from './BoulderStatsBar';
import { BoulderFilter } from './BoulderFilter';
import { BoulderList } from './BoulderList';
import { BoulderForm } from './BoulderForm';
import { DataManagementModal } from './DataManagementModal';
import { Plus, Database } from 'lucide-react';

interface LegacyLogbookViewProps {
  boulders: Boulder[];
  onDataChanged: () => void;
}

export const LegacyLogbookView: React.FC<LegacyLogbookViewProps> = ({
  boulders,
  onDataChanged,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBoulder, setEditingBoulder] = useState<Boulder | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [filters, setFilters] = useState<BoulderFilterOptions>({
    searchQuery: '',
    ascentStyle: 'all',
    wallAngle: 'all',
    holdType: 'all',
    location: '',
    sortBy: 'date_desc',
  });

  const availableLocations = useMemo(() => {
    const locSet = new Set<string>();
    boulders.forEach(b => {
      if (b.location) locSet.add(b.location);
    });
    return Array.from(locSet).sort();
  }, [boulders]);

  const filteredBoulders = useMemo(() => {
    return filterAndSortBoulders(boulders, filters);
  }, [boulders, filters]);

  const stats = useMemo(() => {
    return computeStats(boulders);
  }, [boulders]);

  const handleSaveBoulder = (data: BoulderInput) => {
    if (editingBoulder) {
      updateBoulder(editingBoulder.id, data);
    } else {
      createBoulder(data);
    }
    onDataChanged();
    setIsFormOpen(false);
    setEditingBoulder(null);
  };

  const handleEditBoulder = (boulder: Boulder) => {
    setEditingBoulder(boulder);
    setIsFormOpen(true);
  };

  const handleDeleteBoulder = (id: string) => {
    deleteBoulder(id);
    onDataChanged();
  };

  return (
    <div className="space-y-6" data-testid="deep-dive-view">
      <BoulderStatsBar stats={stats} />

      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-8">
            <BoulderForm
              initialData={editingBoulder}
              onSave={handleSaveBoulder}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingBoulder(null);
              }}
            />
          </div>
        </div>
      )}

      <BoulderFilter
        filters={filters}
        onChange={setFilters}
        availableLocations={availableLocations}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-headline uppercase tracking-wider text-[#E8E0D4] flex items-center gap-2">
            <span>Erfasste Routen</span>
            <span className="px-2.5 py-0.5 rounded-none text-xs font-mono font-semibold bg-[#2A2A2A] border border-[#333333] text-[#A89F91]">
              {filteredBoulders.length} von {boulders.length}
            </span>
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingBoulder(null);
                setIsFormOpen(true);
              }}
              className="px-2.5 py-1 text-xs font-headline uppercase font-bold tracking-wider bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] rounded-[2px] transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Begehung erfassen</span>
            </button>
            <button
              onClick={() => setIsDataModalOpen(true)}
              className="px-2.5 py-1 text-xs font-mono text-[#A89F91] hover:text-[#E8E0D4] bg-[#2A2A2A] hover:bg-[#333333] border border-[#333333] rounded-[2px] transition flex items-center gap-1.5"
              title="Datenverwaltung / Backup"
            >
              <Database className="w-3.5 h-3.5 text-[#C9A96E]" />
              <span>Backup</span>
            </button>
          </div>
        </div>

        <BoulderList
          boulders={filteredBoulders}
          onEdit={handleEditBoulder}
          onDelete={handleDeleteBoulder}
        />
      </section>

      {isDataModalOpen && (
        <DataManagementModal
          boulders={boulders}
          onImportComplete={onDataChanged}
          onClose={() => setIsDataModalOpen(false)}
        />
      )}
    </div>
  );
};
