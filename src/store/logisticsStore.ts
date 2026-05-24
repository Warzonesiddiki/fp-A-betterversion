import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';

export interface Shipment {
  id: string;
  origin: string;
  destination: string;
  carrier: string;
  status: 'In Transit' | 'Delivered' | 'Delayed' | 'Exception';
  cost: number;
  eta: string;
}

export interface CarrierPerformance {
  carrier: string;
  onTimeRate: number;
  avgCost: number;
  volume: number;
}

export interface RouteCost {
  route: string;
  cost: number;
  volume: number;
}

interface LogisticsState {
  shipments: Shipment[];
  carrierPerformance: CarrierPerformance[];
  routeCosts: RouteCost[];
  isLoading: boolean;
  error: string | null;
  setShipments: (shipments: Shipment[]) => void;
  addShipment: (shipment: Shipment) => void;
  updateShipment: (id: string, updates: Partial<Shipment>) => void;
  removeShipment: (id: string) => void;
  setCarrierPerformance: (data: CarrierPerformance[]) => void;
  setRouteCosts: (data: RouteCost[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;
  getActiveShipmentCount: () => number;
  getOnTimeRate: () => number;
}

export const useLogisticsStore = create<LogisticsState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        shipments: [],
        carrierPerformance: [],
        routeCosts: [],
        isLoading: false,
        error: null,
        setShipments: (shipments) =>
          set((s) => {
            s.shipments = shipments;
          }),
        addShipment: (shipment) =>
          set((s) => {
            s.shipments.push(shipment);
          }),
        updateShipment: (id, updates) =>
          set((s) => {
            const i = s.shipments.findIndex((x) => x.id === id);
            if (i !== -1) Object.assign(s.shipments[i], updates);
          }),
        removeShipment: (id) =>
          set((s) => {
            s.shipments = s.shipments.filter((x) => x.id !== id);
          }),
        setCarrierPerformance: (data) =>
          set((s) => {
            s.carrierPerformance = data;
          }),
        setRouteCosts: (data) =>
          set((s) => {
            s.routeCosts = data;
          }),
        setLoading: (isLoading) =>
          set((s) => {
            s.isLoading = isLoading;
          }),
        setError: (error) =>
          set((s) => {
            s.error = error;
          }),
        clearAll: () =>
          set((s) => {
            s.shipments = [];
            s.carrierPerformance = [];
            s.routeCosts = [];
            s.isLoading = false;
            s.error = null;
          }),
        getActiveShipmentCount: () =>
          get().shipments.filter((s) => s.status === 'In Transit').length,
        getOnTimeRate: () => {
          const delivered = get().shipments.filter((s) => s.status === 'Delivered').length;
          const total = get().shipments.filter(
            (s) => s.status === 'Delivered' || s.status === 'Delayed'
          ).length;
          return total > 0 ? (delivered / total) * 100 : 0;
        },
      })),
      { name: 'logistics-store', storage: masterStorage }
    )
  )
);
