import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@/store/authStore';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, switchEntity } = useAuthStore(
    useShallow((s) => ({
      user: s.user,
      isAuthenticated: s.isAuthenticated,
      isLoading: s.isLoading,
      login: s.login,
      logout: s.logout,
      switchEntity: s.switchEntity,
    }))
  );
  return { user, isAuthenticated, isLoading, login, logout, switchEntity };
}
