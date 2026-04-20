import { lazy, Suspense, useState } from "react";
import { Download, Share2, Star } from "lucide-react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

const PDFViewer = lazy(() => import("@/pages/academics/PDFViewer").then((m) => ({ default: m.PDFViewer })));

export function MaterialDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState("full");
  const [page, setPage] = useState(1);

  return (
    <div className="space-y-4 pb-20">
      <Card className="border-0 text-white" style={{ background: "var(--gradient-ai)" }}>
        <p className="text-label text-white/80">Material #{id}</p>
        <h2 className="text-h2">Advanced Engineering Notes</h2>
      </Card>

      <SegmentedControl
        items={[{ value: "full", label: "Full Material" }, { value: "summary", label: "AI Summary" }]}
        value={tab}
        onChange={setTab}
      />

      {tab === "full" ? (
        <Card>
          <Suspense fallback={<p className="text-body-sm">Loading document engine...</p>}>
            <PDFViewer file="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf" page={page} />
          </Suspense>
          <div className="mt-3 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <span className="text-body-sm">Page {page}</span>
            <Button variant="ghost" onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </Card>
      ) : (
        <Card>
          <p className="text-body-md leading-relaxed">This summary highlights core equations, assumptions, and exam-focused checkpoints for this material. Use it as a pre-reading shortcut before class revisions.</p>
          <p className="mt-3 text-caption text-mid-gray">Summarized by Campus Lab AI</p>
        </Card>
      )}

      <div className="safe-bottom fixed bottom-0 left-1/2 z-20 flex w-full max-w-[430px] -translate-x-1/2 gap-2 border-t border-mid-gray/20 bg-white p-3 dark:border-dark-border dark:bg-dark-surface">
        <Button className="flex-1" variant="secondary"><Download className="mr-1 h-4 w-4" /> Download</Button>
        <Button className="flex-1" variant="secondary"><Share2 className="mr-1 h-4 w-4" /> Share</Button>
        <Button className="flex-1" variant="secondary"><Star className="mr-1 h-4 w-4" /> Rate</Button>
      </div>
    </div>
  );
}
