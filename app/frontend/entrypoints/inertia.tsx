import './application.css'
import { createInertiaApp } from '@inertiajs/react'

void createInertiaApp({
  pages: "../pages",

  strictMode: true,

  defaults: {
    form: {
      forceIndicesArrayFormatInFormData: false,
      withAllErrors: true,
    },
    visitOptions: () => {
      return { queryStringArrayFormat: "brackets" }
    },
  },
}).catch((error) => {
  if (document.getElementById("app")) {
    throw error
  } else {
    console.error("Missing root element. Inertia was loaded on a non-Inertia page.")
  }
})

