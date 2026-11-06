import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

/** Form shell with consistent Save / Cancel behavior. */
export function SettingsSection({ title, description, dirty, onSave, onCancel, children }) {
  return (
    <Card>
      <form onSubmit={(e) => { e.preventDefault(); onSave(); }} noValidate>
        <CardHeader title={title} description={description} />
        <CardBody className="space-y-5">{children}</CardBody>
        <div className="flex items-center justify-end gap-2 border-t border-line bg-cream-50 px-5 py-3 rounded-b-xl">
          {dirty && <span className="mr-auto text-xs font-medium text-warn-700">Unsaved changes</span>}
          <Button type="button" onClick={onCancel} disabled={!dirty}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={!dirty}>Save changes</Button>
        </div>
      </form>
    </Card>
  );
}
