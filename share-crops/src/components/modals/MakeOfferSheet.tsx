import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API } from '@/lib/api';
import type { Listing } from '@/types';
import { Modal } from './Modal';
import { ImageWithFallback } from '@/components/atoms/ImageWithFallback';
import { useToast } from '@/components/atoms/Toast';

export function MakeOfferSheet({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const [produce, setProduce] = useState('');
  const [msg, setMsg] = useState('');
  const { showToast } = useToast();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => API.createOffer(listing.id, produce.trim(), msg.trim() || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offers'] });
      showToast('Offer sent');
      onClose();
    },
    onError: (e: Error) => showToast(e.message || 'Could not send offer'),
  });

  return (
    <Modal onClose={onClose}>
      <h2>Make a Barter Offer</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--muted)', borderRadius: 'var(--radius)', marginBottom: 16 }}>
        <ImageWithFallback src={listing.photos?.[0]} alt="" rounded={8} style={{ width: 44, height: 44, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{listing.title}</div>
          <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>Wants: {listing.lookingFor || 'open to ideas'}</div>
        </div>
      </div>
      <label className="field-label">What are you offering?</label>
      <input className="input" placeholder="e.g., 2 dozen eggs" value={produce} onChange={(e) => setProduce(e.target.value)} style={{ marginTop: 6 }} />
      <label className="field-label" style={{ marginTop: 14 }}>Message (optional)</label>
      <textarea className="input" placeholder="Add a note for the seller…" value={msg} onChange={(e) => setMsg(e.target.value)} style={{ marginTop: 6 }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          disabled={!produce.trim() || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Sending…' : 'Submit Offer'}
        </button>
      </div>
    </Modal>
  );
}
