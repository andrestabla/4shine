import { PageTitle } from '@/components/dashboard/PageTitle';
import { PlanEditor } from '@/components/dashboard/planes/PlanEditor';

export default function NuevoPlanPage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="Nuevo plan"
        subtitle="Define las características comerciales y los permisos por módulo del nuevo plan."
      />
      <PlanEditor />
    </div>
  );
}
