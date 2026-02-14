import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DonateButton({ recipientEmail, recipientName, currentUser }) {
  const [showDialog, setShowDialog] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleDonate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSending(true);

    try {
      await base44.entities.Transaction.create({
        from_email: currentUser.email,
        to_email: recipientEmail,
        type: "donation",
        amount: parseFloat(amount),
        status: "completed",
        message: message,
      });

      // Send notification
      await base44.entities.Notification.create({
        recipient_email: recipientEmail,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name,
        actor_avatar: currentUser.avatar_url,
        type: "follow",
        message: `sent you a donation of $${amount}`,
      });

      toast.success(`Donation of $${amount} sent to ${recipientName}!`);
      setShowDialog(false);
      setAmount("");
      setMessage("");
    } catch (error) {
      toast.error("Donation failed. Please try again.");
    }

    setSending(false);
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="outline"
        className="rounded-xl gap-2 border-pink-200 text-pink-600 hover:bg-pink-50"
      >
        <Heart className="w-4 h-4" />
        Donate
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Send Donation to {recipientName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Amount (USD)</Label>
              <Input
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="10.00"
                className="rounded-xl"
              />
            </div>

            <div className="flex gap-2">
              {[5, 10, 25, 50].map(amt => (
                <Button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  variant="outline"
                  size="sm"
                  className="rounded-xl flex-1"
                >
                  ${amt}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Message (Optional)</Label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Add a supportive message..."
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>

            <Button
              onClick={handleDonate}
              disabled={sending}
              className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : `Send $${amount || 0}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}