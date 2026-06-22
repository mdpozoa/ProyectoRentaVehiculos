import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { theme } from '../theme/theme';
import { Vehiculo } from '../api/vehiculos';

interface VehicleCardProps {
  vehicle: Vehiculo;
  onPress: (id: string) => void;
}

export default function VehicleCard({ vehicle, onPress }: VehicleCardProps) {
  const hasImage = !!vehicle.imagenUrl;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => onPress(vehicle.id)}
    >
      {/* Imagen o placeholder */}
      {hasImage ? (
        <Image
          source={{ uri: vehicle.imagenUrl! }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imageText}>{vehicle.nombre?.split(' ')[0] ?? '🚗'}</Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <View style={styles.row}>
          {/* Nombre del vehículo (Marca Modelo Año) */}
          <Text style={styles.modelText} numberOfLines={1}>{vehicle.nombre}</Text>
          {/* Badge disponible */}
          <View style={[
            styles.badge,
            vehicle.disponible ? styles.badgeAvailable : styles.badgeUnavailable
          ]}>
            <Text style={[
              styles.badgeText,
              { color: vehicle.disponible ? theme.colors.success : theme.colors.danger }
            ]}>
              {vehicle.disponible ? '✓ Disponible' : '✗ No disponible'}
            </Text>
          </View>
        </View>

        {/* Categoría */}
        {vehicle.categoria && (
          <Text style={styles.categoria}>{vehicle.categoria}</Text>
        )}

        {/* Precio */}
        <Text style={styles.priceText}>
          ${vehicle.precioPorDia.toFixed(2)}{' '}
          <Text style={styles.perDay}>/ día · {vehicle.moneda}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    overflow: 'hidden',
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 190,
  },
  imagePlaceholder: {
    height: 190,
    backgroundColor: theme.colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    color: theme.colors.textMuted,
    fontSize: 28,
    fontWeight: '800',
    opacity: 0.3,
    textTransform: 'uppercase',
  },
  infoContainer: {
    padding: theme.spacing.m,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modelText: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  categoria: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 4,
  },
  perDay: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: '400',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.round,
  },
  badgeAvailable: { backgroundColor: '#16a34a20' },
  badgeUnavailable: { backgroundColor: '#dc262620' },
  badgeText: { fontSize: 10, fontWeight: '700' },
});
