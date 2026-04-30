import { Kafka } from 'kafkajs';
import EventStream from '../models/EventStream.js';

/**
 * Enterprise Streaming Analytics Engine using Apache Kafka
 */
class AnalyticsEngine {
  constructor() {
    this.kafka = new Kafka({
      clientId: 'campus-marketplace',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
    });

    this.producer = this.kafka.producer();
    this.isConnected = false;
    this.io = null;
    
    this.connectProducer();
  }

  async connectProducer() {
    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log('[Kafka] Producer connected successfully');
    } catch (err) {
      console.warn('[Kafka] Producer unavailable — events will persist to MongoDB only:', err.message);
    }
  }

  // Socket.IO instance attached here for live broadcasting and active connection counts
  attachSocket(io) {
    this.io = io;
  }

  /**
   * Returns the number of currently active Socket.IO connections.
   */
  getActiveConnections() {
    return this.io ? this.io.engine.clientsCount : 0;
  }

  /**
   * Log a view event — always persists to MongoDB, also publishes to Kafka if connected.
   */
  async trackView(productId, userId = null, location = null) {
    // Always persist to MongoDB regardless of Kafka status
    this.logHistoricalEvent('VIEW', productId, 'Product', userId, { location });

    if (!this.isConnected) return;

    try {
      const payload = {
        eventType: 'VIEW',
        productId,
        userId,
        location,
        timestamp: Date.now()
      };

      await this.producer.send({
        topic: 'marketplace-product-views',
        messages: [{ value: JSON.stringify(payload) }],
      });

    } catch (err) {
      console.error('[Kafka] Error publishing VIEW event:', err.message);
    }
  }

  /**
   * Log a search hit — always persists to MongoDB, also publishes to Kafka if connected.
   */
  async trackSearch(location, searchTerm, userId = null) {
    // Always persist to MongoDB regardless of Kafka status
    this.logHistoricalEvent('SEARCH', null, 'System', userId, { location, searchTerm });

    if (!this.isConnected) return;

    try {
      const payload = {
        eventType: 'SEARCH',
        location,
        searchTerm,
        userId,
        timestamp: Date.now()
      };

      await this.producer.send({
        topic: 'marketplace-search-queries',
        messages: [{ value: JSON.stringify(payload) }],
      });

    } catch (err) {
      console.error('[Kafka] Error publishing SEARCH event:', err.message);
    }
  }

  /**
   * Pushes individual granular events into the MongoDB time-series layout for Power BI.
   */
  async logHistoricalEvent(eventType, targetId, targetType, actorId, metadata) {
    try {
      await EventStream.create({
        eventType,
        targetId,
        targetType,
        actorId,
        metadata
      });
    } catch (err) {
      console.error('[AnalyticsEngine] Error logging historical event:', err.message);
    }
  }
}

export default new AnalyticsEngine();
