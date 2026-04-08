import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getConversationMessages, getConversations, markMessageRead, sendConversationMessage } from "../../lib/api";
import { useApp } from "../../app/AppProvider";
import { Avatar } from "../../components/Avatar";
import { EmptyState } from "./Shared";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function MessagesPage() {
  const { session, locale } = useApp();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>(searchParams.get("conversation_id") ?? "");
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState("");
  const streamRef = useRef<HTMLDivElement | null>(null);

  // When URL params change (e.g. navigating from a different request), reset selection
  const prevParams = useRef({ convId: "", reqId: "" });
  useEffect(() => {
    const convId = searchParams.get("conversation_id") ?? "";
    const reqId = searchParams.get("request_id") ?? "";
    const changed = prevParams.current.convId !== convId || prevParams.current.reqId !== reqId;
    if (changed && (convId || reqId)) {
      prevParams.current = { convId, reqId };
      setSelectedId(convId);
    }
  }, [searchParams]);

  useEffect(() => {
    async function load() {
      if (!session) return;
      const nextConversations = await getConversations(session, locale);
      setConversations(nextConversations);
      if (!selectedId) {
        const reqId = searchParams.get("request_id");
        const target = reqId
          ? nextConversations.find((c) => c.request_id === reqId)
          : null;
        const fallback = nextConversations[0] ?? null;
        const next = (target ?? fallback)?.id ?? "";
        if (next) setSelectedId(next);
      }
    }
    void load();
  }, [session, locale, selectedId]);

  useEffect(() => {
    async function loadMessages() {
      if (!session || !selectedId) {
        setMessages([]);
        return;
      }
      const nextMessages = await getConversationMessages(session, locale, selectedId);
      setMessages(nextMessages);
      for (const message of nextMessages.filter((item) => !item.read_at)) {
        await markMessageRead(session, locale, message.id).catch(() => undefined);
      }
    }
    void loadMessages();
  }, [session, locale, selectedId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [messages]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  return (
    <section className="messages-shell">
      <aside className="messages-sidebar">
        <div className="section-head">
          <div>
            <p className="eyebrow">{locale === "en-CA" ? "Inbox" : "Messagerie"}</p>
            <h2>{locale === "en-CA" ? "Conversations" : "Conversations"}</h2>
          </div>
        </div>
        {conversations.length === 0 ? <EmptyState title={locale === "en-CA" ? "No conversation yet." : "Aucune conversation."} /> : null}
        <div className="messages-thread-list">
          {conversations.map((conversation) => (
            <button
              className={conversation.id === selectedId ? "conversation-card conversation-card-active" : "conversation-card"}
              key={conversation.id}
              onClick={() => setSelectedId(conversation.id)}
              type="button"
            >
              <Avatar name={conversation.request_title || "Jobizy"} size={44} radius="14px" />
              <div className="conversation-copy">
                <strong>{conversation.request_title || conversation.id}</strong>
                <p>{conversation.last_message || (locale === "en-CA" ? "Open conversation" : "Conversation ouverte")}</p>
                <span>{formatDate(conversation.last_message_at)}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="messages-panel">
        <div className="messages-header">
          <div>
            <p className="eyebrow">{locale === "en-CA" ? "Context" : "Contexte"}</p>
            <strong>{selectedConversation?.request_title || (locale === "en-CA" ? "Select a conversation" : "Selectionnez une conversation")}</strong>
            <p>{selectedConversation ? (locale === "en-CA" ? "Centralized messages tied to the request or mission." : "Messages centralises relies a la demande ou a la mission.") : ""}</p>
          </div>
          {selectedConversation ? <span className="status-chip status-chip-success">{selectedConversation.status}</span> : null}
        </div>

        <div className="message-stream" ref={streamRef}>
          {messages.length === 0 ? <EmptyState title={locale === "en-CA" ? "No message yet." : "Aucun message pour le moment."} /> : null}
          {messages.map((message) => {
            const mine = Boolean(session && message.sender_user_id === session.user.id);
            return (
              <article className={mine ? "message-bubble message-bubble-mine" : "message-bubble"} key={message.id}>
                <p>{message.body || "-"}</p>
                <span>{formatDate(message.created_at)}</span>
              </article>
            );
          })}
        </div>

        {selectedId ? (
          <form
            className="message-composer"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!session || !draft.trim()) return;
              await sendConversationMessage(session, locale, selectedId, { body: draft });
              setDraft("");
              setMessages(await getConversationMessages(session, locale, selectedId));
            }}
          >
            <label className="field field-wide">
              <span>{locale === "en-CA" ? "New message" : "Nouveau message"}</span>
              <textarea onChange={(event) => setDraft(event.target.value)} placeholder={locale === "en-CA" ? "Share context, timing or a quick follow-up..." : "Ajoutez un contexte, un delai ou une relance rapide..."} value={draft} />
            </label>
            <button className="primary-button" type="submit">
              {locale === "en-CA" ? "Send message" : "Envoyer le message"}
            </button>
          </form>
        ) : null}
      </section>
    </section>
  );
}
