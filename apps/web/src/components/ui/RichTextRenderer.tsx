import { useMemo } from "react";

interface RichTextRendererProps {
  content: string;
  className?: string;
}

export function RichTextRenderer({ content, className = "" }: RichTextRendererProps) {
  const nodes = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div className={`space-y-2 text-body-sm text-dark-gray dark:text-off-white ${className}`}>
      {nodes.map((node, idx) => renderNode(node, idx))}
    </div>
  );
}

type MarkdownNode = 
  | { type: "paragraph"; content: string }
  | { type: "heading"; level: 1 | 2 | 3; content: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; language?: string; content: string }
  | { type: "blockquote"; content: string }
  | { type: "break" };

function parseMarkdown(text: string): MarkdownNode[] {
  const nodes: MarkdownNode[] = [];
  const lines = text.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Headings
    if (line.startsWith("###")) {
      nodes.push({ type: "heading", level: 3, content: line.replace(/^#+\s/, "") });
      i++;
    } else if (line.startsWith("##")) {
      nodes.push({ type: "heading", level: 2, content: line.replace(/^#+\s/, "") });
      i++;
    } else if (line.startsWith("#")) {
      nodes.push({ type: "heading", level: 1, content: line.replace(/^#+\s/, "") });
      i++;
    }
    // Blockquotes
    else if (line.startsWith(">")) {
      nodes.push({ type: "blockquote", content: line.replace(/^>\s?/, "") });
      i++;
    }
    // Code blocks
    else if (line.startsWith("```")) {
      const language = line.replace("```", "").trim() || undefined;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push({ type: "code", language, content: codeLines.join("\n") });
      i++; // Skip closing ```
    }
    // Unordered lists
    else if (line.match(/^[\-\*]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[\-\*]\s/)) {
        items.push(lines[i].replace(/^[\-\*]\s/, ""));
        i++;
      }
      nodes.push({ type: "list", ordered: false, items });
    }
    // Ordered lists
    else if (line.match(/^\d+\.\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      nodes.push({ type: "list", ordered: true, items });
    }
    // Paragraphs
    else {
      let paragraph = line;
      i++;
      while (i < lines.length && lines[i].trim() && !lines[i].match(/^(#{1,3}\s|>\s|```|[\-\*]\s|\d+\.\s)/)) {
        paragraph += "\n" + lines[i];
        i++;
      }
      nodes.push({ type: "paragraph", content: paragraph });
    }
  }

  return nodes;
}

function renderNode(node: MarkdownNode, key: number) {
  switch (node.type) {
    case "heading":
      const headingClasses = {
        1: "text-h1 font-bold mt-3",
        2: "text-h2 font-bold mt-2",
        3: "text-h3 font-semibold mt-2",
      };
      return (
        <div key={key} className={headingClasses[node.level]}>
          {renderInlineMarkdown(node.content)}
        </div>
      );

    case "paragraph":
      return (
        <p key={key} className="leading-relaxed whitespace-pre-wrap">
          {renderInlineMarkdown(node.content)}
        </p>
      );

    case "list":
      return (
        <ul key={key} className={node.ordered ? "list-decimal" : "list-disc"} style={{ paddingLeft: "1.5rem" }}>
          {node.items.map((item, idx) => (
            <li key={idx} className="ml-2">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );

    case "code":
      return (
        <pre key={key} className="overflow-x-auto rounded-lg bg-near-black p-3 text-white text-xs font-mono">
          <code>{node.content}</code>
        </pre>
      );

    case "blockquote":
      return (
        <blockquote
          key={key}
          className="border-l-4 border-electric-blue pl-4 italic text-mid-gray dark:text-light-gray bg-light-gray/30 dark:bg-dark-surface/30 py-2 rounded"
        >
          {renderInlineMarkdown(node.content)}
        </blockquote>
      );

    default:
      return null;
  }
}

function renderInlineMarkdown(text: string): JSX.Element | string {
  // Handle inline code
  const parts: (JSX.Element | string)[] = [];
  let lastIndex = 0;
  const codeRegex = /`([^`]+)`/g;
  let match;

  while ((match = codeRegex.exec(text)) !== null) {
    parts.push(text.substring(lastIndex, match.index));
    parts.push(
      <code key={match.index} className="bg-light-gray/50 dark:bg-dark-surface px-1.5 py-0.5 rounded text-xs font-mono border border-mid-gray/20">
        {match[1]}
      </code>
    );
    lastIndex = codeRegex.lastIndex;
  }
  parts.push(text.substring(lastIndex));

  // Handle bold and italics
  return (
    <>
      {parts.map((part, idx) => {
        if (typeof part !== "string") return part;
        
        const boldRegex = /\*\*([^*]+)\*\*/g;
        const italicRegex = /\*([^*]+)\*/g;
        const subParts: (JSX.Element | string)[] = [];
        let lastIdx = 0;
        let match2;

        while ((match2 = boldRegex.exec(part)) !== null) {
          subParts.push(part.substring(lastIdx, match2.index));
          subParts.push(
            <strong key={match2.index} className="font-bold">
              {match2[1]}
            </strong>
          );
          lastIdx = boldRegex.lastIndex;
        }
        subParts.push(part.substring(lastIdx));

        return <span key={idx}>{subParts}</span>;
      })}
    </>
  );
}
