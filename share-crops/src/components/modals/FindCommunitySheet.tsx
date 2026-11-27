import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API } from '@/lib/api';
import { useToast } from '@/components/atoms/Toast';
import { Modal } from '@/components/modals/Modal';
import type { Community } from '@/types';

// Search-by-ZIP → join, or create a new community when none exist — the
// post-setup "Find a Community" flow from the older Share Crops app. Admins
// also get a "All communities" tab that switches the marketplace to the
// cross-community global view.
export function FindCommunitySheet({
  onClose,
  isAdmin = false,
  onViewAllCommunities,
}: {
  onClose: () => void;
  isAdmin?: boolean;
  onViewAllCommunities?: () => void;
}) {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [tab, setTab] = useState<'find' | 'all'>('find');
  const [zip, setZip] = useState('');
  const [name, setName] = useState('');
  const [results, setResults] = useState<Community[] | null>(null);

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ['my-communities'] });
    await qc.invalidateQueries({ queryKey: ['listings'] });
  };

  const search = useMutation({
    mutationFn: (z: string) => API.searchCommunities(z),
    onSuccess: (data) => setResults(data.communities),
    onError: (e: Error) => showToast(e.message || 'Search failed'),
  });

  const join = useMutation({
    mutationFn: (communityId: string) => API.joinCommunity(communityId),
    onSuccess: async () => {
      await refresh();
      showToast('Joined community');
      onClose();
    },
    onError: (e: Error) => showToast(e.message || 'Could not join'),
  });

  const create = useMutation({
    mutationFn: () => API.createCommunity(name.trim(), zip.trim()),
    onSuccess: async () => {
      await refresh();
      showToast('Community created');
      onClose();
    },
    onError: (e: Error) => showToast(e.message || 'Could not create community'),
  });

  const noResults = results !== null && results.length === 0;
  const setZipDigits = (v: string) => {
    setZip(v.replace(/\D/g, '').slice(0, 5));
    setResults(null);
  };

  return (
    <Modal onClose={onClose}>
      <h2>{tab === 'all' ? 'All Communities' : 'Find a Community'}</h2>

      {isAdmin && (
        <div className="segmented" style={{ display: 'flex', marginBottom: 16 }}>
          <button className={tab === 'find' ? 'active' : ''} style={{ flex: 1 }} onClick={() => setTab('find')}>
            Find
          </button>
          <button className={tab === 'all' ? 'active' : ''} style={{ flex: 1 }} onClick={() => setTab('all')}>
            All communities
          </button>
        </div>
      )}

      {tab === 'all' && (
        <div>
          <div className="subtitle" style={{ marginBottom: 12 }}>
            Browse listings from every community across all ZIP codes.
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => {
              onViewAllCommunities?.();
              onClose();
            }}
          >
            View all communities
          </button>
        </div>
      )}

      {tab === 'find' && (
      <>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="input"
          placeholder="ZIP code"
          value={zip}
          inputMode="numeric"
          onChange={(e) => setZipDigits(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && zip.length === 5 && search.mutate(zip)}
        />
        <button className="btn btn-primary" disabled={zip.length < 5 || search.isPending} onClick={() => search.mutate(zip)}>
          {search.isPending ? '…' : 'Search'}
        </button>
      </div>

      {results !== null && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          {results.map((c) => (
            <div key={c.id} className="community-result">
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                <div className="meta">ZIP {c.zipCode} · {c.memberCount} {c.memberCount === 1 ? 'member' : 'members'}</div>
              </div>
              <button className="btn btn-primary btn-sm" disabled={join.isPending} onClick={() => join.mutate(c.id)}>
                Join
              </button>
            </div>
          ))}
        </div>
      )}

      {noResults && (
        <div style={{ marginTop: 16 }}>
          <div className="subtitle" style={{ marginBottom: 8 }}>No communities in ZIP {zip}. Create one:</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" placeholder="Community name" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn btn-primary" disabled={!name.trim() || create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? '…' : 'Create'}
            </button>
          </div>
        </div>
      )}
      </>
      )}
    </Modal>
  );
}
