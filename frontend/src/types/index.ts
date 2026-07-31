export type User = {
  id: string;
  fullName: string;
  email: string;
  major: string;
  avatarSeed: string;
};

export type AuthResponse = {
  token: string;
  expiresAt: string;
  user: User;
};

export type Course = {
  id: string;
  name: string;
  code: string;
  instructor: string;
  room: string;
  color: string;
  isArchived: boolean;
};

export type ScheduleEntry = {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  courseColor: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
};

export enum AcademicTaskType {
  Assignment = 0,
  ProjectExam = 1,
  Presentation = 2,
  Quiz = 3,
  PersonalTask = 4,
}

export enum AcademicTaskStatus {
  NotStarted = 0,
  InProgress = 1,
  Completed = 2,
  Submitted = 3,
}

export enum TaskPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Urgent = 3,
}

export type AcademicTask = {
  id: string;
  title: string;
  description: string;
  type: AcademicTaskType;
  status: AcademicTaskStatus;
  priority: TaskPriority;
  startDate: string | null;
  dueDate: string;
  progress: number;
  notes: string;
  courseId: string | null;
  courseName: string | null;
  courseColor: string | null;
  isOverdue: boolean;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  isImportant: boolean;
  sortOrder: number;
  courseId: string | null;
  courseName: string | null;
  updatedAt: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  kind: number;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
};

export type DashboardStats = {
  totalTasks: number;
  dueThisWeek: number;
  completedTasks: number;
  focusMinutesThisWeek: number;
};

export type Dashboard = {
  stats: DashboardStats;
  weeklySchedule: ScheduleEntry[];
  upcomingTasks: AcademicTask[];
  todaySchedule: ScheduleEntry[];
  notifications: Notification[];
  notes: Note[];
};

export type Statistics = {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  tasksByCourse: Record<string, number>;
  tasksByStatus: Record<string, number>;
  focusMinutesByDay: Record<string, number>;
};

export type FocusSession = {
  id: string;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
};
