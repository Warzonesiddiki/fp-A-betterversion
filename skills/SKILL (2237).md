---
name: flutter-best-practices
description: Flutter best practices - widget patterns, state management with Provider, Riverpod, Bloc, and performance optimization.
origin: MCP Market / Mobile Development
---

# Flutter Best Practices

## When to Activate
- Building Flutter apps
- Widget architecture
- Provider/Riverpod/Bloc state management
- Performance optimization

## Project Structure
lib/
  main.dart
  app/
  core/
  features/
    feature_name/
      data/
      domain/
      presentation/
  shared/

## Widget Pattern
class CustomButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;

  const CustomButton({required this.label, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(onPressed: onPressed, child: Text(label));
  }
}

## State Management

### Provider
final counterProvider = ChangeNotifierProvider((ref) => Counter());

### Riverpod
final counterProvider = StateNotifierProvider<Counter, int>((ref) => Counter());

### Bloc
class CounterCubit extends Cubit<int> {
  CounterCubit() : super(0);
  void increment() => emit(state + 1);
}

## Performance
- Use const constructors
- Use ListView.builder for large lists
- Use RepaintBoundary for complex widgets

## Testing
testWidgets(shows label, (tester) async { await tester.pumpWidget(CustomButton(label: Click, onPressed: () {})); });

## References
See skill: mobile-ci-cd-pipeline