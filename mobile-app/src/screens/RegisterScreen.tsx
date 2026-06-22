import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView
} from 'react-native';
import { theme } from '../theme/theme';
import { register } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export default function RegisterScreen({ navigation }: any) {
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const loginAction = useAuthStore(state => state.login);

  const handleRegister = async () => {
    if (!nombres || !apellidos || !email || !password || !confirmPassword) {
      return Alert.alert('Error', 'Completa todos los campos');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Las contraseñas no coinciden');
    }
    if (password.length < 6) {
      return Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
    }

    setIsLoading(true);
    try {
      const res = await register(email, nombres, apellidos, password);

      if (!res.success) {
        const msg = res.error?.message ?? 'No se pudo crear la cuenta';
        Alert.alert('Error al registrar', msg);
        return;
      }

      // Después del registro, hacer login automático
      const { user, token } = res.data ?? {};
      if (token && user) {
        await loginAction(
          { id: user.id, email: user.email, rol: user.role ?? 'CLIENTE' },
          token
        );
        Alert.alert('✅ Cuenta creada', `Bienvenido, ${user.nombres ?? nombres}!`);
      } else {
        // Si no devuelve token, regresar al login
        Alert.alert(
          '✅ Cuenta creada',
          'Tu cuenta fue creada. Inicia sesión para continuar.',
          [{ text: 'Ir al Login', onPress: () => navigation.goBack() }]
        );
      }
    } catch (e: any) {
      const msg = e.response?.data?.error?.message
        ?? e.response?.data?.message
        ?? e.message
        ?? 'Error al crear la cuenta';
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Zenith<Text style={styles.highlight}>Drive</Text></Text>
          <Text style={styles.subtitle}>Crea tu cuenta para empezar</Text>
        </View>

        {/* Formulario */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionLabel}>Información personal</Text>

          <TextInput
            style={styles.input}
            placeholder="Nombres"
            placeholderTextColor={theme.colors.textMuted}
            value={nombres}
            onChangeText={setNombres}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Apellidos"
            placeholderTextColor={theme.colors.textMuted}
            value={apellidos}
            onChangeText={setApellidos}
            autoCapitalize="words"
          />

          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Credenciales de acceso</Text>

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
            placeholder="Contraseña (mín. 6 caracteres)"
            placeholderTextColor={theme.colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Confirmar contraseña"
            placeholderTextColor={theme.colors.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.text} />
            ) : (
              <Text style={styles.buttonText}>Crear Cuenta</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.loginLinkText}>
              ¿Ya tienes cuenta? <Text style={{ color: theme.colors.primary }}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flexGrow: 1, padding: theme.spacing.xl, paddingTop: 60 },
  headerContainer: { marginBottom: theme.spacing.xl, alignItems: 'center' },
  backButton: { alignSelf: 'flex-start', marginBottom: theme.spacing.m },
  backText: { color: theme.colors.primary, fontSize: 16 },
  title: { fontSize: 36, fontWeight: '800', color: theme.colors.text, letterSpacing: -1 },
  highlight: { color: theme.colors.primary },
  subtitle: { fontSize: 15, color: theme.colors.textMuted, marginTop: theme.spacing.s },
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
  sectionLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.s,
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
  loginLink: { alignItems: 'center', marginTop: theme.spacing.l },
  loginLinkText: { color: theme.colors.textMuted, fontSize: 14 },
});
