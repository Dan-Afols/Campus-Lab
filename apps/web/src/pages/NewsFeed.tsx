import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Pin, Share2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useNewsQuery, useBookmarkNewsMutation } from "@/queries/useNewsQueries";

const categories = ["ALL", "ACADEMIC", "EVENT", "URGENT", "SPORTS", "ADMIN"];

type NewsItem = {
  id: string;
  title: string;
  body: string;
  category: string;
  isPinned?: boolean;
  isUrgent?: boolean;
  createdAt: string;
  imageUrl?: string | null;
};

const fallback: NewsItem[] = [
  {
    id: "demo-1",
    title: "Hostel allocation review timetable released",
    body: "All 300 level students should confirm details before Friday.",
    category: "ACADEMIC",
    isPinned: true,
    createdAt: new Date().toISOString(),
    imageUrl: null
  },
  {
    id: "demo-2",
    title: "Urgent: Network maintenance tonight",
    body: "Campus Wi-Fi will be unavailable from 11:00 PM to 2:00 AM.",
    category: "URGENT",
    isUrgent: true,
    createdAt: new Date().toISOString(),
    imageUrl: null
  }
];

export function NewsFeed() {
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const { data, isLoading } = useNewsQuery();
  const bookmarkMutation = useBookmarkNewsMutation();

  const items = (Array.isArray(data) && data.length ? data : fallback) as NewsItem[];

  const filtered = useMemo(() => {
    return items
      .filter((item) => (category === "ALL" ? true : item.category?.toUpperCase() === category))
      .filter((item) => {
        const haystack = `${item.title} ${item.body}`.toLowerCase();
        return haystack.includes(search.trim().toLowerCase());
      })
      .sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)));
  }, [items, category, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-mid-gray/30 bg-white px-3 py-2 dark:border-dark-border dark:bg-dark-surface">
        <Search className="h-4 w-4 text-mid-gray" />
        <input
          className="focus-ring w-full border-0 bg-transparent text-body-sm"
          placeholder="Search news"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((item) => (
          <Chip key={item} active={item === category} onClick={() => setCategory(item)}>
            {item}
          </Chip>
        ))}
      </div>

      {isLoading ? <Card><p className="text-body-sm">Loading news...</p></Card> : null}

      <div className="space-y-3">
        {filtered.map((item) => (
          <Card key={item.id} className={item.isUrgent ? "border-coral/40 bg-coral/5" : ""}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {item.isPinned ? <Badge color="blue"><Pin className="mr-1 h-3 w-3" />Pinned</Badge> : null}
                  {item.isUrgent ? <Badge color="red"><AlertTriangle className="mr-1 h-3 w-3" />Urgent</Badge> : null}
                  <Badge color="amber">{item.category}</Badge>
                </div>
                <Link to={`/news/${item.id}`} className="text-body-lg font-semibold hover:text-electric-blue">
                  {item.title}
                </Link>
                <p className="mt-1 line-clamp-3 text-body-sm text-dark-gray dark:text-mid-gray">{item.body}</p>
                <p className="mt-2 text-caption text-mid-gray">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="ghost" size="sm" onClick={() => bookmarkMutation.mutate(item.id)}>Bookmark</Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (navigator.share) {
                      await navigator.share({ title: item.title, text: item.body.slice(0, 120), url: `${window.location.origin}/news/${item.id}` });
                    }
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
