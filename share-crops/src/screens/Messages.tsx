import React from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { API } from '@/lib/api';
import type { Thread } from '@/types';
import { useMe } from '@/hooks/useMe';
import { Avatar } from '@/components/atoms/Avatar';
import { TomatoLoader } from '@/components/atoms/TomatoLoader';
import { shortAgo } from '@/lib/time';

function ThreadRow({ thread, meId, onClick }: { thread: Thread; meId?: string; onClick: () => void }) {
  const otherId = thread.participants.find((p) => p !== meId);

  const profileQuery = useQuery({
    queryKey: ['profile', otherId],
    queryFn: () => API.getProfile(otherId as string).then((r) => r.profile),
    enabled: !!otherId && thread.type !== 'support',
    staleTime: 5 * 60_000,
  });

  const listingQuery = useQuery({
    queryKey: ['listing', thread.listingId],
    queryFn: () => API.getListing(thread.listingId).then((r) => r.listing),
    enabled: !!thread.listingId && thread.type !== 'support',
    staleTime: 5 * 60_000,
  });

  const other = profileQuery.data;
  const title = thread.type === 'support' ? thread.title || 'Support' : other?.name ?? '…';
  const ref = thread.type === 'support' ? 'Help & support' : `re: ${listingQuery.data?.title ?? 'Listing'}`;

  return (
    <div className="thread-row" onClick={onClick}>
      <Avatar src={other?.profilePhotoUrl} name={title} size={44} />
      <div className="info">
        <div className="name">{title}</div>
        <div className="listing-ref">{ref}</div>
        <div className="preview">{thread.lastMessage || 'No messages yet'}</div>
      </div>
      <div className="meta">
        <div className="time">{thread.lastMessageAt ? shortAgo(thread.lastMessageAt) : ''}</div>
      </div>
    </div>
  );
}

export default function Messages() {
  const navigate = useNavigate();
  const { data: me } = useMe();

  const { data, isLoading } = useQuery({
    queryKey: ['threads'],
    queryFn: () => API.getThreads(),
    refetchInterval: 30_000,
  });
  const threads = data?.threads ?? [];

  return (
    <>
      <div className="app-header"><h1>Messages</h1></div>
      {isLoading ? (
        <TomatoLoader className="loader-center" label="Loading messages…" />
      ) : threads.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 24 }}>
          <div className="title">No conversations yet</div>
          <div className="desc">Message a seller from a listing to start trading.</div>
        </div>
      ) : (
        <div style={{ paddingBottom: 16 }}>
          {threads.map((t) => (
            <ThreadRow key={t.id} thread={t} meId={me?.id} onClick={() => navigate(`/messages/${t.id}`)} />
          ))}
        </div>
      )}
    </>
  );
}
