/* eslint-disable */
/**
 * Sample code file for testing output formats
 * Contains a balanced mix of constructs for format comparison
 */

export interface Product {
  id: number;
  name: string;
  price: number;
  category: ProductCategory;
  tags?: string[];
}

export enum ProductCategory {
  ELECTRONICS = 'electronics',
  BOOKS = 'books',
  CLOTHING = 'clothing',
  HOME = 'home'
}

export class ProductService {
  private products: Map<number, Product> = new Map();
  private nextId = 1;

  constructor() {
    // Initialize with sample data
    this.addProduct({
      id: 0, // Will be overridden
      name: 'Sample Product',
      price: 99.99,
      category: ProductCategory.ELECTRONICS,
      tags: ['sample', 'demo']
    });
  }

  addProduct(product: Omit<Product, 'id'>): Product {
    const newProduct: Product = {
      ...product,
      id: this.nextId++
    };
    
    this.products.set(newProduct.id, newProduct);
    return newProduct;
  }

  getProduct(id: number): Product | undefined {
    return this.products.get(id);
  }

  getAllProducts(): Product[] {
    return Array.from(this.products.values());
  }

  getProductsByCategory(category: ProductCategory): Product[] {
    return this.getAllProducts().filter(p => p.category === category);
  }

  removeProduct(id: number): boolean {
    return this.products.delete(id);
  }

  updateProduct(id: number, updates: Partial<Product>): Product | null {
    const existing = this.products.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates, id }; // Preserve original ID
    this.products.set(id, updated);
    return updated;
  }

  // Static factory method
  static create(): ProductService {
    return new ProductService();
  }

  // Getter for total count
  get totalCount(): number {
    return this.products.size;
  }
}

// Utility functions
export function calculateTotalPrice(products: Product[]): number {
  return products.reduce((total, product) => total + product.price, 0);
}

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
};

// Arrow function with complex logic
export const searchProducts = (
  products: Product[],
  query: string,
  category?: ProductCategory
): Product[] => {
  const lowercaseQuery = query.toLowerCase();
  
  return products.filter(product => {
    // Match by name
    const nameMatch = product.name.toLowerCase().includes(lowercaseQuery);
    
    // Match by tags
    const tagMatch = product.tags?.some(tag => 
      tag.toLowerCase().includes(lowercaseQuery)
    ) ?? false;
    
    // Match by category if specified
    const categoryMatch = !category || product.category === category;
    
    return (nameMatch || tagMatch) && categoryMatch;
  });
};

// Higher-order function
export function createProductFilter(
  predicate: (product: Product) => boolean
): (products: Product[]) => Product[] {
  return (products: Product[]) => products.filter(predicate);
}

// Complex type definitions for testing
export type ProductWithTotal = Product & {
  total: number;
  formattedPrice: string;
};

export type ProductSummary = Pick<Product, 'id' | 'name' | 'price'>;

// Namespace with utilities
export namespace ProductHelpers {
  export function isExpensive(product: Product): boolean {
    return product.price > 100;
  }
  
  export function getDisplayName(product: Product): string {
    return `${product.name} (${product.category})`;
  }
  
  export const PRICE_THRESHOLDS = {
    BUDGET: 50,
    PREMIUM: 200,
    LUXURY: 1000
  } as const;
  
  export type PriceRange = keyof typeof PRICE_THRESHOLDS;
  
  export function getPriceRange(price: number): PriceRange {
    if (price >= PRICE_THRESHOLDS.LUXURY) return 'LUXURY';
    if (price >= PRICE_THRESHOLDS.PREMIUM) return 'PREMIUM';
    return 'BUDGET';
  }
}