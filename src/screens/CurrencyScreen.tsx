import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/constants';

export default function CurrencyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Currency</Text>
      <Text style={styles.subtitle}>Currency ekranı yakında burada olacak. Beraber tasarlayacağız.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 32, backgroundColor: COLORS.background },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textMuted },
});
