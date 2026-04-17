import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/constants';

export default function TaxScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tax</Text>
      <Text style={styles.subtitle}>Tax ekranı yakında burada olacak. Beraber tasarlayacağız.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 32, backgroundColor: COLORS.background },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textMuted },
});
