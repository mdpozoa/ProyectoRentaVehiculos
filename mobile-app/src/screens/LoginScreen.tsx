import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { theme } from '../theme/theme';
import { login } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const loginAction = useAuthStore(state => state.login);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Completa todos los campos');
    setIsLoading(true);
    try {
      // La respuesta tiene forma: { success: true, data: { user: {...}, token: '...' } }
      const res = await login(email, password);

      if (!res.success) {
        const msg = res.error?.message ?? 'Credenciales inválidas';
        Alert.alert('Error de acceso', msg);
        return;
      }

      const { user, token } = res.data ?? {};
      if (token && user) {
        await loginAction(
          { id: user.id, email: user.email, rol: user.role ?? user.rol ?? 'CLIENTE' },
          token
        );
      } else {
        Alert.alert('Error', 'Respuesta inesperada del servidor');
      }
    } catch (e: any) {
      const msg = e.response?.data?.error?.message
        ?? e.response?.data?.message
        ?? e.message
        ?? 'Revisa tus credenciales e intenta de nuevo.';
      Alert.alert('Error de acceso', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Zenith<Text style={styles.highlight}>Drive</Text></Text>
          <Text style={styles.subtitle}>Tu próximo viaje premium</Text>
        </View>

        {/* Formulario */}
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Correo Electrónico"
            placeholderTextColor={theme.colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor={theme.colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.text} />
            ) : (
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          {/* Link a Registro */}
          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerLinkText}>
              ¿No tienes cuenta?{' '}
              <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>
                Regístrate aquí
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, padding: theme.spacing.xl, justifyContent: 'center' },
  headerContainer: { marginBottom: theme.spacing.xxl, alignItems: 'center' },
  title: { fontSize: 42, fontWeight: '800', color: theme.colors.text, letterSpacing: -1 },
  highlight: { color: theme.colors.primary },
  subtitle: { fontSize: 16, color: theme.colors.textMuted, marginTop: theme.spacing.s },
  formContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  input: {
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.s,
    fontSize: 16,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    marginTop: theme.spacing.s,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  registerLink: { alignItems: 'center', marginTop: theme.spacing.l },
  registerLinkText: { color: theme.colors.textMuted, fontSize: 14 },
});
