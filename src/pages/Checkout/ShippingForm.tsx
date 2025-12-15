/* ---------------------------------------------------------
* ĐÁNH GIÁ THIẾT KẾ MÔ-ĐUN ShippingForm
* ---------------------------------------------------------
* 1. COUPLING:
*    - Mức độ: Low Data Coupling + Low Control Coupling
*
*    - Phụ thuộc vào:
*         + UI Components:
*               - Input, Select, Textarea, Button
*         + Data:
*               - PROVINCES, DELIVERY_METHODS
*         + Parent callbacks:
*               - onSubmit, onBack, onBackToCart
*               - notify()
*
*    - Lý do:
*         - Form validation nội bộ, không phụ thuộc backend.
*         - Nhận dữ liệu shippingData từ parent → coupling thấp.
*         - Không gọi API trực tiếp (đã tách ra ở CheckoutContext).
*
*    → Coupling thấp, rất tốt cho một form component.
*
* ---------------------------------------------------------
* 2. COHESION:
*    - Mức độ: Functional Cohesion (cao)
*
*    - Lý do:
*         - Thành phần chỉ xử lý duy nhất một chức năng:
*               “Nhập và kiểm tra thông tin giao hàng”.
*         - State validation tập trung.
*         - Không xử lý logic checkout hoặc payment.
*
*    → Cohesion cao, file clean, đúng trách nhiệm.
* ---------------------------------------------------------
*/


import { useState } from 'react';
import { AlertCircle, ChevronLeft, ShoppingCart, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import type { IDeliveryInfo } from '../../types/checkout.types';
import { PROVINCES } from '../../constants/provinces';
import { DELIVERY_METHODS } from '../../constants/shipping';

interface ShippingFormProps {
  shippingData: IDeliveryInfo;
  onBack: () => void;
  onBackToCart: () => void;
  onSubmit: (data: IDeliveryInfo) => Promise<void>;
  isLoading: boolean;
  notify: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

/**
 * ShippingForm: Step 2 of checkout - Delivery information
 * Handles: Form validation, province selection, delivery method
 */
export function ShippingForm({ 
  shippingData, 
  onBack, 
  onBackToCart, 
  onSubmit, 
  isLoading,
  notify
}: ShippingFormProps) {
  // Đảm bảo formData có kiểu dữ liệu phù hợp với IDeliveryInfo
  const [formData, setFormData] = useState<IDeliveryInfo>(shippingData); 
  const [errors, setErrors] = useState<Partial<Record<keyof IDeliveryInfo, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof IDeliveryInfo, boolean>>>({});

  // Hàm validateField chỉ chấp nhận string | number
  const validateField = (name: keyof IDeliveryInfo, value: string | number) => {
    const strValue = String(value);
    
    switch (name) {
      case 'fullName':
        if (!strValue.trim()) return 'Full name is required';
        if (strValue.trim().length < 2) return 'Full name must be at least 2 characters';
        return '';
      case 'phoneNumber':
        if (!strValue.trim()) return 'Phone number is required';
        if (!/^[0-9]{10,11}$/.test(strValue.replace(/\s/g, '')))
          return 'Please enter a valid phone number (10-11 digits)';
        return '';
      case 'Email':
        if (!strValue.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue))
          return 'Please enter a valid email address';
        return '';
      case 'address':
        if (!strValue.trim()) return 'Address is required';
        if (strValue.trim().length < 10)
          return 'Please enter a detailed address (at least 10 characters)';
        return '';
      case 'province':
        if (!strValue) return 'Please select a province';
        return '';
      case 'deliveryMethod':
        if (!strValue) return 'Please select a delivery method';
        return '';
      case 'note':
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (field: keyof IDeliveryInfo) => {
    setTouched({ ...touched, [field]: true });
    // SỬA LỖI 3/4: Sử dụng nullish coalescing (??) để đảm bảo giá trị không phải là undefined
    const error = validateField(field, formData[field] ?? ''); 
    setErrors({ ...errors, [field]: error });
  };

  const handleChange = (field: keyof IDeliveryInfo, value: string | number) => {
    // Nếu giá trị là rỗng (Select), ta dùng '' thay vì null/undefined
    const finalValue = value === null || value === undefined ? '' : value;
    setFormData({ ...formData, [field]: finalValue });
    
    if (touched[field]) {
      // Khi kiểm tra lỗi, ta lấy giá trị đã được cập nhật hoặc sử dụng ''
      const error = validateField(field, finalValue); 
      setErrors({ ...errors, [field]: error });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Partial<Record<keyof IDeliveryInfo, string>> = {};
    const requiredFields: (keyof IDeliveryInfo)[] = [
      'fullName',
      'phoneNumber',
      'Email',
      'address',
      'province',
      'deliveryMethod',
    ];
    
    requiredFields.forEach((key) => {
      // SỬA LỖI 3/4: Đảm bảo giá trị truyền vào không phải là undefined
      const error = validateField(key, formData[key] ?? ''); 
      if (error) newErrors[key] = error;
    });

    setTouched({
      fullName: true,
      phoneNumber: true,
      Email: true,
      address: true,
      province: true,
      deliveryMethod: true,
      note: false,
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      notify("info", "Validating shipping details and calculating fees...");
      onSubmit(formData);
    } else {
      notify("error", "Please correct the highlighted errors in the shipping form.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Shipping Information</h2>
          <p className="text-gray-600 mt-2">
            Enter your delivery details to calculate shipping fees
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={onBackToCart}
          className="text-gray-600 hover:text-gray-900"
          disabled={isLoading}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Back to Cart
        </Button>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              onBlur={() => handleBlur('fullName')}
              className={errors.fullName && touched.fullName ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.fullName && touched.fullName && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.fullName}</span>
              </div>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="0123456789"
              value={formData.phoneNumber}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
              onBlur={() => handleBlur('phoneNumber')}
              className={errors.phoneNumber && touched.phoneNumber ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.phoneNumber && touched.phoneNumber && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.phoneNumber}</span>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="Email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="Email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.Email}
              onChange={(e) => handleChange('Email', e.target.value)}
              onBlur={() => handleBlur('Email')}
              className={errors.Email && touched.Email ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.Email && touched.Email && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.Email}</span>
              </div>
            )}
          </div>

          {/* Province */}
          <div className="space-y-2">
            <Label htmlFor="province">
              Province / City <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.province}
              // SỬA LỖI 5: Chỉ định kiểu dữ liệu là string
              onValueChange={(value: string) => handleChange('province', value)} 
              disabled={isLoading}
            >
              <SelectTrigger
                id="province"
                className={errors.province && touched.province ? 'border-red-500' : ''}
                onBlur={() => handleBlur('province')}
              >
                <SelectValue placeholder="Select your province/city" />
              </SelectTrigger>
              <SelectContent>
                {PROVINCES.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.province && touched.province && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.province}</span>
              </div>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">
              Detailed Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address"
              type="text"
              placeholder="House number, street, ward, district"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              onBlur={() => handleBlur('address')}
              className={errors.address && touched.address ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.address && touched.address && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.address}</span>
              </div>
            )}
          </div>

          {/* Delivery Method */}
          <div className="space-y-2">
            <Label htmlFor="deliveryMethod">
              Delivery Method <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.deliveryMethod}
              // SỬA LỖI 6: Chỉ định kiểu dữ liệu là string
              onValueChange={(value: string) => handleChange('deliveryMethod', value)}
              disabled={isLoading}
            >
              <SelectTrigger
                id="deliveryMethod"
                className={errors.deliveryMethod && touched.deliveryMethod ? 'border-red-500' : ''}
                onBlur={() => handleBlur('deliveryMethod')}
              >
                <SelectValue placeholder="Select delivery method" />
              </SelectTrigger>
              <SelectContent>
                {DELIVERY_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.deliveryMethod && touched.deliveryMethod && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.deliveryMethod}</span>
              </div>
            )}
          </div>

          {/* Note (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="note">
              Delivery Note (Optional)
            </Label>
            <Textarea
              id="note"
              placeholder="Special delivery instructions, preferred time, etc."
              value={formData.note || ''}
              onChange={(e) => handleChange('note', e.target.value)}
              rows={3}
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500">
              Add any special instructions for delivery
            </p>
          </div>

          {/* Shipping Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-blue-900 mb-2">📦 Shipping Fee Information</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <p><strong>Hanoi & Ho Chi Minh City:</strong></p>
              <p className="ml-4">• 22,000 VND for first 3kg</p>
              <p className="ml-4">• 2,500 VND per additional 0.5kg</p>
              
              <p className="mt-2"><strong>Other Provinces:</strong></p>
              <p className="ml-4">• 30,000 VND for first 0.5kg</p>
              <p className="ml-4">• 2,500 VND per additional 0.5kg</p>
              
              <p className="mt-2 text-green-700">
                <strong>🎁 Free Shipping Discount:</strong> Orders over 100,000 VND qualify for up to 25,000 VND discount!
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBack} 
              className="flex-1"
              disabled={isLoading}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Cart
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-teal-600 hover:bg-teal-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                'Continue to Payment'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}