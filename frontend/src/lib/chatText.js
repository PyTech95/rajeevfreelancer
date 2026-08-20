export function renderChatText(text, onDark = false) {
  const strongCls = onDark ? "font-bold underline decoration-2 underline-offset-2" : "font-bold text-brand";
  const highlight = (seg, key) => {
    const parts = String(seg).split(/(WhatsApp number|phone number|free consultation)/gi);
    return (
      <span key={key}>
        {parts.map((p, j) => (j % 2 === 1 ? <strong key={j} className={strongCls}>{p}</strong> : p))}
      </span>
    );
  };
  const parts = String(text || "").split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) => (i % 2 === 1 ? <strong key={i} className={strongCls}>{p}</strong> : highlight(p, i)));
}
