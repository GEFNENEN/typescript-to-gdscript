export class Armory extends Node {
  inspect() {
    // A .tres is typed by the script attached to it, with or without a class_name
    let sword = preload('res://sword.tres');
    let damage: int = sword.damage;
    let loot = load('res://loot.tres');
    let rolls: int = loot.rolls;
    // @ts-expect-error — the script's type, not `any`
    sword.not_a_member;
    // Without a script, the header type
    let material: ShaderMaterial = preload('res://player_material.tres');
  }
}
