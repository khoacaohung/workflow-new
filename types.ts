
export enum TaskStatus {
  Draft = 'Draft',
  Submitted = 'Submitted',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Completed = 'Completed',
  PartiallyCompleted = 'Partially Completed'
}

export enum UserRole {
  Staff = 'Staff',
  Manager1 = 'Manager 1',
  Manager2 = 'Manager 2',
  Accountant1 = 'Accountant 1',
  Accountant2 = 'Accountant 2',
  CEO = 'CEO'
}

export enum ApprovalStep {
  Manager1Review = 1,
  Manager2Review = 2,
  Accountant1Review = 3,
  Accountant2Review = 4,
  CEOReview = 5
}

export interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface SubTask {
  id: string;
  parentId: string;
  taskCode: string;
  description: string;
  status: TaskStatus;
  currentStep: ApprovalStep;
  managerNote?: string;
  accountantNote?: string;
}

export interface ParentTask {
  id: string;
  code: string;
  employeeName: string;
  description: string;
  products: Product[];
  totalValue: number;
  deliveryTime: string;
  status: TaskStatus;
  createdAt: string;
  attachments?: string[];
}

export interface AppState {
  parentTasks: ParentTask[];
  subTasks: SubTask[];
  activeView: 'dashboard' | 'create' | 'approvals';
  currentRole: UserRole;
}
