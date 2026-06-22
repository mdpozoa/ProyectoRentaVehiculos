import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, SafeAreaView, Alert, RefreshControl
} from 'react-native';
import { theme } from '../theme/theme';
import { useAuthStore } from '../store/authStore';
import { fetchVehiculos, Vehiculo } from '../api/vehiculos';
import VehicleCard from '../components/VehicleCard';

export default function HomeScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadVehiculos = async (pageNumber: number, refresh = false) => {
    if (isLoading && !refresh) return;
    setIsLoading(true);
    try {
      const response = await fetchVehiculos(pageNumber, 10);
      // La respuesta tiene forma: { success, data: { data: [...], total, page, totalPages } }
      const items = response.data?.data ?? [];
      const totalPages = response.data?.totalPages ?? 1;

      if (pageNumber === 1) {
        setVehiculos(items);
      } else {
        setVehiculos(prev => [...prev, ...items]);
      }
      setHasMore(pageNumber < totalPages);
      setPage(pageNumber);
    } catch (error: any) {
      Alert.alert(
        'Error de conexión',
        error.message || 'No se pudo cargar el catálogo. Intenta de nuevo.',
        [{ text: 'Reintentar', onPress: () => loadVehiculos(1, true) }, { text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadVehiculos(1, true);
    }, [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    setHasMore(true);
    loadVehiculos(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      loadVehiculos(page + 1);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>Hola, {user?.email?.split('@')[0]} 👋</Text>
        <Text style={styles.subtitle}>Encuentra tu próximo viaje premium</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity style={styles.reservasButton} onPress={() => navigation.navigate('MyReservations')}>
          <Text style={styles.reservasText}>Mis Reservas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay vehículos disponibles</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadVehiculos(1, true)}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={vehiculos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VehicleCard
            vehicle={item}
            onPress={(id) => navigation.navigate('VehicleDetails', { id })}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListFooterComponent={
          isLoading && vehiculos.length > 0
            ? <ActivityIndicator color={theme.colors.primary} style={{ margin: 20 }} />
            : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  listContent: { padding: theme.spacing.m, paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: theme.spacing.xl, marginTop: theme.spacing.s,
  },
  greeting: { color: theme.colors.text, fontSize: 22, fontWeight: 'bold' },
  subtitle: { color: theme.colors.textMuted, fontSize: 13, marginTop: 4 },
  logoutButton: {
    padding: theme.spacing.s, backgroundColor: theme.colors.surfaceHighlight,
    borderRadius: theme.borderRadius.s, justifyContent: 'center'
  },
  logoutText: { color: theme.colors.danger, fontWeight: '600', fontSize: 12 },
  reservasButton: {
    padding: theme.spacing.s, backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.s, justifyContent: 'center'
  },
  reservasText: { color: theme.colors.text, fontWeight: '600', fontSize: 12 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: theme.colors.textMuted, fontSize: 16, marginBottom: 16 },
  retryButton: {
    backgroundColor: theme.colors.primary, paddingHorizontal: 24,
    paddingVertical: 10, borderRadius: theme.borderRadius.m,
  },
  retryText: { color: theme.colors.text, fontWeight: '700' },
});
