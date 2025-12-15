/* ---------------------------------------------------------
* ĐÁNH GIÁ THIẾT KẾ MÔ-ĐUN ProductFilters
* ---------------------------------------------------------
* 1. COUPLING:
*    - Mức độ: Data Coupling + Control Coupling
*
*    - Với lớp/module nào:
*         + UI Components:
*             - Card
*             - Label
*             - Checkbox
*             - Slider
*             - Button
*             - Separator
*         + Product Types:
*             - ProductCategory
*             - ProductCondition
*             - IProductFilters
*         + Parent Component (callback):
*             - onFiltersChange(filters)
*
*    - Lý do:
*         - Component chỉ nhận và thay đổi dữ liệu thông qua props `filters`
*           → **Data Coupling**, mức tốt và an toàn.
*         - Tất cả thao tác cập nhật đều thông qua một hàm callback từ bên ngoài
*           → **Control Coupling**, đúng chuẩn thiết kế React (lifting state up).
*         - Không thao tác trực tiếp đến global state hay API → giảm coupling đáng kể.
*         - Không truyền vào các đối tượng phức tạp ngoài `filters` → không có Stamp Coupling.
*         - Phụ thuộc UI components nhưng chỉ để hiển thị UI, không ảnh hưởng logic.
*
* ---------------------------------------------------------
* 2. COHESION:
*    - Mức độ: Functional Cohesion (rất cao)
*
*    - Giữa các thành phần:
*         + Bộ lọc Category
*         + Bộ lọc Price Range
*         + Bộ lọc Condition
*         + Hàm reset filters
*         + Hàm handleCategoryToggle
*         + Hàm handlePriceRangeChange
*         + Hàm handleConditionChange
*         + Tính toán hasActiveFilters
*
*    - Lý do:
*         - Mỗi function đều phục vụ cùng một mục tiêu:
*               **"Quản lý và hiển thị các bộ lọc sản phẩm"**
*         - Tất cả xử lý liên quan trực tiếp tới dữ liệu filters → cohesion mạnh.
*         - Không chứa ogic ngoài phạm vi của filtering (ví dụ: fetch API, sort, navigation…)
*           → module tập trung đúng chức năng.
*         - Việc tách các handler rõ ràng theo từng loại filter làm mô-đun dễ maintain và dễ mở rộng.
*
*/
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { ProductType, ProductCondition, IProductFilters } from '../types/product.types';
import { FilterX } from 'lucide-react';

interface ProductFiltersProps {
  filters: IProductFilters;
  onFiltersChange: (filters: IProductFilters) => void;
}

/**
 * ProductFilters: Sidebar component for filtering products
 * Supports: Category, Price Range, Condition filters
 */
export function ProductFilters({ filters, onFiltersChange }: ProductFiltersProps) {
  const types: ProductType[] = ['Book', 'Newspaper', 'CD', 'DVD'];
  const conditions: Array<ProductCondition | 'All'> = ['All', 'New', 'Used'];

  const handleTypeToggle = (type: ProductType) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];

    onFiltersChange({
      ...filters,
      types: newTypes ,
    });
  };

  const handlePriceRangeChange = (values: number[]) => {
    onFiltersChange({
      ...filters,
      priceRange: {
        min: values[0],
        max: values[1],
      },
    });
  };

  const handleConditionChange = (condition: ProductCondition | 'All') => {
    onFiltersChange({
      ...filters,
      condition,
    });
  };

  const handleReset = () => {
    onFiltersChange({
      types: [],
      priceRange: { min: 0, max: 600000 },
      condition: 'All',
      searchQuery: '',
    });
  };

  const hasActiveFilters =
    filters.types.length > 0 ||
    filters.condition !== 'All' ||
    filters.priceRange.min !== 0 ||
    filters.priceRange.max !== 600000;

  return (
    <Card className="p-6 space-y-6 h-fit sticky top-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3>Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
          >
            <FilterX className="w-4 h-4 mr-1" />
            Reset
          </Button>
        )}
      </div>

      <Separator />

      {/* Category Filter */}
      <div className="space-y-3">
        <Label className="text-base">Type</Label>
        <div className="space-y-2">
          {types.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${type}`}
                checked={filters.types.includes(type)}
                onCheckedChange={() => handleTypeToggle(type)}
              />
              <label
                htmlFor={`type-${type}`}
                className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {type}  
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range Filter */}
      <div className="space-y-3">
        <Label className="text-base">Price Range</Label>
        <div className="space-y-4">
          <Slider
            min={0}
            max={600000}
            step={10000}
            value={[filters.priceRange.min, filters.priceRange.max]}
            onValueChange={handlePriceRangeChange}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(filters.priceRange.min)}
            </span>
            <span>
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(filters.priceRange.max)}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Condition Filter */}
      <div className="space-y-3">
        <Label className="text-base">Condition</Label>
        <div className="space-y-2">
          {conditions.map((condition) => (
            <div key={condition} className="flex items-center space-x-2">
              <Checkbox
                id={`condition-${condition}`}
                checked={filters.condition === condition}
                onCheckedChange={() => handleConditionChange(condition)}
              />
              <label
                htmlFor={`condition-${condition}`}
                className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {condition}
              </label>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
