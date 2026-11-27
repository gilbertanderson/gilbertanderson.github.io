import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API } from '@/lib/api';
import { useMe } from '@/hooks/useMe';
import { Avatar } from '@/components/atoms/Avatar';
import { Icon } from '@/components/atoms/Icon';
import { TomatoLoader } from '@/components/atoms/TomatoLoader';
import { clockTime } from '@/lib/time';

export default function ChatThread() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const threadsQuery = useQuery({ queryKey: ['threads'], queryFn: () => API.getThreads() });
  const thread = threadsQuery.data?.threads.find((t) => t.id === threadId);
  const otherId = thread?.participants.find((p) => p !== me?.id);

  const profileQuery = useQuery({
    queryKey: ['profile', otherId],
    queryFn: () => API.getProfile(otherId as string).then((r) => r.profile),
    enabled: !!otherId && thread?.type !== 'support',
    staleTime: 5 * 60_000,
  });

  const listingQuery = useQuery({
    queryKey: ['listing', thread?.listingId],
    queryFn: () => API.getListing(thread!.listingId).then((r) => r.listing),
    enabled: !!thread?.listingId && thread?.type !== 'support',
    staleTime: 5 * 60_000,
  });

  const messagesQuery = useQuery({
    queryKey: ['messages', threadId],
    queryFn: () => API.getMessages(threadId as string),
    enabled: !!threadId,
    refetchInterval: 5_000,
  });
  const messages = messagesQuery.data?.messages ?? [];

  const send = useMutation({
    mutationFn: (content: string) => API.sendMessage(threadId as string, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', threadId] });
      qc.invalidateQueries({ queryKey: ['threads'] });
    },
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const onSend = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    send.mutate(text);
  };

  const otherName = thread?.type === 'support' ? thread.title || 'Support' : profileQuery.data?.name ?? '…';
  const ref = thread?.type === 'support' ? 'Help & support' : `re: ${listingQuery.data?.title ?? 'Listing'}`;

  return (
    <>
      <div className="app-header" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
        <button className="btn btn-icon btn-ghost" onClick={() => navigate('/messages')} aria-label="Back">{Icon.back}</button>
        <Avatar src={profileQuery.data?.profilePhotoUrl} name={otherName} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{otherName}</div>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ref}</div>
        </div>
      </div>

      {messagesQuery.isLoading ? (
        <TomatoLoader className="loader-center" label="Loading messages…" />
      ) : (
        <div ref={scrollRef} className="scroll-area" tabIndex={0} role="log" aria-label="Messages" aria-live="polite" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {messages.length === 0 ? (
            <div className="empty-state"><div className="desc">Say hello to start the conversation.</div></div>
          ) : (
            messages.map((m) => (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.senderId === me?.id ? 'flex-end' : 'flex-start' }}>
                <div className={`chat-bubble ${m.senderId === me?.id ? 'mine' : 'theirs'}`}>{m.content}</div>
                <div className="chat-time">{clockTime(m.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, padding: '10px 14px calc(14px + var(--nav-safe))', borderTop: '1px solid var(--border)', background: 'var(--card)' }}>
        <input
          className="input"
          placeholder="Message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSend()}
        />
        <button className="btn btn-primary btn-icon" onClick={onSend} disabled={send.isPending} aria-label="Send">{Icon.send}</button>
      </div>
    </>
  );
}
