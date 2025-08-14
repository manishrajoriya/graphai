import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

class SubscriptionService {
  private static instance: SubscriptionService;
  private isInitialized = false;
  
  // Ensure SDK is configured before any operation
  private async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Skip initialization on web, RevenueCat SDK is native-only
      if (Platform.OS === 'web') {
        console.warn('SubscriptionService: Skipping RevenueCat initialization on web platform');
        this.isInitialized = true;
        return;
      }

      const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUCAT_API_KEY;
      const IOS_KEY = process.env.EXPO_PUBLIC_REVENUCAT_API_KEY;

      if (Platform.OS === 'android') {
        if (!ANDROID_KEY) throw new Error('Missing EXPO_PUBLIC_REVENUECAT_API_KEY env var for Android');
        await Purchases.configure({ apiKey: ANDROID_KEY });
      } else if (Platform.OS === 'ios') {
        if (!IOS_KEY) throw new Error('Missing EXPO_PUBLIC_REVENUECAT_IOS_KEY env var for iOS');
        await Purchases.configure({ apiKey: IOS_KEY });
      } else {
        // Other native platforms (just in case)
        const key = ANDROID_KEY || IOS_KEY;
        if (!key) throw new Error('Missing RevenueCat API key for this platform');
        await Purchases.configure({ apiKey: key });
      }

      // Set up customer info listener
      Purchases.addCustomerInfoUpdateListener(this.handleCustomerInfoUpdate.bind(this));
      
      this.isInitialized = true;
      console.log('SubscriptionService: Initialized successfully sss');
    } catch (error) {
      console.error('SubscriptionService: Initialization failed:', error);
      throw error;
    }
  }

  private async handleCustomerInfoUpdate(customerInfo: CustomerInfo) {
    console.log('SubscriptionService: Customer info updated:', customerInfo);
    // Handle any subscription status changes - no credit syncing needed
  }

  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      await this.ensureInitialized();
      if (Platform.OS === 'web') return null;
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('SubscriptionService: Failed to get offerings:', error);
      return null;
    }
  }

  async purchasePackage(pack: PurchasesPackage): Promise<{ success: boolean; error?: string; isPending?: boolean }> {
    try {
      await this.ensureInitialized();
      if (Platform.OS === 'web') {
        return { success: false, error: 'Purchases are not available on web.' };
      }
      console.log('SubscriptionService: Purchasing package:', pack.identifier);
      // Attempt the purchase
      const { customerInfo } = await Purchases.purchasePackage(pack);
      console.log('SubscriptionService: Purchase successful, customer info updated');
      
      return { success: true };
    } catch (error: any) {
      console.error('Purchase failed:', error);
      if (error.userCancelled || error.code === 'USER_CANCELED') {
        return { success: false, error: 'Purchase cancelled' };
      }
      if (error.code === 'PURCHASE_NOT_ALLOWED_ERROR') {
        return { success: false, error: 'Purchases are not allowed on this device. Please check your device settings.' };
      }
      if (error.code === 'PAYMENT_PENDING_ERROR') {
        return { 
          success: false, 
          error: 'Payment is pending. Your payment is being processed and will be confirmed shortly. You can check your purchase status or try again in a few minutes.',
          isPending: true 
        };
      }
      if (error.code === 'PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR') {
        return { success: false, error: 'This subscription is currently unavailable. Please try again later.' };
      }
      if (error.code === 'PRODUCT_ALREADY_PURCHASED_ERROR') {
        return { success: false, error: 'You already own this item. Please try restoring your purchases.' };
      }
      if (error.code === 'RECEIPT_IN_USE_BY_OTHER_SUBSCRIBER_ERROR') {
        return { success: false, error: 'This purchase is linked to another user account. Please login to that account or contact support.' };
      }
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
        return { success: false, error: 'Network error. Please check your connection and try again.' };
      }
      return { success: false, error: error.message || 'Purchase failed. Please try again.' };
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    try {
      await this.ensureInitialized();
      if (Platform.OS === 'web') throw new Error('Restore not available on web');
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (error) {
      console.error('SubscriptionService: Failed to restore purchases:', error);
      throw error;
    }
  }

  async checkSubscriptionStatus(): Promise<{ isSubscribed: boolean; entitlements: string[] }> {
    try {
      await this.ensureInitialized();
      if (Platform.OS === 'web') return { isSubscribed: false, entitlements: [] };
      const customerInfo = await Purchases.getCustomerInfo();
      const entitlements = Object.keys(customerInfo.entitlements.active);
      const isSubscribed = entitlements.length > 0;
      
      return {
        isSubscribed,
        entitlements
      };
    } catch (error) {
      console.error('SubscriptionService: Failed to check subscription status:', error);
      return { isSubscribed: false, entitlements: [] };
    }
  }

  async getSubscriptionInfo(): Promise<{
    isSubscribed: boolean;
    currentPlan?: string;
    expirationDate?: string;
    entitlements: string[];
  }> {
    try {
      await this.ensureInitialized();
      if (Platform.OS === 'web') return { isSubscribed: false, entitlements: [] };
      const customerInfo = await Purchases.getCustomerInfo();
      const activeEntitlements = customerInfo.entitlements.active;
      const entitlementKeys = Object.keys(activeEntitlements);
      
      if (entitlementKeys.length === 0) {
        return {
          isSubscribed: false,
          entitlements: []
        };
      }

      // Get the first active entitlement for plan info
      const firstEntitlement = activeEntitlements[entitlementKeys[0]];
      
      return {
        isSubscribed: true,
        currentPlan: firstEntitlement.productIdentifier,
        expirationDate: firstEntitlement.expirationDate || '',
        entitlements: entitlementKeys
      };
    } catch (error) {
      console.error('SubscriptionService: Failed to get subscription info:', error);
      return {
        isSubscribed: false,
        entitlements: []
      };
    }
  }

  // Check if user has access to premium features
  async hasAccess(entitlementId: string = 'premium'): Promise<boolean> {
    try {
      await this.ensureInitialized();
      if (Platform.OS === 'web') return false;
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo.entitlements.active[entitlementId] !== undefined;
    } catch (error) {
      console.error('SubscriptionService: Failed to check access:', error);
      return false;
    }
  }

  // Set user ID for RevenueCat
  async setUserId(userId: string): Promise<void> {
    try {
      await this.ensureInitialized();
      if (Platform.OS === 'web') return;
      await Purchases.logIn(userId);
      console.log('SubscriptionService: User ID set successfully');
    } catch (error) {
      console.error('SubscriptionService: Failed to set user ID:', error);
      throw error;
    }
  }

  // Log out user
  async logOut(): Promise<void> {
    try {
      await this.ensureInitialized();
      if (Platform.OS === 'web') return;
      await Purchases.logOut();
      console.log('SubscriptionService: User logged out successfully');
    } catch (error) {
      console.error('SubscriptionService: Failed to log out user:', error);
      throw error;
    }
  }
}

export default SubscriptionService.getInstance();
