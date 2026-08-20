"use client";
import { useState } from "react";
import { useShopDetails, useShopProducts } from "../../../lib/shop/queries";
import ProductGrid from "../../components/ProductGrid";
import { useParams, useRouter } from "next/navigation";
import { useUserStore } from "../../../stores/userStore";
import { useQueryClient } from "@tanstack/react-query";

import ShopHeader from "../../components/ShopHeader";
import ShopInfoCard from "../../components/ShopInfoCard";
import ShopEditModal from "../../components/ShopEditModal";
import { updateShop, deleteShop } from "../../../lib/shop/api";
import Pagination from "../../components/Pagination";

export default function ShopPage() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(1);

  const { data: shop, isLoading } = useShopDetails(id);
  const { data: products, isLoading: productsLoading } = useShopProducts(
    id,
    page,
  );

  const user = useUserStore((s) => s.user);
  const router = useRouter();
  const queryClient = useQueryClient();

  const isOwner = Boolean(
    shop?.user && (user?.id === shop.user.userId || user?.id === shop.user.id),
  );

  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async (payload: {
    name: string;
    description: string;
    address: string;
  }) => {
    // try {
    //   await updateShop(id as string, payload);
    //   queryClient.invalidateQueries(["shopDetails", id]);
    //   setIsEditing(false);
    // } catch (err) {
    //   console.error(err);
    //   alert("Failed to update shop");
    // }
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
          }}
          onClose={() => setIsEditing(false)}
          onSave={handleSave}
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
