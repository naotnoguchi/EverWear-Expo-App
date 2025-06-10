// services/eventBus.ts
/**
 * シンプルなイベントバスの実装
 * アプリケーション内の異なるコンポーネント間でイベントを発行・購読するためのメカニズム
 */

// イベントの型定義
export type EventType = 
  | 'item-added'       // アイテム追加時
  | 'item-updated'     // アイテム更新時
  | 'item-deleted'     // アイテム削除時
  | 'wear-added'       // 着用記録追加時
  | 'wear-deleted'     // 着用記録削除時
  | 'wash-added'       // 洗濯記録追加時
  | 'wash-deleted'     // 洗濯記録削除時
  | 'data-refreshed';  // データ全体更新時

// イベントリスナーの型定義
export type EventListener = (data?: any) => void;

// イベントバスクラス
class EventBus {
  private listeners: Map<EventType, EventListener[]> = new Map();

  // イベントリスナーを登録
  subscribe(event: EventType, callback: EventListener): () => void {
    console.log(`EventBus: イベント "${event}" のリスナーを登録`);
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)!.push(callback);
    
    // アンサブスクライブ関数を返す
    return () => {
      console.log(`EventBus: イベント "${event}" のリスナーを削除`);
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    };
  }

  // イベントを発行
  publish(event: EventType, data?: any): void {
    console.log(`EventBus: イベント "${event}" を発行`, data ? `データ: ${JSON.stringify(data)}` : '');
    
    if (!this.listeners.has(event)) {
      return;
    }
    
    const callbacks = this.listeners.get(event)!;
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`EventBus: イベント "${event}" のリスナー実行中にエラー:`, error);
      }
    });
  }

  // 特定のイベントのすべてのリスナーを削除
  clearEvent(event: EventType): void {
    console.log(`EventBus: イベント "${event}" のすべてのリスナーを削除`);
    this.listeners.delete(event);
  }

  // すべてのイベントリスナーを削除
  clearAll(): void {
    console.log('EventBus: すべてのイベントリスナーを削除');
    this.listeners.clear();
  }
}

// シングルトンインスタンスを作成して公開
export const eventBus = new EventBus();