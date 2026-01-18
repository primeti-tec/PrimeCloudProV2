import { Sidebar } from "@/components/Sidebar";
import { useProducts } from "@/hooks/use-products";
import { useMyAccounts } from "@/hooks/use-accounts";
import { useSubscribe } from "@/hooks/use-subscriptions";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui-custom";
import { Check, Loader2, CreditCard } from "lucide-react";
import { useState } from "react";

export default function Billing() {
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: accounts } = useMyAccounts();
  const { mutateAsync: subscribe, isPending: isSubscribing } = useSubscribe();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const currentAccount = accounts?.[0];
  // Normally we would get current subscription from account details, simplified here
  
  const handleSubscribe = async (productId: number) => {
    if (!currentAccount) return;
    setLoadingId(productId);
    try {
      await subscribe({ accountId: currentAccount.id, productId });
      alert("Plan updated successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to update plan");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 ml-72 p-8">
         <header className="mb-8">
            <h1 className="text-3xl font-display font-bold text-slate-900">Billing & Plans</h1>
            <p className="text-muted-foreground">Manage your subscription and payment methods.</p>
         </header>

         {/* Payment Method Stub */}
         <Card className="mb-10">
            <CardHeader>
               <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <div className="h-10 w-16 bg-slate-100 rounded border border-slate-200 flex items-center justify-center font-bold text-slate-400">VISA</div>
                  <div>
                     <div className="font-semibold text-slate-900">Visa ending in 4242</div>
                     <div className="text-sm text-muted-foreground">Expires 12/28</div>
                  </div>
               </div>
               <Button variant="outline">Update</Button>
            </CardContent>
         </Card>

         <h2 className="text-xl font-bold font-display mb-6">Available Plans</h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {productsLoading ? <Loader2 className="animate-spin" /> : products?.map((product) => (
             <Card key={product.id} className={`relative flex flex-col ${product.price > 0 && product.price < 5000 ? "border-primary shadow-lg ring-1 ring-primary/20" : ""}`}>
               {product.price > 0 && product.price < 5000 && (
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                   Recommended
                 </div>
               )}
               <CardHeader>
                 <CardTitle>{product.name}</CardTitle>
                 <div className="mt-2">
                   <span className="text-3xl font-bold">${product.price / 100}</span>
                   <span className="text-muted-foreground">/month</span>
                 </div>
                 <p className="text-sm text-muted-foreground mt-2">{product.description}</p>
               </CardHeader>
               <CardContent className="flex-1 flex flex-col">
                 <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      {product.storageLimit} GB Storage
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      {product.transferLimit || "Unlimited"} Transfer
                    </li>
                 </ul>
                 <Button 
                   className="w-full" 
                   variant={product.price > 0 && product.price < 5000 ? "primary" : "outline"}
                   disabled={isSubscribing || loadingId !== null}
                   onClick={() => handleSubscribe(product.id)}
                 >
                   {loadingId === product.id ? <Loader2 className="animate-spin" /> : "Select Plan"}
                 </Button>
               </CardContent>
             </Card>
           ))}
         </div>
      </main>
    </div>
  );
}
