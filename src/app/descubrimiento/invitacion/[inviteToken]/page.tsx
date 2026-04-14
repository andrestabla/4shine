import { InvitationAccessExperience } from "@/features/descubrimiento/InvitationAccessExperience";

interface PageParams {
  params: Promise<{ inviteToken: string }>;
}

export default async function DiscoveryInvitationPage({ params }: PageParams) {
  const { inviteToken } = await params;
  return <InvitationAccessExperience inviteToken={inviteToken} />;
}
