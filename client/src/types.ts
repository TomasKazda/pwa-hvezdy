export type UserRole = 'parent' | 'child';

export interface User {
  id: number;
  email: string;
  displayName: string;
  photoUrl: string | null;
  familyId: number | null;
  role: UserRole | null;
  createdAt?: string;
}

export interface MeResponse {
  id: number;
  email: string;
  displayName: string;
  photoUrl: string | null;
  role: UserRole | null;
  familyId: number | null;
  isAdmin: boolean;
}

export interface Family {
  id: number;
  name: string;
  code: string;
  createdBy?: number | null;
  createdAt?: string;
}

export interface Child {
  id: number;
  displayName: string;
  email: string;
  photoUrl: string | null;
  balance: number;
}

export interface Transaction {
  id: number;
  familyId: number;
  childId: number;
  amount: number;
  description: string;
  wishId: number | null;
  authorId: number;
  createdAt: string;
}

export interface Wish {
  id: number;
  familyId: number;
  title: string;
  starCost: number | null;
  isPersistent: boolean;
  isSelfFulfillment: boolean;
  multiplier: number;
  webhookUrl: string | null;
  webhookParamName: string | null;
  hasWebhookSecret?: boolean;
  createdBy: number;
  createdAt: string;
  reachable?: boolean | null;
}

export interface ActivityType {
  id: number;
  familyId: number;
  name: string;
  value: number;
  direction: 'plus' | 'minus';
  createdBy: number;
  createdAt: string;
}

export interface ChildInvitation {
  id: number;
  code: string;
  familyId: number;
  createdBy: number;
  usageCount: number;
  createdAt: string;
}
