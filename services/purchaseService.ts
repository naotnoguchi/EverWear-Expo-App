import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage
} from 'react-native-purchases';
import { auth } from '../lib/authClient';
import { getAuthenticatedClient } from '../lib/dbClient';

export interface SubscriptionInfo {
  isActive: boolean;
  productId: string | null;
  expirationDate: Date | null;
  purchaseDate: Date | null;
  isTrialPeriod: boolean;
}

export class PurchaseService {
  private static instance: PurchaseService;
  private isConfigured = false;

  private constructor() {}

  static getInstance(): PurchaseService {
    if (!PurchaseService.instance) {
      PurchaseService.instance = new PurchaseService();
    }
    return PurchaseService.instance;
  }

  async configure(userId: string): Promise<void> {
    if (this.isConfigured) {
      return;
    }

    try {
      // API Key設定
      const apiKey = Platform.select({
        ios: process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY_IOS!,
        android: process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY_ANDROID!,
      });

      if (!apiKey) {
        throw new Error('Revenue Cat API key not found');
      }

      // Revenue Cat設定
      await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      await Purchases.configure({ apiKey });
      
      // ユーザーID設定
      await Purchases.logIn(userId);
      
      this.isConfigured = true;
      console.log('Revenue Cat configured successfully');
    } catch (error) {
      console.error('Error configuring Revenue Cat:', error);
      throw error;
    }
  }

  async getOfferings(): Promise<PurchasesOffering[]> {
    try {
      const offerings = await Purchases.getOfferings();
      return Object.values(offerings.all);
    } catch (error) {
      console.error('Error getting offerings:', error);
      throw error;
    }
  }

  async getCurrentSubscription(): Promise<SubscriptionInfo> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return this.parseCustomerInfo(customerInfo);
    } catch (error) {
      console.error('Error getting customer info:', error);
      return this.getDefaultSubscriptionInfo();
    }
  }

  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<CustomerInfo> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      // Supabaseに同期
      await this.syncSubscriptionToSupabase(customerInfo);
      
      return customerInfo;
    } catch (error) {
      console.error('Error purchasing package:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      
      // Supabaseに同期
      await this.syncSubscriptionToSupabase(customerInfo);
      
      return customerInfo;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      throw error;
    }
  }

  async syncSubscriptionToSupabase(customerInfo: CustomerInfo): Promise<void> {
    try {
      const subscriptionInfo = this.parseCustomerInfo(customerInfo);
      const user = await auth.getUser();
      
      if (!user.data.user) {
        throw new Error('User not authenticated');
      }

      // エンタイトルメントから product_id を取得
      const entitlements = customerInfo.entitlements.all;
      const premiumEntitlement = entitlements['EverWear Subscription'];
      
      // product_id を確実に取得
      let productId = subscriptionInfo.productId;
      if (!productId && premiumEntitlement) {
        productId = premiumEntitlement.productIdentifier;
      }
      
      // それでも取得できない場合は、subscriptionsByProductIdentifier から取得
      if (!productId) {
        const subscriptions = Object.values(customerInfo.subscriptionsByProductIdentifier);
        if (subscriptions.length > 0) {
          productId = subscriptions[0].productIdentifier;
        }
      }
      
      console.log('Syncing subscription with product_id:', productId);

      const subscriptionData = {
        user_id: user.data.user.id,
        revenue_cat_user_id: customerInfo.originalAppUserId,
        subscription_status: subscriptionInfo.isActive ? 'active' : 'expired',
        product_id: productId, // 確実にproduct_idを設定
        purchase_date: subscriptionInfo.purchaseDate?.toISOString(),
        expiration_date: subscriptionInfo.expirationDate?.toISOString(),
        original_purchase_date: subscriptionInfo.purchaseDate?.toISOString(),
        revenue_cat_entitlements: customerInfo.entitlements.all,
      };

      // 認証済みクライアントを取得
      const dbClient = await getAuthenticatedClient();
      
      const { error } = await dbClient
        .from('user_subscriptions')
        .upsert(subscriptionData, { onConflict: 'user_id' });

      if (error) {
        console.error('Error syncing subscription to Supabase:', error);
        throw error;
      }

      console.log('Subscription synced to Supabase successfully');
    } catch (error) {
      console.error('Error syncing subscription:', error);
      // エラーが発生してもユーザー体験を阻害しないようにログのみ出力
    }
  }

  private parseCustomerInfo(customerInfo: CustomerInfo): SubscriptionInfo {
    const entitlements = customerInfo.entitlements.all;
    
    // デバッグ: 利用可能なエンタイトルメントをログ出力
    console.log('Available entitlements:', Object.keys(entitlements));
    console.log('Customer info:', JSON.stringify(customerInfo, null, 2));
    
    // 複数のエンタイトルメント名を試す
    const possibleEntitlementNames = ['EverWear Subscription', 'premium', 'Premium', 'everwear_premium'];
    let premiumEntitlement = null;
    
    for (const name of possibleEntitlementNames) {
      if (entitlements[name]) {
        console.log(`Found entitlement: ${name}`, entitlements[name]);
        premiumEntitlement = entitlements[name];
        break;
      }
    }
    
    // もしくは、最初のアクティブなエンタイトルメントを使用
    if (!premiumEntitlement) {
      const activeEntitlements = Object.values(entitlements).filter(e => e.isActive);
      if (activeEntitlements.length > 0) {
        console.log('Using first active entitlement:', activeEntitlements[0]);
        premiumEntitlement = activeEntitlements[0];
      }
    }

    if (premiumEntitlement) {
      console.log('Premium entitlement found:', {
        productId: premiumEntitlement.productIdentifier,
        expirationDate: premiumEntitlement.expirationDate,
        isActive: premiumEntitlement.isActive,
        isSandbox: premiumEntitlement.isSandbox
      });
      
      // サブスクリプションの有効性をチェック（期限切れは期限切れとして扱う）
      console.log('Subscription evaluation:', {
        isActive: premiumEntitlement.isActive,
        expirationDate: premiumEntitlement.expirationDate,
        isSandbox: premiumEntitlement.isSandbox
      });
      
      if (premiumEntitlement.isActive) {
        return {
          isActive: true,
          productId: premiumEntitlement.productIdentifier,
          expirationDate: premiumEntitlement.expirationDate ? new Date(premiumEntitlement.expirationDate) : null,
          purchaseDate: premiumEntitlement.originalPurchaseDate ? new Date(premiumEntitlement.originalPurchaseDate) : null,
          isTrialPeriod: false,
        };
      }
    }

    console.log('No active premium entitlement found');
    return this.getDefaultSubscriptionInfo();
  }

  private getDefaultSubscriptionInfo(): SubscriptionInfo {
    return {
      isActive: false,
      productId: null,
      expirationDate: null,
      purchaseDate: null,
      isTrialPeriod: false,
    };
  }

  async logOut(): Promise<void> {
    try {
      await Purchases.logOut();
      this.isConfigured = false;
    } catch (error) {
      console.error('Error logging out from Revenue Cat:', error);
    }
  }
}

export const purchaseService = PurchaseService.getInstance(); 