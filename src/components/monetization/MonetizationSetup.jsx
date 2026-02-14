import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function MonetizationSetup({ open, onOpenChange, user, onSuccess }) {
  const [subscriptionPrice, setSubscriptionPrice] = useState(user?.subscription_price || 0);
  const [acceptingDonations, setAcceptingDonations] = useState(user?.is_accepting_donations || false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    
    await base44.auth.updateMe({
      subscription_price: subscriptionPrice,
      is_accepting_donations: acceptingDonations,
    });

    setSaving(false);
    toast.success("Monetization settings updated!");
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Monetization Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Monthly Subscription Price (USD)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={subscriptionPrice}
              onChange={e => setSubscriptionPrice(parseFloat(e.target.value) || 0)}
              placeholder="0.00 (Free)"
              className="rounded-xl"
            />
            <p className="text-xs text-slate-500">
              Set to 0 for free content. Subscribers get access to your premium posts.
            </p>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div>
              <Label className="text-sm font-medium">Accept Donations</Label>
              <p className="text-xs text-slate-500">Allow supporters to send you donations</p>
            </div>
            <Switch
              checked={acceptingDonations}
              onCheckedChange={setAcceptingDonations}
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-800">
              💡 Tip: To receive payments, you'll need to connect a Stripe account. 
              This will be set up in your payment settings.
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Settings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}