import React, { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API } from '@/lib/api';
import type { User } from '@/types';
import { Modal } from './Modal';
import { Avatar } from '@/components/atoms/Avatar';
import { useToast } from '@/components/atoms/Toast';
import { useViewMode } from '@/hooks/useViewMode';

export function EditProfileSheet({ user, onClose }: { user: User; onClose: () => void }) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio ?? '');
  const [socialUrl, setSocialUrl] = useState(user.socialUrl ?? '');
  const [photo, setPhoto] = useState(user.profilePhotoUrl ?? '');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useViewMode();

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await API.uploadPhoto(file);
      setPhoto(url);
    } catch (err) {
      showToast((err as Error).message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const save = useMutation({
    mutationFn: () => API.updateProfile({ name: name.trim(), bio: bio.trim(), socialUrl: socialUrl.trim(), profilePhotoUrl: photo }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      showToast('Profile updated');
      onClose();
    },
    onError: (e: Error) => showToast(e.message || 'Could not update profile'),
  });

  return (
    <Modal onClose={onClose}>
      <h2>Edit Profile</h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Avatar src={photo} name={name} size={72} />
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />
        <button className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : 'Change photo'}
        </button>
      </div>
      <label className="field-label">Name</label>
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} style={{ marginTop: 6 }} />
      <label className="field-label" style={{ marginTop: 12 }}>Bio</label>
      <textarea className="input" value={bio} onChange={(e) => setBio(e.target.value)} style={{ marginTop: 6 }} />
      <label className="field-label" style={{ marginTop: 12 }}>Social URL</label>
      <input className="input" placeholder="https://…" value={socialUrl} onChange={(e) => setSocialUrl(e.target.value)} style={{ marginTop: 6 }} />

      {/* Desktop-only display preference; persists per browser. Hidden on phones
          (where the phone-frame layout doesn't apply) per the wide-only gate. */}
      <div className="wide-only" style={{ marginTop: 12 }}>
        <label className="field-label">Desktop view</label>
        <div className="segmented" style={{ marginTop: 6, display: 'flex' }}>
          <button type="button" className={viewMode === 'full' ? 'active' : ''} onClick={() => setViewMode('full')} style={{ flex: 1 }}>
            Fullscreen
          </button>
          <button type="button" className={viewMode === 'frame' ? 'active' : ''} onClick={() => setViewMode('frame')} style={{ flex: 1 }}>
            Phone frame
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={!name.trim() || save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}
