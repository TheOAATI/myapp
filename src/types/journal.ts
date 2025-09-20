export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  drawings?: { url: string }[];
  photos?: { url: string; caption?: string }[];
  mood?: string;
  tags?: string[];
}

export interface JournalFormData {
  title: string;
  content: string;
  date: string;
  drawings?: { url: string }[];
  photos?: { url: string; caption?: string }[];
  mood?: string;
  tags?: string[];
}