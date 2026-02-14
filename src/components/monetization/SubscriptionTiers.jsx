import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Star, Zap } from "lucide-react";
import { toast } from "sonner";

const TIER_CONFIG = {
  basic: {
    name: "Basic",
    icon: Star,
    color: "from-blue-500 to-cyan-500",
    benefits: ["Exclusive posts", "Early content access", "Subscriber badge"]
  },
  pro: {
    name: "Pro",
    icon: Crown,
    color: "from-purple-500 to-pink-500",
    benefits: ["All Basic benefits", "Live stream access", "Priority replies", "Monthly Q&A"]
  },
  elite: {
    name: "Elite",
    icon: Zap,
    color: "from-amber-500 to-orange-500",
    benefits: ["All Pro benefits", "1-on-1 coaching sessions", "Personalized training plans", "VIP Discord access"]
  }
};

export default function SubscriptionTiers({ creator, currentUser }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(null);

  const { data: existingSubscription } = useQuery({
    queryKey: ["creator-subscription", currentUser?.email, creator.email],
    queryFn: async () => {
      const subs = await base44.entities.CreatorSubscription.filter({
        subscriber_email: currentUser.email,
        creator_email: creator.email,
        status: "active"
      });
      return subs[0] || null;
    },
    enabled: !!currentUser,
  });

  const { data: tierPricing = {} } = useQuery({
    queryKey: ["creator-tier-pricing", creator.email],
    queryFn: async () => {
      // In production, fetch from creator's settings
      return {
        basic: 4.99,
        pro: 9.99,
        elite: 24.99
      };
    },
  });

  const handleSubscribe = async (tier) => {
    if (!currentUser) {
      toast.error("Please login to subscribe");
      return;
    }

    setLoading(tier);
    try {
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      await base44.entities.CreatorSubscription.create({
        subscriber_email: currentUser.email,
        creator_email: creator.email,
        tier: tier,
        amount: tierPricing[tier],
        status: "active",
        benefits: TIER_CONFIG[tier].benefits,
        started_date: new Date().toISOString(),
        next_billing_date: nextBillingDate.toISOString()
      });

      await base44.entities.Notification.create({
        recipient_email: creator.email,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name,
        actor_avatar: currentUser.avatar_url,
        type: "subscription",
        message: `subscribed to your ${TIER_CONFIG[tier].name} tier!`,
      });

      toast.success(`Subscribed to ${TIER_CONFIG[tier].name} tier! 🎉`);
      queryClient.invalidateQueries({ queryKey: ["creator-subscription"] });
    } catch (error) {
      toast.error("Failed to subscribe");
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    setLoading("cancel");
    try {
      await base44.entities.CreatorSubscription.update(existingSubscription.id, {
        status: "cancelled"
      });
      toast.success("Subscription cancelled");
      queryClient.invalidateQueries({ queryKey: ["creator-subscription"] });
    } catch (error) {
      toast.error("Failed to cancel subscription");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white mb-4">Support {creator.name}</h3>
      
      <div className="grid md:grid-cols-3 gap-4">
        {Object.entries(TIER_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const isCurrentTier = existingSubscription?.tier === key;
          const price = tierPricing[key];

          return (
            <Card key={key} className={`bg-slate-900/60 backdrop-blur-xl border-2 ${isCurrentTier ? 'border-cyan-500' : 'border-slate-700'} relative overflow-hidden`}>
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.color}`} />
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {isCurrentTier && (
                    <span className="text-xs font-bold text-cyan-400 bg-cyan-500/20 px-2 py-1 rounded-full">
                      Active
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-xl font-bold text-white mb-1">{config.name}</h4>
                  <p className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    ${price}<span className="text-sm text-slate-500">/mo</span>
                  </p>
                </div>

                <ul className="space-y-2">
                  {config.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                {isCurrentTier ? (
                  <Button
                    onClick={handleCancel}
                    disabled={loading === "cancel"}
                    variant="outline"
                    className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    Cancel Subscription
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSubscribe(key)}
                    disabled={loading === key || !!existingSubscription}
                    className={`w-full bg-gradient-to-r ${config.color} hover:opacity-90 text-white`}
                  >
                    Subscribe
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}