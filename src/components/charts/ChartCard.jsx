import { Card, CardBody, CardHeader } from "@/components/ui/Card";

/** Card wrapper for a chart with a plain-language insight line. */
export function ChartCard({ title, description, insight, action, children, className }) {
  return (
    <Card className={className}>
      <CardHeader title={title} description={description} action={action} />
      <CardBody className="pt-4">
        {children}
        {insight && <p className="mt-3 border-t border-line pt-3 text-[13px] text-ink-soft">{insight}</p>}
      </CardBody>
    </Card>
  );
}
