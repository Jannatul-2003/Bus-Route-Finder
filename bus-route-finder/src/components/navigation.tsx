// // "use client"

// // import { useState } from "react"
// // import Link from "next/link"
// // import { usePathname } from "next/navigation"
// // import { Button } from "@/components/ui/button"
// // import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
// // import { Menu, MapPin, MessageSquare, Settings, Bus } from "lucide-react"
// // import { cn } from "@/lib/utils"
// // import { useAuth } from "@/hooks/useAuth"

// // const navItems = [
// //   {
// //     href: "/",
// //     label: "Route Planner",
// //     icon: MapPin,
// //   },
// //   {
// //     href: "/buses",
// //     label: "Bus Management",
// //     icon: Bus,
// //   },
// //   {
// //     href: "/reviews",
// //     label: "Bus Reviews",
// //     icon: MessageSquare,
// //   },
// //   {
// //     href: "/settings",
// //     label: "Settings",
// //     icon: Settings,
// //   },
// // ]

// // export function Navigation() {
// //   const [isOpen, setIsOpen] = useState(false)
// //   const pathname = usePathname()
// //   const { user } = useAuth()

// //   const filteredNavItems = navItems.filter((item) => {
// //     if (item.href === "/buses") {
// //       return true // Always show buses
// //     }
// //     return true
// //   })

// //   return (
// //     <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
// //       <div className="container flex h-16 items-center justify-between px-4">
// //         {/* Logo */}
// //         <Link href="/" className="flex items-center space-x-2">
// //           <Bus className="h-6 w-6 text-primary" />
// //           <span className="font-bold text-lg">BusRoute</span>
// //         </Link>

// //         {/* Desktop Navigation */}
// //         <nav className="hidden md:flex items-center space-x-6">
// //           {filteredNavItems.map((item) => {
// //             const Icon = item.icon
// //             const isActive = pathname === item.href
// //             return (
// //               <Link
// //                 key={item.href}
// //                 href={item.href}
// //                 className={cn(
// //                   "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
// //                   isActive ? "text-primary" : "text-muted-foreground",
// //                 )}
// //               >
// //                 <Icon className="h-4 w-4" />
// //                 <span>{item.label}</span>
// //               </Link>
// //             )
// //           })}
// //         </nav>

// //         {/* Mobile Navigation */}
// //         <Sheet open={isOpen} onOpenChange={setIsOpen}>
// //           <SheetTrigger asChild className="md:hidden">
// //             <Button variant="ghost" size="icon">
// //               <Menu className="h-5 w-5" />
// //               <span className="sr-only">Toggle menu</span>
// //             </Button>
// //           </SheetTrigger>
// //           <SheetContent side="right" className="w-[300px] sm:w-[400px]">
// //             <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
// //             <div className="flex flex-col space-y-4 mt-8">
// //               {filteredNavItems.map((item) => {
// //                 const Icon = item.icon
// //                 const isActive = pathname === item.href
// //                 return (
// //                   <Link
// //                     key={item.href}
// //                     href={item.href}
// //                     onClick={() => setIsOpen(false)}
// //                     className={cn(
// //                       "flex items-center space-x-3 text-lg font-medium transition-colors hover:text-primary p-2 rounded-md",
// //                       isActive ? "text-primary bg-muted" : "text-foreground",
// //                     )}
// //                   >
// //                     <Icon className="h-5 w-5" />
// //                     <span>{item.label}</span>
// //                   </Link>
// //                 )
// //               })}
// //             </div>
// //           </SheetContent>
// //         </Sheet>
// //       </div>
// //     </header>
// //   )
// // }
// "use client"

// import { useState, useEffect } from "react"
// import Link from "next/link"
// import { usePathname } from "next/navigation"
// import { Button } from "@/components/ui/button"
// import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
// import { Menu, MapPin, MessageSquare, Settings, Bus } from "lucide-react"
// import { cn } from "@/lib/utils"
// import { useAuth } from "@/hooks/useAuth"
// import { getSupabaseClient } from "@/lib/supabase/client"

// const navItems = [
//   { href: "/", label: "Route Planner", icon: MapPin },
//   { href: "/buses", label: "Buses", icon: Bus },
//   { href: "/reviews", label: "Bus Reviews", icon: MessageSquare },
//   { href: "/bus-management", label: "Bus Management", icon: Bus }, // 👈 added route
//   { href: "/settings", label: "Settings", icon: Settings },
// ]

// export function Navigation() {
//   const [isOpen, setIsOpen] = useState(false)
//   const pathname = usePathname()
//   const { user } = useAuth()
//   const [isContributor, setIsContributor] = useState(false)

//   useEffect(() => {
//     const fetchProfile = async () => {
//       if (!user) return
//       const supabase = getSupabaseClient()
//       const { data } = await supabase.from("user_profiles").select("is_contributor").eq("id", user.id).single()
//       setIsContributor(!!data?.is_contributor)
//     }

//     fetchProfile()
//   }, [user])

//   // 🔍 filter items based on role
//   const filteredNavItems = navItems.filter((item) => {
//     if (item.href === "/bus-management" && !isContributor) return false
//     return true
//   })

//   return (
//     <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
//       <div className="container flex h-16 items-center justify-between px-4">
//         {/* Logo */}
//         <Link href="/" className="flex items-center space-x-2">
//           <Bus className="h-6 w-6 text-primary" />
//           <span className="font-bold text-lg">BusRoute</span>
//         </Link>

//         {/* Desktop Navigation */}
//         <nav className="hidden md:flex items-center space-x-6">
//           {filteredNavItems.map((item) => {
//             const Icon = item.icon
//             const isActive = pathname === item.href
//             return (
//               <Link
//                 key={item.href}
//                 href={item.href}
//                 className={cn(
//                   "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
//                   isActive ? "text-primary" : "text-muted-foreground",
//                 )}
//               >
//                 <Icon className="h-4 w-4" />
//                 <span>{item.label}</span>
//               </Link>
//             )
//           })}
//         </nav>

//         {/* Mobile Navigation */}
//         <Sheet open={isOpen} onOpenChange={setIsOpen}>
//           <SheetTrigger asChild className="md:hidden">
//             <Button variant="ghost" size="icon">
//               <Menu className="h-5 w-5" />
//               <span className="sr-only">Toggle menu</span>
//             </Button>
//           </SheetTrigger>
//           <SheetContent side="right" className="w-[300px] sm:w-[400px]">
//             <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
//             <div className="flex flex-col space-y-4 mt-8">
//               {filteredNavItems.map((item) => {
//                 const Icon = item.icon
//                 const isActive = pathname === item.href
//                 return (
//                   <Link
//                     key={item.href}
//                     href={item.href}
//                     onClick={() => setIsOpen(false)}
//                     className={cn(
//                       "flex items-center space-x-3 text-lg font-medium transition-colors hover:text-primary p-2 rounded-md",
//                       isActive ? "text-primary bg-muted" : "text-foreground",
//                     )}
//                   >
//                     <Icon className="h-5 w-5" />
//                     <span>{item.label}</span>
//                   </Link>
//                 )
//               })}
//             </div>
//           </SheetContent>
//         </Sheet>
//       </div>
//     </header>
//   )
// }
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, MessageSquare, Settings, Bus, Menu, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/", label: "Route Planner", icon: MapPin },
  { href: "/buses", label: "Buses", icon: Bus },
  { href: "/reviews", label: "Bus Reviews", icon: MessageSquare },
  { href: "/community", label: "Community", icon: Users },
  { href: "/bus-management", label: "Bus Management", icon: Bus },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const filteredNavItems = loading
    ? []
    : navItems.filter((item) => {
        if (item.href === "/bus-management" && !user?.is_contributor) return false;
        return true;
      });

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <Bus className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">BusRoute</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex flex-col space-y-4 mt-8">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 text-lg font-medium transition-colors hover:text-primary p-2 rounded-md",
                      isActive ? "text-primary bg-muted" : "text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
