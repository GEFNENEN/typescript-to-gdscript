export class ArgumentComments extends Node {
  _ready() {
    // Comments between the arguments of a call that spans several lines must
    // not become part of the emitted argument list — GDScript also allows them
    // trailing a single argument.
    let total: float = this._add(1.0, 2.0);
    let scaled: float = this._scale(3.0, 4.0);
    // trailing comment after the call
    let values: Array<any> = [1, 2];
  }

  _add(left: float, right: float): float {
    return left + right;
  }

  _scale(value: float, factor: float): float {
    return value * factor;
  }
}
