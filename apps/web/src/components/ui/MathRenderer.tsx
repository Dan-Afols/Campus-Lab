import { useEffect, useState } from "react";

type MathRendererProps = {
  expression: string;
};

let katexPromise: Promise<any> | null = null;

async function loadKatex() {
  if (!katexPromise) {
    katexPromise = Promise.all([import("katex"), import("katex/dist/katex.min.css")]).then(([katex]) => katex.default);
  }
  return katexPromise;
}

export function MathRenderer({ expression }: MathRendererProps) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    void loadKatex().then((katex) => {
      if (!mounted) return;
      setHtml(katex.renderToString(expression, { throwOnError: false }));
    });

    return () => {
      mounted = false;
    };
  }, [expression]);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
