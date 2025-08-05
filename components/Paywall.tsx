import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import Purchases, { PurchasesOffering } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { CustomerInfo } from 'react-native-purchases';

type PaywallScreenProps = {
  onDismiss?: () => void;
  onPurchaseCompleted?: (customerInfo: CustomerInfo) => void;
  onRestoreCompleted?: (customerInfo: CustomerInfo) => void;
};

const PaywallScreen: React.FC<PaywallScreenProps> = ({ onDismiss, onPurchaseCompleted, onRestoreCompleted }) => {
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getOfferings = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current) {
          setOffering(offerings.current);
        }
      } catch (e) {
        console.error('Error fetching offerings:', e);
      } finally {
        setIsLoading(false);
      }
    };

    getOfferings();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!offering) {
    return (
      <View style={styles.container}>
        <Text>No paywall offering available.</Text>
      </View>
    );
  }

  return (
    <RevenueCatUI.Paywall
      options={{ offering }}
      onDismiss={onDismiss}
      onPurchaseCompleted={({ customerInfo }) => onPurchaseCompleted?.(customerInfo)}
      onRestoreCompleted={({ customerInfo }) => onRestoreCompleted?.(customerInfo)}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PaywallScreen;


