import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, SafeAreaView, Image
} from 'react-native';
import { theme } from '../theme/theme';
import { fetchVehiculoById, Vehiculo } from '../api/vehiculos';
import { createReserva } from '../api/reservas';
import { useAuthStore } from '../store/authStore';

export default function VehicleDetailsScreen({ route, navigation }: any) {
  const { id } = route.params;
  const { user } = useAuthStore();
  const [vehicle, setVehicle] = useState<Vehiculo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [days, setDays] = useState(3);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchVehiculoById(id);
        if (res.success && res.data) {
          setVehicle(res.data);
        } else {
          throw new Error('Vehículo no encontrado');
        }
      } catch (e) {
        Alert.alert('Error', 'No se pudo cargar el vehículo');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleBooking = async () => {
    if (!vehicle) return;
    setIsBooking(true);
    try {
      const hoy = new Date();
      const fin = new Date();
      fin.setDate(hoy.getDate() + days);

      // Formato YYYY-MM-DD
      const formatYMD = (d: Date) => d.toISOString().split('T')[0];

      const res = await createReserva({
        vehiculoId: vehicle.id,
        fechaInicio: formatYMD(hoy),
        fechaFin: formatYMD(fin),
      });

      if (res.success) {
        Alert.alert(
          '✅ Reserva Creada',
          'Tu reserva ha sido registrada exitosamente. Te notificaremos cuando se confirme.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error(res.error?.message ?? 'Error al crear la reserva');
      }
    } catch (e: any) {
      const msg = e.response?.data?.error?.message ?? e.message ?? 'Hubo un problema al reservar';
      Alert.alert('Error', msg);
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando vehículo...</Text>
      </View>
    );
  }

  if (!vehicle) return null;

  const disponible = vehicle.disponible;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {vehicle.imagenUrl ? (
          <Image source={{ uri: vehicle.imagenUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageText}>{vehicle.nombre?.split(' ')[0] ?? '🚗'}</Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>{vehicle.nombre}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${vehicle.precioPorDia.toFixed(2)}</Text>
              <Text style={styles.perDay}>/día</Text>
            </View>
          </View>

          <Text style={styles.currencyBadge}>{vehicle.moneda}</Text>

          <View style={[styles.statusBadge, disponible ? styles.badgeOk : styles.badgeNot]}>
            <Text style={[styles.statusText, { color: disponible ? theme.colors.success : theme.colors.danger }]}>
              {disponible ? '✓ Disponible para reservar' : '✗ No disponible actualmente'}
            </Text>
          </View>

          {vehicle.categoria && (
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Categoría</Text>
              <Text style={styles.specValue}>{vehicle.categoria}</Text>
            </View>
          )}

          {vehicle.descripcion ? (
            <View style={styles.descBox}>
              <Text style={styles.specLabel}>Descripción</Text>
              <Text style={styles.descText}>{vehicle.descripcion}</Text>
            </View>
          ) : null}

          {disponible && (
            <View style={styles.daysSelector}>
              <Text style={styles.daysLabel}>¿Cuántos días lo necesitas?</Text>
              <View style={styles.stepper}>
                <TouchableOpacity 
                  style={[styles.stepperBtn, days <= 1 && styles.stepperBtnDisabled]} 
                  onPress={() => setDays(d => Math.max(1, d - 1))}
                  disabled={days <= 1}
                >
                  <Text style={styles.stepperBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{days} {days === 1 ? 'día' : 'días'}</Text>
                <TouchableOpacity 
                  style={[styles.stepperBtn, days >= 7 && styles.stepperBtnDisabled]} 
                  onPress={() => setDays(d => Math.min(7, d + 1))}
                  disabled={days >= 7}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>📅 Reserva de {days} {days === 1 ? 'día' : 'días'} desde hoy</Text>
            <Text style={styles.infoText}>👤 {user?.email}</Text>
            <Text style={styles.infoText}>
              💰 Total estimado: ${(vehicle.precioPorDia * days).toFixed(2)} {vehicle.moneda}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.bookButton, !disponible && styles.bookButtonDisabled]}
          disabled={!disponible || isBooking}
          onPress={handleBooking}
          activeOpacity={0.8}
        >
          {isBooking ? (
            <ActivityIndicator color={theme.colors.text} />
          ) : (
            <Text style={styles.bookButtonText}>
              {disponible ? `Reservar Ahora (${days} ${days === 1 ? 'día' : 'días'})` : 'No Disponible'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: theme.colors.textMuted, marginTop: 12 },
  image: { width: '100%', height: 280 },
  imagePlaceholder: {
    height: 280,
    backgroundColor: theme.colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    color: theme.colors.textMuted,
    fontSize: 48,
    fontWeight: '800',
    opacity: 0.2,
    textTransform: 'uppercase',
  },
  content: { padding: theme.spacing.l },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.s,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
    marginRight: 12,
  },
  priceContainer: { alignItems: 'flex-end' },
  price: { fontSize: 26, fontWeight: 'bold', color: theme.colors.primary },
  perDay: { fontSize: 12, color: theme.colors.textMuted },
  currencyBadge: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: theme.spacing.m,
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.s,
    marginBottom: theme.spacing.m,
  },
  badgeOk: { backgroundColor: '#16a34a18' },
  badgeNot: { backgroundColor: '#dc262618' },
  statusText: { fontWeight: '700', fontSize: 13 },
  specBox: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.s,
    marginBottom: theme.spacing.s,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  specLabel: { color: theme.colors.textMuted, fontSize: 14 },
  specValue: { color: theme.colors.text, fontSize: 14, fontWeight: 'bold' },
  descBox: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.s,
    marginBottom: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  descText: { color: theme.colors.text, fontSize: 14, lineHeight: 20, marginTop: 6 },
  
  daysSelector: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.s,
    marginTop: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  daysLabel: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.round,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stepperBtn: {
    backgroundColor: theme.colors.surfaceHighlight,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.3,
  },
  stepperBtnText: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  stepperValue: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    width: 80,
    textAlign: 'center',
  },

  infoBox: {
    backgroundColor: theme.colors.surfaceHighlight,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.s,
    marginTop: theme.spacing.s,
    gap: 6,
  },
  infoText: { color: theme.colors.textMuted, fontSize: 13 },
  footer: {
    padding: theme.spacing.l,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  bookButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.round,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  bookButtonDisabled: { backgroundColor: theme.colors.surfaceHighlight, shadowOpacity: 0 },
  bookButtonText: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold' },
});
