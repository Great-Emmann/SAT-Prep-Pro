import React from "react";

export function parseInlineMarkdown(text: string) {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const rawParts = text.split(regex);

  rawParts.forEach((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      parts.push(
        <strong key={idx} className="font-extrabold text-inherit">
          {part.slice(2, -2)}
        </strong>
      );
    } else if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      parts.push(
        <em key={idx} className="italic text-inherit">
          {part.slice(1, -1)}
        </em>
      );
    } else if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      parts.push(
        <code key={idx} className="bg-black/10 px-1 py-0.5 rounded font-mono text-[10.5px]">
          {part.slice(1, -1)}
        </code>
      );
    } else {
      parts.push(part);
    }
  });

  return parts;
}

export function FormattedMarkdown({ text, className }: { text: string; className?: string }) {
  if (!text) return null;
  const paragraphs = text.split("\n");

  return (
    <div className={`space-y-1.5 ${className || ""}`}>
      {paragraphs.map((para, pIdx) => {
        if (!para.trim()) return <div key={pIdx} className="h-0.5" />;

        if (para.startsWith("### ")) {
          return (
            <h4 key={pIdx} className="font-extrabold text-xs mt-2 mb-1">
              {parseInlineMarkdown(para.slice(4))}
            </h4>
          );
        }
        if (para.startsWith("## ") || para.startsWith("# ")) {
          return (
            <h3 key={pIdx} className="font-black text-xs mt-2 mb-1">
              {parseInlineMarkdown(para.replace(/^#+\s*/, ""))}
            </h3>
          );
        }

        if (/^\s*[-*•]\s+/.test(para)) {
          const content = para.replace(/^\s*[-*•]\s+/, "");
          return (
            <div key={pIdx} className="flex items-start gap-1.5 pl-1 my-0.5">
              <span className="font-bold select-none opacity-80">•</span>
              <span className="flex-1">{parseInlineMarkdown(content)}</span>
            </div>
          );
        }

        return (
          <p key={pIdx} className="leading-relaxed">
            {parseInlineMarkdown(para)}
          </p>
        );
      })}
    </div>
  );
}
