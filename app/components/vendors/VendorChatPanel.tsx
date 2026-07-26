"use client";

import { Loader2, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
  fetchMessages,
  getOrCreateConversation,
  sendMessage,
  subscribeToMessages,
  type MessageRow,
} from "@/services/vendor-customer.service";

type VendorChatPanelProps = {
  vendorId: string;
  vendorName: string;
  isOpen: boolean;
  onClose: () => void;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function VendorChatPanel({ vendorId, vendorName, isOpen, onClose }: VendorChatPanelProps) {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    let active = true;

    (async () => {
      setIsLoading(true);
      const id = await getOrCreateConversation(user.id, vendorId);
      if (!active) return;
      setConversationId(id);
      const history = await fetchMessages(id);
      if (active) {
        setMessages(history);
        setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [isOpen, user, vendorId]);

  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = subscribeToMessages(conversationId, (message) => {
      if (message.senderId === user?.id) return;
      setMessages((prev) => [...prev, message]);
    });
    return unsubscribe;
  }, [conversationId, user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!user || !conversationId || !draft.trim() || isSending) return;
    const body = draft.trim();
    setDraft("");
    setIsSending(true);
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), conversationId, senderId: user.id, body, createdAt: new Date().toISOString() },
    ]);
    await sendMessage(conversationId, user.id, body);
    setIsSending(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div aria-hidden="true" className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div
        role="dialog"
        aria-label={`Chat with ${vendorName}`}
        className="fixed inset-x-0 bottom-0 z-50 flex h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:w-96 sm:rounded-none"
      >
        <div className="flex items-center justify-between border-b border-outline-variant p-4">
          <h3 className="text-base font-semibold text-foreground">Chat with {vendorName}</h3>
          <button
            type="button"
            aria-label="Close chat"
            onClick={onClose}
            className="rounded-full p-1.5 text-on-surface-variant transition-colors hover:bg-surface"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-outline" />
            </div>
          )}
          {!isLoading && messages.length === 0 && (
            <p className="text-center text-sm text-on-surface-variant">
              Say hello to {vendorName} — they&apos;ll reply here.
            </p>
          )}
          {!isLoading &&
            messages.map((message) =>
              message.senderId === user?.id ? (
                <div key={message.id} className="ml-auto max-w-[85%] rounded-2xl rounded-br-none bg-primary p-3 text-sm text-white">
                  {message.body}
                  <div className="mt-1 text-right text-[10px] text-white/70">{formatTime(message.createdAt)}</div>
                </div>
              ) : (
                <div
                  key={message.id}
                  className="mr-auto max-w-[85%] rounded-2xl rounded-bl-none bg-surface-container-highest/60 p-3 text-sm text-foreground"
                >
                  {message.body}
                  <div className="mt-1 text-right text-[10px] text-on-surface-variant">{formatTime(message.createdAt)}</div>
                </div>
              )
            )}
        </div>

        <div className="border-t border-outline-variant p-3">
          <div className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface px-3 py-1.5">
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSend();
              }}
              placeholder="Type a message…"
              disabled={isLoading}
              className="flex-1 border-none bg-transparent py-1.5 text-sm outline-none disabled:opacity-50"
            />
            <button
              type="button"
              aria-label="Send message"
              onClick={handleSend}
              disabled={!draft.trim() || isSending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-transform active:scale-95 disabled:opacity-40"
            >
              <Send aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
