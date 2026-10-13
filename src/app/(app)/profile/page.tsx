import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Redirect to their own specific profile page
  redirect(`/profile/${session.user.id}`);
}
