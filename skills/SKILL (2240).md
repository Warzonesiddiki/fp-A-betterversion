---
name: react-native-patterns
description: React Native best practices - component patterns, navigation, state management, performance optimization, and TypeScript.
origin: MCP Market / Mobile Development
---

# React Native Patterns

## When to Activate
- Building React Native apps
- Component architecture
- React Navigation setup
- Zustand/Redux state management

## Project Structure
src/
  app/
  components/
  screens/
  navigation/
  hooks/
  store/

## Component Pattern
export const Button = ({ title, onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <Text>{title}</Text>
  </TouchableOpacity>
);

## Navigation
const Stack = createNativeStackNavigator();

## State Management
const useStore = create((set) => ({ user: null, setUser: (u) => set({ user: u }) }));

## Performance
<FlatList removeClippedSubviews={true} maxToRenderPerBatch={10} />

## Testing
it(renders correctly, { expect(getByText(title)).toBeTruthy(); });

## References
See skill: mobile-ci-cd-pipeline