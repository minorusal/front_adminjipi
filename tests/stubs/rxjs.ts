export class BehaviorSubject<T> {
  private _value: T;
  constructor(init: T) { this._value = init; }
  next(v: T) { this._value = v; }
  get value() { return this._value; }
}
