export type UserRole = 'parent' | 'child';

export interface User {
  id: number;
  email: string;
  displayName: string;
  photoUrl: string | null;
  familyId: number | null;
  role: UserRole | null;
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
  childId: number;
  amount: number;
  description: string;
  categoryId: number | null;
  authorId: number;
  authorName?: string;
  createdAt: string;
}

export interface Wish {
  id: number;
  title: string;
  starCost: number | null;
  isPersistent: boolean;
  createdBy: number;
  fulfilledAt: string | null;
  fulfilledForChildId: number | null;
  createdAt: string;
}

export interface ActivityType {
  id: number;
  name: string;
  defaultStars: number;
}

export interface ChildInvitation {
  id: number;
  code: string;
  usedBy: number | null;
  usedAt: string | null;
  createdAt: string;
}
