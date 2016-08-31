import { Observable } from "sf-core/observable";
import { MetadataChangeAction } from "sf-core/actions";

export class Metadata extends Observable {
  constructor(private _data: any = {}) {
    super();
  }

  get data() {
    return this._data;
  }

  get(key: string) {
    return this._data[key];
  }

  toggle(key: string) {
    const v = this.get(key);
    this.set(key, v == null ? true : !v);
  }

  set(key: string, value: any) {
    const oldValue = this.get(key);
    this._data[key] = value;

    if (value !== oldValue) {
      this.notify(new MetadataChangeAction(key, value));
    }
  }
}