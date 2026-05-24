---
name: godot-game-development
description: Godot game development patterns - scene system, nodes, GDScript, physics, animation, and game architecture.
origin: MCP Market / Game Development
---

# Godot Game Development

## When to Activate
- Building games with Godot engine
- Creating game scenes and nodes
- Writing GDScript game logic
- Implementing physics and collisions

## Project Structure
res://
  project.godot
  scenes/
    main/
    player/
    enemies/
  scripts/
  resources/
  assets/

## Scene System
var enemy_scene = preload(enemy.tscn);
var enemy = enemy_scene.instantiate();
add_child(enemy);

## Physics
func _physics_process(delta) {
  var velocity = Vector2.ZERO;
  if Input.is_action_pressed(move_left) velocity.x = -move_speed;
  if Input.is_action_just_pressed(jump) and is_on_floor() linear_velocity.y = jump_force;
}

## Signals
signal health_changed;
signal died;
func take_damage(amount) { health -= amount; health_changed.emit(health); }

## Autoload (Singleton)
extends Node
var score = 0
var lives = 3
func add_score(points) { score += points; }

## Best Practices
- Use composition over inheritance
- Keep scripts focused and small
- Use signals for loose coupling
- Leverage node groups

## References
See skill: unity-3d-automation