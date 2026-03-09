import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { ShoppingBag } from 'lucide-react';

export default function MemberShopPage() {
  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title="Shop" subtitle="Rewards & goodies" />

      <div className="flex flex-col items-center justify-center px-6 text-center pt-16">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Coming Soon!</h2>
        <p className="text-sm text-muted-foreground max-w-[280px]">
          The MOOM Shop is on the way 🛍️ You'll be able to redeem Coin for exclusive rewards and merch here.
        </p>
      </div>
    </div>
  );
}
