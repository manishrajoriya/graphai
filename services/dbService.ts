import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { FormattedAnalysis } from '../components/AnalysisView';
import { MarketResearchReport } from './aiServices';
import { supabase } from './supabase';

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
  
  // AI requests are now tracked in Supabase, not locally
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

// AI Request tracking interface
export interface AIRequestRecord {
  id?: number;
  user_id: string;
  request_type: 'chart_analysis' | 'market_research';
  is_premium_user: boolean;
  request_data?: any;
  response_data?: any;
  processing_time_ms?: number;
  success: boolean;
  created_at?: string;
}

// Track AI request for premium users in Supabase
export async function trackAIRequest(record: Omit<AIRequestRecord, 'id' | 'created_at'>): Promise<void> {
  try {
    const { error } = await supabase
      .from('ai_requests')
      .insert({
        user_id: record.user_id,
        request_type: record.request_type,
        is_premium_user: record.is_premium_user,
        request_data: record.request_data || null,
        response_data: record.response_data || null,
        processing_time_ms: record.processing_time_ms || null,
        success: record.success
      });

    if (error) {
      console.error('Failed to track AI request in Supabase:', error);
    } else {
      console.log(`AI request tracked: ${record.request_type} for user ${record.user_id}`);
    }
  } catch (error) {
    console.error('Error tracking AI request:', error);
  }
}

// Get AI request statistics for a user from Supabase
export async function getAIRequestStats(userId: string): Promise<{
  total_requests: number;
  chart_analysis_count: number;
  market_research_count: number;
  success_rate: number;
  avg_processing_time: number;
}> {
  try {
    const { data, error } = await supabase
      .from('ai_requests')
      .select('request_type, success, processing_time_ms')
      .eq('user_id', userId)
      .eq('is_premium_user', true);

    if (error) {
      console.error('Failed to fetch AI request stats:', error);
      return {
        total_requests: 0,
        chart_analysis_count: 0,
        market_research_count: 0,
        success_rate: 0,
        avg_processing_time: 0
      };
    }

    if (!data || data.length === 0) {
      return {
        total_requests: 0,
        chart_analysis_count: 0,
        market_research_count: 0,
        success_rate: 0,
        avg_processing_time: 0
      };
    }

    const total_requests = data.length;
    const chart_analysis_count = data.filter(r => r.request_type === 'chart_analysis').length;
    const market_research_count = data.filter(r => r.request_type === 'market_research').length;
    const successful_requests = data.filter(r => r.success).length;
    const processing_times = data.filter(r => r.processing_time_ms).map(r => r.processing_time_ms);
    const avg_processing_time = processing_times.length > 0 
      ? processing_times.reduce((a, b) => a + b, 0) / processing_times.length 
      : 0;

    return {
      total_requests,
      chart_analysis_count,
      market_research_count,
      success_rate: total_requests > 0 ? (successful_requests / total_requests) * 100 : 0,
      avg_processing_time
    };
  } catch (error) {
    console.error('Error getting AI request stats:', error);
    return {
      total_requests: 0,
      chart_analysis_count: 0,
      market_research_count: 0,
      success_rate: 0,
      avg_processing_time: 0
    };
  }
}

// Get recent AI requests for a user from Supabase
export async function getRecentAIRequests(userId: string, limit: number = 10): Promise<AIRequestRecord[]> {
  try {
    const { data, error } = await supabase
      .from('ai_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch recent AI requests:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting recent AI requests:', error);
    return [];
  }
}
