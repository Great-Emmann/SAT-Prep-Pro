export interface StudentProfile {
  name: string;
  username: string;
  emoji: string;
  testDate: string;
  targetMath: number;
  targetReadingWriting: number;
  currentMath: number;
  currentReadingWriting: number;
  focusPreference: string;
}

export interface TimetableConfig {
  availableSlots: string[]; // e.g. ["Morning (8am - 12pm)", "Afternoon (12pm - 5pm)", "Evening (5pm - 9pm)"]
  timeCommitment: string; // e.g. "1 hour", "2 hours", "3 hours+"
  preference: "ai" | "custom";
  schedule: Record<string, string[]>; // e.g. { "Monday": ["Algebra review", "Vocabulary flashcards"] }
  weeklyHours?: number;
  focusSubject?: string;
}

export interface PracticeScore {
  id: string;
  date: string;
  math: number;
  readingWriting: number;
  notes: string;
  isMockExam?: boolean;
}

export interface TopicMastery {
  algebra: number; // 0-100
  advancedMath: number;
  geometry: number;
  dataAnalysis: number;
  readingComprehension: number;
  grammar: number;
  writing: number;
}

export interface StudyTimeLog {
  id: string;
  date: string; // YYYY-MM-DD
  mathHours: number;
  readingHours: number;
  writingHours: number;
}

export interface Message {
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
}

export interface MockExamSection {
  module1: Question[];
  module2Easy: Question[];
  module2Hard: Question[];
}

export interface MockExam {
  id: string;
  title: string;
  readingWriting: MockExamSection;
  math: MockExamSection;
}

export interface LeaderboardEntry {
  name: string;
  username: string;
  emoji: string;
  points: number;
  streak: number;
  targetScore?: number;
  isUser?: boolean;
}

export interface WeeklyChallenge {
  id: string;
  text: string;
  points: number;
  completed: boolean;
}

export interface MistakeJournalEntry {
  id: string;
  question: Question;
  selectedAnswerIndex: number;
  userNotes: string;
  dateAdded: string;
  resolved: boolean;
  notesHistory?: { date: string; text: string }[];
  categoryTag?: "Careless Error" | "Concept Gap" | "Misread / Trap" | "Time Pressure" | "General";
  section?: "Math" | "Reading & Writing";
}

