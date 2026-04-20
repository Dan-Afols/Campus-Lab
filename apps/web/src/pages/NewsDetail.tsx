import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Share2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useNewsQuery } from "@/queries/useNewsQueries";
import { sanitizeHtml } from "@/utils/sanitizeHtml";

export function NewsDetail() {
  const { id } = useParams();
  const { data, isLoading } = useNewsQuery();
  const item = useMemo(() => (Array.isArray(data) ? data.find((news: any) => news.id === id) : null), [data, id]);

  if (isLoading) {
    return <Card><p className="text-body-sm">Loading post...</p></Card>;
  }

  if (!item) {
    return (
      <Card>
        <p className="text-body-sm">News post not found.</p>
        <Link to="/news" className="mt-2 inline-block text-electric-blue">Back to News</Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="h-60 w-full rounded-xl object-cover" loading="lazy" /> : null}
      <Card>
        <p className="text-caption text-mid-gray">{item.category} · {new Date(item.createdAt).toLocaleString()}</p>
        <h1 className="mt-1 text-h1">{item.title}</h1>
        <article
          className="prose mt-3 max-w-none text-body-md leading-relaxed dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml((item.body || "").replace(/\n/g, "<br/>")) }}
        />
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={async () => {
            if (navigator.share) {
              await navigator.share({ title: item.title, url: window.location.href });
            }
          }}>
            <Share2 className="mr-1 h-4 w-4" />Share
          </Button>
          <Link className="inline-flex" to="/news"><Button variant="ghost">Back to News</Button></Link>
        </div>
      </Card>
    </div>
  );
}
