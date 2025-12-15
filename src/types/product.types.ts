// ==================== EXTENDED PRODUCT TYPES ====================
// Extended product information for AIMS physical media products

import { IProduct } from './checkout.types';

// Product type types

export type ProductType = 'Book' | 'Newspaper' | 'CD' | 'DVD';

// Condition status
export type ProductCondition = 'New' | 'Used';

// ==================== API REQUEST/RESPONSE TYPES ====================

// Product for API response (from backend)
export interface Product {
  id: string;
  name: string;
  description: string;
  type: string;
  stock: number;
  weight: number;
  price: number;
  artist: string;
  recordLabel: string;
  genre: string;
  trackList: string[];
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export enum ProductTypee {
    BOOK = "BOOK",
    NEWSPAPER = "NEWSPAPER",
    CD = "CD",
    DVD = "DVD",
}


// Product creation request payload
export type ProductRequestDTO = {
    name: string;
    description: string;
    type: ProductType; 
    stock: number;
    weight: number;
    price: number;
    artist: string;
    recordLabel: string;
    genre: string;
    trackList: string[];
};

export type ProductDTO = ProductRequestDTO & {
    id: string;
    createdDate: string; // LocalDateTime trong Java
    lastModifiedDate: string; // LocalDateTime trong Java
    active: boolean;
};

// ==================== PHYSICAL ATTRIBUTES ====================

// Common physical attributes
export interface IPhysicalAttributes {
  height: number; // cm
  width: number; // cm
  length: number; // cm
}

// Base extended product interface
export interface IExtendedProduct extends IProduct {
  barcode: string;
  description: string;
  condition: ProductCondition;
  primaryColor?: string;
  physicalAttributes: IPhysicalAttributes;
}

// Book-specific fields
export interface IBook extends IExtendedProduct {
  type: 'Book';
  authors: string[];
  coverType: 'Paperback' | 'Hardcover';
  publisher: string;
  publicationDate: string;
  pages?: number;
  language?: string;
}

// Newspaper-specific fields
export interface INewspaper extends IExtendedProduct {
  type: 'Newspaper';
  editorInChief: string;
  publisher: string;
  publicationDate: string;
  issueNumber?: string;
}

// CD-specific fields
export interface ICD extends IExtendedProduct {
  type: 'CD';
  artists: string[];
  recordLabel: string;
  releaseDate: string;
  trackList: string[];
  genre?: string;
}

// DVD-specific fields
export interface IDVD extends IExtendedProduct {
  type: 'DVD';
  discType: 'Blu-ray' | 'HD-DVD' | 'Standard DVD';
  director: string;
  runtime: number; // minutes
  releaseDate: string;
  studio?: string;
  cast?: string[];
  genre?: string;
  language?: string;
  subtitles?: string[];
}

// Union type for all product types
export type IAnyProduct = IBook | INewspaper | ICD | IDVD;

// Filter options
export interface IProductFilters {
  types: ProductType[];
  priceRange: {
    min: number;
    max: number;
  };
  condition: ProductCondition | 'All';
  publisher?: string;
  searchQuery?: string;
}