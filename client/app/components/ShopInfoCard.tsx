"use client";
import Link from "next/link";
import { Shop } from "../../types/shop";

type Props = {
  shop?: Shop;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function ShopInfoCard({
  shop,
  isOwner,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {shop?.user ? (
            <img
              src={
                shop.user.imageUrl
                  ? shop.user.imageUrl.startsWith("http")
                    ? shop.user.imageUrl
                    : `${process.env.NEXT_PUBLIC_ASSET_API}/${shop.user.imageUrl}`
                  : "/avatar-placeholder.png"
              }
              alt={`${shop.user.firstName} ${shop.user.lastName}`}
              className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
            />
          ) : null}

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-semibold text-zinc-900">
                {shop?.name}
              </h2>
              {shop?.category ? (
                <span className="inline-block rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                  {shop.category.name}
                </span>
              ) : null}
            </div>

            <p className="mt-1 text-sm text-zinc-600">{shop?.description}</p>
            {shop?.address ? (
              <p className="mt-2 text-sm text-zinc-500">{shop.address}</p>
            ) : null}

            {shop?.user ? (
              <div className="mt-2 text-sm text-zinc-600">
                Owner: {shop.user.firstName} {shop.user.lastName}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwner ? (
            <div className="flex gap-2">
              <Link
                href="/user/user-shop"
                className="cursor-pointer rounded-md bg-white px-3 py-1 text-sm shadow-sm"
              >
                Dashboard
              </Link>
              <button
                onClick={onEdit}
                className=" cursor-pointer rounded-md bg-amber-50 px-3 py-1 text-sm text-amber-700 shadow-sm"
              >
                Edit
              </button>
              <button
                onClick={onDelete}
                className="cursor-pointer rounded-md bg-red-50 px-3 py-1 text-sm text-red-700 shadow-sm"
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
