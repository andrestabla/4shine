import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { getBootstrapPayloadForIdentity } from '@/server/bootstrap/service';
import type { BootstrapPayload, Role, User } from '@/server/bootstrap/types';
import { buildRequestSummary, recordAuditEvent } from '@/server/audit/service';
import type { ViewerAccessState } from '@/features/access/types';

function invitedViewerAccess(): ViewerAccessState {
  return {
    viewerTier: 'staff',
    planTypeCode: null,
    hasProgramSubscription: false,
    hasAnyPurchase: false,
    hasDiscoveryPurchase: true,
    mentorshipSessionCredits: 0,
    canAccessTrayectoria: false,
    canAccessDescubrimiento: true,
    canAccessLearningLibrary: false,
    canAccessProgramWorkbooks: false,
    canAccessProgramMentorships: false,
    canAccessCommunityModules: false,
    freeLearningOnly: true,
    purchasedProductCodes: [],
    catalog: [],
  };
}

function fallbackUserForRole(role: Role): User {
  const labels: Record<Role, string> = {
    lider: 'Líder',
    mentor: 'Mentor',
    gestor: 'Gestor del Programa',
    admin: 'Administrador',
    invitado: 'Invitado',
  };
  const colors: Record<Role, string> = {
    lider: 'bg-amber-500',
    mentor: 'bg-blue-600',
    gestor: 'bg-teal-600',
    admin: 'bg-slate-700',
    invitado: 'bg-violet-600',
  };
  return {
    id: '',
    name: 'Usuario 4Shine',
    role: labels[role],
    avatar: 'U',
    color: colors[role],
    company: '4Shine',
    location: 'Remoto',
    stats: {},
  };
}

function buildInvitedBootstrapPayload(identity: { userId: string; name: string }): BootstrapPayload {
  const currentUser: User = {
    ...fallbackUserForRole('invitado'),
    id: identity.userId,
    name: identity.name || 'Invitado 4Shine',
    avatar: (identity.name?.[0] ?? 'I').toUpperCase(),
  };
  return {
    currentUser,
    viewerAccess: invitedViewerAccess(),
    users: {
      lider: fallbackUserForRole('lider'),
      mentor: fallbackUserForRole('mentor'),
      gestor: fallbackUserForRole('gestor'),
      admin: fallbackUserForRole('admin'),
      invitado: currentUser,
    },
    availableMentors: [],
    mentees: [],
    learningContent: [],
    methodologyContent: [],
    mentorships: [],
    timeline: [],
    networking: [],
    interestGroups: [],
    jobs: [],
    chats: [],
    notifications: [],
    quotes: [],
    newsUpdates: [],
    workshops: [],
    mentorTraining: [],
    leaderTraining: [],
    mentorAssignments: [],
  };
}

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);

  if (!identity) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data =
      identity.guestScope === 'descubrimiento' || identity.role === 'invitado'
        ? buildInvitedBootstrapPayload(identity)
        : await getBootstrapPayloadForIdentity(identity.userId, identity.role);

    try {
      await recordAuditEvent(
        {
          action: 'bootstrap_me_load',
          moduleCode: 'dashboard',
          entityTable: 'app_core.users',
          entityId: identity.userId,
          changeSummary: buildRequestSummary(request, { role: identity.role }),
        },
        identity,
      );
    } catch (auditError) {
      console.error('Audit log failed', auditError);
    }

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: identity.userId,
          email: identity.email,
          name: identity.name,
          role: identity.role,
        },
        data,
      },
      { status: 200 },
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to build bootstrap payload',
        detail,
      },
      { status: 500 },
    );
  }
}
