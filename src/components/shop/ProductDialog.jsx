import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProductDialog({ onClose, creatorEmail }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "digital",
    category: "training_plan",
    price: "",
    image_url: "",
    file_url: "",
    stock: ""
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, image_url: file_url });
      toast.success("Image uploaded");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, file_url });
      toast.success("File uploaded");
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      await base44.entities.Product.create({
        creator_email: creatorEmail,
        name: formData.name,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        price: parseFloat(formData.price),
        image_url: formData.image_url,
        file_url: formData.file_url,
        stock: formData.stock ? parseInt(formData.stock) : null,
        is_active: true,
        sales_count: 0
      });

      toast.success("Product created!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onClose();
    } catch (error) {
      toast.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-cyan-500/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Product</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-cyan-400 mb-2 block">Product Name*</label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Training Program Pro"
              className="bg-slate-800 border-cyan-500/30 text-white"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-cyan-400 mb-2 block">Description</label>
            <Textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your product..."
              className="bg-slate-800 border-cyan-500/30 text-white resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-cyan-400 mb-2 block">Type</label>
              <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                <SelectTrigger className="bg-slate-800 border-cyan-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-bold text-cyan-400 mb-2 block">Category</label>
              <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="bg-slate-800 border-cyan-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="training_plan">Training Plan</SelectItem>
                  <SelectItem value="ebook">eBook</SelectItem>
                  <SelectItem value="video_course">Video Course</SelectItem>
                  <SelectItem value="merchandise">Merchandise</SelectItem>
                  <SelectItem value="coaching_session">Coaching Session</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-cyan-400 mb-2 block">Price (USD)*</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                placeholder="9.99"
                className="bg-slate-800 border-cyan-500/30 text-white"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-cyan-400 mb-2 block">Stock (optional)</label>
              <Input
                type="number"
                min="0"
                value={formData.stock}
                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                placeholder="Unlimited"
                className="bg-slate-800 border-cyan-500/30 text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-cyan-400 mb-2 block">Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload">
              <Button
                type="button"
                variant="outline"
                className="w-full border-cyan-500/30 text-white"
                disabled={uploadingImage}
                asChild
              >
                <span>
                  {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  {formData.image_url ? "Image Uploaded ✓" : "Upload Image"}
                </span>
              </Button>
            </label>
          </div>

          {formData.type === "digital" && (
            <div>
              <label className="text-sm font-bold text-cyan-400 mb-2 block">Digital File</label>
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-cyan-500/30 text-white"
                  disabled={uploadingFile}
                  asChild
                >
                  <span>
                    {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                    {formData.file_url ? "File Uploaded ✓" : "Upload File"}
                  </span>
                </Button>
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
            >
              Create Product
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}