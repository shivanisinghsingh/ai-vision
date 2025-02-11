
"use client"
import React from "react"

export default function Header() {
    return(
       <header className="absolute top-0 left-0 w-full p-5">
        <div className="container mx-auto flex items-center">
          {/* Logo on the Left */}
          <img src="/logo.png" alt="AI Vision" className="h-14  w-auto" />
          <h1 className="text-2xl font-bold text-grey-600">AI Vision</h1>
        </div>
      </header>
    )
}

