import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, ShoppingCart, Package, CreditCard, DollarSign, X, RefreshCw, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useOrders, useCreateOrder, useUpdateOrder, useCancelOrder } from '@/hooks/use-orders';
import { useProducts } from '@/hooks/use-products';
import { useMyAccounts } from '@/hooks/use-accounts';
import type { OrderWithDetails } from '@shared/schema';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  processing: 'bg-blue-500/10 text-blue-500',
  completed: 'bg-green-500/10 text-green-500',
  canceled: 'bg-gray-500/10 text-gray-500',
  refunded: 'bg-purple-500/10 text-purple-500',
};

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  paid: 'bg-green-500/10 text-green-500',
  failed: 'bg-red-500/10 text-red-500',
  refunded: 'bg-purple-500/10 text-purple-500',
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function Orders() {
  const { data: accounts } = useMyAccounts();
  const currentAccount = accounts?.[0];
  const accountId = currentAccount?.id || 0;
  const { toast } = useToast();
  
  const { data: orders, isLoading } = useOrders(accountId);
  const { data: products } = useProducts();
  const createOrder = useCreateOrder(accountId);
  const updateOrder = useUpdateOrder(accountId);
  const cancelOrder = useCancelOrder(accountId);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [notes, setNotes] = useState('');

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<OrderWithDetails | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState('');

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const handleCreateOrder = async () => {
    if (!selectedProductId) {
      toast({ title: 'Error', description: 'Please select a product', variant: 'destructive' });
      return;
    }

    try {
      await createOrder.mutateAsync({
        productId: parseInt(selectedProductId),
        paymentMethod: paymentMethod as any || undefined,
        notes: notes || undefined,
      });
      toast({ title: 'Success', description: 'Order created successfully' });
      setCreateDialogOpen(false);
      setSelectedProductId('');
      setPaymentMethod('');
      setNotes('');
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create order', variant: 'destructive' });
    }
  };

  const handleUpdateOrder = async () => {
    if (!editOrder) return;

    try {
      await updateOrder.mutateAsync({
        orderId: editOrder.id,
        status: editStatus as any,
        paymentStatus: editPaymentStatus as any,
      });
      toast({ title: 'Success', description: 'Order updated successfully' });
      setEditDialogOpen(false);
      setEditOrder(null);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update order', variant: 'destructive' });
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;

    try {
      await cancelOrder.mutateAsync({ orderId: cancelOrderId, reason: cancelReason || undefined });
      toast({ title: 'Success', description: 'Order canceled successfully' });
      setCancelDialogOpen(false);
      setCancelOrderId(null);
      setCancelReason('');
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to cancel order', variant: 'destructive' });
    }
  };

  const openEditDialog = (order: OrderWithDetails) => {
    setEditOrder(order);
    setEditStatus(order.status || 'pending');
    setEditPaymentStatus(order.paymentStatus || 'pending');
    setEditDialogOpen(true);
  };

  const openCancelDialog = (orderId: number) => {
    setCancelOrderId(orderId);
    setCancelDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Orders
          </h1>
          <p className="text-muted-foreground">Manage your storage subscription orders</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-order">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
              <DialogDescription>Select a product and payment method to create a new order.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger data-testid="select-product">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} - {formatCurrency(product.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger data-testid="select-payment-method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  data-testid="input-order-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} data-testid="button-cancel-create-dialog">Cancel</Button>
              <Button onClick={handleCreateOrder} disabled={createOrder.isPending} data-testid="button-submit-order">
                {createOrder.isPending ? 'Creating...' : 'Create Order'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {orders && orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No orders yet</h3>
            <p className="text-muted-foreground text-center">Create your first order to get started with cloud storage.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders?.map((order) => (
            <Card key={order.id} data-testid={`card-order-${order.id}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {order.orderNumber}
                  </CardTitle>
                  <CardDescription>
                    {order.createdAt ? format(new Date(order.createdAt), 'PPP pp') : 'N/A'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[order.status || 'pending']}>
                    {order.status || 'pending'}
                  </Badge>
                  <Badge className={paymentStatusColors[order.paymentStatus || 'pending']}>
                    <CreditCard className="h-3 w-3 mr-1" />
                    {order.paymentStatus || 'pending'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Product: <span className="text-foreground font-medium">{order.product?.name || 'Unknown'}</span>
                    </p>
                    {order.notes && (
                      <p className="text-sm text-muted-foreground">Notes: {order.notes}</p>
                    )}
                    {order.paymentMethod && (
                      <p className="text-sm text-muted-foreground capitalize">
                        Payment: {order.paymentMethod.replace('_', ' ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold flex items-center gap-1">
                        <DollarSign className="h-5 w-5" />
                        {formatCurrency(order.totalAmount)}
                      </p>
                      {order.discount && order.discount > 0 && (
                        <p className="text-sm text-green-600">Discount: -{formatCurrency(order.discount)}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {order.status !== 'canceled' && order.status !== 'completed' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(order)}
                            data-testid={`button-edit-order-${order.id}`}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCancelDialog(order.id)}
                            data-testid={`button-cancel-order-${order.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {order.status === 'completed' && (
                        <Badge variant="outline" className="bg-green-50">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order</DialogTitle>
            <DialogDescription>Update the status of order {editOrder?.orderNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Order Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger data-testid="select-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select value={editPaymentStatus} onValueChange={setEditPaymentStatus}>
                <SelectTrigger data-testid="select-edit-payment-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit-dialog">Cancel</Button>
            <Button onClick={handleUpdateOrder} disabled={updateOrder.isPending} data-testid="button-update-order">
              {updateOrder.isPending ? 'Updating...' : 'Update Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>Are you sure you want to cancel this order?</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Reason (optional)</Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Why are you canceling this order?"
              data-testid="input-cancel-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} data-testid="button-keep-order">Keep Order</Button>
            <Button variant="destructive" onClick={handleCancelOrder} disabled={cancelOrder.isPending} data-testid="button-confirm-cancel">
              {cancelOrder.isPending ? 'Canceling...' : 'Cancel Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
