import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, Users, ShoppingBag, Trophy, Loader2, Plus, Crown, Calendar, Scissors, BarChart2, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MonetizationSetup from "../components/monetization/MonetizationSetup";
import ProductDialog from "../components/shop/ProductDialog";
import StreamScheduler from "../components/creator/StreamScheduler";
import VODEditor from "../components/creator/VODEditor";
import CreatorAnalytics from "../components/creator/CreatorAnalytics";
import SubscriptionPlans from "../components/creator/SubscriptionPlans";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function CreatorHub() {
  const [user, setUser] = useState(null);
  const [showMonetizationSetup, setShowMonetizationSetup] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch creator stats
  const { data: subscriptions = [] } = useQuery({
    queryKey: ["creator-subscriptions", user?.email],
    queryFn: () => base44.entities.Subscription.filter({ creator_email: user.email, status: "active" }),
    enabled: !!user,
  });

  const { data: tips = [] } = useQuery({
    queryKey: ["creator-tips", user?.email],
    queryFn: () => base44.entities.Tip.filter({ to_email: user.email }),
    enabled: !!user,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["creator-products", user?.email],
    queryFn: () => base44.entities.Product.filter({ creator_email: user.email }),
    enabled: !!user,
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ["creator-challenges", user?.email],
    queryFn: () => base44.entities.Challenge.filter({ creator_email: user.email }),
    enabled: !!user,
  });

  const totalRevenue = [
    ...subscriptions.map(s => s.amount || 0),
    ...tips.map(t => t.amount || 0),
  ].reduce((sum, amount) => sum + amount, 0);

  const monthlyRecurring = subscriptions.reduce((sum, s) => sum + (s.amount || 0), 0);

  if (!user) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black flex items-center gap-3 mb-3">
              <Crown className="w-10 h-10" />
              Creator Hub
            </h1>
            <p className="text-white/90 text-lg">Manage your monetization and grow your audience</p>
          </div>
          <Button
            onClick={() => setShowMonetizationSetup(true)}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Monetization Settings
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">All-time earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monthly Recurring</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-900" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">${monthlyRecurring.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">{subscriptions.length} subscribers</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tips Received</CardTitle>
            <Users className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{tips.length}</div>
            <p className="text-xs text-gray-500 mt-1">${tips.reduce((sum, t) => sum + t.amount, 0).toFixed(2)} total</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Products & Courses</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{products.length}</div>
            <p className="text-xs text-gray-500 mt-1">Active listings</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="bg-white border border-gray-200 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="analytics" className="gap-1.5"><BarChart2 className="w-3.5 h-3.5" />Analytics</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5"><Calendar className="w-3.5 h-3.5" />Schedule</TabsTrigger>
          <TabsTrigger value="vod" className="gap-1.5"><Scissors className="w-3.5 h-3.5" />VOD Editor</TabsTrigger>
          <TabsTrigger value="plans" className="gap-1.5"><CreditCard className="w-3.5 h-3.5" />Subscriptions</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Your Products</h2>
            <Button
              onClick={() => setShowProductDialog(true)}
              className="bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Product
            </Button>
          </div>

          {products.length === 0 ? (
            <Card className="bg-white border-gray-200">
              <CardContent className="py-12 text-center">
                <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-500 mb-4">Create your first product or course to start earning</p>
                <Button onClick={() => setShowProductDialog(true)} className="bg-red-900 hover:bg-red-800">
                  Create First Product
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(product => (
                <Card key={product.id} className="bg-white border-gray-200">
                  <CardContent className="p-4">
                    {product.image_url && (
                      <div className="h-32 rounded-lg overflow-hidden mb-3">
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <Badge className="mb-2 capitalize">{product.type}</Badge>
                    <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-red-900">${product.price}</span>
                      <span className="text-sm text-gray-500">{product.sales_count || 0} sales</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Premium Challenges</h2>
            <Link to={createPageUrl("Challenges")}>
              <Button className="bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Challenge
              </Button>
            </Link>
          </div>

          {challenges.length === 0 ? (
            <Card className="bg-white border-gray-200">
              <CardContent className="py-12 text-center">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No challenges yet</h3>
                <p className="text-gray-500 mb-4">Create premium challenges to engage your audience</p>
                <Link to={createPageUrl("Challenges")}>
                  <Button className="bg-red-900 hover:bg-red-800">Create First Challenge</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {challenges.map(challenge => (
                <Card key={challenge.id} className="bg-white border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900">{challenge.title}</h3>
                      {challenge.is_premium && (
                        <Badge className="bg-amber-500">Premium</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{challenge.sport}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{challenge.participants_count || 0} participants</span>
                      <span className="text-sm text-gray-500">{challenge.duration_days} days</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Your Subscribers</h2>

          {subscriptions.length === 0 ? (
            <Card className="bg-white border-gray-200">
              <CardContent className="py-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No subscribers yet</h3>
                <p className="text-gray-500">Set up your subscription tiers to start earning recurring revenue</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {subscriptions.map(sub => (
                <Card key={sub.id} className="bg-white border-gray-200">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{sub.subscriber_email}</p>
                      <p className="text-sm text-gray-500">
                        {sub.tier} tier - ${sub.amount}/month
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">{sub.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {showMonetizationSetup && (
        <MonetizationSetup user={user} onClose={() => setShowMonetizationSetup(false)} />
      )}
      {showProductDialog && (
        <ProductDialog user={user} onClose={() => setShowProductDialog(false)} />
      )}
    </div>
  );
}