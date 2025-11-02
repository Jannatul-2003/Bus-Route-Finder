// // "use client"

// // import type React from "react"

// // import { useState } from "react"
// // import { useRouter } from "next/navigation"
// // import Link from "next/link"
// // import { Button } from "@/components/ui/button"
// // import { Input } from "@/components/ui/input"
// // import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
// // import { AlertCircle, Loader2 } from "lucide-react"
// // import { auth } from "@/lib/supabase/auth"

// // export default function LoginPage() {
// //   const router = useRouter()
// //   const [email, setEmail] = useState("")
// //   const [password, setPassword] = useState("")
// //   const [loading, setLoading] = useState(false)
// //   const [error, setError] = useState<string | null>(null)

// //   const handleLogin = async (e: React.FormEvent) => {
// //     e.preventDefault()
// //     setLoading(true)
// //     setError(null)

// //     try {
// //       const { error } = await auth.signIn(email, password)
// //       if (error) {
// //         setError(error.message)
// //       } else {
// //         router.push("/")
// //       }
// //     } catch (err) {
// //       setError("An unexpected error occurred")
// //     } finally {
// //       setLoading(false)
// //     }
// //   }

// //   return (
// //     <div className="container mx-auto px-4 py-16 max-w-md">
// //       <Card>
// //         <CardHeader>
// //           <CardTitle>Contributor Login</CardTitle>
// //           <CardDescription>Sign in to manage bus routes</CardDescription>
// //         </CardHeader>
// //         <CardContent>
// //           <form onSubmit={handleLogin} className="space-y-4">
// //             {error && (
// //               <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
// //                 <AlertCircle className="h-4 w-4" />
// //                 {error}
// //               </div>
// //             )}

// //             <div className="space-y-2">
// //               <label htmlFor="email" className="text-sm font-medium">
// //                 Email
// //               </label>
// //               <Input
// //                 id="email"
// //                 type="email"
// //                 placeholder="you@example.com"
// //                 value={email}
// //                 onChange={(e) => setEmail(e.target.value)}
// //                 required
// //               />
// //             </div>

// //             <div className="space-y-2">
// //               <label htmlFor="password" className="text-sm font-medium">
// //                 Password
// //               </label>
// //               <Input
// //                 id="password"
// //                 type="password"
// //                 placeholder="••••••••"
// //                 value={password}
// //                 onChange={(e) => setPassword(e.target.value)}
// //                 required
// //               />
// //             </div>

// //             <Button type="submit" className="w-full" disabled={loading}>
// //               {loading ? (
// //                 <>
// //                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
// //                   Signing in...
// //                 </>
// //               ) : (
// //                 "Sign In"
// //               )}
// //             </Button>

// //             <p className="text-sm text-center text-muted-foreground">
// //               Don't have an account?{" "}
// //               <Link href="/auth/register" className="text-primary hover:underline">
// //                 Register
// //               </Link>
// //             </p>
// //           </form>
// //         </CardContent>
// //       </Card>
// //     </div>
// //   )
// // }
// "use client"

// import type React from "react"
// import { useState } from "react"
// import { useRouter } from "next/navigation"
// import Link from "next/link"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
// import { AlertCircle, Loader2 } from "lucide-react"
// import { auth } from "@/lib/supabase/auth"
// import { getSupabaseClient } from "@/lib/supabase/client"

// export default function LoginPage() {
//   const router = useRouter()
//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setLoading(true)
//     setError(null)

//     try {
//       const { error: signInError, data: signInData } = await auth.signIn(email, password)
//       if (signInError) {
//         setError(signInError.message)
//         return
//       }

//       const supabase = getSupabaseClient()
//       const {
//         data: { user },
//       } = await supabase.auth.getUser()

//       if (!user) {
//         setError("User not found after login")
//         return
//       }

//       // Check if profile exists
//       const { data: profile, error: profileError } = await supabase
//         .from("user_profiles")
//         .select("*")
//         .eq("id", user.id)
//         .single()

//       if (profileError && profileError.code === "PGRST116") {
//         // profile doesn't exist, create it
//         const { error: insertError } = await supabase.from("user_profiles").insert({
//           user_id: user.id,
//           is_contributor: true, // mark as contributor
//         })
//         if (insertError) {
//           console.error("Error creating user profile:", insertError)
//         }
//       }

//       router.push("/bus-management") // redirect contributors directly to bus management
//     } catch (err) {
//       console.error(err)
//       setError("An unexpected error occurred")
//     } finally {
//       setLoading(false)
//     }
//   }


//   return (
//     <div className="container mx-auto px-4 py-16 max-w-md">
//       <Card>
//         <CardHeader>
//           <CardTitle>Contributor Login</CardTitle>
//           <CardDescription>Sign in to manage bus routes</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleLogin} className="space-y-4">
//             {error && (
//               <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
//                 <AlertCircle className="h-4 w-4" />
//                 {error}
//               </div>
//             )}

//             <div className="space-y-2">
//               <label htmlFor="email" className="text-sm font-medium">
//                 Email
//               </label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder="you@example.com"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//               />
//             </div>

//             <div className="space-y-2">
//               <label htmlFor="password" className="text-sm font-medium">
//                 Password
//               </label>
//               <Input
//                 id="password"
//                 type="password"
//                 placeholder="••••••••"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />
//             </div>

//             <Button type="submit" className="w-full" disabled={loading}>
//               {loading ? (
//                 <>
//                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                   Signing in...
//                 </>
//               ) : (
//                 "Sign In"
//               )}
//             </Button>

//             <p className="text-sm text-center text-muted-foreground">
//               Don't have an account?{" "}
//               <Link href="/auth/register" className="text-primary hover:underline">
//                 Register
//               </Link>
//             </p>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { auth } from "@/lib/supabase/auth";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: signInData, error: signInError } = await auth.signIn( email, password );
      if (signInError) throw signInError;

      const user = signInData.user;
      if (!user) throw new Error("User not returned after login");

      const supabase = getSupabaseClient();

      // Ensure profile exists
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code === "PGRST116") {
await supabase.from("user_profiles").insert({
  id: user.id, // use the user's auth ID
  email: user.email,
  is_contributor: true,
});
      }

      // Wait a tick so AuthProvider updates user state
      await new Promise(resolve => setTimeout(resolve, 300));

      router.push("/bus-management");
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Contributor Login</CardTitle>
          <CardDescription>Sign in to manage bus routes</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/> Signing in...</> : "Sign In"}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Don't have an account? <Link href="/auth/register" className="text-primary hover:underline">Register</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
