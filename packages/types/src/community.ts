export type GroupKind = 'POOL' | 'TEAM';

export interface KnowledgeSummary {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
}

export interface KnowledgeArticle {
  slug: string;
  title: string;
  category: string;
  body: string;
}

export interface Group {
  id: string;
  kind: GroupKind;
  name: string;
  description: string | null;
  memberCount: number;
  joined: boolean;
}

export interface GroupInput {
  kind: GroupKind;
  name: string;
  description?: string;
}

export interface Feedback {
  id: string;
  kind: string;
  message: string;
  createdAt: string;
}

export interface FeedbackInput {
  kind: string;
  message: string;
}
