import { notFound } from "next/navigation";
import { withClient } from "@/server/db/pool";
import { getDiscoverySessionByPublicId } from "@/features/descubrimiento/service";
import { PdfDownloadExperience } from "@/features/descubrimiento/PdfDownloadExperience";

interface PageParams {
  params: Promise<{ publicId: string }>;
}

export default async function DiscoveryPdfDownloadPage({ params }: PageParams) {
  const { publicId } = await params;

  const session = await withClient((client) =>
    getDiscoverySessionByPublicId(client, publicId),
  );

  if (!session) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4">
      <PdfDownloadExperience session={session} />
    </main>
  );
}
