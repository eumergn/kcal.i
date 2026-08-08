import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { usePlan } from '@/context/PlanContext';
import { FoodCatalogEntry } from '@/constants/foodCatalog';

type ScannedProduct = {
  id: string;
  name: string;
  caloriesPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
};

/**
 * Looks up a scanned barcode via OpenFoodFacts' free public API - no key needed,
 * and it has strong coverage of French retail products specifically, which is why
 * it's the right fit here rather than an AI-vision photo-estimate approach.
 */
async function lookupBarcode(barcode: string): Promise<ScannedProduct | null> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
  const json = await res.json();
  if (json.status !== 1 || !json.product) return null;

  const n = json.product.nutriments ?? {};
  return {
    id: `off-${barcode}`,
    name: json.product.product_name || json.product.product_name_fr || `Product ${barcode}`,
    caloriesPer100: n['energy-kcal_100g'] ?? 0,
    proteinPer100: n['proteins_100g'] ?? 0,
    carbsPer100: n['carbohydrates_100g'] ?? 0,
    fatPer100: n['fat_100g'] ?? 0,
  };
}

export default function ScanScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { addFoodToCatalog } = usePlan();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ScannedProduct | null>(null);
  const [added, setAdded] = useState(false);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);
    setError(null);
    try {
      const result = await lookupBarcode(data);
      if (!result) {
        setError("Couldn't find this product in the database. Try another item.");
      } else {
        setProduct(result);
      }
    } catch {
      setError('Network error looking up this product.');
    } finally {
      setLoading(false);
    }
  };

  const scanAnother = () => {
    setScanned(false);
    setProduct(null);
    setError(null);
    setAdded(false);
  };

  const handleAddToCatalog = () => {
    if (!product) return;
    const entry: FoodCatalogEntry = {
      id: product.id,
      name: product.name,
      caloriesPer100: product.caloriesPer100,
      proteinPer100: product.proteinPer100,
      carbsPer100: product.carbsPer100,
      fatPer100: product.fatPer100,
      pricePer100: 0, // price isn't in OpenFoodFacts - user sets it in Grocery once they know it
    };
    addFoodToCatalog(entry);
    setAdded(true);
  };

  if (!permission) {
    return <View style={[styles.center, { backgroundColor: c.background }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <FontAwesome name="camera" size={32} color={c.secondaryText} style={{ marginBottom: 16 }} />
        <Text style={[styles.permissionText, { color: c.text }]}>Camera access is needed to scan product barcodes.</Text>
        <Pressable onPress={requestPermission} style={[styles.primaryButton, { backgroundColor: c.ringCalories }]}>
          <Text style={styles.primaryButtonText}>Grant camera access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {!product && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        />
      )}

      {!product && (
        <View style={styles.overlay} lightColor="transparent" darkColor="transparent">
          <View style={styles.scanFrame} />
          <Text style={styles.overlayHint}>Point the camera at a product barcode</Text>
        </View>
      )}

      {loading && (
        <View style={[styles.center, styles.resultCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
          <ActivityIndicator color={c.ringCalories} />
          <Text style={[styles.loadingText, { color: c.secondaryText }]}>Looking up product...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={[styles.resultCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
          <Text style={[styles.errorText, { color: c.text }]}>{error}</Text>
          <Pressable onPress={scanAnother} style={[styles.primaryButton, { backgroundColor: c.ringCalories }]}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
        </View>
      )}

      {product && !loading && (
        <View style={[styles.resultCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
          <Text style={[styles.productName, { color: c.text }]} numberOfLines={2}>{product.name}</Text>
          <Text style={[styles.productCalories, { color: c.text }]}>{Math.round(product.caloriesPer100)} kcal /100g</Text>
          <Text style={styles.productMacros}>
            <Text style={{ color: c.ringProtein, fontWeight: '700' }}>P {product.proteinPer100.toFixed(1)}g</Text>
            <Text style={{ color: c.secondaryText }}> · </Text>
            <Text style={{ color: c.ringCarbs, fontWeight: '700' }}>C {product.carbsPer100.toFixed(1)}g</Text>
            <Text style={{ color: c.secondaryText }}> · </Text>
            <Text style={{ color: c.ringFat, fontWeight: '700' }}>F {product.fatPer100.toFixed(1)}g</Text>
          </Text>

          {added ? (
            <Text style={[styles.addedText, { color: c.success }]}>Added - find it under &quot;Add food&quot; in any meal.</Text>
          ) : (
            <Pressable onPress={handleAddToCatalog} style={[styles.primaryButton, { backgroundColor: c.ringCalories }]}>
              <Text style={styles.primaryButtonText}>Add to my foods</Text>
            </Pressable>
          )}
          <Pressable onPress={scanAnother} style={styles.secondaryButton}>
            <Text style={[styles.secondaryButtonText, { color: c.secondaryText }]}>Scan another</Text>
          </Pressable>
          {added && (
            <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
              <Text style={[styles.secondaryButtonText, { color: c.secondaryText }]}>Done</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  permissionText: { fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 20 },

  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 260, height: 160, borderRadius: 20, borderWidth: 3, borderColor: 'rgba(255,255,255,0.85)' },
  overlayHint: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', marginTop: 20, textAlign: 'center', paddingHorizontal: 40 },

  resultCard: {
    position: 'absolute', left: 20, right: 20, bottom: 40, borderRadius: 22, padding: 24, gap: 4, borderWidth: StyleSheet.hairlineWidth,
  },
  loadingText: { fontSize: 13, fontWeight: '600', marginTop: 10 },
  errorText: { fontSize: 14, fontWeight: '600', marginBottom: 16, textAlign: 'center' },

  productName: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  productCalories: { fontFamily: 'SpaceMono', fontSize: 20, fontWeight: '700', marginBottom: 6 },
  productMacros: { fontSize: 13, marginBottom: 18 },
  addedText: { fontSize: 13, fontWeight: '600', marginBottom: 4 },

  primaryButton: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { fontSize: 15, fontWeight: '700', color: '#04110D' },
  secondaryButton: { paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { fontSize: 13, fontWeight: '600' },
});
