import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../theme/theme';
import { crearPago } from '../api/pagos';
import { cancelReserva } from '../api/reservas';

export default function PaymentScreen({ route, navigation }: any) {
  const { reserva } = route.params;
  const [method, setMethod] = useState<'TARJETA' | 'TRANSFERENCIA' | 'DE_UNA'>('TARJETA');
  const [isLoading, setIsLoading] = useState(false);
  const [referencia, setReferencia] = useState('');

  // Estados para tarjeta (mock)
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // Precio a pagar siempre disponible incluso si hubo falla en el backend al guardar el totalAmount
  const precioAPagar = reserva.totalAmount || reserva.precioBase || (reserva.diasTotal * 45) || 0;

  const handleCancelPayment = () => {
    Alert.alert(
      'Cancelar Reserva',
      '¿Estás seguro de que deseas cancelar la reserva y devolver el auto al catálogo?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí, Cancelar', 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await cancelReserva(reserva.id);
              Alert.alert('Éxito', 'Reserva cancelada y auto devuelto al catálogo.');
              navigation.goBack();
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.error?.message || 'No se pudo cancelar');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handlePay = async () => {
    if (method === 'TARJETA') {
      if (!cardNumber || !expiry || !cvv) {
        return Alert.alert('Error', 'Completa los datos de la tarjeta');
      }
    } else if (method === 'TRANSFERENCIA') {
      if (!referencia) {
        return Alert.alert('Error', 'Ingresa el número de referencia del comprobante');
      }
    }

    // Asegurar que el monto sea un número válido y mayor a 0
    const montoParsed = parseFloat(String(precioAPagar));
    if (isNaN(montoParsed) || montoParsed <= 0) {
      return Alert.alert('Error', 'El monto de la reserva no es válido para procesar el pago.');
    }

    setIsLoading(true);
    try {
      await crearPago({
        reservaId: reserva.id,
        monto: montoParsed,
        metodoPago: method,
        referencia: method === 'TRANSFERENCIA' ? referencia : (method === 'DE_UNA' ? 'PAGO_DE_UNA' : `CARD-${cardNumber.slice(-4)}`)
      });

      Alert.alert(
        'Pago Exitoso',
        'Tu reserva ha sido pagada correctamente.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error?.message || 'No se pudo procesar el pago');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Pago Seguro</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen de la Reserva</Text>
          <Text style={styles.summaryText}>Código: <Text style={styles.summaryValue}>{reserva.codigoReserva}</Text></Text>
          <Text style={styles.summaryText}>Monto a pagar: <Text style={styles.summaryValue}>${precioAPagar}</Text></Text>
        </View>

        <Text style={styles.sectionTitle}>Método de Pago</Text>
        <View style={styles.methodSelector}>
          <TouchableOpacity 
            style={[styles.methodBtn, method === 'TARJETA' && styles.methodBtnActive]}
            onPress={() => setMethod('TARJETA')}
          >
            <Text style={[styles.methodText, method === 'TARJETA' && styles.methodTextActive]}>Tarjeta</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.methodBtn, method === 'TRANSFERENCIA' && styles.methodBtnActive]}
            onPress={() => setMethod('TRANSFERENCIA')}
          >
            <Text style={[styles.methodText, method === 'TRANSFERENCIA' && styles.methodTextActive]}>Transf.</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.methodBtn, method === 'DE_UNA' && styles.methodBtnActive]}
            onPress={() => setMethod('DE_UNA')}
          >
            <Text style={[styles.methodText, method === 'DE_UNA' && styles.methodTextActive]}>De Una</Text>
          </TouchableOpacity>
        </View>

        {method === 'TARJETA' && (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Número de Tarjeta"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="number-pad"
              value={cardNumber}
              onChangeText={setCardNumber}
              maxLength={16}
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="MM/YY"
                placeholderTextColor={theme.colors.textMuted}
                value={expiry}
                onChangeText={setExpiry}
                maxLength={5}
              />
              <TextInput
                style={[styles.input, { flex: 1, marginLeft: 8 }]}
                placeholder="CVV"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="number-pad"
                value={cvv}
                onChangeText={setCvv}
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>
        )}

        {method === 'TRANSFERENCIA' && (
          <View style={styles.form}>
            <Text style={styles.bankInfo}>Banco Pichincha</Text>
            <Text style={styles.bankInfo}>Cuenta Corriente: 2100345678</Text>
            <Text style={styles.bankInfo}>A nombre de: Zenith Drive S.A.</Text>
            <Text style={styles.bankInfo}>RUC: 1790000000001</Text>
            
            <TextInput
              style={[styles.input, { marginTop: theme.spacing.l }]}
              placeholder="Número de Comprobante / Ref."
              placeholderTextColor={theme.colors.textMuted}
              value={referencia}
              onChangeText={setReferencia}
            />
          </View>
        )}

        {method === 'DE_UNA' && (
          <View style={styles.form}>
            <Text style={styles.bankInfo}>Pago rápido con De Una!</Text>
            <Text style={styles.detailText}>No necesitas ingresar referencia. Solo da clic en pagar para confirmar tu pago con De Una.</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.payBtn}
          onPress={handlePay}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color={theme.colors.text} /> : <Text style={styles.payBtnText}>Pagar ${precioAPagar}</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.payBtn, { backgroundColor: theme.colors.error, marginTop: theme.spacing.m }]}
          onPress={handleCancelPayment}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color={theme.colors.text} /> : <Text style={styles.payBtnText}>Cancelar Pago y Reserva</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: theme.spacing.l, paddingTop: 60, flexGrow: 1 },
  header: { marginBottom: theme.spacing.xl },
  backBtn: { marginBottom: theme.spacing.s },
  backText: { color: theme.colors.primary, fontSize: 16 },
  title: { fontSize: 32, fontWeight: 'bold', color: theme.colors.text },
  summaryCard: { backgroundColor: theme.colors.surface, padding: theme.spacing.l, borderRadius: theme.borderRadius.m, marginBottom: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.primary },
  summaryTitle: { color: theme.colors.textMuted, fontSize: 14, textTransform: 'uppercase', marginBottom: 8, fontWeight: 'bold' },
  summaryText: { color: theme.colors.text, fontSize: 16, marginBottom: 4 },
  summaryValue: { fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text, marginBottom: theme.spacing.m },
  methodSelector: { flexDirection: 'row', marginBottom: theme.spacing.l },
  methodBtn: { flex: 1, padding: theme.spacing.m, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: theme.colors.border },
  methodBtnActive: { borderBottomColor: theme.colors.primary },
  methodText: { color: theme.colors.textMuted, fontSize: 16, fontWeight: '600' },
  methodTextActive: { color: theme.colors.primary },
  form: { marginBottom: theme.spacing.xl },
  input: { backgroundColor: theme.colors.surface, color: theme.colors.text, padding: theme.spacing.m, borderRadius: theme.borderRadius.s, borderWidth: 1, borderColor: theme.colors.border, marginBottom: theme.spacing.m, fontSize: 16 },
  row: { flexDirection: 'row' },
  bankInfo: { color: theme.colors.text, fontSize: 16, marginBottom: 8, fontWeight: 'bold' },
  detailText: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 20 },
  payBtn: { backgroundColor: theme.colors.primary, padding: theme.spacing.l, borderRadius: theme.borderRadius.m, alignItems: 'center', marginTop: 'auto' },
  payBtnText: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold' }
});
