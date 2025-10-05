export type QuadrantName = 'do' | 'schedule' | 'delegate' | 'delete';

export interface Task {
  id: string;
  text: string;
  quadrant: QuadrantName;
  completed: boolean;
  scheduledTime: number | null; // Hour from 7 to 19
  duration: number; // Duration in hours
}

export interface CollectionTask {
  id: string;
  text: string;
}

export type TaskCollections = Record<string, CollectionTask[]>;
