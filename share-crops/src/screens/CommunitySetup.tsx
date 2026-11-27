import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { API, AuthManager } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/atoms/Toast';
import type { Community } from '@/types';

type Tab = 'join' | 'create';

export default function CommunitySetup() {
  const { refreshAuth, logout } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('join');

  // Join
  const [zip, setZip] = useState('');
  const [results, setResults] = useState<Community[] | null>(null);
  const search = useMutation({
    mutationFn: (z: string) => API.searchCommunities(z),
    onSuccess: (data) => setResults(data.communities),
    onError: (e: Error) => showToast(e.message || 'Search failed'),
  });

  const join = useMutation({
    mutationFn: (communityId: string) => API.joinCommunity(communityId),
    onSuccess: async () => {
      AuthManager.markCommunitySelected();
      await refreshAuth();
      showToast('Joined community');
    },
    onError: (e: Error) => showToast(e.message || 'Could not join'),
  });

  // Create
  const [name, setName] = useState('');
  const [newZip, setNewZip] = useState('');
  const create = useMutation({
    mutationFn: () => API.createCommunity(name.trim(), newZip.trim()),
    onSuccess: async () => {
      AuthManager.markCommunitySelected();
      await refreshAuth();
      showToast('Community created');
    },
    onError: (e: Error) => showToast(e.message || 'Could not create community'),
  });

  return (
    <div className="app">
      <div className="screen-body">
      <div className="app-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <h1>Find your community</h1>
        <div className="subtitle">Join neighbors trading produce near you, or start a new one.</div>
        <div className="segmented" style={{ marginTop: 12 }}>
          <button className={tab === 'join' ? 'active' : ''} onClick={() => setTab('join')}>Join</button>
          <button className={tab === 'create' ? 'active' : ''} onClick={() => setTab('create')}>Create</button>
        </div>
      </div>

      <div style={{ padding: '16px 16px 32px', maxWidth: 420, margin: '0 auto', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
        {tab === 'join' ? (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" placeholder="ZIP code" value={zip} onChange={(e) => setZip(e.target.value)} inputMode="numeric" />
              <button className="btn btn-primary" disabled={!zip.trim() || search.isPending} onClick={() => search.mutate(zip.trim())}>
                {search.isPending ? '…' : 'Search'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              {results === null ? (
                <div className="empty-state"><div className="desc">Enter a ZIP code to find communities.</div></div>
              ) : results.length === 0 ? (
                <div className="empty-state">
                  <div className="title">No communities here yet</div>
                  <div className="desc">Be the first — switch to “Create”.</div>
                </div>
              ) : (
                results.map((c) => (
                  <div key={c.id} className="community-result">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                      <div className="meta">ZIP {c.zipCode} · {c.memberCount} members</div>
                    </div>
                    <button className="btn btn-primary btn-sm" disabled={join.isPending} onClick={() => join.mutate(c.id)}>
                      Join
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="field-label">Community name</label>
              <input className="input" placeholder="e.g., Eastside Growers" value={name} onChange={(e) => setName(e.target.value)} style={{ marginTop: 6 }} />
            </div>
            <div>
              <label className="field-label">ZIP code</label>
              <input className="input" placeholder="98112" value={newZip} onChange={(e) => setNewZip(e.target.value)} inputMode="numeric" style={{ marginTop: 6 }} />
            </div>
            <button className="btn btn-primary btn-block" disabled={!name.trim() || !newZip.trim() || create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? 'Creating…' : 'Create community'}
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Log out</button>
        </div>
      </div>
      </div>
    </div>
  );
}
