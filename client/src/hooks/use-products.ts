import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

export function useProducts() {
  return useQuery({
    queryKey: [api.products.list.path],
    queryFn: async () => {
      const res = await fetch(api.products.list.path);
      if (!res.ok) throw new Error("Failed to fetch products");
      return api.products.list.responses[200].parse(await res.json());
    },
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: [api.admin.listProducts.path],
    queryFn: async () => {
      const res = await fetch(api.admin.listProducts.path, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json() as Promise<Product[]>;
    },
  });
}

export function useCreateProduct() {
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; price: number; storageLimit: number; transferLimit?: number; isPublic?: boolean; features?: any[] }) => {
      const res = await apiRequest(api.admin.createProduct.method, api.admin.createProduct.path, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.listProducts.path] });
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
  });
}

export function useUpdateProduct() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Product> }) => {
      const url = api.admin.updateProduct.path.replace(':id', String(id));
      const res = await apiRequest(api.admin.updateProduct.method, url, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.listProducts.path] });
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
  });
}

export function useDeleteProduct() {
  return useMutation({
    mutationFn: async (id: number) => {
      const url = api.admin.deleteProduct.path.replace(':id', String(id));
      const res = await apiRequest(api.admin.deleteProduct.method, url);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.listProducts.path] });
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
  });
}
