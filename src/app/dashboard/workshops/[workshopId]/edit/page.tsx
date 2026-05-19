'use client';

import { useParams } from 'next/navigation';
import { WorkshopFormPage } from '@/components/workshops/WorkshopFormPage';

export default function EditWorkshopPage() {
  const { workshopId } = useParams<{ workshopId: string }>();
  return <WorkshopFormPage mode="edit" workshopId={workshopId} />;
}
