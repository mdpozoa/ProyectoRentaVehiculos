import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { fetchMisReservas, cancelReserva } from '../api/reservas';

export default function MyReservationsScreen({ navigation }: any) {
  const [reservas, setReservas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadReservas = async () => {
    try {
      const res = await fetchMisReservas();
      if (res.success) {
        // Ordenar: primero las más recientes
        const sorted = (res.data || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReservas(sorted);
      }
    } catch (e) {
      console.error('Error al cargar reservas', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReservas();
    }, [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadReservas();
  };

  const handleCancel = (id: string) => {
    Alert.alert(
      'Cancelar Reserva',
      '¿Estás seguro de que deseas cancelar esta reserva?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí, Cancelar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelReserva(id);
              Alert.alert('Éxito', 'Reserva cancelada correctamente');
              loadReservas();
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.error?.message || 'No se pudo cancelar');
            }
          }
        }
      ]
    );
  };

  const handlePay = (reserva: any) => {
    navigation.navigate('Payment', { reserva });
  };

  const renderStatus = (status: string) => {
    let color = theme.colors.textMuted;
    if (status === 'PENDIENTE') color = theme.colors.warning;
    if (status === 'COMPLETADA' || status === 'CONFIRMADA' || status === 'PAGADA') color = theme.colors.success;
    if (status === 'CANCELADA') color = theme.colors.error;

    return <Text style={[styles.statusBadge, { color, borderColor: color }]}>{status}</Text>;
  };

  const renderItem = ({ item }: { item: any }) => {
    // Las reservas traen los detalles en el modelo (dependiendo del DTO de reservas)
    // Usamos item.codigoReserva, item.totalAmount
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.codigo}>{item.codigoReserva || 'RES-XXX'}</Text>
          {renderStatus(item.status)}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.detail}>Fechas: {item.fechaInicio.split('T')[0]} a {item.fechaFin.split('T')[0]}</Text>
          <Text style={styles.detail}>Días: {item.diasTotal}</Text>
          <Text style={styles.total}>Total: ${item.totalAmount || item.precioBase || (item.diasTotal * 45)}</Text>
        </View>

        <View style={styles.cardActions}>
          {item.status !== 'CANCELADA' && item.status !== 'COMPLETADA' && (
            <TouchableOpacity style={styles.btnCancel} onPress={() => handleCancel(item.id)}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
          )}

          {item.status === 'PENDIENTE' && (
            <TouchableOpacity style={styles.btnPay} onPress={() => handlePay(item)}>
              <Text style={styles.btnPayText}>Pagar Ahora</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mis Reservas</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={reservas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No tienes reservas todavía.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingTop: 60, paddingHorizontal: theme.spacing.m, paddingBottom: theme.spacing.m, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { marginBottom: theme.spacing.s },
  backText: { color: theme.colors.primary, fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: theme.spacing.m },
  card: { backgroundColor: theme.colors.surface, padding: theme.spacing.m, borderRadius: theme.borderRadius.m, marginBottom: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.s },
  codigo: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text },
  statusBadge: { fontSize: 12, fontWeight: 'bold', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  cardBody: { marginBottom: theme.spacing.m },
  detail: { color: theme.colors.textMuted, fontSize: 14, marginBottom: 4 },
  total: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  btnCancel: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.error },
  btnCancelText: { color: theme.colors.error, fontWeight: '600' },
  btnPay: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: theme.colors.primary },
  btnPayText: { color: theme.colors.text, fontWeight: 'bold' },
  empty: { padding: theme.spacing.xl, alignItems: 'center' },
  emptyText: { color: theme.colors.textMuted, fontSize: 16 },
});
