import { requestApi } from '@/lib/api-client';

export type ConnectionStatus = 'pending' | 'connected' | 'blocked' | 'rejected';
export type CommunityVisibility = 'open' | 'closed';

export interface ConnectionRecord {
  connectionId: string;
  requesterUserId: string;
  addresseeUserId: string;
  counterpartUserId: string;
  counterpartName: string;
  status: ConnectionStatus;
  requestedAt: string;
  respondedAt: string | null;
}

export interface NetworkPersonRecord {
  userId: string;
  displayName: string;
  primaryRole: string;
  organizationName: string | null;
  location: string | null;
  industry: string | null;
  profession: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isFollowing: boolean;
  connectionStatus: ConnectionStatus | 'none';
}

export interface CommunityLink {
  title: string;
  url: string;
}

export interface CommunityRecord {
  groupId: string;
  name: string;
  description: string | null;
  category: string | null;
  visibility: CommunityVisibility;
  isActive: boolean;
  memberCount: number;
  createdByUserId: string | null;
  createdByName: string | null;
  isMember: boolean;
  membershipRole: 'owner' | 'moderator' | 'member' | null;
  isGeneral: boolean;
  coverImageUrl: string | null;
  links: CommunityLink[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPostRecord {
  postId: string;
  groupId: string;
  groupName: string;
  authorUserId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  title: string;
  body: string;
  resourceUrl: string | null;
  isPinned: boolean;
  reactionCount: number;
  hasReacted: boolean;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentRecord {
  commentId: string;
  postId: string;
  authorUserId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  createdAt: string;
}

export interface ConnectedLeaderProfileRecord {
  userId: string;
  displayName: string;
  primaryRole: string;
  organizationName: string | null;
  avatarUrl: string | null;
  profession: string | null;
  industry: string | null;
  location: string | null;
  country: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  websiteUrl: string | null;
  interests: string[];
  projects: Array<{
    projectId: string;
    title: string;
    description: string | null;
    projectRole: string | null;
    imageUrl: string | null;
  }>;
}

export interface CreateConnectionInput {
  addresseeUserId: string;
}

export interface UpdateConnectionInput {
  status: ConnectionStatus;
}

export interface CreateCommunityInput {
  name: string;
  description?: string | null;
  category?: string | null;
  visibility?: CommunityVisibility;
}

export interface UpdateCommunityInput {
  name?: string;
  description?: string | null;
  category?: string | null;
  visibility?: CommunityVisibility;
  isActive?: boolean;
  coverImageUrl?: string | null;
  links?: CommunityLink[];
}

export interface CreateCommunityPostInput {
  title: string;
  body: string;
  resourceUrl?: string | null;
  isPinned?: boolean;
}

// ─── Connections ──────────────────────────────────────────────────────────────

export async function listConnections(): Promise<ConnectionRecord[]> {
  return requestApi<ConnectionRecord[]>('/api/v1/modules/networking/connections');
}

export async function listNetworkPeople(): Promise<NetworkPersonRecord[]> {
  return requestApi<NetworkPersonRecord[]>('/api/v1/modules/networking/people');
}

export async function createConnection(input: CreateConnectionInput): Promise<ConnectionRecord> {
  return requestApi<ConnectionRecord>('/api/v1/modules/networking/connections', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateConnection(connectionId: string, input: UpdateConnectionInput): Promise<ConnectionRecord> {
  return requestApi<ConnectionRecord>(`/api/v1/modules/networking/connections/${connectionId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteConnection(connectionId: string): Promise<{ connectionId: string }> {
  return requestApi<{ connectionId: string }>(`/api/v1/modules/networking/connections/${connectionId}`, {
    method: 'DELETE',
  });
}

// ─── Follows ──────────────────────────────────────────────────────────────────

export async function followUser(followedUserId: string): Promise<{ followedUserId: string; followedAt: string }> {
  return requestApi<{ followedUserId: string; followedAt: string }>('/api/v1/modules/networking/follows', {
    method: 'POST',
    body: JSON.stringify({ followedUserId }),
  });
}

export async function unfollowUser(followedUserId: string): Promise<{ followedUserId: string }> {
  return requestApi<{ followedUserId: string }>(`/api/v1/modules/networking/follows/${followedUserId}`, {
    method: 'DELETE',
  });
}

// ─── Communities ──────────────────────────────────────────────────────────────

export async function listCommunities(): Promise<CommunityRecord[]> {
  return requestApi<CommunityRecord[]>('/api/v1/modules/networking/communities');
}

export async function createCommunity(input: CreateCommunityInput): Promise<CommunityRecord> {
  return requestApi<CommunityRecord>('/api/v1/modules/networking/communities', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateCommunity(groupId: string, input: UpdateCommunityInput): Promise<CommunityRecord> {
  return requestApi<CommunityRecord>(`/api/v1/modules/networking/communities/${groupId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteCommunity(groupId: string): Promise<{ groupId: string }> {
  return requestApi<{ groupId: string }>(`/api/v1/modules/networking/communities/${groupId}`, {
    method: 'DELETE',
  });
}

export async function joinCommunity(groupId: string): Promise<{ groupId: string; membershipRole: 'owner' | 'moderator' | 'member' }> {
  return requestApi<{ groupId: string; membershipRole: 'owner' | 'moderator' | 'member' }>(
    `/api/v1/modules/networking/communities/${groupId}/memberships`,
    { method: 'POST' },
  );
}

export async function leaveCommunity(groupId: string): Promise<{ groupId: string }> {
  return requestApi<{ groupId: string }>(`/api/v1/modules/networking/communities/${groupId}/memberships`, {
    method: 'DELETE',
  });
}

// ─── Community posts ──────────────────────────────────────────────────────────

export async function listCommunityPosts(): Promise<CommunityPostRecord[]> {
  return requestApi<CommunityPostRecord[]>('/api/v1/modules/networking/community-posts');
}

export async function createCommunityPost(groupId: string, input: CreateCommunityPostInput): Promise<CommunityPostRecord> {
  return requestApi<CommunityPostRecord>(`/api/v1/modules/networking/communities/${groupId}/posts`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getConnectedLeaderProfile(userId: string): Promise<ConnectedLeaderProfileRecord> {
  return requestApi<ConnectedLeaderProfileRecord>(`/api/v1/modules/networking/people/${userId}/profile`);
}

// ─── Reactions ────────────────────────────────────────────────────────────────

export async function toggleReaction(postId: string): Promise<{ postId: string; hasReacted: boolean; reactionCount: number }> {
  return requestApi<{ postId: string; hasReacted: boolean; reactionCount: number }>(
    `/api/v1/modules/networking/community-posts/${postId}/reactions`,
    { method: 'POST' },
  );
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function listComments(postId: string): Promise<CommentRecord[]> {
  return requestApi<CommentRecord[]>(`/api/v1/modules/networking/community-posts/${postId}/comments`);
}

export async function createComment(postId: string, body: string): Promise<CommentRecord> {
  return requestApi<CommentRecord>(`/api/v1/modules/networking/community-posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}
