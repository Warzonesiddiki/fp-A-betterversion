---
name: unity-3d-automation
description: Unity 3D automation - Editor scripting, asset pipeline automation, build automation, and AI-assisted development workflows.
origin: MCP Market / Game Development
---

# Unity 3D Automation

## When to Activate
- Automating Unity editor tasks
- Creating custom editor tools
- Setting up build pipelines
- AI-assisted Unity development

## Custom Editor Window
[MenuItem(tools/Level Generator)]
public static void ShowWindow() { GetWindow<LevelGenerator>(Level Generator); }

void OnGUI() {
  GUILayout.Label(Level Generator);
  if (GUILayout.Button(Generate)) GenerateLevel();
}

## Asset Processor
void OnPreprocessTexture() {
  TextureImporter importer = assetImporter as TextureImporter;
  importer.textureType = TextureImporterType.Sprite;
}

## Build Pipeline
BuildPlayerOptions options = new BuildPlayerOptions {
  scenes = new string[] { Main.unity },
  locationPathName = Builds/Android,
  target = BuildTarget.Android
};
BuildPipeline.BuildPlayer(options);

## MCP Integration
[MCPFunction]
public static GameObject CreatePrimitive(string type, Vector3 position) {
  return GameObject.CreatePrimitive((PrimitiveType)Enum.Parse(typeof(PrimitiveType), type));
}

## Editor Tests
[TestFixture]
public class GameTests {
  [Test]
  public void TestPlayerDamage() {
    var player = new GameObject().AddComponent<Player>();
    player.Health = 100;
    player.TakeDamage(30);
    Assert.AreEqual(70, player.Health);
  }
}

## Best Practices
- Use ScriptableObjects for data
- Create custom editors for complex tools
- Automate repetitive tasks
- Write tests for game logic

## References
See skill: godot-game-development