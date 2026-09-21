import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_URL, API_URL_SOURCE } from '../api/client';
import { checkHealth, type HealthCheckResult } from '../api/health';
import { useTheme } from '../theme/ThemeProvider';

type Status = 'loading' | 'ok' | 'error';

interface State {
  status: Status;
  detail: string | null;
}

const LOADING_STATE: State = { status: 'loading', detail: null };

function toState(result: HealthCheckResult): State {
  return { status: result.ok ? 'ok' : 'error', detail: result.detail };
}

/**
 * Réplica móvel da `DiagnosticsPage` do `mem-words-frontend`: pública, sem
 * exigir sessão, para descobrir que o backend está fora do ar mesmo quando
 * isso impede o próprio login (ver spec `diagnostics/health-check`).
 */
export default function DiagnosticsScreen() {
  const theme = useTheme();
  const [state, setState] = useState<State>(LOADING_STATE);

  const runCheck = useCallback(() => {
    setState(LOADING_STATE);
    checkHealth().then((result) => setState(toState(result)));
  }, []);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  const statusLabel = {
    loading: 'Verificando…',
    ok: 'Backend acessível',
    error: 'Backend inacessível',
  }[state.status];

  const statusColor = {
    loading: theme.colors.textMuted,
    ok: theme.colors.success,
    error: theme.colors.danger,
  }[state.status];

  const statusBg = {
    loading: theme.colors.surfaceMuted,
    ok: theme.colors.successBg,
    error: theme.colors.dangerBg,
  }[state.status];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={[styles.badge, { backgroundColor: statusBg }]}>
        <Text style={[styles.badgeText, { color: statusColor, fontSize: theme.fontSize.md }]}>{statusLabel}</Text>
      </View>

      {state.detail !== null && (
        <Text style={[styles.detail, { color: theme.colors.text, fontSize: theme.fontSize.sm }]}>{state.detail}</Text>
      )}

      <View style={[styles.configBox, { borderColor: theme.colors.border }]}>
        <Text style={[styles.configLabel, { color: theme.colors.textMuted, fontSize: theme.fontSize.xs }]}>
          Endereço do backend
        </Text>
        <Text style={[styles.configValue, { color: theme.colors.text, fontSize: theme.fontSize.sm }]}>{API_URL}</Text>
        <Text style={[styles.configLabel, { color: theme.colors.textMuted, fontSize: theme.fontSize.xs }]}>
          Origem: {API_URL_SOURCE}
        </Text>
      </View>

      <Pressable
        onPress={runCheck}
        style={[styles.button, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md }]}
      >
        <Text style={[styles.buttonText, { color: theme.colors.onPrimary, fontSize: theme.fontSize.md }]}>
          Verificar novamente
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  badgeText: {
    fontWeight: '600',
  },
  detail: {
    lineHeight: 20,
  },
  configBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  configLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  configValue: {
    fontWeight: '500',
  },
  button: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontWeight: '600',
  },
});
