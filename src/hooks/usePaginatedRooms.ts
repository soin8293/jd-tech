import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs,
  QueryDocumentSnapshot,
  DocumentData
} from "firebase/firestore";
import { Room } from "@/types/hotel.types";
import { logger } from "@/utils/logger";

interface PaginatedRoomsState {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
}

export const usePaginatedRooms = (pageSize: number = 25) => {
  const [state, setState] = useState<PaginatedRoomsState>({
    rooms: [],
    loading: false,
    error: null,
    hasMore: true,
    lastVisible: null
  });

  // Load first page
  const loadFirstPage = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const roomsQuery = query(
        collection(db, 'rooms'),
        orderBy('updatedAt', 'desc'),
        limit(pageSize)
      );

      const snapshot = await getDocs(roomsQuery);
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Room[];

      const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
      const hasMore = snapshot.docs.length === pageSize;

      setState({
        rooms,
        loading: false,
        error: null,
        hasMore,
        lastVisible
      });

      logger.info('First page of rooms loaded', { count: rooms.length });

    } catch (error: any) {
      logger.error('Failed to load first page of rooms', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load rooms'
      }));
    }
  }, [pageSize]);

  // Load next page
  const loadNextPage = useCallback(async () => {
    if (!state.hasMore || state.loading || !state.lastVisible) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const roomsQuery = query(
        collection(db, 'rooms'),
        orderBy('updatedAt', 'desc'),
        startAfter(state.lastVisible),
        limit(pageSize)
      );

      const snapshot = await getDocs(roomsQuery);
      const newRooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Room[];

      const lastVisible = snapshot.docs[snapshot.docs.length - 1] || state.lastVisible;
      const hasMore = snapshot.docs.length === pageSize;

      setState(prev => ({
        rooms: [...prev.rooms, ...newRooms],
        loading: false,
        error: null,
        hasMore,
        lastVisible
      }));

      logger.info('Next page of rooms loaded', { count: newRooms.length });

    } catch (error: any) {
      logger.error('Failed to load next page of rooms', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load more rooms'
      }));
    }
  }, [state.hasMore, state.loading, state.lastVisible, pageSize]);

  // Refresh rooms (reset to first page)
  const refreshRooms = useCallback(() => {
    setState({
      rooms: [],
      loading: false,
      error: null,
      hasMore: true,
      lastVisible: null
    });
    loadFirstPage();
  }, [loadFirstPage]);

  // Load first page on mount
  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  return {
    rooms: state.rooms,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    loadNextPage,
    refreshRooms
  };
};