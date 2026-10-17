export class MyClass extends Node {
  scores: int[] = [];
  names: Array<string> = [];
  nodes: Array<Node2D> = [];

  test_arrays() {
    let numbers = [1, 2, 3, 4, 5];
    let first = numbers[0];
    let length = numbers.size();

    numbers.append(6);
    numbers.remove_at(0);

    for (let n of numbers) {
      print(n);
    }
  }

  total(values: Array<float>): float {
    let sum = 0.0;
    for (const v of values) sum += v;
    return sum;
  }

  test_dictionaries() {
    let dict: { name: string; health: int; alive: boolean; score?: int } = {
      name: "Player",
      health: 100,
      alive: true,
    };
    let player_name = dict["name"];

    dict["score"] = 9001;
  }
}
