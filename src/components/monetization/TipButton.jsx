import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Heart } from "lucide-react";
import { toast } from "sonner";

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

export default function TipButton({ creator, contextType, contextId, variant = "outline", size = "default" }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTip = async (selectedAmount) => {
    const tipAmount = selectedAmount || parseFloat(amount);
    if (!tipAmount || tipAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      
      await base44.entities.Tip.create({
        from_email: currentUser.email,
        to_email: creator.email,
        amount: tipAmount,
        message: message,
        context_type: contextType,
        context_id: contextId,
        status: "completed"
      });

      // Create notification
      await base44.entities.Notification.create({
        recipient_email: creator.email,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name,
        actor_avatar: currentUser.avatar_url,
        type: "tip",
        message: `sent you a $${tipAmount} tip${message ? `: "${message}"` : ""}`,
      });

      toast.success(`Tipped $${tipAmount} to ${creator.name}! 🎉`);
      setOpen(false);
      setAmount("");
      setMessage("");
    } catch (error) {
      toast.error("Failed to send tip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <DollarSign className="w-4 h-4" />
        Tip
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Send a Tip to {creator.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preset amounts */}
            <div>
              <label className="text-sm font-bold text-cyan-400 mb-2 block">Quick Amount</label>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_AMOUNTS.map(amt => (
                  <Button
                    key={amt}
                    onClick={() => handleTip(amt)}
                    disabled={loading}
                    className="bg-slate-800 hover:bg-cyan-600 border border-cyan-500/30 text-white"
                  >
                    ${amt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div>
              <label className="text-sm font-bold text-cyan-400 mb-2 block">Custom Amount</label>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount..."
                className="bg-slate-800 border-cyan-500/30 text-white"
              />
            </div>

            {/* Optional message */}
            <div>
              <label className="text-sm font-bold text-cyan-400 mb-2 block">Message (Optional)</label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Add a message..."
                className="bg-slate-800 border-cyan-500/30 text-white resize-none"
                rows={3}
              />
            </div>

            <Button
              onClick={() => handleTip()}
              disabled={loading || !amount}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
            >
              <Heart className="w-4 h-4 mr-2" />
              Send Tip
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}