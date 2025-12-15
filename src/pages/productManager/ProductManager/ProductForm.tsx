import React, { useCallback, useState } from "react";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Separator } from "../../../components/ui/separator";
import { Save, X, Upload, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { ProductRequestDTO, ProductTypee } from "../../../types/product.types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";

const hiddenInputStyles: React.CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

interface Props {
  data: ProductRequestDTO;
  onChange: (field: keyof ProductRequestDTO, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  isEditMode?: boolean;
}

// IMGBB CONFIG - Lấy API key miễn phí tại: https://api.imgbb.com/
const IMGBB_API_KEY = "240f1487fe60a1f7e5dea4b9e488a44b"; // Thay bằng API key

const ProductForm: React.FC<Props> = React.memo(
  ({ data, onChange, onSave, onCancel, isEditMode = false }) => {
    const [imagePreview, setImagePreview] = useState<string | null>(
      data.imageUrl || null
    );
    const [imageMode, setImageMode] = useState<"upload" | "url">("url");
    const [imageUrl, setImageUrl] = useState<string>(data.imageUrl || "");
    const [isUploading, setIsUploading] = useState(false);

    const handleText = useCallback(
      (field: keyof ProductRequestDTO, e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(field, e.target.value);
      },
      [onChange]
    );

    const handleNumber = useCallback(
      (field: keyof ProductRequestDTO, e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value) || value === "") {
          onChange(field, Number(value));
        }
      },
      [onChange]
    );

    const handleTrackList = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(
          "trackList",
          e.target.value.split(",").map((s) => s.trim())
        );
      },
      [onChange]
    );

    const handleSelectChange = useCallback(
      (field: keyof ProductRequestDTO, value: string) => {
        onChange(field, value as ProductTypee);
      },
      [onChange]
    );

    // 🔥 XỬ LÝ UPLOAD ẢNH LÊN IMGBB
    const uploadToImgBB = async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await fetch(
          `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();
        
        if (data.success) {
          return data.data.url; // URL ảnh từ ImgBB
        } else {
          throw new Error(data.error?.message || "Upload failed");
        }
      } catch (error) {
        console.error("Upload failed:", error);
        throw new Error("Failed to upload image to ImgBB");
      }
    };

    // XỬ LÝ KHI CHỌN FILE
    const handleImageChange = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Kiểm tra kích thước file (ImgBB giới hạn 32MB)
        if (file.size > 32 * 1024 * 1024) {
          alert("❌ File size must be less than 32MB");
          return;
        }

        // Preview local trước
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target?.result as string;
          setImagePreview(result);
        };
        reader.readAsDataURL(file);

        // Upload lên ImgBB
        setIsUploading(true);
        try {
          const url = await uploadToImgBB(file);
          setImageUrl(url);
          setImagePreview(url);
          onChange("imageUrl", url); // Lưu URL vào data
          alert("✅ Image uploaded successfully!");
        } catch (error) {
          alert("❌ Failed to upload image. Please try again.");
          console.error(error);
        } finally {
          setIsUploading(false);
        }
      },
      [onChange]
    );

    // XỬ LÝ KHI PASTE URL
    const handleUrlChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setImageUrl(url);
        setImagePreview(url);
        onChange("imageUrl", url);
      },
      [onChange]
    );

    const removeImage = useCallback(() => {
      setImagePreview(null);
      setImageUrl("");
      onChange("imageUrl", "");
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    }, [onChange]);

    return (
      <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {isEditMode ? "Edit Product" : "Add New Product"}
        </h2>
        <p className="text-gray-600 mb-6">Fill in the product details below</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT FIELDS */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Name
                </label>
                <Input
                  placeholder="Product name"
                  value={data.name}
                  onChange={(e) => handleText("name", e)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Description
                </label>
                <Input
                  placeholder="Description"
                  value={data.description}
                  onChange={(e) => handleText("description", e)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Type
                </label>
                <Select
                  value={data.type || ProductTypee.CD}
                  onValueChange={(value: string) => handleSelectChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Product Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ProductTypee).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Stock
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={data.stock.toString()}
                  onChange={(e) => handleNumber("stock", e)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Weight (kg)
                </label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={data.weight.toString()}
                  onChange={(e) => handleNumber("weight", e)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Price (VND)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={data.price.toString()}
                  onChange={(e) => handleNumber("price", e)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Artist
                </label>
                <Input
                  placeholder="Artist"
                  value={data.artist}
                  onChange={(e) => handleText("artist", e)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Record Label
                </label>
                <Input
                  placeholder="Record Label"
                  value={data.recordLabel}
                  onChange={(e) => handleText("recordLabel", e)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Genre
                </label>
                <Input
                  placeholder="Genre"
                  value={data.genre}
                  onChange={(e) => handleText("genre", e)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Track List (comma separated)
                </label>
                <Input
                  placeholder="Track1, Track2, Track3"
                  value={data.trackList?.join(", ") || ""}
                  onChange={handleTrackList}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: IMAGE */}
          <div className="lg:col-span-1">
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Product Image
            </label>

            {/* Toggle Upload / URL */}
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant={imageMode === "url" ? "default" : "outline"}
                size="sm"
                onClick={() => setImageMode("url")}
                className="flex-1"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Paste URL
              </Button>
              <Button
                type="button"
                variant={imageMode === "upload" ? "default" : "outline"}
                size="sm"
                onClick={() => setImageMode("upload")}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </div>

            {/* Preview */}
            <div className="mb-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-full h-48 object-cover rounded-lg border"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/300x200?text=Invalid+Image";
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 h-48 flex flex-col items-center justify-center rounded-lg bg-gray-50">
                  <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No image selected</p>
                </div>
              )}
            </div>

            {/* URL Input */}
            {imageMode === "url" && (
              <Input
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={handleUrlChange}
              />
            )}

            {/* Upload Button */}
            {imageMode === "upload" && (
              <>
                <input
                  type="file"
                  id="file-upload"
                  style={hiddenInputStyles}
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isUploading}
                />
                <label
                  htmlFor="file-upload"
                  className={`flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-50 ${
                    isUploading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? "Uploading..." : "Choose File"}
                </label>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Max size: 32MB
                </p>
              </>
            )}
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>

          <Button
            className="bg-teal-600 text-white hover:bg-teal-700"
            onClick={onSave}
            disabled={isUploading}
          >
            <Save className="w-4 h-4 mr-2" />
            {isEditMode ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </Card>
    );
  }
);

export default ProductForm;