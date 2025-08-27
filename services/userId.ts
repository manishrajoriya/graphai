import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';

const STORAGE_KEY = 'analytics_user_id';

function generateFallbackId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `anon_${Date.now()}_${rand}`;
}

export async function resolveUserId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    // Prefer RevenueCat appUserID if available
    try {
      const rcId = await Purchases.getAppUserID();
      console.log('RevenueCat appUserID:', rcId);
      if (rcId && typeof rcId === 'string' && rcId.length > 0) {
        await AsyncStorage.setItem(STORAGE_KEY, rcId);
        return rcId;
      }
    } catch {}

    const id = generateFallbackId();
    await AsyncStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // In worst case, return an ephemeral ID without persistence
    return generateFallbackId();
  }
}
