import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { completePendingSignup, getUserClubs } from "@boutforge/api";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState<
    "/(auth)/login" | "/(tabs)" | "/(auth)/onboarding"
  >("/(auth)/login");

  useEffect(() => {
    async function resolve() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setDestination("/(auth)/login");
        setLoading(false);
        return;
      }

      await completePendingSignup(supabase);
      const clubs = await getUserClubs(supabase, session.user.id);
      setDestination(clubs.length > 0 ? "/(tabs)" : "/(auth)/onboarding");
      setLoading(false);
    }

    resolve();
  }, []);

  if (loading) return null;
  return <Redirect href={destination} />;
}
