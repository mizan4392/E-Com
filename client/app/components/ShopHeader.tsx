"use client";
import { Shop } from "../../types/shop";

type Props = { shop?: Shop };

export default function ShopHeader({ shop }: Props) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-zinc-100">
      <div className="h-48 sm:h-72 lg:h-96 w-full">
        <img
          src={
            shop?.imageUrl
              ? shop.imageUrl.startsWith("http")
                ? shop.imageUrl
                : `${process.env.NEXT_PUBLIC_ASSET_API}/${shop.imageUrl}`
              : "/placeholder-shop.jpg"
          }
          alt={shop?.name || "shop banner"}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

      <div className="absolute left-4 bottom-4 right-4 text-white">
        <h1 className="text-2xl font-extrabold sm:text-4xl">{shop?.name}</h1>
      </div>
    </div>
  );
}
