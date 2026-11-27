import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API } from '@/lib/api';
import { Modal } from './Modal';
import { TomatoPicker } from '@/components/atoms/Tomato';
import { useToast } from '@/components/atoms/Toast';

export function RatingSheet({ offerId, onClose }: { offerId: string; onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { showToast } = useToast();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => API.createRating(offerId, rating, comment.trim() || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offers'] });
      qc.invalidateQueries({ queryKey: ['ratings'] });
      showToast('Rating submitted');
      onClose();
    },
    onError: (e: Error) => showToast(e.message || 'Could not submit rating'),
  });

  return (
    <Modal onClose={onClose}>
      <h2>Rate This Exchange</h2>
      <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: -8, marginBottom: 18, textAlign: 'center' }}>
        How was your experience?
      </p>
      <TomatoPicker value={rating} onChange={setRating} />
      <label className="field-label" style={{ marginTop: 18 }}>Comment (optional)</label>
      <textarea className="input" placeholder="Share your experience…" value={comment} onChange={(e) => setComment(e.target.value)} style={{ marginTop: 6 }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={rating === 0 || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'Submitting…' : 'Submit Rating'}
        </button>
      </div>
    </Modal>
  );
}
