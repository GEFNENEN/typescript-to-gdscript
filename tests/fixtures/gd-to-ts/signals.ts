export class Signals extends Node {
  health: int = 100;
  health_changed = gd.signal<[old_value: int, new_value: int]>();
  died = gd.signal();
  score_updated = gd.signal<[score: float]>();

  take_damage(amount: int) {
    let old_hp: int = this.health;
    this.health -= amount;
    this.health_changed.emit(old_hp, this.health);
    if (this.health <= 0) {
      this.died.emit();
    }
  }
}
