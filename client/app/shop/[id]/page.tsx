"use client";
import { useState } from "react";
import { useShopDetails, useShopProducts } from "../../../lib/shop/queries";
import ProductGrid from "../../components/ProductGrid";
import { useParams } from "next/navigation";
import { useUserStore } from "../../../stores/userStore";

import ShopHeader from "../../components/ShopHeader";
import ShopInfoCard from "../../components/ShopInfoCard";
import ShopEditModal from "../../components/ShopEditModal";
import { useUpdateShop } from "../../../lib/shop/mutation";
import { toast } from "sonner";

export default function ShopPage() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(1);

  const { data: shop, isLoading } = useShopDetails(id);
  const { data: products, isLoading: productsLoading } = useShopProducts(
    id,
    page,
  );

  const user = useUserStore((s) => s.user);

  const isOwner = Boolean(
    shop?.user && (user?.id === shop.user.userId || user?.id === shop.user.id),
  );

  const [isEditing, setIsEditing] = useState(false);
  const shopUpdateMutation = useUpdateShop();

  const handleSave = async (payload: {
    name: string;
    description: string;
    address: string;
    file: File;
  }) => {
    shopUpdateMutation.mutate(
      {
        id: shop.id,
        ...payload,
      },
      {
        onSuccess: () => {
          toast.success("Entity updated successfully");
          setIsEditing(false);
        },
        onError: () => {
          toast.error("Failed to update shop");
        },
      },
    );
  };

  const handleDelete = async () => {
    // const ok = window.confirm("Delete this shop? This is irreversible.");
    // if (!ok) return;
    // try {
    //   await deleteShop(id as string);
    //   queryClient.invalidateQueries(["shops"]);
    //   router.push("/");
    // } catch (e) {
    //   console.error(e);
    //   alert("Failed to delete shop");
    // }
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <ShopHeader shop={shop} />

        <section className="mt-4">
          <ShopInfoCard
            shop={shop}
            isOwner={isOwner}
            onEdit={() => setIsEditing(true)}
            onDelete={handleDelete}
          />
        </section>

        <ShopEditModal
          open={isEditing}
          initial={{
            name: shop?.name ?? "",
            description: shop?.description ?? "",
            address: shop?.address ?? "",
            imageUrl: shop?.imageUrl,
          }}
          onClose={() => setIsEditing(false)}
          onSave={handleSave}
          loading={shopUpdateMutation?.isPending}
        />

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Products</h3>
            <div className="text-sm text-zinc-600">
              Page {products?.currentPage ?? page} of{" "}
              {products?.totalPages ?? 1} • {products?.total ?? 0} items
            </div>
          </div>

          <ProductGrid
            products={products}
            loading={productsLoading || isLoading}
            page={page}
            onPageChange={(p) => setPage(p)}
          />
        </section>
      </div>
    </main>
  );
}
