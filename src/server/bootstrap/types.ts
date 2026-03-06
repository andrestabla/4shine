export type Role = 'lider' | 'mentor' | 'gestor' | 'admin';

export interface UserStats {
  progress?: number;
  tests?: number;
  connections?: number;
  students?: number;
  hours?: number;
  rating?: number;
  totalUsers?: number;
  activeCohorts?: number;
  uptime?: string;
  managedContent?: number;
  pendingReviews?: number;
  programSatisfaction?: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  role: string;
  image?: string;
}

export interface Challenge {
  id: number;
  title: string;
  description: string;
  type: 'strategic' | 'social' | 'personal';
}

export interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
  avatarUrl?: string;
  color: string;
  company: string;
  location: string;
  stats: UserStats;
  profession?: string;
  industry?: string;
  planType?: 'VIP' | 'Premium' | 'Empresa Élite' | 'Standard';
  bio?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  interests?: string[];
  projects?: Project[];
  testResults?: {
    shineWithin: number;
    shineOut: number;
    shineUp: number;
    shineBeyond: number;
  };
  nextChallenges?: Challenge[];
}

export interface Mentor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  avatar: string;
  sector: string;
  availability: string[];
}

export interface Mentee {
  id: number;
  name: string;
  company: string;
  progress: number;
  status: 'good' | 'warning' | 'danger';
  nextSession: string;
  planType: 'VIP' | 'Premium' | 'Empresa Élite' | 'Standard';
  seniority: 'Senior' | 'C-Level' | 'Director' | 'Manager' | 'VP';
  email: string;
  location: string;
  industry: string;
}

export interface Comment {
  id: number;
  author: string;
  avatar?: string;
  text: string;
  date: string;
  role?: string;
}

export interface LearningItem {
  id: number;
  title: string;
  type: 'video' | 'pdf' | 'scorm' | 'article' | 'podcast' | 'html' | 'ppt';
  duration: string;
  category: string;
  isRecommended: boolean;
  thumbnail?: string;
  likes: number;
  liked: boolean;
  commentsArray: Comment[];
  date: string;
  url?: string;
  seen?: boolean;
  progress?: number;
  tags?: string[];
  author?: string;
}

export interface MethodologyResource {
  id: number;
  title: string;
  type: 'pdf' | 'video' | 'podcast' | 'ppt' | 'html' | 'scorm';
  category:
    | 'Fundamentos'
    | 'Herramientas'
    | 'Evaluación'
    | 'Programas'
    | 'Reportes'
    | 'Implementación'
    | 'Casos';
  description: string;
  url: string;
  date: string;
  author: string;
  likes: number;
  liked: boolean;
  tags: string[];
  comments: Comment[];
  embedCode?: string;
}

export interface MentorshipSession {
  id: number;
  title: string;
  mentor: string;
  mentee?: string;
  menteeId?: number;
  date: string;
  time: string;
  type: 'individual' | 'grupal';
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending_rating' | 'pending_approval';
  link?: string;
  rating?: number;
  feedback?: string;
  joinUrl?: string;
  participants?: { name: string; avatar: string }[];
  privateNotes?: string;
}

export interface TimelineEvent {
  id: number;
  title: string;
  date: string;
  status: 'completed' | 'current' | 'locked';
  type: 'test' | 'mentoria' | 'milestone';
}

export interface NetworkingContact {
  id: number;
  name: string;
  role: string;
  company: string;
  location: string;
  sector: string;
  tags: string[];
  avatar: string;
  bio: string;
  experience: number;
  status: 'connected' | 'pending' | 'none';
}

export interface InterestGroup {
  id: number;
  name: string;
  description: string;
  members: number;
  category: string;
  image: string;
}

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  postedDate: string;
  applicants: number;
  tags: string[];
}

export interface Message {
  id: number;
  senderId: number | 'me';
  content: string;
  timestamp: string;
}

export interface Chat {
  id: number;
  participantId: number;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  messages: Message[];
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'message' | 'alert' | 'success' | 'info';
}

export interface Quote {
  text: string;
  author: string;
}

export interface NewsUpdate {
  id: number;
  title: string;
  category: string;
  summary: string;
  date: string;
  image: string;
  likes?: number;
}

export interface Workshop {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  type: 'Relacionamiento' | 'Formación' | 'Innovación' | 'Wellbeing' | 'Otro';
  facilitator: string;
  link?: string;
  attendees: { id: number; name: string; avatar: string; role: Role }[];
  status: 'upcoming' | 'completed' | 'cancelled';
  image?: string;
}

export interface MentorAssignment {
  id: number;
  mentorId: number;
  mentorName: string;
  courseId: number;
  courseTitle: string;
  assignedDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  progress: number;
  lastAccess?: string;
}

export interface BootstrapPayload {
  users: Record<Role, User>;
  availableMentors: Mentor[];
  mentees: Mentee[];
  learningContent: LearningItem[];
  methodologyContent: MethodologyResource[];
  mentorships: MentorshipSession[];
  timeline: TimelineEvent[];
  networking: NetworkingContact[];
  interestGroups: InterestGroup[];
  jobs: Job[];
  chats: Chat[];
  notifications: Notification[];
  quotes: Quote[];
  newsUpdates: NewsUpdate[];
  workshops: Workshop[];
  mentorTraining: LearningItem[];
  leaderTraining: LearningItem[];
  mentorAssignments: MentorAssignment[];
}
