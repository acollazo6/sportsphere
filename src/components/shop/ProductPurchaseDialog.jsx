import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProductPurchaseDialog({ product, currentUser, hasPurchased, onClose }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!currentUser) {
      toast.error("Please login to purchase");
      return;
    }

    setLoading(true);
    try {
      await base44.entities.Purchase.create({
        buyer_email: currentUser.email,
        product_id: product.id,
        product_data: product,
        amount: product.price,
        status: "completed",
        download_url: product.file_url
      });

      await base44.entities.Product.update(product.id, {
        sales_count: (product.sales_count || 0) + 1
      });

      await base44.entities.Notification.create({
        recipient_email: product.creator_email,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name,
        actor_avatar: currentUser.avatar_url,
        type: "purchase",
        message: `purchased your product: ${product.name}`,
      });

      toast.success("Purchase successful! 🎉");
      queryClient.invalidateQueries({ queryKey: ["my-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error) {
      toast.error("Failed to complete purchase");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (product.file_url) {
      window.open(product.file_url, "_blank");
      toast.success("Download started!");
    } else {
      toast.error("No download available");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-cyan-500/30">
        <DialogHeader>
          <DialogTitle className="text-white">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-48 object-cover rounded-xl"
            />
          )}

          <p className="text-slate-300">{product.description}</p>

          <div className="flex items-center justify-between p-4 bg-slate-800/60 rounded-xl">
            <span className="text-slate-400">Price</span>
            <span className="text-3xl font-black text-cyan-400">${product.price}</span>
          </div>

          {hasPurchased ? (
            <Button
              onClick={handleDownload}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Now
            </Button>
          ) : (
            <Button
              onClick={handlePurchase}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ShoppingCart className="w-4 h-4 mr-2" />
              )}
              Purchase Now
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}