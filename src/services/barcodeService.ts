export interface ProductData {
  productName: string;
  brand?: string;
  category?: string;
  quantity?: string;
  imageUrl?: string;
}

interface OpenFoodFactsProduct {
  product?: {
    product_name?: string;
    brands?: string;
    categories?: string;
    quantity?: string;
    image_url?: string;
  };
  status: number;
  status_verbose: string;
}

/**
 * Fetches product information from OpenFoodFacts API
 * @param barcode - The barcode/UPC number to look up
 * @returns Product data or null if not found
 */
export async function fetchProductByBarcode(
  barcode: string
): Promise<ProductData | null> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );

    if (!response.ok) {
      console.error('OpenFoodFacts API error:', response.status);
      return null;
    }

    const data: OpenFoodFactsProduct = await response.json();

    // Check if product was found
    if (data.status !== 1 || !data.product) {
      console.log('Product not found in OpenFoodFacts database');
      return null;
    }

    const product = data.product;

    // Extract and clean product data
    const productData: ProductData = {
      productName: product.product_name || 'Unknown Product',
      brand: product.brands?.split(',')[0]?.trim() || undefined,
      category: product.categories?.split(',')[0]?.trim() || undefined,
      quantity: product.quantity || undefined,
      imageUrl: product.image_url || undefined,
    };

    console.log('Product found:', productData);
    return productData;
  } catch (error) {
    console.error('Error fetching product from OpenFoodFacts:', error);
    return null;
  }
}

/**
 * Parses quantity string from OpenFoodFacts into number and unit
 * Example: "500g" -> { quantity: 500, unit: "g" }
 * Example: "1L" -> { quantity: 1, unit: "L" }
 */
export function parseQuantity(quantityStr?: string): {
  quantity: number;
  unit: string;
} {
  if (!quantityStr) {
    return { quantity: 1, unit: 'count' };
  }

  // Remove spaces and convert to lowercase for parsing
  const cleaned = quantityStr.trim().toLowerCase();

  // Try to extract number and unit
  const match = cleaned.match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/i);

  if (match) {
    const quantity = parseFloat(match[1]);
    const unit = match[2] || 'count';

    // Normalize common units
    const unitMap: Record<string, string> = {
      gram: 'g',
      grams: 'g',
      kilogram: 'kg',
      kilograms: 'kg',
      milliliter: 'ml',
      milliliters: 'ml',
      liter: 'L',
      liters: 'L',
      ounce: 'oz',
      ounces: 'oz',
      pound: 'lb',
      pounds: 'lb',
    };

    return {
      quantity,
      unit: unitMap[unit] || unit,
    };
  }

  // Default fallback
  return { quantity: 1, unit: 'count' };
}
