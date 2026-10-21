import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export function unauthorizedResponse(message = "Harap masuk terlebih dahulu") {
  return NextResponse.json({ error: message, success: false }, { status: 401 });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message, success: false }, { status });
}

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ data, success: true }, { status });
}
