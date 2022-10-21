export type IUnsubscribe = () => void;
export type ISubscribableCallback = (data?) => void;
export interface ISubscribable {
  on(event: string, callback: ISubscribableCallback): IUnsubscribe;
}
