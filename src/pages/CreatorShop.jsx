import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, Download, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { toast } from "sonner";
import ProductDialog from "../components/shop/ProductDialog";
import ProductPurchaseDialog from "../components/shop/ProductPurchaseDialog";

export default function CreatorShop() {
  const [user, setUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const creatorEmail = urlParams.get("creator") || null;

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", creatorEmail],
    queryFn: () => creatorEmail 
      ? base44.entities.Product.filter({ creator_email: creatorEmail, is_active: true })
      : base44.entities.Product.filter({ is_active: true }, "-created_date", 50),
  });

  const { data: myPurchases = [] } = useQuery({
    queryKey: ["my-purchases", user?.email],
    queryFn: () => base44.entities.Purchase.filter({ buyer_email: user.email }),
    enabled: !!user,
  });

  const isMyShop = user?.email === creatorEmail;
  const purchasedProductIds = myPurchases.map(p => p.product_id);

  const categoryIcons = {
    training_plan: "🏋️",
    ebook: "📚",
    video_course: "🎥",
    merchandise: "👕",
    coaching_session: "🎯",
    other: "📦"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-500/50">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent mb-2">
                {isMyShop ? "My Shop" : "Creator Shop"}
              </h1>
              <p className="text-slate-400 text-lg">
                {isMyShop ? "Manage your digital products" : "Browse digital products and merchandise"}
              </p>
            </div>
            {isMyShop && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-700">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-400 mb-2">No Products Yet</h3>
              <p className="text-slate-500">
                {isMyShop ? "Start selling your training plans, courses, or merchandise!" : "Check back later for new products"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => {
              const hasPurchased = purchasedProductIds.includes(product.id);
              
              return (
                <Card key={product.id} className="bg-slate-900/60 backdrop-blur-xl border-cyan-500/20 overflow-hidden group hover:border-cyan-500/50 transition-all">
                  <div className="aspect-video bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900 flex items-center justify-center relative overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-6xl">{categoryIcons[product.category]}</span>
                    )}
                    {hasPurchased && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Owned
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white text-lg line-clamp-2">{product.name}</h3>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 capitalize flex-shrink-0">
                        {product.type}
                      </Badge>
                    </div>
                    
                    <p className="text-slate-400 text-sm line-clamp-2">{product.description}</p>
                    
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-2xl font-black text-cyan-400">${product.price}</span>
                      {hasPurchased ? (
                        <Button
                          onClick={() => setSelectedProduct(product)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-500"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setSelectedProduct(product)}
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                        >
                          Buy Now
                        </Button>
                      )}
                    </div>

                    {product.sales_count > 0 && (
                      <p className="text-xs text-slate-500">
                        {product.sales_count} {product.sales_count === 1 ? "sale" : "sales"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Dialogs */}
        {showCreateDialog && (
          <ProductDialog
            onClose={() => setShowCreateDialog(false)}
            creatorEmail={user?.email}
          />
        )}

        {selectedProduct && (
          <ProductPurchaseDialog
            product={selectedProduct}
            currentUser={user}
            hasPurchased={purchasedProductIds.includes(selectedProduct.id)}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </div>
    </div>
  );
}