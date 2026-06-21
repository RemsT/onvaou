import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

/**
 * Capture les erreurs de rendu (au lieu d'un crash « écran noir ») et affiche le message + la pile.
 * Utile surtout en build release/TestFlight pour diagnostiquer un crash au lancement.
 */
interface State { error: Error | null; info: string | null; }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    this.setState({ error, info: info?.componentStack ?? null });
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Une erreur est survenue</Text>
        <Text style={styles.msg}>{String(error?.message ?? error)}</Text>
        {error?.stack ? <Text style={styles.stack}>{error.stack}</Text> : null}
        {info ? <Text style={styles.stack}>{info}</Text> : null}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 24, paddingTop: 80 },
  title: { fontSize: 18, fontWeight: '800', color: '#C62828', marginBottom: 10 },
  msg: { fontSize: 14, color: '#0C3823', marginBottom: 12 },
  stack: { fontSize: 11, color: '#5F6368', fontFamily: 'Courier' },
});
