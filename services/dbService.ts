import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { FormattedAnalysis } from '../components/AnalysisView';
import { MarketResearchReport } from './aiServices';

let db: SQLiteDatabase;

async function getDb(): Promise<SQLiteDatabase> {
  if (!db) {
    db = await openDatabaseAsync('chartAnalysis.db');
  }
  return db;
}

// Initialize the database and create the table if it doesn't exist
export async function initDB(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      data TEXT NOT NULL,
      chatHistory TEXT,
      timestamp TEXT NOT NULL
    );
  `);
}

// Save a new analysis to the database
export const saveAnalysis = async (analysis: FormattedAnalysis) => {
  const db = await getDb();
  const data = JSON.stringify(analysis);
  const timestamp = new Date().toISOString();

  await db.runAsync('INSERT INTO history (type, title, data, timestamp) VALUES (?, ?, ?, ?)', 
    'analysis', 'Chart Analysis', data, timestamp
  );
  console.log('Analysis saved to history');
};

export const saveResearch = async (report: MarketResearchReport, chatHistory: any[]) => {
  const db = await getDb();
  const data = JSON.stringify(report);
  const chatHistoryStr = JSON.stringify(chatHistory);
  const timestamp = new Date().toISOString();

  await db.runAsync('INSERT INTO history (type, title, data, timestamp, chatHistory) VALUES (?, ?, ?, ?, ?)',
    'research', report.companyName, data, timestamp, chatHistoryStr
  );
  console.log('Research report saved to history');
};

// Define a type for the history items returned from the DB
export interface HistoryItem {
  id: number;
  type: 'analysis' | 'research';
  title: string;
  data: string; // JSON string of FormattedAnalysis or MarketResearchReport
  chatHistory?: string; // JSON string of chat messages
  timestamp: string;
}

// Delete a history item by ID
export const deleteHistoryItem = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.runAsync('DELETE FROM history WHERE id = ?', id);
};

export const updateChatHistory = async (id: number, chatHistory: any[]): Promise<void> => {
  const db = await getDb();
  const chatHistoryStr = JSON.stringify(chatHistory);
  await db.runAsync('UPDATE history SET chatHistory = ? WHERE id = ?', chatHistoryStr, id);
  console.log(`Chat history updated for item ${id}`);
};

// Fetch all history from the database
export async function fetchHistory(): Promise<HistoryItem[]> {
  const db = await getDb();
  const allRows = await db.getAllAsync<HistoryItem>('SELECT * FROM history ORDER BY timestamp DESC');
  return allRows;
}
