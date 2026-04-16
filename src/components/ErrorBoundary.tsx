import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; stack: string | null; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, stack: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, stack: error.stack || null };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('[ErrorBoundary] Caught crash:', error);
    console.error('[ErrorBoundary] Component stack:', info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Uygulama Hatası</Text>
          <Text style={styles.subtitle}>{this.state.error?.message || 'Bilinmeyen hata'}</Text>
          <ScrollView style={styles.stackBox} showsVerticalScrollIndicator={false}>
            <Text style={styles.stack}>{this.state.stack}</Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => {
              this.setState({ hasError: false, error: null, stack: null });
            }}
          >
            <Text style={styles.btnText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080b12',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: '100%' as any,
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { color: '#ff4d6d', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  subtitle: { color: '#e8edf5', fontSize: 15, textAlign: 'center', marginBottom: 16, lineHeight: 22 },
  stackBox: {
    maxHeight: 200,
    width: '100%',
    backgroundColor: '#0d1117',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,77,109,0.2)',
  },
  stack: { color: '#8892a4', fontSize: 11, fontFamily: 'monospace' },
  btn: {
    backgroundColor: '#00d4aa',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnText: { color: '#080b12', fontWeight: '900', fontSize: 16 },
});
