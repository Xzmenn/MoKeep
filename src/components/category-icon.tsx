import React from "react";
import {
  UtensilsCrossed,
  Car,
  ShoppingCart,
  Receipt,
  Film,
  HeartPulse,
  GraduationCap,
  BadgeDollarSign,
  TrendingUp,
  Briefcase,
  ArrowRightLeft,
  Landmark,
  Wallet,
  Smartphone,
  CreditCard,
  PiggyBank,
  ShieldCheck,
  Laptop,
  Tag,
  CircleDollarSign,
  Coffee,
  Plane,
  Home,
  Gift,
  AlertCircle,
  LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Car,
  ShoppingCart,
  Receipt,
  Film,
  HeartPulse,
  GraduationCap,
  BadgeDollarSign,
  TrendingUp,
  Briefcase,
  ArrowRightLeft,
  Landmark,
  Wallet,
  Smartphone,
  CreditCard,
  PiggyBank,
  ShieldCheck,
  Laptop,
  Tag,
  CircleDollarSign,
  Coffee,
  Plane,
  Home,
  Gift,
};

export function CategoryIcon({
  name,
  className = "h-4 w-4",
  style,
}: {
  name?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const IconComponent = (name && ICON_MAP[name]) || Tag;
  return <IconComponent className={className} style={style} />;
}

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);
