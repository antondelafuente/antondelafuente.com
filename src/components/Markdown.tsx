import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

/**
 * Lightweight markdown renderer with Tailwind-friendly styling.
 * Used for model responses, SDF docs, and other prose where the source
 * may contain markdown formatting.
 *
 * Notes:
 * - LaTeX (e.g. `\boxed{42}`) is left as plain text on purpose so you can
 *   see exactly what the model emitted.
 * - <think>…</think> blocks are rendered inline as muted text.
 */
export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`text-sm leading-relaxed bg-muted/50 rounded p-3 overflow-x-auto markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-2 first:mt-0">{children}</h3>,
          h2: ({ children }) => <h4 className="text-sm font-semibold mt-3 mb-1.5 first:mt-0">{children}</h4>,
          h3: ({ children }) => <h5 className="text-sm font-medium mt-2 mb-1 first:mt-0">{children}</h5>,
          h4: ({ children }) => <h6 className="text-sm font-medium mt-2 mb-1 first:mt-0">{children}</h6>,
          p:  ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-outside ml-5 my-2 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside ml-5 my-2 space-y-0.5">{children}</ol>,
          li: ({ children }) => <li className="my-0.5">{children}</li>,
          code: ({ children, className }) => {
            const isBlock = className?.startsWith("language-")
            return isBlock ? (
              <code className="block bg-background border rounded p-2 my-2 text-xs font-mono whitespace-pre overflow-x-auto">{children}</code>
            ) : (
              <code className="bg-background/60 border rounded px-1 py-0.5 text-xs font-mono">{children}</code>
            )
          },
          pre: ({ children }) => <>{children}</>,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-muted-foreground/40 pl-3 my-2 italic text-muted-foreground">{children}</blockquote>,
          table: ({ children }) => <div className="overflow-x-auto my-2"><table className="min-w-full text-xs border-collapse">{children}</table></div>,
          th: ({ children }) => <th className="border-b border-muted-foreground/40 px-2 py-1 text-left font-medium">{children}</th>,
          td: ({ children }) => <td className="border-b border-muted/40 px-2 py-1">{children}</td>,
          a:  ({ href, children }) => <a href={href} className="underline hover:text-foreground" target="_blank" rel="noreferrer">{children}</a>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          hr: () => <hr className="my-3 border-muted-foreground/20" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
