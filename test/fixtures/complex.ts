// Complex TypeScript file for testing nested structures
import { readFileSync } from 'fs';

namespace Database {
  export interface Connection {
    host: string;
    port: number;
  }

  export class Manager {
    private connections: Connection[] = [];

    connect(config: Connection): void {
      this.connections.push(config);
    }

    disconnect(): void {
      this.connections = [];
    }
  }
}

abstract class BaseService<T> {
  protected abstract entities: T[];

  abstract create(entity: T): void;
  abstract findById(id: string): T | undefined;

  count(): number {
    return this.entities.length;
  }
}

class ProductService extends BaseService<Product> {
  protected entities: Product[] = [];

  create(product: Product): void {
    this.entities.push(product);
  }

  findById(id: string): Product | undefined {
    return this.entities.find((p) => p.id === id);
  }

  private calculatePrice(base: number, tax: number): number {
    return base * (1 + tax);
  }
}

interface Product {
  id: string;
  name: string;
  price: number;
}

const config = {
  database: {
    host: 'localhost',
    port: 5432,
    connect: () => {
      console.log('Connecting to database');
    },
  },
  cache: {
    ttl: 3600,
    clear: function () {
      console.log('Clearing cache');
    },
  },
};

export { Database, BaseService, ProductService, Product };
export default config;
