import { notFound } from "next/navigation";
import { withClient } from "@/server/db/pool";
import { getDiscoverySessionByPublicId } from "@/features/descubrimiento/service";
import { ResultsView } from "@/features/descubrimiento/ResultsView";

interface PageParams {
  params: Promise<{ publicId: string }>;
}

export default async function DiscoverySharePage({ params }: PageParams) {
  const { publicId } = await params;

  const session = await withClient((client) =>
    getDiscoverySessionByPublicId(client, publicId),
  );

  if (!session) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-16 pt-8 md:px-6">
      <ResultsView
        state={{
          name: session.nameSnapshot,
          role: session.roleSnapshot,
          answers: session.answers,
          currentIdx: session.currentIdx,
          status: "results",
        }}
        publicId={session.publicId}
        isPublic={true}
        embedded={false}
      />
    </main>
  );
}

