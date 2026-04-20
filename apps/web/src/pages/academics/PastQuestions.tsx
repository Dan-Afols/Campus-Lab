import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { usePastQuestionsQuery } from "@/queries/usePastQuestionsQuery";

export function PastQuestions() {
  const { data, isLoading } = usePastQuestionsQuery();

  const rows = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-4">
      <Card variant="feature" className="border-0 text-white" style={{ background: "var(--gradient-brand)" }}>
        <h2 className="text-h2">Past Questions</h2>
        <p className="mt-1 text-body-sm text-white/90">Practice exam questions by course. New uploads appear live.</p>
      </Card>

      {isLoading ? <Card><p className="text-body-sm">Loading past questions...</p></Card> : null}

      {!isLoading && rows.length === 0 ? (
        <Card>
          <p className="text-body-sm text-dark-gray dark:text-mid-gray">No past questions available yet for your department and level.</p>
        </Card>
      ) : null}

      <div className="space-y-2">
        {rows.map((item: any) => (
          <Card key={item.id} variant="list-item">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-body-sm font-semibold">{item.courseCode} ({item.year})</p>
                <p className="text-caption text-mid-gray">Uploaded {new Date(item.createdAt).toLocaleString()}</p>
              </div>
              <Badge color="blue">PDF</Badge>
            </div>
            <a href={item.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-body-sm text-electric-blue">
              Open file
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}
